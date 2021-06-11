import express from "express";
import cors from "cors";
import fs from "fs";
import Joi from "joi";
import dayjs from "dayjs";

const chatData = fs.existsSync("./data/chatData.json")
    ? JSON.parse(fs.readFileSync("./data/chatData.json"))
    : { participants: [], messages: [] };

const app = express();
app.use(cors());
app.use(express.json());

let participants = chatData.participants;
let messages = chatData.messages;

scheduleParticipantsUpdate();

app.post("/participants", (req, res) => {
    const schema = Joi.object({
        name: Joi.string().replace(/<|>/g, "").required().trim(),
    });
    const error = schema.validate(req.body).error;
    if (error) {
        res.sendStatus(400);
    } else {
        const cleanName = trimAndClean(req.body.name);
        if (participants.find((p) => p.name === cleanName)) {
            res.status(409).send("Esse nome já está sendo utilizado.");
        } else {
            participants.push({
                name: cleanName,
                lastStatus: Date.now(),
            });
            messages.push({
                from: cleanName,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: dayjs().format("HH:mm:ss"),
            });
        }
        res.sendStatus(200);
        saveData();
    }
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

app.post("/messages", (req, res) => {
    const msgSchema = Joi.object({
        to: Joi.string().replace(/<|>/g, "").required().trim(),
        text: Joi.string().replace(/<|>/g, "").required().trim(),
        type: Joi.string()
            .pattern(new RegExp(/(^message$|^private_message$)/))
            .required(),
    });
    const msgError = msgSchema.validate(req.body).error;
    const headerSchema = Joi.object({
        user: Joi.string().replace(/<|>/g, "").required().trim(),
    }).unknown(true);
    const headerError = headerSchema.validate(req.headers).error;
    if (msgError || headerError) {
        res.sendStatus(400);
    } else {
        const cleanUser = trimAndClean(req.headers.user);
        const participant = participants.find((p) => p.name === cleanUser);
        if (participant) {
            messages.push({
                to: trimAndClean(req.body.to),
                text: trimAndClean(req.body.text),
                type: trimAndClean(req.body.type),
                from: trimAndClean(req.headers.user),
                time: dayjs().format("HH:mm:ss"),
            });
            res.sendStatus(200);
            saveData();
        } else {
            res.sendStatus(400);
        }
    }
});

app.get("/messages", (req, res) => {
    const schema = Joi.object({
        user: Joi.string().replace(/<|>/g, "").required().trim(),
    }).unknown(true);
    const error = schema.validate(req.headers).error;
    if (error) {
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
    const schema = Joi.object({
        user: Joi.string().replace(/<|>/g, "").required().trim(),
    }).unknown(true);
    const error = schema.validate(req.headers).error;
    if (error) {
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

function trimAndClean(string) {
    return string.replace(/<|>/g, "").trim();
}

function scheduleParticipantsUpdate() {
    setInterval(() => {
        let saveTrigger = false;
        participants = participants.filter((p) => {
            if (Date.now() - p.lastStatus > 10000) {
                messages.push({
                    from: p.name,
                    to: "Todos",
                    text: "sai da sala...",
                    type: "status",
                    time: dayjs().format("HH:mm:ss"),
                });
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
