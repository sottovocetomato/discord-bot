const fs = require("fs");
const path = require("path");
const { shuffleArray } = require("../utils/helpers");

const state = {
  currentGameId: null,
  currentChannel: null,
  currentRound: 1,
  questionsPerRound: 5,
  rounds: 3,
  gameIsRunning: false,
  gameParticipants: [],
  gameAudience: [],
  gameScore: [],
  gameAnswers: {},
  gameQuestions: [],
  currentQuestion: {},
  currentVoteMessage: null,
  waitTime: 10000,
  startGameTimeout: null,
  roundTimeout: 25000,
  emojis: ["1️⃣", "2️⃣", "3️⃣", "4️⃣:", "5️⃣:", "6️⃣", "7️⃣", "8️⃣"],
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
    state.startGameTimeout = setTimeout(() => {
      if (state.gameParticipants.length < 1) {
        state.gameIsRunning = false;
        state.currentChannel.send(
          "Недостаточное количество участников для начала игры :("
        );
      } else {
        this.handleGame(client, interaction);
      }
      clearTimeout(state.startGameTimeout);
    }, state.waitTime);
  },

  async handleGame(client, interaction) {
    if (!state.gameIsRunning) {
      const m = await interaction.reply({
        content: "Cначала создайте игру :)",
        fetchReply: true,
      });
      state.currentVoteMessage = m;
      const filter = (reaction, user) => {
        return state.emojis.includes(reaction.emoji.name);
      };

      const collected = await m.awaitReactions({
        filter,
        time: 10000,
      });
      console.log(collected, "collected");
      return;
    }
    if (state.gameParticipants.length < 1) {
      interaction.reply(
        "Недостаточное количество участников для начала игры :("
      );
      return;
    }
    this.startRound();
  },

  startRound() {
    state.currentQuestion = state.gameQuestions[state.currentRound - 1];
    state.currentChannel.send(
      `РАУНД ${state.currentRound}
      \nВопрос: ${state.currentQuestion?.question} 
      \nУчастники, присылайте ответы мне в личные сообщения!`
    );
    let interval;
    let timeout = state.roundTimeout;
    interval = setInterval(() => {
      if (timeout > 0) {
        if (
          state?.gameAnswers[state.currentRound]?.length ===
          state?.gameParticipants?.length
        ) {
          this.roundVote();
          clearInterval(interval);
          return;
        }
        if (timeout === 15000) {
          let noAnswerFromUsers = state.gameParticipants.filter((id) => {
            !!state.gameAnswers[state.currentRound]?.find(
              (el) => el.userId === id
            );
          });
          noAnswerFromUsers = noAnswerFromUsers.map((e, i, ar) =>
            i === ar.length - 1 ? `<@${e}>` : `<@${e}>, `
          );
          state.currentChannel.send(
            `Осталось 15 секунд! Ждём ответов от ${noAnswerFromUsers}`
          );
        }
        timeout -= 1000;
      } else {
        clearInterval(interval);
        this.roundVote();
      }
    }, 1000);
  },

  roundVote(client, interaction) {
    let textBody = "";
    state.gameAnswers[state.currentRound]?.forEach((e, i) => {
      textBody += `${state.emojis[i]}: ${e.answer} \n`;
    });

    state.currentChannel
      .send(
        `Настало время голосовать за наиболее понравившийся ответ! \n ${textBody}`
      )
      .then(async (m) => {
        {
          state.currentVoteMessage = m;
          const filter = (reaction, user) => {
            console.log(reaction, "reaction");
            return reaction.emoji.name === "1️⃣";
          };

          for (const e of state.gameAnswers[state.currentRound]) {
            const i = state.gameAnswers[state.currentRound].indexOf(e);
            const emoji = state.emojis[i];
            await m.react(emoji);
            await m.react(state.emojis[i + 1]);
          }
          const collected = await m.awaitReactions({
            filter,
            time: 15000,
          });
          console.log(collected.size, "collected");
        }
      })
      .catch((e) => console.error(e?.size || e, "ERROR"));
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
    if (!state.gameAnswers[state.currentRound]) {
      state.gameAnswers[state.currentRound] = [];
    }
    state.gameAnswers[state.currentRound].push({
      questionId: state.currentQuestion.id,
      userId: message.author.id,
      userName: message.author.globalName,
      answer: message.content,
    });

    message.reply(`Ваш ответ принят ${message.author.globalName}`);
    console.log(state.gameAnswers, "state.gameAnswers");
  },
};

module.exports = { state, actions };