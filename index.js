const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
require('dotenv').config();

const config = require('./src/config');
const { commands } = require('./src/commands/registry');
const { ensureFiles } = require('./src/utils/storage');
const { handleInteraction } = require('./src/events/interactions');
const { memberJoin, memberLeave } = require('./src/events/members');
const { cacheMessage, messageDelete } = require('./src/events/logs');
const { checkGiveaways } = require('./src/systems/giveaways');

if (!process.env.TOKEN) {
  console.log('Missing TOKEN in .env');
  process.exit(1);
}

ensureFiles();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.once('clientReady', async () => {
  console.log(`[ACE BOT] Connected as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'ACE BYPASS', type: 3 }],
    status: 'dnd'
  });

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, config.guildId), { body: commands });
  console.log('[ACE BOT] Slash commands registered.');
  console.log('[ACE BOT] Runtime owner protection enabled.');

  setInterval(() => checkGiveaways(client), 15000);
});

client.on('interactionCreate', interaction => handleInteraction(client, interaction));
client.on('guildMemberAdd', member => memberJoin(client, member));
client.on('guildMemberRemove', member => memberLeave(client, member));
client.on('messageCreate', message => cacheMessage(message));
client.on('messageDelete', message => messageDelete(client, message));

client.login(process.env.TOKEN);
