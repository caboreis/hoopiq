import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import pg from 'pg'
import crypto from 'crypto'

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

// Accès base de données côté serveur — Neon Postgres (via Vercel Postgres integration).
// Remplace l'ancien accès Supabase REST (projet Supabase mort, DNS ne résout plus).
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
const dbReady = !!DATABASE_URL
if (!dbReady) {
  console.warn('DATABASE_URL non configurée côté serveur — persistance indisponible')
}
const pool = dbReady ? new pg.Pool({ connectionString: DATABASE_URL }) : null

async function upsertSubscription({ email, plan, customerId, subscriptionId, sessionId, status }) {
  if (!dbReady) return { error: 'db_not_configured' }
  try {
    await pool.query(
      `insert into subscriptions (email, plan, status, stripe_customer_id, stripe_subscription_id, stripe_session_id, updated_at)
       values ($1, $2, $3, $4, $5, $6, now())
       on conflict (email) do update set
         plan = excluded.plan,
         status = excluded.status,
         stripe_customer_id = excluded.stripe_customer_id,
         stripe_subscription_id = excluded.stripe_subscription_id,
         stripe_session_id = excluded.stripe_session_id,
         updated_at = now()`,
      [(email || '').toLowerCase(), plan, status || 'active', customerId || null, subscriptionId || null, sessionId || null]
    )
    // Garde la table users synchro (planPaid/plan affichés dans l'app) si le compte existe déjà.
    if (status === 'active' && plan) {
      await pool.query('update users set plan = $1, plan_paid = true where email = $2', [plan, (email || '').toLowerCase()]).catch(() => {})
    }
    return { ok: true }
  } catch (err) {
    console.error('DB upsert subscription error:', err.message)
    return { error: 'db_error' }
  }
}

async function fetchSubscription(email) {
  if (!dbReady) return null
  try {
    const res = await pool.query('select plan, status from subscriptions where email = $1 limit 1', [(email || '').toLowerCase()])
    return res.rows[0] || null
  } catch (err) {
    console.error('DB fetch subscription error:', err.message)
    return null
  }
}

/* --- Scores des défis quotidiens (source du classement) ---
   Une ligne par utilisateur et par jour : on peut ainsi calculer un classement
   sur 7 jours / 30 jours / all-time sans stocker de total dénormalisé, et
   rejouer le même jour écrase le score au lieu de l'empiler. */
async function ensureScoresTable() {
  if (!dbReady) return false
  try {
    await pool.query(`
      create table if not exists challenge_scores (
        email text not null,
        day date not null,
        points int not null default 0,
        correct int not null default 0,
        updated_at timestamptz not null default now(),
        primary key (email, day)
      )`)
    return true
  } catch (err) {
    console.error('DB ensure challenge_scores error:', err.message)
    return false
  }
}

async function saveChallengeScore({ email, points, correct }) {
  if (!(await ensureScoresTable())) return { error: 'db_not_configured' }
  try {
    await pool.query(
      `insert into challenge_scores (email, day, points, correct, updated_at)
       values ($1, current_date, $2, $3, now())
       on conflict (email, day) do update set
         points = excluded.points,
         correct = excluded.correct,
         updated_at = now()`,
      [(email || '').toLowerCase(), Math.max(0, points | 0), Math.max(0, correct | 0)]
    )
    return { ok: true }
  } catch (err) {
    console.error('DB save score error:', err.message)
    return { error: 'db_error' }
  }
}

async function fetchLeaderboard({ period = 'week', email = '' } = {}) {
  if (!(await ensureScoresTable())) return { available: false, rows: [], me: null }
  const days = period === 'all' ? null : period === 'month' ? 30 : 7
  const where = days ? `where s.day >= current_date - $1::int` : ''
  const params = days ? [days] : []
  try {
    const res = await pool.query(
      `select s.email,
              coalesce(u.name, split_part(s.email, '@', 1)) as name,
              sum(s.points)::int as points,
              sum(s.correct)::int as correct,
              count(*)::int as days_played
       from challenge_scores s
       left join users u on u.email = s.email
       ${where}
       group by s.email, u.name
       having sum(s.points) > 0
       order by points desc, correct desc
       limit 50`,
      params
    )
    const rows = res.rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      points: r.points,
      correct: r.correct,
      daysPlayed: r.days_played,
      isMe: !!email && r.email === email.toLowerCase(),
    }))
    // Le total de joueurs classés sert au bandeau de stats — pas d'estimation.
    const me = rows.find(r => r.isMe) || null
    return { available: true, period, rows: rows.map(({ ...r }) => r), me, totalPlayers: rows.length }
  } catch (err) {
    console.error('DB leaderboard error:', err.message)
    return { available: false, rows: [], me: null }
  }
}

