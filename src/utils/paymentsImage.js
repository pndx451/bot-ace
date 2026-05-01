const fs = require('fs');
const Canvas = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawCard(ctx, imagePath, x, label) {
  roundRect(ctx, x, 70, 220, 220, 26);
  ctx.fillStyle = '#111118';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (fs.existsSync(imagePath)) {
    const img = await Canvas.loadImage(imagePath).catch(() => null);
    if (img) ctx.drawImage(img, x + 50, 90, 120, 120);
  }
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 110, 250);
}

async function buildPaymentsImage() {
  const canvas = Canvas.createCanvas(760, 330);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 34px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('ACE BYPASS PAYMENTS', 25, 45);
  await drawCard(ctx, config.paths.paypal, 25, 'PayPal');
  await drawCard(ctx, config.paths.ltc, 270, 'LTC');
  await drawCard(ctx, config.paths.card, 515, 'Gift Card');
  return new AttachmentBuilder(await canvas.encode('png'), { name: 'payments.png' });
}

module.exports = { buildPaymentsImage };
