import React, { useState, useEffect, useRef } from "react";
import { Navigation, MapPin, Compass, AlertCircle, Info } from "lucide-react";
import { Train, LiveGPSTrackingState } from "../types";
import { getDistanceKm } from "../data/trains";

interface GPSOverlayProps {
  activeTrain: Train;
  simulationProgress: number; // 0 to 100 representing journey percentage
}

export default function GPSOverlay({ activeTrain, simulationProgress }: GPSOverlayProps) {
  const [gpsState, setGpsState] = useState<LiveGPSTrackingState>({
    isTracking: false,
    userLatitude: null,
    userLongitude: null,
    distanceToTrainKm: null,
    closestStation: null,
    speedKmph: null,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Interpolate current train location based on simulationProgress (0 to 100)
  const getInterpolatedTrainLocation = () => {
    const stops = activeTrain.stops;
    if (stops.length === 0) return { lat: 28.6, lon: 77.2, currentSection: "Unknown" };

    const ratio = simulationProgress / 100;
    const totalDistance = stops[stops.length - 1].distanceKm;
    const targetDistance = ratio * totalDistance;

    // Find the current section
    let activeStopIndex = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      if (targetDistance >= stops[i].distanceKm && targetDistance <= stops[i + 1].distanceKm) {
        activeStopIndex = i;
        break;
      }
    }

    const startStop = stops[activeStopIndex];
    let endStop = stops[activeStopIndex + 1];
    if (!endStop) {
      endStop = startStop;
    }

    const sectionDist = endStop.distanceKm - startStop.distanceKm;
    const travelledInSection = targetDistance - startStop.distanceKm;
    const sectionRatio = sectionDist > 0 ? travelledInSection / sectionDist : 0;

    const lat = startStop.station.latitude + (endStop.station.latitude - startStop.station.latitude) * sectionRatio;
    const lon = startStop.station.longitude + (endStop.station.longitude - startStop.station.longitude) * sectionRatio;

    return {
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      from: startStop.station.name,
      to: endStop.station.name,
      ratio: sectionRatio
    };
  };

  const trainLoc = getInterpolatedTrainLocation();

  // Toggle active browser geotracking
  const toggleDeviceGPS = () => {
    if (gpsState.isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsState((prev) => ({
        ...prev,
        isTracking: false,
        userLatitude: null,
        userLongitude: null,
        distanceToTrainKm: null,
      }));
      setErrorMsg(null);
    } else {
      if (!("geolocation" in navigator)) {
        setErrorMsg("Your web browser does not support standard geolocation lookups.");
        return;
      }

      setErrorMsg("Locking onto spatial GPS signals...");
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const userSpeed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;

          const distToTrain = getDistanceKm(userLat, userLon, trainLoc.lat, trainLoc.lon);

          let minStationDistance = Infinity;
          let closestName = "";
          activeTrain.stops.forEach((s) => {
            const d = getDistanceKm(userLat, userLon, s.station.latitude, s.station.longitude);
            if (d < minStationDistance) {
              minStationDistance = d;
              closestName = `${s.station.name} (${s.station.code}) - ${d} km`;
            }
          });

          setGpsState({
            isTracking: true,
            userLatitude: userLat,
            userLongitude: userLon,
            distanceToTrainKm: distToTrain,
            closestStation: closestName,
            speedKmph: userSpeed || null,
          });
          setErrorMsg(null);
        },
        (error) => {
          console.warn("GPS Permission or signal unavailable:", error);
          let explanation = "Location access was denied. Let's use fallback simulation coordinates.";
          if (error.code === error.POSITION_UNAVAILABLE) {
            explanation = "GPS signal weak. Simulator fallback active.";
          }
          setErrorMsg(explanation);
          
          setGpsState((prev) => ({
            ...prev,
            isTracking: true,
            userLatitude: 25.45, // Fallback Prayagraj
            userLongitude: 81.83,
            distanceToTrainKm: getDistanceKm(25.45, 81.83, trainLoc.lat, trainLoc.lon),
            closestStation: "Prayagraj Jn (PRYJ)",
            speedKmph: 0
          }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    if (gpsState.isTracking && gpsState.userLatitude !== null && gpsState.userLongitude !== null) {
      const distToTrain = getDistanceKm(
        gpsState.userLatitude,
        gpsState.userLongitude,
        trainLoc.lat,
        trainLoc.lon
      );
      setGpsState((prev) => ({
        ...prev,
        distanceToTrainKm: distToTrain,
      }));
    }
  }, [simulationProgress, activeTrain]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const stops = activeTrain.stops;
  const lats = stops.map(s => s.station.latitude);
  const lons = stops.map(s => s.station.longitude);
  const minLat = Math.min(...lats) - 1.2;
  const maxLat = Math.max(...lats) + 1.2;
  const minLon = Math.min(...lons) - 1.8;
  const maxLon = Math.max(...lons) + 1.8;

  const toX = (lon: number) => {
    const ratio = (lon - minLon) / (maxLon - minLon);
    return 60 + ratio * 480; 
  };

  const toY = (lat: number) => {
    const ratio = (lat - minLat) / (maxLat - minLat);
    return 290 - ratio * 240;
  };

  return (
    <div id="gps-tracker-map-card" className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/15">
            <Compass className={`w-5 h-5 ${gpsState.isTracking ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">Live Satellite GPS Interface</h3>
            <p className="text-xs text-slate-400 font-mono">Dynamic position matrix telemetry</p>
          </div>
        </div>
        
        <button
          onClick={toggleDeviceGPS}
          className={`text-xs px-4 py-2 font-mono font-bold rounded-xl transition-all flex items-center gap-2 border ${
            gpsState.isTracking
              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/20"
          }`}
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          {gpsState.isTracking ? "DISCONNECT SATELLITE" : "CONNECT DEVICE GPS"}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-blue-500/5 text-blue-400 p-3 rounded-2xl text-[11px] font-mono flex items-center gap-2.5 border border-blue-500/15 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 text-blue-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Immersive Dark Telemetry dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 border border-white/5 rounded-2xl relative overflow-hidden">
        <div className="space-y-0.5">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Train Location</span>
          <p className="text-xs font-bold text-slate-200 font-mono">
            {trainLoc.lat.toFixed(3)}°N, {trainLoc.lon.toFixed(3)}°E
          </p>
        </div>
        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Active section</span>
          <p className="text-xs font-bold text-slate-200 font-mono truncate" title={`${trainLoc.from} → ${trainLoc.to}`}>
            {trainLoc.to}
          </p>
        </div>
        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">User Coords</span>
          <p className="text-xs font-bold text-slate-300 font-mono">
            {gpsState.isTracking && gpsState.userLatitude
              ? `${gpsState.userLatitude.toFixed(3)}°N`
              : "Disabled"}
          </p>
        </div>
        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">User spacing</span>
          <p className="text-xs font-bold text-blue-400 font-mono">
            {gpsState.isTracking && gpsState.distanceToTrainKm !== null
              ? `${gpsState.distanceToTrainKm} km`
              : "Not tracking"}
          </p>
        </div>
      </div>

      {/* SVG Interactive Map of active train path */}
      <div className="relative bg-slate-950/90 rounded-2xl p-1.5 border border-white/5 overflow-hidden shadow-inner">
        <div className="absolute top-4 left-4 bg-slate-900/80 border border-white/5 text-[9px] font-mono text-blue-400 px-2.5 py-1 rounded-lg flex items-center gap-2 z-10">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
          <span>SATELLITE SECTOR RADAR</span>
        </div>

        {/* Dynamic Map Area */}
        <div className="w-full h-72 md:h-80 select-none">
          <svg viewBox="0 0 600 350" className="w-full h-full">
            {/* Draw grid lines */}
            <defs>
              <pattern id="ggrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.06" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ggrid)" />

            {/* Draw Rail Track Lines */}
            <path
              d={activeTrain.stops.reduce((acc, current, idx) => {
                const prefix = idx === 0 ? "M" : "L";
                return `${acc} ${prefix} ${toX(current.station.longitude)} ${toY(current.station.latitude)}`;
              }, "")}
              fill="none"
              stroke="#1e293b"
              strokeWidth="5.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* Draw glowing track layer */}
            <path
              d={activeTrain.stops.reduce((acc, current, idx) => {
                const prefix = idx === 0 ? "M" : "L";
                return `${acc} ${prefix} ${toX(current.station.longitude)} ${toY(current.station.latitude)}`;
              }, "")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />

            {/* Draw Passed Stations nodes */}
            {activeTrain.stops.map((stop) => {
              const x = toX(stop.station.longitude);
              const y = toY(stop.station.latitude);
              return (
                <g key={stop.station.code}>
                  <circle
                    cx={x}
                    cy={y}
                    r={6.5}
                    fill="#020617"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={2.5}
                    fill="#60a5fa"
                  />
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="monospace"
                    className="font-bold select-none drop-shadow-md"
                  >
                    {stop.station.code}
                  </text>
                </g>
              );
            })}

            {/* Simulated Live Train Bullet blinking */}
            <g>
              <circle
                cx={toX(trainLoc.lon)}
                cy={toY(trainLoc.lat)}
                r={16}
                fill="#3b82f6"
                fillOpacity="0.2"
              >
                <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle
                cx={toX(trainLoc.lon)}
                cy={toY(trainLoc.lat)}
                r={6}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="shadow-[0_0_15px_rgba(59,130,246,0.8)]"
              />
              <text
                x={toX(trainLoc.lon)}
                y={toY(trainLoc.lat) + 21}
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="10"
                fontFamily="monospace"
                className="font-extrabold"
              >
                {activeTrain.number}
              </text>
            </g>

            {/* Draw User Spot on Map */}
            {gpsState.isTracking && gpsState.userLatitude && gpsState.userLongitude && (
              <g>
                <circle
                  cx={toX(gpsState.userLongitude)}
                  cy={toY(gpsState.userLatitude)}
                  r={18}
                  fill="#10b981"
                  fillOpacity="0.18"
                >
                  <animate attributeName="r" values="10;18;10" dur="2.5s" repeatCount="indefinite" />
                </circle>
                
                <line
                  x1={toX(gpsState.userLongitude)}
                  y1={toY(gpsState.userLatitude)}
                  x2={toX(trainLoc.lon)}
                  y2={toY(trainLoc.lat)}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                
                <circle
                  cx={toX(gpsState.userLongitude)}
                  cy={toY(gpsState.userLatitude)}
                  r={5.5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={toX(gpsState.userLongitude)}
                  y={toY(gpsState.userLatitude) + 20}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="9.5"
                  fontFamily="monospace"
                  className="font-bold select-none"
                >
                  YOU ({gpsState.distanceToTrainKm} km)
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
        <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          The rail vector updates dynamically as the train ticks from 0% to 100% of its run. Connecting your <strong>Device GPS</strong> uses your real coordinates to calculate distance offsets, aiding transit planning.
        </p>
      </div>
    </div>
  );
}
