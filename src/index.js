require("dotenv").config();
const eventHandler = require("./handlers/eventHandler");
const path = require("path");

// require("./register-commands");
const { Client, IntentsBitField, Partials } = require("discord.js");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// client.on("messageCreate", (message) => {
//   console.log(message);
//   if (message.author.bot) {
//     return;
//   }
//   message.reply(`Привет, тебе ${message.author.globalName}`);
// });

//
// client.on("interactionCreate", (interaction) => {
//   if (!interaction.isChatInputCommand()) return;
//   console.log(interaction.commandName);
//   if (interaction.commandName === "hey") {
//     interaction.reply(`Привет, тебе, чертила`);
//   }
//   if (interaction.commandName === "ping") {
//     interaction.reply(`Pong`);
//   }
//   if (interaction.commandName === "add") {
//     const num1 = interaction.options.get("first-number")?.value;
//     const num2 = interaction.options.get("second-number")?.value;
//     interaction.reply(`Сумма: ${num1 + num2}`);
//   }
// });
eventHandler(client);
client.login(process.env.TOKEN);
