import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'

dotenv.config()

const app = express()
// trim() systématique : un espace ou retour à la ligne parasite dans une clé
// casse le header HTTP Authorization (erreur "connection to Stripe")
const cleanKey = (v, prefix) => {
  const s = (v || '').trim()
  if (!s) return undefined
  if (prefix) {
    const m = s.match(new RegExp(`${prefix}[A-Za-z0-9_]+`))
    return m ? m[0] : s
  }
  return s
}
const GROQ_API_KEY = cleanKey(process.env.GROQ_API_KEY)
const ANTHROPIC_API_KEY = cleanKey(process.env.ANTHROPIC_API_KEY)
const STRIPE_SECRET_KEY = cleanKey(process.env.STRIPE_SECRET_KEY, 'sk_')
const YOUTUBE_API_KEY = cleanKey(process.env.YOUTUBE_API_KEY)

let stripe = null
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY)
}

// Accès Supabase côté serveur en REST direct (PostgREST) — pas de client supabase-js ici :
// il exige WebSocket natif (Node 22+) et pèse inutilement en serverless.
// service_role de préférence (écrit dans subscriptions malgré RLS), sinon clé anon (lecture seule).
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY
const supabaseReady = !!(SUPABASE_URL && SUPABASE_SERVER_KEY)
if (!supabaseReady) {
  console.warn('Supabase non configuré côté serveur — webhook Stripe sans persistance')
} else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY absente — la table subscriptions sera en lecture seule (clé anon)')
}

const sbHeaders = {
  apikey: SUPABASE_SERVER_KEY,
  Authorization: `Bearer ${SUPABASE_SERVER_KEY}`,
  'Content-Type': 'application/json',
}

