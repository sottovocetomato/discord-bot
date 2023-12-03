const getAllFiles = require("./getAllFiles");
const path = require("path");
module.exports = (exceptions = []) => {
  const buttonActions = [];
  const buttonsCategories = getAllFiles(
    path.join(__dirname, "..", "buttons"),
    true
  );
  // console.log(eventFolders, "eventFolders");
  for (const buttonCategory of buttonsCategories) {
    const buttonFiles = getAllFiles(buttonCategory);
    for (const buttonFile of buttonFiles) {
      const buttonObject = require(buttonFile);
      if (exceptions.includes(buttonObject.name)) continue;
      buttonActions.push(buttonObject);
    }
  }
  return buttonActions;
};
