const { EmbedBuilder } = require('discord.js');

function baseEmbed() {
  return new EmbedBuilder().setColor('#FFFFFF').setTimestamp();
}
function okEmbed(text) { return baseEmbed().setDescription(`✅ **${text}**`); }
function errorEmbed(text) { return new EmbedBuilder().setColor('#FF3131').setDescription(`❌ **${text}**`); }

function tosEmbed() {
  return baseEmbed()
    .setTitle('ACE BYPASS • Terms of Service')
    .setDescription('Please read the Terms of Service before purchasing or using the software.')
    .addFields(
      { name: '• Acceptance of Terms', value: 'By downloading, installing, or using this software, you agree to be legally bound by these Terms and Conditions.' },
      { name: '• License Grant', value: 'You are granted a limited, revocable, non-exclusive, non-transferable license to use the Software.' },
      { name: '• Technical Restrictions', value: 'You may not reverse engineer, decompile, modify, replicate, or attempt to access the source code of the Software.' },
      { name: '• Prohibited Use', value: 'You agree not to use the Software for illegal activity, abuse, leaking, account sharing, or unauthorized redistribution.' },
      { name: '• Security Measures', value: 'The Software may include anti-tampering, integrity checks, and access protection.' },
      { name: '• Suspension and Termination', value: 'We reserve the right to suspend or terminate access at any time without refund.' },
      { name: '• Payments', value: 'All payments are final and non-refundable unless required by law.' }
    )
    .setFooter({ text: 'ACE BYPASS • All sales are final' });
}

function statusEmbed(user) {
  return baseEmbed()
    .setTitle('Status Bypass Ace')
    .setDescription([
      '🇺🇸 **English**',
      '• **Basic:** 🟡 **Development**',
      '• **Advanced:** 🟢 **Working**',
      '• **Private:** 🟡 **Development**',
      '• **Control Phone:** 🟡 **Development**',
      '', '• • •', '',
      '🇧🇷 **Português**',
      '• **Basic:** 🟡 **Development**',
      '• **Advanced:** 🟢 **Working**',
      '• **Private:** 🟡 **Development**',
      '• **Control Phone:** 🟡 **Development**',
      '', '• • •', '',
      '🇪🇸 **Español**',
      '• **Basic:** 🟡 **Development**',
      '• **Advanced:** 🟢 **Working**',
      '• **Private:** 🟡 **Development**',
      '• **Control Phone:** 🟡 **Development**'
    ].join('\n'))
    .setFooter({ text: `Updated by ${user.username}` });
}

module.exports = { baseEmbed, whiteEmbed: baseEmbed, okEmbed, errorEmbed, tosEmbed, statusEmbed };
