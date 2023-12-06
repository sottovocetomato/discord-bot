const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = {
  name: "ql_settings",
  description: "Настройки игры",
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "join_wait_time",
      description: "Длительность ожидания участников игры",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: "vote_time",
      description: "Длительность голосования",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: "round_timeout",
      description: "Длительность ожидания ответов",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: "questions_per_round",
      description: "Кол-во вопросов в раунде",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: "rounds",
      description: "Кол-во раундов",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  callback: async (client, interaction) => {
    await actions.setGameOptions(client, interaction);
  },
};
