const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { shuffleArray } = require("../../utils/helpers");

function readQuestions() {
  const file = fs.readFileSync(
    path.join(__dirname, "..", "prompts/prompts.txt")
  );

  state.gameQuestions = file.toString().split("\n");

  shuffleArray(state.gameQuestions);
  state.gameQuestions = state.gameQuestions
    .map((e, i) => ({ id: i, question: e.replace(/(,|;|\r)+$/gim, "") }))
    .filter((e) => !!e);
}

function setGameOptions(client, interaction) {
  if (state.gameIsRunning) {
    interaction.reply("Невозможно изменить настройки игры, пока она запущена");
    return;
  }
  console.log(interaction.options.data, "interaction.options");
  interaction.options.data.forEach((o) => {
    const capitalize = (w) => `${w[0].toUpperCase()}${w.slice(1)}`;
    const optionName = o.name
      .split("_")
      .map((e, i) => (i > 0 ? capitalize(e) : e))
      .join("");
    // console.log(optionName, "optionName");
    state[optionName] = optionName.toLowerCase().includes("time")
      ? o.value * 1000
      : o.value;
  });
  interaction.reply({ content: "Настройки изменены", ephemeral: true });
}

function checkGameOptions(client, interaction) {
  const settingsEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("Настройки игры Куплеш")
    .addFields({
      name: `join_wait_time: ${state.joinWaitTime / 1000}`,
      value: "\u200b",
    })
    .addFields({
      name: `vote_time: ${state.voteTime / 1000}`,
      value: "\u200b",
    })
    .addFields({
      name: `round_timeout: ${state.roundTimeout / 1000}`,
      value: "\u200b",
    })
    .addFields({
      name: `questions_per_round: ${state.questionsPerRound}`,
      value: "\u200b",
    })
    .addFields({ name: `rounds: ${state.rounds}`, value: "\u200b" });
  interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
}

module.exports = { checkGameOptions, setGameOptions, readQuestions };
