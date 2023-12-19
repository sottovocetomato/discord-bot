const { Sequelize, DataTypes, Model } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
  const GameSetting = sequelize.define("gameSetting", {
    guildId: {
      type: DataTypes.STRING,
    },
    joinWaitTime: {
      type: DataTypes.INTEGER,
      defaultValue: 40000,
    },
    voteTime: {
      type: DataTypes.INTEGER,
      defaultValue: 35000,
    },
    roundTimeout: {
      type: DataTypes.INTEGER,
      defaultValue: 40000,
    },
    questionsPerRound: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    rounds: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
  });

  return GameSetting;
};
