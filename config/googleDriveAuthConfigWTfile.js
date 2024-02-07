import { google } from "googleapis";

const CLIENT_ID =
  "28144558180-6jgcnc4jgipl6nbnjcu3hmlgeeb9ra7o.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URL = "http://localhost";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: "offline",

  // If you only need one scope you can pass it as a string
  scope: SCOPES,
  prompt: "consent",
});

console.log(url);

// This will provide an object with the access_token and refresh_token.
// Save these somewhere safe so they can be used at a later time.
const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);

oauth2Client.on("tokens", (tokens) => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

oauth2Client.setCredentials({
  refresh_token: `STORED_REFRESH_TOKEN`,
});
