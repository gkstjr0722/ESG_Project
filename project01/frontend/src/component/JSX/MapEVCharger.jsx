import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../CSS/MapEVCharger.css";

// 동적 스크립트 로딩 함수 (최초 1회만 로드)
function loadKakaoSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve();
      return;
    }
    // 혹시라도 두 번 이상 삽입 방지
    if (document.getElementById("kakao-map-sdk")) {
      document.getElementById("kakao-map-sdk").onload = () => {
        window.kakao.maps.load(resolve);
      };
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=98fa8b3fe19d88d993f89ee04c382b3c&autoload=false&libraries=services";
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const MapEVCharger = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null); // 맵 인스턴스 보관
  const markersRef = useRef([]); // 마커/인포윈도우 관리

  // 1. SDK+데이터 순차 로딩
  useEffect(() => {
    let isMounted = true; // cleanup 플래그

    async function fetchAll() {
      setLoading(true);
      await loadKakaoSdk();

      // 충전소 데이터 요청
      let raw = [];
      try {
        const { data } = await axios.get("http://localhost:3001/api/proxy/list");
        raw = data;
      } catch (err) {
        alert("충전소 데이터 요청 실패");
        setLoading(false);
        return;
      }

      // 주소 → 좌표 최대 5개 변환
      const geocoder = new window.kakao.maps.services.Geocoder();
      const results = await Promise.all(
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
                console.warn("지오코딩 실패:", st.stnPlace, st.stnAddr, status, result);
                resolve(null);
              }
            });
          })
        )
      );
      if (isMounted) {
        setStations(results.filter(Boolean));
        setLoading(false);
      }
    }
    fetchAll();

    return () => {
      isMounted = false;
      // ★ 이전 마커/인포윈도우, map 클린업 (중복/메모리누수 방지)
      markersRef.current.forEach(obj => {
        obj.marker.setMap(null);
        if (obj.infowindow) obj.infowindow.close();
      });
      markersRef.current = [];
      if (mapRef.current) mapRef.current = null;
    };
  }, []);

  // 2. 지도 및 마커, 인포윈도우 생성
  useEffect(() => {
    if (loading || stations.length === 0) return;
    const container = document.getElementById("ev-map");
    if (!container) return;

    // ★ 기존 맵 지우기 (hot reload 대비)
    container.innerHTML = "";

    // 맵 생성
    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(36.35, 127.7),
      level: 7
    });
    mapRef.current = map;

    // 마커/인포윈도우 리스트 리셋
    markersRef.current.forEach(obj => {
      obj.marker.setMap(null);
      if (obj.infowindow) obj.infowindow.close();
    });
    markersRef.current = [];

    // 마커, 인포윈도우 동적 생성
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
      markersRef.current.push({ marker, infowindow });
    });

    // 반응형: 마커중앙
    if (stations.length > 0) {
      map.setCenter(new window.kakao.maps.LatLng(stations[0].lat, stations[0].lng));
    }
  }, [loading, stations]);

  return (
    <div className="evmap-wrap">
      <h2 className="evmap-title">전국 전기차 충전소 위치찾기</h2>
      {loading ? (
        <div className="evmap-loading">맵 및 데이터 불러오는 중...</div>
      ) : (
        <div id="ev-map" className="evmap-map"></div>
      )}
    </div>
  );
};

export default MapEVCharger;
