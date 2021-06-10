import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [{ name: "ptrk", lastStatus: 12313123 }];
const messages = [];

app.post("/participants", (req, res) => {
    let newName = "";
    if (req.body.name === undefined || !req.body.name.trim()) {
        res.status(400).send("'Nome' não pode estar vazio.");
        return;
    } else {
        newName = req.body.name.trim();
    }
    if (participants.find((p) => p.name === newName)) {
        res.status(409).send("Esse nome já está sendo utilizado.");
    } else {
        participants.push({ name: newName, lastStatus: Date.now() });
        res.send("OK");
    }
});

app.listen(4000, () => {
    console.log("Running on port 4000");
});