// --- Utilisateurs (auth maison, remplace Supabase Auth) ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}
function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':')
  if (!salt || !hash) return false
  const check = crypto.scryptSync(password, salt, 64).toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'))
  } catch {
    return false
  }
}
async function createUser({ email, password, name, plan }) {
  const passwordHash = hashPassword(password)
  const res = await pool.query(
    `insert into users (email, password_hash, name, plan) values ($1, $2, $3, $4)
     returning email, name, plan, plan_paid, created_at`,
    [(email || '').toLowerCase(), passwordHash, name, plan || 'scout']
  )
  return res.rows[0]
}
async function findUserByEmail(email) {
  const res = await pool.query('select * from users where email = $1 limit 1', [(email || '').toLowerCase()])
  return res.rows[0] || null
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
    body: JSON.stringify({ model: modelOverride || 'openai/gpt-oss-120b', max_tokens: max_tokens || 1024, messages: groqMessages }),
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
    body: JSON.stringify({ model: model || 'claude-3-5-haiku-latest', max_tokens: max_tokens || 1024, system, messages }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'Anthropic request failed')
  return data
}

// Routeur intelligent : Claude si clé dispo, Groq en fallback automatique
async function callAI(anthropicBody) {
  // Forçage Groq explicite (assistants par plan — gratuit)
  if (anthropicBody?.provider === 'groq') {
    return callGroq(anthropicBody)
  }
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

// Le webhook Stripe DOIT être monté avant express.json() avec un parseur "raw" :
// stripe.webhooks.constructEvent() a besoin du corps brut (Buffer) pour vérifier
// la signature. Monté après express.json(), req.body est déjà un objet parsé —
// Buffer.isBuffer(req.body) est alors toujours faux et la vérification de
// signature ne s'exécute jamais (n'importe qui peut alors forger un événement).
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler)

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

function rarityForRank(rank, isChamp) {
  if (isChamp) return 'gold'
  if (rank <= 3) return 'legendary'
  if (rank <= 6) return 'epic'
  if (rank <= 10) return 'rare'
  return 'common'
}

// Score HoopIQ (0-100) : métrique maison dérivée de données réelles (rang, bilan, défenses de
// ceinture) — ce n'est pas une stat officielle, juste un classement gamifié comme ailleurs dans l'app.
function scoreForFighter({ rank, belt, wins, losses, defenses }) {
  const total = wins + losses
  const winPct = total ? wins / total : 0.5
  let score = 60 + winPct * 25
  score += Math.max(0, 12 - (rank || 12))
  if (belt) score += 6
  score += Math.min(4, defenses || 0)
  return Math.max(50, Math.min(99, Math.round(score)))
}

let mmaRankingsCache = { data: null, ts: 0 }
const MMA_RANKINGS_TTL = 6 * 60 * 60 * 1000 // 6h — les classements UFC changent rarement d'une heure à l'autre

async function fetchMmaRankings() {
  if (mmaRankingsCache.data && Date.now() - mmaRankingsCache.ts < MMA_RANKINGS_TTL) {
    return mmaRankingsCache.data
  }
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings')
  if (!res.ok) throw new Error('ESPN MMA rankings fetch failed')
  const data = await res.json()
  const byKey = new Map()
  for (const group of data.rankings || []) {
    const name = group.name || ''
    if (name.includes('Pound for Pound')) continue // classement transversal, pas une division
    const isChampGroup = name.includes('Champions')
    const weightClass = name.replace(/ Division (Champions|Rankings).*/, '').trim()
    for (const r of group.ranks || []) {
      const a = r.athlete || {}
      if (!a.id) continue
      const key = `${a.id}:${weightClass}`
      const existing = byKey.get(key)
      // Un champion apparaît dans le groupe "Champions" ET dans "Rankings" de sa division —
      // on garde l'entrée Champion qui prime.
      if (existing && !isChampGroup) continue
      const recSummary = r.recordSummary || ''
      const m = recSummary.match(/^(\d+)-(\d+)-(\d+)/)
      const wins = m ? +m[1] : 0
      const losses = m ? +m[2] : 0
      const draws = m ? +m[3] : 0
      const belt = isChampGroup || (r.current === 1 && !!r.hasAccolade)
      byKey.set(key, {
        id: a.id,
        espnId: a.id,
        name: a.displayName,
        nickname: a.nickname || '',
        weightClass,
        org: 'UFC',
        belt,
        record: recSummary,
        wins, losses, draws,
        rank: r.current,
        trend: r.trend || '-',
        defenses: r.defenses || 0,
        country: a.citizenshipCountry || '',
        flag: a.flag || null,
        headshot: a.headshot || `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${a.id}.png&w=350&h=254`,
      })
    }
  }
  const fighters = [...byKey.values()].map(f => ({
    ...f,
    rarity: rarityForRank(f.rank, f.belt),
    score: scoreForFighter(f),
  }))
  mmaRankingsCache = { data: fighters, ts: Date.now() }
  return fighters
}

