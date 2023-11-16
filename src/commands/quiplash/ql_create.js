const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const { state, actions } = require("../../storage/qlGame");

module.exports = {
  name: "ql_create",
  description: "Запустить Quiplash",
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: (client, interaction) => {
    actions.startGame(client, interaction);
    interaction.reply(
      `<@${interaction.user.id}> запустил куплеш! Набирайте /ql_join, чтобы присоединиться к игре или /ql_aud, чтобы присоединится как зритель.`
    );
  },
};
