from __future__ import annotations
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any, List

# 아티팩트 폴더
ART = Path(__file__).resolve().parent / "artifacts"

# --- 아티팩트 없이도 동작하는 기본 분포(24시간 균등) ---
def _default_pattern() -> np.ndarray:
    base = np.ones(24, dtype=float) / 24.0
    return np.vstack([base for _ in range(12)])  # (12,24)

# 필요하면 나중에: artifacts에서 월별 패턴 불러오기
def _load_pattern() -> np.ndarray:
    path = ART / "pattern_by_month.npy"
    if path.exists():
        patt = np.load(path)
        if patt.shape == (12, 24):
            s = patt.sum(axis=1, keepdims=True)
            s[s == 0] = 1.0
            return patt / s
    return _default_pattern()

def predict_next_with_input(this_month_total_kwh: float, make_hourly: bool = True):
    """
    입력: 이번달 총(kWh)
    출력: (ratio, next_total, hourly_this(24,), hourly_next(24,))
    현재는 ratio=1.0(다음달=이번달) + 월별 패턴(없으면 균등)로 분해.
    나중에 GRU 아티팩트 붙이면 ratio를 모델로 예측하게 바꾸면 됨.
    """
    if this_month_total_kwh is None or this_month_total_kwh <= 0:
        raise ValueError("this_month_total_kwh > 0 이어야 합니다.")

    ratio = 1.0
    next_total = float(this_month_total_kwh * ratio)

    patt = _load_pattern()
    # 임시로 m_this=현재 8월, m_next=9월로 가정 (원하면 datetime.now().month 사용)
    m_this, m_next = 8, 9

    h_this = patt[m_this-1] * this_month_total_kwh
    h_next = patt[m_next-1] * next_total
    return ratio, next_total, h_this, h_next
