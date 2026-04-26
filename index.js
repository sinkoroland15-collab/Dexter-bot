const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

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

// 🟢 SLASH COMMANDOK
const commands = [
  new SlashCommandBuilder()
    .setName("udvozlo")
    .setDescription("Belépő csatorna beállítása")
    .addChannelOption(option =>
      option.setName("csatorna")
        .setDescription("Üdvözlő csatorna")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kilepo")
    .setDescription("Kilépő csatorna beállítása")
    .addChannelOption(option =>
      option.setName("csatorna")
        .setDescription("Kilépő csatorna")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping válasz"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Parancsok listája")
].map(c => c.toJSON());

// 🟢 REGISZTRÁLÁS
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash commandok regisztrálva");
  } catch (err) {
    console.log(err);
  }
})();

// 🟢 READY
dexter.once("ready", () => {
  console.log(`✅ Bejelentkezve: ${dexter.user.tag}`);
});

// 🟢 SLASH HANDLER
dexter.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "udvozlo") {
    const channel = interaction.options.getChannel("csatorna");
    welcomeChannelId = channel.id;
    return interaction.reply(`✅ Üdvözlő csatorna: ${channel}`);
  }

  if (interaction.commandName === "kilepo") {
    const channel = interaction.options.getChannel("csatorna");
    leaveChannelId = channel.id;
    return interaction.reply(`✅ Kilépő csatorna: ${channel}`);
  }

  if (interaction.commandName === "ping") {
    return interaction.reply("Ping 🏓");
  }

  if (interaction.commandName === "help") {
    return interaction.reply(
      "📌 Parancsok:\n\n" +
      "🏓 /ping\n" +
      "❓ /help\n" +
      "⚙️ /udvozlo\n" +
      "🚪 /kilepo\n" +
      "👕 marko\n" +
      "💬 szia dexter"
    );
  }
});

// 🟢 CHAT PARANCSOK
dexter.on("messageCreate", message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  if (content === "szia dexter") {
    return message.channel.send(
      "Szia 👋 én Dexter vagyok a szerver botja 🤖"
    );
  }

  if (content === "marko") {
    return message.channel.send("Poló 👕");
  }
});

// 🟢 BELÉPÉS (EMBED + TAG RANG)
dexter.on("guildMemberAdd", async member => {
  const role = member.guild.roles.cache.find(r => r.name === "Tag");

  if (role) {
    try {
      await member.roles.add(role);
    } catch (err) {
      console.log(err);
    }
  }

  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("👋 Új tag érkezett!")
    .setDescription(
      `Szia ${member}!\n\n` +
      `🤖 Dexter üdvözöl a szerveren!\n` +
      `🎉 Megkaptad a **Tag** rangot!`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Dexter Bot 🤖" });

  channel.send({ embeds: [embed] });
});

// 🟢 KILÉPÉS (EMBED)
dexter.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.get(leaveChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle("🚪 Tag kilépett")
    .setDescription(
      `😢 ${member.user.tag} elhagyta a szervert.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Dexter Bot 🤖" });

  channel.send({ embeds: [embed] });
});

// 🟢 LOGIN
});

client.login(process.env.TOKEN);

