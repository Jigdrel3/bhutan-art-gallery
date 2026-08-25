import { useRef, useState, useMemo, useEffect, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const VOID = '#0a0908'
const MIST = '#3a3128'
const SAFFRON = '#e8a33d'
const GOLD_BRIGHT = '#f2c368'
const MAROON = '#7a1f2b'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// The glowing core — a separate emissive mesh (not just a material
// property) so bloom has real geometry to bleed light from, matching the
// reference image's "light escaping a shrine interior" effect.
const GlowHub = forwardRef(function GlowHub({ baseIntensity }, ref) {
  return (
    <mesh ref={ref} position={[0, 0, 0.16]}>
      <icosahedronGeometry args={[0.22, 1]} />
      <meshStandardMaterial
        color={GOLD_BRIGHT}
        emissive={SAFFRON}
        emissiveIntensity={baseIntensity}
        toneMapped={false}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  )
})

// A single ring, given real depth via its torus tube thickness.
function Ring({ radius, tube, z, color = SAFFRON }) {
  return (
    <mesh position={[0, 0, z]}>
      <torusGeometry args={[radius, tube, 16, 64]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.26} />
    </mesh>
  )
}

// A petal as an actual volumetric form (a stretched sphere), not a flat
// decal — it has real thickness and catches light differently from every
// angle as the piece rotates, which is what makes it read as 3D.
function Petal({ angle, radius, z, length, width, thickness, color }) {
  return (
    <mesh
      position={[Math.cos(angle) * radius, Math.sin(angle) * radius, z]}
      rotation={[0, 0, angle - Math.PI / 2]}
      scale={[width, length, thickness]}
    >
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
    </mesh>
  )
}

function PetalRing({ radius, count, z, length, width, thickness, color, accentColor }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const useAccent = accentColor && i % 4 === 0
        return (
          <Petal
            key={i}
            angle={angle}
            radius={radius}
            z={z}
            length={length}
            width={width}
            thickness={thickness}
            color={useAccent ? accentColor : color}
          />
        )
      })}
    </>
  )
}

// A radial spoke connecting two rings — real cylindrical geometry, not a
// flat line, so it has presence when viewed edge-on as the piece turns.
function Spoke({ angle, innerR, outerR, z, color = SAFFRON }) {
  const len = outerR - innerR
  const midR = (innerR + outerR) / 2
  return (
    <mesh position={[Math.cos(angle) * midR, Math.sin(angle) * midR, z]} rotation={[0, 0, angle - Math.PI / 2]}>
      <cylinderGeometry args={[0.018, 0.018, len, 6]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.24} />
    </mesh>
  )
}

function SpokeRing({ count, innerR, outerR, z, color }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Spoke key={i} angle={(i / count) * Math.PI * 2} innerR={innerR} outerR={outerR} z={z} color={color} />
      ))}
    </>
  )
}

function Gem({ angle, radius, z, color }) {
  return (
    <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * radius, z]}>
      <octahedronGeometry args={[0.05]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} metalness={0.6} roughness={0.15} />
    </mesh>
  )
}

// The mandala itself — genuinely three-dimensional: concentric rings with
// real torus thickness, petals with real volume, spokes with real
// cylindrical form, layered at different depths so it reads as a
// dimensional wheel from any angle, not a flat pattern glued to a surface.
const MandalaGate = forwardRef(function MandalaGate({ hover, glowRef, activatingRef }, ref) {
  const hoverT = useRef(0)
  const outerGemCount = 16

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
      glowRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(1.6, 2.4, eased)
    }
    if (ref.current) {
      const s = THREE.MathUtils.lerp(1, 1.04, eased)
      ref.current.scale.set(s, s, s)
    }
  })

  return (
    <group ref={ref}>
      <Ring radius={1.55} tube={0.045} z={-0.14} />
      <PetalRing
        radius={1.32}
        count={16}
        z={-0.07}
        length={0.34}
        width={0.13}
        thickness={0.07}
        color={SAFFRON}
        accentColor={MAROON}
      />
      <SpokeRing count={16} innerR={1.02} outerR={1.5} z={-0.1} color={SAFFRON} />

      <Ring radius={1.0} tube={0.05} z={0} color={GOLD_BRIGHT} />

      <PetalRing radius={0.75} count={12} z={0.06} length={0.28} width={0.11} thickness={0.06} color={GOLD_BRIGHT} />
      <SpokeRing count={8} innerR={0.24} outerR={0.68} z={0.08} color={SAFFRON} />

      <Ring radius={0.42} tube={0.035} z={0.12} color={SAFFRON} />

      {Array.from({ length: outerGemCount }, (_, i) => (
        <Gem key={i} angle={(i / outerGemCount) * Math.PI * 2} radius={1.32} z={-0.02} color={MAROON} />
      ))}

      <GlowHub ref={glowRef} baseIntensity={1.6} />
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
