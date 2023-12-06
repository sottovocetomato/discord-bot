const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = {
  name: "ql_check_settings",
  description: "Проверить настройки игры",
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: async (client, interaction) => {
    await actions.checkGameOptions(client, interaction);
  },
};
