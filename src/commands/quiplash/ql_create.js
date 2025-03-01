const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = {
  name: "ql_create",
  description: "Запустить Quiplash",
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: async (client, interaction) => {
    await actions.createGame(client, interaction);
  },
};
