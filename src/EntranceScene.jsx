import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const CRIMSON = '#c81d5e'
const GOLD = '#f2b544'
const TEAL = '#1fd3c4'
const MAGENTA = '#ff3d7f'

// Same overlapping-sphere cloud motif as the hallway's terminus piece, so
// the two ends of the experience rhyme with each other.
function CloudCluster({ scale = 1, color = GOLD }) {
  const lobes = useMemo(
    () => [
      [0, 0, 0, 0.34],
      [0.3, 0.05, 0, 0.24],
      [-0.28, 0.03, 0.05, 0.22],
      [0.1, 0.18, -0.05, 0.2],
      [-0.12, 0.15, 0.05, 0.18],
    ],
    []
  )
  return (
    <group scale={scale}>
      {lobes.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.35} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function FloatingClouds() {
  const group = useRef(null)
  useFrame((_, delta) => {
    if (group.current && !prefersReducedMotion) group.current.rotation.y += delta * 0.05
  })
  return (
    <group ref={group}>
      <group position={[-3.2, 1.4, -1.5]}>
        <CloudCluster scale={0.9} color={GOLD} />
      </group>
      <group position={[3.4, -0.8, -1]}>
        <CloudCluster scale={0.7} color={TEAL} />
      </group>
      <group position={[2.6, 1.9, -2.2]}>
        <CloudCluster scale={0.5} color={MAGENTA} />
      </group>
      <group position={[-2.8, -1.6, -1.8]}>
        <CloudCluster scale={0.6} color={GOLD} />
      </group>
    </group>
  )
}

const CORNER_COLORS = [GOLD, TEAL, MAGENTA, GOLD, TEAL, MAGENTA, GOLD, TEAL]

function Mass() {
  const group = useRef(null)
  const [hovered, setHovered] = useState(false)
  const corners = useMemo(() => {
    const list = []
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          list.push([x * 1.05, y * 0.75, z * 0.75])
        }
      }
    }
    return list
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return
    if (!prefersReducedMotion) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.18
      group.current.rotation.y += delta * 0.18
    }
    const targetScale = hovered ? 1.06 : 1
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, Math.min(1, delta * 8)))
  })

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* The solid mass */}
      <mesh castShadow>
        <boxGeometry args={[2.1, 1.5, 1.5]} />
        <meshStandardMaterial color={CRIMSON} emissive={CRIMSON} emissiveIntensity={0.35} roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Gold edge trim — thin rods along the 4 vertical edges, plus a
          top/bottom perimeter strip, so the crimson body still reads as
          the dominant color on every face. */}
      {[
        [1.05, 0.75],
        [1.05, -0.75],
        [-1.05, 0.75],
        [-1.05, -0.75],
      ].map(([x, z], i) => (
        <mesh key={`v${i}`} position={[x, 0, z]}>
          <boxGeometry args={[0.05, 1.5, 0.05]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} roughness={0.25} metalness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[2.16, 0.04, 1.58]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} roughness={0.25} metalness={0.85} />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[2.16, 0.04, 1.58]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Front medallion — a simple dharma-wheel-style emblem */}
      <group position={[0, 0, 0.76]}>
        <mesh>
          <torusGeometry args={[0.42, 0.045, 12, 40]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4} roughness={0.3} metalness={0.8} />
            </mesh>
          )
        })}
      </group>

      {/* Vibrant gem accents at each corner */}
      {corners.map((pos, i) => (
        <mesh key={i} position={pos}>
          <octahedronGeometry args={[0.09]} />
          <meshStandardMaterial
            color={CORNER_COLORS[i]}
            emissive={CORNER_COLORS[i]}
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

// Drag to orbit, scroll/pinch to zoom — a simple always-on version of the
// same orbit-camera idea used elsewhere in the gallery, scoped to this one
// scene since there's nothing else here to hand control back and forth to.
function OrbitCamera({ onEnter }) {
  const { camera, gl } = useThree()
  const spherical = useRef(new THREE.Spherical(6, Math.PI / 2.3, 0.4))
  const goal = useRef(new THREE.Spherical(6, Math.PI / 2.3, 0.4))
  const onEnterRef = useRef(onEnter)
  onEnterRef.current = onEnter

  useEffect(() => {
    const canvas = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0
    let pinchDist = null
    // A native `click` still fires on mouseup even after a drag, so entry
    // is gated on how far the pointer actually moved — a real drag-to-orbit
    // shouldn't also count as "clicking the mass."
    let dragDistance = 0
    const CLICK_THRESHOLD = 6

    const onDown = (e) => {
      dragging = true
      dragDistance = 0
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = () => {
      dragging = false
      if (dragDistance < CLICK_THRESHOLD) onEnterRef.current()
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      dragDistance += Math.abs(dx) + Math.abs(dy)
      goal.current.theta -= dx * 0.006
      goal.current.phi = THREE.MathUtils.clamp(goal.current.phi - dy * 0.006, 0.5, 2.3)
    }
    const onWheel = (e) => {
      e.preventDefault()
      goal.current.radius = THREE.MathUtils.clamp(goal.current.radius + e.deltaY * 0.003, 3.5, 9)
    }
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        dragging = true
        dragDistance = 0
        lastX = e.touches[0].clientX
        lastY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        dragging = false
        const [a, b] = e.touches
        pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      }
    }
    const onTouchMove = (e) => {
      if (e.touches.length === 1 && dragging) {
        const dx = e.touches[0].clientX - lastX
        const dy = e.touches[0].clientY - lastY
        lastX = e.touches[0].clientX
        lastY = e.touches[0].clientY
        dragDistance += Math.abs(dx) + Math.abs(dy)
        goal.current.theta -= dx * 0.006
        goal.current.phi = THREE.MathUtils.clamp(goal.current.phi - dy * 0.006, 0.5, 2.3)
      } else if (e.touches.length === 2 && pinchDist != null) {
        const [a, b] = e.touches
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        goal.current.radius = THREE.MathUtils.clamp(goal.current.radius + (pinchDist - dist) * 0.01, 3.5, 9)
        pinchDist = dist
      }
    }
    const onTouchEnd = () => {
      const wasDragging = dragging
      dragging = false
      pinchDist = null
      if (wasDragging && dragDistance < CLICK_THRESHOLD) onEnterRef.current()
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((_, delta) => {
    const damp = Math.min(1, delta * 6)
    spherical.current.radius += (goal.current.radius - spherical.current.radius) * damp
    spherical.current.phi += (goal.current.phi - spherical.current.phi) * damp
    let dTheta = goal.current.theta - spherical.current.theta
    dTheta = ((dTheta + Math.PI) % (Math.PI * 2)) - Math.PI
    spherical.current.theta += dTheta * damp

    camera.position.setFromSpherical(spherical.current)
    camera.lookAt(0, 0, 0)
  })

  return null
}

export default function EntranceScene({ onEnter }) {
  return (
    <>
      <color attach="background" args={['#1a0a2e']} />
      <fog attach="fog" args={['#1a0a2e', 7, 15]} />

      <ambientLight intensity={0.35} color="#6a4fa0" />
      <pointLight position={[3.5, 2.5, 3]} color={TEAL} intensity={55} distance={13} decay={1.8} />
      <pointLight position={[-3.5, -1.5, 2.5]} color={GOLD} intensity={45} distance={12} decay={1.8} />
      <pointLight position={[0, -2.5, 3.5]} color={MAGENTA} intensity={40} distance={11} decay={2} />
      <pointLight position={[0, 3, -3]} color={GOLD} intensity={20} distance={9} decay={2} />

      <Mass />
      <FloatingClouds />
      <OrbitCamera onEnter={onEnter} />
    </>
  )
}
