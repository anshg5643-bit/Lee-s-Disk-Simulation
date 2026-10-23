# MAIT Virtual Thermal Lab — Integrated Prototype

A Flask-backed virtual practical for determining the thermal conductivity of a bad conductor using Lee's disc method. This version retains the attached project's interface, simulation workflow, MediaPipe hand controls, and Monika voice assistant while adding server-side accounts and saved experiment history.

## Features
- Flask routes and SQLite database
- Server-side signup/sign-in with Werkzeug password hashing and session-based access control
- Per-account experiment result storage, including selected parameters and cooling readings
- Lee's-disc simulation, cooling curve slope estimate, and calculated thermal conductivity
- Optional webcam pinch gestures using MediaPipe Tasks Vision (requires browser camera permission and HTTPS or localhost)
- Monika educational Q&A with browser speech recognition/text-to-speech where supported
- Dedicated dashboard, experiment explanation, guidelines, apparatus, simulation, assistant, and saved-results pages
- Synthetic simulation data is explicitly labelled and is not presented as physical measurement

## Run on Windows
1. Extract this ZIP.
2. Open a terminal in the extracted `MAIT_Virtual_Thermal_Lab_Integrated` folder.
3. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

4. Install requirements and start the app:

   ```powershell
   python -m pip install -r requirements.txt
   python app.py
   ```

5. Open `http://127.0.0.1:5000` and create an account.

## Data and security notes
- Accounts and experiment results are stored in `mait_lab.db` in this project folder. Keep this file private if it contains personal data.
- Passwords are stored as hashes, not plaintext. Set a strong `SECRET_KEY` environment variable before deployment.
- Google sign-in verifies Google Identity Services ID tokens server-side. Only the public client ID is stored in `api_keys.txt`; no client secret is used.
- Before public deployment, use HTTPS, set `SECRET_KEY`, configure secure cookie settings, add CSRF protection/rate limiting, and review privacy/data-retention requirements.
- The simulator produces **synthetic teaching data**. The calculated value of k is a demonstration estimate, not a validated experimental measurement.

## Hand controls and voice features
Camera-based hand tracking requires a modern browser, camera permission, and network access to load the MediaPipe library/model. Monika's voice features depend on browser support for Web Speech APIs. Standard mouse/touch controls remain available.

## v2 — Holo-lab, walking Monika and full voice access
- **Monika** is now a walking robot that patrols the bottom of every page (`static/assets/monika.js`). Click her or press **Alt+M** for hands-free one-on-one voice conversation (Chrome/Edge). She remembers your name, handles follow-ups ("more", "repeat"), and speaks aloud.
- **Voice everywhere:** "open simulation / apparatus / guidelines / results", "sign out", "read this page", "enter email name at gmail dot com", "submit" (works on sign-in/register).
- **Voice-operated lab:** "start heater", "capture readings", "remove chamber", "set thickness to 4", "use ebonite", "status", "reset", "enable hand tracking".
- **Futuristic holo-lab** with webcam overlay, neon hand skeleton, hand bounding box and confidence, pinch ring, fingertip trail and FPS readout. Hold a pinch ~0.65 s over a glowing target, or pinch the steam chamber and lift it. Mouse/touch and buttons always work.
- Run as before: `python app.py`, open http://127.0.0.1:5000 (camera and microphone need localhost or HTTPS).

## Site-wide futuristic UI, hands-free Monika and hand-camera guide
- All pages use the holo-lab dark navy / cyan / magenta visual system, with the simulation retaining its specialised holographic bench design.
- Monika's microphone now toggles persistent hands-free voice mode. After activation she automatically resumes listening after each spoken response; use **Stop listening**, the microphone toggle, or **Alt+M** to turn voice mode off. Chrome/Edge speech recognition support and microphone permission are required. Browsers may suspend recognition when the tab is backgrounded.
- The new **Hand-cam guide** page explains camera permissions, camera placement, pinch gestures, target actions, and common fixes. Find it in the navigation bar.

## Google sign-in using only a client ID
1. In Google Cloud Console, create a **Web application** OAuth client ID.
2. Add `http://localhost:5000` and `http://127.0.0.1:5000` as authorised JavaScript origins.
3. Put the public client ID in `api_keys.txt` as `GOOGLE_CLIENT_ID=...`. The file intentionally contains no client secret.
4. Install dependencies with `python -m pip install -r requirements.txt`, then restart `python app.py`.

Google sign-in uses Google Identity Services to obtain an ID token and verifies that token on the server with `google-auth`. Keep `api_keys.txt` out of public Git repositories. Set `SECRET_KEY` as an environment variable for deployments; the development fallback is randomly generated and will invalidate sessions when the app restarts.
