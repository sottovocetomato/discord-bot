const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "ban",
  description: "bans user from server",
  options: [
    {
      name: "target-user",
      description: "The user you want to ban",
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: "ban-cause",
      description: "The cause of ban",
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  callback: (client, interaction) => {
    interaction.reply(`user has been banned`);
  },
};
