const fs = require('fs');
const path = require('path');
const config = require('../config');
const { baseEmbed } = require('./embeds');

async function buildTranscript(channel) {
  let messages = [], lastId;
  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!fetched || !fetched.size) break;
    messages.push(...fetched.values()); lastId = fetched.last().id;
    if (messages.length >= 1000) break;
  }
  messages = messages.reverse();
  let out = `ACE BYPASS Ticket Transcript\nTicket: #${channel.name}\nChannel ID: ${channel.id}\nDate: ${new Date().toLocaleString()}\n----------------------------------------\n\n`;
  for (const m of messages) {
    out += `[${m.createdAt.toLocaleString()}] ${m.author?.tag || 'Unknown'} (${m.author?.id || 'Unknown'}): ${m.content || ''}\n`;
    if (m.attachments?.size) for (const a of m.attachments.values()) out += `Attachment: ${a.url}\n`;
    if (m.embeds?.length) for (const e of m.embeds) out += `Embed: ${e.title || ''} ${e.description || ''}\n`;
    out += '\n';
  }
  const file = path.join(config.paths.data, `${channel.id}-transcript.txt`);
  fs.writeFileSync(file, out);
  return file;
}
async function sendAutoTranscript(client, channel, closedBy, reason='No reason provided') {
  const file = await buildTranscript(channel);
  const logs = await client.channels.fetch(config.ids.ticketLogs).catch(() => null);
  if (!logs) return;
  await logs.send({
    embeds: [baseEmbed().setTitle('Ticket Transcript').addFields(
      { name:'Ticket', value:`${channel.name}`, inline:true },
      { name:'Closed By', value:`${closedBy} / ${closedBy.id}`, inline:true },
      { name:'Reason', value:reason },
      { name:'Channel ID', value:`${channel.id}` }
    )],
    files: [file]
  });
}
module.exports = { buildTranscript, sendAutoTranscript };
