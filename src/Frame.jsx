import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture, Text } from '@react-three/drei'
import * as THREE from 'three'
import { INTERACT_RADIUS } from './layout'

const GLOW_RANGE = 3.6
const FRAME_W = 1.6
const FRAME_H = 2.1
const MAT_BORDER = 0.12
const FILLET = 0.03
const SAFFRON = '#e0972f'

// A small L-shaped bracket at one mat corner, opening toward the center —
// the museum-label flourish, kept small and restrained.
function CornerFlourish({ cx, cy, sx, sy }) {
  const s = 0.16
  const t = 0.018
  return (
    <group position={[cx, cy, 0.012]}>
      <mesh position={[-sx * (s / 2), 0, 0]}>
        <boxGeometry args={[s, t, 0.004]} />
        <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -sy * (s / 2), 0]}>
        <boxGeometry args={[t, s, 0.004]} />
        <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

export default function Frame({ data }) {
  const texture = useTexture(data.cover)
  const { gl } = useThree()
  const matRef = useRef(null)
  const plaqueMatRef = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    texture.anisotropy = gl.capabilities.getMaxAnisotropy()
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture, gl])

  useFrame(({ camera }) => {
    const dx = camera.position.x - data.standingSpot[0]
    const dz = camera.position.z - data.standingSpot[2]
    const dist = Math.hypot(dx, dz)
    const t = THREE.MathUtils.clamp(1 - dist / GLOW_RANGE, 0, 1)

    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.05 + t * 0.55
    }
    if (plaqueMatRef.current) {
      plaqueMatRef.current.emissiveIntensity = 0.15 + t * 0.85
    }
    const shouldBeNear = dist < INTERACT_RADIUS
    if (shouldBeNear !== near) setNear(shouldBeNear)
  })

  const halfW = FRAME_W / 2 + MAT_BORDER * 0.55
  const halfH = FRAME_H / 2 + MAT_BORDER * 0.55

  return (
    <group position={data.position} rotation={data.rotation} userData={{ categoryId: data.id }}>
      {/* Dark outer frame edge */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[FRAME_W + MAT_BORDER * 2 + 0.06, FRAME_H + MAT_BORDER * 2 + 0.06, 0.05]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* White mat border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[FRAME_W + MAT_BORDER * 2, FRAME_H + MAT_BORDER * 2]} />
        <meshStandardMaterial
          ref={matRef}
          color="#f4f0e6"
          emissive="#f4f0e6"
          emissiveIntensity={0.1}
          roughness={0.7}
        />
      </mesh>

      {/* Thin gold fillet between mat and image, museum-style */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[FRAME_W + FILLET * 2, FRAME_H + FILLET * 2]} />
        <meshStandardMaterial color={SAFFRON} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Cover image */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>

      {/* Restrained decorative corner marks on the mat */}
      <CornerFlourish cx={-halfW} cy={halfH} sx={-1} sy={1} />
      <CornerFlourish cx={halfW} cy={halfH} sx={1} sy={1} />
      <CornerFlourish cx={-halfW} cy={-halfH} sx={-1} sy={-1} />
      <CornerFlourish cx={halfW} cy={-halfH} sx={1} sy={-1} />

      {/* Label plaque */}
      <group position={[0, -FRAME_H / 2 - 0.32, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.26, 0.04]} />
          <meshStandardMaterial
            ref={plaqueMatRef}
            color="#191a1f"
            emissive={SAFFRON}
            emissiveIntensity={0.15}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
        <Text
          position={[0, 0, 0.03]}
          fontSize={0.11}
          color="#cfc9bd"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
        >
          {data.title}
        </Text>
      </group>

      {near && (
        <Text
          position={[0, FRAME_H / 2 + 0.28, 0]}
          fontSize={0.09}
          color={SAFFRON}
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          click to step inside
        </Text>
      )}
    </group>
  )
}
