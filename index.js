const path = require("path");
// require("dotenv").config({ path: __dirname });

const result = require("dotenv").config({
  path: path.join(__dirname, "/", ".env"),
});

if (result.error) {
  throw result.error;
}

// console.log(result.parsed);
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
client.login(process.env.TOKEN);
