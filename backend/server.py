# py -m venv venv | python3 -m venv venv - create virtual env
# venv\Scripts\activate | source venv/bin/activate - activate virtual env
# pip install -r requirements.txt

from flask import Flask, request, jsonify
from sqlalchemy import String, Enum, Text, Integer, select, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey, DateTime, func
from marshmallow import ValidationError, fields
from flask_marshmallow import Marshmallow
from flask_cors import CORS

import os
import re
from datetime import timedelta, datetime

from dotenv import load_dotenv
import httpx

from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash


# -------------------- App & Config --------------------

app = Flask(__name__)
CORS(app)

# Load env BEFORE reading any env vars
load_dotenv()

# DB: read from env (IMPORTANT: encode '#' as %23 in .env)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///app.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)


# -------------------- SQLAlchemy Base --------------------

class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)
db.init_app(app)
ma = Marshmallow(app)


# -------------------- Models --------------------

class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    alias: Mapped[str] = mapped_column(String(100), nullable=True)
    alignment: Mapped[str] = mapped_column(Enum('hero', 'villain', name="alignment_enum"), nullable=True)
    powers: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TeamMember(Base):
    __tablename__ = "team_members"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    # Keeping legacy field name so you do not have to change existing DB/table usage yet.
    marvel_id: Mapped[int] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# -------------------- Schemas --------------------

class CharacterSchema(ma.Schema):
    id = fields.Raw(required=False)
    name = fields.String(required=True)
    alias = fields.String(required=False, allow_none=True)
    alignment = fields.String(required=False, allow_none=True)
    powers = fields.String(required=False, allow_none=True)
    image_url = fields.String(required=False, allow_none=True)

    class Meta:
        fields = ("id", "name", "alias", "alignment", "powers", "image_url")


character_schema = CharacterSchema()
characters_schema = CharacterSchema(many=True)


class UserSchema(ma.Schema):
    id = fields.Int()
    email = fields.Email()

    class Meta:
        fields = ("id", "email")


user_schema = UserSchema()


class TeamMemberSchema(ma.Schema):
    id = fields.Int()
    user_id = fields.Int()
    marvel_id = fields.Int(allow_none=True)
    name = fields.Str(required=True)
    role = fields.Str(allow_none=True)
    image_url = fields.Str(allow_none=True)
    created_at = fields.DateTime(allow_none=True)

    class Meta:
        fields = ("id", "user_id", "marvel_id", "name", "role", "image_url", "created_at")


team_member_schema = TeamMemberSchema()
team_members_schema = TeamMemberSchema(many=True)


# -------------------- DB bootstrap --------------------

def create_database():
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    if db_url.startswith("sqlite"):
        return

    root_url = db_url.rsplit('/', 1)[0]
    db_name = db_url.rsplit('/', 1)[-1]
    engine = create_engine(root_url)

    with engine.connect() as connection:
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))


with app.app_context():
    create_database()
    db.create_all()


# -------------------- Health --------------------

@app.get("/api/health")
def health():
    return {"ok": True, "api": "superhero"}


# -------------------- Local CRUD (characters table) --------------------

@app.get('/characters-db')
def get_characters_db():
    query = select(Character)
    characters = db.session.execute(query).scalars().all()
    return characters_schema.jsonify(characters), 200


@app.get('/characters-db/<int:id>')
def get_character_db(id):
    character = db.session.get(Character, id)
    if not character:
        return jsonify({"error": "Character not found"}), 404
    return character_schema.jsonify(character), 200


@app.post('/characters-db')
def create_character_db():
    try:
        character_data = character_schema.load(request.json or {})
    except ValidationError as e:
        return jsonify(e.messages), 400

    new_character = Character(**character_data)
    db.session.add(new_character)
    db.session.commit()
    return character_schema.jsonify(new_character), 201


