import express from "express";
import router from "./routers/mainRouters.js"


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(router);

app.listen(8080, () => {
    console.log("Server started on port 3000");
});