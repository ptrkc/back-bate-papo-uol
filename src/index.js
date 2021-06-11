import express from "express";
import cors from "cors";
import fs from "fs";
import Joi from "joi";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

let participants = [
    { name: "Vader", lastStatus: 12313123 },
    { name: "Yoda", lastStatus: 12313123 },
];
const messages = [
    {
        from: "Vader",
        to: "Luke",
        text: "Eu sou seu pai!",
        type: "message",
        time: "20:04:37",
    },
    {
        from: "Luke",
        to: "Todos",
        text: "Num pod c",
        type: "message",
        time: "20:05:10",
    },
    {
        from: "Obi Wan",
        to: "Luke",
        text: "Hello there!",
        type: "private_message",
        time: "20:06:14",
    },
    {
        from: "Yoda",
        to: "Todos",
        text: "chocado, eu estou",
        type: "message",
        time: "20:07:23",
    },
];

scheduleParticipantsUpdate();

app.post("/participants", (req, res) => {
    const schema = Joi.object({
        name: Joi.string()
            .replace(/(<(.*?)>|>)/gi, "")
            .required()
            .trim(),
    });
    const { error } = schema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        const errorMsgs = error.details.map((e) => e.message);
        res.status(400).send(errorMsgs);
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
        res.send();
    }
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

//app.post("/messages", (req, res) => {
//
// });

app.get("/messages", (req, res) => {
    const schema = Joi.object({
        user: Joi.string()
            .replace(/(<(.*?)>|>)/gi, "")
            .required()
            .trim(),
    }).unknown(true);
    const { error } = schema.validate(req.headers, {
        abortEarly: false,
    });
    if (error) {
        const errorMsgs = error.details.map((e) => e.message);
        res.status(400).send(errorMsgs);
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
        } else {
            res.status(400).send("Usuário não logado.");
        }
    }
});

// app.post("/status", (req, res) => {
//
// });

app.listen(4000, () => {
    console.log("Running on port 4000");
});

function trimAndClean(string) {
    return string.replace(/(<(.*?)>|>)/gi, "").trim();
}

function scheduleParticipantsUpdate() {
    setTimeout(() => {
        participants = participants.filter((p) => {
            if (Date.now() - p.lastStatus > 10000) {
                messages.push({
                    from: p.name,
                    to: "Todos",
                    text: "sai da sala...",
                    type: "status",
                    time: dayjs().format("HH:mm:ss"),
                });
                return false;
            } else {
                return true;
            }
        });
    }, 15000);
}
