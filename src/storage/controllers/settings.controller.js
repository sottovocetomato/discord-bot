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
    console.log("creating setting");
    const setting = await GameSetting.create(data);
    return setting;
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};

exports.updateSetting = async (data) => {
  const { guildId } = data;
  console.log(data, "SETTINGS DATA TO UPDATE");
  try {
    const settingToUpdate = await GameSetting.findOne({ where: { guildId } });
    console.log(settingToUpdate, "setting to updateeeee");
    if (!settingToUpdate) {
      const setting = await GameSetting.create(data);
      console.log(setting.dataValues, "creating setting in update");
      return;
    }
    await settingToUpdate
      .update(data)
      .then((setting) => console.log("setting has been updated"));
  } catch (e) {
    console.error(`Sequilize error: ${e}`);
  }
};
