const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (exceptions = []) => {
  const localCommands = [];
  const commandCategories = getAllFiles(
    path.join(__dirname, "..", "commands"),
    true
  );
  // console.log(eventFolders, "eventFolders");
  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);
    for (const commandFile of commandFiles) {
      const commandObject = require(commandFile);
      if (exceptions.includes(commandObject.name)) continue;
      localCommands.push(commandObject);
    }
  }
  return localCommands;
};