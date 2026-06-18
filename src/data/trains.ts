import { Train } from "../types";

export const POPULAR_TRAINS: Train[] = [
  {
    number: "22436",
    name: "New Delhi - Varanasi Vande Bharat Express",
    type: "Vande Bharat",
    origin: "New Delhi (NDLS)",
    destination: "Varanasi Jn (BSB)",
    totalDistanceKm: 755,
    runningDays: ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
    currentSpeedKmph: 115,
    isDelayed: true,
    overallDelayMin: 12,
    lastUpdated: new Date().toLocaleTimeString(),
    stops: [
      {
        station: { code: "NDLS", name: "New Delhi", state: "Delhi", latitude: 28.6415, longitude: 77.2193 },
        scheduledArrival: "Source",
        scheduledDeparture: "06:00",
        actualArrival: "Source",
        actualDeparture: "06:10",
        departureDelayMin: 10,
        arrivalDelayMin: 0,
        distanceKm: 0,
        status: "passed",
        platformNo: 11
      },
      {
        station: { code: "CNB", name: "Kanpur Central", state: "Uttar Pradesh", latitude: 26.4547, longitude: 80.3497 },
        scheduledArrival: "10:08",
        scheduledDeparture: "10:10",
        actualArrival: "10:18",
        actualDeparture: "10:22",
        departureDelayMin: 12,
        arrivalDelayMin: 10,
        distanceKm: 440,
        status: "passed",
        platformNo: 3
      },
      {
        station: { code: "PRYJ", name: "Prayagraj Jn", state: "Uttar Pradesh", latitude: 25.4497, longitude: 81.8284 },
        scheduledArrival: "12:08",
        scheduledDeparture: "12:10",
        actualArrival: "12:20",
        actualDeparture: "12:22",
        departureDelayMin: 12,
        arrivalDelayMin: 12,
        distanceKm: 635,
        status: "upcoming", // We treat this one as current target
        platformNo: 6
      },
      {
        station: { code: "BSB", name: "Varanasi Jn", state: "Uttar Pradesh", latitude: 25.3268, longitude: 82.9876 },
        scheduledArrival: "14:00",
        scheduledDeparture: "Destination",
        actualArrival: "14:15",
        actualDeparture: "Destination",
        departureDelayMin: 0,
        arrivalDelayMin: 15,
        distanceKm: 755,
        status: "upcoming",
        platformNo: 1
      }
    ]
  },
  {
    number: "12301",
    name: "Howrah Rajdhani Express",
    type: "Rajdhani",
    origin: "Howrah Jn (HWH)",
    destination: "New Delhi (NDLS)",
    totalDistanceKm: 1450,
    runningDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    currentSpeedKmph: 128,
    isDelayed: false,
    overallDelayMin: 0,
    lastUpdated: new Date().toLocaleTimeString(),
    stops: [
      {
        station: { code: "HWH", name: "Howrah Jn", state: "West Bengal", latitude: 22.5834, longitude: 88.3415 },
        scheduledArrival: "Source",
        scheduledDeparture: "16:50",
        actualArrival: "Source",
        actualDeparture: "16:50",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 0,
        status: "passed",
        platformNo: 9
      },
      {
        station: { code: "ASN", name: "Asansol Jn", state: "West Bengal", latitude: 23.6828, longitude: 86.9749 },
        scheduledArrival: "18:57",
        scheduledDeparture: "18:59",
        actualArrival: "18:57",
        actualDeparture: "18:59",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 200,
        status: "passed",
        platformNo: 2
      },
      {
        station: { code: "GAYA", name: "Gaya Jn", state: "Bihar", latitude: 24.8016, longitude: 84.9994 },
        scheduledArrival: "22:15",
        scheduledDeparture: "22:18",
        actualArrival: "22:15",
        actualDeparture: "22:18",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 459,
        status: "passed",
        platformNo: 1
      },
      {
        station: { code: "DDU", name: "Pt Deen Dayal Upadhyaya Jn", state: "Uttar Pradesh", latitude: 25.2818, longitude: 83.0232 },
        scheduledArrival: "00:45",
        scheduledDeparture: "00:55",
        actualArrival: "00:45",
        actualDeparture: "00:55",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 664,
        status: "upcoming",
        platformNo: 5
      },
      {
        station: { code: "PRYJ", name: "Prayagraj Jn", state: "Uttar Pradesh", latitude: 25.4497, longitude: 81.8284 },
        scheduledArrival: "02:43",
        scheduledDeparture: "02:45",
        actualArrival: "02:43",
        actualDeparture: "02:45",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 814,
        status: "upcoming",
        platformNo: 2
      },
      {
        station: { code: "CNB", name: "Kanpur Central", state: "Uttar Pradesh", latitude: 26.4547, longitude: 80.3497 },
        scheduledArrival: "04:50",
        scheduledDeparture: "04:55",
        actualArrival: "04:50",
        actualDeparture: "04:55",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 1010,
        status: "upcoming",
        platformNo: 1
      },
      {
        station: { code: "NDLS", name: "New Delhi", state: "Delhi", latitude: 28.6415, longitude: 77.2193 },
        scheduledArrival: "09:55",
        scheduledDeparture: "Destination",
        actualArrival: "09:55",
        actualDeparture: "Destination",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 1450,
        status: "upcoming",
        platformNo: 16
      }
    ]
  },
  {
    number: "12002",
    name: "New Delhi - Rani Kamlapati Shatabdi Express",
    type: "Shatabdi",
    origin: "New Delhi (NDLS)",
    destination: "Rani Kamlapati (RKMP)",
    totalDistanceKm: 702,
    runningDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    currentSpeedKmph: 0,
    isDelayed: false,
    overallDelayMin: 0,
    lastUpdated: new Date().toLocaleTimeString(),
    stops: [
      {
        station: { code: "NDLS", name: "New Delhi", state: "Delhi", latitude: 28.6415, longitude: 77.2193 },
        scheduledArrival: "Source",
        scheduledDeparture: "06:00",
        actualArrival: "Source",
        actualDeparture: "06:00",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 0,
        status: "passed",
        platformNo: 1
      },
      {
        station: { code: "MTJ", name: "Mathura Jn", state: "Uttar Pradesh", latitude: 27.4924, longitude: 77.6743 },
        scheduledArrival: "07:19",
        scheduledDeparture: "07:20",
        actualArrival: "07:21",
        actualDeparture: "07:22",
        departureDelayMin: 2,
        arrivalDelayMin: 2,
        distanceKm: 141,
        status: "passed",
        platformNo: 1
      },
      {
        station: { code: "AGC", name: "Agra Cantt", state: "Uttar Pradesh", latitude: 27.1587, longitude: 77.9944 },
        scheduledArrival: "07:50",
        scheduledDeparture: "07:55",
        actualArrival: "07:52",
        actualDeparture: "07:57",
        departureDelayMin: 2,
        arrivalDelayMin: 2,
        distanceKm: 195,
        status: "passed",
        platformNo: 1
      },
      {
        station: { code: "GWL", name: "Gwalior Jn", state: "Madhya Pradesh", latitude: 26.2163, longitude: 78.1884 },
        scheduledArrival: "09:23",
        scheduledDeparture: "09:25",
        actualArrival: "09:23",
        actualDeparture: "09:25",
        distanceKm: 313,
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        status: "passed",
        platformNo: 2
      },
      {
        station: { code: "VGLJ", name: "VGL Jhansi Jn", state: "Uttar Pradesh", latitude: 25.4484, longitude: 78.5685 },
        scheduledArrival: "10:45",
        scheduledDeparture: "10:50",
        actualArrival: "11:25",
        actualDeparture: "11:30",
        departureDelayMin: 40,
        arrivalDelayMin: 40,
        distanceKm: 411,
        status: "current", // Currenlty stopped
        platformNo: 1
      },
      {
        station: { code: "BPL", name: "Bhopal Jn", state: "Madhya Pradesh", latitude: 23.2599, longitude: 77.4126 },
        scheduledArrival: "14:07",
        scheduledDeparture: "14:10",
        actualArrival: "14:47",
        actualDeparture: "14:50",
        departureDelayMin: 40,
        arrivalDelayMin: 40,
        distanceKm: 694,
        status: "upcoming",
        platformNo: 1
      },
      {
        station: { code: "RKMP", name: "Rani Kamlapati", state: "Madhya Pradesh", latitude: 23.2081, longitude: 77.4526 },
        scheduledArrival: "14:40",
        scheduledDeparture: "Destination",
        actualArrival: "15:20",
        actualDeparture: "Destination",
        departureDelayMin: 0,
        arrivalDelayMin: 40,
        distanceKm: 702,
        status: "upcoming",
        platformNo: 5
      }
    ]
  },
  {
    number: "12952",
    name: "Mumbai Rajdhani Express",
    type: "Rajdhani",
    origin: "New Delhi (NDLS)",
    destination: "Mumbai Central (MMCT)",
    totalDistanceKm: 1386,
    runningDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    currentSpeedKmph: 110,
    isDelayed: false,
    overallDelayMin: 0,
    lastUpdated: new Date().toLocaleTimeString(),
    stops: [
      {
        station: { code: "NDLS", name: "New Delhi", state: "Delhi", latitude: 28.6415, longitude: 77.2193 },
        scheduledArrival: "Source",
        scheduledDeparture: "16:55",
        actualArrival: "Source",
        actualDeparture: "16:55",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 0,
        status: "passed",
        platformNo: 3
      },
      {
        station: { code: "KOTA", name: "Kota Jn", state: "Rajasthan", latitude: 25.2138, longitude: 75.8648 },
        scheduledArrival: "22:30",
        scheduledDeparture: "22:40",
        actualArrival: "22:30",
        actualDeparture: "22:40",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 465,
        status: "passed",
        platformNo: 1
      },
      {
        station: { code: "RTM", name: "Ratlam Jn", state: "Madhya Pradesh", latitude: 23.3323, longitude: 74.9542 },
        scheduledArrival: "02:10",
        scheduledDeparture: "02:15",
        actualArrival: "02:10",
        actualDeparture: "02:15",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 731,
        status: "upcoming",
        platformNo: 2
      },
      {
        station: { code: "BRC", name: "Vadodara Jn", state: "Gujarat", latitude: 22.3106, longitude: 73.1812 },
        scheduledArrival: "05:50",
        scheduledDeparture: "06:00",
        actualArrival: "05:50",
        actualDeparture: "06:00",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 991,
        status: "upcoming",
        platformNo: 3
      },
      {
        station: { code: "ST", name: "Surat", state: "Gujarat", latitude: 21.2044, longitude: 72.8406 },
        scheduledArrival: "07:35",
        scheduledDeparture: "07:40",
        actualArrival: "07:35",
        actualDeparture: "07:40",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 1121,
        status: "upcoming",
        platformNo: 1
      },
      {
        station: { code: "MMCT", name: "Mumbai Central", state: "Maharashtra", latitude: 18.9696, longitude: 72.8193 },
        scheduledArrival: "08:35",
        scheduledDeparture: "Destination",
        actualArrival: "08:35",
        actualDeparture: "Destination",
        departureDelayMin: 0,
        arrivalDelayMin: 0,
        distanceKm: 1386,
        status: "upcoming",
        platformNo: 5
      }
    ]
  }
];

// Helper to calculate general distance between coordinates (Haversine formula in km)
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
