import express from "express";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { config } from "dotenv";
import { default as axios } from "axios";
import { Client } from "@notionhq/client";
import { useNotionLoader } from "./utils/notionLoader.js";

config();
const app = express();
const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");
/* 
  Routes
*/
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/auth/notion/callback", async (req, res) => {
  if (req.query.error) return res.sendStatus(401);
  const { code } = req.query;
  const clientId = "18bb82a4-1f29-4a10-a396-bb249bb74830";
  const clientSecret = "secret_fGjJxV3NjfWg4ILKziXX0sispWD0gYuJTrKPzbPRpaD";
  const redirectUri = "http://localhost:3000/auth/notion/callback";
  // encode in base 64
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await axios.post(
    "https://api.notion.com/v1/oauth/token",
    {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${encoded}`,
      },
    }
  );
  const { access_token } = await response.data;
  const notion = new Client({ auth: access_token });
  const { results } = await notion.search();
  const documents = await useNotionLoader(access_token, results);
  res.status(200).send({ documents });
});

app.get("/api", (req, res) => res.send("Hello World"));

/*
  Static Files
*/
app.use("/api/public", express.static(path.join(process.cwd(), "public")));

httpServer.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

export default app;