@app.put('/characters-db/<int:id>')
def update_character_db(id):
    character = db.session.get(Character, id)
    if not character:
        return jsonify({"message": "Invalid character id"}), 400

    try:
        character_data = character_schema.load(request.json or {})
    except ValidationError as e:
        return jsonify(e.messages), 400

    for key, value in character_data.items():
        setattr(character, key, value)

    db.session.commit()
    return character_schema.jsonify(character), 200


@app.delete('/characters-db/<int:id>')
def delete_character_db(id):
    character = db.session.get(Character, id)
    if not character:
        return jsonify({"message": "Invalid character id"}), 400

    db.session.delete(character)
    db.session.commit()
    return jsonify({"message": "Character successfully deleted"}), 200


# -------------------- Auth --------------------

@app.post("/auth/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    existing = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    u = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(u)
    db.session.commit()

    token = create_access_token(identity=u.id)
    return jsonify({"token": token, "user": user_schema.dump(u)}), 201


@app.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    u = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not u or not check_password_hash(u.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=u.id)
    return jsonify({"token": token, "user": user_schema.dump(u)}), 200


@app.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    u = db.session.get(User, uid)
    return user_schema.jsonify(u), 200


# -------------------- SuperHero API Integration --------------------

SUPERHERO_TOKEN = os.getenv("SUPERHERO_TOKEN")
SUPERHERO_BASE = f"https://www.superheroapi.com/api.php/{SUPERHERO_TOKEN}" if SUPERHERO_TOKEN else None
DEFAULT_CHARACTER_NAMES = [
    "spider",
    "iron man",
    "thor",
    "hulk",
    "loki",
    "black widow",
    "doctor strange",
    "captain america",
    "thanos",
    "wolverine",
    "deadpool",
    "storm",
]


def normalize_alignment(value):
    value = (value or "").strip().lower()
    if value in {"good", "hero"}:
        return "hero"
    if value in {"bad", "villain"}:
        return "villain"
    return None


def build_powers_string(powerstats):
    if not isinstance(powerstats, dict):
        return None

    parts = []
    for key, value in powerstats.items():
        if value and value != "null" and value != "-":
            pretty_key = key.replace("-", " ").title()
            parts.append(f"{pretty_key}: {value}")

    return ", ".join(parts) if parts else None


def map_superhero_character(item):
    biography = item.get("biography") or {}
    image = item.get("image") or {}

    return {
        # Prefix API ids to avoid collisions with your local DB ids.
        "id": f"api-{item.get('id')}",
        "name": item.get("name"),
        "alias": biography.get("full-name") or None,
        "alignment": normalize_alignment(biography.get("alignment")),
        "powers": build_powers_string(item.get("powerstats") or {}),
        "image_url": image.get("url"),
        "description": (
            f"Publisher: {biography.get('publisher') or 'Unknown'} | "
            f"First appearance: {biography.get('first-appearance') or 'Unknown'}"
        ),
    }


def get_local_characters(q, limit, offset):
    query = select(Character)

    if q:
        query = query.where(Character.name.ilike(f"%{q}%"))

    total_query = select(func.count()).select_from(query.subquery())
    total = db.session.execute(total_query).scalar_one()

    paged_query = query.order_by(Character.name).offset(offset).limit(limit)
    rows = db.session.execute(paged_query).scalars().all()

    items = []
    for c in rows:
        items.append({
            "id": c.id,
            "name": c.name,
            "alias": c.alias,
            "alignment": c.alignment,
            "powers": c.powers,
            "image_url": c.image_url,
            "description": "Loaded from local database",
        })

    return {
        "results": items,
        "total": total,
        "count": len(items),
        "limit": limit,
        "offset": offset,
    }


def paginate_items(items, limit, offset):
    total = len(items)
    sliced = items[offset: offset + limit]
    return {
        "results": sliced,
        "total": total,
        "count": len(sliced),
        "limit": limit,
        "offset": offset,
    }


def ensure_superhero_api_configured():
    if not SUPERHERO_TOKEN or not SUPERHERO_BASE:
        raise RuntimeError("SUPERHERO_TOKEN is missing. Add it to your .env file.")


def search_superhero_api(q):
    ensure_superhero_api_configured()

    with httpx.Client(timeout=15.0) as client:
        r = client.get(f"{SUPERHERO_BASE}/search/{q}")
        r.raise_for_status()
        data = r.json()

    if data.get("response") != "success":
        return []

    return [map_superhero_character(item) for item in data.get("results", [])]


def fetch_superhero_by_id(raw_id):
    ensure_superhero_api_configured()

    with httpx.Client(timeout=15.0) as client:
        r = client.get(f"{SUPERHERO_BASE}/{raw_id}")
        r.raise_for_status()
        data = r.json()

    if data.get("response") != "success":
        return None

    return map_superhero_character(data)


def fetch_default_superhero_results():
    ensure_superhero_api_configured()

    results = []
    seen = set()

    with httpx.Client(timeout=15.0) as client:
        for name in DEFAULT_CHARACTER_NAMES:
            print("SEARCHING FOR:", name)
            r = client.get(f"{SUPERHERO_BASE}/search/{name}")
            print("STATUS:", r.status_code)
            print("BODY:", r.text[:300])

            if r.status_code != 200:
                continue

            data = r.json()
            print("PARSED RESPONSE:", data)

            if data.get("response") != "success":
                continue
            if r.status_code != 200:
                continue

            data = r.json()
            if data.get("response") != "success":
                continue

            # Pick the closest exact-name match first.
            candidates = data.get("results", [])
            chosen = None

            for candidate in candidates:
                if (candidate.get("name") or "").strip().lower() == name.lower():
                    chosen = candidate
                    break

            if not chosen and candidates:
                chosen = candidates[0]

            if not chosen:
                continue

            raw_id = chosen.get("id")
            if raw_id in seen:
                continue

            seen.add(raw_id)
            results.append(map_superhero_character(chosen))

    return results


@app.get("/api/characters")
def superhero_characters():
    q = request.args.get("q", "").strip()
    limit = min(int(request.args.get("limit", 24)), 100)
    offset = max(int(request.args.get("offset", 0)), 0)

    try:
        if q:
            api_results = search_superhero_api(q)
        else:
            api_results = fetch_default_superhero_results()

        payload = paginate_items(api_results, limit, offset)
        return jsonify(payload), 200

    except Exception as e:
        print("SuperHero API error:", repr(e))

        try:
            fallback_data = get_local_characters(q, limit, offset)
            fallback_data["error"] = "SuperHero API is temporarily unavailable. Showing local database data."
            return jsonify(fallback_data), 200
        except Exception as fallback_error:
            print("LOCAL FALLBACK ERROR:", repr(fallback_error))
            return jsonify({"error": f"Fallback failed: {str(fallback_error)}"}), 500


@app.get("/api/characters/<cid>")
def superhero_character_detail(cid):
    # Local DB ids remain plain integers in the URL.
    if cid.isdigit():
        local_character = db.session.get(Character, int(cid))
        if local_character:
            return jsonify({
                "id": local_character.id,
                "name": local_character.name,
                "alias": local_character.alias,
                "alignment": local_character.alignment,
                "powers": local_character.powers,
                "image_url": local_character.image_url,
                "description": "Loaded from local database",
            }), 200

    # API ids are returned like api-70
    raw_api_id = cid.replace("api-", "").strip()

    try:
        item = fetch_superhero_by_id(raw_api_id)
        if not item:
            return jsonify({"error": "Not found"}), 404
        return jsonify(item), 200
    except httpx.HTTPStatusError as e:
        return jsonify({
            "error": "SuperHero API HTTP error",
            "status": e.response.status_code,
            "body": e.response.text[:500],
        }), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- Run --------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
