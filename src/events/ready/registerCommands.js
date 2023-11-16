const { testServer } = require("../../../config.json");
const getLocalCommands = require("../../utils/getLocalCommands");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const areCommandsDifferent = require("../../utils/areCommandsDifferent");

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();
    const applicationCommands = await getApplicationCommands(
      client,
      testServer
    );
    for (const localCommand of localCommands) {
      const { name, description, options = [] } = localCommand;
      console.log(options, description, "localcom");
      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );
      if (!existingCommand) {
        if (localCommand?.deleted) {
          console.log(`Skipping command ${name} as it's set to delete`);
        } else {
          await applicationCommands.create({ name, description, options });
          console.log(`Creating command ${name} `);
        }
        continue;
      }
      if (localCommand?.deleted) {
        await applicationCommands.delete(existingCommand.id);
        console.log(`Deleted command ${name}`);
      }

      if (areCommandsDifferent(existingCommand, localCommand)) {
        await applicationCommands.edit(existingCommand.id, {
          description,
          options,
        });
        console.log(`Edited command ${name}`);
      }
    }
    console.log(`\uD83D\uDE00 Registered commands!`);
  } catch (e) {
    console.error(`There was an error: ${e}`);
  }
};
