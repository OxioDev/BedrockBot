import 'dotenv/config'
import { createClient } from 'bedrock-protocol'

let client
let autoInterval

function sendChat(message) {
  if (!client) return
  client.queue('text', {
    type: 'chat',
    needs_translation: false,
    source_name: '',
    message,
    xuid: '',
    platform_chat_id: ''
  })
}

function startBot() {
  console.log('⏳ Starting bot...')

 client = createClient({
  host: process.env.SERVER_IP,
  port: Number(process.env.SERVER_PORT || 19132),

  username: process.env.MC_EMAIL,
  password: process.env.MC_PASSWORD,

  authTitle: 'Minecraft',
  flow: 'msal',        // ✅ REQUIRED
  skipPing: true       // (Render workaround)
})


  client.on('join', () => {
    console.log('✅ Bot joined server')
    sendChat('🤖 Auto-text bot online!')

    autoInterval = setInterval(() => {
      sendChat(process.env.AUTOTEXT || 'Hello from bot!')
    }, Number(process.env.INTERVAL) || 60000)
  })

  client.on('text', (packet) => {
    const msg = packet.message
    const sender = packet.source_name

    if (!sender || sender !== process.env.OWNER_NAME) return

    if (msg === '!stop') {
      clearInterval(autoInterval)
      sendChat('🛑 Auto-text stopped')
    }

    if (msg === '!start') {
      clearInterval(autoInterval)
      autoInterval = setInterval(() => {
        sendChat(process.env.AUTOTEXT || 'Hello from bot!')
      }, Number(process.env.INTERVAL) || 60000)
      sendChat('▶ Auto-text started')
    }

    if (msg.startsWith('!settext ')) {
      process.env.AUTOTEXT = msg.slice(9)
      sendChat(`✏ Text set to: ${process.env.AUTOTEXT}`)
    }

    if (msg.startsWith('!setinterval ')) {
      const newInterval = Number(msg.slice(13))
      if (!isNaN(newInterval)) {
        clearInterval(autoInterval)
        process.env.INTERVAL = newInterval
        autoInterval = setInterval(() => {
          sendChat(process.env.AUTOTEXT)
        }, newInterval)
        sendChat(`⏱ Interval set to ${newInterval}ms`)
      }
    }
  })

  client.on('disconnect', () => {
    console.log('❌ Disconnected, restarting in 5s')
    clearInterval(autoInterval)
    setTimeout(startBot, 5000)
  })

  client.on('error', (err) => {
    console.error('⚠ Bot error:', err.message)
  })
}

startBot()
