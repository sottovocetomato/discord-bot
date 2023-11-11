const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client) => {
  const eventFolders = getAllFiles(
    path.join(__dirname, "..", "commands"),
    true
  );
  console.log(eventFolders, "eventFolders");
  for (const eventFolder of eventFolders) {
    const eventName = eventFolder.split("\\").pop();
    const eventFiles = getAllFiles(eventFolder);
    console.log(eventFiles, "eventFiles");
    console.log(eventName, "eventName");
    client.on(eventName, async (arg) => {
      for (const eventFile in eventFiles) {
        const eventFn = require(eventFile);
        await eventFn(client, arg);
      }
    });
  }
};
