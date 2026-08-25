import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DRAG_SENSITIVITY = 0.0055
const ZOOM_SENSITIVITY = 0.0018
const DAMP_SPEED = 9
const MIN_PHI = 0.18 * Math.PI
const MAX_PHI = 0.82 * Math.PI

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export default function StatueOrbit({ active, target, minRadius, maxRadius, controlsRef, onExit }) {
  const { camera, gl } = useThree()
  const targetVec = useRef(new THREE.Vector3(...target))
  const current = useRef(new THREE.Spherical())
  const goal = useRef(new THREE.Spherical())
  const entrySnapshot = useRef(null)
  const wasActive = useRef(false)

  useEffect(() => {
    if (active && !wasActive.current) {
      entrySnapshot.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      }
      const offset = camera.position.clone().sub(targetVec.current)
      const spherical = new THREE.Spherical().setFromVector3(offset)
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, minRadius, maxRadius)
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, MIN_PHI, MAX_PHI)
      current.current.copy(spherical)
      goal.current.copy(spherical)
      controlsRef.current?.setSuspended(true)
    } else if (!active && wasActive.current && entrySnapshot.current) {
      camera.position.copy(entrySnapshot.current.position)
      camera.quaternion.copy(entrySnapshot.current.quaternion)
      controlsRef.current?.setSuspended(false)
    }
    wasActive.current = active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    if (!active) return undefined
    const canvas = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0
    let pinchDist = null

    const onMouseDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onMouseUp = () => {
      dragging = false
    }
    const onMouseMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      goal.current.theta -= dx * DRAG_SENSITIVITY
      goal.current.phi = THREE.MathUtils.clamp(goal.current.phi - dy * DRAG_SENSITIVITY, MIN_PHI, MAX_PHI)
    }
    const onWheel = (e) => {
      e.preventDefault()
      goal.current.radius = THREE.MathUtils.clamp(
        goal.current.radius + e.deltaY * ZOOM_SENSITIVITY,
        minRadius,
        maxRadius
      )
    }
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        dragging = true
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
        goal.current.theta -= dx * DRAG_SENSITIVITY
        goal.current.phi = THREE.MathUtils.clamp(goal.current.phi - dy * DRAG_SENSITIVITY, MIN_PHI, MAX_PHI)
      } else if (e.touches.length === 2 && pinchDist != null) {
        const [a, b] = e.touches
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        const delta = pinchDist - dist
        pinchDist = dist
        goal.current.radius = THREE.MathUtils.clamp(
          goal.current.radius + delta * ZOOM_SENSITIVITY * 4,
          minRadius,
          maxRadius
        )
      }
    }
    const onTouchEnd = () => {
      dragging = false
      pinchDist = null
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [active, gl, minRadius, maxRadius])

  useEffect(() => {
    if (!active) return undefined
    const onKeyDown = (e) => {
      if (e.code === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, onExit])

  useFrame((_, delta) => {
    if (!active) return
    const dt = Math.min(delta, 0.05)
    const damp = Math.min(1, DAMP_SPEED * dt)

    current.current.radius += (goal.current.radius - current.current.radius) * damp
    current.current.phi += (goal.current.phi - current.current.phi) * damp
    const dTheta = wrapAngle(goal.current.theta - current.current.theta)
    current.current.theta += dTheta * damp

    const offset = new THREE.Vector3().setFromSpherical(current.current)
    camera.position.copy(targetVec.current).add(offset)
    camera.lookAt(targetVec.current)
  })

  return null
}
