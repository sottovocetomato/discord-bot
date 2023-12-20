const db = require("../config/db.config");
const Participant = db.participants;

exports.getParticipant = async (guildId, userId) => {
  try {
    const participant = await Participant.findOne({
      where: { guildId, userId },
    });
    return participant || null;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.getCurrentWinner = async (guildId) => {
  try {
    const currentWinner = (
      await Participant.findOne({
        where: { guildId, currentWinner: 1 },
      })
    )?.dataValues;

    // console.log(currentWinner, "currentWinner");
    return currentWinner;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.createParticipant = async (data) => {
  try {
    const participant = await Participant.create(data);
    return participant;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.updateParticipant = async (data) => {
  const { guildId, userId } = data;
  // console.log(data, "participant update");
  try {
    const participantToUpdate = await Participant.findOne({
      where: { guildId, userId },
    });
    if (!participantToUpdate) throw new Error("Setting is not found!");
    await participantToUpdate.update(data);
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};
