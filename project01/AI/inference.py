# inference.py
from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from numpy.typing import NDArray
import numpy as np
import tensorflow as tf

# ---------------------------------------------------------------------
# 경로/아티팩트
# ---------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
ART  = ROOT / "artifacts"

# 모델 파일(.h5)은 여러 이름을 허용
MODEL_CANDIDATES = [
    ART / "best_gru_ratio.h5",
]
# 버전 충돌 시 가중치 폴백용
MODEL_WEIGHTS = ART / "best_gru_ratio.weights.h5"

FEATURE_COLS_JSON    = ART / "feature_cols.json"     # list[str]
X_SCALER_PKL         = ART / "x_scaler.pkl"          # sklearn StandardScaler
Y_SCALER_PKL         = ART / "y_scaler.pkl"
SEQ_LAST_NPY         = ART / "seq_last.npy"          # (PAST_N, F)
PATTERN_BY_MONTH_NPY = ART / "pattern_by_month.npy"  # (12, 24)

# tf.keras 별칭(서브모듈 직수입 대신 한 줄로 통일)
K = tf.keras


# ---------------------------------------------------------------------
# 로더 유틸
# ---------------------------------------------------------------------
def _load_json(path: Path) -> Any:
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def _load_pickle(path: Path):
    if path.exists():
        with open(path, "rb") as f:
            return pickle.load(f)
    return None

def _load_pattern() -> np.ndarray:
    """(12,24) 월별 24시간 분포. 없으면 균등분포."""
    if PATTERN_BY_MONTH_NPY.exists():
        patt = np.load(PATTERN_BY_MONTH_NPY)
        if isinstance(patt, np.ndarray) and patt.shape == (12, 24):
            s = patt.sum(axis=1, keepdims=True)
            s[s == 0] = 1.0
            return patt / s
    base = np.ones(24, dtype=float) / 24.0
    return np.vstack([base for _ in range(12)])


# ---------------------------------------------------------------------
# 모델 빌더(학습 코드와 동일 구조)
# ---------------------------------------------------------------------
def _build_model_from_shape(timesteps: int, features: int) -> K.Model:
    return K.Sequential([
        K.layers.Input(shape=(timesteps, features)),
        K.layers.GRU(96, return_sequences=True),
        K.layers.Dropout(0.2),
        K.layers.GRU(48),
        K.layers.Dropout(0.2),
        K.layers.Dense(32, activation='relu'),
        K.layers.Dense(1),
    ],name="gru_ratio")


def _load_model() -> Optional[K.Model]:
    """1) .h5 시도 → 2) weights 폴백 → 3) 실패시 None(폴백 경로)."""
    # 1) .h5 전체모델
    for p in MODEL_CANDIDATES:
        if p.exists():
            try:
                m = K.models.load_model(p.as_posix(), compile=False)
                print(f"[info] loaded: {p.name}")
                return m
            except Exception as e:
                print(f"[warn] load_model failed for {p.name}: {e}")

    # 2) 동일 구조 빌드 후 weights 로드
    try:
        if SEQ_LAST is not None and MODEL_WEIGHTS.exists():
            T, F = SEQ_LAST.shape
            m = _build_model_from_shape(T, F)
            m.load_weights(MODEL_WEIGHTS.as_posix())
            print(f"[info] built model ({T}x{F}) and loaded weights: {MODEL_WEIGHTS.name}")
            return m
    except Exception as e:
        print(f"[warn] load_weights fallback failed: {e}")

    # 3) 실패
    print("[warn] model not loaded; using ratio=1.0 fallback")
    return None


# ---------------------------------------------------------------------
# 아티팩트 로드 (모듈 import 시 1회)
# ---------------------------------------------------------------------
FEATURE_COLS = _load_json(FEATURE_COLS_JSON) or []
X_SCALER = _load_pickle(X_SCALER_PKL)
Y_SCALER = _load_pickle(Y_SCALER_PKL)
SEQ_LAST = np.load(SEQ_LAST_NPY) if SEQ_LAST_NPY.exists() else None
TPL_MONTH = _load_pattern()

FEAT_IDX: Dict[str, int] = {n: i for i, n in enumerate(FEATURE_COLS)} if FEATURE_COLS else {}

# 스케일러 평균/표준편차(없으면 빈 dict)
if X_SCALER is not None and hasattr(X_SCALER, "mean_") and hasattr(X_SCALER, "scale_"):
    MU = dict(zip(FEATURE_COLS, X_SCALER.mean_))
    SD = dict(zip(FEATURE_COLS, X_SCALER.scale_))
else:
    MU, SD = {}, {}

def _inv_y(z: float) -> float:
    """표준화 좌표 z -> 원래 y_logratio."""
    if Y_SCALER is not None and hasattr(Y_SCALER, "inverse_transform"):
        return float(Y_SCALER.inverse_transform(np.array([[z]], dtype=float))[0, 0])
    y_mean = getattr(Y_SCALER, "mean_", [0.0])[0] if Y_SCALER is not None else 0.0
    y_std  = getattr(Y_SCALER, "scale_", [1.0])[0] if Y_SCALER is not None else 1.0
    return float(z * y_std + y_mean)

def inv_std(z: float, name: str) -> float:
    return z * SD[name] + MU[name]

def to_z(x: float, name: str) -> float:
    return (x - MU[name]) / (SD[name] + 1e-6)

POWER_KEYS = [k for k in [
    "power_sum","power_mean","power_std","power_max","power_min",
    "power_range","power_peak_to_avg"
] if k in FEAT_IDX]

MODEL = _load_model()  # 최종 모델 핸들


