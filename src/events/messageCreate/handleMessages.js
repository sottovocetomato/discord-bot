const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = (client, message) => {
  // console.log("MESSAGING");
  if (message.author.bot) {
    return;
  }
  if (message.guild === null) {
    if (state.gameIsRunning) {
      actions.setParticipantsAnswer(client, message);
    }
  }
};
