import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function generateSession() {
  const { version } = await fetchLatestBaileysVersion();
  // Temp session folder
  const { state, saveCreds } = await useMultiFileAuthState('./temp_session');

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ["ARSLAN-MD-SESSION", "Chrome", "1.0.0"]
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    let num = await question('📱 Apna WhatsApp number likhein (misal 923467214839): ');
    num = num.replace(/[^0-9]/g, '');

    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(num);
        let formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n========================================`);
        console.log(`💜 APKA PAIRING CODE: \x1b[1m\x1b[32m${formattedCode}\x1b[0m`);
        console.log(`========================================\n`);
      } catch (e) {
        console.log("❌ Error generating code:", e);
      }
    }, 4000);
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ WhatsApp Connected Successfully! Generating Session ID...\n');
      
      try {
        // creds.json file ko read kar ke base64 encode kar lein ge
        const credsPath = './temp_session/creds.json';
        if (fs.existsSync(credsPath)) {
          const credsData = fs.readFileSync(credsPath, 'utf8');
          // Session string ko base64 ya direct format mein nikalna
          const base64Session = Buffer.from(credsData).toString('base64');
          
          console.log("==================================================");
          console.log("💜 YAH AAPKI SESSION ID HAI (Isko copy kar lein):");
          console.log("==================================================");
          console.log(base64Session);
          console.log("==================================================\n");
        }
      } catch (err) {
        console.log("Error reading session file:", err);
      }

      setTimeout(() => {
        process.exit(0);
      }, 5000);
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log("❌ Logged out. Dobara run karein.");
        process.exit(0);
      }
    }
  });
}

generateSession();
