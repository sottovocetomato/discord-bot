function checkGameParticipant(userId) {
  return !!state.gameParticipants.find((e) => e.userId === userId);
}

function addGameParticipant(interaction, init = false) {
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
}

module.exports = { addGameParticipant, checkGameParticipant };
