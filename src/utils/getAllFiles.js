const fs = require("fs");
const path = require("path");

function registerFiles(directory, foldersOnly = false, fileNames = []) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  for (const file of files) {
    // console.log(directory, "directory");
    const filePath = path.join(directory, file.name);
    if (foldersOnly) {
      if (!file.isDirectory()) continue;
      fileNames.push(filePath);
      registerFiles(filePath, foldersOnly, fileNames);
      continue;
    }
    if (file.isDirectory()) {
      registerFiles(filePath, foldersOnly, fileNames);
    } else {
      fileNames.push(filePath);
    }
  }
  // console.log(files);
}

module.exports = (directory, foldersOnly = false) => {
  let fileNames = [];
  registerFiles(directory, foldersOnly, fileNames);
  // console.log(fileNames);
  return fileNames;
};
