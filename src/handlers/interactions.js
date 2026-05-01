const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { readJson, writeJson } = require('../utils/storage');
const { baseEmbed, okEmbed, errorEmbed, tosEmbed, statusEmbed } = require('../utils/embeds');
const { bannerAttachment, paymentsAttachment } = require('../utils/media');
const { translateToThree } = require('../utils/translate');
const { parseDuration } = require('../utils/time');
const { buildTranscript, sendAutoTranscript } = require('../utils/transcript');

function isOwner(id) { return config.owners.includes(id); }
function cleanName(s) { return String(s).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,80) || 'ticket'; }
async function getOrCreateCategory(guild, name) {
  let c = guild.channels.cache.find(x => x.type === ChannelType.GuildCategory && x.name.toLowerCase() === name.toLowerCase());
  if (!c) c = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  return c;
}
function isTicket(channel) { return channel?.name?.startsWith('buy-') || channel?.name?.startsWith('support-'); }
function ticketRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Re Open').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger)
  );
}
function panelRow(type) { return new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(type === 'buy' ? 'ticket_buy' : 'ticket_support').setLabel(type === 'buy' ? 'Buy' : 'Support').setStyle(ButtonStyle.Secondary)); }
async function channelById(client, id) { return client.channels.fetch(id).catch(() => null); }
function threeLangBlock(title, body) {
  return ['🇺🇸 **English**', `• **${title.en}**`, body.en, '', '• • •', '', '🇧🇷 **Português**', `• **${title.pt}**`, body.pt, '', '• • •', '', '🇪🇸 **Español**', `• **${title.es}**`, body.es].join('\n');
}
function paymentsText() {
  return ['🇺🇸 **English**','• **PayPal**','• **Litecoin (LTC)**','• **Card / Gift Card**','','• • •','','🇧🇷 **Português**','• **PayPal**','• **Litecoin (LTC)**','• **Cartão / Gift Card**','','• • •','','🇪🇸 **Español**','• **PayPal**','• **Litecoin (LTC)**','• **Tarjeta / Gift Card**'].join('\n');
}

async function openTicket(interaction, type) {
  const black = readJson(config.paths.blacklist, []);
  if (black.some(x => x.id === interaction.user.id)) return interaction.reply({ embeds:[errorEmbed('You are blacklisted from opening tickets.')], ephemeral:true });
  const category = await getOrCreateCategory(interaction.guild, type === 'buy' ? 'Tickets Buy' : 'Tickets Support');
  const existing = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && c.parentId === category.id);
  if (existing) return interaction.reply({ embeds:[errorEmbed(`You already have an open ticket: ${existing}`)], ephemeral:true });
  const channel = await interaction.guild.channels.create({
    name: cleanName(`${type}-${interaction.user.username}`), type: ChannelType.GuildText, parent: category.id, topic: interaction.user.id,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ...config.owners.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles] }))
    ]
  });
  await channel.send({ content:`${config.owners.map(id=>`<@${id}>`).join(' ')} ${interaction.user}`, embeds:[baseEmbed().setTitle(type === 'buy' ? 'Buy Ticket' : 'Support Ticket').setDescription(`Hello ${interaction.user}, please describe what you need.\n\nStaff: ${config.owners.map(id=>`<@${id}>`).join(' ')}`)], components:[ticketRow()] });
  const logs = await channelById(interaction.client, config.ids.ticketLogs);
  if (logs) await logs.send({ embeds:[baseEmbed().setTitle('Ticket Opened').addFields({ name:'User', value:`${interaction.user} / ${interaction.user.id}` }, { name:'Type', value:type }, { name:'Channel', value:`${channel}` })] });
  return interaction.reply({ embeds:[okEmbed(`Ticket created: ${channel}`)], ephemeral:true });
}
async function closeTicket(client, channel, user) {
  await sendAutoTranscript(client, channel, user);
  const cat = await getOrCreateCategory(channel.guild, 'Logs Ticket');
  if (channel.topic) await channel.permissionOverwrites.edit(channel.topic, { ViewChannel:false, SendMessages:false }).catch(()=>{});
  await channel.setParent(cat.id).catch(()=>{});
  await channel.send({ embeds:[baseEmbed().setTitle('Ticket Closed').setDescription(`Closed by ${user}`).addFields({ name:'Auto Transcript', value:`Sent to <#${config.ids.ticketLogs}>.` })], components:[ticketRow()] });
}
async function endGiveaway(client, id) {
  const giveaways = readJson(config.paths.giveaways, []), g = giveaways.find(x => x.id === id);
  if (!g || g.ended) return;
  const ch = await channelById(client, g.channelId); if (!ch) return;
  const msg = await ch.messages.fetch(g.messageId).catch(()=>null); if (!msg) return;
  const winner = g.participants?.length ? g.participants[Math.floor(Math.random()*g.participants.length)] : null;
  g.ended = true; g.winnerId = winner || null; writeJson(config.paths.giveaways, giveaways);
  await ch.send({ embeds:[baseEmbed().setTitle(`🎉 ${g.title || 'Giveaway'} Ended`).setDescription(winner ? `Winner: <@${winner}>\nPlan: **${g.plan}**\n\nYou have **1 day** to claim your prize here: <#1499515595589423184>` : `No participants.\nPlan: **${g.plan}**`)] });
  const logs = await channelById(client, config.ids.giveawayLogs);
  if (logs) await logs.send({ embeds:[baseEmbed().setTitle('Giveaway Logs').addFields({ name:'Title', value:g.title || 'Giveaway' }, { name:'Plan', value:g.plan, inline:true }, { name:'Winner', value:winner ? `<@${winner}>` : 'No winner', inline:true }, { name:'Participants', value:g.participants?.length ? g.participants.map(x=>`<@${x}>`).join('\n').slice(0,3900) : 'No participants' })] });
  await msg.edit({ components:[], embeds:[baseEmbed().setTitle(`🎉 ${g.title || 'Giveaway'} Finished`).setDescription(winner ? `Plan: **${g.plan}**\nWinner: <@${winner}>` : `Plan: **${g.plan}**\nNo participants.`)] }).catch(()=>{});
}
async function checkGiveaways(client) {
  for (const g of readJson(config.paths.giveaways, [])) if (!g.ended && Date.now() >= g.endsAt) await endGiveaway(client, g.id);
}

