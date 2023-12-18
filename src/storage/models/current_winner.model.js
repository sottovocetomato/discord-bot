const { Sequelize, DataTypes, Model } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
  const CurrentWinner = sequelize.define("currentWinner", {
    current_winner_score: {
      type: DataTypes.INTEGER,
    },
    current_winner_games_won: {
      type: DataTypes.INTEGER,
    },
  });

  return CurrentWinner;
};
