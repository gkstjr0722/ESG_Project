import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import '../CSS/Sub.css';
import Header from '../component/Header';
// Header나 CSS는 기존 것 그대로 사용하면 됩니다.

const DEFAULT_CENTER = { lat: 35.1595, lng: 126.8526 }; // 광주광역시 중심 좌표
const DEFAULT_LEVEL = 12; // 전국 스케일

export default function MapEVCharger() {
  const [loading, setLoading] = useState(true);
 // 'ev' | 'elec'

  // 🔹 추가: 전기공사업체 전용 상태 + 탭 상태
  const [contractors, setContractors] = useState([]);
  const [selectedTab, setSelectedTab] = useState('ev');

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
          "/api/proxy/manage",
          { params: { limit: 5000 } }
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

    if (selectedTab === 'ev') {
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
    }

    return () => { alive = false; };
  }, [selectedTab]);

  // 🔹 전기공사업체 데이터 로드 (미리 생성된 좌표 JSON 사용)
  useEffect(() => {
    let alive = true;

    async function fetchEC() {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/ec/points');

        const list = Array.isArray(data) ? data : (data?.items || []);
        const cleaned = list
          .map(d => ({
            ...d,
            lat: Number(d.lat),
            lng: Number(d.lng),
          }))
          .filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lng));

        if (!alive) return;
        setContractors(cleaned);

        // 🔎 콘솔로 위도/경도 확인
        cleaned.forEach((c, i) => {
          console.log(`[Geocode ${i + 1}] ${c.addr} → lat: ${c.lat}, lng: ${c.lng}`);
        });
        console.log(`총 ${cleaned.length}건 좌표 확인`);
      } catch (e) {
        console.error(e);
        alert("전기공사업체 좌표 데이터 요청 실패");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (selectedTab === 'elec') fetchEC();
    return () => { alive = false; };
  }, [selectedTab]);

  // 2) 지도/클러스터러 초기화 (최초 1회)
  useEffect(() => {
    if (loading) return;

    const container = document.getElementById("ev-map");
    if (!container) return;

    const init = () => {
      const { maps } = window.kakao;
      kakaoRef.current = window.kakao;

      mapRef.current = new maps.Map(container, {
        center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        level: DEFAULT_LEVEL,
      });

      clustererRef.current = new maps.MarkerClusterer({
        map: mapRef.current,
        averageCenter: true,
        minLevel: 7,
        gridSize: 80,
        disableClickZoom: false,
      });

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
    if (selectedTab !== 'ev') return;
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    const info = infoRef.current;
    if (!kakao || !map || !clusterer || !info) return;

    const { maps } = kakao;

    clusterer.clear();

    const markers = stations.map(st => {
      const marker = new maps.Marker({
        position: new maps.LatLng(st.lat, st.lng),
        title: st.cpNm || st.csNm || "충전소",
      });

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

    clusterer.addMarkers(markers);

    const bounds = new maps.LatLngBounds();
    for (const st of stations) {
      bounds.extend(new maps.LatLng(st.lat, st.lng));
    }
    map.setBounds(bounds);
  }, [stations, selectedTab]);

  // 🔹 전기공사업체 마커 생성(전용)
  useEffect(() => {
    if (!contractors.length) return;
    if (selectedTab !== 'elec') return;
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    const info = infoRef.current;
    if (!kakao || !map || !clusterer || !info) return;

    clusterer.clear();

    const { maps } = kakao;
    const markers = contractors.map(st => {
      const marker = new maps.Marker({
        position: new maps.LatLng(st.lat, st.lng),
        title: st.name || "전기공사업체",
      });
      maps.event.addListener(marker, "click", () => {
        const html = `
          <div class="evmap-popup">
            <b>${st.name || "전기공사업체"}</b><br/>
            <span>${st.addr || ""}</span><br/>
            ${st.tel ? `<span>☎ ${st.tel}</span>` : ""}
          </div>
        `;
        info.setContent(html);
        info.open(map, marker);
      });
      return marker;
    });

    clusterer.addMarkers(markers);

    const bounds = new maps.LatLngBounds();
    for (const st of contractors) {
      bounds.extend(new maps.LatLng(st.lat, st.lng));
    }
    map.setBounds(bounds);
  }, [contractors, selectedTab]);

  return (
    <div>
      <Header />
      <div className="cTab">
        <button
          type="button"
          className={selectedTab === 'ev' ? 'active' : ''}
          onClick={() => setSelectedTab('ev')}
        >
          전기차 충전소
        </button>
        <button
          type="button"
          className={selectedTab === 'elec' ? 'active' : ''}
          onClick={() => setSelectedTab('elec')}
        >
          전기공사
        </button>
      </div>

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
