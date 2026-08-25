import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { INTERACT_RADIUS } from './layout'

function Marker({ data }) {
  const ringRef = useRef(null)
  const glowRef = useRef(null)

  useFrame(({ clock }) => {
    const pulse = 0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.25
    if (ringRef.current) ringRef.current.material.emissiveIntensity = pulse
    if (glowRef.current) glowRef.current.material.opacity = 0.16 + pulse * 0.12
  })

  return (
    <group position={data.standingSpot}>
      {/* Soft glow disc */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[INTERACT_RADIUS * 0.95, 32]} />
        <meshBasicMaterial color="#e0972f" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {/* Crisp ring marking the exact stopping point */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[INTERACT_RADIUS * 0.62, INTERACT_RADIUS * 0.74, 40]} />
        <meshStandardMaterial
          color="#e0972f"
          emissive="#e0972f"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

export default function StandingMarkers({ categories }) {
  return (
    <>
      {categories.map((cat) => (
        <Marker key={cat.id} data={cat} />
      ))}
    </>
  )
}
