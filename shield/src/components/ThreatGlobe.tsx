import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, QuadraticBezierLine, Html, useTexture } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { MISSIONS } from '../data/missions'
import { useShieldStore } from '../store/useShieldStore'

const R = 2
const BONE = '#edeae3'
const RED = '#ec1d24'

/**
 * Camera + framing, driven from outside (landing zoom).
 * z: camera distance. offset: 0..1 — how far the globe sits off-centre (1 = layout position, 0 = dead centre).
 */
export const camRig = {
  z: typeof sessionStorage !== 'undefined' && sessionStorage.getItem('shield-view') === 'console' ? 7 : 15,
  offset: 1,
}

function CameraRig() {
  useFrame(({ camera }) => {
    // keep the orbit direction the user dragged to, only change the distance
    camera.position.setLength(camRig.z)
  })
  return null
}

function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
}

/* ── Earth: NASA night-lights texture, city lights boosted, thin atmospheric rim ── */

const earthVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
const earthFrag = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 c = texture2D(map, vUv).rgb;
    // city lights are warm (r > b) — lift them so they read like the photo
    float warm = c.r - c.b * 0.8;
    float lights = smoothstep(0.02, 0.22, warm);
    vec3 col = c * vec3(0.95, 1.1, 1.35);                      // lift the navy night side
    col += lights * vec3(1.0, 0.74, 0.4) * (0.9 + warm * 3.0);  // glowing sodium-orange cities
    // thin blue rim where the atmosphere sits
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
    col += vec3(0.25, 0.5, 1.0) * fres * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`
const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const atmoFrag = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float i = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(0.3, 0.55, 1.0, 1.0) * i * 1.4;
  }
`

function Earth() {
  const map = useTexture('/textures/earth-night.jpg')
  const { gl } = useThree()
  useMemo(() => {
    // raw ShaderMaterial does no colour-space conversion: keep the texture's sRGB bytes as-is
    map.colorSpace = THREE.NoColorSpace
    map.anisotropy = gl.capabilities.getMaxAnisotropy()
  }, [map, gl])
  return (
    <>
      <mesh>
        <sphereGeometry args={[R, 128, 128]} />
        <shaderMaterial uniforms={{ map: { value: map } }} vertexShader={earthVert} fragmentShader={earthFrag} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial vertexShader={atmoVert} fragmentShader={atmoFrag} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

function Marker({ id, lat, lng, done, active, label, onSelect }: {
  id: string; lat: number; lng: number; done: boolean; active: boolean; label: string; onSelect: (id: string) => void
}) {
  const ring = useRef<THREE.Mesh>(null)
  const pos = useMemo(() => toVec(lat, lng, R * 1.004), [lat, lng])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos])
  const [hover, setHover] = useState(false)
  const color = done ? BONE : RED

  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = (clock.getElapsedTime() * (active ? 1.2 : 0.7) + lat * 0.1) % 1
    ring.current.scale.setScalar(1 + t * 2.6)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9
  })

  return (
    <group position={pos} quaternion={quat}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(id) }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true) }}
        onPointerOut={() => setHover(false)}
      >
        <circleGeometry args={[0.045, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {!done && (
        <mesh ref={ring}>
          <ringGeometry args={[0.06, 0.072, 40]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.4, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {hover && (
        <Html position={[0, 0, 0.45]} center style={{ pointerEvents: 'none' }}>
          <div className="label whitespace-nowrap bg-marvel px-2 py-0.5 font-bold text-bone">{label}</div>
        </Html>
      )}
    </group>
  )
}

/** Small satellite on a tilted orbit. */
function Satellite() {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime() * 0.3
    ref.current.position.set(Math.cos(t) * 3.1, Math.sin(t) * 1.0, Math.sin(t) * 3.1)
    ref.current.rotation.y = -t
  })
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.12, 0.12, 0.2]} />
        <meshBasicMaterial color={BONE} wireframe />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.27, 0, 0]}>
          <boxGeometry args={[0.36, 0.008, 0.14]} />
          <meshBasicMaterial color="#3a5a8c" />
        </mesh>
      ))}
    </group>
  )
}

