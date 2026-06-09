import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'

dotenv.config()

const app = express()
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

let stripe = null
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY)
}

const STRIPE_PRICE_IDS = {
  scout: process.env.STRIPE_PRICE_SCOUT || null,
  pro: process.env.STRIPE_PRICE_PRO || null,
  elite: process.env.STRIPE_PRICE_ELITE || null,
}

async function ensureStripePrices() {
  if (!stripe) {
    console.warn('Stripe not configured (STRIPE_SECRET_KEY missing) — skipping product/price creation')
    return
  }

  const PLANS = [
    { key: 'scout', name: 'Scout', unit_amount: 900 },
    { key: 'pro', name: 'Pro', unit_amount: 2900 },
    { key: 'elite', name: 'Elite', unit_amount: 8900 },
  ]

  const existingProductsRes = await stripe.products.list({ limit: 100 })
  const existingProducts = existingProductsRes.data

  for (const plan of PLANS) {
    try {
      if (STRIPE_PRICE_IDS[plan.key]) {
        console.log(`Price for ${plan.name} already configured: ${STRIPE_PRICE_IDS[plan.key]}`)
        continue
      }

      let product = existingProducts.find(p => p.name === plan.name)
      if (!product) {
        product = await stripe.products.create({ name: plan.name })
        console.log(`Created product ${plan.name}: ${product.id}`)
      } else {
        console.log(`Found existing product for ${plan.name}: ${product.id}`)
      }

      const pricesRes = await stripe.prices.list({ product: product.id, limit: 100 })
      let price = pricesRes.data.find(p => p.unit_amount === plan.unit_amount && p.recurring && p.recurring.interval === 'month')

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

      STRIPE_PRICE_IDS[plan.key] = price.id
    } catch (err) {
      console.error(`Error ensuring price for ${plan.name}:`, err.message || err)
    }
  }
}

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in environment. Add it to your .env file.')
  process.exit(1)
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function fetchBullsPlayers() {
  const rosterUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/4/roster'
  const rosterResponse = await fetch(rosterUrl)
  if (!rosterResponse.ok) throw new Error('ESPN roster fetch failed')
  const rosterData = await rosterResponse.json()
  const players = (rosterData.athletes || []).slice(0, 18)

  return players.map((player, index) => {
    const pos = player.position?.abbreviation || player.position?.displayName || 'N/A'
    const score = Math.min(98, Math.max(72, 92 - index * 1.5))
    return {
      id: player.id,
      name: player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
      pos,
      team: player.teams?.[0]?.displayName || 'Chicago Bulls',
      pts: 0,
      ast: 0,
      reb: 0,
      fg: 0,
      score,
      trend: 0,
      hot: player.status?.type?.toLowerCase() === 'active',
      jersey: player.jersey || null,
      headshot: player.headshot?.href || null,
    }
  })
}

async function fetchEspnLiveScores() {
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard')
  if (!response.ok) throw new Error('ESPN scoreboard fetch failed')
  const data = await response.json()
  const games = (data.events || []).map(event => {
    const competition = event.competitions?.[0] || {}
    const competitors = competition.competitors || []
    const home = competitors.find(c => c.homeAway === 'home') || {}
    const away = competitors.find(c => c.homeAway === 'away') || {}
    const bullsGame = [home, away].some(c => c.team?.displayName?.toLowerCase().includes('bulls'))

    return {
      id: event.id,
      date: competition.date,
      status: competition.status?.type?.shortDetail || competition.status?.type?.description || 'N/A',
      clock: competition.status?.type?.displayClock || '',
      home: {
        name: home.team?.displayName || home.team?.shortDisplayName || 'Home',
        abbreviation: home.team?.abbreviation || '',
        score: home.score || 0,
      },
      away: {
        name: away.team?.displayName || away.team?.shortDisplayName || 'Away',
        abbreviation: away.team?.abbreviation || '',
        score: away.score || 0,
      },
      bulls: bullsGame,
    }
  })
  return games.sort((a, b) => (b.bulls === a.bulls ? 0 : b.bulls ? 1 : -1))
}

