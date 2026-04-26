const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs");
require("dotenv").config();

const dexter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 🟢 GAME + XP
let gameChannelId = null;
let lastNumber = null;
let lastUserId = null;

const DATA_FILE = "./xpdata.json";

let userXP = {};
let userLevel = {};

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  userXP = data.userXP || {};
  userLevel = data.userLevel || {};
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ userXP, userLevel }, null, 2));
}

function addXP(userId) {
  if (!userXP[userId]) userXP[userId] = 0;
  if (!userLevel[userId]) userLevel[userId] = 1;

  userXP[userId] += 10;

  const needed = userLevel[userId] * 50;

  if (userXP[userId] >= needed) {
    userXP[userId] = 0;
    userLevel[userId]++;
    saveData();
    return true;
  }

  saveData();
  return false;
}

function removeXP(userId) {
  if (!userXP[userId]) userXP[userId] = 0;
  userXP[userId] -= 15;
  if (userXP[userId] < 0) userXP[userId] = 0;
  saveData();
}

// 🟢 SLASH COMMANDOK
const commands = [
  new SlashCommandBuilder()
    .setName("szamolas")
    .setDescription("Számolós játék")
    .addChannelOption(opt =>
      opt.setName("csatorna").setDescription("Csatorna").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rang_valaszto")
    .setDescription("Játékrang választó menü")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
})();

// 🟢 READY
dexter.once("ready", () => {
  console.log(`✅ Bejelentkezve: ${dexter.user.tag}`);
});

// 🟢 SLASH HANDLER
dexter.on("interactionCreate", async interaction => {

  // 🧮 SZÁMOLÁS
  if (interaction.commandName === "szamolas") {
    const channel = interaction.options.getChannel("csatorna");

    gameChannelId = channel.id;
    lastNumber = null;
    lastUserId = null;

    return interaction.reply(`🧮 Játék indul itt: ${channel}`);
  }

  // 🎮 RANG VÁLASZTÓ
  if (interaction.commandName === "rang_valaszto") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("game_roles")
      .setPlaceholder("🎮 Válassz játékrangot!")
      .addOptions([
        { label: "Minecraft", value: "Minecraft" },
        { label: "GTA V", value: "GTA V" },
        { label: "Roblox", value: "Roblox" },
        { label: "League of Legends", value: "League of Legends" },
        { label: "Fall Guys", value: "Fall Guys" },
        { label: "CoD Warzone", value: "CoD Warzone" },
        { label: "Euro Truck Simulator 2", value: "Euro Truck Simulator 2" },
        { label: "Farming Simulator", value: "Farming Simulator" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    return interaction.reply({
      content: "🎮 Válaszd ki a játékrangodat:",
      components: [row]
    });
  }

  // 🎮 ROLE KEZELÉS + CSATORNA UNLOCK
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "game_roles") {

      const roleName = interaction.values[0];
      const member = interaction.member;

      const role = interaction.guild.roles.cache.find(r => r.name === roleName);

      if (!role) {
        return interaction.reply({ content: "❌ Role nem található!", ephemeral: true });
      }

      const unlockMap = {
        "Minecraft": "minecraft",
        "GTA V": "gta-v",
        "Roblox": "roblox",
        "League of Legends": "lol"
      };

      // ✔ TOGGLE ROLE
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);

        const channelName = unlockMap[roleName];
        if (channelName) {
          const ch = interaction.guild.channels.cache.find(c => c.name === channelName);
          if (ch) {
            ch.permissionOverwrites.edit(member.id, { ViewChannel: false });
          }
        }

        return interaction.reply({ content: `❌ Levetted: ${roleName}`, ephemeral: true });
      } else {
        await member.roles.add(role);

        const channelName = unlockMap[roleName];
        if (channelName) {
          const ch = interaction.guild.channels.cache.find(c => c.name === channelName);
          if (ch) {
            ch.permissionOverwrites.edit(member.id, { ViewChannel: true });
          }
        }

        return interaction.reply({ content: `✔️ Megkaptad: ${roleName}`, ephemeral: true });
      }
    }
  }
});

// 🟢 MESSAGE
dexter.on("messageCreate", message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  if (content === "!ping") {
    return message.reply("🤖 Dexter aktív!");
  }

  if (gameChannelId && message.channel.id === gameChannelId) {
    const num = parseInt(content);
    if (isNaN(num)) return;

    if (lastUserId === message.author.id) {
      message.react("❌");
      return message.reply("🚫 Várj más írjon!");
    }

    if (lastNumber === null) {
      lastNumber = num;
      lastUserId = message.author.id;
      return message.react("✔️");
    }

    if (num === lastNumber + 1) {
      lastNumber = num;
      lastUserId = message.author.id;

      message.react("✔️");

      addXP(message.author.id);

    } else {
      message.react("💥");
      removeXP(message.author.id);

      message.channel.send(`💥 Hiba! Következő: ${lastNumber + 1}`);
    }
  }
});

// 🔑 LOGIN
dexter.login(process.env.DISCORD_TOKEN);
