const config = require('../config');
const { baseEmbed } = require('../utils/embeds');

const messageCache = new Map();
const MAX_CACHE = 3000;

function rememberMessage(message) {
  if (!message.guild || message.author?.bot) return;
  messageCache.set(message.id, {
    id: message.id,
    authorId: message.author.id,
    authorTag: message.author.tag,
    channelId: message.channelId,
    content: message.content || '',
    attachments: [...message.attachments.values()].map(a => a.url),
    embeds: message.embeds.map(e => ({ title: e.title, description: e.description, url: e.url })),
    createdAt: message.createdAt
  });
  if (messageCache.size > MAX_CACHE) messageCache.delete(messageCache.keys().next().value);
}

async function handleMessageDelete(client, message) {
  try {
    if (!message.guild) return;
    const saved = messageCache.get(message.id);
    if (message.partial) await message.fetch().catch(() => {});
    const author = message.author || (saved ? { id:saved.authorId, tag:saved.authorTag, bot:false, toString:()=>`<@${saved.authorId}>` } : null);
    if (author?.bot) return;
    const logs = await client.channels.fetch(config.ids.deletedLogs).catch(() => null);
    if (!logs) return;
    const content = message.content || saved?.content || 'No text content detected. Message was uncached or attachment/embed only.';
    const attachments = message.attachments?.size ? [...message.attachments.values()].map(a=>a.url) : (saved?.attachments || []);
    const e = baseEmbed().setTitle('Deleted Message').addFields(
      { name:'Author', value: author ? `${author} / \`${author.id}\`` : 'Unknown user. The message was not cached.', inline:false },
      { name:'Channel', value:`<#${message.channelId || saved?.channelId}> / \`${message.channelId || saved?.channelId}\``, inline:false },
      { name:'Content', value:String(content).slice(0,3900), inline:false },
      { name:'Message ID', value:`\`${message.id}\``, inline:false }
    );
    if (attachments.length) e.addFields({ name:'Attachments', value:attachments.join('\n').slice(0,3900) });
    const embeds = message.embeds?.length ? message.embeds : (saved?.embeds || []);
    if (embeds.length) e.addFields({ name:'Embed Data', value:embeds.map((x,i)=>`Embed ${i+1}\n${x.title ? `Title: ${x.title}\n` : ''}${x.description ? `Description: ${x.description}\n` : ''}${x.url ? `URL: ${x.url}` : ''}`).join('\n\n').slice(0,3900) || 'Embed detected.' });
    await logs.send({ embeds:[e] });
    messageCache.delete(message.id);
  } catch (err) { console.log('[DELETE LOG ERROR]', err); }
}
module.exports = { rememberMessage, handleMessageDelete };
