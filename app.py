from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from db import init_db, get_cached_translation, save_translation
from models import ModelHandler

# ------------------------------------------------------------------
# App init
# ------------------------------------------------------------------
app = FastAPI(title="智能文言文翻译器")
app.mount("/static", StaticFiles(directory="static"), name="static")

init_db()
model_handler = ModelHandler()

# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@app.get("/")
async def get_index():
    return FileResponse("static/index.html")


@app.post("/api/translate")
async def translate(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # 1. Check cache ---------------------------------------------------
    cached = get_cached_translation(text)
    if cached:
        return JSONResponse({"cached": True, "translation": cached})

    # 2. Call model ----------------------------------------------------
    try:
        translation = model_handler.call(text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # 3. Persist & return ---------------------------------------------
    save_translation(text, translation)
    return JSONResponse({"cached": False, "translation": translation})