import express from "express";
import cors from "cors";
import fs from "fs";
import dayjs from "dayjs";
import {
    trimAndClean,
    checkUserError,
    checkNameError,
    checkNewMsgError,
} from "../src/functions/validation.js";

const chatData = fs.existsSync("./data/chatData.json")
    ? JSON.parse(fs.readFileSync("./data/chatData.json"))
    : { participants: [], messages: [] };

const app = express();
app.use(cors());
app.use(express.json());

let participants = chatData.participants;
let messages = chatData.messages;

scheduleParticipantsRemoval();

app.post("/participants", (req, res) => {
    if (checkNameError(req.body)) {
        res.sendStatus(400);
    } else {
        const cleanName = trimAndClean(req.body.name);
        if (participants.find((p) => p.name === cleanName)) {
            res.status(409).send("Esse nome já está sendo utilizado.");
        } else {
            addParticipant(cleanName);
        }
        res.sendStatus(200);
        saveData();
    }
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

app.post("/messages", (req, res) => {
    if (checkNewMsgError(req.body) || checkUserError(req.headers)) {
        res.sendStatus(400);
    } else {
        const cleanUser = trimAndClean(req.headers.user);
        const participant = participants.find((p) => p.name === cleanUser);
        if (participant) {
            addMessage(req);
            res.sendStatus(200);
            saveData();
        } else {
            res.sendStatus(400);
        }
    }
});

app.get("/messages", (req, res) => {
    if (checkUserError(req.headers)) {
        res.sendStatus(400);
    } else {
        const cleanUser = trimAndClean(req.headers.user);
        const limit = req.query.limit && parseInt(req.query.limit);
        if (participants.find((p) => p.name === cleanUser)) {
            const filteredMessages = messages.filter(
                (m) =>
                    m.type === "message" ||
                    m.to === "Todos" ||
                    m.to === cleanUser ||
                    m.from === cleanUser
            );
            if (typeof limit === "number") {
                filteredMessages.splice(0, filteredMessages.length - limit);
            }
            res.send(filteredMessages);
            saveData();
        } else {
            res.sendStatus(400);
        }
    }
});

app.post("/status", (req, res) => {
    if (checkUserError(req.headers)) {
        res.sendStatus(400);
    } else {
        const cleanUser = trimAndClean(req.headers.user);
        const participant = participants.find((p) => p.name === cleanUser);
        if (participant) {
            participant.lastStatus = Date.now();
            res.sendStatus(200);
            saveData();
        } else {
            res.sendStatus(400);
        }
    }
});

app.listen(4000, () => {
    console.log("Running on port 4000");
});

function scheduleParticipantsRemoval() {
    setInterval(() => {
        let saveTrigger = false;
        participants = participants.filter((p) => {
            if (Date.now() - p.lastStatus > 10000) {
                statusUserGotOut(p.name);
                saveTrigger = true;
                return false;
            } else {
                return true;
            }
        });
        if (saveTrigger) {
            saveData();
        }
    }, 15000);
}

function saveData() {
    fs.writeFileSync(
        "./data/chatData.json",
        JSON.stringify({ participants, messages })
    );
}

function addParticipant(username) {
    participants.push({
        name: username,
        lastStatus: Date.now(),
    });
    messages.push({
        from: username,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
    });
}

function statusUserGotOut(username) {
    messages.push({
        from: username,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
    });
}

function addMessage(req) {
    messages.push({
        to: trimAndClean(req.body.to),
        text: trimAndClean(req.body.text),
        type: trimAndClean(req.body.type),
        from: trimAndClean(req.headers.user),
        time: dayjs().format("HH:mm:ss"),
    });
}
