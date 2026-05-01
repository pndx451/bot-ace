const fs = require('fs');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config');

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.brand.color)
    .setTimestamp()
    .setFooter({ text: 'ACE BYPASS' });
}

function ok(text) {
  return baseEmbed().setDescription(`✅ **${text}**`);
}

function error(text) {
  return new EmbedBuilder().setColor(0xff3333).setDescription(`❌ **${text}**`);
}

function bannerFile() {
  if (!fs.existsSync(config.paths.banner)) return null;
  return new AttachmentBuilder(config.paths.banner, { name: 'banner.png' });
}

function withBanner(embed) {
  if (fs.existsSync(config.paths.banner)) embed.setImage('attachment://banner.png');
  return embed;
}

async function sendEmbed(channel, embed, options = {}) {
  const files = [];
  const banner = bannerFile();
  if (options.banner !== false && banner) {
    withBanner(embed);
    files.push(banner);
  }
  if (options.files) files.push(...options.files);
  return channel.send({ content: options.content || null, embeds: [embed], files });
}

async function replyEmbed(interaction, embed, options = {}) {
  const files = [];
  const banner = bannerFile();
  if (options.banner !== false && banner) {
    withBanner(embed);
    files.push(banner);
  }
  if (options.files) files.push(...options.files);
  const payload = { content: options.content || null, embeds: [embed], files, ephemeral: options.ephemeral ?? true };
  if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
  return interaction.reply(payload);
}

function tosEmbed() {
  return baseEmbed()
    .setTitle('ACE BYPASS - Terms of Service')
    .setDescription([
      '• **Acceptance of Terms**',
      'By downloading, installing, or using this software, you agree to be legally bound by these Terms and Conditions.',
      '',
      '• **License Grant**',
      'You are granted a limited, revocable, non-exclusive, non-transferable license to use the Software.',
      '',
      '• **Technical Restrictions**',
      'You may not reverse engineer, decompile, modify, replicate, or attempt to access the source code of the Software.',
      '',
      '• **Prohibited Use**',
      'You agree not to use the Software for illegal activity, abuse, leaking, account sharing, or unauthorized redistribution.',
      '',
      '• **Security Measures**',
      'The Software may include anti-tampering, integrity checks, and access protection.',
      '',
      '• **Suspension and Termination**',
      'We reserve the right to suspend or terminate access at any time without refund.',
      '',
      '• **Payments**',
      'All payments are final and non-refundable unless required by law.'
    ].join('\n'));
}

module.exports = { baseEmbed, ok, error, sendEmbed, replyEmbed, tosEmbed, bannerFile, withBanner };
