import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import config from './config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.get('/', (req,res)=>res.send("ARSLAN MD ONLINE 💜"));
app.listen(3000);
async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: pino({level:'silent'}), browser: ['ARSLAN-MD','Chrome','1.0.0'] });
  sock.ev.on('creds.update', saveCreds);
  const plugins = new Map();
  if(!fs.existsSync('./plugins')) fs.mkdirSync('./plugins');
  for(const file of fs.readdirSync('./plugins').filter(f=>f.endsWith('.js'))){
    const p = (await import(`./plugins/${file}`)).default;
    if(p) plugins.set(p.name, p);
  }
  if(!sock.authState.creds.registered){
    const num = config.OWNER_NUMBER.replace(/[^0-9]/g,'');
    setTimeout(async()=>{ const code = await sock.requestPairingCode(num); console.log("PAIRING CODE: "+code); }, 3000);
  }
  sock.ev.on('connection.update',(u)=>{
    if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
    if(u.connection==='open') console.log("ARSLAN MD CONNECT HO GAYA 💜");
  });
  sock.ev.on('messages.upsert', async({messages})=>{
    const m=messages[0]; if(!m.message||m.key.fromMe) return;
    const from=m.key.remoteJid;
    const text=m.message.conversation||m.message.extendedTextMessage?.text||"";
    if(!text.startsWith(config.PREFIX)) return;
    const args=text.slice(1).trim().split(/ +/);
    const cmd=args.shift().toLowerCase();
    const plugin=plugins.get(cmd);
    if(plugin) await plugin.execute(sock,m,{args,from,config});
    else if(cmd==='menu'){
      let menu=`💜 *ARSLAN MD* 💜\n\n`;
      for(let [n,p] of plugins) menu+=`.${n} - ${p.desc}\n`;
      await sock.sendMessage(from,{text:menu});
    }
  });
}
startBot();
