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
    });
    sock.ev.on("creds.update", saveCreds);

    await new Promise(r => setTimeout(r, 1500));
    const code = await sock.requestPairingCode(number);

    // Code mil gaya, ab socket ko zinda rakho taake user code daal sake
    // Hum 55 second tak wait karenge ke user link kare
    const linked = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 55000);
      sock.ev.on("connection.update", (u) => {
        if (u.connection === "open") {
          clearTimeout(timeout);
          resolve(true);
        }
      });
      sock.ev.on("creds.update", () => {
        if (sock.authState.creds.registered) {
          // thora wait karo, connection open hone do
        }
      });
    });

    try { sock.end(); } catch {}

    if (linked) {
      return res.status(200).json({ success: true, code: code, message: "Linked ho gaya!" });
    } else {
      // Agar 55 sec me link nahi hua, to bhi code de do, user dobara try karega
      return res.status(200).json({ success: true, code: code, message: "Code mil gaya, jaldi link karo" });
    }

  } catch (e) {
    console.log("PAIR ERROR:", e);
    return res.status(500).json({ error: e.message || "Phir try karo" });
  }
    }
