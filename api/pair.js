import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;
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
  if (number.length < 10) return res.status(400).json({ error: "Sahi number daalo" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState("/tmp/arslan-" + number);

    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: ["ARSLAN-MD", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    await new Promise((r) => setTimeout(r, 2000));

    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number);
      try { sock.end(); } catch {}
      return res.status(200).json({ success: true, code: code });
    } else {
      try { sock.end(); } catch {}
      return res.status(200).json({ success: true, message: "Already registered" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message || "Pair fail ho gaya, phir try karo" });
  }
}
