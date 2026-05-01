const config = require('../config');
const { baseEmbed, sendEmbed } = require('../utils/embeds');

const messageCache = new Map();
const MAX_CACHE = 2000;

function cacheMessage(message) {
  if (!message.guild || message.author?.bot) return;
  messageCache.set(message.id, {
    id: message.id,
    authorTag: message.author?.tag,
    authorId: message.author?.id,
    channelId: message.channelId,
    content: message.content,
    attachments: [...(message.attachments?.values() || [])].map(a => a.url),
    createdAt: message.createdAt
  });
  if (messageCache.size > MAX_CACHE) messageCache.delete(messageCache.keys().next().value);
}

async function messageDelete(client, message) {
  if (!message.guild) return;
  const cached = messageCache.get(message.id);
  const author = message.author || null;
  if (author?.bot) return;
  const data = cached || {
    id: message.id,
    authorTag: author?.tag || 'Unknown',
    authorId: author?.id || 'Unknown',
    channelId: message.channelId || message.channel?.id,
    content: message.content || null,
    attachments: [...(message.attachments?.values() || [])].map(a => a.url),
    createdAt: message.createdAt
  };
  const logs = await client.channels.fetch(config.ids.deletedLogs).catch(() => null);
  if (!logs) return;
  await sendEmbed(logs, baseEmbed().setTitle('Deleted Message').addFields(
    { name: 'Author', value: data.authorId !== 'Unknown' ? `<@${data.authorId}> / \`${data.authorId}\`` : 'Unknown user. Message was not cached.', inline: false },
    { name: 'Channel', value: `<#${data.channelId}> / \`${data.channelId}\``, inline: false },
    { name: 'Content', value: data.content ? data.content.slice(0, 3900) : 'No text content detected.', inline: false },
    { name: 'Message ID', value: `\`${data.id}\`` }
  ), { banner: false });
}

module.exports = { cacheMessage, messageDelete };
