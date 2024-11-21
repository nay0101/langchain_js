import { useDirectoryLoader } from "./utils/fileloaders.js";

const result = await useDirectoryLoader({ directory: "./assets/AWS Test/" });
console.log(result);
