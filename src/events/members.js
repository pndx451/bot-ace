const config = require('../config');
const { baseEmbed, sendEmbed } = require('../utils/embeds');

async function memberJoin(client, member) {
  const role = member.guild.roles.cache.get(config.ids.autoRole);
  if (role) await member.roles.add(role).catch(err => console.log('[AUTO ROLE ERROR]', err.message));
  const joins = await client.channels.fetch(config.ids.joins).catch(() => null);
  if (joins) await sendEmbed(joins, baseEmbed().setTitle('Welcome to ACE BYPASS').setDescription(`• **User:** ${member}\n• **Username:** ${member.user.tag}\n• **ID:** \`${member.id}\``), { banner: false });
  const logs = await client.channels.fetch(config.ids.memberLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Member Joined').setDescription(`• ${member} joined the server.\n• Auto Role: ${role ? `<@&${role.id}>` : 'Role not found'}`), { banner: false });
}

async function memberLeave(client, member) {
  const leaves = await client.channels.fetch(config.ids.leaves).catch(() => null);
  if (leaves) await sendEmbed(leaves, baseEmbed().setTitle('Left ACE BYPASS').setDescription(`• **User:** ${member.user?.tag || member.id}\n• **ID:** \`${member.id}\``), { banner: false });
  const logs = await client.channels.fetch(config.ids.memberLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Member Left').setDescription(`• ${member.user?.tag || member.id} left the server.`), { banner: false });
}

module.exports = { memberJoin, memberLeave };
