const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const app = express();
let sock;

app.get('/', (req,res)=>res.send(`<center style="font-family:sans-serif"><h1>🤖 ARSLAN MD</h1><p>Owner: MR ARSLAN</p><input id=n placeholder=923467214839 style="padding:12px"><br><br><button onclick="fetch('/pair?number='+document.getElementById('n').value).then(r=>r.json()).then(d=>document.getElementById('c').innerText=d.code)" style="padding:12px;background:#25D366;color:white;border:none">GET PAIR CODE</button><h1 id=c></h1><p>WhatsApp > Linked Devices > Link with phone number</p></center>`));

app.get('/pair', async (req,res)=>{
  if(!sock) await start();
  try{
    let code = await sock.requestPairingCode(req.query.number);
    res.json({code});
  }catch{ res.json({code:"Error, Dobara Try Karo"}); }
});

async function start(){
  const {state,saveCreds} = await useMultiFileAuthState('auth');
  sock = makeWASocket({auth:state, logger:pino({level:'silent'}), browser:["ARSLAN MD","Chrome","1.0"]});
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', u=>{ if(u.connection==='open') console.log("ARSLAN MD CONNECT HO GAYA!"); if(u.connection==='close') setTimeout(start,3000); });

  sock.ev.on('messages.upsert', async ({messages})=>{
    let m=messages[0]; if(!m.message||m.key.fromMe) return;
    let t = m.message.conversation || m.message.extendedTextMessage?.text || "";
    let from = m.key.remoteJid;
    let p = config.prefix;

    if(t===p+"menu"){
      let menu = `*🤖 ARSLAN MD MENU 🤖*\n\n*Owner:* MR ARSLAN\n*Number:* 923467214839\n*Prefix:* ${p}\n\n*— MAIN —*\n${p}menu - Menu\n${p}ping - Speed\n${p}alive - Bot Check\n${p}owner - Owner\n\n*— FUN —*\n${p}song <name> - Song\n${p}hi - Salam\n\n_Powered by ARSLAN MD_`;
      if(fs.existsSync('./menu.jpg')){
        await sock.sendMessage(from, {image: fs.readFileSync('./menu.jpg'), caption: menu});
      } else {
        await sock.sendMessage(from, {text: menu});
      }
    }
    if(t===p+"ping") await sock.sendMessage(from,{text:"Pong! ⚡ ARSLAN MD Full Tez Hai"});
    if(t===p+"alive") await sock.sendMessage(from,{text:"Han Bhai Zinda Hun 😎\n*ARSLAN MD* By MR ARSLAN"});
    if(t===p+"owner") await sock.sendMessage(from,{text:"*Owner:* MR ARSLAN 👑\nwa.me/923467214839"});
    if(t.startsWith(p+"song ")) await sock.sendMessage(from,{text:"🎵 Song Search: "+t.replace(p+"song ","")});
    if(t.toLowerCase()==="hi") await sock.sendMessage(from,{text:"Walaikum Assalam! .menu Likho 😊"});
  });
}
start();
app.listen(process.env.PORT||3000, ()=>console.log("ARSLAN MD On Hai"));
