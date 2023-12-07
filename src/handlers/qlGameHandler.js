const fs = require("fs");
const path = require("path");
const { gameData } = require("../storage/quiplash");

const { qlWinnerRoleId } = require("../../config.json");

const {
  bold,
  italic,
  strikethrough,
  underscore,
  spoiler,
  quote,
  blockQuote,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  time,
} = require("discord.js");
const { shuffleArray } = require("../utils/helpers");

const state = {
  canJoin: false,
  canVote: false,
  canAnswer: false,
  currentGameId: null,
  currentChannel: null,
  currentRound: 1,
  questionsPerRound: 2,
  rounds: 2,
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
  joinWaitTime: 40000,
  voteTime: 35000,
  startGameInterval: null,
  startRoundInterval: null,
  voteMsgInterval: null,
  roundTimeout: 40000,
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
    const joinQlGame = new ButtonBuilder()
      .setLabel("Участвовать")
      .setCustomId("ql_join_game")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(joinQlGame);

    if (state.gameIsRunning) {
      const message =
        state.gameParticipants?.length <= 8
          ? "Игра уже идёт! Набирайте /ql_join, чтобы присоединиться как участник!"
          : "Игра уже идёт! Достигнуто максимальное кол-во участников!";

      await interaction.reply({ content: message, components: [row] });
      return;
    }

    //TODO: убрать блок при переходе на бд
    const currentWinner = interaction.guild.roles.cache
      .get(qlWinnerRoleId)
      .members.map((m) => m.user.id);
    if (currentWinner.length) {
      gameData.currentWinnerId = currentWinner[0];
    }

    this.setCurrentGameId();
    state.gameIsRunning = true;
    state.canJoin = true;
    state.gameMaxQuestions = state.questionsPerRound * state.rounds;
    this.readQuestions();
    this.addGameParticipant(interaction, true);
    state.currentChannel = client.channels.cache.get(interaction.channelId);
    state.gameInitiatorId = interaction.user.id;

    await interaction.reply({
      content: `<@${interaction.user.id}> запустил куплеш!`,
      components: [row],
    });

    let timeout = state.joinWaitTime;
    state.startGameInterval = setInterval(async () => {
      if (!state.gameIsRunning) {
        clearInterval(state.startGameInterval);
        return;
      }
      if (timeout === 15000) {
        state.currentChannel.send("До начала игры осталось 15 секунд!");
      }
      if (timeout <= 0) {
        if (state.gameParticipants.length < 1) {
          this.clearGameData();
          state.currentChannel.send(
            "Недостаточное количество участников для начала игры :("
          );
        } else {
          await this.startGame(client, interaction);
        }
        clearInterval(state.startGameInterval);
      }

      timeout -= 1000;
    }, 1000);
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
    this.startRound(client, interaction);
  },

  startRound(client, interaction) {
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

    state.startRoundInterval = setInterval(
      this.updateAnswersStatus(client, interaction),
      1000
    );
  },

  updateAnswersStatus(client, interaction) {
    let timeout = state.roundTimeout;
    return () => {
      if (timeout > 0) {
        if (
          state?.gameAnswers[state.currentQuestion]?.length ===
          state?.gameParticipants?.length
        ) {
          clearInterval(state.startRoundInterval);
          state.currentChannel.send(`Все участники дали свои ответы!`);
          setTimeout(() => this.roundVote(client, interaction), 5000);
          return;
        }
        if (
          timeout === state.roundTimeout / 2 ||
          timeout === state.roundTimeout / 4
        ) {
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
            `Осталось ${
              timeout / 1000
            } секунд! Ждём ответов от ${noAnswerFromUsers}`
          );
        }
        timeout -= 1000;
      } else {
        clearInterval(state.startRoundInterval);
        if (!state.gameAnswers?.[state.currentQuestion]) {
          state.currentChannel.send(
            `Никто из участников не дал ответа на вопрос :(`
          );
          setTimeout(() => {
            if (state.gameIsRunning) {
              console.log(this, "THIS");
              this.endStage(client, interaction);
            }
          }, 10000);
          return;
        }
        this.roundVote(client, interaction);
      }
    };
  },

  roundVote(client, interaction) {
    // let textBody = "";
    state.canAnswer = false;
    const answersEmbed = new EmbedBuilder()
      .setTitle("Настало время для голосования зрителей!")
      .setColor("Random")
      .addFields({
        name: "Ставьте реакции на понравившийся ответ!",
        value: `На голосование даётся ${state.voteTime / 1000} секунд!`,
      });

    state.gameAnswers[state.currentQuestion]?.forEach((e, i, arr) => {
      // textBody += `${state.emojis[i]} - ${e.answer}\n`;
      arr[i] = { ...e, emojiName: state.emojis[i] };
      answersEmbed.addFields({
        name: `${state.emojis[i]} - ${e.answer}`,
        value: "\u200b",
      });
    });

    state.currentChannel
      .send({ embeds: [answersEmbed] })
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
            time: state.voteTime,
          });

          let voteTimer = state.voteTime;
          state.voteMsgInterval = setInterval(() => {
            // console.log(voteTimer, "voteTimer");
            if (voteTimer <= 0) {
              clearInterval(state.voteMsgInterval);
              return;
            }
            if (voteTimer === 10000 || voteTimer === 5000) {
              state.currentChannel.send(`Осталось ${voteTimer / 1000} секунд!`);
            }
            voteTimer -= 1000;
          }, 1000);

          //TODO: при необходимости оптимизировать сбор реакций здесь и в handleReaction.js
          collector.on("collect", (reaction, user) => {
            const userReactions = collector.collected.filter((c) =>
              c.users.cache.has(user.id)
            );
            userReactions.forEach((item, key) => {
              if (item.emoji.name !== reaction.emoji.name) {
                const currCollectedVote = collector.collected.get(key);
                collector.collected.set(key, {
                  ...currCollectedVote,
                  count: --currCollectedVote.count,
                });
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
            clearInterval(state.voteMsgInterval);
            const nextMsg =
              state.currentQuestion >= state.gameMaxQuestions
                ? `Время подвести итоги...`
                : `Скоро будет задан, следующий вопрос...`;
            state.currentChannel.send(nextMsg);
            setTimeout(() => {
              if (state.gameIsRunning) {
                this.endStage(client, interaction);
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
      console.log(collected, "COLLECTED");
      let largestVote = 1;
      let winner = null;
      let scoresMsg = "";
      const votesNum = [...collected.values()].reduce((a, n) => {
        a += n?.count - 1;
        return a;
      }, 0);
      if (!votesNum) {
        scoreEmbed
          .addFields({
            name: "Ой, как же так...",
            value: `Похоже, пользователи забыли проголосовать...`,
          })
          .setColor(0xffd966);
        state.currentChannel.send({ embeds: [scoreEmbed] });
        return;
      }
      state.gameAnswers[state.currentQuestion].forEach((ans) => {
        const currVote = collected.get(ans.emojiName);

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
    // console.log(winner, "winner");
    embed.setTitle("Результаты голосования:").setDescription(scoresMsg);
    const winnerEmbed = new EmbedBuilder().setColor(0x6aa84f);
    if (Array.isArray(winner)) {
      let text = "";
      winner.forEach((e) => {
        text += `<@${e.userId}> c кол-вом голосов: ${largestVote - 1} !\n`;
      });
      winnerEmbed.setTitle("Ничья!").setDescription(text);
    } else {
      winnerEmbed
        .setTitle("Победитель!")
        .setDescription(
          `Победил <@${winner?.userId}> c ${largestVote - 1} голосов!! ${
            state.quiplash ? bold("\n КУПЛЕШ +1000 очков") : ""
          }`
        );
    }

    let text = "";
    state.gameParticipants.forEach((p) => {
      text += `<@${p.userId}> - ${p.score} очков \n`;
    });
    const scoresEmbed = new EmbedBuilder()
      .setTitle("Текущее кол-во очков:")
      .setColor(0x999999)
      .setDescription(text);
    state.currentChannel.send({ embeds: [embed, winnerEmbed, scoresEmbed] });
    state.quiplash = 0;
  },

  endStage(client, interaction) {
    try {
      const questionsLimit = state.questionsPerRound * state.currentRound;

      if (
        state.currentQuestion >= questionsLimit &&
        state.currentRound < state.rounds
      ) {
        state.currentQuestion++;
        state.currentRound++;
        this.startRound(client, interaction);
        return;
      }
      if (
        state.currentQuestion >= questionsLimit &&
        state.currentRound >= state.rounds
      ) {
        this.endGame(false, client, interaction);
        return;
      }

      if (state.currentQuestion < questionsLimit) {
        state.currentQuestion++;
        this.startRound(client, interaction);
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

      gameData.currentWinnerGamesWon =
        gameData.currentWinnerId == gameWinners[0].userId
          ? gameData.currentWinnerGamesWon++
          : 1;

      const role = interaction.guild.roles.cache.get(qlWinnerRoleId);
      const hasRole = gameWinners[0]?.roles?.cache?.has(role?.id);
      console.log(role, "ROLE");
      console.log(hasRole, "hasRole");
      if (role && gameData.currentWinnerGamesWon >= 1 && !hasRole) {
        const prevWinner = interaction.guild.members.cache.get(
          gameData.currentWinnerId
        );
        prevWinner?.roles?.remove(qlWinnerRoleId);
        gameWinners[0].roles.add(qlWinnerRoleId);
      }
      gameData.currentWinnerId = gameWinners[0].userId;
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
    clearInterval(state.voteMsgInterval);
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
  addGameParticipant(interaction, init = false) {
    if (!init) {
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
      if (!state?.gameParticipants?.length == 8) {
        interaction.reply({
          content: "Достигнуто максимальное количество участников",
          ephemeral: true,
        });
        return;
      }
    }
    state.gameParticipants.push({
      userId: interaction.user.id,
      userName: interaction.user.globalName,
      score: 0,
      roles: interaction.member.roles,
    });

    if (!init) {
      interaction.reply({
        content: `<@${interaction.user.id}> присоединлся/лась к игре`,
      });
    }
  },

  // addAudienceParticipant(user, interaction) {
  //   const userParticipating = this.checkAudienceParticipant(user.id);
  //   if (userParticipating) {
  //     interaction.reply("Вы уже принимаете участие в игре!");
  //     return;
  //   }
  //   state.gameAudience.push(user.id);
  // },

  checkUserReactionsVote(cachedReaction, sentReaction, user) {
    const userIsParticipant = state.gameAnswers[state.currentQuestion].find(
      (a) => a.userId === user.id
    );
    if (cachedReaction._emoji.name !== sentReaction._emoji.name) {
      cachedReaction.users.remove(user.id);
    }
    if (
      userIsParticipant &&
      userIsParticipant.emojiName === sentReaction._emoji.name
    ) {
      sentReaction.users.remove(user.id);
    }
  },

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
      questionId: state.currentQuestion,
      userId: message.author.id,
      answer: message.content,
    });

    message.reply(`Ваш ответ принят ${message.author.globalName}`);
  },
  setGameOptions(client, interaction) {
    if (state.gameIsRunning) {
      interaction.reply(
        "Невозможно изменить настройки игры, пока она запущена"
      );
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
  },
  checkGameOptions(client, interaction) {
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
  },
};

module.exports = { state, actions };
