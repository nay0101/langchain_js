import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import * as fs from "node:fs";
import path from "node:path";
import { useDirectoryLoader } from "./fileloaders.js";

config();

async function useS3Loader(folders = []) {
  const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
  const S3_ACCESS_KEY_SECRET = process.env.S3_ACCESS_KEY_SECRET;
  const BUCKET = "langchainbucket01";
  const FOLDERS = folders; // same names as in S3 folders
  const BASE_DIRECTORY = "/assets/AWS Test"; // Just directory for local testing

  // const docs = [];

  const client = new S3Client({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_ACCESS_KEY_SECRET,
    },
  });

  const listFiles = FOLDERS.map(
    (folder) =>
      new ListObjectsCommand({
        Bucket: BUCKET,
        Prefix: `${folder}\/`,
      })
  );

  try {
    let files = [];
    for (let i = 0; i < listFiles.length; i++) {
      const filesData = await client.send(listFiles[i]);
      files.push(filesData.Contents);
    }
    files = files.flat();
    for (let i = 0; i < files.length; i++) {
      const key = files[i].Key;
      if (!key.split("/")[1]) {
        continue;
      }
      const downloadFile = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });

      const directory = key.split("/")[0];
      const fileName = key.split("/")[1];
      if (
        !fs.existsSync(
          path.join(process.cwd(), `${BASE_DIRECTORY}/${directory}`)
        )
      ) {
        fs.mkdirSync(
          path.join(process.cwd(), `${BASE_DIRECTORY}/${directory}`)
        );
      }
      const writeStream = fs.createWriteStream(
        path.join(process.cwd(), `${BASE_DIRECTORY}/${directory}/${fileName}`)
      );

      try {
        const { Body } = await client.send(downloadFile);
        Body.pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  } catch (error) {
    console.error(error);
    return false;
  }

  const promises = FOLDERS.map(
    async (folder) =>
      await useDirectoryLoader({
        directory: path.join(process.cwd(), `${BASE_DIRECTORY}/${folder}/`),
      })
  );

  const documents = await Promise.all(promises);
  return documents;
}

export { useS3Loader };
