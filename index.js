require("dotenv").config();
const eventHandler = require("./src/handlers/eventHandler");
const path = require("path");
console.log(process.env.TOKEN);
const http = require("http");

const server = http.createServer((req, res) => {
  const urlPath = req.url;
  if (urlPath === "/overview") {
    res.end('Welcome to the "overview page" of the nginX project');
  } else if (urlPath === "/api") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        product_id: "xyz12u3",
        product_name: "NginX injector",
      })
    );
  } else {
    res.end("Successfully started a server");
  }
});

server.listen(3000, "localhost", () => {
  console.log("Listening for request");
});
// console.log(process.env, "ENV");
// const { Client, IntentsBitField, Partials } = require("discord.js");
//
// const client = new Client({
//   intents: [
//     IntentsBitField.Flags.Guilds,
//     IntentsBitField.Flags.GuildMembers,
//     IntentsBitField.Flags.GuildMessages,
//     IntentsBitField.Flags.GuildMessageReactions,
//     IntentsBitField.Flags.MessageContent,
//     IntentsBitField.Flags.DirectMessages,
//   ],
//   partials: [Partials.Message, Partials.Channel, Partials.Reaction],
// });
//
// console.log(process.env.TOKEN);
//
// eventHandler(client);
// client.login(process.env.TOKEN);
