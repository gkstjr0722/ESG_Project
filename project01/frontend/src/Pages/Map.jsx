import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Header from "../component/Header";

const DEFAULT_CENTER = { lat: 35.1595, lng: 126.8526 }; // 광주광역시 중심 좌표
const DEFAULT_LEVEL = 12; // 전국 스케일

export default function MapEVCharger() {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);

  // kakao 객체, map, clusterer, infowindow를 ref로 보관
  const kakaoRef = useRef(null);
  const mapRef = useRef(null);
  const clustererRef = useRef(null);
  const infoRef = useRef(null);

  // 1) 데이터 로드 (전국)
  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      try {
        // 전국 단위 예시: addr를 비우고 limit를 크게 요청 (백엔드 수정 필요, 아래 3) 참고)
        const { data } = await axios.get(
          "http://192.168.111.194:3001/api/proxy/manage",
          { params: { limit: 5000 } } // 추정 파라미터
        );
        if (!alive) return;

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

    // kakao SDK 준비 후 실행
    const waitKakao = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(fetchData);
      } else if (window.kakao?.maps) {
        fetchData();
      } else {
        setTimeout(waitKakao, 100);
      }
    };
    waitKakao();

    return () => { alive = false; };
  }, []);

  // 2) 지도/클러스터러 초기화 (최초 1회)
  useEffect(() => {
    if (loading) return;

    const container = document.getElementById("ev-map");
    if (!container) return;

    const init = () => {
      const { maps } = window.kakao;
      kakaoRef.current = window.kakao;

      // 지도 생성(전국 뷰)
      mapRef.current = new maps.Map(container, {
        center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        level: DEFAULT_LEVEL,
      });

      // 클러스터러 생성
      clustererRef.current = new maps.MarkerClusterer({
        map: mapRef.current,
        averageCenter: true,
        minLevel: 7,        // 레벨이 7 이하로 축소될 때만 클러스터링 해제
        gridSize: 80,       // 클러스터 간격 픽셀(원하는 밀도로 조정)
        disableClickZoom: false,
      });

      // 공용 InfoWindow
      infoRef.current = new maps.InfoWindow({ removable: true });
    };

    if (!mapRef.current) {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(init);
      } else if (window.kakao?.maps) {
        init();
      }
    }
  }, [loading]);

  // 3) 마커 생성/클러스터러에 추가 (stations 변경 시)
  useEffect(() => {
    if (!stations.length) return;
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    const info = infoRef.current;
    if (!kakao || !map || !clusterer || !info) return;

    const { maps } = kakao;

    // 기존 마커/클러스터 초기화
    clusterer.clear(); // addMarkers로 추가했던 마커 전체 제거

    // 새 마커 생성
    const markers = stations.map(st => {
      const marker = new maps.Marker({
        position: new maps.LatLng(st.lat, st.lng),
        title: st.cpNm || st.csNm || "충전소",
      });

      // 클릭 시 공용 InfoWindow 오픈
      maps.event.addListener(marker, "click", () => {
        const html = `
          <div class="evmap-popup">
            <b>${st.cpNm || st.csNm || "충전소"}</b><br/>
            <span>${st.addr || ""}</span><br/>
            <span>타입:${st.chargeTp ?? "-"} | 방식:${st.cpTp ?? "-"}</span><br/>
            <span>상태:${st.cpStat ?? "-"}</span>
          </div>
        `;
        info.setContent(html);
        info.open(map, marker);
      });

      return marker;
    });

    // 클러스터러에 마커 추가
    clusterer.addMarkers(markers);

    // 화면에 모든 마커가 보이도록 bounds 맞춤
    const bounds = new maps.LatLngBounds();
    for (const st of stations) {
      bounds.extend(new maps.LatLng(st.lat, st.lng));
    }
    map.setBounds(bounds);

    // cleanup은 필요 시(다음 렌더 직전) clusterer.clear로 충분
  }, [stations]);

  return (
    <div>
      <Header />
      <div className="evmap-mainwrap">
        <div className="evmap-content">
          {loading ? (
            <div className="evmap-loading">전국 충전소 불러오는 중...</div>
          ) : (
            <div id="ev-map" className="evmap-map" style={{ width: "100%", height: "80vh" }} />
          )}
        </div>
      </div>
    </div>
  );
}
