module.exports = {
  name: "ping",
  description: "ping",
  callback: (client, interaction) => {
    interaction.reply(`Pong! ${client.ws.ping} ms`);
  },
};
