const path = require("path");
// require("dotenv").config({ path: __dirname });

const result = require("dotenv").config({ path: "/projects/discord/.env" });

if (result.error) {
  throw result.error;
}

console.log(result.parsed);
const eventHandler = require("./src/handlers/eventHandler");

const { Client, IntentsBitField, Partials } = require("discord.js");
// console.log(path.join(__dirname, "./", "env"), "__dirname");
console.log(process.env.TOKEN, "TOKEN");
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

client.login(process.env.TOKEN);