/* ══════════ EUROLEAGUE — données officielles ══════════
   Deux sources publiques Euroleague :
   - api-live.euroleague.net : classements (XML) + stats joueurs (JSON v3)
   - feeds.incrowdsports.com : calendrier et résultats des matchs (JSON v2)
   Aucune clé nécessaire. Tout est mis en cache : ces données bougent au
   rythme des matchs, pas des requêtes. */
const EL_TTL = 30 * 60 * 1000
const elCache = new Map()

async function elCached(key, loader) {
  const hit = elCache.get(key)
  if (hit && Date.now() - hit.ts < EL_TTL) return hit.data
  const data = await loader()
  elCache.set(key, { data, ts: Date.now() })
  return data
}

// Extrait la valeur d'une balise XML simple (les classements Euroleague sont en XML plat).
const xmlTag = (chunk, tag) => {
  const m = chunk.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return m ? m[1].trim() : ''
}

// Le pays n'est pas renvoyé par l'API : on le déduit du code équipe.
// Attention : PAR = Partizan (Belgrade), Paris Basketball c'est PRS.
const EL_TEAM_FLAG = {
  MAD: '🇪🇸', BAR: '🇪🇸', BAS: '🇪🇸', PAM: '🇪🇸', // PAM = Valencia
  PAN: '🇬🇷', OLY: '🇬🇷', PER: '🇬🇷',
  ULK: '🇹🇷', IST: '🇹🇷',
  MUN: '🇩🇪', BER: '🇩🇪',
  MIL: '🇮🇹', VIR: '🇮🇹',
  ASV: '🇫🇷', PRS: '🇫🇷', MCO: '🇲🇨',
  RED: '🇷🇸', PAR: '🇷🇸',
  TEL: '🇮🇱', HTA: '🇮🇱',
  ZAL: '🇱🇹', DUB: '🇦🇪',
}

// La saison "en cours" dépend de la date : E2026 = saison 2026-27. Si elle n'a pas
// encore livré de résultat, on retombe sur la précédente plutôt que d'afficher du vide.
function elSeasonCandidates() {
  const now = new Date()
  // La saison bascule à l'automne : avant juillet on est encore sur la saison de l'année -1.
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return [`E${startYear}`, `E${startYear - 1}`]
}

async function elFetchStandings(seasonCode) {
  // gameNumber=0 renvoie le classement le plus à jour disponible pour la saison.
  const r = await fetch(`https://api-live.euroleague.net/v1/standings?seasonCode=${seasonCode}&gameNumber=0`)
  if (!r.ok) return []
  const xml = await r.text()
  const teams = xml.match(/<team>[\s\S]*?<\/team>/g) || []
  return teams.map(t => {
    const code = xmlTag(t, 'code')
    return {
      pos: +xmlTag(t, 'ranking') || 0,
      team: xmlTag(t, 'name'),
      code,
      country: EL_TEAM_FLAG[code] || '🏀',
      played: +xmlTag(t, 'totalgames') || 0,
      wins: +xmlTag(t, 'wins') || 0,
      losses: +xmlTag(t, 'losses') || 0,
      ptsFor: +xmlTag(t, 'ptsfavour') || 0,
      ptsAgainst: +xmlTag(t, 'ptsagainst') || 0,
      diff: +xmlTag(t, 'difference') || 0,
    }
  }).filter(t => t.team).sort((a, b) => a.pos - b.pos)
}

async function elFetchGames(seasonCode) {
  const r = await fetch(`https://feeds.incrowdsports.com/provider/euroleague-feeds/v2/competitions/E/seasons/${seasonCode}/games?limit=400`)
  if (!r.ok) return []
  const json = await r.json()
  return (json.data || []).map(g => {
    // Un match non joué est renvoyé avec un score 0-0, pas null : seul le statut
    // 'result' garantit qu'il s'agit d'un vrai score.
    const done = g.status === 'result'
    return {
      id: g.identifier,
      date: g.date,
      round: g.round?.alias || g.round?.name || '',
      phase: g.phaseType?.alias || '',
      done,
      home: g.home?.name || '',
      homeCode: g.home?.code || '',
      homeCrest: g.home?.imageUrls?.crest || null,
      homeScore: done ? g.home?.score ?? null : null,
      away: g.away?.name || '',
      awayCode: g.away?.code || '',
      awayCrest: g.away?.imageUrls?.crest || null,
      awayScore: done ? g.away?.score ?? null : null,
    }
  }).filter(g => g.home && g.away)
}

// L'API renvoie "NOM, Prénom" en majuscules — on remet ça en "Prénom Nom".
function elPrettyName(raw) {
  const [last = '', first = ''] = (raw || '').split(',').map(s => s.trim())
  const nice = (s) => s.split(/([\s-])/).map(w => /^[\s-]$/.test(w) || !w ? w : w[0] + w.slice(1).toLowerCase()).join('')
  return [nice(first), nice(last)].filter(Boolean).join(' ') || raw
}

