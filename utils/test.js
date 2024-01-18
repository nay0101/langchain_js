import { appendFile, writeFile } from "node:fs";

writeFile("./log.html", "", (err) => console.log(err));
