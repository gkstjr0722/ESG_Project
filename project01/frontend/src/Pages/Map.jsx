import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from '../component/Header';
// Header나 CSS는 기존 것 그대로 사용하면 됩니다.

const DEFAULT_CENTER = { lat: 35.1595454, lng: 126.8526012 }; // 초기: 광주

export default function MapEVCharger() {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);

  // 1) 데이터 가져오기 (addr를 프론트에서 바꾸고 싶으면 params로 전달)
  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:3001/api/proxy/manage",
          {
            // params: { addr: "광주광역시 북구" }, // 필요시 주석 해제해서 지역 바꿔도 됨
          }
        );
        if (!alive) return;

        // lat/longi 문자열 → 숫자 변환 & 유효한 좌표만
        const parsed = (Array.isArray(data) ? data : [])
          .map(d => ({
            ...d,
            lat: Number(d.lat),
            lng: Number(d.longi),
          }))
          .filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lng));

        setStations(parsed);
      } catch (e) {
        alert("충전소 데이터 요청 실패");
      } finally {
        if (alive) setLoading(false);
      }
    }

    // 카카오 SDK 준비 대기 후 호출
    const waitKakao = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(fetchData);
      } else if (window.kakao?.maps) {
        fetchData();
      } else {
        setTimeout(waitKakao, 120);
      }
    };
    waitKakao();

    return () => { alive = false; };
  }, []);

  // 2) 지도 + 마커 렌더
  useEffect(() => {
    if (loading) return;
    const container = document.getElementById("ev-map");
    if (!container) return;

    // 지도 초기화는 항상 load 안에서!
    const draw = () => {
      container.innerHTML = "";
      const maps = window.kakao.maps;

      const center = stations.length
        ? { lat: stations[0].lat, lng: stations[0].lng }
        : DEFAULT_CENTER;

      const map = new maps.Map(container, {
        center: new maps.LatLng(center.lat, center.lng),
        level: 6,
      });

      stations.forEach(st => {
        const marker = new maps.Marker({
          map,
          position: new maps.LatLng(st.lat, st.lng),
          title: st.cpNm || st.csNm || "충전소",
        });

        const infoHtml = `
          <div class="evmap-popup">
            <b>${st.cpNm || st.csNm || "충전소"}</b><br/>
            <span>${st.addr || ""}</span><br/>
            <span>타입:${st.chargeTp ?? "-"} | 방식:${st.cpTp ?? "-"}</span><br/>
            <span>상태:${st.cpStat ?? "-"}</span>
          </div>
        `;
        const infowindow = new maps.InfoWindow({ content: infoHtml, removable: true });
        maps.event.addListener(marker, "click", () => infowindow.open(map, marker));
      });
    };

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(draw);
    } else if (window.kakao?.maps) {
      draw();
    } else {
      // 매우 드문 경우 대비
      const t = setTimeout(() => window.kakao?.maps && draw(), 150);
      return () => clearTimeout(t);
    }
  }, [loading, stations]);

  return (
    <>
      {/* 상단 헤더/스타일은 기존 그대로 */}
      {loading ? (
        <div className="evmap-loading">맵 및 데이터 불러오는 중...</div>
      ) : (
        <div id="ev-map" className="evmap-map" />
      )}
    </>
  );
}
