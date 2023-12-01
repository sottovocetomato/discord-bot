const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = {
  name: "ql_end",
  description: "Закончить игру",
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: (client, interaction) => {
    // console.log(interaction, "interaction");
    try {
      actions.endGame(true, client, interaction);
    } catch (e) {
      console.error(e);
    }
  },
};
