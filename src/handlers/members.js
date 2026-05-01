const config = require('../config');
const { baseEmbed } = require('../utils/embeds');

async function handleMemberJoin(client, member) {
  try {
    const role = member.guild.roles.cache.get(config.ids.autoRole);
    if (role) await member.roles.add(role).catch(() => {});
    const joins = await client.channels.fetch(config.ids.joins).catch(() => null);
    if (joins) await joins.send({ embeds: [baseEmbed().setTitle('Welcome to ACE BYPASS').setDescription(`${member} joined ACE BYPASS.`).setThumbnail(member.user.displayAvatarURL({ size: 256 }))] });
    const logs = await client.channels.fetch(config.ids.memberLogs).catch(() => null);
    if (logs) await logs.send({ embeds: [baseEmbed().setTitle('Member Joined').addFields({ name:'User', value:`${member.user.tag} / ${member.id}` }, { name:'Auto Role', value: role ? `<@&${config.ids.autoRole}>` : 'Role not found' })] });
  } catch (e) { console.log('[JOIN ERROR]', e); }
}
async function handleMemberLeave(client, member) {
  const leaves = await client.channels.fetch(config.ids.leaves).catch(() => null);
  if (leaves) await leaves.send({ embeds: [baseEmbed().setTitle('Bye').setDescription(`${member.user?.tag || member.id} left ACE BYPASS.`).setThumbnail(member.user?.displayAvatarURL({ size: 256 }) || null)] });
  const logs = await client.channels.fetch(config.ids.memberLogs).catch(() => null);
  if (logs) await logs.send({ embeds: [baseEmbed().setTitle('Member Left').addFields({ name:'User', value:`${member.user?.tag || 'Unknown'}` }, { name:'ID', value:member.id })] });
}
module.exports = { handleMemberJoin, handleMemberLeave };
