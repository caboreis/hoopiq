import app, { ensureStripePrices } from './lib/server-app.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001

ensureStripePrices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Anthropic proxy server listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Error during Stripe initialization:', err)
    app.listen(PORT, () => {
      console.log(`Anthropic proxy server listening on port ${PORT} (Stripe init failed)`)
    })
  })
