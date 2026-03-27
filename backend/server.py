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

import os, time, hashlib, re
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
    'DATABASE_URL', 'sqlite:///app.db'   # safe fallback for Render
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
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)


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
    marvel_id: Mapped[int] = mapped_column(Integer, nullable=True)  # for imported Marvel chars
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=True)    # "Tank", "Healer", etc
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# -------------------- Schemas --------------------

class CharacterSchema(ma.Schema):
    id = fields.Int(required=False)
    name = fields.String(required=True)
    alias = fields.String(required=False)
    alignment = fields.String(required=False)
    powers = fields.String(required=False)
    image_url = fields.String(required=False)

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
        return  # SQLite has no CREATE DATABASE

    # For MySQL URLs: create the DB if missing
    root_url = db_url.rsplit('/', 1)[0]  # strip the db name
    engine = create_engine(root_url)
    with engine.connect() as connection:
        connection.execute(text("CREATE DATABASE IF NOT EXISTS marvel"))


with app.app_context():
    create_database()
    db.create_all()


# -------------------- Health --------------------

@app.get("/api/health")
def health():
    return {"ok": True}


# -------------------- Local CRUD (characters table) --------------------

@app.get('/characters-db')
def get_characters_db():
    query = select(Character)
    characters = db.session.execute(query).scalars().all()
    return characters_schema.jsonify(characters), 200

@app.get('/characters-db/<int:id>')
def get_character_db(id):
    character = db.session.get(Character, id)
    return character_schema.jsonify(character), 200

@app.post('/characters-db')
def create_character_db():
    try:
        character_data = character_schema.load(request.json)
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
        character_data = character_schema.load(request.json)
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


# -------------------- Marvel API Integration --------------------

MARVEL_BASE = "https://gateway.marvel.com/v1/public"
PUB = os.getenv("MARVEL_PUBLIC_KEY")
PRV = os.getenv("MARVEL_PRIVATE_KEY")

def marvel_auth():
    print("PUBLIC KEY:", PUB)
    print("PRIVATE KEY EXISTS:", bool(PRV))

    if not PUB or not PRV:
        raise RuntimeError("Marvel API keys missing (check .env and load_dotenv())")

    ts = str(time.time())
    h = hashlib.md5((ts + PRV + PUB).encode("utf-8")).hexdigest()
    return {"ts": ts, "apikey": PUB, "hash": h}

def map_character(m):
    t = m.get("thumbnail") or {}
    img = f"{t.get('path')}.{t.get('extension')}" if t else None
    return {
        "id": m["id"],
        "name": m.get("name"),
        "alias": None,
        "alignment": None,
        "powers": None,
        "image_url": img,
        "description": (m.get("description") or "").strip(),
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
            "description": "Loaded from local fallback database"
        })

    return {
        "results": items,
        "total": total,
        "count": len(items),
        "limit": limit,
        "offset": offset
    }

@app.get("/api/characters")
def marvel_characters():
    q = request.args.get("q", "").strip()
    limit = min(int(request.args.get("limit", 24)), 100)
    offset = int(request.args.get("offset", 0))

    try:
        params = {"limit": limit, "offset": offset, **marvel_auth()}
        if q:
            params["nameStartsWith"] = q

        with httpx.Client(timeout=15.0) as client:
            r = client.get(f"{MARVEL_BASE}/characters", params=params)

            print("MARVEL STATUS:", r.status_code)
            print("MARVEL RESPONSE:", r.text[:300])

            r.raise_for_status()
            d = r.json()["data"]
            items = [map_character(x) for x in d["results"]]

            return jsonify({
                "results": items,
                "total": d["total"],
                "count": d["count"],
                "limit": d["limit"],
                "offset": d["offset"]
            })

    except httpx.HTTPStatusError as e:
        print("Marvel upstream error:", e.response.status_code, e.response.text[:500])
        fallback_data = get_local_characters(q, limit, offset)
        fallback_data["error"] = "Marvel API is temporarily unavailable. Showing local fallback data."
        return jsonify(fallback_data), 200

    except Exception as e:
        print("Unexpected /api/characters error:", repr(e))
        fallback_data = get_local_characters(q, limit, offset)
        fallback_data["error"] = "Unexpected Marvel error. Showing local fallback data."
        return jsonify(fallback_data), 200

@app.get("/api/characters/<int:cid>")
def marvel_character_detail(cid):
    try:
        params = marvel_auth()
        with httpx.Client(timeout=15.0) as client:
            r = client.get(f"{MARVEL_BASE}/characters/{cid}", params=params)
            r.raise_for_status()
            d = r.json()["data"]["results"]
            if not d:
                return jsonify({"error": "Not found"}), 404
            return jsonify(map_character(d[0]))
    except httpx.HTTPStatusError as e:
        return jsonify({"error": "Marvel HTTP error",
                        "status": e.response.status_code,
                        "body": e.response.text[:500]}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- Run --------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)