export interface Station {
  code: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface Stop {
  station: Station;
  scheduledArrival: string; // "HH:MM" format
  scheduledDeparture: string; // "HH:MM" format
  actualArrival: string; // "HH:MM" format
  actualDeparture: string; // "HH:MM" format
  departureDelayMin: number; // minutes delay
  arrivalDelayMin: number; // minutes delay
  distanceKm: number; // cumulative distance from start
  status: "passed" | "current" | "upcoming";
  platformNo: number;
}

export interface Train {
  number: string; // e.g. "12301"
  name: string; // e.g. "Howrah Rajdhani Express"
  type: string; // e.g. "Rajdhani", "Shatabdi", "Vande Bharat", "Express"
  origin: string; // Station Name
  destination: string; // Station Name
  totalDistanceKm: number;
  runningDays: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  stops: Stop[];
  currentSpeedKmph: number;
  isDelayed: boolean;
  overallDelayMin: number;
  lastUpdated: string; // ISO string or relative
}

export interface DelayAlertSubscription {
  id: string;
  trainNumber: string;
  trainName: string;
  alertOnMin: number; // Trigger warning if delay exceeds this
  enabled: boolean;
  stationCode: string; // Station to alert before reaching
}

export interface LiveGPSTrackingState {
  isTracking: boolean;
  userLatitude: number | null;
  userLongitude: number | null;
  distanceToTrainKm: number | null;
  closestStation: string | null;
  speedKmph: number | null;
}
