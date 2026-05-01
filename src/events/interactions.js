const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { guard } = require('../utils/permissions');
const { readJson, writeJson } = require('../utils/storage');
const { baseEmbed, ok, error, sendEmbed, replyEmbed, tosEmbed } = require('../utils/embeds');
const { translateThree } = require('../utils/translate');
const { buildPaymentsImage } = require('../utils/paymentsImage');
const { sendTicketPanel, openTicket, closeTicket, cleanName } = require('../systems/tickets');
const { createGiveaway, enterGiveaway } = require('../systems/giveaways');
const { buildTranscript, sendTranscript } = require('../utils/transcript');

function targetChannel(interaction) {
  return interaction.options?.getChannel('channel') || interaction.channel;
}

function modalId(type, channelId) {
  return `${type}:${channelId}`;
}

function textInput(id, label, style = TextInputStyle.Short, required = false, placeholder = '') {
  return new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(required).setPlaceholder(placeholder).setMaxLength(style === TextInputStyle.Paragraph ? 4000 : 256);
}

async function showEmbedModal(interaction, type, channelId) {
  const names = { embed: 'Custom Embed', announce: 'Announcement', multilang: '3-Language Embed' };
  const modal = new ModalBuilder().setCustomId(modalId(type, channelId)).setTitle(names[type] || 'Embed Editor');
  modal.addComponents(
    new ActionRowBuilder().addComponents(textInput('title', 'Title', TextInputStyle.Short, true, 'Write the title here')),
    new ActionRowBuilder().addComponents(textInput('description', 'Description', TextInputStyle.Paragraph, true, 'Use Shift + Enter for new lines')),
    new ActionRowBuilder().addComponents(textInput('image', 'Image URL / Attachment URL (optional)', TextInputStyle.Short, false, 'https://...'))
  );
  return interaction.showModal(modal);
}

async function handleModal(client, interaction) {
  if (!(await guard(interaction))) return;
  const [type, channelId] = interaction.customId.split(':');
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return interaction.reply({ embeds: [error('Target channel not found.')], ephemeral: true });
  const title = interaction.fields.getTextInputValue('title');
  const description = interaction.fields.getTextInputValue('description');
  const image = interaction.fields.getTextInputValue('image') || '';

  if (type === 'multilang') {
    await interaction.deferReply({ ephemeral: true });
    const t = await translateThree(title, description);
    const desc = [
      '🇺🇸 **English**',
      `• **${t.en.title}**`,
      t.en.description,
      '',
      '• • •',
      '',
      '🇧🇷 **Português**',
      `• **${t.pt.title}**`,
      t.pt.description,
      '',
      '• • •',
      '',
      '🇪🇸 **Español**',
      `• **${t.es.title}**`,
      t.es.description
    ].join('\n');
    const embed = baseEmbed().setTitle('ACE BYPASS').setDescription(desc);
    if (image.startsWith('http')) embed.setThumbnail(image);
    await sendEmbed(channel, embed, { banner: true });
    return interaction.editReply({ embeds: [ok('3-language embed sent.')] });
  }

  const embed = baseEmbed().setTitle(type === 'announce' ? `📢 ${title}` : title).setDescription(description);
  if (image.startsWith('http')) embed.setThumbnail(image);
  await sendEmbed(channel, embed, { banner: true });
  return interaction.reply({ embeds: [ok(`${type === 'announce' ? 'Announcement' : 'Embed'} sent.`)], ephemeral: true });
}

function statusDescription() {
  return [
    '🇺🇸 **English**',
    '• **Basic:** 🟡 **Development**',
    '• **Advanced:** 🟢 **Working**',
    '• **Private:** 🟡 **Development**',
    '• **Control Phone:** 🟡 **Development**',
    '',
    '• • •',
    '',
    '🇧🇷 **Português**',
    '• **Basic:** 🟡 **Development**',
    '• **Advanced:** 🟢 **Working**',
    '• **Private:** 🟡 **Development**',
    '• **Control Phone:** 🟡 **Development**',
    '',
    '• • •',
    '',
    '🇪🇸 **Español**',
    '• **Basic:** 🟡 **Development**',
    '• **Advanced:** 🟢 **Working**',
    '• **Private:** 🟡 **Development**',
    '• **Control Phone:** 🟡 **Development**'
  ].join('\n');
}

function paymentsDescription() {
  return [
    '🇺🇸 **English**',
    '• **PayPal:** payment by PayPal link.',
    '• **Litecoin (LTC):** crypto payment accepted.',
    '• **Card / Gift Card:** card payment through gift card.',
    '',
    '• • •',
    '',
    '🇧🇷 **Português**',
    '• **PayPal:** pagamento por link PayPal.',
    '• **Litecoin (LTC):** pagamento em cripto aceito.',
    '• **Cartão / Gift Card:** pagamento por gift card.',
    '',
    '• • •',
    '',
    '🇪🇸 **Español**',
    '• **PayPal:** pago por link de PayPal.',
    '• **Litecoin (LTC):** pago en cripto aceptado.',
    '• **Tarjeta / Gift Card:** pago por gift card.'
  ].join('\n');
}

