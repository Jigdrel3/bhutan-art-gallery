import { useRef, useState, useMemo, useEffect, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { getMandalaTextures } from './lib/mandalaTexture'

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const VOID = '#0a0908'
const MIST = '#3a3128'
const SAFFRON = '#e8a33d'
const MAROON = '#7a1f2b'
const GLASS_TINT = '#f4ead2'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// The etched glow edge — a separate emissive mesh (not just a material
// property) so bloom has real geometry to bleed light from, matching the
// reference image's "light escaping a shrine interior" edge.
const GlowEdge = forwardRef(function GlowEdge({ baseIntensity }, ref) {
  return (
    <mesh ref={ref} position={[0.86, 0, 0]}>
      <boxGeometry args={[0.05, 2.05, 1.25]} />
      <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={baseIntensity} toneMapped={false} />
    </mesh>
  )
})

const MandalaGate = forwardRef(function MandalaGate({ hover, glowRef, activatingRef }, ref) {
  const { normalMap, emissiveMap } = useMemo(() => getMandalaTextures(SAFFRON), [])
  const hoverT = useRef(0)

  useFrame((_, delta) => {
    // While the click-activation sequence is running, HeroCamera owns the
    // glow intensity (ramping it to a whiteout) — don't fight it here.
    if (activatingRef.current) return

    const target = hover ? 1 : 0
    const duration = hover ? 0.4 : 0.5
    const dir = target - hoverT.current
    hoverT.current = THREE.MathUtils.clamp(hoverT.current + Math.sign(dir) * (delta / duration), 0, 1)
    const eased = easeOutCubic(hoverT.current)

    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(1.4, 2.0, eased)
    }
    if (ref.current) {
      const s = THREE.MathUtils.lerp(1, 1.03, eased)
      ref.current.scale.set(s, s, s)
    }
  })

  return (
    <group ref={ref}>
      {/* Glass body — proportioned closer to a gau (portable shrine box)
          than a plain cube: taller than it is wide, modest depth. Plain
          tinted glass, no pattern here — a box's 6 faces don't share a
          uniform square aspect, so mapping a circular mandala across all
          of them via shared UVs stretched it into something unrecognizable
          on the non-square faces. The mandala lives on its own square
          medallion panel below instead, where it can't distort. */}
      <mesh castShadow>
        <boxGeometry args={[1.7, 2.1, 1.3]} />
        <meshPhysicalMaterial
          color={GLASS_TINT}
          transmission={0.92}
          roughness={0.08}
          ior={1.5}
          thickness={0.6}
          attenuationColor={GLASS_TINT}
          attenuationDistance={1.2}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Mandala medallion — a square glass panel set into the front face,
          so the etched pattern renders at its true undistorted proportions
          and is unmistakably a mandala rather than a stretched smear. */}
      <mesh position={[0, 0, 0.68]}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshPhysicalMaterial
          color={GLASS_TINT}
          transmission={0.55}
          roughness={0.06}
          ior={1.5}
          thickness={0.25}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(1.1, 1.1)}
          emissiveMap={emissiveMap}
          emissive={SAFFRON}
          emissiveIntensity={1.6}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Gold structural frame */}
      {[
        [0.87, 1.05, 0.67],
        [0.87, 1.05, -0.67],
        [-0.87, 1.05, 0.67],
        [-0.87, 1.05, -0.67],
      ].map(([x, , z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.045, 2.1, 0.045]} />
          <meshStandardMaterial color={SAFFRON} roughness={0.28} metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[1.76, 0.04, 1.36]} />
        <meshStandardMaterial color={SAFFRON} roughness={0.28} metalness={0.9} />
      </mesh>
      <mesh position={[0, -1.08, 0]}>
        <boxGeometry args={[1.76, 0.04, 1.36]} />
        <meshStandardMaterial color={SAFFRON} roughness={0.28} metalness={0.9} />
      </mesh>

      {/* Base plinth — a quiet nod to a shrine's plinth rather than the
          object simply floating with no grounding form at all */}
      <mesh position={[0, -1.24, 0]}>
        <boxGeometry args={[1.95, 0.14, 1.55]} />
        <meshStandardMaterial color="#1c1712" roughness={0.6} metalness={0.3} />
      </mesh>

      <GlowEdge ref={glowRef} baseIntensity={1.4} />
    </group>
  )
})

