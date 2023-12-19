const db = require("../config/db.config");
const Role = db.roles;

exports.getWinnerRole = async (guildId, qlWinnerRoleId) => {
  try {
    const role = await Role.findOne({
      where: { guildId, qlWinnerRoleId },
    });
    return role || null;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.winnerRole = async (data) => {
  try {
    const role = await Role.create(data);
    return role;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};
