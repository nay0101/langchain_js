import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { splitDocuments } from "./splitDocuments.js";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { UnstructuredDirectoryLoader } from "@langchain/community/document_loaders/fs/unstructured";

async function useDirectoryLoader({ directory, chunkSize, chunkOverlap }) {
  /* Load all PDFs within the specified directory */
  const directoryLoader = new DirectoryLoader(directory, {
    ".pdf": (path) => new PDFLoader(path),
    ".txt": (path) => new TextLoader(path),
    ".docx": (path) => new DocxLoader(path),
    ".pptx": (path) => new PPTXLoader(path),
    ".csv": (path) => new CSVLoader(path),
  });

  const docs = await directoryLoader.load();
  const { documents } = await splitDocuments(docs, chunkSize, chunkOverlap);

  return documents;
}

async function useUnstructuredLoader({ directory, chunkSize, chunkOverlap }) {
  /* Load all PDFs within the specified directory */
  const directoryLoader = new UnstructuredDirectoryLoader(directory, {
    apiKey: "0kSnYYEHWgYYMO4Ah5RUCwpicRKJ2I",
  });

  const docs = await directoryLoader.load();

  const { documents } = await splitDocuments(docs, chunkSize, chunkOverlap);

  return documents;
}

export { useDirectoryLoader, useUnstructuredLoader };