// Le paramètre sortBy de l'API Euroleague est ignoré (elle renvoie toujours l'ordre
// PIR) : on récupère la liste complète une fois et on trie nous-mêmes.
async function elFetchLeaders(seasonCode) {
  const url = `https://api-live.euroleague.net/v3/competitions/E/statistics/players/traditional`
    + `?SeasonMode=Single&SeasonCode=${seasonCode}&limit=500&statisticSortMode=perGame`
  const r = await fetch(url)
  if (!r.ok) return { pts: [], ast: [], reb: [], pir: [] }
  const json = await r.json()
  const players = (json.players || []).map(p => ({
    name: elPrettyName(p.player?.name),
    team: (p.player?.team?.name || '').split(';')[0],
    photo: p.player?.imageUrl || null,
    games: p.gamesPlayed || 0,
    pts: p.pointsScored || 0,
    ast: p.assists || 0,
    reb: p.totalRebounds || 0,
    pir: p.pir || 0,
  }))
  const top = (field) => [...players]
    .sort((a, b) => b[field] - a[field])
    .slice(0, 5)
    .map(p => ({ name: p.name, team: p.team, photo: p.photo, games: p.games, val: p[field] }))
  return { pts: top('pts'), ast: top('ast'), reb: top('reb'), pir: top('pir') }
}

// Charge une saison complète ; renvoie null si elle n'a encore produit aucun match joué.
async function elLoadSeason(seasonCode) {
  const [standings, games] = await Promise.all([
    elFetchStandings(seasonCode),
    elFetchGames(seasonCode),
  ])
  const played = games.filter(g => g.done)
  if (!played.length) return null
  return { seasonCode, standings, games, played }
}

