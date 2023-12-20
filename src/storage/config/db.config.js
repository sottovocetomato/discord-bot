const Sequelize = require("sequelize");
const db = {};
const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "./src/storage/db/quiplash.db",
});
db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
