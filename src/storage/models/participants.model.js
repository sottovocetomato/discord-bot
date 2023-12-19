const { Sequelize, DataTypes, Model } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
  const Participant = sequelize.define("participant", {
    guildId: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.STRING,
    },
    gamesWon: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    currentWinner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Participant;
};
