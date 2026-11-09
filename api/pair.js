import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = pkg;
import pino from "pino";

let sock = globalThis.__sock || null;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  let { number } = req.body || {};
  if (!number) return res.status(400).json({ error: "Number nahi diya" });
  number = String(number).replace(/[^0-9]/g, "");

  try {
    if (!sock) {
      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState("/tmp/arslan-session");
      sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Chrome", "Chrome", "1.0"],
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });
      sock.ev.on("creds.update", saveCreds);
      sock.ev.on("connection.update", (u) => {
        if (u.connection === "close") {
          sock = null;
          globalThis.__sock = null;
        }
      });
      globalThis.__sock = sock;
      await new Promise(r => setTimeout(r, 2000));
    }

    const code = await sock.requestPairingCode(number);
    return res.status(200).json({ success: true, code: code });

  } catch (e) {
    console.log("PAIR ERROR:", e.message);
    sock = null;
    globalThis.__sock = null;
    return res.status(500).json({ error: "1 min ruk ke phir dabao" });
  }
        }
