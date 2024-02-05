import { createWriteStream } from "node:fs";
import { google } from "googleapis";
import { authorize } from "../config/googleDriveAuthConfig.js";
import path from "node:path";

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function getFile(authClient) {
  const writeStream = createWriteStream(
    path.join(process.cwd(), "/assets/Google Drive Files/test.pdf")
  );
  const drive = google.drive({ version: "v3", auth: authClient });
  const { data } = await drive.files.export(
    {
      fileId: "1HU9u9yJUwq0fSDSi9TRrYH2OSqJt28OPQe8ej29MdxA",
      mimeType: "application/pdf",
    },
    { responseType: "stream" }
  );
  data.pipe(writeStream);
}

authorize().then(getFile).catch(console.error);
