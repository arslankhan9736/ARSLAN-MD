import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = pkg;
import pino from "pino";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  let { number } = req.body || {};
  if (!number) return res.status(400).json({ error: "Number nahi diya" });
  number = String(number).replace(/[^0-9]/g, "");

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("/tmp/arslan-" + Date.now());

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: ["Chrome", "Chrome", "1.0"],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });
    sock.ev.on("creds.update", saveCreds);

    // IMPORTANT: Open ka wait NAHI karna, seedha code mangna hai
    await new Promise(r => setTimeout(r, 1500));

    if (sock.authState.creds.registered) {
      try { sock.end(); } catch {}
      return res.status(200).json({ success: true, message: "Already registered" });
    }

    const code = await sock.requestPairingCode(number);

    // Code mil gaya, ab 5 sec baad socket band karo taake creds save ho jayen
    setTimeout(() => { try { sock.end(); } catch {} }, 5000);

    return res.status(200).json({ success: true, code: code });

  } catch (e) {
    console.log("PAIR ERROR:", e);
    // Ye wala error aksar is liye aata hai ke number pe pehle se request gayi hui hai
    if (String(e.message).includes("Connection Closed")) {
      return res.status(500).json({ error: "WhatsApp ne connection band kar diya, 2 min ruk ke phir try karo meri jaan" });
    }
    return res.status(500).json({ error: e.message || "Phir try karo" });
  }
}
