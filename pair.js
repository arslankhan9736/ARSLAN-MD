// api/pair.js - FIXED VERSION
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    let body = req.body
    if (typeof body === 'string') body = JSON.parse(body)
    const { number } = body || {}
    if (!number) return res.status(400).json({ error: 'Number chahiye' })

    const cleanNumber = number.replace(/[^0-9]/g, '')

    // FIX 1: Version le liya
    const { version } = await fetchLatestBaileysVersion()

    // FIX 2: /tmp laga diya - Vercel pe sirf yahan likh sakte hain
    const { state, saveCreds } = await useMultiFileAuthState(`/tmp/auth_${cleanNumber}`)
    
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['ARSLAN-MDX', 'Chrome', '1.0.0']
    })
    sock.ev.on('creds.update', saveCreds)

    await new Promise(r => setTimeout(r, 2000))
    const code = await sock.requestPairingCode(cleanNumber)

    // FIX 3: Socket band kar diya taake Vercel hang na ho
    setTimeout(() => { try { sock.end() } catch(e){} }, 3000)
    
    return res.status(200).json({ code: code, success: true })

  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e.message })
  }
      }
