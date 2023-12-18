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
    console.log("creating setting");
    const setting = await GameSetting.create({ guildId });
    return setting;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.updateSetting = async (data) => {
  const { guildId } = data;
  try {
    const settingToUpdate = await GameSetting.findOne({ where: { guildId } });
    if (!settingToUpdate) throw new Error("Setting is not found!");
    await settingToUpdate
      .update(data)
      .then((setting) => console.log(setting, "setting has been updated"));
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};
