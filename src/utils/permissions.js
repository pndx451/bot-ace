const config = require('../config');

function isOwner(userId) {
  return config.owners.includes(userId);
}

async function guard(interaction) {
  if (isOwner(interaction.user.id)) return true;
  const payload = { content: '❌ You do not have permission to use this command.', ephemeral: true };
  if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
  else await interaction.reply(payload).catch(() => {});
  return false;
}

module.exports = { isOwner, guard };