// Rich live-center feed: real scores, quarters, leaders, colors for all 30 teams
async function fetchLiveCenterGames() {
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard')
  if (!response.ok) throw new Error('ESPN scoreboard fetch failed')
  const data = await response.json()

  const isDark = (hex) => {
    if (!hex) return true
    const n = parseInt(hex, 16)
    return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) < 90 // near-black
  }
  const mapSide = (c) => {
    const t = c.team || {}
    const ls = (c.linescores || []).map(x => Math.round(Number(x.value) || 0))
    const primary = isDark(t.color) ? (t.alternateColor || t.color) : t.color
    const recTotal = (c.records || []).find(r => r.type === 'total') || (c.records || [])[0]
    return {
      abbr: t.abbreviation || '???',
      name: t.displayName || t.shortDisplayName || 'Team',
      short: t.shortDisplayName || t.name || (t.displayName || '').split(' ').slice(-1)[0] || '',
      color: primary ? `#${primary}` : '#6b6b88',
      logo: t.logo || '',
      record: recTotal?.summary || '',
      score: Number(c.score || 0),
      pts_q: ls.length ? ls : [0, 0, 0, 0],
    }
  }

  const buildPlayers = (c, abbr) => {
    const byId = {}
    for (const cat of (c.leaders || [])) {
      const key = (cat.abbreviation || '').toLowerCase() // pts | reb | ast | rat
      if (!['pts', 'reb', 'ast'].includes(key)) continue
      const ld = cat.leaders?.[0]
      const ath = ld?.athlete
      if (!ath) continue
      const id = ath.id || ath.shortName
      if (!byId[id]) byId[id] = { name: ath.shortName || ath.displayName || '—', team: abbr, pts: 0, ast: 0, reb: 0 }
      byId[id][key] = Math.round(Number(ld.value) || 0)
    }
    return Object.values(byId)
  }

  const games = (data.events || []).map(event => {
    const comp = event.competitions?.[0] || {}
    const competitors = comp.competitors || []
    const homeC = competitors.find(c => c.homeAway === 'home') || {}
    const awayC = competitors.find(c => c.homeAway === 'away') || {}
    const home = mapSide(homeC)
    const away = mapSide(awayC)

    const stType = comp.status?.type || {}
    const state = stType.state // pre | in | post
    const status = state === 'in' ? 'live' : state === 'post' ? 'final' : 'upcoming'
    const quarter = comp.status?.period || 0
    const clock = status === 'final'
      ? 'Final'
      : (status === 'upcoming'
          ? (stType.shortDetail || 'À venir')
          : (comp.status?.displayClock || ''))

    const players = [...buildPlayers(homeC, home.abbr), ...buildPlayers(awayC, away.abbr)]
      .map(p => ({ ...p, hot: p.pts >= 25 }))

    // Simple win-probability heuristic (home %), weighted by how late in the game we are
    let prediction = 50
    if (status !== 'upcoming') {
      const diff = home.score - away.score
      const weight = status === 'final' ? 7 : Math.min(6, quarter + 1)
      prediction = Math.max(5, Math.min(95, Math.round(50 + diff * weight * 0.6)))
    }

    const momentum = status === 'live' ? (home.score >= away.score ? home.abbr : away.abbr) : null

    const top = [...players].sort((a, b) => b.pts - a.pts)[0]
    let ai_comment
    if (status === 'final') ai_comment = `Terminé : ${home.short} ${home.score} – ${away.score} ${away.short}.`
    else if (status === 'upcoming') ai_comment = `À venir : ${away.name} @ ${home.name}. ${clock}`
    else if (top && top.pts > 0) ai_comment = `${top.name} porte ${top.team} avec ${top.pts} pts ! 🔥`
    else ai_comment = `${home.abbr} ${home.score} – ${away.score} ${away.abbr} en direct.`

    return { id: event.id, status, quarter, clock, home, away, momentum, prediction, players, ai_comment }
  })

  const rank = { live: 0, upcoming: 1, final: 2 }
  return games.sort((a, b) => rank[a.status] - rank[b.status])
}

