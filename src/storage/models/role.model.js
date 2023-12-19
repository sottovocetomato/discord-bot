const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("role", {
    guildId: {
      type: DataTypes.STRING,
    },
    qlWinnerRoleId: {
      type: DataTypes.STRING,
    },
  });

  return Role;
};
