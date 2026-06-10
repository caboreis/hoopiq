"""
lucie.py — Post Instagram automatique quotidien pour @hoopiq_officiel
Génère des images premium NBA avec Pillow et les publie via instagrapi.

Dépendances :
    pip install instagrapi groq pillow requests

Variables d'environnement (dans hoopiq/.env) :
    GROQ_API_KEY=...
    INSTAGRAM_USERNAME=hoopiq_officiel
    INSTAGRAM_PASSWORD=...
"""

import os
import sys
import json
import math
import random
import datetime
import urllib.request
import urllib.parse
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Chargement .env ────────────────────────────────────────────────────────────
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
IG_USERNAME  = os.environ.get("INSTAGRAM_USERNAME", "")
IG_PASSWORD  = os.environ.get("INSTAGRAM_PASSWORD", "")

if not GROQ_API_KEY:
    sys.exit("❌ GROQ_API_KEY manquante — ajoute-la dans .env")
if not IG_USERNAME or not IG_PASSWORD:
    sys.exit("❌ INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD manquants")

from groq import Groq
client = Groq(api_key=GROQ_API_KEY)

# ── Helpers Groq ───────────────────────────────────────────────────────────────
def ask_groq(prompt: str, max_tokens: int = 600) -> str:
    r = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.9,
    )
    raw = r.choices[0].message.content.strip()
    return raw.replace("```json", "").replace("```", "").strip()

def parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return {}

# ── Palette HoopIQ ─────────────────────────────────────────────────────────────
W, H = 1080, 1080

ORANGE      = (255, 92,  0)
ORANGE_SOFT = (255, 140, 66)
WHITE_TEXT  = (240, 240, 255)
GRAY_TEXT   = (107, 107, 136)
GRAY_LINE   = (45,  45,  65)
BG_BASE     = (8,   8,   18)
BG_WARM     = (22,  7,   0)
BLUE_STAT   = (79,  163, 255)
GREEN_STAT  = (34,  211, 122)
YELLOW_STAT = (245, 200, 66)
GOLD_RANK   = (255, 215, 0)

_FONT_TTC = "/System/Library/Fonts/HelveticaNeue.ttc"

def _font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    # HelveticaNeue.ttc index 1 = Bold, index 0 = Regular
    try:
        return ImageFont.truetype(_FONT_TTC, size, index=1 if bold else 0)
    except Exception:
        return ImageFont.load_default()

def _center(draw: ImageDraw.ImageDraw, y: int, text: str, fnt, fill, canvas_w: int = W):
    bb = draw.textbbox((0, 0), text, font=fnt)
    x = (canvas_w - (bb[2] - bb[0])) // 2
    draw.text((x, y), text, font=fnt, fill=fill)

