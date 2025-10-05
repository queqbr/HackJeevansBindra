# PlantHelper - Local Inference Server

This file explains how to run a minimal FastAPI server included in this repo (`server.py`) that accepts image uploads and returns JSON results. It's intended for local development and testing of the mobile app's upload/identify flow.

Requirements
- Python 3.9+
- pip

Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the server

```bash
python server.py
```

This starts the server on http://0.0.0.0:8000

Test with curl

Single image:

```bash
curl -X POST -F "files=@/path/to/soil.jpg" http://localhost:8000/predict
```

Two images:

```bash
curl -X POST -F "files=@soil.jpg" -F "files=@plant.jpg" http://localhost:8000/predict
```

Connecting your phone / Expo client

- If you're running the Expo app on a simulator that shares localhost (Android emulator, iOS simulator), `http://10.0.2.2:8000` (Android emu) or `http://localhost:8000` (iOS sim) may work. Otherwise, find your machine IP (e.g., `192.168.1.42`) and use `http://192.168.1.42:8000` in the app.
- For physical devices or simple tunneling, use ngrok:

```bash
ngrok http 8000
# then copy the https://... URL and use it in the app
```

Security & notes
- This server runs with wide-open CORS for ease of local dev. Restrict origins for production.
- The `run_model_stub` function is a placeholder. Load and reuse your ML model at module scope for performance.
- For production deployments, consider async workers, batching, GPU-backed instances, and authentication.