// Deep detail for one game: full boxscore, real win probability, team stats, play-by-play
async function fetchGameDetail(eventId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${encodeURIComponent(eventId)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('ESPN summary fetch failed')
  const d = await response.json()

  // Real win probability (home %) — last sample of the curve
  const wp = d.winprobability || []
  const lastWp = wp[wp.length - 1]
  const winProbHome = lastWp && typeof lastWp.homeWinPercentage === 'number'
    ? Math.round(lastWp.homeWinPercentage * 100)
    : null

  // Full boxscore per team
  const num = (s, i) => (i >= 0 && s[i] != null ? parseInt(s[i], 10) || 0 : 0)
  const teams = (d.boxscore?.players || []).map(t => {
    const grp = (t.statistics || [])[0] || {}
    const labels = grp.labels || []
    const L = {
      min: labels.indexOf('MIN'), pts: labels.indexOf('PTS'), fg: labels.indexOf('FG'),
      tp: labels.indexOf('3PT'), reb: labels.indexOf('REB'), ast: labels.indexOf('AST'),
      stl: labels.indexOf('STL'), blk: labels.indexOf('BLK'), pm: labels.indexOf('+/-'),
    }
    const players = (grp.athletes || [])
      .filter(a => !a.didNotPlay && Array.isArray(a.stats) && a.stats.length)
      .map(a => {
        const s = a.stats
        return {
          name: a.athlete?.shortName || a.athlete?.displayName || '—',
          headshot: a.athlete?.headshot?.href || null,
          starter: !!a.starter,
          min: L.min >= 0 ? s[L.min] : '',
          pts: num(s, L.pts), reb: num(s, L.reb), ast: num(s, L.ast),
          stl: num(s, L.stl), blk: num(s, L.blk),
          fg: L.fg >= 0 ? s[L.fg] : '', tp: L.tp >= 0 ? s[L.tp] : '',
          pm: L.pm >= 0 ? s[L.pm] : '',
        }
      })
      .sort((a, b) => b.pts - a.pts)
    return { abbr: t.team?.abbreviation || '???', players }
  })

  // Team-level stat comparison
  const teamStats = (d.boxscore?.teams || []).map(t => {
    const m = {}
    for (const s of (t.statistics || [])) m[s.label] = s.displayValue
    return {
      abbr: t.team?.abbreviation || '???',
      fg: m['FG'] || '', fgPct: m['Field Goal %'] || '',
      tp: m['3PT'] || '', tpPct: m['Three Point %'] || '',
      ft: m['FT'] || '', reb: m['Rebounds'] || '',
      ast: m['Assists'] || '', to: m['Turnovers'] || '',
    }
  })

  // Recent plays (most recent first)
  const plays = (d.plays || []).slice(-20).reverse().map(p => ({
    period: p.period?.number || 0,
    clock: p.clock?.displayValue || '',
    text: p.text || '',
    home: Number(p.homeScore ?? 0),
    away: Number(p.awayScore ?? 0),
    scoring: !!p.scoringPlay,
  }))

  // Records from header
  const records = {}
  const headerCompetitors = d.header?.competitions?.[0]?.competitors || []
  for (const c of headerCompetitors) {
    const rec = (c.record || []).find(x => x.type === 'total') || (c.record || [])[0]
    records[c.team?.abbreviation] = rec?.summary || null
  }

  return { id: String(eventId), winProbHome, teams, teamStats, plays, records }
}

// Gather real, prediction-relevant context for one game (odds, h2h, injuries, form)
async function fetchPredictionContext(eventId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${encodeURIComponent(eventId)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('ESPN summary fetch failed')
  const d = await response.json()

  const comp = d.header?.competitions?.[0] || {}
  const competitors = comp.competitors || []
  const findSide = (ha) => competitors.find(c => c.homeAway === ha) || {}
  const homeC = findSide('home'), awayC = findSide('away')
  const teamName = (c) => c.team?.displayName || c.team?.abbreviation || 'Team'
  const teamAbbr = (c) => c.team?.abbreviation || '???'
  const recOf = (c) => ((c.record || []).find(r => r.type === 'total') || (c.record || [])[0])?.summary || 'N/A'

  const state = comp.status?.type?.state || 'pre'
  const status = state === 'in' ? 'live' : state === 'post' ? 'final' : 'upcoming'

  const odds = (d.odds || d.pickcenter || [])[0] || null
  const series = (d.seasonseries || [])[0]?.summary || null

  const injuries = (d.injuries || []).map(g => ({
    team: g.team?.abbreviation,
    out: (g.injuries || []).map(i => `${i.athlete?.shortName || '?'} (${i.status || '?'})`),
  })).filter(g => g.out.length)

  // team season stats from boxscore if the game is live/final
  const teamStats = (d.boxscore?.teams || []).map(t => {
    const m = {}
    for (const s of (t.statistics || [])) m[s.label] = s.displayValue
    return { abbr: t.team?.abbreviation, fgPct: m['Field Goal %'], tpPct: m['Three Point %'], reb: m['Rebounds'], ast: m['Assists'], to: m['Turnovers'] }
  })

  return {
    id: String(eventId),
    status,
    home: { abbr: teamAbbr(homeC), name: teamName(homeC), record: recOf(homeC), score: Number(homeC.score || 0), color: homeC.team?.color ? `#${homeC.team.color}` : null, logo: homeC.team?.logos?.[0]?.href || homeC.team?.logo || null },
    away: { abbr: teamAbbr(awayC), name: teamName(awayC), record: recOf(awayC), score: Number(awayC.score || 0), color: awayC.team?.color ? `#${awayC.team.color}` : null, logo: awayC.team?.logos?.[0]?.href || awayC.team?.logo || null },
    odds: odds ? { provider: odds.provider?.name, details: odds.details, overUnder: odds.overUnder } : null,
    series,
    injuries,
    teamStats,
  }
}

// Call Anthropic server-side (reuses the configured API key)
async function callAnthropic(body) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Anthropic request failed')
  return data
}

function extractJson(text) {
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try { return JSON.parse(text.slice(start, end + 1)) } catch { return null }
}

app.get('/api/nba/predict/:id', async (req, res) => {
  try {
    const ctx = await fetchPredictionContext(req.params.id)

    const injuryLines = ctx.injuries.length
      ? ctx.injuries.map(g => `${g.team}: ${g.out.join(', ')}`).join(' | ')
      : 'aucune blessure majeure signalée'
    const statsLines = ctx.teamStats.length
      ? ctx.teamStats.map(s => `${s.abbr} → FG ${s.fgPct || '?'}%, 3PT ${s.tpPct || '?'}%, REB ${s.reb || '?'}, AST ${s.ast || '?'}, TO ${s.to || '?'}`).join(' | ')
      : 'stats de match non disponibles (match à venir)'

    const dataBlock = [
      `Match: ${ctx.away.name} (${ctx.away.record}) @ ${ctx.home.name} (${ctx.home.record})`,
      `Statut: ${ctx.status}${ctx.status !== 'upcoming' ? ` — score actuel ${ctx.home.abbr} ${ctx.home.score} - ${ctx.away.score} ${ctx.away.abbr}` : ''}`,
      `Cotes: ${ctx.odds ? `${ctx.odds.details || '?'} (O/U ${ctx.odds.overUnder ?? '?'}, ${ctx.odds.provider || 'bookmaker'})` : 'non disponibles'}`,
      `Confrontations saison: ${ctx.series || 'N/A'}`,
      `Blessures: ${injuryLines}`,
      `Stats: ${statsLines}`,
    ].join('\n')

    const system = `Tu es HoopIQ Oracle, le moteur de prédiction NBA le plus pointu. Tu analyses des données RÉELLES (records, cotes Vegas, confrontations, blessures, stats) pour produire un pronostic crédible et nuancé. Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format exact:
{
  "winner": "<abréviation équipe gagnante prédite>",
  "homeWinPct": <entier 0-100, probabilité de victoire de l'équipe à domicile ${ctx.home.abbr}>,
  "projectedScore": { "home": <entier>, "away": <entier> },
  "confidence": "<Élevée|Moyenne|Faible>",
  "keyFactors": ["<facteur clé 1>", "<facteur clé 2>", "<facteur clé 3>"],
  "xFactor": { "player": "<nom joueur>", "reason": "<pourquoi il peut tout changer>" },
  "verdict": "<conclusion percutante en 1-2 phrases, en français>"
}
Les facteurs et le verdict sont en français, concis et basés sur les données fournies.`

    const data = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system,
      messages: [{ role: 'user', content: `Voici les données réelles du match. Donne ton pronostic JSON.\n\n${dataBlock}` }],
    })
    const text = (data.content || []).map(b => b.text || '').join('')
    const prediction = extractJson(text)
    if (!prediction) return res.status(502).json({ error: 'Prediction parse failed', raw: text })

    res.json({ game: ctx, prediction })
  } catch (err) {
    console.error('Oracle predict error:', err)
    res.status(500).json({ error: 'Unable to generate prediction' })
  }
})