async function upsertSubscription({ email, plan, customerId, subscriptionId, sessionId, status }) {
  if (!supabaseReady) return { error: 'supabase_not_configured' }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=email`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      email: (email || '').toLowerCase(),
      plan,
      status: status || 'active',
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId || null,
      stripe_session_id: sessionId || null,
      updated_at: new Date().toISOString(),
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('Supabase upsert subscription error:', res.status, detail.slice(0, 300))
    return { error: `supabase_${res.status}` }
  }
  return { ok: true }
}

async function fetchSubscription(email) {
  if (!supabaseReady) return null
  const url = `${SUPABASE_URL}/rest/v1/subscriptions?email=eq.${encodeURIComponent(email)}&select=plan,status&limit=1`
  const res = await fetch(url, { headers: sbHeaders })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('Supabase fetch subscription error:', res.status, detail.slice(0, 200))
    return null
  }
  const rows = await res.json()
  return rows[0] || null
}

// Extrait un price ID propre même si la variable d'env contient des parasites de copier-coller
const cleanPriceId = (v) => {
  const m = (v || '').match(/price_[A-Za-z0-9]+/)
  return m ? m[0] : null
}
const STRIPE_PRICE_IDS = {
  scout: cleanPriceId(process.env.STRIPE_PRICE_SCOUT),
  pro: cleanPriceId(process.env.STRIPE_PRICE_PRO),
  elite: cleanPriceId(process.env.STRIPE_PRICE_ELITE),
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

if (!GROQ_API_KEY && !ANTHROPIC_API_KEY) {
  console.error('Aucune clé IA configurée — ajoute GROQ_API_KEY ou ANTHROPIC_API_KEY dans .env')
  process.exit(1)
}
if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY manquante — fallback Anthropic uniquement')
}
if (!ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY manquante — Groq uniquement')
}

// Groq — modèle rapide (fallback ou principal si pas de clé Anthropic)
async function callGroq(anthropicBody, modelOverride) {
  const { max_tokens, system, messages } = anthropicBody
  const groqMessages = []
  if (system) groqMessages.push({ role: 'system', content: system })
  for (const m of (messages || [])) {
    groqMessages.push({ role: m.role, content: m.content || m.text || '' })
  }
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: modelOverride || 'llama-3.3-70b-versatile', max_tokens: max_tokens || 1024, messages: groqMessages }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Groq request failed')
  const text = data.choices?.[0]?.message?.content || ''
  return { content: [{ type: 'text', text }] }
}

// Anthropic Claude — principal si ANTHROPIC_API_KEY présente
async function callAnthropic(anthropicBody) {
  const { model, max_tokens, system, messages } = anthropicBody
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: model || 'claude-haiku-4-5-20251001', max_tokens: max_tokens || 1024, system, messages }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Anthropic request failed')
  return data
}

// Routeur intelligent : Claude si clé dispo, Groq en fallback automatique
async function callAI(anthropicBody) {
  if (ANTHROPIC_API_KEY) {
    try {
      const result = await callAnthropic(anthropicBody)
      return result
    } catch (err) {
      console.warn('Anthropic failed, falling back to Groq:', err.message)
    }
  }
  // Groq en principal (pas de clé Anthropic) ou en secours (Anthropic KO)
  return callGroq(anthropicBody)
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function fetchBullsPlayers(teamId = 4) {
  const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`
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
  // Essaie NBA puis WNBA — un id WNBA passé ici renverrait sinon une 404 côté ESPN.
  const leagueUrl = (lg) => `https://site.api.espn.com/apis/site/v2/sports/basketball/${lg}/summary?event=${encodeURIComponent(eventId)}`
  let response = await fetch(leagueUrl('nba'))
  if (!response.ok) response = await fetch(leagueUrl('wnba'))
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

function extractJson(text) {
  if (!text) return null
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try { return JSON.parse(stripped.slice(start, end + 1)) } catch { return null }
}

app.get('/api/nba/predict/:id', async (req, res) => {
  try {
    let ctx
    try {
      ctx = await fetchPredictionContext(req.params.id)
    } catch (espnErr) {
      console.error('ESPN fetch failed:', espnErr.message)
      return res.status(502).json({ error: 'ESPN fetch failed', detail: espnErr.message })
    }

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

    const system = `T'es HoopIQ Oracle, le meilleur analyste NBA du game. Tu lis les données comme LeBron lit une défense — rien t'échappe. Tu analyses les records, cotes Vegas, confrontations directes, blessures et stats pour sortir un pronostic béton.

Tu réponds UNIQUEMENT avec un objet JSON valide, zéro texte autour, format exact :
{
  "winner": "<abréviation équipe gagnante prédite>",
  "homeWinPct": <entier 0-100, probabilité de victoire de l'équipe à domicile ${ctx.home.abbr}>,
  "projectedScore": { "home": <entier>, "away": <entier> },
  "confidence": "<Élevée|Moyenne|Faible>",
  "keyFactors": ["<facteur clé 1>", "<facteur clé 2>", "<facteur clé 3>"],
  "xFactor": { "player": "<nom joueur>", "reason": "<pourquoi il peut tout changer>" },
  "verdict": "<2 phrases max, style direct et percutant, comme si tu analysais le match avec des potes — basé sur les vraies données>"
}
Les facteurs et le verdict sont en français, naturels, pas corporate. Pas de blabla, que de l'analyse.`

    let data
    try {
      data = await callAI({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: `Voici les données réelles du match. Donne ton pronostic JSON.\n\n${dataBlock}` }],
      })
    } catch (aiErr) {
      console.error('AI call failed:', aiErr.message)
      return res.status(502).json({ error: 'AI call failed', detail: aiErr.message })
    }

    const text = (data.content || []).map(b => b.text || '').join('')
    const prediction = extractJson(text)
    if (!prediction) {
      console.error('Oracle JSON parse failed. Raw:', text.slice(0, 500))
      return res.status(502).json({ error: 'Prediction parse failed', raw: text.slice(0, 300) })
    }

    res.json({ game: ctx, prediction })
  } catch (err) {
    console.error('Oracle predict error:', err)
    res.status(500).json({ error: err.message || 'Unable to generate prediction' })
  }
})

