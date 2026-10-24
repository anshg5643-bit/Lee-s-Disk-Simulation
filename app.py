from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from pathlib import Path
import sqlite3, os, json, secrets

try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
except ImportError:
    id_token = None
    google_requests = None

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=str(BASE_DIR / 'templates'), static_folder=str(BASE_DIR / 'static'))
app.jinja_env.filters['from_json'] = json.loads
# Only the public Google OAuth client ID is stored in api_keys.txt. Never store secrets there.
KEY_FILE = BASE_DIR / 'api_keys.txt'
def read_public_config():
    values = {}
    if KEY_FILE.exists():
        for line in KEY_FILE.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                values[key.strip()] = value.strip()
    return values

PUBLIC_CONFIG = read_public_config()
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', PUBLIC_CONFIG.get('GOOGLE_CLIENT_ID', ''))
app.secret_key = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax')
DB_PATH = BASE_DIR / 'mait_lab.db'


def connect_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with connect_db() as con:
        con.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )''')
        con.execute('''CREATE TABLE IF NOT EXISTS experiment_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            material TEXT NOT NULL,
            thermal_conductivity REAL,
            parameters_json TEXT NOT NULL,
            readings_json TEXT NOT NULL,
            data_type TEXT NOT NULL DEFAULT 'synthetic simulation',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')

init_db()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return redirect(url_for('login'))
        return fn(*args, **kwargs)
    return wrapper


@app.route('/')
def index():
    return redirect(url_for('dashboard') if session.get('user_id') else url_for('login'))


@app.route('/login.html', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('user_id'):
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        with connect_db() as con:
            user = con.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user and check_password_hash(user['password_hash'], password):
            session.clear()
            session.update(user_id=user['id'], name=user['name'], email=user['email'])
            return redirect(url_for('dashboard'))
        flash('Email or password is incorrect.', 'error')
    return render_template('login.html', google_client_id=GOOGLE_CLIENT_ID)


@app.route('/register.html', methods=['GET', 'POST'])
@app.route('/register', methods=['GET', 'POST'])
def register():
    if session.get('user_id'):
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        if not name or not email or len(password) < 8:
            flash('Enter your name, a valid email, and a password of at least 8 characters.', 'error')
        else:
            try:
                with connect_db() as con:
                    cur = con.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',
                                      (name, email, generate_password_hash(password)))
                    user_id = cur.lastrowid
                session.clear()
                session.update(user_id=user_id, name=name, email=email)
                return redirect(url_for('dashboard'))
            except sqlite3.IntegrityError:
                flash('An account with that email already exists. Please sign in instead.', 'error')
    return render_template('register.html', google_client_id=GOOGLE_CLIENT_ID)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/dashboard.html')
@login_required
def dashboard():
    with connect_db() as con:
        count = con.execute('SELECT COUNT(*) AS n FROM experiment_results WHERE user_id=?', (session['user_id'],)).fetchone()['n']
    return render_template('dashboard.html', result_count=count)


@app.route('/explanation.html')
@login_required
def explanation():
    return render_template('explanation.html')


@app.route('/guidelines.html')
@login_required
def guidelines():
    return render_template('guidelines.html')


@app.route('/apparatus.html')
@login_required
def apparatus():
    return render_template('apparatus.html')


@app.route('/handcam.html')
@login_required
def handcam():
    return render_template('handcam.html')


@app.route('/simulation.html')
@login_required
def simulation():
    return render_template('simulation.html')


@app.route('/assistant.html')
@login_required
def assistant():
    return render_template('assistant.html')


@app.route('/results.html')
@login_required
def results():
    with connect_db() as con:
        rows = con.execute('SELECT * FROM experiment_results WHERE user_id=? ORDER BY id DESC', (session['user_id'],)).fetchall()
    return render_template('results.html', results=rows)


@app.route('/api/save-result', methods=['POST'])
@login_required
def save_result():
    data = request.get_json(silent=True) or {}
    try:
        material = str(data.get('material', 'Unknown'))[:80]
        k_value = float(data.get('thermal_conductivity'))
        if not (k_value >= 0 and k_value < 1e6):
            raise ValueError
        parameters = data.get('parameters', {})
        readings = data.get('readings', [])
        if not isinstance(parameters, dict) or not isinstance(readings, list):
            return jsonify(ok=False, message='Invalid parameters or readings.'), 400
        with connect_db() as con:
            cur = con.execute('''INSERT INTO experiment_results
                (user_id, material, thermal_conductivity, parameters_json, readings_json, data_type)
                VALUES (?, ?, ?, ?, ?, 'synthetic simulation')''',
                (session['user_id'], material, k_value, json.dumps(parameters), json.dumps(readings)))
            result_id = cur.lastrowid
        return jsonify(ok=True, id=result_id, message='Synthetic simulation result saved to your account.')
    except (TypeError, ValueError):
        return jsonify(ok=False, message='A valid calculated thermal conductivity is required.'), 400


@app.route('/api/results')
@login_required
def api_results():
    with connect_db() as con:
        rows = con.execute('SELECT id, material, thermal_conductivity, parameters_json, readings_json, data_type, created_at FROM experiment_results WHERE user_id=? ORDER BY id DESC', (session['user_id'],)).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route('/google-login', methods=['POST'])
def google_login():
    if not GOOGLE_CLIENT_ID or id_token is None or google_requests is None:
        return jsonify(ok=False, message='Google sign-in is not configured. Add your Google client ID to api_keys.txt and install requirements.'), 503
    payload = request.get_json(silent=True) or {}
    credential = payload.get('credential', '')
    if not credential:
        return jsonify(ok=False, message='Google did not return a credential.'), 400
    try:
        identity = id_token.verify_oauth2_token(credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = (identity.get('email') or '').strip().lower()
        name = (identity.get('name') or email.split('@')[0] or 'Student').strip()[:120]
        if not email or not identity.get('email_verified'):
            return jsonify(ok=False, message='Google email could not be verified.'), 401
        with connect_db() as con:
            user = con.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
            if user is None:
                cur = con.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',
                                  (name, email, generate_password_hash(secrets.token_urlsafe(32))))
                user_id = cur.lastrowid
            else:
                user_id = user['id']
                if user['name'] != name:
                    con.execute('UPDATE users SET name=? WHERE id=?', (name, user_id))
        session.clear()
        session.update(user_id=user_id, name=name, email=email)
        return jsonify(ok=True, redirect=url_for('dashboard'))
    except ValueError:
        return jsonify(ok=False, message='Google credential is invalid or expired.'), 401
    except Exception:
        app.logger.exception('Google sign-in verification failed')
        return jsonify(ok=False, message='Google sign-in failed. Please use email and password or try again.'), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG') == '1')
