import React, { useState, useEffect } from "react";
import { Bell, BellRing, Volume2, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { Train, DelayAlertSubscription } from "../types";

interface NotificationCenterProps {
  activeTrain: Train;
}

export default function NotificationCenter({ activeTrain }: NotificationCenterProps) {
  const [subscriptions, setSubscriptions] = useState<DelayAlertSubscription[]>([]);
  const [alertThreshold, setAlertThreshold] = useState<number>(10);
  const [simulationLogs, setSimulationLogs] = useState<{ time: string; msg: string; type: string }[]>([]);

  // Request browser Notification permissions
  const requestBrowserNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addLog("Browser notifications enabled successfully!", "success");
      } else {
        addLog("Notification permission denied or blocked.", "warning");
      }
    } else {
      addLog("Device geolocation/alerting fallback active.", "warning");
    }
  };

  const addLog = (msg: string, type: string = "info") => {
    setSimulationLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 7),
    ]);
  };

  // Play a beautiful synthesized warning tone (using browser's Web Audio API)
  const triggerAudioBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (delay: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration + 0.1);
      };

      playTone(0, 0.25, 880);
      playTone(0.3, 0.4, 1100);
    } catch (e) {
      console.warn("Audio Context sound blocked or not supported:", e);
    }
  };

  const subscribeToTrainDelay = () => {
    const newSub: DelayAlertSubscription = {
      id: Math.random().toString(),
      trainNumber: activeTrain.number,
      trainName: activeTrain.name,
      alertOnMin: alertThreshold,
      enabled: true,
      stationCode: activeTrain.stops.find(s => s.status === 'upcoming')?.station.code || "ANY"
    };

    setSubscriptions((prev) => [...prev, newSub]);
    addLog(`Subscribed to delay alerts for ${activeTrain.name} (> ${alertThreshold}m delay)`, "success");
    
    if (activeTrain.isDelayed && activeTrain.overallDelayMin >= alertThreshold) {
      setTimeout(() => {
        triggerPushAlert(
          `Delay update: ${activeTrain.name}`,
          `Train ${activeTrain.number} is running late by ${activeTrain.overallDelayMin} mins near scheduled milestone.`
        );
      }, 800);
    }
  };

  const triggerPushAlert = (title: string, body: string) => {
    triggerAudioBeep();
    
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: body,
          tag: "train-delay-alert"
        });
      } catch (err) {
        console.warn("Standard notification failed inside sandbox iframe: ", err);
      }
    }

    addLog(`🔔 [PUSH SENT] ${title}: "${body}"`, "alert");
  };

  const toggleSub = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const removeSub = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const simulateDelaySpike = () => {
    const randomDelay = Math.floor(Math.random() * 25) + 15;
    const station = activeTrain.stops.find(s => s.status === 'upcoming')?.station.name || " upcoming station";
    
    triggerPushAlert(
      `⚠️ Running Status Delay Spike`,
      `Live update: ${activeTrain.name} (${activeTrain.number}) delay has SPIKED to ${randomDelay} minutes near ${station} due to local track maintenance.`
    );
  };

  return (
    <div id="notification-center-card" className="bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl p-5 shadow-2xl flex flex-col h-[520px] relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-500/10 rounded-xl text-red-400 border border-red-500/15 animate-pulse">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base">Push Alert Center</h3>
            <p className="text-xs text-slate-400 font-mono">Live latency & platform alarms</p>
          </div>
        </div>
        <button
          onClick={requestBrowserNotifications}
          className="text-[10px] px-3 py-1 font-mono font-bold border border-white/5 hover:border-blue-500/30 rounded-lg text-slate-300 hover:text-blue-400 transition-all uppercase"
        >
          Enable Alerts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* Settings Box */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-3.5">
          <div className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Delay threshold settings</div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-300 font-medium">Alert if delay exceeds:</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-12 text-center bg-slate-900 border border-white/5 text-slate-100 text-xs font-mono font-bold rounded-lg p-1 outline-none focus:ring-1 focus:ring-blue-500/30"
              />
              <span className="text-xs text-slate-400 font-mono">mins</span>
            </div>
          </div>

          <button
            onClick={subscribeToTrainDelay}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/15"
          >
            <BellRing className="w-3.5 h-3.5" />
            Watch "{activeTrain.number}" Now
          </button>
        </div>

        {/* Subscriptions */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest font-mono">ACTIVE TRIP ALARM SUBSCRIPTIONS</div>
          {subscriptions.length === 0 ? (
            <div className="text-center p-4 bg-slate-950/40 border border-dashed border-white/5 rounded-2xl text-xs text-slate-500 font-mono">
              No active delay alarms set for this trip.
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${sub.enabled ? "bg-red-400 animate-pulse" : "bg-slate-600"}`} />
                    <div>
                      <div className="font-bold text-slate-200">Train {sub.trainNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Alert delay &gt;= {sub.alertOnMin}m</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSub(sub.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all uppercase border ${
                        sub.enabled 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-slate-800 text-slate-400 border-white/5"
                      }`}
                    >
                      {sub.enabled ? "MAPPED" : "MUTED"}
                    </button>
                    <button
                      onClick={() => removeSub(sub.id)}
                      className="text-slate-500 hover:text-slate-300 font-bold px-1 text-base"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sandbox Actions */}
        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">TEST SANDBOX TRIGGER</span>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/20 uppercase">Interactive</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={simulateDelaySpike}
              className="flex-1 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Simulate Delay Spike
            </button>
            <button
              onClick={() => triggerPushAlert("🟢 Signal cleared", `Clear parameters near next sector. Train ${activeTrain.number} accelerating.`)}
              className="px-3 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 rounded-xl flex items-center justify-center border border-white/5"
              title="Test alert sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Real-time alert logs */}
      <div className="bg-slate-950/80 rounded-2xl p-3 border border-white/5 font-mono text-[10.5px] text-emerald-400 max-h-36 min-h-[110px] overflow-y-auto">
        <div className="font-bold text-slate-400 mb-1.5 flex items-center justify-between border-b border-white/5 pb-1">
          <span>Push Notification Log</span>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 rounded animate-pulse">FEED MATCH</span>
        </div>
        {simulationLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-4 font-mono italic">Listening for satellite alarm ticks...</div>
        ) : (
          <div className="space-y-1.5">
            {simulationLogs.map((log, index) => (
              <div key={index} className="leading-tight">
                <span className="text-slate-500">[{log.time}]</span>{" "}
                <span
                  className={
                    log.type === "success"
                      ? "text-emerald-300"
                      : log.type === "alert"
                      ? "text-red-400 font-semibold shadow-inner"
                      : log.type === "warning"
                      ? "text-amber-400"
                      : "text-slate-300"
                  }
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
