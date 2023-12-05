const path = require("path");
require("dotenv").config();
const eventHandler = require("./src/handlers/eventHandler");

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

eventHandler(client);
// console.log(client, "CLIENT");
// console.log(process.env.TOKEN, "TOKEN");
client.login(process.env.TOKEN);
