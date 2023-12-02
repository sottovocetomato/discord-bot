const fs = require("fs");
const path = require("path");

const {
  bold,
  italic,
  strikethrough,
  underscore,
  spoiler,
  quote,
  blockQuote,
  EmbedBuilder,
} = require("discord.js");
const { shuffleArray } = require("../utils/helpers");

const state = {
  canJoin: false,
  canVote: false,
  canAnswer: false,
  currentGameId: null,
  currentChannel: null,
  currentRound: 1,
  questionsPerRound: 1,
  rounds: 1,
  gameIsRunning: false,
  gameParticipants: [],
  gameAudience: [],
  gameScore: [],
  gameAnswers: {},
  gameQuestions: [],
  gameMaxQuestions: null,
  currentQuestion: 1,
  currentVoteMessage: null,
  gameInitiatorId: null,
  quiplash: 0,
  waitTime: 10000,
  startGameTimeout: null,
  startRoundInterval: null,
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

  async createGame(client, interaction) {
    if (state.gameIsRunning) {
      const message =
        state.gameParticipants?.length <= 8
          ? "Игра уже идёт! Набирайте /ql_join, чтобы присоединиться как участник!"
          : "Игра уже идёт! Достигнуто максимальное кол-во участников!";
      interaction.reply(message);
      return;
    }
    this.setCurrentGameId();
    state.gameIsRunning = true;
    state.canJoin = true;
    state.gameMaxQuestions = state.questionsPerRound * state.rounds;
    this.readQuestions();
    state.gameParticipants.push({
      userId: interaction.user.id,
      userName: interaction.user.globalName,
      score: 0,
    });
    state.currentChannel = client.channels.cache.get(interaction.channelId);
    state.gameInitiatorId = interaction.user.id;
    state.startGameTimeout = setTimeout(async () => {
      if (!state.gameIsRunning) return;
      if (state.gameParticipants.length < 1) {
        this.clearGameData();
        state.currentChannel.send(
          "Недостаточное количество участников для начала игры :("
        );
      } else {
        await this.startGame(client, interaction);
      }
    }, state.waitTime);
  },

  async startGame(client, interaction) {
    if (!state.gameIsRunning) {
      await interaction.reply({
        content: "Cначала создайте игру :)",
        fetchReply: true,
      });
      return;
    }
    if (state.gameParticipants.length < 1) {
      interaction.reply(
        "Недостаточное количество участников для начала игры :("
      );
      return;
    }
    this.canJoin = false;
    this.startRound();
  },

  startRound() {
    const question = state.gameQuestions[state.currentQuestion - 1];
    const roundMsg = bold("РАУНД " + state.currentRound);
    const pointsMsg =
      state?.currentRound > 1
        ? "\nОчки умножаются на " + state.currentRound
        : "";

    const questionMsg = italic(
      `Вопрос ${state.currentQuestion}: ${question?.question}`
    );
    const sendAnsMsg = underscore(
      "Участники, присылайте ответы мне в личные сообщения!"
    );
    state.canAnswer = true;
    state.currentChannel.send(
      `${roundMsg} ${pointsMsg}
      \n${questionMsg}  
      \n${sendAnsMsg}`
    );

    let timeout = state.roundTimeout;
    state.startRoundInterval = setInterval(() => {
      if (timeout > 0) {
        if (
          state?.gameAnswers[state.currentQuestion]?.length ===
          state?.gameParticipants?.length
        ) {
          this.roundVote();
          clearInterval(state.startRoundInterval);
          return;
        }
        if (timeout === 15000) {
          let noAnswerFromUsers = state.gameParticipants.filter(
            (p) =>
              !state.gameAnswers[state.currentQuestion]?.find(
                (el) => el.userId === p.userId
              )
          );
          noAnswerFromUsers = noAnswerFromUsers
            .map((e) => `<@${e.userId}>`)
            .join(",");
          state.currentChannel.send(
            `Осталось 15 секунд! Ждём ответов от ${noAnswerFromUsers}`
          );
        }
        timeout -= 1000;
      } else {
        clearInterval(state.startRoundInterval);
        if (!state.gameAnswers?.[state.currentQuestion]) {
          state.currentChannel.send(
            `Никто из участников не дал ответа на вопрос :( Скоро будет задан следующий вопрос...`
          );
          setTimeout(() => {
            if (state.gameIsRunning) {
              this.endStage();
            }
          }, 10000);
          return;
        }
        this.roundVote();
      }
    }, 1000);
  },

  roundVote(client, interaction) {
    let textBody = "";
    state.canAnswer = false;
    state.gameAnswers[state.currentQuestion]?.forEach((e, i, arr) => {
      textBody += `${state.emojis[i]} - ${e.answer}\n`;
      arr[i] = { ...e, emojiName: state.emojis[i] };
    });

    state.currentChannel
      .send(
        `\n${underscore(
          "Настало время для голосования зрителей! Ставьте реакции на понравившийся ответ!"
        )} 
        \n${textBody}`
      )
      .then(async (m) => {
        {
          state.currentVoteMessage = m;
          const filter = (reaction, user) => {
            return state.emojis.includes(reaction.emoji.name) && !user.bot;
          };

          for (const e of state.gameAnswers[state.currentQuestion]) {
            const i = state.gameAnswers[state.currentQuestion].indexOf(e);
            const emoji = state.emojis[i];
            await m.react(emoji);
            // await m.react(state.emojis[i + 1]);
          }
          const collector = m.createReactionCollector({
            filter: filter,
            time: 10000,
          });

          //TODO: при необходимости оптимизировать сбор реакций здесь и в handleReaction.js
          collector.on("collect", (reaction, user) => {
            const userReactions = collector.collected.filter((c) =>
              c.users.cache.has(user.id)
            );
            userReactions.forEach((item, key) => {
              if (item.emoji.name !== reaction.emoji.name) {
                collector.collected.delete(key);
              }
            });
            // state.currentChannel.send(
            //   `Collected ${reaction.emoji.name} from ${user.tag}`
            // );
          });

          collector.on("end", (collected) => {
            // console.log(`Collected ${collected.size} items`);
            // console.log(collected, `COLLECTED`);
            this.settleScores(collected);
            const nextMsg =
              state.currentQuestion >= state.gameMaxQuestions
                ? `Время подвести итоги...`
                : `Скоро будет задан, следующий вопрос...`;
            state.currentChannel.send(nextMsg);
            setTimeout(() => {
              if (state.gameIsRunning) {
                this.endStage();
              }
            }, 10000);
          });
        }
      })
      .catch((e) => console.error(e?.size || e, "ERROR"));
  },

  settleScores(collected) {
    try {
      const scoreEmbed = new EmbedBuilder().setColor(0x0099ff);

      let largestVote = 1;
      let winner = null;
      let scoresMsg = "";
      const votesNum = [...collected.values()].reduce((a, n) => {
        a += n?.count - 1;
        return a;
      }, 0);
      state.gameAnswers[state.currentQuestion].forEach((ans) => {
        const currVote = collected.get(ans.emojiName);
        // console.log(currVote, "currVote");
        const votedParticipant = state.gameParticipants.find(
          (e) => e.userId == ans.userId
        );
        if (currVote && currVote.count > 1) {
          if (currVote.count - 1 === votesNum) {
            state.quiplash = 1000;
          }
          const score =
            (currVote.count - 1) * 100 * state.currentRound + state.quiplash;
          votedParticipant.score += score;
          scoresMsg += `Ответ ${ans.emojiName} дан <@${votedParticipant.userId}>, он получает ${score} баллов \n`;
          if (!largestVote) largestVote = currVote.count;
          if (currVote.count > largestVote) {
            winner = votedParticipant;
            largestVote = currVote.count;
          } else if (currVote.count === largestVote) {
            winner = [winner];
            winner.push(votedParticipant);
          }
        } else {
          scoresMsg += `Ответ ${ans.emojiName} дан <@${votedParticipant.userId}>, он получает 0 баллов \n`;
        }
      });
      this.sendScoresEmbed(scoreEmbed, scoresMsg, winner, largestVote);
    } catch (e) {
      console.error(e);
      state.currentChannel.send("Что-то пошло не так!");
    }
  },

  sendScoresEmbed(embed, scoresMsg, winner, largestVote) {
    console.log(winner, "winner");
    embed.addFields({
      name: "Результаты голосования:",
      value: scoresMsg,
    });
    if (!winner) {
      embed.addFields({
        name: "Ой, как же так...",
        value: `Похоже, пользователи забыли проголосовать...`,
      });
    } else if (Array.isArray(winner)) {
      let text = "";
      winner.forEach((e) => {
        text += `<@${e.userId}> c кол-вом голосов: ${largestVote - 1} !\n`;
      });
      embed.addFields({
        name: "Ничья!",
        value: text,
      });
    } else {
      embed.addFields({
        name: "Победитель",
        value: `Победил <@${winner?.userId}> c ${largestVote - 1} голосов!! ${
          state.quiplash ? bold("\n КУПЛЕШ +1000 очков") : ""
        }`,
      });
    }

    let text = "";
    state.gameParticipants.forEach((p) => {
      text += `<@${p.userId}> - ${p.score} очков \n`;
    });
    embed.addFields({
      name: "Текущее кол-во очков:",
      value: text,
    });
    state.currentChannel.send({ embeds: [embed] });
    state.quiplash = 0;
  },

  endStage() {
    try {
      const questionsLimit = state.questionsPerRound * state.currentRound;

      if (
        state.currentQuestion >= questionsLimit &&
        state.currentRound < state.rounds
      ) {
        state.currentQuestion++;
        state.currentRound++;
        this.startRound();
        return;
      }
      if (
        state.currentQuestion >= questionsLimit &&
        state.currentRound >= state.rounds
      ) {
        this.endGame();
        return;
      }

      if (state.currentQuestion < questionsLimit) {
        state.currentQuestion++;
        this.startRound();
      }
    } catch (e) {
      console.error(e);
    }
  },

  endGame(manual = false, client, interaction) {
    if (!state.gameIsRunning) {
      interaction.reply({
        content: "Сначала создайте игру :)",
        ephemeral: true,
      });
      return;
    }
    if (manual && interaction.user.id !== state.gameInitiatorId) {
      interaction.reply({
        content: "Закончить игру может только тот, кто её начал",
        ephemeral: true,
      });
      return;
    }
    if (manual) {
      interaction.reply({
        content: "Заканчиваем игру",
        ephemeral: true,
      });
    }
    let gameWinners = [];
    let highestScore = null;

    for (const p of state.gameParticipants) {
      if (p.score === 0) continue;
      if (highestScore < p.score) {
        highestScore = p.score;
      }
    }
    gameWinners = state.gameParticipants.filter(
      (p) => p.score === highestScore
    );
    const winnerEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Игра закончена!");

    if (gameWinners.length === 1) {
      winnerEmbed.addFields({
        name: "Поздравляем победителя!",
        value: `Им стал <@${gameWinners[0].userId}>`,
      });
    }
    if (gameWinners.length > 1) {
      winnerEmbed.addFields({
        name: "Поздравляем!",
        value: `Следующие игроки набрали одинаковое кол-во очков: ${gameWinners
          .map((e) => `\n<@${e.userId}>`)
          .join(",")}`,
      });
    }
    state.currentChannel.send({ embeds: [winnerEmbed] });
    this.clearGameData();
  },
  clearGameData() {
    clearInterval(state.startRoundInterval);
    state.currentGameId = null;
    state.currentRound = 1;
    state.questionsPerRound = 2;
    state.rounds = 2;
    state.gameIsRunning = false;
    state.gameParticipants = [];
    state.gameAudience = [];
    state.gameScore = [];
    state.gameAnswers = {};
    state.gameQuestions = [];
    state.currentQuestion = 1;
    state.currentVoteMessage = null;
    state.startGameTimeout = null;
    state.startRoundInterval = null;
    state.canJoin = false;
  },
  checkGameParticipant(userId) {
    return !!state.gameParticipants.find((e) => e.userId === userId);
  },
  // checkAudienceParticipant(userId) {
  //   return !!state.gameAudience.find((e) => e.userId === userId);
  // },
  addGameParticipant(interaction) {
    if (!state.canJoin) {
      interaction.reply({
        content: "Невозможно присоединиться к игре на данном этапе",
        ephemeral: true,
      });
      return;
    }
    if (!state.gameIsRunning) {
      interaction.reply({
        content: "Cначала создайте игру, чтобы присоединиться к ней :)",
        ephemeral: true,
      });
      return;
    }
    const userParticipating = this.checkGameParticipant(interaction.user.id);
    if (userParticipating) {
      interaction.reply({
        content: "Вы уже принимаете участие в игре!",
        ephemeral: true,
      });
      return;
    }
    state.gameParticipants.push({
      userId: interaction.user.id,
      userName: interaction.user.globalName,
      score: 0,
    });

    interaction.reply({
      content: `<@${interaction.user.id}> Вы присоединились в качестве игрока!`,
      ephemeral: true,
    });
  },

  // addAudienceParticipant(user, interaction) {
  //   const userParticipating = this.checkAudienceParticipant(user.id);
  //   if (userParticipating) {
  //     interaction.reply("Вы уже принимаете участие в игре!");
  //     return;
  //   }
  //   state.gameAudience.push(user.id);
  // },

  setParticipantsAnswer(client, message) {
    const userIsParticipating = this.checkGameParticipant(message.author.id);
    // console.log(state.canAnswer, "state.canAnswer");
    // console.log(
    //   !userIsParticipating || !state.canAnswer,
    //   "!userIsParticipating || !state.canAnswer"
    // );
    if (!userIsParticipating || !state.canAnswer) return;
    if (
      state.gameAnswers?.[state.currentQuestion]?.find(
        (p) => p.userId === message.author.id
      )
    ) {
      message.reply(`Вы уже давали ответ на данный вопрос`);
      return;
    }
    if (!state.gameAnswers[state.currentQuestion]) {
      state.gameAnswers[state.currentQuestion] = [];
    }
    state.gameAnswers[state.currentQuestion].push({
      questionId: state.gameAnswers[state.currentQuestion]?.id,
      userId: message.author.id,
      answer: message.content,
    });

    message.reply(`Ваш ответ принят ${message.author.globalName}`);
    console.log(state.gameAnswers, "state.gameAnswers");
  },
};

module.exports = { state, actions };
