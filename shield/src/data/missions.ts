import type { Mission, Threat, Villain } from './types'

const art = (id: string) => `/art/${id}.jpg`

export const VILLAINS: Villain[] = [
  { id: 'thanos', name: 'Thanos', title: 'The Mad Titan', image: art('thanos'), focus: '50% 20%', hp: 880, attack: 36, moves: ['Gauntlet Crush', 'Cosmic Beam', 'Titan Slam'] },
  { id: 'ultron', name: 'Ultron', title: 'Rogue A.I.', image: art('ultron'), focus: '50% 25%', hp: 640, attack: 29, moves: ['Drone Swarm', 'Encephalo-Ray', 'Vibranium Fist'] },
  { id: 'loki', name: 'Loki', title: 'God of Mischief', image: art('loki'), focus: '55% 15%', hp: 470, attack: 24, moves: ['Illusion Strike', 'Frost Dagger', 'Sceptre Bolt'] },
  { id: 'hela', name: 'Hela', title: 'Goddess of Death', image: art('hela'), focus: '50% 25%', hp: 720, attack: 32, moves: ['Necrosword Rain', 'Death Grip', 'Undead Legion'] },
  { id: 'red-skull', name: 'Red Skull', title: 'Hydra Commander', image: art('red-skull'), focus: '45% 20%', hp: 330, attack: 18, moves: ['Cosmic Pistol', 'Hydra Ambush', 'Dust of Death'] },
  { id: 'doom', name: 'Doctor Doom', title: 'Monarch of Latveria', image: art('doom'), focus: '50% 18%', hp: 980, attack: 38, moves: ['Mystic Bolt', 'Doombot Legion', 'Gauntlet Overload'] },
  { id: 'kang', name: 'Kang', title: 'The Conqueror', image: art('kang'), focus: '55% 30%', hp: 540, attack: 26, moves: ['Chrono Blast', 'Temporal Shift', 'Future Arsenal'] },
]

export const villainById = (id: string) => VILLAINS.find((v) => v.id === id)!

export const MISSIONS: Mission[] = [
  {
    id: 'm-snap',
    codename: 'Operation Last Light',
    villainId: 'thanos',
    location: 'Titan orbit / Wakanda',
    lat: -1.3,
    lng: 30.1,
    threat: 'OMEGA',
    briefing: 'Thanos has located the final Infinity Stone. A planetary-scale event is imminent over central Africa.',
    objective: 'Intercept and disarm the gauntlet before full assembly.',
  },
  {
    id: 'm-sokovia',
    codename: 'Iron Tide',
    villainId: 'ultron',
    location: 'Novi Grad, Sokovia',
    lat: 45.8,
    lng: 15.9,
    threat: 'HIGH',
    briefing: 'Ultron is lifting the city core with vibranium thrusters. Thousands of drones protect the anchor.',
    objective: 'Evacuate civilians and destroy the core before it drops.',
  },
  {
    id: 'm-helheim',
    codename: 'Dead Gate',
    villainId: 'hela',
    location: 'Oslo, Norway',
    lat: 59.9,
    lng: 10.7,
    threat: 'HIGH',
    briefing: 'A Bifrost breach opened above the fjord. Hela is raising an undead legion.',
    objective: 'Seal the breach and push Hela back through.',
  },
  {
    id: 'm-tesseract',
    codename: 'Glass Cage',
    villainId: 'loki',
    location: 'Manhattan, New York',
    lat: 40.7,
    lng: -74.0,
    threat: 'MEDIUM',
    briefing: 'Loki has stolen the Tesseract from a S.H.I.E.L.D. vault and is hiding behind illusions in Midtown.',
    objective: 'Recover the Tesseract and contain Loki.',
  },
  {
    id: 'm-timeline',
    codename: 'Broken Hourglass',
    villainId: 'kang',
    location: 'Tokyo, Japan',
    lat: 35.7,
    lng: 139.7,
    threat: 'MEDIUM',
    briefing: 'Temporal anomalies over Shinjuku. Buildings are flickering between centuries.',
    objective: 'Disable Kang\'s chrono-anchor and stabilise the timeline.',
  },
  {
    id: 'm-hydra',
    codename: 'Cut the Head',
    villainId: 'red-skull',
    location: 'Kraków, Poland',
    lat: 50.1,
    lng: 19.9,
    threat: 'LOW',
    briefing: 'A Hydra cell is rebuilding in a disused factory. Red Skull was sighted on site.',
    objective: 'Raid the facility and capture the leadership.',
  },
]

MISSIONS.push({
  id: 'm-doom',
  codename: 'Iron Throne',
  villainId: 'doom',
  location: 'Doomstadt, Latveria',
  lat: 46.0,
  lng: 22.0,
  threat: 'OMEGA',
  briefing: 'Doom has fused sorcery and time-tech inside Castle Doom and is broadcasting an ultimatum to every government on Earth.',
  objective: 'Breach Castle Doom and shut down the throne-room time platform.',
  unlockAfter: 3,
})

export const THREAT_META: Record<Threat, { color: string; label: string; weight: number }> = {
  LOW: { color: '#3df5a7', label: 'Low', weight: 1 },
  MEDIUM: { color: '#ffb020', label: 'Medium', weight: 2 },
  HIGH: { color: '#ff6a2b', label: 'High', weight: 3 },
  OMEGA: { color: '#ff2e4d', label: 'Omega', weight: 5 },
}

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id)!
