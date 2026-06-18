import React, { useState, useEffect, useMemo } from "react";
import {
  Train as TrainIcon,
  Search,
  Play,
  Pause,
  Clock,
  Sliders,
  MapPin,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  Activity,
  AlertCircle,
  HelpCircle,
  Cpu,
  Tv
} from "lucide-react";
import { POPULAR_TRAINS } from "./data/trains";
import { Train, Stop } from "./types";
import GPSOverlay from "./components/GPSOverlay";
import AICopilot from "./components/AICopilot";
import NotificationCenter from "./components/NotificationCenter";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trains, setTrains] = useState<Train[]>(POPULAR_TRAINS);
  const [selectedTrainNum, setSelectedTrainNum] = useState("22436"); // Default Vande Bharat

  const [isSearchingDynamic, setIsSearchingDynamic] = useState(false);
  const [dynamicSearchError, setDynamicSearchError] = useState("");
  
  // Real-time journey simulation parameters
  const [simulationProgress, setSimulationProgress] = useState(38); // 38% completed trigger point
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeedFactor, setSimSpeedFactor] = useState(2); // delay multiplier

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Fetch train lists from server on mount
  useEffect(() => {
    fetch("/api/trains")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTrains(data);
        }
      })
      .catch((err) => console.warn("Error loading trains from server, using pre-defined:", err));
  }, []);

  // Clock interval update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Journey autoplay progression
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimulationProgress((prev) => {
          if (prev >= 100) {
            return 0; // Loop around loop path
          }
          return prev + 1;
        });
      }, 3500 - (simSpeedFactor * 1000));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, simSpeedFactor]);

  // Find active train data
  const activeTrainData = useMemo(() => {
    const found = trains.find((t) => t.number === selectedTrainNum) || POPULAR_TRAINS.find((t) => t.number === selectedTrainNum);
    if (!found) return trains[0] || POPULAR_TRAINS[0];

    // Calculate Stop status segments dynamically based on simulation mileage progress
    const totalDist = found.stops[found.stops.length - 1].distanceKm;
    const currentSimmedKm = (simulationProgress / 100) * totalDist;

    const updatedStops = found.stops.map((stop, sIdx) => {
      let status: "passed" | "current" | "upcoming" = "upcoming";
      
      // Determine if train has passed this stop
      if (currentSimmedKm > stop.distanceKm) {
        status = "passed";
      }

      const distDiff = Math.abs(currentSimmedKm - stop.distanceKm);
      const isInsideHaltMargin = distDiff < 25;
      
      if (isInsideHaltMargin) {
        const isClosest = found.stops.every(
          (otherStop) => Math.abs(currentSimmedKm - otherStop.distanceKm) >= distDiff
        );
        if (isClosest) {
          status = "current";
        }
      }

      return {
        ...stop,
        status
      };
    });

    let computedSpeed = found.currentSpeedKmph;
    const isCurrentlyStationed = updatedStops.some((s) => s.status === "current");
    
    if (isCurrentlyStationed) {
      computedSpeed = 0; // stopped at station platform
    } else {
      const cycle = Math.floor(simulationProgress) % 10;
      computedSpeed = computedSpeed > 0 ? (computedSpeed - 15 + cycle * 3) : 0;
    }

    return {
      ...found,
      currentSpeedKmph: computedSpeed,
      stops: updatedStops
    };
  }, [selectedTrainNum, simulationProgress, trains]);

  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      const matchText = (t.number + " " + t.name + " " + t.origin + " " + t.destination).toLowerCase();
      return matchText.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, trains]);

  const handleDynamicSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingDynamic(true);
    setDynamicSearchError("");
    try {
      const res = await fetch("/api/trains/search-dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm }),
      });
      const data = await res.json();
      if (data.success && data.train) {
        setTrains((prev) => {
          if (prev.some((t) => t.number === data.train.number)) return prev;
          return [...prev, data.train];
        });
        setSelectedTrainNum(data.train.number);
        setSearchTerm("");
      } else {
        setDynamicSearchError(data.error || "Generation could not construct route. Try a name or a generic 5-digit number.");
      }
    } catch (err) {
      console.error("Dynamic route error:", err);
      setDynamicSearchError("Pulse link busy. Tried fallback, please try with another train query.");
    } finally {
      setIsSearchingDynamic(false);
    }
  };

  return (
    <div id="full-app-container" className="min-h-screen bg-[#020617] text-slate-100 flex flex-col antialiased relative overflow-x-hidden">
      
      {/* Decorative Glowing Indian tricolor top rail status bar */}
      <div className="h-1.5 w-full flex opacity-85 z-20">
        <div className="h-full bg-orange-500 shadow-[0_1px_10px_rgba(239,127,26,0.5)] flex-1" />
        <div className="h-full bg-slate-300 flex-1" />
        <div className="h-full bg-emerald-600 shadow-[0_1px_10px_rgba(16,185,129,0.5)] flex-1" />
      </div>

      {/* Layered interactive visual radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.15),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(239,68,68,0.08),transparent_45%)] pointer-events-none z-0" />

      {/* Immersive Header */}
      <header className="h-20 border-b border-white/5 backdrop-blur-md bg-slate-900/40 px-6 md:px-8 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          {/* Logo with live pulse glow */}
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <TrainIcon className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white antialiased">
                RailPulse <span className="text-blue-500 text-sm font-semibold ml-1">Live Status</span>
              </h1>
              <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20 px-2 py-0.5 rounded animate-pulse">
                v2.6 Live-DB
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Indian Railways National Running Network
            </p>
          </div>
        </div>

        {/* Clock & Real-time Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right font-mono text-xs">
            <span className="text-[10px] text-slate-500">Live Server Clock (IST)</span>
            <span className="text-slate-200 font-bold tracking-tight text-sm">{currentTime}</span>
          </div>

          <div className="px-4 py-2 bg-slate-800/65 rounded-full border border-slate-700/60 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
            <span className="text-xs font-mono text-slate-300 font-medium">GPS Linked</span>
          </div>
        </div>
      </header>

      {/* Immersive Content Frame Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 space-y-6 relative z-10">
        
        {/* Row 1: Search panel with Glassmorphism styles */}
        <section id="train-search-section" className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input bar */}
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lookup standard or custom train (e.g., Kerala Express, 12626)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 text-xs rounded-xl text-slate-100 placeholder-slate-500 transition-all font-mono font-medium"
              />
            </div>

            {/* popular train Quick Chips select */}
            <div className="w-full lg:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1.5 font-mono">
                Active Fleet ({trains.length}):
              </span>
              {trains.slice(0, 5).map((train) => (
                <button
                  key={train.number}
                  onClick={() => setSelectedTrainNum(train.number)}
                  className={`text-xs px-3.5 py-1.5 font-medium rounded-xl transition-all whitespace-nowrap border shrink-0 font-mono ${
                    selectedTrainNum === train.number
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/65"
                  }`}
                >
                  {train.type === "Vande Bharat" ? "⚡" : "🚄"} {train.number} - {train.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick search match dropdown list */}
          {searchTerm && (
            <div className="mt-2 bg-slate-950/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 max-h-80 overflow-y-auto">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 flex items-center justify-between font-mono">
                <span>Matching Systems ({filteredTrains.length})</span>
                {isSearchingDynamic && <span className="text-blue-400 animate-pulse">Telemetry Active</span>}
              </div>
              
              {filteredTrains.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono space-y-3">
                  <p className="text-slate-400">"{searchTerm}" is not loaded in local cache.</p>
                  <button
                    onClick={handleDynamicSearch}
                    disabled={isSearchingDynamic}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 mx-auto shadow-lg shadow-blue-500/20 transition-all font-sans cursor-pointer"
                  >
                    {isSearchingDynamic ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-white" />
                        Querying AI & GPS Satellite...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        Query National Indian Rail DB
                      </>
                    )}
                  </button>
                  {dynamicSearchError && (
                    <p className="text-rose-400 text-[11px] font-mono">{dynamicSearchError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredTrains.map((item) => (
                      <button
                        key={item.number}
                        onClick={() => {
                          setSelectedTrainNum(item.number);
                          setSearchTerm("");
                        }}
                        className="text-left p-2.5 bg-slate-900/60 border border-white/5 hover:border-blue-500/50 rounded-xl transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-400 font-mono">{item.number}</span>
                          <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 rounded">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 font-medium truncate">{item.name}</div>
                        <div className="text-[9.5px] text-slate-400 mt-1.5 flex items-center gap-1 truncate font-mono">
                          <span className="text-slate-300">{item.origin.split(" (")[0]}</span>
                          <ArrowRightLeft className="w-2.5 h-2.5 text-slate-600" />
                          <span className="text-slate-300">{item.destination.split(" (")[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic generation trigger panel inside dropdown */}
                  <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Searching for an unlisted train? Query Indian Railways satellite DB:
                    </span>
                    <button
                      onClick={handleDynamicSearch}
                      disabled={isSearchingDynamic}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 font-bold rounded-xl flex items-center gap-2 transition-all font-mono shadow"
                    >
                      {isSearchingDynamic ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          Locating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          AI Satellite Fetch
                        </>
                      )}
                    </button>
                  </div>
                  {dynamicSearchError && (
                    <p className="text-rose-400 text-center text-[11px] font-mono">{dynamicSearchError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Row 2: Train running telemetry with dark/glowing bento theme */}
        <section id="train-telemetry-summary" className="bg-slate-900/80 rounded-3xl border border-white/5 text-white p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between relative z-10">
            
            {/* Col Left: Static identifiers */}
            <div className="space-y-3.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-600 text-white font-bold font-mono text-[11px] px-2.5 py-0.5 rounded-lg shadow-sm shadow-blue-500/15">
                  {activeTrainData.number}
                </span>
                <span className="bg-white/5 border border-white/5 font-semibold font-mono text-[10px] px-2.5 py-0.5 rounded-lg text-slate-300">
                  {activeTrainData.type} EXPRESS
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Telemetry Sunk
                </div>
              </div>

              <div>
                <h2 className="font-sans font-extrabold text-xl md:text-3xl text-white tracking-tight leading-tight uppercase">
                  {activeTrainData.name}
                </h2>
                <div className="text-sm text-slate-400 flex items-center gap-2.5 mt-1">
                  <span className="font-semibold text-slate-300">{activeTrainData.origin}</span>
                  <span className="text-blue-500 font-black">→</span>
                  <span className="font-semibold text-slate-300">{activeTrainData.destination}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                <div>
                  Route Path: <span className="text-slate-200 font-semibold">{activeTrainData.totalDistanceKm} KM</span>
                </div>
                <div>
                  Service Schedule:{" "}
                  <span className="text-blue-400 font-semibold">
                    {activeTrainData.runningDays.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Col Right: Metrics dashboards & Glowing indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-white/5 shrink-0 min-w-[325px] sm:min-w-[420px]">
              
              {/* SPEEDMETER */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Running Velocity</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-bold text-blue-400 tracking-tight">
                    {activeTrainData.currentSpeedKmph}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">km/h</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeTrainData.currentSpeedKmph > 0 ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]" : "bg-rose-500"}`} />
                  <span className="font-semibold">{activeTrainData.currentSpeedKmph > 0 ? "TRANSIT BLOCKS" : "STATION HALT"}</span>
                </div>
              </div>

              {/* DELAY FORECAST CHIP */}
              <div className="space-y-1 border-l border-white/5 pl-4">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Delay status</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-mono font-bold tracking-tight ${activeTrainData.isDelayed ? "text-orange-400" : "text-emerald-400"}`}>
                    {activeTrainData.isDelayed ? `+${activeTrainData.overallDelayMin}` : "00"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">mins</span>
                </div>
                <span className="text-[10.5px] text-slate-400 block font-semibold truncate uppercase tracking-wider font-mono">
                  {activeTrainData.isDelayed ? "LATENCY clearance" : "ON SCHEDULE"}
                </span>
              </div>

              {/* SIMULATION MILEAGE */}
              <div className="space-y-1 border-l border-white/5 pl-4 col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Mile Tracker</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-teal-400 tracking-tight">
                    {simulationProgress}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">done</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono truncate">
                  {Math.round((simulationProgress / 100) * activeTrainData.totalDistanceKm)} / {activeTrainData.totalDistanceKm} km
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* Splitscreen Workspace Columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side Column: Config sliders & stops timetabling */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Simulation Controller Panel with glassmorphism */}
            <article id="simulation-controlls" className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-slate-200 text-xs font-mono uppercase tracking-wider">Simulation System Deck</h3>
                </div>
                <div className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                  ACTIVE FEEDER
                </div>
              </div>

              <div className="space-y-4">
                {/* Distance range slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Position along path:</span>
                    <span className="font-bold text-blue-400">{simulationProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulationProgress}
                    onChange={(e) => setSimulationProgress(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1 rounded-lg cursor-pointer bg-slate-800"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Origin Terminal</span>
                    <span>Route Midpoint</span>
                    <span>Destination</span>
                  </div>
                </div>

                {/* Autoplay & Play parameters */}
                <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isPlaying 
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/15" 
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                      title={isPlaying ? "Pause automatic position progression" : "Resume automatic position progression"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        {isPlaying ? "Autoplay Active" : "Autoplay Halted"}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Tick resolution updates coordinates.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">Timer:</span>
                    <select
                      value={simSpeedFactor}
                      onChange={(e) => setSimSpeedFactor(parseInt(e.target.value))}
                      className="bg-slate-900 border border-white/5 rounded p-1 text-[11px] font-mono text-slate-300 outline-none"
                    >
                      <option value="1">1x (Eco)</option>
                      <option value="2">2x (Std)</option>
                      <option value="3">3x (Turbo)</option>
                    </select>
                  </div>
                </div>
              </div>
            </article>

            {/* Route Stops Timeline with stunning status highlight */}
            <div id="timeline-halts-card" className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Route checkpoint milestones</span>
                <span className="text-[10px] text-slate-500 font-mono">Live schedule timings</span>
              </div>

              <div className="relative pl-6 space-y-5">
                {/* Micro vertical route railway track */}
                <div className="absolute top-2.5 bottom-2.5 left-2 w-[1px] bg-slate-800" />
                <div
                  className="absolute top-2.5 left-2 w-[1.5px] bg-gradient-to-b from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300"
                  style={{
                    height: `${Math.min(100, Math.max(0, (simulationProgress / 100) * 100))}%`
                  }}
                />

                {/* Stations blocks */}
                {activeTrainData.stops.map((stop: Stop, idx: number) => {
                  const isPassed = stop.status === "passed";
                  const isCurrent = stop.status === "current";
                  const isUpcoming = stop.status === "upcoming";

                  return (
                    <div key={stop.station.code} className="relative flex items-start gap-4 text-xs transition-opacity duration-300">
                      
                      {/* Checkpoint nodes styled beautifully */}
                      <div className="absolute -left-6 top-1 z-10 flex items-center justify-center">
                        {isPassed && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 border border-slate-950 flex items-center justify-center text-white text-[8px] font-bold shadow-[0_0_6px_rgba(37,99,235,0.4)]">
                            ✓
                          </div>
                        )}
                        {isCurrent && (
                          <div className="w-5 h-5 rounded-xl bg-blue-500 border border-[#020617] flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                        {isUpcoming && (
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-slate-900" />
                        )}
                      </div>

                      {/* Content card */}
                      <div className={`flex-1 min-w-0 p-3.5 rounded-2xl border transition-all ${
                        isCurrent 
                          ? "bg-white/5 border-blue-500/30" 
                          : isPassed 
                          ? "bg-slate-950/20 border-white/5 opacity-70" 
                          : "bg-slate-950/40 border-white/5"
                      }`}>
                        
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-semibold text-slate-100 text-sm truncate">
                            {stop.station.name} ({stop.station.code})
                          </span>
                          <span className="bg-slate-800 text-slate-400 font-mono font-bold text-[9.5px] px-2 py-0.5 rounded border border-white/5">
                            PF {stop.platformNo || "1"}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono">
                          {stop.station.state} Railway Division • {stop.distanceKm} km milestone
                        </div>

                        {/* Scheduled time comparison */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase font-sans font-medium">Scheduled Halt</span>
                            <span className="text-slate-400 block mt-0.5">
                              {stop.scheduledArrival === "Source" ? "Source" : stop.scheduledArrival} → {stop.scheduledDeparture === "Destination" ? "Terminus" : stop.scheduledDeparture}
                            </span>
                          </div>
                          <div className="border-l border-white/5 pl-2">
                            <span className="text-slate-500 block text-[9.5px] uppercase font-sans font-medium">Actual Time Match</span>
                            <span className={`block font-bold mt-0.5 ${stop.departureDelayMin > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                              {stop.actualArrival === "Source" ? "Source" : stop.actualArrival} → {stop.actualDeparture === "Destination" ? "Terminus" : stop.actualDeparture}
                            </span>
                          </div>
                        </div>

                        {/* delay tags */}
                        {stop.departureDelayMin > 0 && (
                          <div className="mt-2 text-[10.5px] text-orange-400 font-semibold font-mono flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Late arrivals check (+{stop.departureDelayMin} mins)
                          </div>
                        )}
                        {stop.departureDelayMin === 0 && !isUpcoming && (
                          <div className="mt-2 text-[10.5px] text-emerald-400 font-semibold font-mono flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                            On Time clearance
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side Column: GPS map overlay + AI interaction controllers */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* GPS Map overlay with Immersive UI wrapper border line spacing */}
            <div className="p-0.5 bg-gradient-to-br from-white/10 to-transparent rounded-3xl">
              <GPSOverlay activeTrain={activeTrainData} simulationProgress={simulationProgress} />
            </div>

            {/* Bottom splitscreens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* AI Copilot chat */}
              <div className="md:col-span-1">
                <AICopilot activeTrain={activeTrainData} />
              </div>

              {/* Push Alarm notifier */}
              <div className="md:col-span-1">
                <NotificationCenter activeTrain={activeTrainData} />
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Immersive Footer */}
      <footer className="h-20 bg-slate-950/80 border-t border-white/5 px-6 md:px-8 mt-auto z-10 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center md:text-left gap-2.5 py-4">
        <div>
          © {new Date().getFullYear()} RailPulse Systems (Indian Government NIC Network Link)
        </div>
        <div className="flex gap-4">
          <span>Simulation Refresh Rate: 1.5Hz</span>
          <span className="text-blue-500">Satellite Link: Secure (SSL/GPS)</span>
        </div>
      </footer>
    </div>
  );
}
