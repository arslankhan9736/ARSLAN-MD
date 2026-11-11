// index.js - ARSLAN MD (ESM Version)
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import config from './config.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  console.log(`💜 ${config.BOT_NAME} ${config.VERSION} Starting...`);
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  
  const sock = makeWASocket({
    version, 
    auth: state,
    printQRInTerminal: false, // QR بند تاکہ پیرنگ کوڈ استعمال ہو سکے
    logger: pino({ level: 'silent' }),
    browser: ['ARSLAN-MDX', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    let phoneNumber = process.env.PAIR_NUMBER || config.OWNER_NUMBER;
    
    // اگر آپ چاہیں کہ ٹرمکس پر ہر بار نمبر خود پوچھ لے تو اگली لائن ان-کمنٹ (Uncomment) کر سکتے ہیں:
    // phoneNumber = await question('📱 اپنا واٹس ایپ نمبر درج کریں (مثلاً 923123456789): ');
    
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    console.log("⏳ Pairing Code ban raha hai...");
    
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("✅ TERA PAIRING CODE: " + code);
      } catch(e) {
        console.log("❌ Pairing Error:", e.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
      else console.log("❌ Logged Out, session folder delete karo");
    } else if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} CONNECT HO GAYA! 💜`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return;
      const from = m.key.remoteJid;
      const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
      const cmd = text.trim().toLowerCase();

      if (cmd === '.menu' || cmd === '.help') {
        await sock.sendMessage(from, { text: `╭───〔 💜 *${config.BOT_NAME}* 💜 〕───╮\n│\n│  👑 *OWNER:* ${config.OWNER_NAME}\n│  ⚡ *STATUS:* ONLINE 💜\n│  🛡️ *VERSION:* ${config.VERSION}\n│\n╰───────────────────────────╯\n> *POWERED BY ARSLAN MD*` });
      }

      if (cmd === '.ping') {
        await sock.sendMessage(from, { text: `💜 *PONG!* 💜\n\n✅ *${config.BOT_NAME} Chal Raha Hai!*` });
      }
      
      if (cmd === '.owner') {
        await sock.sendMessage(from, { text: `👑 *OWNER:* ${config.OWNER_NAME}\n📞 wa.me/${config.OWNER_NUMBER}` });
      }
    } catch(e) {
      console.log("Msg Error:", e.message);
    }
  });
}

startBot();
