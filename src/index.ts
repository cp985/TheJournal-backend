import express from "express";
import {type Request,type  Response} from  'express'

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get("/", (req : Request, res : Response) => {
    res.send("Hello World from the journal!");
});

app.listen(8080, () => {
    console.log("Server started on port 3000");
});