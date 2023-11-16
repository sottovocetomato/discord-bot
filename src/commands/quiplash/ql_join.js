const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

const { state, actions } = require("../../storage/qlGame");

module.exports = {
  name: "ql_join",
  description: "Присоединиться к текущей игре",
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: (client, interaction) => {
    // console.log(interaction, "interaction");
    actions.addGameParticipant(interaction);
  },
};