// Search YouTube for a live stream of a given query (official YouTube Data API).
// Returns the first live video. Requires YOUTUBE_API_KEY; degrades gracefully if absent.
app.get('/api/youtube/live', async (req, res) => {
  const q = (req.query.q || '').toString().trim()
  if (!q) return res.status(400).json({ error: 'missing_query' })
  if (!YOUTUBE_API_KEY) {
    return res.status(501).json({ error: 'no_api_key', message: 'YOUTUBE_API_KEY non configurée — utilise le champ manuel ou la recherche YouTube.' })
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`
    const r = await fetch(url)
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'youtube_api_error' })
    const item = (data.items || [])[0]
    if (!item) return res.status(404).json({ error: 'no_results' })
    res.json({ videoId: item.id?.videoId, title: item.snippet?.title, channel: item.snippet?.channelTitle })
  } catch (err) {
    console.error('YouTube search error:', err)
    res.status(500).json({ error: 'youtube_search_failed' })
  }
})

app.get('/api/nba/players', async (req, res) => {
  try {
    const players = await fetchBullsPlayers()
    res.json({ players })
  } catch (err) {
    console.error('NBA players fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch NBA players' })
  }
})

app.get('/api/nba/live-scores', async (req, res) => {
  try {
    const games = await fetchEspnLiveScores()
    res.json({ games })
  } catch (err) {
    console.error('ESPN live scores fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch live scores' })
  }
})

app.get('/api/nba/livecenter', async (req, res) => {
  try {
    const games = await fetchLiveCenterGames()
    res.json({ games })
  } catch (err) {
    console.error('Live center fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch live center games' })
  }
})

app.get('/api/nba/game/:id', async (req, res) => {
  try {
    const detail = await fetchGameDetail(req.params.id)
    res.json(detail)
  } catch (err) {
    console.error('Game detail fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch game detail' })
  }
})

app.get('/api/plans', (req, res) => {
  const plans = [
    { id: 'scout', name: 'Scout', amount: 9, currency: 'eur', priceId: STRIPE_PRICE_IDS.scout },
    { id: 'pro', name: 'Pro', amount: 29, currency: 'eur', priceId: STRIPE_PRICE_IDS.pro },
    { id: 'elite', name: 'Elite', amount: 89, currency: 'eur', priceId: STRIPE_PRICE_IDS.elite },
  ]
  res.json({ plans })
})

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in server environment' })

  const { priceId, successUrl, cancelUrl, customerEmail } = req.body || {}
  if (!priceId || !successUrl) return res.status(400).json({ error: 'Missing priceId or successUrl' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl || successUrl,
      customer_email: customerEmail,
    })
    res.json({ url: session.url, id: session.id })
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/checkout/:plan', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in server environment' })

  const plan = (req.params.plan || '').toLowerCase()
  const allowed = ['scout', 'pro', 'elite']
  if (!allowed.includes(plan)) return res.status(404).json({ error: 'Unknown plan' })

  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) return res.status(500).json({ error: `Price ID for plan ${plan} not configured` })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
      customer_email: req.body?.customerEmail,
    })
    res.json({ url: session.url, id: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ error: err.message || 'Stripe error' })
  }
})

app.post('/api/anthropic', async (req, res) => {
  try {
    if (!req.body || (!req.body.model && !req.body.messages && !req.body.system)) {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    console.log('Proxying to Anthropic - model:', req.body.model || 'unspecified')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    if (!response.ok) {
      const errMsg = data?.error?.message || data
      return res.status(response.status).json({ error: errMsg })
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Anthropic proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed' })
  }
})

export default app
export { ensureStripePrices }
