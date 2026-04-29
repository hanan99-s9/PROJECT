from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import whisper
import os
import shutil

app = FastAPI()

model = whisper.load_model("tiny")


# =========================
# Request Model
# =========================
class TextRequest(BaseModel):
    text: str


# =========================
# Normalization
# =========================
def normalize(text: str) -> str:
    text = text.strip()
    text = text.replace("أ", "ا")
    text = text.replace("إ", "ا")
    text = text.replace("آ", "ا")
    text = text.replace("ة", "ه")
    text = text.replace("ى", "ي")
    text = text.replace("ؤ", "و")
    text = text.replace("ئ", "ي")

    text = text.replace("؟", "")
    text = text.replace("!", "")
    text = text.replace("،", "")
    text = text.replace(".", "")
    text = text.replace("؛", "")
    text = text.replace(":", "")

    text = " ".join(text.split())
    return text


# =========================
# Stop Words
# =========================
STOP_WORDS = {
    "من", "في", "على", "الى", "إلى", "مع", "عن",
    "لو", "سمحت", "فضلك", "الرجاء", "هل", "و", "يا",
    "هذا", "هذه", "هناك", "هنا", "ثم", "او"
}


# =========================
# Gloss Dictionary
# =========================
GLOSS_MAP = {
    "اريد": "WANT",
    "ابي": "WANT",
    "ابغى": "WANT",

    "موعد": "APPOINTMENT",
    "طبيب": "DOCTOR",
    "الطبيب": "DOCTOR",

    "اين": "WHERE",
    "فين": "WHERE",

    "حمام": "TOILET",
    "الحمام": "TOILET",

    "مستشفى": "HOSPITAL",
    "المستشفى": "HOSPITAL",

    "دواء": "MEDICINE",
    "ماء": "WATER",
    "اكل": "FOOD",
    "طوارئ": "EMERGENCY",
    "مساعده": "HELP",
    "ساعدني": "HELP"
}


# =========================
# Arabic Sign Dictionary
# =========================
ARABIC_SIGN_DICT = {
    "نعم": "yes.jpeg",
    "لا": "no.jpeg",
    "شكرا": "thanks.jpeg",
    "مساعده": "help.jpeg",
    "تعال": "come.jpeg",
    "اذهب": "go.jpeg",
    "انتظر": "wait.jpeg",
    "اجلس": "sit.jpeg",
    "قف": "stop.jpeg",
    "اسمع": "listen.jpeg",
    "انظر": "look.jpeg",
    "اكل": "food.jpeg",
    "ماء": "water.jpeg",
    "تعب": "tired.jpeg",
    "الم": "pain.jpeg",
    "وين": "where.jpeg",
    "انا": "me.jpeg",
    "انت": "you.jpeg",
    "تمام": "ok.jpeg",
    "خلاص": "done.jpeg"
}


# =========================
# Text Processing Helpers
# =========================
def remove_stop_words(words: list[str]) -> list[str]:
    filtered = []
    for word in words:
        if word not in STOP_WORDS:
            filtered.append(word)
    return filtered


def detect_intent(words: list[str]) -> str:
    if ("اين" in words or "فين" in words) and ("حمام" in words or "الحمام" in words):
        return "location_query"

    if "موعد" in words and ("طبيب" in words or "الطبيب" in words):
        return "medical_appointment"

    if "مساعده" in words or "ساعدني" in words:
        return "help_request"

    if "ماء" in words:
        return "water_request"

    if "دواء" in words:
        return "medicine_request"

    if "الم" in words or "وجع" in words:
        return "pain"

    return "general"


def simplify_by_intent(words: list[str], intent: str) -> list[str]:
    if intent == "location_query":
        keep = {"اين", "فين", "حمام", "الحمام"}
        return [w for w in words if w in keep]

    if intent == "medical_appointment":
        keep = {"اريد", "ابي", "ابغى", "موعد", "طبيب", "الطبيب"}
        return [w for w in words if w in keep]

    if intent == "help_request":
        keep = {"مساعده", "ساعدني"}
        return [w for w in words if w in keep]

    if intent == "water_request":
        keep = {"ماء", "اريد", "ابي", "ابغى"}
        return [w for w in words if w in keep]

    if intent == "medicine_request":
        keep = {"دواء", "اريد", "ابي", "ابغى"}
        return [w for w in words if w in keep]

    if intent == "pain":
        return ["الم"]

    return words


def process_text_pipeline(text: str) -> dict:
    normalized = normalize(text)
    words = normalized.split()
    filtered_words = remove_stop_words(words)
    intent = detect_intent(filtered_words)
    simplified_words = simplify_by_intent(filtered_words, intent)

    return {
        "original_text": text,
        "normalized_text": normalized,
        "filtered_words": filtered_words,
        "intent": intent,
        "simplified_words": simplified_words
    }


