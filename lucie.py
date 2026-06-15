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


# ── TikTok Video Generator ─────────────────────────────────────────────────────
TK_W, TK_H = 1080, 1920
TIKTOK_DIR = Path(__file__).parent / "tiktok_ready"
MUSIC_DIR  = Path(__file__).parent / "public" / "music"


_TIKTOK_STARS = [
    ("LeBron James",             "Los Angeles Lakers", "SF", "LJ"),
    ("Stephen Curry",            "Golden State Warriors", "PG", "SC"),
    ("Giannis Antetokounmpo",    "Milwaukee Bucks",    "PF", "GA"),
    ("Nikola Jokic",             "Denver Nuggets",     "C",  "NJ"),
    ("Luka Doncic",              "Dallas Mavericks",   "PG", "LD"),
]

def _fetch_tiktok_player_data(player_name: str = "") -> dict:
    today = datetime.date.today().strftime("%d %B %Y")
    if not player_name:
        star = _TIKTOK_STARS[datetime.date.today().toordinal() % len(_TIKTOK_STARS)]
        player_name, team, pos, initials = star
    else:
        team = pos = initials = ""

    raw = ask_groq(
        f"Tu es HoopIQ. Aujourd'hui {today}.\n"
        f"Génère la fiche NBA de {player_name} avec ses vraies stats de cette saison.\n"
        "Réponds UNIQUEMENT avec ce JSON, rien d'autre :\n"
        '{"player_name":"' + player_name + '","team":"Équipe","position":"POS",'
        '"pts":28.5,"ast":7.2,"reb":5.1,"fg":48,"score":91,"initials":"XX",'
        '"analysis":"Une phrase courte et percutante en français max 12 mots",'
        '"hashtags":"#NBA #HoopIQ #Basketball #TikTok #NBAFrance"}',
        max_tokens=350,
    )
    d = parse_json(raw)
    if not d:
        d = {
            "player_name": player_name, "team": team, "position": pos,
            "pts": "—", "ast": "—", "reb": "—", "fg": "—",
            "score": 95, "initials": initials,
            "analysis": "Une légende qui redéfinit le basket chaque soir.",
            "hashtags": f"#NBA #HoopIQ #Basketball #TikTok",
        }
    return d


