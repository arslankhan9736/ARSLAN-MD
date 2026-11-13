cat > index.js << 'EOF'
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
app.use(express.static(__dirname));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(3000, ()=>console.log('🌐 Website: http://localhost:3000'));

async function startBot(){
  console.log(`💜 ${config.BOT_NAME} Starting...`);
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ version, auth: state, printQRInTerminal:false, logger:pino({level:'silent'}), browser:['ARSLAN-MD','Chrome','1.0.0'], syncFullHistory:false });
  sock.ev.on('creds.update', saveCreds);
  const plugins = new Map();
  const pluginsDir = path.join(__dirname,'plugins');
  if(!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
  for(const file of fs.readdirSync(pluginsDir).filter(f=>f.endsWith('.js'))){
    try{ const p = (await import(`./plugins/${file}`)).default; if(p&&p.name){ plugins.set(p.name.toLowerCase(),p); if(p.alias) p.alias.forEach(a=>plugins.set(a.toLowerCase(),p)); console.log(`✅ ${p.name}`);} }catch(e){ console.log(`❌ ${file}:`,e.message); }
  }
  if(!sock.authState.creds.registered){
    const num = (process.env.PAIR_NUMBER||config.OWNER_NUMBER).replace(/[^0-9]/g,'');
    setTimeout(async()=>{ try{ const code = await sock.requestPairingCode(num); console.log("✅ PAIRING CODE: "+code);}catch(e){ console.log("❌ Pairing Error:",e.message);} },3000);
  }
  sock.ev.on('connection.update',(u)=>{
    const {connection,lastDisconnect}=u;
    if(connection==='close'){ if(lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot(); }
    else if(connection==='open') console.log(`✅ ${config.BOT_NAME} CONNECT HO GAYA! 💜`);
  });
  // Welcome / Goodbye
  sock.ev.on('group-participants.update', async({id,participants,action})=>{
    if(config.WELCOME==="true" && action==="add") for(let p of participants) await sock.sendMessage(id,{text:`*_@${p.split('@')[0]} Group Me Welcome! 🎉_*`, mentions:[p]});
    if(config.GOODBYE==="true" && action==="remove") for(let p of participants) await sock.sendMessage(id,{text:`*_@${p.split('@')[0]} Group Chor Gaya! 👋_*`, mentions:[p]});
  });
  sock.ev.on('messages.upsert', async({messages})=>{
    try{
      const m=messages[0]; if(!m.message||m.key.fromMe) return;
      const from=m.key.remoteJid; const isGroup=from.endsWith('@g.us');
      const sender=m.key.participant||from;
      const text=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||m.message.videoMessage?.caption||"";
      // Anti-Link
      if(isGroup && config.ANTI_LINK==="true" && /https?:\/\//.test(text) && !sender.includes(config.OWNER_NUMBER)){
        await sock.sendMessage(from,{text:"🚫 *Link Not Allowed!*"}); return;
      }
      // Auto React
      if(config.AUTO_REACT==="true") await sock.sendMessage(from,{react:{text:"❤️",key:m.key}}).catch(()=>{});
      if(!text.startsWith(config.PREFIX)) return;
      const args=text.slice(config.PREFIX.length).trim().split(/ +/);
      const cmdName=args.shift().toLowerCase();
      const plugin=plugins.get(cmdName);
      if(plugin) await plugin.execute(sock,m,{args,from,sender,isGroup,config,text});
      else if(cmdName==='menu'){
        let menu=`╭───〔 💜 *${config.BOT_NAME}* 💜 〕───╮\n│ 👑 OWNER: ${config.OWNER_NAME}\n│ ⚡ PREFIX: ${config.PREFIX}\n│ 📦 COMMANDS: ${plugins.size}\n│\n`;
        for(let [n,p] of plugins){ if(p.name===n) menu+=`│ ${config.PREFIX}${p.name} - ${p.desc||''}\n`; }
        menu+=`╰──────────────────╯\n> *© POWERED BY MR ARSLAN*`;
        await sock.sendMessage(from,{image:{url:config.MENU_IMAGE_URL},caption:menu});
      }
    }catch(e){ console.log("Msg Error:",e.message); }
  });
}
startBot();
EOF
