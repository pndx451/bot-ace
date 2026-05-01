const path = require('path');

const root = path.join(__dirname, '..');

module.exports = {
  owners: ['1484280198362042461', '1217889927703040060'],

  ids: {
    guild: process.env.GUILD_ID || '1499513606210060419',
    autoRole: '1499518197358002226',

    ticketBuyPanel: '1499515627390631947',
    ticketSupportPanel: '1499515595589423184',
    ticketLogs: '1499515970585104504',

    joins: '1499514240002691184',
    leaves: '1499514307837169955',
    memberLogs: '1499515920949710962',
    deletedLogs: '1499516256162680852',
    payments: '1499516287792189540',
    giveawayLogs: '1499576573970612355',
    feedbackCommand: '1499528121446305922',
    feedbackSend: '1499527537863426209',
    statusCommand: '1499529094860247162',
    statusSend: '1499516778739400876',
    lista: '1499516040147898500'
  },

  paths: {
    root,
    data: path.join(root, 'data'),
    assets: path.join(root, 'assets'),
    giveaways: path.join(root, 'data', 'giveaways.json'),
    lista: path.join(root, 'data', 'lista.json'),
    blacklist: path.join(root, 'data', 'blacklist.json'),
    stock: path.join(root, 'data', 'stock.json'),
    banner: path.join(root, 'assets', 'banner.png'),
    logo: path.join(root, 'assets', 'logo.png'),
    ltcLogo: path.join(root, 'assets', 'ltc.png'),
    paypalLogo: path.join(root, 'assets', 'paypal.png'),
    cardLogo: path.join(root, 'assets', 'card.png'),
    dots: path.join(root, 'assets', 'dots.png')
  },

  plans: ['Basic', 'Advanced', 'Private', 'Control Phone'],
  defaultStatus: {
    Basic: '🟡 Development',
    Advanced: '🟢 Working',
    Private: '🟡 Development',
    'Control Phone': '🟡 Development'
  }
};