async function handleCommand(client, interaction) {
  if (!(await guard(interaction))) return;
  const cmd = interaction.commandName;
  const channel = targetChannel(interaction);

  if (cmd === 'setup') {
    await sendTicketPanel(channel, 'buy');
    await sendTicketPanel(channel, 'support');
    await sendEmbed(channel, baseEmbed().setTitle('ACE BYPASS').setDescription('• Main panels have been created.\n• Use slash commands to manage the server.'), { banner: true });
    return interaction.reply({ embeds: [ok(`Setup sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'ticketpanel') {
    await sendTicketPanel(channel, interaction.options.getString('type'));
    return interaction.reply({ embeds: [ok(`Ticket panel sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'embed') return showEmbedModal(interaction, 'embed', channel.id);
  if (cmd === 'announce') return showEmbedModal(interaction, 'announce', channel.id);
  if (cmd === 'multilangembed') return showEmbedModal(interaction, 'multilang', channel.id);

  if (cmd === 'status') {
    await sendEmbed(channel, baseEmbed().setTitle('Status Bypass Ace').setDescription(statusDescription()).setFooter({ text: `Updated by ${interaction.user.username}` }), { banner: true });
    return interaction.reply({ embeds: [ok(`Status sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'payments') {
    const paymentImage = await buildPaymentsImage().catch(() => null);
    const files = paymentImage ? [paymentImage] : [];
    const embed = baseEmbed().setTitle('Payments').setDescription(paymentsDescription());
    if (paymentImage) embed.setThumbnail('attachment://payments.png');
    await sendEmbed(channel, embed, { banner: true, files });
    return interaction.reply({ embeds: [ok(`Payments sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'tos') {
    await sendEmbed(channel, tosEmbed(), { banner: true });
    return interaction.reply({ embeds: [ok(`Terms sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'plans') {
    await sendEmbed(channel, baseEmbed().setTitle('ACE BYPASS Plans').setDescription([
      '🇺🇸 **English**',
      '• **Basic** — standard access.',
      '• **Advanced** — advanced access.',
      '• **Private** — private access.',
      '• **Control Phone** — phone control plan.',
      '', '• • •', '',
      '🇧🇷 **Português**',
      '• **Basic** — acesso padrão.',
      '• **Advanced** — acesso avançado.',
      '• **Private** — acesso privado.',
      '• **Control Phone** — plano control phone.',
      '', '• • •', '',
      '🇪🇸 **Español**',
      '• **Basic** — acceso estándar.',
      '• **Advanced** — acceso avanzado.',
      '• **Private** — acceso privado.',
      '• **Control Phone** — plan control phone.'
    ].join('\n')), { banner: true });
    return interaction.reply({ embeds: [ok(`Plans sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'youtube') {
    await sendEmbed(channel, baseEmbed().setTitle('Updates / Showcases').setDescription(`• **YouTube:** ${process.env.YOUTUBE_URL || 'https://youtube.com/'}`), { banner: true });
    return interaction.reply({ embeds: [ok(`YouTube embed sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'giveaway') return createGiveaway(interaction, channel, interaction.options.getString('title'), interaction.options.getString('plan'), interaction.options.getString('time'));

  if (cmd === 'feedbacks') {
    const title = interaction.options.getString('title');
    const img = interaction.options.getAttachment('image');
    await channel.send({ content: '# New FeedBack Ace Bypass', embeds: [baseEmbed().setTitle(title).setImage(img.url)] });
    return interaction.reply({ embeds: [ok(`Feedback sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'rename') {
    const newName = cleanName(interaction.options.getString('name'));
    await interaction.channel.setName(newName);
    return interaction.reply({ embeds: [ok(`Ticket renamed to ${newName}.`)], ephemeral: true });
  }

  if (cmd === 'claim') return interaction.reply({ embeds: [ok(`Ticket claimed by ${interaction.user}.`)] });

  if (cmd === 'adduser' || cmd === 'removeuser') {
    const user = interaction.options.getUser('user');
    const allow = cmd === 'adduser';
    await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: allow, SendMessages: allow, ReadMessageHistory: allow }).catch(() => {});
    return interaction.reply({ embeds: [ok(`${allow ? 'Added' : 'Removed'} ${user}.`)] });
  }

  if (cmd === 'blacklist' || cmd === 'unblacklist') {
    const user = interaction.options.getUser('user');
    const list = readJson(config.paths.blacklist, []);
    if (cmd === 'blacklist') {
      if (!list.some(x => x.id === user.id)) list.push({ id: user.id, tag: user.tag, reason: interaction.options.getString('reason') || 'No reason', addedBy: interaction.user.id, addedAt: Date.now() });
      writeJson(config.paths.blacklist, list);
      return interaction.reply({ embeds: [ok(`${user} blacklisted.`)], ephemeral: true });
    }
    writeJson(config.paths.blacklist, list.filter(x => x.id !== user.id));
    return interaction.reply({ embeds: [ok(`${user} removed from blacklist.`)], ephemeral: true });
  }

  if (cmd === 'customer') {
    const roleId = process.env.CUSTOMER_ROLE_ID;
    const user = interaction.options.getUser('user');
    if (!roleId) return interaction.reply({ embeds: [error('CUSTOMER_ROLE_ID is empty in .env.')], ephemeral: true });
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [error('Member not found.')], ephemeral: true });
    await member.roles.add(roleId);
    return interaction.reply({ embeds: [ok(`${user} received the customer role.`)], ephemeral: true });
  }

  if (cmd === 'lista' || cmd === 'addlista') {
    const lista = readJson(config.paths.lista, []);
    if (cmd === 'addlista') {
      const user = interaction.options.getUser('user');
      if (!lista.some(x => x.id === user.id)) lista.push({ id: user.id, tag: user.tag, addedBy: interaction.user.id, addedAt: Date.now() });
      writeJson(config.paths.lista, lista);
      return interaction.reply({ embeds: [ok(`${user} added to the list.`)], ephemeral: true });
    }
    const text = lista.length ? lista.map((x, i) => `• **${i + 1}.** <@${x.id}> / \`${x.id}\``).join('\n').slice(0, 3900) : 'No users in the list.';
    return replyEmbed(interaction, baseEmbed().setTitle(`Total List: ${lista.length}`).setDescription(text), { ephemeral: true, banner: true });
  }

  if (cmd === 'stock' || cmd === 'setstock') {
    const stock = readJson(config.paths.stock, {});
    if (cmd === 'setstock') {
      stock[interaction.options.getString('plan')] = interaction.options.getInteger('amount');
      writeJson(config.paths.stock, stock);
      return interaction.reply({ embeds: [ok('Stock updated.')], ephemeral: true });
    }
    await sendEmbed(channel, baseEmbed().setTitle('ACE BYPASS Stock').setDescription(Object.entries(stock).map(([k, v]) => `• **${k}:** ${v}`).join('\n')), { banner: true });
    return interaction.reply({ embeds: [ok(`Stock sent in ${channel}.`)], ephemeral: true });
  }

  if (cmd === 'clear') {
    const amount = Math.min(Math.max(interaction.options.getInteger('amount'), 1), 100);
    const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
    return interaction.reply({ embeds: [ok(`Deleted ${deleted?.size || 0} messages.`)], ephemeral: true });
  }

  if (cmd === 'lock' || cmd === 'unlock') {
    const lock = cmd === 'lock';
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: !lock }).catch(() => {});
    return interaction.reply({ embeds: [ok(lock ? 'Channel locked.' : 'Channel unlocked.')], ephemeral: true });
  }
}

async function handleButton(client, interaction) {
  if (interaction.customId.startsWith('ticket_open_')) return openTicket(interaction, interaction.customId.replace('ticket_open_', ''));
  if (interaction.customId === 'ticket_close') { if (!(await guard(interaction))) return; await interaction.reply({ embeds: [ok('Closing ticket and creating transcript...')], ephemeral: true }); return closeTicket(client, interaction.channel, interaction.user); }
  if (interaction.customId === 'ticket_transcript') { if (!(await guard(interaction))) return; await sendTranscript(client, interaction.channel, interaction.user); return interaction.reply({ embeds: [ok('Transcript sent to logs.')], ephemeral: true }); }
  if (interaction.customId === 'ticket_claim') { if (!(await guard(interaction))) return; return interaction.reply({ embeds: [ok(`Ticket claimed by ${interaction.user}.`)] }); }
  if (interaction.customId === 'ticket_reopen') { if (!(await guard(interaction))) return; if (interaction.channel.topic) await interaction.channel.permissionOverwrites.edit(interaction.channel.topic, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {}); return interaction.reply({ embeds: [ok('Ticket reopened.')] }); }
  if (interaction.customId.startsWith('giveaway_enter_')) return enterGiveaway(interaction);
}

async function handleInteraction(client, interaction) {
  try {
    if (interaction.isChatInputCommand()) return handleCommand(client, interaction);
    if (interaction.isButton()) return handleButton(client, interaction);
    if (interaction.isModalSubmit()) return handleModal(client, interaction);
  } catch (err) {
    console.log('[INTERACTION ERROR]', err);
    const payload = { embeds: [error('An error occurred while running this command.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

module.exports = { handleInteraction };
