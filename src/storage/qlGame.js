const fs = require("fs");
const path = require("path");

const state = {
  currentGameId: null,
  gameIsRunning: false,
  gameParticipants: [],
  gameAudience: [],
  gameScore: [],
  gameAnswers: [],
  gameQuestions: [],
  currentQuestion: {},
  waitTimeout: 10000,
};

const actions = {
  setCurrentGameId() {
    state.currentGameId = state.currentGameId ? state.currentGameId++ : 1;
  },

  readQuestions() {
    const file = fs.readFileSync(
      path.join(__dirname, "..", "prompts/prompts.txt")
    );
    state.gameQuestions = file.toString().split(",\n");
    console.log(state.gameQuestions, "file");
  },

  startGame(client, interaction) {
    if (state.gameIsRunning) {
      const message =
        state.gameParticipants?.length <= 8
          ? "Игра уже идёт! Набирайте /ql_join, чтобы присоединиться как участник или /ql_aud, чтобы присоединится как зритель."
          : "Игра уже идёт! Набирайте /ql_aud, чтобы присоединится как зритель.";
      interaction.reply(message);
      return;
    }
    this.setCurrentGameId();
    state.gameIsRunning = true;
    this.readQuestions();
    const channel = client.channels.cache.get(interaction.channelId);
    const timeout = setTimeout(() => {
      if (!state.gameParticipants.length) {
        state.gameIsRunning = false;
        channel.send("Игра закончена, так как не было участников!");
      }
      clearTimeout(timeout);
    }, state.waitTimeout);
  },
  checkGameParticipant(userId) {
    return !!state.gameParticipants.find((e) => e === userId);
  },
  checkAudienceParticipant(userId) {
    return !!state.gameAudience.find((e) => e === userId);
  },
  addGameParticipant(interaction) {
    if (!state.gameIsRunning) {
      interaction.reply("Cначала создайте игру, чтобы присоединиться к ней :)");
      return;
    }
    const userParticipating = this.checkGameParticipant(interaction.user.id);
    if (userParticipating) {
      interaction.reply("Вы уже принимаете участие в игре!");
      return;
    }
    state.gameParticipants.push(interaction.user.id);
    interaction.reply(
      `<@${interaction.user.id}> Вы присоединились в качестве игрока!`
    );
  },
  addAudienceParticipant(user, interaction) {
    const userParticipating = this.checkAudienceParticipant(user.id);
    if (userParticipating) {
      interaction.reply("Вы уже принимаете участие в игре!");
      return;
    }
    state.gameAudience.push(user.id);
  },
};

module.exports = { state, actions };
