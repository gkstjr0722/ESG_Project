import React, { useState } from 'react';

export default function App() {
  const [value, setValue] = useState('100');
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const callPredict = async () => {
    setLoading(true);
    setResp(null);
    try {
      const r = await fetch('/fast/predict', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ current_month_kwh: Number(value) })
      });
      const data = await r.json();
      setResp(data);
    } catch (e) {
      setResp({ result:'fail', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>AI 전력 예측</h2>
      <input type="number" value={value} onChange={e=>setValue(e.target.value)} />
      <button onClick={callPredict} disabled={loading}>
        {loading ? '예측 중...' : '예측 요청'}
      </button>
      <pre style={{ marginTop: 16 }}>
        {JSON.stringify(resp, null, 2)}
      </pre>
    </div>
  );
}
