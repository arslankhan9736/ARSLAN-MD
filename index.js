
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';

import pino from 'pino';
import express from 'express';
import config from './config.js';

const app = express();

app.get('/', (req, res) => {
  res.send('💜 ARSLAN-MD PRO IS ONLINE 💜');
});

app.listen(process.env.PORT || 3000);

let startTime = Date.now();
let reconnecting = false;

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./session');

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: [config.BOT_NAME, 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  if (!state.creds.registered) {
    if (!/^\d{10,15}$/.test(config.OWNER_NUMBER)) {
      throw new Error('Set a valid OWNER_NUMBER in config.js');
    }

    const code = await sock.requestPairingCode(
      config.OWNER_NUMBER
    );

    console.log('💜 PAIRING CODE:', code);
  }

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      reconnecting = false;
      console.log('💜 ARSLAN-MD CONNECTED!');
    }

    if (connection === 'close' && !reconnecting) {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        reconnecting = true;
        setTimeout(() => startBot(), 3000);
      } else {
        console.log('Session logged out. Pair again.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];

    if (!m?.message || m.key.fromMe) return;

    const from = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text || '';

    if (!text.startsWith(config.PREFIX)) return;

    const args = text.slice(config.PREFIX.length)
      .trim().split(/\s+/);

    const cmd = args.shift()?.toLowerCase();

    const reply = async message => {
      await sock.sendMessage(from, { text: message }, {
        quoted: m
      });
    };

    if (cmd === 'menu' || cmd === 'help') {
      await reply(
`💜 ARSLAN-MD PRO 💜

GENERAL
.menu
.ping
.owner
.runtime
.info
.help

GROUP
.kick
.promote
.demote
.tagall
.welcome
.goodbye

FUN
.joke
.quote
.fact
.love

AI & MEDIA
.ai
.sticker
.toimg
.blur
.tts

👑 MR ARSLAN`
      );
    }

    else if (cmd === 'ping') {
      await reply('PONG! ⚡ ARSLAN-MD ACTIVE');
    }

    else if (cmd === 'owner') {
      await reply(
        `Owner: ${config.OWNER_NAME}\nNumber: ${config.OWNER_NUMBER}`
      );
    }

    else if (cmd === 'runtime') {
      const seconds = Math.floor(
        (Date.now() - startTime) / 1000
      );

      await reply(
        `Uptime: ${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`
      );
    }

    else if (cmd === 'info') {
      await reply(
        `Bot: ${config.BOT_NAME}\nOwner: ${config.OWNER_NAME}`
      );
    }

    else if (cmd === 'joke') {
      await reply('Teacher: Homework kahan hai? 😂');
    }

    else if (cmd === 'quote') {
      await reply('Believe in yourself. 💜');
    }

    else if (cmd === 'fact') {
      await reply('Interesting fact: Octopuses have three hearts!');
    }

    else if (cmd === 'love') {
      await reply('💜 Fun Love Meter: Just for entertainment!');
    }

    else {
      await reply(
        'This command is not implemented yet. 💜'
      );
    }
  });
}

startBot().catch(console.error);
