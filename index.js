import { default as makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import express from 'express';
import config from './config.js';

const app = express();
app.get('/', (req, res) => res.send("💜 ARSLAN-MD IS RUNNING SUCCESSFULLY 💜"));
app.listen(process.env.PORT || 3000, () => console.log("🌐 Web server is active on port 3000"));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  console.log(`\n========================================`);
  console.log(`💜 STARTING ${config.BOT_NAME} BY ${config.OWNER_NAME} 💜`);
  console.log(`========================================\n`);

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  // Agar SESSION_ID di gayi hai environment variable mein, toh usko session file mein likh dein
  if (config.SESSION_ID && !fs.existsSync('./session/creds.json')) {
    try {
      console.log("📥 Loading session from SESSION_ID...");
      let sessData = config.SESSION_ID;
      // Agar session ID base64 ya custom format mein ho toh handle karein
      fs.writeFileSync('./session/creds.json', JSON.stringify(JSON.parse(Buffer.from(sessData, 'base64').toString('utf8'))));
      console.log("✅ Session Loaded Successfully!");
    } catch (e) {
      // Direct JSON string check
      try {
        fs.writeFileSync('./session/creds.json', config.SESSION_ID);
        console.log("✅ Session Loaded Successfully!");
      } catch (err) {
        console.log("⚠️ Invalid SESSION_ID format, proceeding with normal auth.");
      }
    }
  }

  const sock = makeWASocket({ 
    version, 
    auth: state, 
    printQRInTerminal: false, 
    logger: pino({ level: 'silent' }), 
    browser: [config.BOT_NAME, 'Chrome', '2.5.0'] 
  });

  sock.ev.on('creds.update', saveCreds);

  // Agar registered nahi hai aur SESSION_ID bhi nahi hai toh Pairing Code maangay ga
  if (!sock.authState.creds.registered) {
    let num = config.OWNER_NUMBER;
    if (!num) {
      num = await question(`📱 Enter WhatsApp Number (e.g. 923467214839): `);
      num = num.replace(/[^0-9]/g, '');
    }
    
    if (num) {
      try {
        console.log("⏳ Generating Pairing Code...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        const code = await sock.requestPairingCode(num);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n----------------------------------------`);
        console.log(`💜 ${config.BOT_NAME} PAIRING CODE: \x1b[1m\x1b[32m${formattedCode}\x1b[0m`);
        console.log(`----------------------------------------\n`);
      } catch (err) {
        console.log("❌ Error generating pairing code:", err);
      }
    }
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Connection lost, reconnecting...");
        startBot();
      } else {
        console.log("❌ Session logged out. Please restart with a new session.");
      }
    } else if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} SUCCESSFULLY CONNECTED TO WHATSAPP 💜`);
    }
  });

  // Top-Tier Menu & Commands Handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; 
    if (!m.message || m.key.fromMe) return;
    
    const from = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    
    if (!text.startsWith(config.PREFIX)) return;
    
    const args = text.slice(config.PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    
    if (cmd === 'menu' || cmd === 'help') {
      let menu = `┏━━━ 💜 *${config.BOT_NAME}* 💜 ━━━┓\n`;
      menu += `┃ 👑 Owner: ${config.OWNER_NAME}\n`;
      menu += `┃ ⚡ Prefix: [ ${config.PREFIX} ]\n`;
      menu += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
      menu += `✨ *AVAILABLE COMMANDS:* ✨\n\n`;
      menu += `> *${config.PREFIX}menu* - Displays this gorgeous menu\n`;
      menu += `> *${config.PREFIX}ping* - Check bot speed/status\n`;
      menu += `> *${config.PREFIX}owner* - Get owner contact info\n`;
      menu += `> *${config.PREFIX}sticker* - Convert image to sticker\n`;
      menu += `> *${config.PREFIX}runtime* - Check bot active time\n\n`;
      menu += `_Powered by ${config.OWNER_NAME}_ 💜`;
      
      await sock.sendMessage(from, { text: menu });
    } 
    else if (cmd === 'ping') {
      await sock.sendMessage(from, { text: 'pong! ⚡ ARSLAN-MD is blazing fast 🚀' });
    } 
    else if (cmd === 'owner') {
      await sock.sendMessage(from, { text: `👑 *Owner Info*\nName: ${config.OWNER_NAME}\nNumber: wa.me/${config.OWNER_NUMBER}` });
    }
    else if (cmd === 'runtime') {
      let uptime = process.uptime();
      let hours = Math.floor(uptime / 3600);
      let minutes = Math.floor((uptime % 3600) / 60);
      let seconds = Math.floor(uptime % 60);
      await sock.sendMessage(from, { text: `⏱️ *Bot Uptime:* ${hours}h ${minutes}m ${seconds}s` });
    }
  });
}