async function fetchEuroleague() {
  return elCached('euroleague', async () => {
    let season = null
    for (const code of elSeasonCandidates()) {
      season = await elLoadSeason(code)
      if (season) break
    }
    if (!season) return { available: false }

    const leaders = await elFetchLeaders(season.seasonCode)

    const byDateDesc = [...season.played].sort((a, b) => new Date(b.date) - new Date(a.date))
    const upcoming = season.games
      .filter(g => !g.done && new Date(g.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 8)

    const y = +season.seasonCode.slice(1)
    return {
      available: true,
      season: `${y}-${String(y + 1).slice(2)}`,
      seasonCode: season.seasonCode,
      // Saison terminée si plus aucun match programmé à venir.
      finished: upcoming.length === 0,
      standings: season.standings,
      recent: byDateDesc.slice(0, 8),
      upcoming,
      leaders,
      updatedAt: new Date().toISOString(),
    }
  })
}

/* ══════════ WNBA — vrais leaders de la saison en cours ══════════
   Remplace une liste de joueuses écrite en dur (stats figées d'une saison
   passée, plus un "score" inventé) par les vrais leaders ESPN. */
let wnbaLeadersCache = { data: null, ts: 0 }
const WNBA_LEADERS_TTL = 3 * 60 * 60 * 1000

async function fetchWnbaLeaders() {
  if (wnbaLeadersCache.data && Date.now() - wnbaLeadersCache.ts < WNBA_LEADERS_TTL) {
    return wnbaLeadersCache.data
  }
  const season = new Date().getFullYear()
  const base = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/wnba/seasons/${season}`
  const r = await fetch(`${base}/types/2/leaders`)
  if (!r.ok) throw new Error('ESPN WNBA leaders fetch failed')
  const data = await r.json()

  const idFromRef = (ref) => (ref || '').split('/').pop().split('?')[0]
  const byCategory = (name) => (data.categories || []).find(c => c.name === name)?.leaders || []

  // On agrège les trois catégories par joueuse : une même athlète peut figurer
  // dans les meilleures marqueuses sans être dans les meilleures rebondeuses.
  const stats = new Map()
  const collect = (categoryName, key) => {
    for (const l of byCategory(categoryName)) {
      const id = idFromRef(l.athlete?.$ref)
      if (!id) continue
      if (!stats.has(id)) stats.set(id, { id })
      stats.get(id)[key] = Number(l.displayValue)
    }
  }
  collect('pointsPerGame', 'pts')
  collect('reboundsPerGame', 'reb')
  collect('assistsPerGame', 'ast')

  // Le classement affiché est celui des marqueuses : c'est la catégorie de référence.
  const topIds = byCategory('pointsPerGame').slice(0, 6).map(l => idFromRef(l.athlete?.$ref)).filter(Boolean)

  const players = await Promise.all(topIds.map(async (id) => {
    try {
      const a = await (await fetch(`${base}/athletes/${id}`)).json()
      let team = ''
      if (a.team?.$ref) {
        const t = await (await fetch(a.team.$ref)).json()
        team = t.displayName || ''
      }
      const s = stats.get(id) || {}
      return {
        id,
        name: a.displayName || '',
        pos: a.position?.abbreviation || '',
        team,
        headshot: a.headshot?.href || null,
        pts: s.pts ?? null,
        reb: s.reb ?? null,
        ast: s.ast ?? null,
        league: 'wnba',
      }
    } catch {
      return null
    }
  }))

  const clean = players.filter(p => p && p.name)
  wnbaLeadersCache = { data: clean, ts: Date.now() }
  return clean
}

/* ══════════ DÉFIS DU JOUR — vrais matchs du jour ══════════
   Les défis étaient auparavant des questions écrites en dur ("Lakers vs
   Warriors, qui gagne ce soir ?") avec une bonne réponse décidée à l'avance,
   sur des matchs qui n'existaient pas. On sert maintenant les vrais matchs
   programmés aujourd'hui ; le résultat n'est connu qu'une fois le match fini. */
let challengeGamesCache = { data: null, ts: 0 }
const CHALLENGE_GAMES_TTL = 2 * 60 * 1000 // court : un match peut se terminer à tout moment

async function fetchChallengeGames() {
  if (challengeGamesCache.data && Date.now() - challengeGamesCache.ts < CHALLENGE_GAMES_TTL) {
    return challengeGamesCache.data
  }
  const leagues = [
    { key: 'nba', label: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
    { key: 'wnba', label: 'WNBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard' },
  ]

  const perLeague = await Promise.all(leagues.map(async (lg) => {
    try {
      const r = await fetch(lg.url)
      if (!r.ok) return []
      const data = await r.json()
      return (data.events || []).map(ev => {
        const comp = ev.competitions?.[0] || {}
        const side = (ha) => {
          const c = (comp.competitors || []).find(x => x.homeAway === ha) || {}
          return {
            name: c.team?.displayName || '',
            abbr: c.team?.abbreviation || '',
            logo: c.team?.logo || null,
            score: c.score != null ? Number(c.score) : null,
            winner: !!c.winner,
          }
        }
        const home = side('home')
        const away = side('away')
        // ESPN : type.id 1 = à venir, 2 = en cours, 3 = terminé.
        const stateId = ev.status?.type?.id
        const state = stateId === '2' ? 'live' : stateId === '3' ? 'final' : 'pre'
        return {
          id: `${lg.key}-${ev.id}`,
          league: lg.label,
          date: comp.date || ev.date,
          detail: ev.status?.type?.shortDetail || '',
          state,
          winner: state === 'final' ? (home.winner ? 'home' : away.winner ? 'away' : null) : null,
          home, away,
        }
      }).filter(g => g.home.name && g.away.name)
    } catch {
      return []
    }
  }))

  const games = perLeague.flat().sort((a, b) => new Date(a.date) - new Date(b.date))
  challengeGamesCache = { data: games, ts: Date.now() }
  return games
}

const mmaStatsCache = new Map()
const MMA_STATS_TTL = 6 * 60 * 60 * 1000

async function fetchMmaFighterStats(espnId) {
  const cached = mmaStatsCache.get(espnId)
  if (cached && Date.now() - cached.ts < MMA_STATS_TTL) return cached.data
  const res = await fetch(`https://sports.core.api.espn.com/v2/sports/mma/athletes/${espnId}/statistics`)
  if (!res.ok) throw new Error('ESPN MMA athlete stats fetch failed')
  const data = await res.json()
  const raw = {}
  for (const c of data.splits?.categories || []) {
    for (const s of c.stats || []) raw[s.name] = s.value
  }
  // Note : koPercentage/tkoPercentage renvoyés par ESPN sont peu fiables (souvent identiques
  // entre eux quel que soit le combattant, visiblement un bug côté ESPN) — on ne les affiche pas.
  const result = {
    strikeAccuracy: raw.strikeAccuracy ?? null,
    strikeLPM: raw.strikeLPM ?? null,
    takedownAccuracy: raw.takedownAccuracy ?? null,
    takedownAvg: raw.takedownAvg ?? null,
    submissionAvg: raw.submissionAvg ?? null,
  }
  mmaStatsCache.set(espnId, { data: result, ts: Date.now() })
  return result
}

const nbaStatsCache = new Map()
const NBA_STATS_TTL = 6 * 60 * 60 * 1000

// Stats par match d'un joueur NBA ou WNBA sur la saison en cours. L'endpoint roster n'en
// fournit aucune : il faut interroger l'athlète un par un. Clé de cache préfixée par ligue
// pour éviter toute collision entre un id NBA et un id WNBA.
async function fetchNbaPlayerStats(athleteId, season, league = 'nba') {
  const cacheKey = `${league}:${athleteId}`
  const cached = nbaStatsCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < NBA_STATS_TTL) return cached.data
  try {
    const r = await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/${league}/seasons/${season}/types/2/athletes/${athleteId}/statistics`)
    if (!r.ok) return null
    const data = await r.json()
    const raw = {}
    for (const c of data.splits?.categories || []) {
      for (const s of c.stats || []) raw[s.name] = s.value
    }
    if (!raw.gamesPlayed) return null
    // ESPN renvoie des flottants bruts (17.018518...) : on arrondit au dixième,
    // comme toutes les feuilles de stats basket.
    const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
    const stats = {
      games: raw.gamesPlayed ?? null,
      min: r1(raw.avgMinutes),
      pts: r1(raw.avgPoints),
      reb: r1(raw.avgRebounds),
      ast: r1(raw.avgAssists),
      stl: r1(raw.avgSteals),
      blk: r1(raw.avgBlocks),
      tov: r1(raw.avgTurnovers),
      fg: r1(raw.fieldGoalPct),
    }
    nbaStatsCache.set(athleteId, { data: stats, ts: Date.now() })
    return stats
  } catch {
    return null
  }
}

// "Score HoopIQ" : auparavant dérivé de la POSITION du joueur dans la liste du
// roster (92 - index * 1.5) — un chiffre sans aucun rapport avec son niveau,
// affiché comme une note IA sur 100. C'est maintenant l'efficacité NBA classique
// (pts + reb + ast + interceptions + contres - ballons perdus), ramenée sur une
// échelle 0-100. Renvoie null quand les stats manquent, plutôt qu'un chiffre inventé.
function hoopiqScore(s) {
  if (!s || s.pts == null) return null
  const eff = (s.pts || 0) + (s.reb || 0) + (s.ast || 0) + (s.stl || 0) + (s.blk || 0) - (s.tov || 0)
  // Un EFF de 30+ correspond aux tout meilleurs joueurs de la ligue.
  return Math.max(1, Math.min(99, Math.round(eff * 3)))
}

async function fetchBullsPlayers(teamId = 4) {
  const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`
  const rosterResponse = await fetch(rosterUrl)
  if (!rosterResponse.ok) throw new Error('ESPN roster fetch failed')
  const rosterData = await rosterResponse.json()
  const roster = (rosterData.athletes || []).slice(0, 18)
  const season = new Date().getFullYear()

  const players = await Promise.all(roster.map(async (player) => {
    const stats = await fetchNbaPlayerStats(player.id, season)
    return {
      id: player.id,
      name: player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
      pos: player.position?.abbreviation || player.position?.displayName || 'N/A',
      team: player.teams?.[0]?.displayName || rosterData.team?.displayName || '',
      jersey: player.jersey || null,
      headshot: player.headshot?.href || null,
      score: hoopiqScore(stats),
      games: stats?.games ?? null,
      min: stats?.min ?? null,
      pts: stats?.pts ?? null,
      reb: stats?.reb ?? null,
      ast: stats?.ast ?? null,
      fg: stats?.fg ?? null,
    }
  }))

  // Les joueurs avec de vraies stats passent devant : la liste reflète l'apport
  // réel sur le terrain, pas l'ordre alphabétique du roster.
  return players.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
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

app.get('/api/nba/predict/:id', requireActiveUser, async (req, res) => {
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
        model: 'claude-3-5-haiku-latest',
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

app.get('/api/mma/rankings', async (req, res) => {
  try {
    const fighters = await fetchMmaRankings()
    res.json({ fighters })
  } catch (err) {
    console.error('MMA rankings fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch MMA rankings' })
  }
})

app.get('/api/mma/fighter/:id/stats', async (req, res) => {
  try {
    const stats = await fetchMmaFighterStats(req.params.id)
    res.json({ stats })
  } catch (err) {
    console.error('MMA fighter stats fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch fighter stats' })
  }
})

app.get('/api/wnba/leaders', async (req, res) => {
  try {
    res.json({ players: await fetchWnbaLeaders() })
  } catch (err) {
    console.error('WNBA leaders fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch WNBA leaders' })
  }
})

app.get('/api/challenges/today', async (req, res) => {
  try {
    res.json({ games: await fetchChallengeGames() })
  } catch (err) {
    console.error('Challenge games fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch games' })
  }
})

