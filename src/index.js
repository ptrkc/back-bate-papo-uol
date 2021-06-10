import express from "express";
import cors from "cors";
import fs from "fs";
import Joi from "joi";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [
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
        from: "Luke",
        to: "Todos",
        text: "Num pod c",
        type: "message",
        time: "20:07:23",
    },
];

app.post("/participants", (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required().trim(),
    });
    const { error, validated } = schema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        const errorMsgs = error.details.map((e) => e.message);
        res.status(400).send(errorMsgs);
    } else {
        console.log(validated);
        if (participants.find((p) => p.name === req.body.name.trim())) {
            res.status(409).send("Esse nome já está sendo utilizado.");
        } else {
            participants.push({
                name: req.body.name.trim(),
                lastStatus: Date.now(),
            });
            res.send("OK");
        }
    }
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

// app.post("/messages", (req, res) => {
//
// });

// app.get("/messages", (req, res) => {
//
// });

// app.post("/status", (req, res) => {
//
// });

app.listen(4000, () => {
    console.log("Running on port 4000");
});
