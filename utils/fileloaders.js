import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "@langchain/core/documents";
import * as XLSX from "xlsx";
import { splitDocuments } from "./splitDocuments.js";
import path from "path";

async function useDirectoryLoader({ directory, chunkSize, chunkOverlap }) {
  /* Load all PDFs within the specified directory */
  const folderPath = path.resolve(directory);
  const directoryLoader = new DirectoryLoader(folderPath, {
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

async function useExcelLoader({ file_path, chunkSize, chunkOverlap }) {
  const filePath = path.resolve(file_path);
  const workbook = XLSX.read(filePath, {
    type: "file",
  });
  const sheetNames = workbook.SheetNames;
  const docs = [];
  sheetNames.forEach((sheetName) => {
    const workSheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(workSheet);
    sheetData.forEach((data, index) => {
      const tempDoc = new Document({
        pageContent: JSON.stringify(data),
        metadata: { source: filePath, sheet: sheetName, row: index + 2 },
      });
      docs.push(tempDoc);
    });
  });
  const { documents } = await splitDocuments(docs, chunkSize, chunkOverlap);
  return documents;
}

export { useDirectoryLoader, useExcelLoader };
