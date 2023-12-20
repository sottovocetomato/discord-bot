const db = require("../config/db.config");
const GameSetting = db.quiplashSettings;

exports.getSetting = async (guildId) => {
  try {
    const settingToUpdate = await GameSetting.findOne({ where: { guildId } });
    return settingToUpdate || null;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.createSetting = async (data) => {
  try {
    const { guildId } = data;
    if (!guildId) throw new Error("Provide quildId");

    const setting = await GameSetting.create(data);
    return setting;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.updateSetting = async (data) => {
  const { guildId } = data;

  try {
    const settingToUpdate = await GameSetting.findOne({ where: { guildId } });

    if (!settingToUpdate) {
      await GameSetting.create(data);
      return;
    }
    await settingToUpdate.update(data);
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};
