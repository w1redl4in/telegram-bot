import express from "express";
import { main } from "./index.js";
const app = express();
const port = 3000;

app.listen(port, () => {
  console.log("subindo app");
  main();
});