function Orbit() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 3.1, Math.sin(a) * 1.0, Math.sin(a) * 3.1))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])
  return (
    <lineLoop geometry={geo}>
      <lineBasicMaterial color={BONE} transparent opacity={0.12} />
    </lineLoop>
  )
}

function Globe({ onSelect }: { onSelect: (id: string) => void }) {
  const frame = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const status = useShieldStore((s) => s.status)
  const threat = useShieldStore((s) => s.threat)
  const carrier = useMemo(() => toVec(38, -40, R * 1.55), [])
  const { viewport } = useThree()
  const wide = viewport.aspect > 1.1
  const scroll = useRef(0)
  const smooth = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const on = () => { scroll.current = window.scrollY }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useFrame((_, dt) => {
    if (!frame.current || !spin.current) return
    spin.current.rotation.y += dt * 0.04
    // layout position: right side on wide screens, higher on narrow; drifts as the panel slides over
    const p = Math.min(1, scroll.current / window.innerHeight)
    const far = Math.max(0, camRig.z - 7)
    const tx = (wide ? 1.9 - p * 1.9 + far * 0.3 : 0) * camRig.offset
    const ty = (p * 1.2 + (wide ? 0 : 0.9 + far * 0.32)) * camRig.offset
    if (!smooth.current) smooth.current = { x: tx, y: ty }
    // exponential follow so scroll/zoom never jitter
    const k = 1 - Math.exp(-dt * 8)
    smooth.current.x += (tx - smooth.current.x) * k
    smooth.current.y += (ty - smooth.current.y) * k
    frame.current.position.set(smooth.current.x, smooth.current.y, 0)
  })

  return (
    <group ref={frame} scale={wide ? 1 : 0.8}>
      <group rotation={[0.3, 0, 0.08]}>
        <group ref={spin} rotation={[0, -1.4, 0]}>
          <Earth />
          {MISSIONS.map((m) => (
            <Marker
              key={m.id}
              id={m.id}
              lat={m.lat}
              lng={m.lng}
              label={`${m.codename} / ${threat[m.id] ?? m.threat}`}
              done={status[m.id] === 'Completed'}
              active={status[m.id] === 'In Progress'}
              onSelect={onSelect}
            />
          ))}
          {MISSIONS.filter((m) => status[m.id] === 'In Progress').map((m) => {
            const end = toVec(m.lat, m.lng, R * 1.01)
            const mid = carrier.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.7)
            return <QuadraticBezierLine key={m.id} start={carrier} end={end} mid={mid} color={RED} lineWidth={1.5} dashed dashScale={24} />
          })}
          <mesh position={carrier}>
            <octahedronGeometry args={[0.07]} />
            <meshBasicMaterial color={BONE} wireframe />
          </mesh>
        </group>
        <Orbit />
        <Satellite />
      </group>
    </group>
  )
}

function Stars() {
  const geo = useMemo(() => {
    const n = 1500
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 40)
      arr.set([v.x, v.y, v.z], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.12} color={BONE} transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

export default function ThreatGlobe() {
  const setFocus = useShieldStore((s) => s.setFocusMission)
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  const select = (id: string) => {
    setFocus(id)
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: string, o?: object) => void } }).__lenis
    if (lenis) lenis.scrollTo('#missions', { offset: -64, duration: 1.4 })
    else document.getElementById('missions')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <Canvas
      camera={{ position: [0, 0, camRig.z], fov: 45, near: 0.05, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: canHover ? 'auto' : 'none' }}
      data-cursor="Drag to rotate"
    >
      <CameraRig />
      <Stars />
      <Globe onSelect={select} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={canHover} rotateSpeed={0.4} enableDamping dampingFactor={0.08} />
    </Canvas>
  )
}
