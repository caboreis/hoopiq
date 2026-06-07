import dotenv from 'dotenv'
import Stripe from 'stripe'

dotenv.config()

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in .env')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

const PLANS = [
  { id: 'scout', name: 'Scout', unit_amount: 900 },
  { id: 'pro', name: 'Pro', unit_amount: 2900 },
  { id: 'elite', name: 'Elite', unit_amount: 8900 },
]

async function findOrCreateProduct(name) {
  const res = await stripe.products.list({ limit: 100 })
  const found = res.data.find(p => p.name === name)
  if (found) return found
  return await stripe.products.create({ name })
}

async function findPriceForProduct(productId, unit_amount) {
  const res = await stripe.prices.list({ product: productId, limit: 100 })
  const found = res.data.find(p => p.unit_amount === unit_amount && p.recurring && p.recurring.interval === 'month')
  return found
}

async function ensurePrices() {
  const created = {}
  for (const plan of PLANS) {
    const product = await findOrCreateProduct(plan.name)
    let price = await findPriceForProduct(product.id, plan.unit_amount)
    if (!price) {
      price = await stripe.prices.create({
        unit_amount: plan.unit_amount,
        currency: 'eur',
        recurring: { interval: 'month' },
        product: product.id,
      })
      console.log(`Created price for ${plan.name}: ${price.id}`)
    } else {
      console.log(`Found existing price for ${plan.name}: ${price.id}`)
    }
    created[plan.id] = price.id
  }
  return created
}

ensurePrices()
  .then(res => {
    console.log('\nResulting price IDs:')
    console.log(JSON.stringify(res, null, 2))
  })
  .catch(err => {
    console.error('Error creating prices:', err)
    process.exit(1)
  })
