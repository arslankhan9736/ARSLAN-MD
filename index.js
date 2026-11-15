import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import express from 'express';
import config from './config.js';

const app = express();
app.use(express.json());

// ==========================================
// 1. WEB PAIRING ROUTE & FRONTEND (Vercel Compatible)
// ==========================================
app.get('/pair', async (req, res) => {
    let num = req.query.num;
    if (!num) {
        return res.json({ error: "Phone number is required!" });
    }
    num = num.replace(/[^0-9]/g, '');

    const sessionPath = path.join('/tmp', 'session_' + Date.now());

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
                        
                        const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                        await sock.sendMessage(ownerJid, { 
                            text: `💜 *${config.BOT_NAME} NEW SESSION ID* 💜\n\n\`\`\`${base64Session}\`\`\`` 
                        });
                    }
                } catch (e) {
                    console.log("Error sending session to WhatsApp:", e);
                }
            }
        });

    } catch (err) {
        return res.json({ error: "Server Error!" });
    }
});

// Homepage UI with "Get Session ID" Button
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.BOT_NAME} - SESSION & PAIRING</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #0d0d0d; color: #fff; font-family: sans-serif; text-align: center; padding-top: 40px; }
                .card { background: #1a1a1a; padding: 25px; border-radius: 12px; display: inline-block; box-shadow: 0 0 20px rgba(255,7,58,0.4); max-width: 420px; width: 90%; }
                input { padding: 12px; width: 80%; border-radius: 6px; border: none; text-align: center; font-size: 16px; margin-bottom: 10px; }
                button { padding: 12px 25px; background: #ff073a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; width: 85%; }
                button:hover { background: #d90429; }
                #code { margin-top: 20px; font-size: 20px; color: #00ff66; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color: #ff073a;">💜 ${config.BOT_NAME} 💜</h2>
                <p>Enter your WhatsApp number with country code:</p>
                <input type="text" id="phone" placeholder="${config.OWNER_NUMBER}"><br>
                <button onclick="getPair()">Get Pairing Code & Session</button>
                <div id="code"></div>
            </div>
            <script>
                async function getPair() {
                    let num = document.getElementById('phone').value;
                    if(!num) return alert('Please enter your WhatsApp number!');
                    let codeDiv = document.getElementById('code');
                    codeDiv.innerText = '⏳ Generating Pairing Code... Please wait...';
                    
                    try {
                        let res = await fetch('/pair?num=' + num);
                        let data = await res.json();
                        if(data.code) {
                            codeDiv.innerHTML = \`
                                <p>PAIRING CODE:</p>
                                <span style="color:yellow; font-size: 26px; font-weight: bold;">\${data.code}</span>
                                <p style="font-size: 13px; color: #aaa; margin-top: 10px;">Link this code in WhatsApp (Linked Devices > Link with phone number).</p>
                                <p style="font-size: 13px; color: #00ff66;">⚡ Once connected, your <b>SESSION_ID</b> will be sent directly to your WhatsApp chat!</p>
                            \`;
                        } else {
                            codeDiv.innerHTML = '<span style="color: red;">Error: ' + (data.error || 'Failed to generate code') + '</span>';
                        }
                    } catch(e) {
                        codeDiv.innerHTML = '<span style="color: red;">Server connection error!</span>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

export default app;
