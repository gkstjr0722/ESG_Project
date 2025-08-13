from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List
from inference import predict_next_with_input

app = FastAPI(title="Power Forecast API")
# app = FastAPI(servers=[{"url": "http://127.0.0.1:8000"}])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

class Req(BaseModel):
    value: float

class PredictRequest(BaseModel):
    current_month_kwh: float = Field(..., gt=0)

class PredictResponse(BaseModel):
    next_month_kwh: float
    hourly_this_month: Dict[str, float]
    hourly_next_month: Dict[str, float]
    hourly_this_month_text: List[str]
    hourly_next_month_text: List[str]

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        _, next_total, h_this, h_next = predict_next_with_input(req.current_month_kwh, make_hourly=True)
    except Exception as e:
        raise HTTPException(500, f"Model error: {e}")

   
    def to_map(arr):
        return {str(h): round(float(arr[h]), 2) for h in range(24)}
    def to_text(arr):
        return [f"{h:02d} : {float(arr[h]):.2f}" for h in range(24)]
    
    return PredictResponse(
        next_month_kwh=float(next_total),
        hourly_this_month=to_map(h_this),
        hourly_next_month=to_map(h_next),
        hourly_this_month_text=to_text(h_this),
        hourly_next_month_text=to_text(h_next),
    )

