// api/pair.js
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { number } = req.body || {}
    if (!number) return res.status(400).json({ error: 'Number chahiye' })

    const cleanNumber = number.replace(/[^0-9]/g, '')
    
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${cleanNumber}`)
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['ARSLAN-MDX', 'Chrome', '1.0.0']
    })
    sock.ev.on('creds.update', saveCreds)

    // Thora wait karo
    await new Promise(r => setTimeout(r, 2000))

    const code = await sock.requestPairingCode(cleanNumber)
    return res.status(200).json({ code: code, success: true })

  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e.message })
  }
    }
