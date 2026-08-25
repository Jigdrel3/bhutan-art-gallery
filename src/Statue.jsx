import { useMemo } from 'react'
import * as THREE from 'three'

const BRONZE = '#8a6a3a'
const BRONZE_DARK = '#5f4726'
const GOLD = '#d9a94a'

// Seated meditation-figure silhouette, built as a single lathe profile
// (robe -> shoulders -> neck) plus separately-modeled head, ushnisha, halo,
// hands and earlobes. This is a stylized PLACEHOLDER standing in for a real
// sculpted asset — see gallery-prd.md §7.4: true carved surface detail
// (fabric folds, facial modeling) needs either a commissioned/AI-generated
// mesh or a human sculptor, which is out of reach for procedural code.
// Swappable later for a GLTF import without touching the room or camera.
const ROBE_PROFILE = [
  [0.95, 0.0],
  [1.0, 0.05],
  [0.92, 0.12],
  [0.97, 0.2],
  [0.85, 0.28],
  [0.9, 0.36],
  [0.72, 0.46],
  [0.55, 0.55],
  [0.42, 0.6],
  [0.3, 0.64],
  [0.34, 0.68],
]

const LOTUS_PROFILE = [
  [0.0, -0.16],
  [0.55, -0.16],
  [0.98, -0.1],
  [0.85, -0.02],
  [1.02, 0.0],
  [0.7, 0.02],
]

function useLathePoints(profile) {
  return useMemo(() => profile.map(([r, y]) => new THREE.Vector2(r, y)), [profile])
}

export default function Statue() {
  const robePoints = useLathePoints(ROBE_PROFILE)
  const lotusPoints = useLathePoints(LOTUS_PROFILE)

  return (
    <group>
      {/* Lotus throne base */}
      <mesh position={[0, 0, 0]}>
        <latheGeometry args={[lotusPoints, 40]} />
        <meshStandardMaterial color={BRONZE_DARK} roughness={0.55} metalness={0.6} />
      </mesh>

      {/* Robe + torso + neck */}
      <mesh position={[0, 0, 0]}>
        <latheGeometry args={[robePoints, 48]} />
        <meshStandardMaterial color={BRONZE} roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Hands resting in the lap (meditation mudra, simplified) */}
      <mesh position={[0, 0.42, 0.22]}>
        <sphereGeometry args={[0.13, 20, 16]} />
        <meshStandardMaterial color={BRONZE} roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.36, 0.3]}>
        <sphereGeometry args={[0.1, 20, 16]} />
        <meshStandardMaterial color={BRONZE} roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.26, 32, 24]} />
        <meshStandardMaterial color={BRONZE} roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Ushnisha (crown knot) */}
      <mesh position={[0, 1.21, 0]}>
        <sphereGeometry args={[0.09, 20, 16]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <coneGeometry args={[0.05, 0.09, 16]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.9} />
      </mesh>

      {/* Elongated earlobes */}
      <mesh position={[-0.24, 0.86, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
        <meshStandardMaterial color={BRONZE} roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0.24, 0.86, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
        <meshStandardMaterial color={BRONZE} roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Aureola / halo behind the head */}
      <mesh position={[0, 0.95, -0.14]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.42, 0.03, 12, 48]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.3}
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>
      <mesh position={[0, 0.95, -0.15]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.42, 48]} />
        <meshStandardMaterial
          color="#3a2e1a"
          roughness={0.6}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
