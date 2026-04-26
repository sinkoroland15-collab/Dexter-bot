const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
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

// 🟢 CSATORNÁK
let welcomeChannelId = null;
let leaveChannelId = null;

// 🟢 SZÁMOLÓ JÁTÉK
let gameChannelId = null;
let lastNumber = null;
let lastUserId = null;

// 🟢 XP RENDSZER
const DATA_FILE = "./xpdata.json";

let userXP = {};
let userLevel = {};

// 🔄 BETÖLTÉS
if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  userXP = data.userXP || {};
  userLevel = data.userLevel || {};
}

// 💾 MENTÉS
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    userXP,
    userLevel
  }, null, 2));
}

// ➕ XP
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

// ➖ XP
function removeXP(userId) {
  if (!userXP[userId]) userXP[userId] = 0;

  userXP[userId] -= 15;
  if (userXP[userId] < 0) userXP[userId] = 0;

  saveData();
}

// 🟢 READY
dexter.once("ready", () => {
  console.log(`✅ Bejelentkezve: ${dexter.user.tag}`);
});

// 🟢 MESSAGE PARANCSOK
dexter.on("messageCreate", message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // 🏓 PING (FIX: !ping)
  if (content === "!ping") {
    return message.reply("Ping 🏓");
  }

  // 👋 SZIA DEXTER
  if (content === "szia dexter") {
    return message.channel.send("Szia 👋 Dexter itt 🤖");
  }

  // 👕 MARKO
  if (content === "marko") {
    return message.channel.send("Poló 👕");
  }

  // 🧮 SZÁMOLÓ JÁTÉK
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

      const leveledUp = addXP(message.author.id);

      if (leveledUp) {
        message.channel.send(
          `🎉 ${message.author} szintet lépett!\n🏆 Level: ${userLevel[message.author.id]}`
        );
      }

    } else {
      message.react("💥");
      removeXP(message.author.id);

      message.channel.send(
        `💥 Hiba!\n❌ -15 XP\n👉 Következő: ${lastNumber + 1}`
      );
    }
  }
});

// 🟢 BELÉPÉS
dexter.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("👋 Új tag!")
    .setDescription(`${member} belépett a szerverre!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0x00ffcc);

  channel.send({ embeds: [embed] });
});

// 🟢 KILÉPÉS
dexter.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.get(leaveChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🚪 Kilépett")
    .setDescription(`${member.user.tag} kilépett a szerverről`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0xff0000);

  channel.send({ embeds: [embed] });
});

// 🔑 LOGIN
dexter.login(process.env.DISCORD_TOKEN);

