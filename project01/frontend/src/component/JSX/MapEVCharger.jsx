import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CSS/MapEVCharger.css";

const MapEVCharger = () => {
  const [stations, setStations] = useState([]);
  const [kakaoReady, setKakaoReady] = useState(false);

  // 1. 카카오맵 SDK 준비 체크
  useEffect(() => {
    const timer = setInterval(() => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        setKakaoReady(true);
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 2. 충전소 데이터 가져와서 주소 -> 좌표 변환 (5개만)
  useEffect(() => {
    if (!kakaoReady) return;
    axios.get("http://localhost:3001/api/proxy/list")
      .then(async (res) => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        const raw = res.data;
        // 최대 5개만!
        const mapped = await Promise.all(
          raw.slice(0, 5).map(st =>
            new Promise(resolve => {
              geocoder.addressSearch(st.stnAddr, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  resolve({
                    ...st,
                    lat: Number(result[0].y),
                    lng: Number(result[0].x)
                  });
                } else {
                  // 실패 시 로그
                  console.warn("지오코딩 실패:", st.stnPlace, st.stnAddr, status, result);
                  resolve(null);
                }
              });
            })
          )
        );
        setStations(mapped.filter(Boolean));
      })
      .catch(err => {
        console.error("충전소 데이터 요청 실패:", err);
      });
  }, [kakaoReady]);

  // 3. 지도 & 마커 그리기
  useEffect(() => {
    if (!kakaoReady || stations.length === 0) return;
    window.kakao.maps.load(() => {
      const container = document.getElementById("ev-map");
      if (!container) return;
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(36.35, 127.7),
        level: 7
      });

      stations.forEach(st => {
        if (!st.lat || !st.lng) return;
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(st.lat, st.lng),
          title: st.stnPlace,
        });
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `
            <div class="evmap-popup">
              <b>${st.stnPlace}</b><br/>
              <span>${st.stnAddr}</span><br/>
              <span>급속: ${st.rapidCnt || 0} / 완속: ${st.slowCnt || 0}</span><br/>
              <span>지원차종: ${st.carType || ""}</span>
            </div>`,
          removable: true,
        });
        window.kakao.maps.event.addListener(marker, 'click', function () {
          infowindow.open(map, marker);
        });
      });
    });
  }, [kakaoReady, stations]);

  return (
    <div className="evmap-wrap">
      <h2 className="evmap-title">전국 전기차 충전소 위치찾기</h2>
      <div id="ev-map" className="evmap-map"></div>
    </div>
  );
};

export default MapEVCharger;