def draw_tiktok_frame(data: dict) -> Image.Image:
    """Rend un visuel 1080×1920 pour TikTok avec la fiche joueur NBA."""
    img = Image.new("RGB", (TK_W, TK_H), BG_BASE)
    draw = ImageDraw.Draw(img)

    # Background glow vertical
    for r in range(700, 0, -10):
        t = (700 - r) / 700
        c = (
            int(BG_BASE[0] + (BG_WARM[0] - BG_BASE[0]) * math.exp(-2.5 * t)),
            int(BG_BASE[1] + (BG_WARM[1] - BG_BASE[1]) * math.exp(-2.5 * t)),
            int(BG_BASE[2] + (BG_WARM[2] - BG_BASE[2]) * math.exp(-2.5 * t)),
        )
        draw.ellipse([TK_W // 2 - r, 480 - r // 2, TK_W // 2 + r, 480 + r // 2], fill=c)

    # Bandes orange haut/bas
    for x in range(TK_W):
        t = x / (TK_W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        draw.line([(x, 0), (x, 14)], fill=c)
        draw.line([(x, TK_H - 15), (x, TK_H - 1)], fill=c)

    # Logo + handle
    draw.text((60, 44), "HOOP IQ", font=_font(44), fill=ORANGE)
    draw.text((62, 100), "@hoopiq_officiel", font=_font(24, bold=False), fill=GRAY_TEXT)
    date_str = datetime.date.today().strftime("%d %B %Y").upper()
    _center(draw, 162, date_str, _font(28, bold=False), GRAY_TEXT, TK_W)
    draw.line([(80, 206), (TK_W - 80, 206)], fill=GRAY_LINE, width=1)

    # Cercle photo joueur
    player_name = str(data.get("player_name", ""))
    CX, CY, CR = TK_W // 2, 500, 170
    for r in range(CR + 22, CR + 2, -3):
        tg = (r - CR - 2) / 20
        cg = tuple(int(BG_BASE[i] + (ORANGE[i] - BG_BASE[i]) * (1 - tg) * 0.28) for i in range(3))
        draw.ellipse([CX - r, CY - r, CX + r, CY + r], outline=cg, width=2)
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], fill=(20, 8, 2))
    if player_name:
        photo = fetch_player_photo(player_name, diameter=CR * 2)
        if photo:
            img.paste(photo, (CX - CR, CY - CR), photo.split()[3])
        else:
            initials = str(data.get("initials", "??"))[:2].upper()
            fnt_i = _font(108)
            bb = draw.textbbox((0, 0), initials, font=fnt_i)
            draw.text((CX - (bb[2] - bb[0]) // 2, CY - (bb[3] - bb[1]) // 2 - 10),
                      initials, font=fnt_i, fill=ORANGE)
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], outline=ORANGE, width=5)

    # Badge
    bw, bh = 220, 42
    draw.rounded_rectangle([TK_W // 2 - bw // 2, 692, TK_W // 2 + bw // 2, 692 + bh],
                           radius=21, fill=ORANGE)
    fnt_badge = _font(18)
    bb = draw.textbbox((0, 0), "ANALYSE IA", font=fnt_badge)
    draw.text((TK_W // 2 - (bb[2] - bb[0]) // 2, 702), "ANALYSE IA", font=fnt_badge, fill=(255, 255, 255))

    # Nom joueur
    fnt_name = _font(74)
    while True:
        bb = draw.textbbox((0, 0), player_name, font=fnt_name)
        if bb[2] - bb[0] <= TK_W - 100 or fnt_name.size <= 36:
            break
        fnt_name = _font(fnt_name.size - 4)
    _center(draw, 756, player_name, fnt_name, WHITE_TEXT, TK_W)
    team_pos = f"{data.get('team', '')}  ·  {data.get('position', '')}".strip(" ·")
    _center(draw, 844, team_pos, _font(32, bold=False), GRAY_TEXT, TK_W)
    draw.line([(80, 900), (TK_W - 80, 900)], fill=GRAY_LINE, width=1)

    # Stats 2×2
    col_l, col_r = TK_W // 4, TK_W * 3 // 4
    row1_y, row2_y = 924, 1096
    stats_grid = [
        (str(data.get("pts", "")), "PTS",  ORANGE,      col_l, row1_y),
        (str(data.get("ast", "")), "AST",  BLUE_STAT,   col_r, row1_y),
        (str(data.get("reb", "")), "REB",  GREEN_STAT,  col_l, row2_y),
        (f"{data.get('fg', '')}%","FG%",  YELLOW_STAT, col_r, row2_y),
    ]
    fnt_val = _font(86)
    fnt_lbl = _font(30, bold=False)
    for val, lbl, color, sx, sy in stats_grid:
        bb = draw.textbbox((0, 0), val, font=fnt_val)
        draw.text((sx - (bb[2] - bb[0]) // 2, sy), val, font=fnt_val, fill=color)
        bb = draw.textbbox((0, 0), lbl, font=fnt_lbl)
        draw.text((sx - (bb[2] - bb[0]) // 2, sy + 98), lbl, font=fnt_lbl, fill=GRAY_TEXT)
    draw.line([(TK_W // 2, 924), (TK_W // 2, 1240)], fill=GRAY_LINE, width=1)
    draw.line([(80, row1_y + 142), (TK_W - 80, row1_y + 142)], fill=GRAY_LINE, width=1)

    # Score HoopIQ
    score = str(data.get("score", ""))
    SX, SY, SR = TK_W // 2, 1340, 76
    draw.ellipse([SX - SR, SY - SR, SX + SR, SY + SR], fill=BG_BASE, outline=ORANGE, width=6)
    fnt_sc = _font(58)
    bb = draw.textbbox((0, 0), score, font=fnt_sc)
    draw.text((SX - (bb[2] - bb[0]) // 2, SY - (bb[3] - bb[1]) // 2 - 4),
              score, font=fnt_sc, fill=ORANGE)
    _center(draw, SY + SR - 16, "SCORE HOOPIQ", _font(20, bold=False), GRAY_TEXT, TK_W)

    # Analyse
    _wrap(draw, str(data.get("analysis", "")), TK_W // 2, 1452, 940, _font(34, bold=False), WHITE_TEXT, spacing=18)

    # Hashtags + URL
    _center(draw, TK_H - 152, str(data.get("hashtags", "#NBA #HoopIQ")), _font(26, bold=False), ORANGE, TK_W)
    _center(draw, TK_H - 106, "hoopiq-ai.com", _font(22, bold=False), GRAY_TEXT, TK_W)

    return img


def _draw_scene1(data: dict, photo) -> Image.Image:
    """Scène 1 — Reveal joueur : photo + nom + team (2.5s)"""
    img = Image.new("RGB", (TK_W, TK_H), BG_BASE)
    draw = ImageDraw.Draw(img)

    # Glow burst orange massif centré
    for r in range(900, 0, -10):
        t = r / 900
        alpha = (1 - t) * 0.55
        c = tuple(int(BG_BASE[i] + (ORANGE[i] - BG_BASE[i]) * alpha) for i in range(3))
        draw.ellipse([TK_W//2 - r, 860 - r//2, TK_W//2 + r, 860 + r//2], fill=c)

    # Lignes décoratives diagonales
    for i in range(-6, 20):
        x = i * 120
        draw.line([(x, 0), (x + 600, TK_H)], fill=(255, 92, 0, 18), width=1)

    # Bandes orange haut/bas épaissies
    for x in range(TK_W):
        t = x / (TK_W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        for y in range(18):
            draw.point((x, y), fill=c)
            draw.point((x, TK_H - 1 - y), fill=c)

    # Logo top
    draw.text((60, 50), "HOOP IQ", font=_font(48), fill=ORANGE)
    draw.text((62, 112), "@hoopiq_officiel", font=_font(26, bold=False), fill=GRAY_TEXT)

    # Cercle photo GRAND
    CX, CY, CR = TK_W // 2, 760, 210
    for r in range(CR + 34, CR + 2, -4):
        tg = (r - CR - 2) / 32
        cg = tuple(int(BG_BASE[i] + (ORANGE[i] - BG_BASE[i]) * (1 - tg) * 0.5) for i in range(3))
        draw.ellipse([CX - r, CY - r, CX + r, CY + r], outline=cg, width=3)
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], fill=(18, 6, 0))
    if photo:
        p = photo.resize((CR * 2, CR * 2), Image.LANCZOS)
        img.paste(p, (CX - CR, CY - CR), p.split()[3])
    else:
        initials = str(data.get("initials", "??"))[:2].upper()
        fi = _font(130)
        bb = draw.textbbox((0, 0), initials, font=fi)
        draw.text((CX - (bb[2]-bb[0])//2, CY - (bb[3]-bb[1])//2 - 12), initials, font=fi, fill=ORANGE)
    draw.ellipse([CX - CR, CY - CR, CX + CR, CY + CR], outline=ORANGE, width=7)

    # Badge ANALYSE IA
    bw = 260
    draw.rounded_rectangle([TK_W//2 - bw//2, 992, TK_W//2 + bw//2, 1044], radius=26, fill=ORANGE)
    bb = draw.textbbox((0, 0), "🤖 ANALYSE IA", font=_font(22))
    draw.text((TK_W//2 - (bb[2]-bb[0])//2, 1004), "🤖 ANALYSE IA", font=_font(22), fill=(255,255,255))

    # Nom joueur MASSIF
    player_name = str(data.get("player_name", "")).upper()
    fn = _font(90)
    while draw.textbbox((0,0), player_name, font=fn)[2] > TK_W - 80 and fn.size > 44:
        fn = _font(fn.size - 4)
    _center(draw, 1064, player_name, fn, WHITE_TEXT, TK_W)

    # Team · Position
    team_pos = f"{data.get('team','')}  ·  {data.get('position','')}".strip(" ·")
    _center(draw, fn.size + 1076, team_pos, _font(36, bold=False), GRAY_TEXT, TK_W)

    # CTA bas
    _center(draw, TK_H - 130, "hoopiq-ai.com 🔗", _font(30), ORANGE, TK_W)

    return img


def _draw_scene2(data: dict) -> Image.Image:
    """Scène 2 — Stats ÉNORMES en 2×2 (3s)"""
    img = Image.new("RGB", (TK_W, TK_H), BG_BASE)
    draw = ImageDraw.Draw(img)

    # Glow centré plus froid
    for r in range(700, 0, -10):
        t = r / 700
        c = (int(8 + (30 - 8) * (1-t)), int(8 + (20 - 8) * (1-t)), int(18 + (60 - 18) * (1-t)))
        draw.ellipse([TK_W//2 - r, TK_H//2 - r//2, TK_W//2 + r, TK_H//2 + r//2], fill=c)

    for x in range(TK_W):
        t = x / (TK_W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        for y in range(18):
            draw.point((x, y), fill=c)
            draw.point((x, TK_H - 1 - y), fill=c)

    # Header
    draw.text((60, 50), "HOOP IQ", font=_font(42), fill=ORANGE)
    player_short = str(data.get("player_name","")).upper()
    _center(draw, 56, player_short, _font(38, bold=False), GRAY_TEXT, TK_W)

    title = "SES STATS 📊"
    _center(draw, 180, title, _font(70), WHITE_TEXT, TK_W)
    bb = draw.textbbox((0,0), title, font=_font(70))
    tw = bb[2] - bb[0]
    draw.line([(TK_W//2 - tw//2, 262), (TK_W//2 + tw//2, 262)], fill=ORANGE, width=4)

    # Stats 2×2 GÉANTES
    CL, CR2 = TK_W // 4, TK_W * 3 // 4
    R1, R2 = 380, 860
    stats = [
        (str(data.get("pts","")), "PTS",  ORANGE,      CL,  R1),
        (str(data.get("ast","")), "AST",  BLUE_STAT,   CR2, R1),
        (str(data.get("reb","")), "REB",  GREEN_STAT,  CL,  R2),
        (f"{data.get('fg','')}%","FG%",  YELLOW_STAT, CR2, R2),
    ]
    fv = _font(160)
    fl = _font(44, bold=False)
    for val, lbl, color, sx, sy in stats:
        # Box colorée derrière le chiffre
        bw2, bh2 = 440, 200
        box_c = tuple(int(BG_BASE[i] + (color[i] - BG_BASE[i]) * 0.12) for i in range(3))
        draw.rounded_rectangle([sx - bw2//2, sy - 20, sx + bw2//2, sy + bh2], radius=24, fill=box_c,
                               outline=color, width=2)
        bb = draw.textbbox((0,0), val, font=fv)
        draw.text((sx - (bb[2]-bb[0])//2, sy), val, font=fv, fill=color)
        bb = draw.textbbox((0,0), lbl, font=fl)
        draw.text((sx - (bb[2]-bb[0])//2, sy + 168), lbl, font=fl, fill=color)

    # Croix centrale
    draw.line([(TK_W//2, R1 - 30), (TK_W//2, R2 + 210)], fill=GRAY_LINE, width=2)
    draw.line([(80, (R1+R2)//2 + 90), (TK_W-80, (R1+R2)//2 + 90)], fill=GRAY_LINE, width=2)

    _center(draw, TK_H - 130, "hoopiq-ai.com 🔗", _font(30), ORANGE, TK_W)
    return img


def _draw_scene3(data: dict) -> Image.Image:
    """Scène 3 — Score HoopIQ + analyse + CTA (2.5s)"""
    img = Image.new("RGB", (TK_W, TK_H), BG_BASE)
    draw = ImageDraw.Draw(img)

    # Glow doré
    for r in range(800, 0, -10):
        t = r / 800
        c = (int(8 + (40 - 8) * (1-t)), int(8 + (25 - 8) * (1-t)), int(18 + (8 - 18) * (1-t)))
        draw.ellipse([TK_W//2 - r, TK_H//2 - r//2, TK_W//2 + r, TK_H//2 + r//2], fill=c)

    for x in range(TK_W):
        t = x / (TK_W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        for y in range(18):
            draw.point((x, y), fill=c)
            draw.point((x, TK_H - 1 - y), fill=c)

    draw.text((60, 50), "HOOP IQ", font=_font(48), fill=ORANGE)
    draw.text((62, 112), "@hoopiq_officiel", font=_font(26, bold=False), fill=GRAY_TEXT)

    _center(draw, 240, "SCORE", _font(80), GRAY_TEXT, TK_W)
    _center(draw, 326, "HOOPIQ 🏀", _font(80), WHITE_TEXT, TK_W)
    draw.line([(200, 430), (TK_W-200, 430)], fill=ORANGE, width=3)

    # Ring score MASSIF
    score = str(data.get("score",""))
    SX, SY, SR = TK_W//2, 680, 160
    # Glow ring
    for r in range(SR + 30, SR - 2, -4):
        tg = (r - SR + 2) / 32
        cg = tuple(int(BG_BASE[i] + (ORANGE[i] - BG_BASE[i]) * (1-tg) * 0.6) for i in range(3))
        draw.ellipse([SX-r, SY-r, SX+r, SY+r], outline=cg, width=3)
    draw.ellipse([SX-SR, SY-SR, SX+SR, SY+SR], fill=BG_BASE, outline=ORANGE, width=8)
    fsc = _font(130)
    bb = draw.textbbox((0,0), score, font=fsc)
    draw.text((SX-(bb[2]-bb[0])//2, SY-(bb[3]-bb[1])//2-6), score, font=fsc, fill=ORANGE)
    _center(draw, SY + SR + 16, "/ 100", _font(36, bold=False), GRAY_TEXT, TK_W)

    # Analyse
    analysis = str(data.get("analysis",""))
    draw.line([(80, 900), (TK_W-80, 900)], fill=GRAY_LINE, width=1)
    _wrap(draw, f'"{analysis}"', TK_W//2, 930, 900, _font(40, bold=False), WHITE_TEXT, spacing=20)

    # CTA fort
    draw.line([(80, 1200), (TK_W-80, 1200)], fill=ORANGE, width=2)
    _center(draw, 1230, "🔥 REJOINS LA COMMUNAUTÉ", _font(44), ORANGE, TK_W)
    _center(draw, 1300, "hoopiq-ai.com", _font(50), WHITE_TEXT, TK_W)

    # Hashtags
    _center(draw, TK_H - 160, str(data.get("hashtags","#NBA #HoopIQ")), _font(28, bold=False), ORANGE, TK_W)

    return img


def _draw_scene4_card(data: dict, photo) -> Image.Image:
    """Scène 4 — Carte exclusive LÉGENDAIRE HoopIQ (trading card style)."""
    GOLD = (255, 215, 0)
    GOLD_SOFT = (255, 185, 50)
    img = Image.new("RGB", (TK_W, TK_H), (4, 4, 10))
    draw = ImageDraw.Draw(img)

    # Fond : particules dorées (points aléatoires simulés)
    rng = random.Random(42)
    for _ in range(320):
        px, py = rng.randint(0, TK_W), rng.randint(0, TK_H)
        r = rng.randint(1, 3)
        alpha = rng.uniform(0.15, 0.55)
        c = tuple(int(GOLD[i] * alpha) for i in range(3))
        draw.ellipse([px-r, py-r, px+r, py+r], fill=c)

    # Glow doré central derrière la carte
    for r in range(700, 0, -10):
        t = r / 700
        c = (int(20 * (1-t)), int(14 * (1-t)), int(2 * (1-t)))
        draw.ellipse([TK_W//2 - r, TK_H//2 - r//2, TK_W//2 + r, TK_H//2 + r//2], fill=c)

    # Bandes orange haut/bas
    for x in range(TK_W):
        t = x / (TK_W - 1)
        c = tuple(int(ORANGE[i] + (ORANGE_SOFT[i] - ORANGE[i]) * t) for i in range(3))
        for y in range(18):
            draw.point((x, y), fill=c)
            draw.point((x, TK_H - 1 - y), fill=c)

    # Header
    draw.text((60, 50), "HOOP IQ", font=_font(44), fill=ORANGE)
    draw.text((62, 108), "@hoopiq_officiel", font=_font(24, bold=False), fill=GRAY_TEXT)

    # Titre
    _center(draw, 188, "✨ CARTE EXCLUSIVE ✨", _font(52), GOLD, TK_W)
    draw.line([(120, 256), (TK_W-120, 256)], fill=GOLD, width=3)

    # ── La carte trading card ──────────────────────────────────────────────────
    CX = TK_W // 2
    CW, CH = 820, 1060
    CY_TOP = 290
    cx0, cy0 = CX - CW//2, CY_TOP
    cx1, cy1 = CX + CW//2, CY_TOP + CH

    # Ombre portée carte
    for off in range(20, 0, -2):
        t = off / 20
        sc = tuple(int(GOLD[i] * 0.18 * t) for i in range(3))
        draw.rounded_rectangle([cx0+off, cy0+off, cx1+off, cy1+off], radius=32, fill=sc)

    # Corps carte
    card_bg = (12, 10, 6)
    draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=32, fill=card_bg)

    # Bordure dorée dégradée (simulée avec plusieurs rectangles)
    for i, bw in enumerate([6, 4, 2]):
        shade = tuple(int(GOLD[j] * (1 - i * 0.25)) for j in range(3))
        draw.rounded_rectangle([cx0-i, cy0-i, cx1+i, cy1+i], radius=32+i, outline=shade, width=bw)

    # Gradient interne haut (warm glow)
    for y in range(200):
        t = y / 200
        c = (int(30*(1-t)), int(18*(1-t)), int(4*(1-t)))
        draw.line([(cx0+4, cy0+4+y), (cx1-4, cy0+4+y)], fill=c)

    # Badge LÉGENDAIRE
    bw2 = 300
    draw.rounded_rectangle([CX-bw2//2, cy0+18, CX+bw2//2, cy0+62], radius=22, fill=GOLD)
    bb = draw.textbbox((0,0), "⚡ LÉGENDAIRE", font=_font(22))
    draw.text((CX-(bb[2]-bb[0])//2, cy0+28), "⚡ LÉGENDAIRE", font=_font(22), fill=(10,6,0))

    # Photo joueur dans la carte
    PCX, PCY, PCR = CX, cy0 + 280, 170
    for r in range(PCR+18, PCR-2, -3):
        tg = (r - PCR + 2) / 20
        cg = tuple(int(card_bg[i] + (GOLD[i] - card_bg[i]) * (1-tg) * 0.5) for i in range(3))
        draw.ellipse([PCX-r, PCY-r, PCX+r, PCY+r], outline=cg, width=2)
    draw.ellipse([PCX-PCR, PCY-PCR, PCX+PCR, PCY+PCR], fill=(8, 6, 2))
    if photo:
        p = photo.resize((PCR*2, PCR*2), Image.LANCZOS)
        img.paste(p, (PCX-PCR, PCY-PCR), p.split()[3])
    else:
        initials = str(data.get("initials","??"))[:2].upper()
        fi = _font(110)
        bb = draw.textbbox((0,0), initials, font=fi)
        draw.text((PCX-(bb[2]-bb[0])//2, PCY-(bb[3]-bb[1])//2-8), initials, font=fi, fill=GOLD)
    draw.ellipse([PCX-PCR, PCY-PCR, PCX+PCR, PCY+PCR], outline=GOLD, width=6)

    # Nom joueur dans la carte
    player_name = str(data.get("player_name","")).upper()
    fn = _font(62)
    while draw.textbbox((0,0), player_name, font=fn)[2] > CW - 60 and fn.size > 30:
        fn = _font(fn.size - 4)
    _center(draw, PCY + PCR + 26, player_name, fn, WHITE_TEXT, TK_W)
    _center(draw, PCY + PCR + fn.size + 36, f"{data.get('team','')}  ·  {data.get('position','')}", _font(28, bold=False), GOLD_SOFT, TK_W)

    # Ligne séparatrice or
    sep_y = PCY + PCR + fn.size + 82
    draw.line([(cx0+40, sep_y), (cx1-40, sep_y)], fill=GOLD, width=2)

    # Stats dans la carte — 4 colonnes
    stats2 = [
        (str(data.get("pts","")), "PTS",  ORANGE,      cx0+110),
        (str(data.get("ast","")), "AST",  BLUE_STAT,   cx0+280),
        (str(data.get("reb","")), "REB",  GREEN_STAT,  cx0+450),
        (f"{data.get('fg','')}%","FG%",  GOLD,        cx0+620),
    ]
    fv2 = _font(58)
    fl2 = _font(22, bold=False)
    stat_y = sep_y + 22
    for val, lbl, color, sx in stats2:
        bb = draw.textbbox((0,0), val, font=fv2)
        draw.text((sx-(bb[2]-bb[0])//2, stat_y), val, font=fv2, fill=color)
        bb = draw.textbbox((0,0), lbl, font=fl2)
        draw.text((sx-(bb[2]-bb[0])//2, stat_y+64), lbl, font=fl2, fill=GRAY_TEXT)
    for sx in [cx0+195, cx0+365, cx0+535]:
        draw.line([(sx, stat_y+6), (sx, stat_y+80)], fill=GRAY_LINE, width=1)

    # Score HoopIQ compact dans la carte
    score = str(data.get("score",""))
    ssr_y = stat_y + 108
    draw.line([(cx0+40, ssr_y), (cx1-40, ssr_y)], fill=GRAY_LINE, width=1)
    _center(draw, ssr_y+14, f"SCORE HOOPIQ  {score}/100", _font(30), GOLD, TK_W)

    # Numéro de carte + watermark bas
    card_no = f"#{rng.randint(1,999):03d} / 999"
    _center(draw, cy1 - 54, card_no, _font(22, bold=False), GOLD_SOFT, TK_W)
    _center(draw, cy1 - 28, "ÉDITION LIMITÉE", _font(18, bold=False), GRAY_TEXT, TK_W)

    # CTA sous la carte
    cta_y = cy1 + 28
    _center(draw, cta_y, "🔥 Rejoins HoopIQ — ta carte t'attend", _font(34), ORANGE, TK_W)
    _center(draw, cta_y + 50, "hoopiq-ai.com", _font(40), WHITE_TEXT, TK_W)
    _center(draw, TK_H - 130, str(data.get("hashtags","#NBA #HoopIQ")), _font(24, bold=False), ORANGE, TK_W)

    return img


def _encode_scene(frame_path: Path, out_path: Path, duration: float, fps: int,
                  fade_in: float = 0.0, fade_out: float = 0.0, zoom_dir: str = "in") -> None:
    """Encode une scène image → MP4 avec zoom + fade via ffmpeg."""
    import subprocess as _sp
    d_frames = int(duration * fps)
    if zoom_dir == "in":
        z_expr = "min(zoom+0.0004,1.04)"
    elif zoom_dir == "out":
        z_expr = "max(zoom-0.0004,1.0)"
    else:
        z_expr = "1.02"

    vf = f"zoompan=z='{z_expr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d_frames}:s={TK_W}x{TK_H}:fps={fps}"
    if fade_in > 0:
        vf += f",fade=t=in:st=0:d={fade_in}"
    if fade_out > 0:
        vf += f",fade=t=out:st={duration - fade_out}:d={fade_out}"

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(fps), "-i", str(frame_path),
        "-vf", vf,
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "21",
        "-pix_fmt", "yuv420p",
        str(out_path),
    ]
    result = _sp.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode()[-600:])


def generate_tiktok_video(data: dict = None) -> Path:
    """
    Génère un MP4 1080×1920 TikTok en 3 scènes dynamiques + beat.
    Scène 1 (2.5s) : Reveal joueur  |  Scène 2 (3s) : Stats  |  Scène 3 (2.5s) : Score CTA
    Usage : python lucie.py --tiktok
    """
    import subprocess as _sp
    import tempfile

    if data is None:
        print("📝 Génération data joueur via Groq...")
        data = _fetch_tiktok_player_data()

    TIKTOK_DIR.mkdir(parents=True, exist_ok=True)

    photo = fetch_player_photo(str(data.get("player_name", "")), diameter=420)

    print("🎨 Rendu des 4 scènes...")
    s1 = _draw_scene1(data, photo)
    s2 = _draw_scene2(data)
    s3 = _draw_scene3(data)
    s4 = _draw_scene4_card(data, photo)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        s1.save(str(tmp / "s1.png"))
        s2.save(str(tmp / "s2.png"))
        s3.save(str(tmp / "s3.png"))
        s4.save(str(tmp / "s4.png"))

        print("🎬 Encodage scène 1/4 (reveal joueur)...")
        _encode_scene(tmp/"s1.png", tmp/"c1.mp4", 7.0, 30, fade_in=0.5, zoom_dir="in")
        print("🎬 Encodage scène 2/4 (stats)...")
        _encode_scene(tmp/"s2.png", tmp/"c2.mp4", 8.0, 30, fade_in=0.15, zoom_dir="hold")
        print("🎬 Encodage scène 3/4 (score + CTA)...")
        _encode_scene(tmp/"s3.png", tmp/"c3.mp4", 6.0, 30, zoom_dir="out")
        print("🎬 Encodage scène 4/4 (carte exclusive)...")
        _encode_scene(tmp/"s4.png", tmp/"c4.mp4", 9.0, 30, fade_in=0.3, fade_out=0.7, zoom_dir="in")

        # Concat les 4 clips
        concat_txt = tmp / "concat.txt"
        concat_txt.write_text(
            f"file '{tmp/'c1.mp4'}'\nfile '{tmp/'c2.mp4'}'\nfile '{tmp/'c3.mp4'}'\nfile '{tmp/'c4.mp4'}'\n"
        )
        silent_mp4 = tmp / "silent.mp4"
        _sp.check_call([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_txt),
            "-c", "copy", str(silent_mp4),
        ], stdout=_sp.DEVNULL, stderr=_sp.DEVNULL)

        # Ajout beat
        music_files = list(MUSIC_DIR.glob("*.mp3")) + list(MUSIC_DIR.glob("*.m4a"))
        music_path = random.choice(music_files) if music_files else None

        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        slug = str(data.get("player_name","stat")).lower().replace(" ","_").replace(".","")
        out_path = TIKTOK_DIR / f"hoopiq_{slug}_{ts}.mp4"

        if music_path:
            print(f"🎵 Beat : {music_path.name[:60]}")
            result = _sp.run([
                "ffmpeg", "-y",
                "-i", str(silent_mp4),
                "-i", str(music_path),
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                "-af", "afade=t=in:st=0:d=0.4,afade=t=out:st=29:d=1.0",
                "-shortest", str(out_path),
            ], capture_output=True)
            if result.returncode != 0:
                print("⚠️  Erreur audio, vidéo sans son")
                import shutil; shutil.copy(str(silent_mp4), str(out_path))
        else:
            print("⚠️  Aucun beat — vidéo muette")
            import shutil; shutil.copy(str(silent_mp4), str(out_path))

        print(f"✅ TikTok prêt : {out_path}")
        return out_path


def post_reel_to_instagram(video_path: Path, caption: str = "") -> bool:
    """Publie la vidéo TikTok comme Reel Instagram via instagrapi."""
    try:
        from instagrapi import Client
    except ImportError:
        print("❌ instagrapi non installé → pip install instagrapi")
        return False

    cl = Client()
    session_file = Path(__file__).parent / "ig_session.json"
    print(f"🔐 Connexion Instagram @{IG_USERNAME}...")
    try:
        if session_file.exists():
            cl.load_settings(session_file)
            cl.login(IG_USERNAME, IG_PASSWORD)
        else:
            cl.login(IG_USERNAME, IG_PASSWORD)
        cl.dump_settings(session_file)
    except Exception as e:
        print(f"❌ Connexion Instagram échouée : {e}")
        return False

    cl.delay_range = [2, 5]
    print("📤 Publication Reel Instagram...")
    try:
        media = cl.clip_upload(video_path, caption=caption)
        print(f"✅ Reel publié ! https://www.instagram.com/p/{media.code}/")
        return True
    except Exception as e:
        print(f"❌ Erreur Reel Instagram : {e}")
        return False


def post_to_tiktok(video_path: Path, caption: str = "") -> bool:
    """
    Publication automatique TikTok via tiktok-uploader (Playwright/Chromium).

    Setup (une seule fois) :
      1. pip install tiktok-uploader
      2. Installe l'extension "Get cookies.txt LOCALLY" dans Chrome
      3. Connecte-toi à TikTok sur Chrome
      4. Clique sur l'extension → exporte → sauvegarde dans hoopiq/cookies/tiktok_cookies.txt
      5. Relance : python lucie.py --tiktok --post

    Note : TikTok bloque les comptes qui postent trop vite. Max 1 vidéo / 24h recommandé.
    """
    try:
        from tiktok_uploader.upload import upload_video
    except ImportError:
        print("❌ tiktok-uploader non installé → pip install tiktok-uploader")
        return False

    cookies_path = Path(__file__).parent / "cookies" / "tiktok_cookies.txt"
    if not cookies_path.exists():
        print(f"❌ Cookies TikTok manquants : {cookies_path}")
        print("   → Voir la doc dans post_to_tiktok() pour le setup.")
        return False

    try:
        upload_video(
            str(video_path),
            description=caption or "🏀 Stat du jour | Analyse IA #NBA #HoopIQ #Basketball #TikTok",
            cookies=str(cookies_path),
            headless=True,
        )
        print("✅ Vidéo publiée sur TikTok @hoopiq_officiel !")
        return True
    except Exception as e:
        print(f"❌ Erreur TikTok upload : {e}")
        return False


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  🏀 LUCIE — HoopIQ Instagram Bot")
    print(f"  {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 55)

    # ── Mode TikTok / Both ─────────────────────────────────────────────────────
    if "--tiktok" in sys.argv or "--both" in sys.argv:
        mode = "--both" if "--both" in sys.argv else "--tiktok"
        print(f"\n🎬 Mode {'TikTok + Instagram Reels' if mode == '--both' else 'TikTok'} activé")
        video_path = generate_tiktok_video()

        if "--post" in sys.argv or mode == "--both":
            name = Path(video_path).stem.replace("hoopiq_", "").replace("_", " ").title()
            caption_tt = (
                f"🏀 {name} — Analyse IA HoopIQ\n"
                "#NBA #HoopIQ #Basketball #TikTok #NBAFrance #Stats"
            )
            caption_ig = (
                f"🏀 {name} — Analyse IA HoopIQ 🤖\n\n"
                f"Stats, carte exclusive & score HoopIQ 🔥\n"
                f"👉 Lien en bio — hoopiq-ai.com\n\n"
                "#NBA #HoopIQ #Basketball #NBAFrance #Reels #Stats"
            )
            print("\n📱 Publication TikTok...")
            post_to_tiktok(video_path, caption_tt)
            if mode == "--both":
                print("\n📸 Publication Instagram Reel...")
                post_reel_to_instagram(video_path, caption_ig)
        else:
            print(f"\n💡 Pour poster :")
            print(f"   TikTok seulement  → python lucie.py --tiktok --post")
            print(f"   TikTok + Instagram → python lucie.py --both")
        print("\n✅ Terminé ! Check tiktok_ready/ 🎬")
        return

    # ── Mode Instagram (comportement par défaut) ───────────────────────────────
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