app.get('/api/leaderboard', async (req, res) => {
  try {
    res.json(await fetchLeaderboard({ period: req.query.period, email: req.query.email }))
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Unable to fetch leaderboard' })
  }
})

app.post('/api/challenge-score', requireIdentity, async (req, res) => {
  const { points, correct } = req.body || {}
  const result = await saveChallengeScore({ email: req.hoopiqUser.email, points, correct })
  if (result.error) return res.status(500).json(result)
  res.json(result)
})

app.get('/api/euroleague', async (req, res) => {
  try {
    res.json(await fetchEuroleague())
  } catch (err) {
    console.error('Euroleague fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch Euroleague data' })
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

// Stats en direct (saison en cours) d'un seul joueur NBA ou WNBA identifié par son id ESPN.
// Utilisé par la page Cartes (src/Cards.jsx) pour remplacer des pts/ast/reb/score qui étaient
// codés en dur dans le front — chaque carte affiche maintenant les vraies stats ESPN.
app.get('/api/player-stats/:league/:espnId', async (req, res) => {
  const league = (req.params.league || '').toLowerCase()
  if (league !== 'nba' && league !== 'wnba') return res.status(400).json({ error: 'invalid_league' })
  try {
    const season = new Date().getFullYear()
    const stats = await fetchNbaPlayerStats(req.params.espnId, season, league)
    res.json({ stats, score: hoopiqScore(stats) })
  } catch (err) {
    console.error('Player stats fetch error:', err)
    res.status(500).json({ error: 'Unable to fetch player stats' })
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

// Webhook Stripe — checkout.session.completed → enregistre l'abonnement.
// Sécurité : signature vérifiée si STRIPE_WEBHOOK_SECRET est définie (obligatoire en
// production — sans elle n'importe qui peut poster un faux événement) ; dans tous les cas
// on ne fait jamais confiance au payload — la session est re-lue depuis l'API Stripe.
// Route déclarée avant express.json() avec express.raw() (voir plus haut) : req.body est
// donc bien un Buffer ici, ce qui est requis par stripe.webhooks.constructEvent().
async function stripeWebhookHandler(req, res) {
  if (!stripe) return res.status(500).json({ error: 'stripe_not_configured' })

  let event = req.body
  const sig = req.headers['stripe-signature']
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (Buffer.isBuffer(req.body)) {
    if (whSecret) {
      if (!sig) return res.status(400).json({ error: 'missing_signature' })
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, whSecret)
      } catch (err) {
        return res.status(400).json({ error: `signature_invalid: ${err.message}` })
      }
    } else {
      // Pas de secret configuré (dev local uniquement) — on log un avertissement fort
      // plutôt que d'accepter silencieusement des événements non vérifiés.
      console.warn('STRIPE_WEBHOOK_SECRET absente — signature Stripe NON vérifiée sur ce webhook')
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
}

// --- Auth maison (remplace Supabase Auth) ---
// Session signée par HMAC-SHA256 avec un secret connu du serveur SEUL (SESSION_SECRET).
// Avant : signUser(email) = base64(`hiq:${email}:2025`) — une formule publique sans
// secret, que n'importe qui pouvait recalculer dans la console du navigateur pour se
// faire passer pour n'importe quel compte. Le HMAC ne peut être forgé sans SESSION_SECRET.
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  console.warn('SESSION_SECRET absente — utilisation d\'une clé aléatoire générée au démarrage (les sessions ne survivront pas à un redémarrage du serveur). Définis SESSION_SECRET dans les variables d\'environnement Vercel pour la production.')
  return crypto.randomBytes(32).toString('hex')
})()
const signUser = (email) => crypto.createHmac('sha256', SESSION_SECRET).update((email || '').toLowerCase()).digest('base64url')
function verifyUserToken(email, token) {
  if (!email || !token) return false
  const expected = signUser(email)
  const a = Buffer.from(String(token))
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

// Vérifie seulement l'identité (HMAC), sans exiger un plan payant ou un essai actif —
// pour les routes accessibles à tous les comptes connectés (ex: Défis/classement) mais
// qui doivent quand même être rattachées au VRAI compte de l'appelant, jamais à un email
// arbitraire fourni dans le body (sinon n'importe qui peut fausser le classement ou
// écraser le score d'un autre joueur — cf. audit du 2026-08-17).
function requireIdentity(req, res, next) {
  const email = (req.headers['x-hoopiq-email'] || '').toString().trim().toLowerCase()
  const token = (req.headers['x-hoopiq-token'] || '').toString()
  if (!verifyUserToken(email, token)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Session invalide — merci de te reconnecter.' })
  }
  req.hoopiqUser = { email }
  next()
}

// Identité vérifiée ET compte admin (Jorge) — pour les routes qui exposent des données
// business sensibles (abonnés, MRR). Les comptes VIP ont un accès Elite gratuit mais ne
// doivent PAS voir ces chiffres, donc on ne réutilise pas isVipEmailServer ici.
function requireAdmin(req, res, next) {
  const email = (req.headers['x-hoopiq-email'] || '').toString().trim().toLowerCase()
  const token = (req.headers['x-hoopiq-token'] || '').toString()
  if (!verifyUserToken(email, token) || !isAdminEmailServer(email)) {
    return res.status(403).json({ error: 'forbidden' })
  }
  req.hoopiqUser = { email }
  next()
}

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000 // même durée que l'essai gratuit annoncé côté front

// Vérifie l'identité (HMAC) ET l'accès actif (payant ou dans les 14 jours d'essai) avant
// de laisser passer une requête vers une route qui coûte de l'argent (appel IA) ou qui
// donne accès à du contenu payant. Avant ce middleware, ces routes étaient ouvertes à
// n'importe qui, authentifié ou non — cf. audit du 2026-08-03.
async function requireActiveUser(req, res, next) {
  const email = (req.headers['x-hoopiq-email'] || '').toString().trim().toLowerCase()
  const token = (req.headers['x-hoopiq-token'] || '').toString()
  if (!verifyUserToken(email, token)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Session invalide — merci de te reconnecter.' })
  }
  if (isAdminEmailServer(email) || isVipEmailServer(email)) {
    req.hoopiqUser = { email, plan: 'elite', planPaid: true, active: true }
    return next()
  }
  try {
    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    const sub = await fetchSubscription(email)
    const planPaid = (sub && sub.status === 'active') || !!user.plan_paid
    const withinTrial = !planPaid && !!user.created_at && (Date.now() - new Date(user.created_at).getTime()) < TRIAL_MS
    if (!planPaid && !withinTrial) {
      return res.status(402).json({ error: 'trial_expired', message: 'Ton essai gratuit est terminé — active un abonnement pour continuer.' })
    }
    req.hoopiqUser = { email, plan: (planPaid && sub?.plan) || user.plan || 'scout', planPaid, active: true }
    next()
  } catch (err) {
    console.error('requireActiveUser error:', err.message)
    res.status(500).json({ error: 'auth_check_failed' })
  }
}

// Mêmes listes que le front (src/App.jsx ADMIN_EMAILS / VIP_EMAILS) — dupliquées ici
// car le serveur ne doit jamais faire confiance à un rôle envoyé par le client.
const ADMIN_EMAILS_SERVER = ['jorgedosreis729@gmail.com']
const VIP_EMAILS_SERVER = ['dosreislopes.neusa@gmail.com', 'samaketyler@gmail.com', 'natauraonline@gmail.com']
const isAdminEmailServer = (email) => !!email && ADMIN_EMAILS_SERVER.includes(email)
const isVipEmailServer = (email) => !!email && VIP_EMAILS_SERVER.includes(email)

app.post('/api/auth/signup', async (req, res) => {
  if (!dbReady) return res.status(500).json({ error: 'db_not_configured' })
  const email = (req.body?.email || '').trim().toLowerCase()
  const password = req.body?.password || ''
  const name = (req.body?.name || '').trim() || email.split('@')[0]
  const plan = req.body?.plan || 'scout'
  if (!email || !password) return res.status(400).json({ error: 'missing_email_or_password' })
  if (password.length < 6) return res.status(400).json({ error: 'password_too_short' })
  try {
    const existing = await findUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'email_already_registered' })
    const user = await createUser({ email, password, name, plan })
    res.json({
      email: user.email,
      name: user.name,
      plan: user.plan,
      planPaid: user.plan_paid,
      createdAt: user.created_at,
      _v: 2,
      _s: signUser(user.email),
    })
  } catch (err) {
    console.error('Signup error:', err.message)
    res.status(500).json({ error: 'signup_failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  if (!dbReady) return res.status(500).json({ error: 'db_not_configured' })
  const email = (req.body?.email || '').trim().toLowerCase()
  const password = req.body?.password || ''
  if (!email || !password) return res.status(400).json({ error: 'missing_email_or_password' })
  try {
    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'invalid_credentials' })
    }
    res.json({
      email: user.email,
      name: user.name,
      plan: user.plan,
      planPaid: user.plan_paid,
      createdAt: user.created_at,
      _v: 2,
      _s: signUser(user.email),
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'login_failed' })
  }
})

// Plan actif d'un utilisateur, lu depuis la table subscriptions. Rattaché à l'identité
// vérifiée (HMAC) plutôt qu'à l'email de la query string : sans ça, n'importe qui pouvait
// lire le plan/statut d'abonnement de n'importe quel compte en devinant son email
// (fuite d'info + énumération de comptes) — cf. audit du 2026-08-17.
app.get('/api/subscription', requireIdentity, async (req, res) => {
  try {
    const sub = await fetchSubscription(req.hoopiqUser.email)
    res.json({ plan: sub?.plan || null, status: sub?.status || null })
  } catch (err) {
    res.status(500).json({ error: err.message || 'subscription_lookup_failed' })
  }
})

// Chiffres business réels (abonnés actifs + MRR) pour les outils admin JARVIS/Agent —
// remplace les "47 abonnés / 1 247€ MRR" qui étaient codés en dur partout, y compris
// dans le system prompt de l'IA (cf. audit du 2026-08-17). Pas de churn : on n'a pas
// d'historique des résiliations pour le calculer honnêtement, donc on ne l'invente pas.
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  if (!dbReady) return res.json({ available: false })
  const PLAN_PRICES = { scout: 9, pro: 29, elite: 89 }
  try {
    const result = await pool.query(
      `select plan, count(*)::int as n from subscriptions where status = 'active' group by plan`
    )
    const byPlan = { scout: 0, pro: 0, elite: 0 }
    let mrr = 0
    for (const row of result.rows) {
      if (byPlan[row.plan] != null) byPlan[row.plan] = row.n
      mrr += (PLAN_PRICES[row.plan] || 0) * row.n
    }
    const subscribers = byPlan.scout + byPlan.pro + byPlan.elite
    res.json({ available: true, subscribers, mrr, byPlan })
  } catch (err) {
    console.error('Admin stats error:', err.message)
    res.status(500).json({ error: 'stats_failed' })
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

app.post('/api/anthropic', requireActiveUser, async (req, res) => {
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
