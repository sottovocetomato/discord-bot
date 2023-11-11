require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
  { name: "hey", description: "Greets user" },
  { name: "ping", description: "ping" },
  {
    name: "add",
    description: "Adds two numbers",
    options: [
      {
        name: "first-number",
        description: "The first number",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "second-number",
        description: "The second number",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Slash commands were registered successfully!");
  } catch (e) {
    console.error(e);
  }
})();
