const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function adminOnly(cmd) {
  return cmd.setDMPermission(false).setDefaultMemberPermissions('0');
}

const commands = [
  adminOnly(new SlashCommandBuilder().setName('setup').setDescription('Send all main panels automatically.')),
  adminOnly(new SlashCommandBuilder().setName('ticketpanel').setDescription('Send a ticket panel.').addStringOption(o => o.setName('type').setDescription('Panel type').setRequired(true).addChoices({ name:'Buy', value:'buy' }, { name:'Support', value:'support' }))),
  adminOnly(new SlashCommandBuilder().setName('rename').setDescription('Rename the current ticket.').addStringOption(o => o.setName('name').setDescription('New ticket name').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('claim').setDescription('Claim the current ticket.')),
  adminOnly(new SlashCommandBuilder().setName('adduser').setDescription('Add a user to the ticket.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('removeuser').setDescription('Remove a user from the ticket.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('tos').setDescription('Send the Terms of Service embed.')),
  adminOnly(new SlashCommandBuilder().setName('plans').setDescription('Send plans embed.')),
  adminOnly(new SlashCommandBuilder().setName('payments').setDescription('Send payments embed in 3 languages.')),
  adminOnly(new SlashCommandBuilder().setName('channel').setDescription('Send Updates/Showcases YouTube embed.')),
  adminOnly(new SlashCommandBuilder().setName('payment').setDescription('Register a payment.').addUserOption(o => o.setName('buyer').setDescription('Buyer').setRequired(true)).addUserOption(o => o.setName('seller').setDescription('Seller').setRequired(true)).addStringOption(o => o.setName('plan').setDescription('Sold plan').setRequired(true).addChoices({ name:'Basic', value:'Basic' }, { name:'Advanced', value:'Advanced' }, { name:'Private', value:'Private' }, { name:'Control Phone', value:'Control Phone' })).addAttachmentOption(o => o.setName('proof').setDescription('Payment proof image').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('giveaway').setDescription('Create a giveaway.').addStringOption(o => o.setName('title').setDescription('Giveaway title').setRequired(true)).addStringOption(o => o.setName('plan').setDescription('Giveaway plan').setRequired(true).addChoices({ name:'Basic', value:'Basic' }, { name:'Advanced', value:'Advanced' }, { name:'Private', value:'Private' }, { name:'Control Phone', value:'Control Phone' })).addStringOption(o => o.setName('time').setDescription('10m, 2h, 1d, 1y').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('feedbacks').setDescription('Send a feedback embed.').addStringOption(o => o.setName('title').setDescription('Feedback title').setRequired(true)).addAttachmentOption(o => o.setName('image').setDescription('Required image').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('embed').setDescription('Create a custom white embed.').addStringOption(o => o.setName('title').setDescription('Title').setRequired(false)).addStringOption(o => o.setName('subtitle').setDescription('Subtitle').setRequired(false)).addStringOption(o => o.setName('description').setDescription('Description').setRequired(false)).addStringOption(o => o.setName('image').setDescription('Image URL').setRequired(false))),
  adminOnly(new SlashCommandBuilder().setName('multilangembed').setDescription('Create a 3-language embed automatically.').addStringOption(o => o.setName('title').setDescription('Title').setRequired(true)).addStringOption(o => o.setName('description').setDescription('Description').setRequired(true)).addAttachmentOption(o => o.setName('image').setDescription('Optional image').setRequired(false))),
  adminOnly(new SlashCommandBuilder().setName('status').setDescription('Send service status embed.')),
  adminOnly(new SlashCommandBuilder().setName('lista').setDescription('View the full list.')),
  adminOnly(new SlashCommandBuilder().setName('addlista').setDescription('Add someone to the list.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('blacklist').setDescription('Block a user from opening tickets.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))),
  adminOnly(new SlashCommandBuilder().setName('unblacklist').setDescription('Remove a user from blacklist.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('customer').setDescription('Give the customer role.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('stock').setDescription('Show plan stock.')),
  adminOnly(new SlashCommandBuilder().setName('setstock').setDescription('Set plan stock.').addStringOption(o => o.setName('plan').setDescription('Plan').setRequired(true).addChoices({ name:'Basic', value:'Basic' }, { name:'Advanced', value:'Advanced' }, { name:'Private', value:'Private' }, { name:'Control Phone', value:'Control Phone' })).addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('announce').setDescription('Send a premium announcement.').addStringOption(o => o.setName('title').setDescription('Title').setRequired(true)).addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)).addAttachmentOption(o => o.setName('image').setDescription('Optional image').setRequired(false))),
  adminOnly(new SlashCommandBuilder().setName('clear').setDescription('Delete messages.').addIntegerOption(o => o.setName('amount').setDescription('1-100').setRequired(true))),
  adminOnly(new SlashCommandBuilder().setName('lock').setDescription('Lock current channel.')),
  adminOnly(new SlashCommandBuilder().setName('unlock').setDescription('Unlock current channel.'))
].map(c => c.toJSON());

module.exports = { commands };
