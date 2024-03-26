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
app.get("/", async (req, res) => {
  let documents = [];
  if (req.query.code) {
    const { code } = req.query;
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectURL = process.env.NOTION_REDIRECT_URL;
    // encode in base 64
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectURL,
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
    documents = await useNotionLoader(access_token, results);
  }
  res.render("index", {
    documents,
  });
});

app.get("/auth/notion/callback", async (req, res) => {
  if (req.query.error) return res.sendStatus(401);
  const { code } = req.query;
  res.redirect("/?code=" + code);
});

/*
  Static Files
*/
app.use("/api/public", express.static(path.join(process.cwd(), "public")));

httpServer.listen(port, () =>
  console.log(`Server is listening on port ${port}`)
);

export default app;
