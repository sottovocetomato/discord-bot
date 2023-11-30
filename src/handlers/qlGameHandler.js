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
  currentGameId: null,
  currentChannel: null,
  currentRound: 1,
  questionsPerRound: 3,
  rounds: 3,
  gameIsRunning: false,
  gameParticipants: [],
  gameAudience: [],
  gameScore: [],
  gameAnswers: {},
  gameQuestions: [],
  currentQuestion: 1,
  currentVoteMessage: null,
  quiplash: 0,
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
          ? "Игра уже идёт! Набирайте /ql_join, чтобы присоединиться как участник!"
          : "Игра уже идёт! Достигнуто максимальное кол-во участников!";
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
    const question = state.gameQuestions[state.currentQuestion - 1];
    state.currentChannel.send(
      `${bold("РАУНД " + state.currentRound)}
      \nВопрос: ${question?.question} 
      \n${underscore("Участники, присылайте ответы мне в личные сообщения!")}`
    );

    let interval;
    let timeout = state.roundTimeout;
    interval = setInterval(() => {
      if (timeout > 0) {
        if (
          state?.gameAnswers[state.currentQuestion]?.length ===
          state?.gameParticipants?.length
        ) {
          this.roundVote();
          clearInterval(interval);
          return;
        }
        if (timeout === 15000) {
          let noAnswerFromUsers = state.gameParticipants.filter((id) => {
            !!state.gameAnswers[state.currentQuestion]?.find(
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
    state.gameAnswers[state.currentQuestion]?.forEach((e, i, arr) => {
      textBody += `${state.emojis[i]} - ${e.answer}\n`;
      arr[i] = { ...e, emojiName: state.emojis[i] };
    });

    state.currentChannel
      .send(
        `\n${underscore(
          "Настало время голосовать за наиболее понравившийся ответ!"
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
            this.spreadVotes(collected);
          });
        }
      })
      .catch((e) => console.error(e?.size || e, "ERROR"));
  },

  spreadVotes(collected) {
    try {
      const exampleEmbed = new EmbedBuilder().setColor(0x0099ff);

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
          }
        } else {
          scoresMsg += `Ответ ${ans.emojiName} дан <@${votedParticipant.userId}>, он получает 0 баллов \n`;
        }
      });
      exampleEmbed.addFields({
        name: "Результаты голосования:",
        value: scoresMsg,
      });
      exampleEmbed.addFields({
        name: "Победитель",
        value: `Победил <@${winner.userId}> c ${largestVote - 1} голосов!! ${
          state.quiplash ? bold("\n КУПЛЕШ +1000 очков") : ""
        }`,
      });

      let text = "";
      state.gameParticipants.forEach((p) => {
        text += `<@${p.userId}> - ${p.score} очков \n`;
      });
      exampleEmbed.addFields({
        name: "Текущее кол-во очков:",
        value: text,
      });
      state.currentChannel.send({ embeds: [exampleEmbed] });
      state.quiplash = 0;
    } catch (e) {
      console.error(e);
      state.currentChannel.send("Что-то пошло не так!");
    }
  },
  checkGameParticipant(userId) {
    return !!state.gameParticipants.find((e) => e.userId === userId);
  },
  checkAudienceParticipant(userId) {
    return !!state.gameAudience.find((e) => e.userId === userId);
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
    state.gameParticipants.push({
      userId: interaction.user.id,
      userName: interaction.user.globalName,
      score: 0,
    });

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
