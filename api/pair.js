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
  if (number.length < 10) return res.status(400).json({ error: "Sahi number daalo" });

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("/tmp/arslan-" + number + "-" + Date.now());

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    sock.ev.on("creds.update", saveCreds);

    // Connection khulne ka wait karo
    const code = await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        try { sock.end(); } catch {}
        reject(new Error("Connection timeout, phir try karo"));
      }, 25000);

      sock.ev.on("connection.update", async (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === "open") {
          clearTimeout(timeout);
          try {
            if (!sock.authState.creds.registered) {
              const c = await sock.requestPairingCode(number);
              resolve(c);
            } else {
              resolve("ALREADY");
            }
          } catch (e) { reject(e); }
          setTimeout(() => { try { sock.end(); } catch {} }, 2000);
        }
        if (connection === "close") {
          // Agar pairing se pehle band hua to dobara try mat karo, error de do
          if (!sock.authState.creds.registered) {
            // 1 dafa thora ruk ke phir code mangne ki koshish
            setTimeout(async () => {
              try {
                const c = await sock.requestPairingCode(number);
                clearTimeout(timeout);
                resolve(c);
              } catch (e) {
                // chup raho, timeout handle karega
              }
            }, 3000);
          }
        }
      });
    });

    if (code === "ALREADY") return res.status(200).json({ success: true, message: "Already registered" });
    return res.status(200).json({ success: true, code: code });

  } catch (e) {
    console.log("PAIR ERROR:", e.message);
    return res.status(500).json({ error: e.message || "Pair fail, phir try karo" });
  }
      }