def reorder_gloss(words: list[str], intent: str) -> list[str]:
    if intent == "location_query":
        gloss = []
        if "اين" in words or "فين" in words:
            gloss.append("WHERE")
        if "حمام" in words or "الحمام" in words:
            gloss.append("TOILET")
        return gloss

    if intent == "medical_appointment":
        gloss = []
        if "اريد" in words or "ابي" in words or "ابغى" in words:
            gloss.append("WANT")
        if "موعد" in words:
            gloss.append("APPOINTMENT")
        if "طبيب" in words or "الطبيب" in words:
            gloss.append("DOCTOR")
        return gloss

    if intent == "help_request":
        gloss = []
        if "مساعده" in words or "ساعدني" in words:
            gloss.append("HELP")
        return gloss

    if intent == "water_request":
        gloss = []
        if "اريد" in words or "ابي" in words or "ابغى" in words:
            gloss.append("WANT")
        if "ماء" in words:
            gloss.append("WATER")
        return gloss

    if intent == "medicine_request":
        gloss = []
        if "اريد" in words or "ابي" in words or "ابغى" in words:
            gloss.append("WANT")
        if "دواء" in words:
            gloss.append("MEDICINE")
        return gloss

    gloss = []
    for word in words:
        if word in GLOSS_MAP:
            gloss.append(GLOSS_MAP[word])
    return gloss


def map_text_to_arabic_signs(text: str) -> dict:
    normalized = normalize(text)
    words = normalized.split()

    matched_words = []
    sign_assets = []

    for word in words:
        if word in ARABIC_SIGN_DICT:
            matched_words.append(word)
            sign_assets.append(ARABIC_SIGN_DICT[word])

    return {
        "input": text,
        "normalized_text": normalized,
        "matched_words": matched_words,
        "sign_assets": sign_assets
    }


# =========================
# API Endpoints
# =========================
@app.get("/")
def root():
    return {"message": "Python API is working"}


@app.post("/api/text-process")
def text_process(req: TextRequest):
    result = process_text_pipeline(req.text)

    return {
        "ok": True,
        "input": result["original_text"],
        "normalized_text": result["normalized_text"],
        "filtered_words": result["filtered_words"],
        "intent": result["intent"],
        "simplified_words": result["simplified_words"]
    }


@app.post("/api/text-to-gloss")
def text_to_gloss(req: TextRequest):
    result = process_text_pipeline(req.text)
    gloss = reorder_gloss(result["simplified_words"], result["intent"])

    return {
        "ok": True,
        "input": result["original_text"],
        "normalized_text": result["normalized_text"],
        "filtered_words": result["filtered_words"],
        "intent": result["intent"],
        "simplified_words": result["simplified_words"],
        "gloss": gloss
    }


@app.post("/api/text-to-sign")
def text_to_sign(req: TextRequest):
    result = map_text_to_arabic_signs(req.text)

    return {
        "ok": True,
        "input": result["input"],
        "normalized_text": result["normalized_text"],
        "matched_words": result["matched_words"],
        "sign_assets": result["sign_assets"]
    }


@app.post("/api/gloss-to-sign")
def gloss_to_sign(req: TextRequest):
    result = process_text_pipeline(req.text)
    gloss = reorder_gloss(result["simplified_words"], result["intent"])

    sign_assets = []
    for item in gloss:
        sign_assets.append({
            "gloss": item,
            "asset": f"{item.lower()}.png"
        })

    return {
        "ok": True,
        "input": result["original_text"],
        "intent": result["intent"],
        "gloss": gloss,
        "sign_assets": sign_assets
    }


@app.post("/api/speech-to-text")
def speech_to_text():
    audio_path = "audio.wav"

    if not os.path.exists(audio_path):
        return {"ok": False, "error": "audio file not found"}

    result = model.transcribe(audio_path, language="ar")

    return {
        "ok": True,
        "text": result["text"]
    }


@app.post("/api/live-audio-chunk")
async def live_audio_chunk(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = model.transcribe(temp_path, language="ar")
        text = result["text"].strip()

        pipeline = process_text_pipeline(text)
        sign_result = map_text_to_arabic_signs(text)

        return {
            "ok": True,
            "filename": file.filename,
            "text": text,
            "intent": pipeline["intent"],
            "filtered_words": pipeline["filtered_words"],
            "matched_words": sign_result["matched_words"],
            "sign_assets": sign_result["sign_assets"]
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)