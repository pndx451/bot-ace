const { SlashCommandBuilder, ChannelType } = require('discord.js');

function targetChannelOption(o) {
  return o.setName('channel').setDescription('Target channel. Leave empty to use this channel.').addChannelTypes(ChannelType.GuildText).setRequired(false);
}

const planChoices = [
  { name: 'Basic', value: 'Basic' },
  { name: 'Advanced', value: 'Advanced' },
  { name: 'Private', value: 'Private' },
  { name: 'Control Phone', value: 'Control Phone' }
];

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('Send all main panels in the selected channel.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('ticketpanel').setDescription('Send a ticket panel.').addStringOption(o => o.setName('type').setDescription('Ticket type').setRequired(true).addChoices({ name: 'Buy', value: 'buy' }, { name: 'Support', value: 'support' })).addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('rename').setDescription('Rename the current ticket.').addStringOption(o => o.setName('name').setDescription('New ticket name').setRequired(true)),
  new SlashCommandBuilder().setName('claim').setDescription('Claim the current ticket.'),
  new SlashCommandBuilder().setName('adduser').setDescription('Add a user to this ticket.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('removeuser').setDescription('Remove a user from this ticket.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('tos').setDescription('Send Terms of Service.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('plans').setDescription('Send the plans embed.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('payments').setDescription('Send payment methods.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('status').setDescription('Send service status.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('embed').setDescription('Open the custom embed editor.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('announce').setDescription('Open the announcement editor.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('multilangembed').setDescription('Open the automatic 3-language embed editor.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('giveaway').setDescription('Create a giveaway.').addStringOption(o => o.setName('title').setDescription('Giveaway title').setRequired(true)).addStringOption(o => o.setName('plan').setDescription('Plan').setRequired(true).addChoices(...planChoices)).addStringOption(o => o.setName('time').setDescription('10m, 2h, 1d, 1y').setRequired(true)).addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('feedbacks').setDescription('Send a feedback embed.').addStringOption(o => o.setName('title').setDescription('Feedback title').setRequired(true)).addAttachmentOption(o => o.setName('image').setDescription('Feedback image').setRequired(true)).addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('lista').setDescription('View the saved user list.'),
  new SlashCommandBuilder().setName('addlista').setDescription('Add someone to the list.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('blacklist').setDescription('Block a user from opening tickets.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder().setName('unblacklist').setDescription('Remove user from ticket blacklist.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('customer').setDescription('Give the customer role.').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  new SlashCommandBuilder().setName('stock').setDescription('Show plan stock.').addChannelOption(targetChannelOption),
  new SlashCommandBuilder().setName('setstock').setDescription('Set plan stock.').addStringOption(o => o.setName('plan').setDescription('Plan').setRequired(true).addChoices(...planChoices)).addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('Delete messages.').addIntegerOption(o => o.setName('amount').setDescription('1-100').setRequired(true)),
  new SlashCommandBuilder().setName('lock').setDescription('Lock current channel.'),
  new SlashCommandBuilder().setName('unlock').setDescription('Unlock current channel.'),
  new SlashCommandBuilder().setName('youtube').setDescription('Send YouTube updates/showcases embed.').addChannelOption(targetChannelOption)
].map(c => c.toJSON());

module.exports = { commands };
