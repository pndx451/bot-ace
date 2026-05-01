const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { readJson } = require('../utils/storage');
const { baseEmbed, ok, error, sendEmbed } = require('../utils/embeds');
const { sendTranscript } = require('../utils/transcript');

function cleanName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'ticket';
}

async function getOrCreateCategory(guild, name) {
  let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase());
  if (!cat) cat = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  return cat;
}

function ticketButtons(closed = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('📌').setDisabled(closed),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📄'),
    new ButtonBuilder().setCustomId(closed ? 'ticket_reopen' : 'ticket_close').setLabel(closed ? 'Re Open' : 'Close').setStyle(closed ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji(closed ? '🔓' : '🔒')
  );
}

async function sendTicketPanel(channel, type) {
  const title = type === 'buy' ? 'Buy Ticket' : 'Support Ticket';
  const description = type === 'buy'
    ? '• Open a ticket to purchase or ask about a plan.\n• Staff will assist you as soon as possible.'
    : '• Open a ticket if you need help.\n• Explain your issue clearly.';
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_open_${type}`).setLabel(title).setStyle(ButtonStyle.Secondary).setEmoji(type === 'buy' ? '🛒' : '🛠️')
  );
  return channel.send({ embeds: [baseEmbed().setTitle(title).setDescription(description).setImage('attachment://banner.png')], components: [row], files: [require('../utils/embeds').bannerFile()].filter(Boolean) });
}

async function openTicket(interaction, type) {
  const blacklist = readJson(config.paths.blacklist, []);
  if (blacklist.some(x => x.id === interaction.user.id)) {
    return interaction.reply({ embeds: [error('You are blacklisted from opening tickets.')], ephemeral: true });
  }
  const guild = interaction.guild;
  const category = await getOrCreateCategory(guild, type === 'buy' ? 'Tickets Buy' : 'Tickets Support');
  const existing = guild.channels.cache.find(c => c.topic === interaction.user.id && c.parentId === category.id);
  if (existing) return interaction.reply({ embeds: [error(`You already have an open ticket: ${existing}`)], ephemeral: true });

  const channel = await guild.channels.create({
    name: cleanName(`${type}-${interaction.user.username}`),
    type: ChannelType.GuildText,
    parent: category.id,
    topic: interaction.user.id,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ...config.owners.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles] }))
    ]
  });
  await sendEmbed(channel, baseEmbed().setTitle(type === 'buy' ? 'Buy Ticket' : 'Support Ticket').setDescription([
    `${interaction.user}, welcome to your ticket.`,
    '',
    `• Staff: ${config.owners.map(id => `<@${id}>`).join(' ')}`,
    '• Please explain what you need.',
    '• Use the buttons below to manage this ticket.'
  ].join('\n')), { content: `${config.owners.map(id => `<@${id}>`).join(' ')} ${interaction.user}` });
  await channel.send({ components: [ticketButtons(false)] });
  const logs = await interaction.client.channels.fetch(config.ids.ticketLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Ticket Opened').addFields({ name: 'User', value: `${interaction.user} / ${interaction.user.id}` }, { name: 'Type', value: type }, { name: 'Channel', value: `${channel}` }), { banner: false });
  return interaction.reply({ embeds: [ok(`Ticket created: ${channel}`)], ephemeral: true });
}

async function closeTicket(client, channel, user) {
  await sendTranscript(client, channel, user).catch(() => {});
  const category = await getOrCreateCategory(channel.guild, 'Logs Ticket');
  if (channel.topic) await channel.permissionOverwrites.edit(channel.topic, { ViewChannel: false, SendMessages: false }).catch(() => {});
  await channel.setParent(category.id).catch(() => {});
  await sendEmbed(channel, baseEmbed().setTitle('Ticket Closed').setDescription(`• Closed by ${user}\n• Auto transcript sent to <#${config.ids.ticketLogs}>.`), { banner: false });
  await channel.send({ components: [ticketButtons(true)] });
}

module.exports = { sendTicketPanel, openTicket, closeTicket, ticketButtons, cleanName, getOrCreateCategory };
