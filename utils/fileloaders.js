import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { splitDocuments } from "./splitDocuments.js";

async function useDirectoryLoader(directory) {
  /* Load all PDFs within the specified directory */
  const directoryLoader = new DirectoryLoader(directory, {
    ".pdf": (path) => new PDFLoader(path),
  });

  const docs = await directoryLoader.load();

  const { documents } = await splitDocuments(docs);

  return documents;
}

export { useDirectoryLoader };
