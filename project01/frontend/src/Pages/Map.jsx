import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
// import "../CSS/MapEVCharger.css";
import '../CSS/Sub.css';

// 동적 스크립트 로딩
function loadKakaoSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve();
      return;
    }
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

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

const Map = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      await loadKakaoSdk();

      let raw = [];
      try {
        const { data } = await axios.get("http://localhost:3001/api/proxy/list");
        raw = data;
      } catch (err) {
        alert("충전소 데이터 요청 실패");
        setLoading(false);
        return;
      }

      // 5개만 주소 → 좌표 변환
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
      markersRef.current.forEach(obj => {
        obj.marker.setMap(null);
        if (obj.infowindow) obj.infowindow.close();
      });
      markersRef.current = [];
      if (mapRef.current) mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const container = document.getElementById("ev-map");
    if (!container) return;
    container.innerHTML = "";

    // 서울 중심
    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
      level: 7
    });
    mapRef.current = map;

    markersRef.current.forEach(obj => {
      obj.marker.setMap(null);
      if (obj.infowindow) obj.infowindow.close();
    });
    markersRef.current = [];

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

    // 지도 중심은 서울
    map.setCenter(new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng));
  }, [loading, stations]);

  return (
    <div className="evmap-mainwrap">
      <div className="evmap-topnav">
        <span className="evmap-path">위치찾기 &nbsp;&gt;&nbsp;<b>전기차충전소</b></span>
      </div>
      <div className="evmap-content">
        {loading ? (
          <div className="evmap-loading">맵 및 데이터 불러오는 중...</div>
        ) : (
          <div id="ev-map" className="evmap-map"></div>
        )}
      </div>
    </div>
  );
};

export default Map;
