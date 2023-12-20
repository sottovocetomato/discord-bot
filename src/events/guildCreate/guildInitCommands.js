const regCommandsHandler = require("../../handlers/regCommandsHandler");

module.exports = async (client, guild) => {
  await regCommandsHandler(client, guild);
};
