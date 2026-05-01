const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { readJson, writeJson } = require('../utils/storage');
const { baseEmbed, sendEmbed } = require('../utils/embeds');
const { parseDuration } = require('../utils/time');

function giveawayButton(id) {
  return new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_enter_${id}`).setLabel('Enter').setEmoji('🎉').setStyle(ButtonStyle.Success));
}

async function createGiveaway(interaction, targetChannel, title, plan, time) {
  const duration = parseDuration(time);
  if (!duration) return interaction.reply({ content: '❌ Invalid time. Use 10m, 2h, 1d or 1y.', ephemeral: true });
  const id = Date.now().toString();
  const endsAt = Date.now() + duration;
  const msg = await targetChannel.send({
    embeds: [baseEmbed().setTitle(`🎉 ${title}`).setDescription([`• **Plan:** ${plan}`, `• **Ends:** <t:${Math.floor(endsAt / 1000)}:R>`, '', 'Click **Enter** to participate.'].join('\n')).setImage('attachment://banner.png')],
    components: [giveawayButton(id)],
    files: [require('../utils/embeds').bannerFile()].filter(Boolean)
  });
  const giveaways = readJson(config.paths.giveaways, []);
  giveaways.push({ id, title, channelId: targetChannel.id, messageId: msg.id, plan, endsAt, participants: [], ended: false });
  writeJson(config.paths.giveaways, giveaways);
  const logs = await interaction.client.channels.fetch(config.ids.giveawayLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Giveaway Created').addFields({ name: 'Title', value: title }, { name: 'Plan', value: plan, inline: true }, { name: 'Time', value: time, inline: true }, { name: 'Created By', value: `${interaction.user} / ${interaction.user.id}` }), { banner: false });
  return interaction.reply({ content: `✅ Giveaway created in ${targetChannel}.`, ephemeral: true });
}

async function enterGiveaway(interaction) {
  const id = interaction.customId.replace('giveaway_enter_', '');
  const giveaways = readJson(config.paths.giveaways, []);
  const g = giveaways.find(x => x.id === id);
  if (!g || g.ended) return interaction.reply({ content: '❌ This giveaway has ended.', ephemeral: true });
  if (g.participants.includes(interaction.user.id)) return interaction.reply({ content: '❌ You are already in this giveaway.', ephemeral: true });
  g.participants.push(interaction.user.id);
  writeJson(config.paths.giveaways, giveaways);
  const logs = await interaction.client.channels.fetch(config.ids.giveawayLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Giveaway Entry').addFields({ name: 'User', value: `${interaction.user} / ${interaction.user.id}` }, { name: 'Giveaway', value: g.title }, { name: 'Plan', value: g.plan }), { banner: false });
  return interaction.reply({ content: '✅ You entered the giveaway.', ephemeral: true });
}

async function endGiveaway(client, id) {
  const giveaways = readJson(config.paths.giveaways, []);
  const g = giveaways.find(x => x.id === id);
  if (!g || g.ended) return;
  const channel = await client.channels.fetch(g.channelId).catch(() => null);
  if (!channel) return;
  const msg = await channel.messages.fetch(g.messageId).catch(() => null);
  const participants = g.participants || [];
  const winner = participants.length ? participants[Math.floor(Math.random() * participants.length)] : null;
  g.ended = true; g.winnerId = winner;
  writeJson(config.paths.giveaways, giveaways);
  await sendEmbed(channel, baseEmbed().setTitle(`🎉 ${g.title} Ended`).setDescription(winner ? `• **Winner:** <@${winner}>\n• **Plan:** ${g.plan}\n\nYou have **1 day** to claim your prize in <#1499515595589423184>.` : `• **No participants**\n• **Plan:** ${g.plan}`), { banner: true });
  if (msg) await msg.edit({ components: [], embeds: [baseEmbed().setTitle(`🎉 ${g.title} Finished`).setDescription(winner ? `Winner: <@${winner}>` : 'No participants.')] }).catch(() => {});
  const logs = await client.channels.fetch(config.ids.giveawayLogs).catch(() => null);
  if (logs) await sendEmbed(logs, baseEmbed().setTitle('Giveaway Finished').addFields({ name: 'Title', value: g.title }, { name: 'Winner', value: winner ? `<@${winner}>` : 'No winner' }, { name: 'Participants', value: participants.length ? participants.map(x => `<@${x}>`).join('\n').slice(0, 3900) : 'No participants' }), { banner: false });
}

async function checkGiveaways(client) {
  const giveaways = readJson(config.paths.giveaways, []);
  for (const g of giveaways) if (!g.ended && Date.now() >= g.endsAt) await endGiveaway(client, g.id);
}

module.exports = { createGiveaway, enterGiveaway, checkGiveaways };
