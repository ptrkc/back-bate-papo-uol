import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];
const messages = [];

app.listen(4000, () => {
    console.log("Running on port 4000");
});
