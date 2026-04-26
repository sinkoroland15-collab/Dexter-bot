const { Client, GatewayIntentBits } = require("discord.js");

const dexter = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

dexter.once("ready", () => {
  console.log(`✅ Dexter elindult: ${dexter.user.tag}`);
});

dexter.on("messageCreate", message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().trim();

  // 🧢 MARKO PARANCS
  if (content === "marko") {
    return message.channel.send("Poló 👕");
  }

  // 👋 SZIA PARANCS
  if (content === "!szia") {
    return message.channel.send(
      "Szia 👋 én Dexter vagyok, a szerver botja.\n" +
      "Folyamatosan fejlődöm 🤖\n" +
      "Miben segíthetek?"
    );
  }
  }  
          });

client.login(process.env.TOKEN);