def _wrap(draw: ImageDraw.ImageDraw, text: str, cx: int, y: int, max_w: int,
          fnt, fill, spacing: int = 10) -> int:
    """Draw wrapped text centered at cx. Returns bottom y."""
    words = text.split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        bb = draw.textbbox((0, 0), test, font=fnt)
        if bb[2] - bb[0] > max_w and cur:
            lines.append(cur)
            cur = word
        else:
            cur = test
    if cur:
        lines.append(cur)
    sample = draw.textbbox((0, 0), "Ag", font=fnt)
    lh = sample[3] - sample[1] + spacing
    for i, line in enumerate(lines):
        bb = draw.textbbox((0, 0), line, font=fnt)
        draw.text((cx - (bb[2] - bb[0]) // 2, y + i * lh), line, font=fnt, fill=fill)
    return y + len(lines) * lh

def _make_bg() -> Image.Image:
    """Dark background with subtle warm upper glow."""
    img = Image.new("RGB", (W, H), BG_BASE)
    draw = ImageDraw.Draw(img)
    for r in range(560, 0, -8):
        t = (560 - r) / 560
        c = (
            int(BG_BASE[0] + (BG_WARM[0] - BG_BASE[0]) * math.exp(-3 * t)),
            int(BG_BASE[1] + (BG_WARM[1] - BG_BASE[1]) * math.exp(-3 * t)),
            int(BG_BASE[2] + (BG_WARM[2] - BG_BASE[2]) * math.exp(-3 * t)),
        )
        draw.ellipse([540 - r, 200 - r, 540 + r, 200 + r], fill=c)
    return img

def _chrome(draw: ImageDraw.ImageDraw):
    """Top/bottom orange gradient bands + HOOP IQ logo."""
    for x in range(W):
        t = x / (W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        draw.line([(x, 0), (x, 10)], fill=c)
        draw.line([(x, H - 11), (x, H - 1)], fill=c)
    fnt_logo   = _font(34)
    fnt_handle = _font(17, bold=False)
    draw.text((54, 28), "HOOP IQ", font=fnt_logo, fill=ORANGE)
    bb = draw.textbbox((0, 0), "@hoopiq_officiel", font=fnt_handle)
    draw.text((W - 54 - (bb[2] - bb[0]), 36), "@hoopiq_officiel", font=fnt_handle, fill=GRAY_TEXT)

def _orange_box(draw: ImageDraw.ImageDraw, x0, y0, x1, y1, radius=16):
    """Subtle orange-tinted card box."""
    c_fill = (
        int(BG_BASE[0] + (ORANGE[0] - BG_BASE[0]) * 0.10),
        int(BG_BASE[1] + (ORANGE[1] - BG_BASE[1]) * 0.10),
        int(BG_BASE[2] + (ORANGE[2] - BG_BASE[2]) * 0.10),
    )
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=c_fill, outline=ORANGE, width=2)

# ── ESPN photo fetch ───────────────────────────────────────────────────────────
_ESPN_HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

def _espn_headshot_url(player_name: str):
    """Return the ESPN headshot URL for player_name, or None."""
    q = urllib.parse.quote(player_name)
    url = (f"https://site.web.api.espn.com/apis/search/v2"
           f"?query={q}&limit=3&type=player&sport=basketball")
    try:
        req = urllib.request.Request(url, headers=_ESPN_HEADERS)
        with urllib.request.urlopen(req, timeout=6) as r:
            data = json.loads(r.read())
        for section in data.get("results", []):
            if section.get("type") == "player":
                contents = section.get("contents", [])
                if contents:
                    img = contents[0].get("image", {})
                    return img.get("default") or img.get("defaultDark")
    except Exception:
        pass
    return None

def fetch_player_photo(player_name: str, diameter: int = 236):
    """
    Download the ESPN headshot for player_name, crop it to a circle,
    and return a diameter×diameter RGBA image.  Returns None on failure.
    """
    img_url = _espn_headshot_url(player_name)
    if not img_url:
        print(f"⚠️  Photo ESPN introuvable pour : {player_name}")
        return None
    try:
        req = urllib.request.Request(img_url, headers=_ESPN_HEADERS)
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = Image.open(BytesIO(r.read())).convert("RGBA")
    except Exception as e:
        print(f"⚠️  Téléchargement ESPN échoué: {e}")
        return None

    # ESPN headshots vary in size (600x436, 426x320…) — crop a square
    w, h = raw.size
    side = min(w, h)
    left = (w - side) // 2
    # Keep top at 0 so we never exceed image bounds; the player fills the square
    raw = raw.crop((left, 0, left + side, side))
    raw = raw.resize((diameter, diameter), Image.LANCZOS)

    # Circular mask
    mask = Image.new("L", (diameter, diameter), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, diameter - 1, diameter - 1], fill=255)
    result = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    result.paste(raw, (0, 0), mask)

    # Sanity check: at least 10% of pixels must be opaque (avoid blank/broken images)
    alpha_data = list(result.split()[3].getdata())
    opaque_pct = sum(1 for p in alpha_data if p > 64) / len(alpha_data)
    if opaque_pct < 0.10:
        print(f"⚠️  Photo ESPN trop transparente ({opaque_pct:.0%}) : {player_name}")
        return None

    print(f"✅ Photo ESPN : {player_name} ({opaque_pct:.0%} opaque)")
    return result


# ── Image : Player Card ────────────────────────────────────────────────────────
def draw_player_card(data: dict) -> Path:
    img = _make_bg()
    draw = ImageDraw.Draw(img)
    _chrome(draw)

    # Avatar circle
    CX, CY, CR = 540, 268, 118
    # Outer glow rings
    for r in range(CR + 20, CR + 2, -3):
        t = (r - CR - 2) / 18
        c = tuple(int(BG_BASE[i] + (ORANGE[i] - BG_BASE[i]) * (1 - t) * 0.35) for i in range(3))
        draw.ellipse([CX - r, CY - r, CX + r, CY + r], outline=c, width=2)
    # Dark circle background
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], fill=(20, 8, 2))

    # Try ESPN photo first, fall back to initials
    player_name = str(data.get("player_name", "Player"))
    photo = fetch_player_photo(player_name, diameter=CR * 2)
    if photo:
        img.paste(photo, (CX - CR, CY - CR), photo.split()[3])
    else:
        initials = str(data.get("initials", "??"))[:2].upper()
        fnt_init = _font(82)
        bb = draw.textbbox((0, 0), initials, font=fnt_init)
        draw.text((CX - (bb[2] - bb[0]) // 2, CY - (bb[3] - bb[1]) // 2 - 8),
                  initials, font=fnt_init, fill=ORANGE)
    # Orange border ring on top of photo
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], outline=ORANGE, width=4)

    # Badge ANALYSE IA
    bw, bh = 196, 36
    bx = 540 - bw // 2
    draw.rounded_rectangle([bx, 410, bx + bw, 410 + bh], radius=18, fill=ORANGE)
    fnt_badge = _font(15)
    bb = draw.textbbox((0, 0), "ANALYSE IA", font=fnt_badge)
    draw.text((540 - (bb[2] - bb[0]) // 2, 420), "ANALYSE IA", font=fnt_badge, fill=(255, 255, 255))

    # Player name — auto-shrink if too long
    fnt_name = _font(68)
    while True:
        bb = draw.textbbox((0, 0), player_name, font=fnt_name)
        if bb[2] - bb[0] <= 980 or fnt_name.size <= 34:
            break
        fnt_name = _font(fnt_name.size - 4)
    _center(draw, 466, player_name, fnt_name, WHITE_TEXT)

    team_pos = f"{data.get('team', '')}  ·  {data.get('position', '')}"
    _center(draw, 553, team_pos, _font(25, bold=False), GRAY_TEXT)

    draw.line([(80, 596), (1000, 596)], fill=GRAY_LINE, width=1)

    # Stats 4 columns
    stats = [
        (str(data.get("pts", "")),        "PTS",  ORANGE,      162),
        (str(data.get("ast", "")),         "AST",  BLUE_STAT,   378),
        (str(data.get("reb", "")),         "REB",  GREEN_STAT,  702),
        (f"{data.get('fg', '')}%",        "FG%",  YELLOW_STAT, 918),
    ]
    fnt_val = _font(66)
    fnt_lbl = _font(20, bold=False)
    for val, lbl, color, sx in stats:
        bb = draw.textbbox((0, 0), val, font=fnt_val)
        draw.text((sx - (bb[2] - bb[0]) // 2, 610), val, font=fnt_val, fill=color)
        bb = draw.textbbox((0, 0), lbl, font=fnt_lbl)
        draw.text((sx - (bb[2] - bb[0]) // 2, 692), lbl, font=fnt_lbl, fill=GRAY_TEXT)
    for sx in [270, 540, 810]:
        draw.line([(sx, 612), (sx, 716)], fill=GRAY_LINE, width=1)

    # HoopIQ Score ring
    score = str(data.get("score", ""))
    SX, SY, SR = 540, 806, 54
    draw.ellipse([SX - SR, SY - SR, SX + SR, SY + SR], fill=BG_BASE, outline=ORANGE, width=5)
    fnt_sc = _font(40)
    bb = draw.textbbox((0, 0), score, font=fnt_sc)
    draw.text((SX - (bb[2] - bb[0]) // 2, SY - (bb[3] - bb[1]) // 2 - 4),
              score, font=fnt_sc, fill=ORANGE)
    _center(draw, SY + SR - 14, "SCORE HOOPIQ", _font(12, bold=False), GRAY_TEXT)

    # Analysis
    analysis = str(data.get("analysis", ""))
    _wrap(draw, analysis, 540, 886, 920, _font(23, bold=False), WHITE_TEXT)

    # Hashtags
    _center(draw, 1026, str(data.get("hashtags", "#NBA #HoopIQ")), _font(16, bold=False), ORANGE)

    out = Path("/tmp/hoopiq_player_card.png")
    img.save(out)
    print(f"✅ Player card : {out}")
    return out


# ── Image : Daily Buzz ─────────────────────────────────────────────────────────
def draw_daily_buzz(data: dict) -> Path:
    img = _make_bg()
    draw = ImageDraw.Draw(img)

    # Subtle decorative grid
    for pos in [270, 540, 810]:
        draw.line([(0, pos), (W, pos)], fill=GRAY_LINE, width=1)
        draw.line([(pos, 0), (pos, H)], fill=GRAY_LINE, width=1)

    _chrome(draw)

    # Basketball circle decoration
    CX, CY = 540, 200
    draw.ellipse([CX - 72, CY - 72, CX + 72, CY + 72], outline=ORANGE, width=2)
    # Court seam lines
    for dx in [-24, 0, 24]:
        draw.arc([CX + dx - 72, CY - 72, CX + dx + 72, CY + 72],
                 start=30, end=150, fill=GRAY_LINE, width=2)
    draw.arc([CX - 72, CY - 24, CX + 72, CY + 24], start=200, end=340, fill=GRAY_LINE, width=2)

    # Date
    _center(draw, 302, str(data.get("date", "")).upper(), _font(22, bold=False), GRAY_TEXT)

    # Title HUGE — auto-shrink
    title = str(data.get("title", "NBA BUZZ"))
    fnt_title = _font(72)
    while True:
        bb = draw.textbbox((0, 0), title, font=fnt_title)
        if bb[2] - bb[0] <= 980 or fnt_title.size <= 36:
            break
        fnt_title = _font(fnt_title.size - 4)
    _center(draw, 344, title, fnt_title, WHITE_TEXT)

    # Orange separator
    bb = draw.textbbox((0, 0), title, font=fnt_title)
    title_w = bb[2] - bb[0]
    line_y = 344 + (bb[3] - bb[1]) + 14
    draw.line([(540 - title_w // 2, line_y), (540 + title_w // 2, line_y)],
              fill=ORANGE, width=3)

    # Body text
    body_y = line_y + 26
    _wrap(draw, str(data.get("body", "")), 540, body_y, 920, _font(29, bold=False),
          (204, 204, 220), spacing=14)

    # Stat box
    _orange_box(draw, 80, 700, 1000, 886, radius=20)
    _center(draw, 726, "STAT DU JOUR", _font(18), ORANGE)
    draw.line([(200, 756), (880, 756)], fill=GRAY_LINE, width=1)
    stat = str(data.get("stat", ""))
    fnt_stat = _font(52)
    while True:
        bb = draw.textbbox((0, 0), stat, font=fnt_stat)
        if bb[2] - bb[0] <= 860 or fnt_stat.size <= 24:
            break
        fnt_stat = _font(fnt_stat.size - 4)
    _center(draw, 780, stat, fnt_stat, YELLOW_STAT)

    # Hashtags + footer
    _center(draw, 932, str(data.get("hashtags", "#NBA #HoopIQ")), _font(20, bold=False), ORANGE)
    _center(draw, 980, "Analyse IA  ·  NBA  ·  WNBA", _font(18, bold=False), GRAY_TEXT)
    _center(draw, 1016, "hoopiq-zeta.vercel.app", _font(15, bold=False), GRAY_LINE)

    out = Path("/tmp/hoopiq_daily_buzz.png")
    img.save(out)
    print(f"✅ Daily buzz : {out}")
    return out


# ── Image : Top 5 ─────────────────────────────────────────────────────────────
def draw_top5(data: dict) -> Path:
    img = _make_bg()
    draw = ImageDraw.Draw(img)
    _chrome(draw)

    # Header
    _center(draw, 100, "TOP 5", _font(72), WHITE_TEXT)
    _center(draw, 178, str(data.get("category", "NBA")), _font(42), ORANGE)
    draw.line([(80, 234), (1000, 234)], fill=GRAY_LINE, width=1)

    # Row configs: (y_start, height, is_first)
    row_configs = [
        (248, 120, True),
        (384, 106, False),
        (504, 106, False),
        (624, 106, False),
        (744, 106, False),
    ]

    for idx, (ry, rh, is_first) in enumerate(row_configs, 1):
        name = str(data.get(f"p{idx}_name", ""))
        team = str(data.get(f"p{idx}_team", ""))
        pos  = str(data.get(f"p{idx}_pos",  ""))
        stat = str(data.get(f"p{idx}_stat", ""))

        if is_first:
            _orange_box(draw, 60, ry, 1020, ry + rh, radius=14)
        else:
            c_bg = tuple(int(BG_BASE[i] + 12) for i in range(3))
            draw.rounded_rectangle([60, ry, 1020, ry + rh], radius=14,
                                   fill=c_bg, outline=GRAY_LINE, width=1)

        fnt_rk   = _font(50 if is_first else 44)
        fnt_nm   = _font(36 if is_first else 31)
        fnt_st   = _font(44 if is_first else 38)
        fnt_tp   = _font(22 if is_first else 19, bold=False)
        rank_col = ORANGE if is_first else GRAY_TEXT
        name_col = WHITE_TEXT
        stat_col = ORANGE if is_first else (200, 200, 220)

        mid_y = ry + rh // 2
        rk_str = f"#{idx}"
        bb = draw.textbbox((0, 0), rk_str, font=fnt_rk)
        draw.text((104, mid_y - (bb[3] - bb[1]) // 2), rk_str, font=fnt_rk, fill=rank_col)

        bb_nm = draw.textbbox((0, 0), name, font=fnt_nm)
        name_h = bb_nm[3] - bb_nm[1]
        draw.text((198, mid_y - name_h // 2 - (10 if is_first else 8)), name, font=fnt_nm, fill=name_col)

        team_pos = f"{team}  ·  {pos}"
        draw.text((198, mid_y + name_h // 2 - (4 if is_first else 2)), team_pos, font=fnt_tp, fill=GRAY_TEXT)

        bb = draw.textbbox((0, 0), stat, font=fnt_st)
        draw.text((1010 - (bb[2] - bb[0]), mid_y - (bb[3] - bb[1]) // 2), stat, font=fnt_st, fill=stat_col)

    # Footer
    draw.line([(80, 868), (1000, 868)], fill=GRAY_LINE, width=1)
    _center(draw, 894, str(data.get("hashtags", "#NBA #HoopIQ #Top5")), _font(20, bold=False), ORANGE)
    _center(draw, 940, "Classement IA  ·  hoopiq_officiel", _font(18, bold=False), GRAY_TEXT)
    mois = ["JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN",
            "JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE"]
    d = datetime.date.today()
    today_fr = f"{d.day} {mois[d.month - 1]} {d.year}"
    _center(draw, 976, today_fr, _font(16, bold=False), GRAY_LINE)
    _center(draw, 1012, "hoopiq-zeta.vercel.app", _font(15, bold=False), GRAY_LINE)

    out = Path("/tmp/hoopiq_top5.png")
    img.save(out)
    print(f"✅ Top 5 : {out}")
    return out


# ── Types de posts ─────────────────────────────────────────────────────────────
def post_daily_buzz() -> tuple:
    today = datetime.date.today().strftime("%d %B %Y")
    raw = ask_groq(f"""Tu es le social media manager de HoopIQ, le meilleur compte NBA sur Instagram.
Aujourd'hui c'est le {today}. Génère un post "Daily Buzz" NBA qui va BUZZER.
Format JSON strict :
{{
  "title": "TITRE EN MAJUSCULES max 4 mots style choc",
  "body": "texte 3 lignes max, direct et passionné, sans emojis, en français",
  "stat": "une stat ou fait NBA marquant court (ex: LeBron 40 000 pts)",
  "hashtags": "#NBA #Basketball #HoopIQ #NBAFrance #Basket"
}}
Uniquement le JSON.""")
    d = parse_json(raw) or {
        "title": "NBA DAILY BUZZ",
        "body": "La NBA ne dort jamais. Les meilleurs joueurs du monde sur le parquet chaque nuit. HoopIQ analyse tout.",
        "stat": "248 matchs analysés cette saison",
        "hashtags": "#NBA #Basketball #HoopIQ #NBAFrance",
    }
    img_data = {
        "title":    d.get("title", "NBA BUZZ"),
        "body":     d.get("body", ""),
        "stat":     d.get("stat", ""),
        "hashtags": d.get("hashtags", "#NBA #HoopIQ"),
        "date":     today,
    }
    caption = (
        f"{d['title']} 🏀\n\n{d['body']}\n\n"
        f"📊 {d['stat']}\n\n━━━━━━━━━━━━━━━\n"
        f"🔥 Analyse IA sur HoopIQ\n👉 Lien en bio\n\n{d['hashtags']}"
    )
    return draw_daily_buzz(img_data), caption


def post_player_analysis() -> tuple:
    today = datetime.date.today().strftime("%d %B %Y")
    raw = ask_groq(f"""Tu es HoopIQ Scout. Aujourd'hui c'est le {today}.
Génère une fiche d'analyse d'un joueur NBA actuellement en forme.
Format JSON strict :
{{
  "player_name": "Prénom Nom",
  "team": "Nom équipe",
  "position": "PG",
  "pts": 24.5,
  "ast": 7.2,
  "reb": 5.1,
  "fg": 48,
  "score": 91,
  "initials": "XX",
  "analysis": "une phrase percutante en français max 15 mots sans emojis",
  "hashtags": "#NBA #HoopIQ #Basketball #NBAFrance"
}}
Uniquement le JSON.""")
    d = parse_json(raw) or {
        "player_name": "LeBron James", "team": "Los Angeles Lakers",
        "position": "SF", "pts": 28.5, "ast": 8.3, "reb": 7.9, "fg": 52,
        "score": 95, "initials": "LJ",
        "analysis": "Le King règne toujours. Une saison historique à 39 ans.",
        "hashtags": "#NBA #LeBron #HoopIQ",
    }
    name = d.get("player_name", "")
    caption = (
        f"🏀 ANALYSE IA — {name}\n\n"
        f"📊 {d.get('pts')} pts | {d.get('ast')} ast | {d.get('reb')} reb | {d.get('fg')}% FG\n"
        f"⚡ Score HoopIQ : {d.get('score')}/100\n\n"
        f"{d.get('analysis')}\n\n━━━━━━━━━━━━━━━\n"
        f"🔥 Toutes les analyses sur HoopIQ\n👉 Lien en bio\n\n{d.get('hashtags')}"
    )
    return draw_player_card(d), caption


def post_top5() -> tuple:
    today = datetime.date.today().strftime("%d %B %Y")
    categories = ["MARQUEURS", "PASSEURS", "REBONDEURS", "PERFORMERS"]
    cat = random.choice(categories)
    raw = ask_groq(f"""Tu es HoopIQ. Génère un Top 5 NBA des meilleurs {cat} du moment.
Format JSON strict :
{{
  "category": "{cat}",
  "players": [
    {{"name":"Prénom Nom","team":"Équipe","pos":"POS","stat":"28.5 pts"}},
    {{"name":"Prénom Nom","team":"Équipe","pos":"POS","stat":"26.1 pts"}},
    {{"name":"Prénom Nom","team":"Équipe","pos":"POS","stat":"25.0 pts"}},
    {{"name":"Prénom Nom","team":"Équipe","pos":"POS","stat":"23.8 pts"}},
    {{"name":"Prénom Nom","team":"Équipe","pos":"POS","stat":"22.4 pts"}}
  ],
  "hashtags": "#NBA #HoopIQ #Basketball #NBAFrance #Top5"
}}
Uniquement le JSON.""")
    d = parse_json(raw) or {}
    players = d.get("players", [
        {"name": "S. Gilgeous-Alexander", "team": "OKC Thunder", "pos": "PG", "stat": "31.4 pts"},
        {"name": "Luka Doncic",           "team": "Lakers",      "pos": "PG", "stat": "29.9 pts"},
        {"name": "Giannis Antetokounmpo", "team": "Bucks",       "pos": "PF", "stat": "29.2 pts"},
        {"name": "Jayson Tatum",          "team": "Celtics",     "pos": "SF", "stat": "27.1 pts"},
        {"name": "Damian Lillard",        "team": "Bucks",       "pos": "PG", "stat": "25.9 pts"},
    ])
    hashtags = d.get("hashtags", "#NBA #HoopIQ #Top5 #Basketball")
    img_data = {
        "category": d.get("category", cat),
        "hashtags": hashtags,
    }
    for i, p in enumerate(players[:5], 1):
        img_data[f"p{i}_name"] = p.get("name", "")
        img_data[f"p{i}_team"] = p.get("team", "")
        img_data[f"p{i}_pos"]  = p.get("pos", "")
        img_data[f"p{i}_stat"] = p.get("stat", "")
    lines = "\n".join([f"#{i+1} {p['name']} — {p['stat']}" for i, p in enumerate(players[:5])])
    caption = (
        f"🏆 TOP 5 {d.get('category', cat)} DU MOMENT 🏀\n\n{lines}\n\n"
        f"━━━━━━━━━━━━━━━\n🔥 Stats IA sur HoopIQ\n👉 Lien en bio\n\n{hashtags}"
    )
    return draw_top5(img_data), caption


# ── Publication Instagram ──────────────────────────────────────────────────────
def post_to_instagram(image_path: Path, caption: str) -> bool:
    try:
        from instagrapi import Client
    except ImportError:
        sys.exit("❌ instagrapi non installé — pip install instagrapi")

    cl = Client()
    session_file = Path(__file__).parent / "ig_session.json"
    print(f"🔐 Connexion Instagram @{IG_USERNAME}...")

    if session_file.exists():
        try:
            cl.load_settings(session_file)
            cl.login(IG_USERNAME, IG_PASSWORD)
            print("✅ Session rechargée")
        except Exception:
            print("⚠️  Session expirée, reconnexion...")
            session_file.unlink(missing_ok=True)
            cl.login(IG_USERNAME, IG_PASSWORD)
    else:
        cl.login(IG_USERNAME, IG_PASSWORD)
        print("✅ Connexion réussie")

    cl.dump_settings(session_file)
    cl.delay_range = [2, 5]
    print("📤 Publication en cours...")

    try:
        from instagrapi.exceptions import PhotoConfigureError
    except ImportError:
        PhotoConfigureError = Exception

    media = None
    try:
        media = cl.photo_upload(image_path, caption=caption,
                                extra_data={"custom_accessibility_caption": "", "retry_timeout": 0})
    except PhotoConfigureError:
        import time
        time.sleep(4)
        try:
            recent = cl.user_medias(cl.user_id, 1)
            if recent:
                media = recent[0]
                print("⚠️  Configure timeout — média récupéré via fallback")
        except Exception:
            pass

    if media:
        print(f"🎉 Post publié ! ID: {media.id}")
        try:
            print(f"🔗 https://www.instagram.com/p/{media.code}/")
        except Exception:
            pass
        return True
    else:
        print("❌ Échec publication — vérifie Instagram manuellement")
        return False


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  🏀 LUCIE — HoopIQ Instagram Bot")
    print(f"  {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 55)

    day = datetime.date.today().toordinal()
    post_types = [post_daily_buzz, post_player_analysis, post_top5]
    post_fn = post_types[day % len(post_types)]
    print(f"\n📋 Post du jour : {post_fn.__name__}")

    print("\n📝 Génération du contenu avec Groq...")
    image_path, caption = post_fn()

    print(f"\n📋 Légende :\n{caption[:220]}...\n")
    post_to_instagram(image_path, caption)
    print("\n✅ Terminé ! Check @hoopiq_officiel 🚀")


if __name__ == "__main__":
    main()