async function button(client, i) {
  if (i.customId === 'ticket_buy') return openTicket(i, 'buy');
  if (i.customId === 'ticket_support') return openTicket(i, 'support');
  if (i.customId === 'ticket_close') { if (!isOwner(i.user.id)) return i.reply({ embeds:[errorEmbed('You do not have permission.')], ephemeral:true }); await i.reply({ embeds:[okEmbed('Closing ticket and creating transcript...')], ephemeral:true }); return closeTicket(client, i.channel, i.user); }
  if (i.customId === 'ticket_reopen') { if (!isOwner(i.user.id)) return i.reply({ embeds:[errorEmbed('You do not have permission.')], ephemeral:true }); const type = i.channel.name.startsWith('buy') ? 'Buy' : 'Support'; const cat = await getOrCreateCategory(i.guild, `Tickets ${type}`); await i.channel.setParent(cat.id).catch(()=>{}); if (i.channel.topic) await i.channel.permissionOverwrites.edit(i.channel.topic, { ViewChannel:true, SendMessages:true, ReadMessageHistory:true, AttachFiles:true }).catch(()=>{}); return i.reply({ embeds:[okEmbed('Ticket reopened.')] }); }
  if (i.customId === 'ticket_transcript') { if (!isOwner(i.user.id)) return i.reply({ embeds:[errorEmbed('You do not have permission.')], ephemeral:true }); await i.deferReply({ ephemeral:true }); const file = await buildTranscript(i.channel); const logs = await channelById(client, config.ids.ticketLogs); if (logs) await logs.send({ embeds:[baseEmbed().setTitle('Ticket Transcript').addFields({ name:'Channel', value:`${i.channel}` }, { name:'Generated By', value:`${i.user}` })], files:[file] }); return i.editReply({ embeds:[okEmbed('Transcript created and sent to logs.')] }); }
  if (i.customId.startsWith('giveaway_enter_')) { const id = i.customId.replace('giveaway_enter_',''); const giveaways = readJson(config.paths.giveaways, []); const g = giveaways.find(x=>x.id===id); if (!g || g.ended) return i.reply({ embeds:[errorEmbed('This giveaway has already ended.')], ephemeral:true }); if (!g.participants.includes(i.user.id)) { g.participants.push(i.user.id); writeJson(config.paths.giveaways, giveaways); const logs = await channelById(client, config.ids.giveawayLogs); if (logs) await logs.send({ embeds:[baseEmbed().setTitle('Giveaway Entry').addFields({ name:'User', value:`${i.user} / ${i.user.id}` }, { name:'Plan', value:g.plan })] }); return i.reply({ embeds:[okEmbed('You entered the giveaway.')], ephemeral:true }); } return i.reply({ embeds:[errorEmbed('You are already in this giveaway.')], ephemeral:true }); }
}

