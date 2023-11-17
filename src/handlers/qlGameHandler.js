const fs = require("fs");
const path = require("path");
const { shuffleArray } = require("../utils/helpers");

const state = {
  currentGameId: null,
  currentChannel: null,
  currentRound: 1,
  questionsPerRound: 5,
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

    state.gameQuestions = file.toString().split("\n");

    shuffleArray(state.gameQuestions);
    state.gameQuestions = state.gameQuestions
      .map((e, i) => ({ id: i, question: e.replace(/(,|;|\r)+$/gim, "") }))
      .filter((e) => !!e);
  },

  createGame(client, interaction) {
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
    state.currentChannel = client.channels.cache.get(interaction.channelId);
    const timeout = setTimeout(() => {
      if (!state.gameParticipants.length) {
        state.gameIsRunning = false;
        state.currentChannel.send(
          "Игра закончена, так как не было участников!"
        );
      } else {
        this.startGame(client, interaction);
      }
      clearTimeout(timeout);
    }, state.waitTimeout);
  },

  startGame(client, interaction) {
    state.currentQuestion = state.gameQuestions[state.currentRound - 1];
    state.currentChannel.send(
      `РАУНД ${state.currentRound}
      \nВопрос: ${state.currentQuestion?.question} 
      \nУчастники, присылайте ответы мне в личные сообщения!`
    );
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

  setParticipantsAnswer(client, message) {
    const userIsParticipating = this.checkGameParticipant(message.author.id);
    if (!userIsParticipating) return;
    state.gameAnswers = {
      questionId: state.currentQuestion.id,
      userId: message.author.id,
      userName: message.author.globalName,
      answer: message.content,
    };
    //TODO если ответов на вопрос 8, заканчиваем этап опроса
    message.reply(`Ваш ответ принят ${message.author.globalName}`);
    console.log(state.gameAnswers, "state.gameAnswers");
  },
};

module.exports = { state, actions };
