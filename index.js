// 💜 ARSLAN MD - FINAL - MINI + BIG EK HI FILE ME
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
let config;
try { config = require('./config'); } catch(e){ config = { ownerName: "ARSLAN", ownerNumber: "923467214839", mode: "MINI" }; }

const BOT_MODE = config.mode || "MINI";

async function startBot() {
  console.log(`💜 ARSLAN MD ${BOT_MODE} Starting...`);
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({
    version, auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['ARSLAN-MDX', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });
  sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
    const readline = require("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    let phoneNumber = process.env.PAIR_NUMBER;
    if (!phoneNumber) {
      phoneNumber = await question('📱 اپنا واٹس ایپ نمبر لکھیں (مثلاً 923123456789): ');
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }
    rl.close();

    console.log("⏳ Pairing Code ban raha hai...");
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("✅ TERA PAIRING CODE: " + code);
      } catch(e){ console.log("❌ Pairing Error:", e.message); }
    }, 3000);
  }


  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
      else console.log("❌ Logged Out, session folder delete karo");
    } else if (connection === 'open') {
      console.log(`✅ ARSLAN MD ${BOT_MODE} CONNECT HO GAYA! 💜`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return;
      const from = m.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
      const cmd = text.trim().toLowerCase();
      const args = text.trim().split(' ').slice(1).join(' ');

      if (cmd === '.menu' || cmd === 'menu' || cmd === '.help') {
        if (BOT_MODE === "MINI") {
          await sock.sendMessage(from, { text: `╭───〔 💜 *ARSLAN MD MINI* 💜 〕───╮
│
│  👑 *OWNER:* ${config.ownerName}
│  ⚡ *STATUS:* ONLINE 💜
│  💜 *THEME:* PURPLE VIP
│
╰───────────────────────────╯
╭───〔 💜 *MINI MENU* 〕───╮
│
│  ✦ .ping - Bot Check
│  ✦ .alive - Bot Zinda Hai?
│  ✦ .owner - Owner Number
│  ✦ .info - Bot Info
│  ✦ .song <naam> - Song
│  ✦ .joke - Joke 😂
│  ✦ .quote - Achi Baat
│  ✦ .shayari - Shayari 💜
│  ✦ .time - Time
│  ✦ .date - Date
│  ✦ .tagall - Sab Ko Tag
│
╰───────────────────────╯
> *💜 POWERED BY ARSLAN MD MINI 💜*` });
        } else {
          await sock.sendMessage(from, { text: `╭───〔 🔥 *ARSLAN MD - BIG* 🔥 〕───╮
│
│  👑 *OWNER:* ${config.ownerName}
│  ⚡ *STATUS:* ONLINE 🔥
│  💜 *THEME:* PURPLE VIP
│  🛡️ *VERSION:* BIG V5 PRO
│
╰───────────────────────────╯
╭───〔 🔥 *BIG MENU* 〕───╮
│
│  ✦ .ping - Bot Check
│  ✦ .alive - Bot Zinda Hai?
│  ✦ .owner - Owner Number
│  ✦ .info - Bot Info
│  ✦ .song <naam> - Song
│  ✦ .video <naam> - Video
│  ✦ .joke - Joke 😂
│  ✦ .quote - Achi Baat
│  ✦ .shayari - Shayari 💜
│  ✦ .time - Time
│  ✦ .date - Date
│  ✦ .tagall - Sab Ko Tag
│  ✦ .groupinfo - Group Info
│  ✦ .admins - Admin List
│  ✦ .link - Group Link
│  ✦ .broadcast <msg> - Sab Ko Msg
│
╰───────────────────────╯
> *🔥 POWERED BY ARSLAN MD BIG 🔥*` });
        }
        return;
      }

      if (cmd === '.ping') await sock.sendMessage(from, { text: `💜 *PONG!* 💜\n\n⚡ *Mode:* ${BOT_MODE}\n✅ *ARSLAN MD Chal Raha Hai!*` });
      if (cmd === '.alive') await sock.sendMessage(from, { text: `✅ *Main Zinda Hun!* 💜\nMode: ${BOT_MODE}` });
      if (cmd === '.owner') await sock.sendMessage(from, { text: `👑 *OWNER:* ${config.ownerName}\n📞 wa.me/${config.ownerNumber}` });
      if (cmd === '.info') await sock.sendMessage(from, { text: `🤖 *ARSLAN MD ${BOT_MODE}*\n👑 Owner: ${config.ownerName}\n💜 Theme: Purple VIP` });
      if (cmd === '.hi') await sock.sendMessage(from, { text: `💜 *Hi Meri Jaan!* 😘 Kaise Ho? .menu Likh Ke Menu Dekh Lo!` });
      if (cmd === '.bye') await sock.sendMessage(from, { text: `💜 *Allah Hafiz Meri Jaan!* 😘` });
      if (cmd === '.love') await sock.sendMessage(from, { text: `💜 *MERI JAAN!* 💜\n\nTum Bohat Ache Ho! 🥰` });

      const jokes = ["😂 Teacher: Late kyun aaye? Student: Board pe likha tha 'School Ahead, Go Slow' to slow aa gaya! 😂", "😂 Pappu: Doctor mujhe bhoolne ki bimari hai! Doctor: Kab se? Pappu: Kab se kya? 😂"];
      if (cmd === '.joke') await sock.sendMessage(from, { text: `😂 *JOKE* 💜\n\n${jokes[Math.floor(Math.random()*jokes.length)]}` });
      if (cmd === '.quote') await sock.sendMessage(from, { text: `💜 'Mehnat itni khamoshi se karo ke kamyabi shor macha de!'` });
      if (cmd === '.shayari') await sock.sendMessage(from, { text: `💜 *Teri muskurahat pe fida hun meri jaan,*\n*Teri har baat pe qurban hun meri jaan!* 😘` });

      if (cmd.startsWith('.song') || cmd.startsWith('.play')) {
        if (!args) return sock.sendMessage(from, { text: "❌ Gaane ka naam likho!\n*Misal:* .song Atif Aslam Pehli Dafa" });
        await sock.sendMessage(from, { text: `🎵 *SONG MIL GAYA!* 💜\n\n🎤 *Naam:* ${args}\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(args)}` });
      }
      if (cmd === '.time') {
        const now = new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' });
        await sock.sendMessage(from, { text: `🕐 *TIME* 💜\n\n${now}` });
      }
      if (cmd === '.date') {
        const d = new Date().toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', weekday:'long', year:'numeric', month:'long', day:'numeric' });
        await sock.sendMessage(from, { text: `📅 *DATE* 💜\n\n${d}` });
      }
      if (cmd === '.groupinfo' && isGroup) {
        const meta = await sock.groupMetadata(from);
        await sock.sendMessage(from, { text: `👥 *GROUP INFO* 💜\n\n📛 ${meta.subject}\n👥 Members: ${meta.participants.length}` });
      }
      if (cmd === '.tagall' && isGroup) {
        const meta = await sock.groupMetadata(from);
        const mentions = meta.participants.map(p => p.id);
        const txt = `💜 *TAG ALL* 💜\n\n` + meta.participants.map(p => `@${p.id.split('@')[0]}`).join(' ');
        await sock.sendMessage(from, { text: txt, mentions });
      }
    } catch(e){ console.log("Msg Error:", e.message); }
  });
}
startBot();
