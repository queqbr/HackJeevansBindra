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

    prompt = f"You are a plant recommendation assistant.\n\nIdentification result: {identification}\nUser answers: {meta}\n\nProduce a JSON object with keys: 'recommendations' (an array of objects with 'name' and 'reason'), and 'explanation' (a short text explanation). Keep JSON valid and nothing else.\n\nLimit to 3 recommendations."

    async def call_generative(prompt_text: str) -> str:
        # Read API key and model name from environment (or .env)
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


def run_model_stub(images: List[Image.Image]):
    results = []
    for img in images:
        results.append({
            "size": img.size,
            "mode": img.mode,
            "note": "stub - replace run_model_stub with real model call",
        })
    return {"ok": True, "count": len(images), "results": results}


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    rec = await generate_recommendations(req.identification, req.meta)
    return JSONResponse(rec)


@app.post("/predict")
async def predict(files: List[UploadFile] = File(...), meta: Optional[str] = Form(None)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    images = []
    for upload in files:
        content = await upload.read()
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {upload.filename}") from e
        images.append(img)

    results = run_model_stub(images)
    if meta:
        try:
            import json as _json
            meta_obj = _json.loads(meta)
            results["meta"] = meta_obj
        except Exception:
            results["meta_raw"] = meta

    return JSONResponse(results)


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
