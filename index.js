const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const dexter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🟢 játék állapot
let gameChannel = null;
let lastNumber = null;

// 🟢 SLASH COMMAND REGISZTRÁLÁS
const commands = [
  new SlashCommandBuilder()
    .setName("szamolas")
    .setDescription("Számolós játék indítása")
    .addChannelOption(option =>
      option.setName("csatorna")
        .setDescription("Válaszd ki a csatornát")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash command regisztrálva");
  } catch (err) {
    console.log(err);
  }
})();

// 🟢 BOT INDULÁS
dexter.once("ready", () => {
  console.log(`✅ Bejelentkezve: ${dexter.user.tag}`);
});

// 🟢 SLASH COMMAND KEZELÉS
dexter.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "szamolas") {
    const channel = interaction.options.getChannel("csatorna");

    gameChannel = channel.id;
    lastNumber = null;

    return interaction.reply(`✅ Számolás elindítva itt: ${channel}`);
  }
});

// 🟢 ÜZENETEK KEZELÉSE
dexter.on("messageCreate", message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // 👋 SZIA
  if (content === "!szia") {
    return message.channel.send(
      "Szia 👋 én Dexter vagyok, a szerver botja.\n" +
      "Folyamatosan fejlődöm 🤖\n" +
      "Miben segíthetek?"
    );
  }

  // 🧢 MARKO
  if (content === "marko") {
    return message.channel.send("Poló 👕");
  }

  // 🧮 SZÁMOLÁS JÁTÉK
  if (!gameChannel) return;
  if (message.channel.id !== gameChannel) return;

  const num = parseInt(content);
  if (isNaN(num)) return;

  if (lastNumber === null) {
    lastNumber = num;
    return message.react("🟢");
  }

  if (num === lastNumber + 1) {
    lastNumber = num;
    message.react("🟢");
  } else {
    message.react("❌");
    message.channel.send(`❌ Rossz! Következő: ${lastNumber + 1}`);
  }

});

client.login(process.env.TOKEN);
