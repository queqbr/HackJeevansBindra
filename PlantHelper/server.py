from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from PIL import Image
import io
import uvicorn

app = FastAPI(title="PlantHelper Inference Server")

# Allow wide-open CORS for local/dev usage. In production, lock this down.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_model_stub(images: List[Image.Image]):
    """
    Placeholder model function.
    Replace this with your real model inference code.

    Input: list of PIL.Image
    Output: arbitrary JSON-serializable results
    """
    results = []
    for img in images:
        results.append({
            "size": img.size,
            "mode": img.mode,
            "note": "stub - replace run_model_stub with real model call",
        })
    return {"ok": True, "count": len(images), "results": results}


@app.post("/predict")
async def predict(files: List[UploadFile] = File(...)):
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

    # Here you would preprocess and pass the images to your ML model.
    # Keep model loading outside this request handler for performance (module-level load).
    results = run_model_stub(images)

    return JSONResponse(results)


if __name__ == "__main__":
    # For local dev: python server.py
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
