import express from "express";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import pino from "pino";

const app = express();
app.use(express.json());

// بٹن والا پیج
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head><title>ARSLAN-MD PAIR</title></head>
  <body style="background:#111;color:white;text-align:center;font-family:sans-serif;padding-top:80px">
    <h1 style="color:#ff4da6">ARSLAN-MD 💜</h1>
    <p>Apna WhatsApp Number Likho, Bina + Ke</p>
    <input id="num" placeholder="923467214839" style="padding:12px;width:250px;border-radius:10px;border:none;text-align:center;font-size:16px" />
    <br><br>
    <button onclick="getCode()" style="padding:12px 30px;background:#ff4da6;color:white;border:none;border-radius:10px;font-size:18px">GET PAIRING CODE</button>
    <h2 id="result" style="color:yellow"></h2>
    <p id="info"></p>
    <script>
      async function getCode(){
        let num = document.getElementById("num").value;
        document.getElementById("result").innerText = "Wait Karo...";
        let r = await fetch("/pair?number=" + num);
        let d = await r.json();
        if(d.code){
          document.getElementById("result").innerText = "PAIRING CODE: " + d.code;
          document.getElementById("info").innerText = "Is Code Ko WhatsApp > Linked Devices > Link With Phone Number Me Daalo";
        } else {
          document.getElementById("result").innerText = d.error || "Error Aa Gaya";
        }
      }
    </script>
  </body>
  </html>
  `);
});

// Pairing Code Wala System
app.get("/pair", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.json({ error: "Number Nahi Diya" });

  num = num.replace(/[^0-9]/g, "");
  const folder = "./temp_session";
  if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
  fs.mkdirSync(folder);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(folder);
    const sock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: ["ARSLAN-MD", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        // Session ID Banao
        let credsFile = fs.readFileSync(path.join(folder, "creds.json"));
        let sessionId = Buffer.from(credsFile).toString("base64");
        let fullId = "ARSLAN-MD;;;" + sessionId;

        // WhatsApp Pe Session ID Bhejo
        await sock.sendMessage(sock.user.id, { text: "ARSLAN-MD SESSION ID 💜\n\n" + fullId + "\n\nIs Ko Copy Kar Ke Config Me Daalo" });
        console.log("SESSION READY:", fullId);
        if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
      }
      if (connection === "close") {
        let reason = lastDisconnect?.error?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          console.log("Dobara Connect Ho Raha Hai...");
        }
      }
    });

    // Thora Wait Kar Ke Code Mango
    await new Promise((r) => setTimeout(r, 3000));
    let code = await sock.requestPairingCode(num);
    res.json({ code: code });

  } catch (e) {
    console.log(e);
    res.json({ error: "Pairing Code Nahi Mila, Dobara Try Karo" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("PAIR SERVER ON " + PORT));
