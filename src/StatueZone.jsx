import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'

const INNER = 2.0
const OUTER = 3.4
const RING_RADIUS = (INNER + OUTER) / 2
const MARGIN = 0.3

export default function StatueZone({ onEnter, disabled }) {
  const { camera, gl } = useThree()
  const ringRef = useRef(null)
  const glowRef = useRef(null)
  const [near, setNear] = useState(false)
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const onEnterRef = useRef(onEnter)
  onEnterRef.current = onEnter

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.2
    if (ringRef.current) ringRef.current.material.emissiveIntensity = pulse
    if (glowRef.current) glowRef.current.material.opacity = 0.1 + pulse * 0.08
    const dist = Math.hypot(camera.position.x, camera.position.z)
    const inZone = dist > INNER - MARGIN && dist < OUTER + MARGIN
    if (inZone !== near) setNear(inZone)
  })

  useEffect(() => {
    const canvas = gl.domElement
    const onClick = () => {
      if (disabledRef.current) return
      if (document.pointerLockElement !== canvas) return
      const dist = Math.hypot(camera.position.x, camera.position.z)
      if (dist > INNER - MARGIN && dist < OUTER + MARGIN) onEnterRef.current()
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [camera, gl])

  return (
    <group>
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[INNER, OUTER, 64]} />
        <meshBasicMaterial color="#e0972f" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[RING_RADIUS - 0.05, RING_RADIUS + 0.05, 64]} />
        <meshStandardMaterial color="#e0972f" emissive="#e0972f" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>

      {near && !disabled && (
        <Billboard position={[0, 2.7, 0]}>
          <Text fontSize={0.13} color="#e0972f" anchorX="center" anchorY="middle">
            click to view up close
          </Text>
        </Billboard>
      )}
    </group>
  )
}
