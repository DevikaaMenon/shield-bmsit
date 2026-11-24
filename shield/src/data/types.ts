export type Role = 'Powerhouse' | 'Tech' | 'Mystic' | 'Tactician' | 'Infiltrator' | 'Marksman'
export type Threat = 'LOW' | 'MEDIUM' | 'HIGH' | 'OMEGA'
export type MissionStatus = 'Pending' | 'In Progress' | 'Completed'

export interface Stats {
  power: number
  speed: number
  intelligence: number
  durability: number
  combat: number
}

export interface Ability {
  name: string
  kind: 'attack' | 'special' | 'support'
  damage: number
  description: string
}

export interface Hero {
  id: string
  name: string
  realName: string
  image: string
  /** CSS object-position for crops of the portrait-format cover art */
  focus?: string
  role: Role
  base: string
  clearance: number
  stats: Stats
  abilities: Ability[]
  bio: string
}

export interface Villain {
  id: string
  name: string
  image: string
  focus?: string
  title: string
  hp: number
  attack: number
  moves: string[]
}

export interface Mission {
  id: string
  codename: string
  villainId: string
  location: string
  lat: number
  lng: number
  threat: Threat
  briefing: string
  objective: string
  /** Final-boss missions stay sealed until this many others are completed */
  unlockAfter?: number
}
