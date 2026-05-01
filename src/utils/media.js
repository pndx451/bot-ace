const fs = require('fs');
const Canvas = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const config = require('../config');

function fileAttachment(file, name) {
  if (!fs.existsSync(file)) return null;
  return new AttachmentBuilder(file, { name });
}
function bannerAttachment() { return fileAttachment(config.paths.banner, 'banner.png'); }
function logoAttachment() { return fileAttachment(config.paths.logo, 'logo.png'); }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
async function drawLogo(ctx, imgPath, x, y, size, label) {
  roundRect(ctx, x, y, 170, 175, 18); ctx.fillStyle = '#111118'; ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
  try { if (fs.existsSync(imgPath)) { const img = await Canvas.loadImage(imgPath); ctx.drawImage(img, x+35, y+18, 100, 100); } } catch {}
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.fillText(label, x+85, y+148);
}
async function paymentsAttachment() {
  const canvas = Canvas.createCanvas(640, 255), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#07070a'; ctx.fillRect(0,0,640,255);
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'left'; ctx.fillText('ACE BYPASS • PAYMENTS', 24, 38);
  await drawLogo(ctx, config.paths.paypalLogo, 25, 60, 100, 'PayPal');
  await drawLogo(ctx, config.paths.ltcLogo, 235, 60, 100, 'LTC');
  await drawLogo(ctx, config.paths.cardLogo, 445, 60, 100, 'Gift Card');
  return new AttachmentBuilder(await canvas.encode('png'), { name: 'payments.png' });
}
async function welcomeAttachment(member, type='join') {
  const canvas = Canvas.createCanvas(900, 350), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000'; ctx.fillRect(0,0,900,350);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.strokeRect(15,15,870,320);
  try { const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension:'png', size:512 })); ctx.save(); ctx.beginPath(); ctx.arc(170,175,96,0,Math.PI*2); ctx.clip(); ctx.drawImage(avatar,74,79,192,192); ctx.restore(); } catch {}
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(170,175,99,0,Math.PI*2); ctx.stroke();
  try { if (fs.existsSync(config.paths.logo)) { const logo = await Canvas.loadImage(config.paths.logo); ctx.drawImage(logo,675,45,145,145); } } catch {}
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 44px Arial'; ctx.fillText(type==='join' ? 'Welcome to ACE BYPASS' : 'Bye', 315, 145);
  ctx.font = 'bold 34px Arial'; ctx.fillText(member.user.username, 315, 205);
  ctx.font = '22px Arial'; ctx.fillText(`ID: ${member.id}`, 315, 250);
  return new AttachmentBuilder(await canvas.encode('png'), { name: `${type}-${member.id}.png` });
}
module.exports = { bannerAttachment, logoAttachment, paymentsAttachment, welcomeAttachment };
