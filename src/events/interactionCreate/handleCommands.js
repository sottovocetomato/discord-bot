const { testServer, devs, botChannel } = require("../../../config.json");
const getLocalCommands = require("../../utils/getLocalCommands");
const getButtonActions = require("../../utils/getButtonActions");

module.exports = async (client, interaction) => {
  // console.log(interaction, "INTERACTION");
  if (interaction.isChatInputCommand()) {
    const localCommands = getLocalCommands();
    try {
      const command = localCommands.find(
        (cmd) => cmd.name === interaction.commandName
      );
      if (!command) throw new Error("Command does not exists");
      if (command?.devOnly && !devs.includes.interaction.member.id) {
        interaction.reply({
          content: "Only devs can use this command!",
          ephemeral: true,
        });
        return;
      }
      if (command?.testOnly && !interaction.guild.id === testServer) {
        interaction.reply({
          content: "This command can't be ran on this server",
          ephemeral: true,
        });
        return;
      }
      if (command?.permissionsRequired?.length) {
        for (const perm of command.permissionsRequired) {
          if (!interaction.member.permissions.has(perm)) {
            interaction.reply({
              content: "Not enough permissions to ran this command",
              ephemeral: true,
            });
            break;
          }
        }
      }
      if (command?.botPermissions?.length) {
        const bot = interaction.guild.members.me;
        for (const perm of command.botPermissions) {
          if (!bot.permissions.has(perm)) {
            interaction.reply({
              content: "Not enough bot permissions to ran this command",
              ephemeral: true,
            });
            break;
          }
        }
      }
      await command.callback(client, interaction);
    } catch (e) {
      console.error(`There was an error handling commands: ${e}`);
    }
  } else if (interaction.isButton()) {
    const buttonActions = getButtonActions();
    const action = buttonActions.find((b) => b.name === interaction?.customId);
    if (!action) throw new Error("Command does not exists");
    await action.callback(client, interaction);
  }
};
