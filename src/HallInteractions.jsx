import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { STANDOFF, INTERACT_RADIUS } from './layout'

const EYE_HEIGHT = 1.7

export function findNearestCategory(position, categories) {
  let nearest = null
  let nearestDist = Infinity
  for (const cat of categories) {
    const dx = position.x - cat.standingSpot[0]
    const dz = position.z - cat.standingSpot[2]
    const dist = Math.hypot(dx, dz)
    if (dist < INTERACT_RADIUS && dist < nearestDist) {
      nearestDist = dist
      nearest = cat
    }
  }
  return nearest
}

export function approachParamsFor(cat) {
  const position = [cat.standingSpot[0], EYE_HEIGHT, cat.standingSpot[2]]
  const yaw = cat.rotation[1]
  const dy = cat.position[1] - EYE_HEIGHT
  const pitch = Math.atan2(dy, STANDOFF) * 0.7
  return { position, yaw, pitch }
}

export default function HallInteractions({ categories, onEnter, disabled }) {
  const { camera, gl } = useThree()
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const onEnterRef = useRef(onEnter)
  onEnterRef.current = onEnter
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories

  useEffect(() => {
    const canvas = gl.domElement
    const onClick = () => {
      if (disabledRef.current) return
      if (document.pointerLockElement !== canvas) return
      const nearest = findNearestCategory(camera.position, categoriesRef.current)
      if (nearest) onEnterRef.current(nearest)
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [camera, gl])

  return null
}
