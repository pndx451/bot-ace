const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
require('dotenv').config();

const config = require('./src/config');
const { commands } = require('./src/commands');
const { ensureStorage } = require('./src/utils/storage');
const { handleInteractions, checkGiveaways } = require('./src/handlers/interactions');
const { handleMemberJoin, handleMemberLeave } = require('./src/handlers/members');
const { rememberMessage, handleMessageDelete } = require('./src/handlers/logs');

ensureStorage();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

async function syncOwnerCommandVisibility(rest, appId, guildId, registeredCommands) {
  const permissions = config.owners.map(id => ({ id, type: 2, permission: true }));
  for (const command of registeredCommands) {
    try {
      await rest.put(`/applications/${appId}/guilds/${guildId}/commands/${command.id}/permissions`, { body: { permissions } });
    } catch (err) {
      console.log(`[COMMAND PERMISSIONS] Could not lock /${command.name}. Runtime protection is still enabled.`);
    }
  }
}

client.once('clientReady', async () => {
  console.log(`[ACE BOT] Connected as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'ACE BYPASS', type: 3 }],
    status: 'dnd'
  });

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const guildId = process.env.GUILD_ID || config.ids.guild;

  const registered = await rest.put(
    Routes.applicationGuildCommands(client.user.id, guildId),
    { body: commands }
  );

  await syncOwnerCommandVisibility(rest, client.user.id, guildId, registered);

  console.log('[ACE BOT] Slash commands registered.');
  console.log('[ACE BOT] Owner-only runtime protection enabled.');

  setInterval(() => checkGiveaways(client), 15000);
});

client.on('interactionCreate', interaction => handleInteractions(client, interaction));
client.on('guildMemberAdd', member => handleMemberJoin(client, member));
client.on('guildMemberRemove', member => handleMemberLeave(client, member));
client.on('messageCreate', message => rememberMessage(message));
client.on('messageDelete', message => handleMessageDelete(client, message));

process.on('unhandledRejection', err => console.log('[UNHANDLED REJECTION]', err));
process.on('uncaughtException', err => console.log('[UNCAUGHT EXCEPTION]', err));

client.login(process.env.TOKEN);
