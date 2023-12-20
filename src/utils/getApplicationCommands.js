const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = async (client, guildId) => {
  let applicationCommands;
  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    console.log(guild, "fetchedGuilds");
    applicationCommands = guild.commands;
  } else {
    applicationCommands = await client.application.commands;
  }

  await applicationCommands.fetch();
  return applicationCommands;
};
