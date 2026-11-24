# Avengers Command — S.H.I.E.L.D. Crisis Management System

Frontend-only hackathon build. React 19 + TypeScript + Vite, Tailwind v4, GSAP, Three.js (react-three-fiber), Zustand (state persisted to localStorage).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
```

Design rules live in [DESIGN.md](DESIGN.md).

## Where each required module lives

| Module | Section | File |
|---|---|---|
| Command dashboard | 01 Command | `src/sections/Dashboard.tsx` |
| Avengers database | 02 Database (+ personnel file modal) | `src/sections/Database.tsx`, `src/components/Dossier.tsx` |
| Team formation (min 4) | 03 Assemble | `src/sections/TeamFormation.tsx` |
| Mission control (7 missions, LOW to OMEGA; Doctor Doom unlocks after 3) | 04 Missions | `src/sections/MissionControl.tsx` |
| Hero allocation | 04 Missions → Deploy team / Recall | same, logic in `src/store/useShieldStore.ts` |
| Battle simulation | 05 Battle (turn-based, auto-battle) | `src/sections/BattleSim.tsx` |
| Mission status (Pending / In Progress / Completed) | 06 Status (drag or arrows) | `src/sections/MissionStatus.tsx` |

The 3D threat globe behind the page (`src/components/ThreatGlobe.tsx`) shows each mission as a red beacon; click one to open that mission.

Use the reset icon in the top bar to clear saved state.

Fan project: Marvel, the Avengers and all characters are trademarks of Marvel. Logos come from Wikimedia Commons; character art from the Marvel Database (Fandom), resized and self-hosted in `public/art`.
