const db = require("../config/db.config");
const { sequelize, Sequelize } = db;

db.quiplashSettings = require("./quiplash_settings.model")(
  sequelize,
  Sequelize
);
db.currentWinner = require("./current_winner.model")(sequelize, Sequelize);
