const { state, actions } = require("../../handlers/qlGameHandler");

module.exports = async (client, reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      //TODO: если будет нужно, посмотреть почему на старых сообщениях первая реакция не кэшируется
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
  if (
    reaction.message.guildId &&
    state.gameIsRunning &&
    reaction.message?.id === state.currentVoteMessage?.id
  ) {
    const userReactions = reaction.message.reactions.cache.filter((r) =>
      r.users.cache.has(user.id)
    );

    if (!state.emojis.includes(reaction._emoji.name)) {
      reaction.remove();
      return;
    }
    userReactions.forEach((r) => {
      if (r._emoji.name !== reaction._emoji.name) {
        r.users.remove(user.id);
      }
    });
    console.log(userReactions, "userReactions");
  }
};