// Warm, slow-drifting mist motes/embers rather than a static starfield.
function EmberParticles({ count = 320 }) {
  const points = useRef(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 5
      const angle = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1
      speeds[i] = 0.04 + Math.random() * 0.08
    }
    return { positions, speeds }
  }, [count])

  useFrame((_, delta) => {
    if (prefersReducedMotion || !points.current) return
    const arr = points.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      if (arr[i * 3 + 1] > 3) arr[i * 3 + 1] = -2
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={SAFFRON}
        size={0.03}
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// Soft radial saffron glow on the ground beneath the object, pulsing very
// slightly in sync with the float's vertical bob.
function GroundGlow() {
  const mesh = useRef(null)
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(232,163,61,0.55)')
    grad.addColorStop(1, 'rgba(232,163,61,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame(({ clock }) => {
    if (!mesh.current || prefersReducedMotion) return
    const pulse = 0.9 + Math.sin(clock.elapsedTime * 0.7) * 0.08
    mesh.current.scale.set(pulse, pulse, 1)
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
      <planeGeometry args={[4.5, 4.5]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

// Mostly-static camera per the PRD (this is a hero moment, not the walkable
// hall) — a few degrees of parallax tied to mouse position, plus the
// click-to-activate transition that pushes toward the object and cross-
// fades into the gallery.
function HeroCamera({ onEnter, objectRef, glowRef, bloomRef, setHover, activatingRef }) {
  const { camera, gl } = useThree()
  const basePos = useRef(new THREE.Vector3(0, 0.3, 5.5))
  const mouse = useRef({ x: 0, y: 0 })
  const raycaster = useRef(new THREE.Raycaster())
  const activateT = useRef(0)
  const onEnterRef = useRef(onEnter)
  onEnterRef.current = onEnter

  useEffect(() => {
    camera.position.copy(basePos.current)
    camera.lookAt(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const canvas = gl.domElement
    let downX = 0
    let downY = 0
    let downTime = 0

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (!objectRef.current) return
      const ndc = new THREE.Vector2(mouse.current.x, mouse.current.y)
      raycaster.current.setFromCamera(ndc, camera)
      const hits = raycaster.current.intersectObject(objectRef.current, true)
      setHover(hits.length > 0)
    }

    const onDown = (e) => {
      downX = e.clientX
      downY = e.clientY
      downTime = performance.now()
    }
    const onUp = (e) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      const elapsed = performance.now() - downTime
      if (moved > 6 || elapsed > 600 || activatingRef.current) return
      if (!objectRef.current) return
      const rect = canvas.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.current.setFromCamera(ndc, camera)
      const hits = raycaster.current.intersectObject(objectRef.current, true)
      if (hits.length > 0) {
        activatingRef.current = true
        activateT.current = 0
      }
    }

    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    return () => {
      canvas.removeEventListener('mousemove', onPointerMove)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [camera, gl, objectRef, setHover])

  useFrame((_, delta) => {
    if (activatingRef.current) {
      const duration = prefersReducedMotion ? 0.45 : 1.2
      activateT.current = Math.min(1, activateT.current + delta / duration)
      const e = easeInOutCubic(activateT.current)

      if (!prefersReducedMotion) {
        camera.position.lerpVectors(basePos.current, new THREE.Vector3(0, 0.1, 1.4), e)
      }
      if (glowRef.current) glowRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(1.4, 9, e)
      if (bloomRef.current) bloomRef.current.intensity = THREE.MathUtils.lerp(0.6, 4, e)

      if (activateT.current >= 1) {
        activatingRef.current = false
        onEnterRef.current()
      }
      return
    }

    if (!prefersReducedMotion) {
      const targetX = basePos.current.x + mouse.current.x * 0.35
      const targetY = basePos.current.y + mouse.current.y * 0.2
      camera.position.x += (targetX - camera.position.x) * Math.min(1, delta * 2.5)
      camera.position.y += (targetY - camera.position.y) * Math.min(1, delta * 2.5)
      camera.lookAt(0, 0, 0)
    }
  })

  return null
}

export default function EntranceScene({ onEnter }) {
  const objectRef = useRef(null)
  const glowRef = useRef(null)
  const bloomRef = useRef(null)
  const activatingRef = useRef(false)
  const [hover, setHover] = useState(false)

  return (
    <>
      <color attach="background" args={[VOID]} />
      <fogExp2 attach="fog" args={[MIST, 0.09]} />

      <Environment preset="sunset" />
      <ambientLight intensity={0.25} color={MIST} />
      <pointLight position={[2, 1.5, 2]} color={SAFFRON} intensity={18} distance={9} decay={1.8} />
      <pointLight position={[-2, -1, 1.5]} color={MAROON} intensity={10} distance={7} decay={2} />
      <pointLight position={[0, 2.2, -2]} color={SAFFRON} intensity={8} distance={7} decay={2} />

      {prefersReducedMotion ? (
        <MandalaGate ref={objectRef} hover={hover} glowRef={glowRef} activatingRef={activatingRef} />
      ) : (
        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
          <MandalaGate ref={objectRef} hover={hover} glowRef={glowRef} activatingRef={activatingRef} />
        </Float>
      )}

      <GroundGlow />
      <EmberParticles />
      <HeroCamera
        onEnter={onEnter}
        objectRef={objectRef}
        glowRef={glowRef}
        bloomRef={bloomRef}
        setHover={setHover}
        activatingRef={activatingRef}
      />

      <EffectComposer>
        <Bloom ref={bloomRef} luminanceThreshold={0.35} luminanceSmoothing={0.3} intensity={0.6} mipmapBlur />
      </EffectComposer>
    </>
  )
}
