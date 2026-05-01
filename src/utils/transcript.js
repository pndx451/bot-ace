const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config');
const { baseEmbed } = require('./embeds');

async function buildTranscript(channel) {
  let messages = [];
  let lastId;
  while (messages.length < 1000) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!fetched || !fetched.size) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
  }
  messages = messages.reverse();
  const lines = [];
  lines.push(`ACE BYPASS Ticket Transcript`);
  lines.push(`Ticket: #${channel.name}`);
  lines.push(`Channel ID: ${channel.id}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('='.repeat(60));
  for (const msg of messages) {
    lines.push(`[${msg.createdAt.toLocaleString()}] ${msg.author?.tag || 'Unknown'} (${msg.author?.id || 'Unknown'}):`);
    lines.push(msg.content || '[No text content]');
    if (msg.attachments?.size) {
      for (const att of msg.attachments.values()) lines.push(`Attachment: ${att.url}`);
    }
    lines.push('-'.repeat(60));
  }
  const file = path.join(config.paths.data, `${channel.id}-transcript.txt`);
  fs.writeFileSync(file, lines.join('\n'));
  return file;
}

async function sendTranscript(client, channel, user) {
  const file = await buildTranscript(channel);
  const logs = await client.channels.fetch(config.ids.ticketLogs).catch(() => null);
  if (!logs) return;
  await logs.send({
    embeds: [baseEmbed().setTitle('Ticket Transcript').addFields(
      { name: 'Ticket', value: `${channel.name}`, inline: true },
      { name: 'User', value: `${user} / ${user.id}`, inline: true },
      { name: 'Channel ID', value: `\`${channel.id}\`` }
    )],
    files: [new AttachmentBuilder(file)]
  });
}

module.exports = { buildTranscript, sendTranscript };