async function slash(client, i) {
  if (!isOwner(i.user.id)) return i.reply({ embeds:[errorEmbed('You do not have permission to use commands.')], ephemeral:true });
  const cmd = i.commandName;
  if (cmd === 'setup') { for (const type of ['buy','support']) { const ch = await channelById(client, type==='buy'?config.ids.ticketBuyPanel:config.ids.ticketSupportPanel); if (ch) await ch.send({ embeds:[baseEmbed().setTitle(type==='buy'?'Buy Ticket':'Support Ticket').setDescription(type==='buy'?'Click below to open a buy ticket.':'Click below to open a support ticket.')], components:[panelRow(type)] }); } return i.reply({ embeds:[okEmbed('Main panels sent.')], ephemeral:true }); }
  if (cmd === 'ticketpanel') { const type = i.options.getString('type'); const ch = await channelById(client, type==='buy'?config.ids.ticketBuyPanel:config.ids.ticketSupportPanel); if (!ch) return i.reply({ embeds:[errorEmbed('Panel channel not found.')], ephemeral:true }); await ch.send({ embeds:[baseEmbed().setTitle(type==='buy'?'Buy Ticket':'Support Ticket').setDescription(type==='buy'?'Click below to open a buy ticket.':'Click below to open a support ticket.')], components:[panelRow(type)] }); return i.reply({ embeds:[okEmbed(`Panel sent in ${ch}.`)], ephemeral:true }); }
  if (cmd === 'rename') { if (!isTicket(i.channel)) return i.reply({ embeds:[errorEmbed('This command can only be used inside a ticket.')], ephemeral:true }); const name = cleanName(i.options.getString('name')); await i.channel.setName(name); return i.reply({ embeds:[okEmbed(`Ticket renamed to **${name}**.`)] }); }
  if (cmd === 'claim') { if (!isTicket(i.channel)) return i.reply({ embeds:[errorEmbed('This command can only be used inside a ticket.')], ephemeral:true }); return i.reply({ embeds:[baseEmbed().setTitle('Ticket Claimed').setDescription(`This ticket was claimed by ${i.user}.`)] }); }
  if (cmd === 'adduser' || cmd === 'removeuser') { if (!isTicket(i.channel)) return i.reply({ embeds:[errorEmbed('This command can only be used inside a ticket.')], ephemeral:true }); const u = i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id, cmd==='adduser' ? { ViewChannel:true, SendMessages:true, ReadMessageHistory:true, AttachFiles:true } : { ViewChannel:false, SendMessages:false }).catch(()=>{}); return i.reply({ embeds:[okEmbed(`${cmd==='adduser'?'Added':'Removed'} ${u}.`)] }); }
  if (cmd === 'tos') { await i.channel.send({ embeds:[tosEmbed()] }); return i.reply({ embeds:[okEmbed('Terms sent.')], ephemeral:true }); }
  if (cmd === 'plans') { await i.channel.send({ embeds:[baseEmbed().setTitle('ACE BYPASS • Plans').setDescription(['• **Basic**','• **Advanced**','• **Private**','• **Control Phone**','','Open a ticket to buy or ask questions.'].join('\n'))] }); return i.reply({ embeds:[okEmbed('Plans sent.')], ephemeral:true }); }
  if (cmd === 'channel') { await i.channel.send({ embeds:[baseEmbed().setTitle('Updates/Showcases').setDescription(`[Click here to view the YouTube channel](${process.env.YOUTUBE_URL || 'https://youtube.com/'})`).setThumbnail('https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png')] }); return i.reply({ embeds:[okEmbed('Channel embed sent.')], ephemeral:true }); }
  if (cmd === 'status') { const ch = await channelById(client, config.ids.statusSend); if (!ch) return i.reply({ embeds:[errorEmbed('Status channel not found.')], ephemeral:true }); const banner = bannerAttachment(); const e = statusEmbed(i.user); if (banner) e.setImage('attachment://banner.png'); await ch.send({ embeds:[e], files:banner?[banner]:[] }); return i.reply({ embeds:[okEmbed(`Status sent in <#${config.ids.statusSend}>.`)], ephemeral:true }); }
  if (cmd === 'payments') { const p = await paymentsAttachment(); const banner = bannerAttachment(); const e = baseEmbed().setTitle('Payments').setDescription(paymentsText()).setThumbnail('attachment://payments.png'); if (banner) e.setImage('attachment://banner.png'); await i.channel.send({ embeds:[e], files: banner ? [p,banner] : [p] }); return i.reply({ embeds:[okEmbed('Payments embed sent.')], ephemeral:true }); }
  if (cmd === 'payment') { if (i.channelId !== config.ids.payments) return i.reply({ embeds:[errorEmbed(`This command can only be used in <#${config.ids.payments}>.`)], ephemeral:true }); const buyer=i.options.getUser('buyer'), seller=i.options.getUser('seller'), plan=i.options.getString('plan'), proof=i.options.getAttachment('proof'); await i.channel.send({ embeds:[baseEmbed().setTitle('Payment Log').addFields({ name:'Buyer', value:`${buyer} / ${buyer.id}` }, { name:'Seller', value:`${seller} / ${seller.id}` }, { name:'Plan', value:plan }).setImage(proof.url)] }); return i.reply({ embeds:[okEmbed('Payment registered.')], ephemeral:true }); }
  if (cmd === 'giveaway') { const title=i.options.getString('title'), plan=i.options.getString('plan'), time=i.options.getString('time'), duration=parseDuration(time); if (!duration) return i.reply({ embeds:[errorEmbed('Invalid format. Use: 10m, 2h, 1d or 1y.')], ephemeral:true }); const id=Date.now().toString(), endsAt=Date.now()+duration; const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_enter_${id}`).setLabel('Enter').setStyle(ButtonStyle.Success).setEmoji('🎉')); const msg=await i.channel.send({ embeds:[baseEmbed().setTitle(`🎉 ${title}`).setDescription(`**Plan:** ${plan}\n**Ends:** <t:${Math.floor(endsAt/1000)}:R>\n\nClick **Enter** to participate.`)], components:[row] }); const giveaways=readJson(config.paths.giveaways, []); giveaways.push({ id,title,channelId:i.channelId,messageId:msg.id,plan,endsAt,participants:[],ended:false }); writeJson(config.paths.giveaways,giveaways); const logs=await channelById(client, config.ids.giveawayLogs); if (logs) await logs.send({ embeds:[baseEmbed().setTitle('Giveaway Created').addFields({ name:'Title', value:title }, { name:'Plan', value:plan }, { name:'Time', value:time }, { name:'Created By', value:`${i.user} / ${i.user.id}` })] }); return i.reply({ embeds:[okEmbed('Giveaway created.')], ephemeral:true }); }
  if (cmd === 'feedbacks') { if (i.channelId !== config.ids.feedbackCommand) return i.reply({ embeds:[errorEmbed(`This command can only be used in <#${config.ids.feedbackCommand}>.`)], ephemeral:true }); const ch=await channelById(client, config.ids.feedbackSend), title=i.options.getString('title'), img=i.options.getAttachment('image'); if (!ch) return i.reply({ embeds:[errorEmbed('Feedback channel not found.')], ephemeral:true }); await ch.send({ content:'# New FeedBack Ace Bypass', embeds:[baseEmbed().setTitle(title).setImage(img.url)] }); return i.reply({ embeds:[okEmbed('Feedback sent.')], ephemeral:true }); }
  if (cmd === 'embed') { const e=baseEmbed(), title=i.options.getString('title'), sub=i.options.getString('subtitle'), desc=i.options.getString('description'), img=i.options.getString('image'); if(title)e.setTitle(title); if(desc)e.setDescription(desc); if(sub)e.addFields({ name:sub, value:'\u200B' }); if(img)e.setImage(img); await i.channel.send({ embeds:[e] }); return i.reply({ embeds:[okEmbed('Embed sent.')], ephemeral:true }); }
  if (cmd === 'multilangembed') { await i.deferReply({ ephemeral:true }); const title=i.options.getString('title'), desc=i.options.getString('description'), img=i.options.getAttachment('image'); const [tt,dd]=await Promise.all([translateToThree(title), translateToThree(desc)]); const banner=bannerAttachment(); const e=baseEmbed().setTitle('ACE BYPASS').setDescription(threeLangBlock(tt,dd)); if (banner) e.setImage('attachment://banner.png'); if (img) e.setThumbnail(img.url); await i.channel.send({ embeds:[e], files:banner?[banner]:[] }); return i.editReply({ embeds:[okEmbed('3-language embed sent.')] }); }
  if (cmd === 'lista') { if (i.channelId !== config.ids.lista) return i.reply({ embeds:[errorEmbed(`This command can only be used in <#${config.ids.lista}>.`)], ephemeral:true }); const lista=readJson(config.paths.lista,[]); return i.reply({ embeds:[baseEmbed().setTitle(`Total List: ${lista.length}`).setDescription(lista.length ? lista.map((x,n)=>`**${n+1}.** ${x.name} | <@${x.id}> | \`${x.id}\``).join('\n').slice(0,3900) : 'No users in the list.')] }); }
  if (cmd === 'addlista') { if (i.channelId !== config.ids.lista) return i.reply({ embeds:[errorEmbed(`This command can only be used in <#${config.ids.lista}>.`)], ephemeral:true }); const u=i.options.getUser('user'), lista=readJson(config.paths.lista,[]); if (lista.some(x=>x.id===u.id)) return i.reply({ embeds:[errorEmbed('This user is already in the list.')], ephemeral:true }); lista.push({ name:u.username, tag:u.tag, id:u.id, addedBy:i.user.id, addedAt:Date.now() }); writeJson(config.paths.lista,lista); return i.reply({ embeds:[okEmbed(`Added: ${u} / ${u.id}`)] }); }
  if (cmd === 'blacklist' || cmd === 'unblacklist') { const u=i.options.getUser('user'), list=readJson(config.paths.blacklist,[]); if (cmd==='blacklist') { if (!list.some(x=>x.id===u.id)) list.push({ id:u.id, tag:u.tag, reason:i.options.getString('reason') || 'No reason', by:i.user.id, at:Date.now() }); writeJson(config.paths.blacklist,list); return i.reply({ embeds:[okEmbed(`${u} was blacklisted.`)] }); } writeJson(config.paths.blacklist, list.filter(x=>x.id!==u.id)); return i.reply({ embeds:[okEmbed(`${u} was removed from blacklist.`)] }); }
  if (cmd === 'customer') { const u=i.options.getUser('user'), member=await i.guild.members.fetch(u.id).catch(()=>null), rid=process.env.CUSTOMER_ROLE_ID; if (!rid || !member) return i.reply({ embeds:[errorEmbed('Set CUSTOMER_ROLE_ID in .env first.')], ephemeral:true }); await member.roles.add(rid).catch(()=>{}); return i.reply({ embeds:[okEmbed(`Customer role given to ${u}.`)] }); }
  if (cmd === 'stock' || cmd === 'setstock') { const stock=readJson(config.paths.stock,{}); if (cmd==='setstock') { stock[i.options.getString('plan')] = i.options.getInteger('amount'); writeJson(config.paths.stock,stock); return i.reply({ embeds:[okEmbed('Stock updated.')] }); } return i.reply({ embeds:[baseEmbed().setTitle('ACE BYPASS • Stock').setDescription(config.plans.map(p=>`• **${p}:** ${stock[p] ?? 0}`).join('\n'))] }); }
  if (cmd === 'announce') { const title=i.options.getString('title'), msg=i.options.getString('message'), img=i.options.getAttachment('image'); const e=baseEmbed().setTitle(title).setDescription(msg); if (img) e.setImage(img.url); await i.channel.send({ embeds:[e] }); return i.reply({ embeds:[okEmbed('Announcement sent.')], ephemeral:true }); }
  if (cmd === 'clear') { const n=Math.max(1, Math.min(100, i.options.getInteger('amount'))); await i.channel.bulkDelete(n, true).catch(()=>{}); return i.reply({ embeds:[okEmbed(`Deleted ${n} messages.`)], ephemeral:true }); }
  if (cmd === 'lock' || cmd === 'unlock') { await i.channel.permissionOverwrites.edit(i.guild.roles.everyone.id, { SendMessages: cmd==='unlock' }).catch(()=>{}); return i.reply({ embeds:[okEmbed(`Channel ${cmd === 'lock' ? 'locked' : 'unlocked'}.`)] }); }
}

async function handleInteractions(client, interaction) {
  if (interaction.isButton()) return button(client, interaction);
  if (interaction.isChatInputCommand()) return slash(client, interaction);
}
module.exports = { handleInteractions, checkGiveaways };
