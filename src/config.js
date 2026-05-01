const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = {
  owners: ['1484280198362042461', '1217889927703040060'],
  guildId: process.env.GUILD_ID || '1499513606210060419',
  ids: {
    autoRole: '1499518197358002226',
    ticketLogs: '1499515970585104504',
    joins: '1499514240002691184',
    leaves: '1499514307837169955',
    memberLogs: '1499515920949710962',
    deletedLogs: '1499516256162680852',
    paymentLogs: '1499516287792189540',
    giveawayLogs: '1499576573970612355',
    statusSend: '1499516778739400876'
  },
  paths: {
    root: ROOT,
    data: path.join(ROOT, 'data'),
    assets: path.join(ROOT, 'assets'),
    banner: path.join(ROOT, 'assets', 'banner.png'),
    logo: path.join(ROOT, 'assets', 'logo.png'),
    ltc: path.join(ROOT, 'assets', 'ltc.png'),
    paypal: path.join(ROOT, 'assets', 'paypal.png'),
    card: path.join(ROOT, 'assets', 'card.png'),
    giveaways: path.join(ROOT, 'data', 'giveaways.json'),
    lista: path.join(ROOT, 'data', 'lista.json'),
    blacklist: path.join(ROOT, 'data', 'blacklist.json'),
    stock: path.join(ROOT, 'data', 'stock.json')
  },
  brand: {
    name: 'ACE BYPASS',
    color: 0xffffff
  }
};
