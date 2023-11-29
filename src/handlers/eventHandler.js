const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);
  // console.log(eventFolders, "eventFolders");
  for (const eventFolder of eventFolders) {
    const eventName = eventFolder.split("\\").pop();
    const eventFiles = getAllFiles(eventFolder);
    client.on(eventName, async (...args) => {
      for (const eventFile of eventFiles) {
        const eventFn = require(eventFile);
        await eventFn(client, ...args);
      }
    });
  }
};
