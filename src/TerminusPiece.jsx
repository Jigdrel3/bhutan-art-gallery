import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GOLD = '#e0972f'
const GOLD_BRIGHT = '#f2c368'
const DARK = '#101114'

// A stylized cluster of overlapping spheres reading as a single cloud lobe —
// the same motif requested for the exterior, echoed here as the hallway's
// terminus piece so the two ends of the experience rhyme with each other.
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
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.35} metalness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export default function TerminusPiece({ position }) {
  const ringRef = useRef(null)
  const cloudsRef = useRef(null)

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.06
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.12
  })

  return (
    <group position={position}>
      {/* Pedestal */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 1.1, 16]} />
        <meshStandardMaterial color={DARK} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 20]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.2} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Dharma-wheel-like ring, spokes radiating from a central hub.
          THREE.TorusGeometry's native plane is XY (facing along Z), which
          is exactly the hallway's approach axis — no rotation needed. */}
      <group ref={ringRef} position={[0, 2.35, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.05, 0.055, 16, 48]} />
          <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.5} roughness={0.25} metalness={0.85} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 1.0, 8]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4} roughness={0.3} metalness={0.8} />
            </mesh>
          )
        })}
        <mesh>
          <sphereGeometry args={[0.14, 20, 16]} />
          <meshStandardMaterial color={GOLD_BRIGHT} emissive={GOLD} emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* Slow-orbiting cloud motifs around the wheel */}
      <group ref={cloudsRef} position={[0, 2.35, 0]}>
        <group position={[1.7, 0.4, 0]}>
          <CloudCluster scale={0.55} />
        </group>
        <group position={[-1.5, -0.5, 0.3]} rotation={[0, Math.PI, 0]}>
          <CloudCluster scale={0.4} color={GOLD_BRIGHT} />
        </group>
        <group position={[0.2, 1.1, -1.3]}>
          <CloudCluster scale={0.35} />
        </group>
      </group>

      {/* Dramatic key light from the front, rim light from behind for
          silhouette as you approach down the hallway */}
      <pointLight position={[0, 2.6, 1.6]} color={GOLD_BRIGHT} intensity={22} distance={7} decay={1.8} />
      <pointLight position={[0, 2.2, -1.2]} color={GOLD} intensity={10} distance={5} decay={2} />
    </group>
  )
}