// Search YouTube for a live stream of a given query (official YouTube Data API).
// Returns the first live video. Requires YOUTUBE_API_KEY; degrades gracefully if absent.
app.get('/api/youtube/live', async (req, res) => {
  const q = (req.query.q || '').toString().trim()
  const liveOnly = req.query.live !== 'false' // default: live broadcasts only
  if (!q) return res.status(400).json({ error: 'missing_query' })
  if (!YOUTUBE_API_KEY) {
    return res.status(501).json({ error: 'no_api_key', message: 'YOUTUBE_API_KEY non configurée — utilise le champ manuel ou la recherche YouTube.' })
  }
  try {
    const eventParam = liveOnly ? '&eventType=live' : ''
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video${eventParam}&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`
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
    const teamId = req.query.teamId || 4
    const players = await fetchBullsPlayers(teamId)
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

  const { priceId, successUrl, cancelUrl, customerEmail, plan } = req.body || {}
  if (!priceId || !successUrl) return res.status(400).json({ error: 'Missing priceId or successUrl' })

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl || successUrl,
      customer_email: customerEmail,
      metadata: { plan: plan || '' },
    })
    res.json({ url: session.url, id: session.id })
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Vérifie une session Checkout au retour de Stripe (succès) — renvoie le plan payé
// et enregistre l'abonnement dans Supabase (filet de sécurité si le webhook n'est pas configuré)
app.get('/api/checkout/verify', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in server environment' })
  const sessionId = (req.query.session_id || '').toString()
  if (!sessionId) return res.status(400).json({ error: 'missing_session_id' })
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.status === 'complete'
    const plan = session.metadata?.plan || null
    const email = session.customer_details?.email || session.customer_email || null
    if (paid && plan && email) {
      await upsertSubscription({
        email,
        plan,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        sessionId: session.id,
        status: 'active',
      })
    }
    res.json({ paid, plan, email })
  } catch (err) {
    console.error('Stripe checkout verify error:', err)
    res.status(500).json({ error: err.message || 'verify_failed' })
  }
})

// Webhook Stripe — checkout.session.completed → enregistre l'abonnement dans Supabase.
// Sécurité : signature vérifiée si STRIPE_WEBHOOK_SECRET est définie ; dans tous les cas
// on ne fait jamais confiance au payload — la session est re-lue depuis l'API Stripe.
app.post('/api/stripe-webhook', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'stripe_not_configured' })

  let event = req.body
  const sig = req.headers['stripe-signature']
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (Buffer.isBuffer(req.body)) {
    if (whSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, whSecret)
      } catch (err) {
        return res.status(400).json({ error: `signature_invalid: ${err.message}` })
      }
    } else {
      try { event = JSON.parse(req.body.toString('utf8')) }
      catch { return res.status(400).json({ error: 'invalid_json' }) }
    }
  }

  if (event?.type !== 'checkout.session.completed') {
    return res.json({ received: true, ignored: event?.type || 'unknown_event' })
  }
  const sessionId = event?.data?.object?.id
  if (!sessionId) return res.status(400).json({ error: 'missing_session_id' })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== 'complete') return res.json({ received: true, ignored: 'session_not_complete' })
    const email = session.customer_details?.email || session.customer_email
    const plan = session.metadata?.plan
    if (!email || !plan) return res.json({ received: true, ignored: 'missing_email_or_plan' })
    const result = await upsertSubscription({
      email,
      plan,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      sessionId: session.id,
      status: 'active',
    })
    console.log(`Webhook: abonnement ${plan} enregistré pour ${email}`, result)
    res.json({ received: true, ...result })
  } catch (err) {
    console.error('Stripe webhook error:', err)
    res.status(500).json({ error: err.message || 'webhook_failed' })
  }
})

// Plan actif d'un utilisateur, lu depuis la table subscriptions
app.get('/api/subscription', async (req, res) => {
  const email = (req.query.email || '').toString().trim().toLowerCase()
  if (!email) return res.status(400).json({ error: 'missing_email' })
  try {
    const sub = await fetchSubscription(email)
    res.json({ plan: sub?.plan || null, status: sub?.status || null })
  } catch (err) {
    res.status(500).json({ error: err.message || 'subscription_lookup_failed' })
  }
})

app.post('/api/checkout/:plan', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in server environment' })

  const plan = (req.params.plan || '').toLowerCase()
  const allowed = ['scout', 'pro', 'elite']
  if (!allowed.includes(plan)) return res.status(404).json({ error: 'Unknown plan' })

  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) return res.status(500).json({ error: `Price ID for plan ${plan} not configured` })

  const origin = req.headers.origin || 'https://hoopiq-ai.com'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      customer_email: req.body?.customerEmail,
      metadata: { plan },
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

    console.log('Calling AI (Claude → Groq fallback)')

    const data = await callAI(req.body)
    return res.json(data)
  } catch (error) {
    console.error('AI proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed', message: error.message })
  }
})

export default app
export { ensureStripePrices }
