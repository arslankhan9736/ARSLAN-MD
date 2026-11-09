import express from "express";
import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = pkg;
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.static("public"));
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sock = null;

async function start(number){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  sock = makeWASocket({ version, logger: pino({level:"silent"}), auth: state, printQRInTerminal:false, browser:["Chrome","Chrome","1.0"] });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u)=>{
    if(u.connection==="open") console.log("LINKED HO GAYA!");
    if(u.connection==="close") sock = null;
  });
  await new Promise(r=>setTimeout(r,2000));
  const code = await sock.requestPairingCode(number);
  return code;
}

app.post("/api/pair", async (req,res)=>{
  try{
    const number = String(req.body.number || "").replace(/[^0-9]/g,"");
    const code = await start(number);
    res.json({success:true, code});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/", (req,res)=> res.sendFile(path.join(__dirname,"public/index.html")));

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log("Chal gaya PORT "+PORT));
