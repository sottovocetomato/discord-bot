const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("role", {
    guildId: {
      type: DataTypes.INTEGER,
    },
    qlWinnerRoleId: {
      type: DataTypes.INTEGER,
    },
  });

  return Role;
};