# ---------------------------------------------------------------------
# 시간대 분해 util
# ---------------------------------------------------------------------
def _smooth24(v: NDArray[np.float_], k: int = 3) -> NDArray[np.float_]:
    if k <= 1:
        return v
    pad = np.r_[v[-(k//2):], v, v[:(k//2)]]
    sm = np.convolve(pad, np.ones(k)/k, mode="valid")[:24]
    sm = np.maximum(sm, 0)
    sm = sm / sm.sum()
    return sm

def hourly_from_total(total_kwh: float, month: int, *, smooth: bool = True) -> NDArray[np.float_]:
    """월(month: 1~12)의 평균 24시간 분포로 total을 분해."""
    month = int(month)
    month = 1 if month < 1 else (12 if month > 12 else month)
    shares = TPL_MONTH[month - 1].copy()
    shares = shares / shares.sum()
    if smooth:
        shares = _smooth24(shares, k=3)
    return total_kwh * shares


# ---------------------------------------------------------------------
# Public API: predict_next_with_input
# ---------------------------------------------------------------------
def predict_next_with_input(this_month_total_kwh: float,
                            make_hourly: bool = True,
                            month_this: Optional[int] = None
                            ) -> Tuple[float, float, Optional[NDArray[np.float_]], Optional[NDArray[np.float_]]]:
    """
    입력: 이번달 총량(kWh)
    출력: (ratio, next_total, hourly_this(24,), hourly_next(24,))
    - 마지막 시퀀스의 power_*만 입력 총량으로 치환 → 모델로 y_logratio 예측 → exp → ratio
    - 아티팩트 누락/실패 시 ratio=1.0 폴백
    """
    if this_month_total_kwh is None or this_month_total_kwh <= 0:
        raise ValueError("this_month_total_kwh > 0 이어야 합니다.")

    # 월 파라미터(없으면 현재월)
    from datetime import datetime
    m_this = int(month_this or datetime.now().month)
    m_next = 1 if m_this == 12 else (m_this + 1)

    # ===== 아티팩트 누락 시 폴백 =====
    if MODEL is None or SEQ_LAST is None or not FEAT_IDX or not MU or not SD or Y_SCALER is None:
        ratio = 1.0
        next_total = float(this_month_total_kwh)
        h_this = hourly_from_total(this_month_total_kwh, m_this) if make_hourly else None
        h_next = hourly_from_total(next_total, m_next)           if make_hourly else None
        return ratio, next_total, h_this, h_next

    # ===== 실제 추론 =====
    # 마지막 시퀀스 복사
    seq = np.array(SEQ_LAST, dtype=float).copy()   # (T, F)
    last = seq[-1].copy()                          # (F,)

    # 마지막 스텝 raw 복원
    last_raw = {n: inv_std(last[FEAT_IDX[n]], n) for n in FEAT_IDX}

    # 입력 총량으로 power_* 재스케일
    ref_sum = max(float(last_raw.get("power_sum", 1.0)), 1e-6)
    factor = float(this_month_total_kwh) / ref_sum

    new_raw = dict(last_raw)
    new_raw["power_sum"] = float(this_month_total_kwh)
    if "power_mean" in new_raw: new_raw["power_mean"] *= factor
    if "power_std"  in new_raw: new_raw["power_std"]  *= factor
    if "power_max"  in new_raw: new_raw["power_max"]  *= factor
    if "power_min"  in new_raw: new_raw["power_min"]  *= factor
    if "power_max" in new_raw and "power_min" in new_raw:
        new_raw["power_range"] = new_raw["power_max"] - new_raw["power_min"]
    if all(k in new_raw for k in ("power_peak_to_avg","power_max","power_mean")):
        denom = max(new_raw["power_mean"], 1e-6)
        new_raw["power_peak_to_avg"] = new_raw["power_max"] / denom

    # 시퀀스 마지막 스텝 덮어쓰기(표준화 좌표, clip=5)
    CLIP_Z = 5.0
    for k in POWER_KEYS:
        seq[-1, FEAT_IDX[k]] = np.clip(to_z(new_raw[k], k), -CLIP_Z, CLIP_Z)

    # 모델 예측: y_logratio(z) → inverse_transform → ratio
    y_log_z = float(MODEL.predict(seq[np.newaxis, ...], verbose=0).ravel()[0])
    y_log   = _inv_y(y_log_z)
    ratio   = float(np.exp(y_log))
    next_total = float(this_month_total_kwh * ratio)

    # 시간대 분해
    h_this = hourly_from_total(this_month_total_kwh, m_this) if make_hourly else None
    h_next = hourly_from_total(next_total, m_next)           if make_hourly else None
    return ratio, next_total, h_this, h_next


# ---------------------------------------------------------------------
# 디버그(선택)
# ---------------------------------------------------------------------
def _debug_artifacts():
    print("\n[artifacts]")
    print("MODEL:", "OK" if MODEL is not None else "MISS")
    print("FEATURE_COLS:", len(FEATURE_COLS))
    print("X_SCALER:", "OK" if X_SCALER is not None else "MISS")
    print("Y_SCALER:", "OK" if Y_SCALER is not None else "MISS")
    print("SEQ_LAST:", "OK "+str(SEQ_LAST.shape) if SEQ_LAST is not None else "MISS")
    print("TPL_MONTH:", "OK "+str(TPL_MONTH.shape) if TPL_MONTH is not None else "MISS")

# 모듈 import 시 한 번 출력해두고 싶으면 주석 해제
print(f"[boot] tensorflow={tf.__version__}")
_debug_artifacts()


if __name__ == "__main__":
    _debug_artifacts()
    r, nxt, h0, h1 = predict_next_with_input(26000, make_hourly=True)
    print(f"ratio={r:.4f}, next_total={nxt:.2f}")
    if h0 is not None:
        print("sum_this =", float(np.sum(h0)))
    if h1 is not None:
        print("sum_next =", float(np.sum(h1)))
