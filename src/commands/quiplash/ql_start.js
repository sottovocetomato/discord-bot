const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = {
  name: "ql_start",
  description: "Начать игру",
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: (client, interaction) => {
    // console.log(interaction, "interaction");
    actions.handleGame(client, interaction);
  },
};
