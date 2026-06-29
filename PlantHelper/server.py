from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from PIL import Image
import io
import uvicorn
from pydantic import BaseModel
import os
import json
import httpx
import asyncio
import tensorflow as tf
import numpy as np
import json

# Optional: load environment variables from a .env file during local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class RecommendRequest(BaseModel):
    identification: dict
    meta: dict


async def generate_recommendations(identification: dict, meta: dict):
    """
    Use OpenAI (chat completions) to generate recommendations.
    Falls back to a simple stub explanation if the generative call fails.
    """
    results = identification.get('results', []) if isinstance(identification, dict) else []
    tags = []
    for r in results:
        tags.append(str(r.get('note', '')).lower())
        tags.append(str(r.get('size', '')))

    recommendations = []

    prompt = (
        "You are a friendly, practical plant recommendation assistant.\n\n"
        f"Identification result: {identification}\nUser answers: {meta}\n\n"
        "Task: suggest up to 3 plants that are widely available and commonly known to average plant shoppers. Prefer common names (e.g., 'snake plant', 'pothos', 'peace lily') and also include familiar home garden plants when appropriate — herbs and small edibles (basil, mint, rosemary), common ornamentals (marigold, geranium, lavender), or other easy-to-find garden/yard plants.\n\n"
        "For each recommendation return a short 'name' (common name), and a concise 'reason' that explains why this plant fits the user's situation (mention sunlight, watering frequency, space, busy level, or climate when relevant). Indicate whether the plant is typically kept indoors or outdoors when relevant. Avoid very rare or specialist species.\n\n"
        "Output: ONLY one valid JSON object with keys: 'recommendations' (array of objects with 'name' and 'reason') and 'explanation' (a 1-2 sentence human-friendly summary). Do not include any commentary outside the JSON.\n\n"
        "Example output format:\n{" + '"recommendations": [{"name": "pothos", "reason": "thrives in low to medium light and tolerates irregular watering"}], "explanation": "Short explanation"}' + "\n\n"
        "Limit to 3 recommendations."
    )

    async def call_generative(prompt_text: str) -> str:
        openai_key = os.getenv('OPENAI_API_KEY')
        openai_model = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')

        if not openai_key:
            raise RuntimeError('No OPENAI_API_KEY configured')

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
        body = {
            "model": openai_model,
            "messages": [
                {"role": "system", "content": "You are a plant recommendation assistant."},
                {"role": "user", "content": prompt_text},
            ],
            "max_tokens": 400,
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=body, headers=headers)
            text_body = r.text if hasattr(r, 'text') else ''
            print('OpenAI response status =', r.status_code, 'body_preview =', (text_body[:400] + '...') if len(text_body) > 400 else text_body)
            r.raise_for_status()
            j = r.json()

        if isinstance(j, dict):
            choices = j.get('choices') or []
            if choices and isinstance(choices, list):
                first = choices[0]
                msg = first.get('message') or first.get('text') or ''
                if isinstance(msg, dict):
                    content = msg.get('content') or msg.get('text') or ''
                else:
                    content = msg
                return content
        return str(j)

    try:
        text = await call_generative(prompt)
        try:
            parsed = json.loads(text)
            recs = parsed.get('recommendations') or parsed.get('results') or []
            explanation = parsed.get('explanation') or ''
            return {"ok": True, "recommendations": recs, "explanation": explanation}
        except Exception:
            explanation = f"Based on soil analysis tags: {', '.join([t for t in tags if t])}. Generative response: {text}"
            return {"ok": True, "recommendations": recommendations, "explanation": explanation}
    except Exception as e:
        explanation = f"Based on soil analysis tags: {', '.join([t for t in tags if t])} (generative call failed: {e})"
        return {"ok": True, "recommendations": recommendations, "explanation": explanation}


app = FastAPI(title="PlantHelper Inference Server")

print('OPENAI_API_KEY present?', bool(os.getenv('OPENAI_API_KEY')), 'OPENAI_MODEL=', os.getenv('OPENAI_MODEL', 'unset'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    rec = await generate_recommendations(req.identification, req.meta)
    return JSONResponse(rec)


@app.post("/predict")
async def predict(files: List[UploadFile] = File(...), meta: Optional[str] = Form(None)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    i1: Image.Image | None = None
    i2: Image.Image | None = None
    for upload in files:
        content = await upload.read()
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {upload.filename}") from e
        if i1 is None:
            i1 = img
        else:
            i2 = img

    if i1 is None:
        raise HTTPException(status_code=400, detail="No valid images uploaded")

    MODEL_PATH = "Model/final_soil.keras"
    LABELS_JSON = "Model/final_soil.json"
    MODEL_PATH1 = "Model/final_plant.keras"
    LABELS_JSON1 = "Model/final_plant.json"
    IMG_SIZE = 224

    soil_model = tf.keras.models.load_model(MODEL_PATH)

    with open(LABELS_JSON, "r") as f:
        soil_class_names = json.load(f)

    soil_arr = np.expand_dims(np.array(i1.resize((IMG_SIZE, IMG_SIZE))) / 255.0, axis=0)
    soil_pred = soil_model.predict(soil_arr)
    soil_label = soil_class_names[int(np.argmax(soil_pred[0]))]

    plant_label: str | None = None
    if i2 is not None:
        plant_model = tf.keras.models.load_model(MODEL_PATH1)
        with open(LABELS_JSON1, "r") as f:
            plant_class_names = json.load(f)
        plant_arr = np.expand_dims(np.array(i2.resize((IMG_SIZE, IMG_SIZE))) / 255.0, axis=0)
        plant_pred = plant_model.predict(plant_arr)
        plant_label = plant_class_names[int(np.argmax(plant_pred[0]))]

    result: dict = {"ok": True, "soil": soil_label, "plant": plant_label}

    if meta:
        try:
            result["meta"] = json.loads(meta)
        except Exception:
            result["meta_raw"] = meta

    return JSONResponse(result)


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
