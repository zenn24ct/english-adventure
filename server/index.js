import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set. AI endpoints will fail until you set it.')
}

// POST /api/generate-scene
// フロントから渡された body をそのままAnthropicに渡し、JSONレスポンスを返す
app.post('/api/generate-scene', async (req, res) => {
  try {
    // リクエストボディ（フロントで作る payload: model, messages, etc.）
    const payload = req.body

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server missing ANTHROPIC_API_KEY' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('server error', err)
    res.status(500).json({ error: String(err) })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`)
})
