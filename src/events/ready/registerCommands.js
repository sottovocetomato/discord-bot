const regCommandsHandler = require("../../handlers/regCommandsHandler");

module.exports = async (client) => {
  const currGuilds = client?.guilds?.cache.map((guild) => guild.id);
  // console.log(currGuilds, "currGuilds");
  for (const guild of currGuilds) {
    await regCommandsHandler(client, guild);
  }
};
