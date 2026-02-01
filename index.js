import 'dotenv/config'
import { createClient } from 'bedrock-protocol'

let client
let autoInterval

function sendChat(msg) {
  client.queue('text', {
    type: 'chat',
    needs_translation: false,
    source_name: '',
    message: msg,
    xuid: '',
    platform_chat_id: ''
  })
}

function startBot() {
  client = createClient({
    host: process.env.SERVER_IP,
    port: Number(process.env.SERVER_PORT || 19132),
    username: process.env.MC_EMAIL,
    password: process.env.MC_PASSWORD,
    authTitle: 'Minecraft'
  })

  client.on('join', () => {
    console.log('✅ Bot online')
    sendChat('🤖 Auto-text bot online!')

    // Start auto message interval
    autoInterval = setInterval(() => {
      sendChat(process.env.AUTOTEXT)
    }, Number(process.env.INTERVAL) || 60000)
  })

  client.on('text', (packet) => {
    const msg = packet.message
    const sender = packet.source_name

    // Owner-only commands in chat
    if (!sender || sender !== process.env.OWNER_NAME) return

    if (msg === '!stop') {
      clearInterval(autoInterval)
      sendChat('🛑 Auto-text stopped')
    }

    if (msg === '!start') {
      autoInterval = setInterval(() => {
        sendChat(process.env.AUTOTEXT)
      }, Number(process.env.INTERVAL) || 60000)
      sendChat('▶ Auto-text started')
    }

    if (msg.startsWith('!settext ')) {
      process.env.AUTOTEXT = msg.slice(9)
      sendChat(`✏ Auto-text changed to: ${process.env.AUTOTEXT}`)
    }

    if (msg.startsWith('!setinterval ')) {
      clearInterval(autoInterval)
      process.env.INTERVAL = msg.slice(13)
      autoInterval = setInterval(() => {
        sendChat(process.env.AUTOTEXT)
      }, Number(process.env.INTERVAL) || 60000)
      sendChat(`⏱ Auto-text interval set to ${process.env.INTERVAL}ms`)
    }
  })

  client.on('disconnect', () => {
    console.log('❌ Disconnected, reconnecting...')
    clearInterval(autoInterval)
    setTimeout(startBot, 5000)
  })
}

startBot()
