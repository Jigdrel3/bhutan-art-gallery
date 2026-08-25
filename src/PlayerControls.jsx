import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MOUSE_SENSITIVITY = 0.00035
const WALK_SPEED = 3.2
const ACCEL = 12
const DAMPING = 10
const EYE_HEIGHT = 1.7

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const PlayerControls = forwardRef(function PlayerControls({ bounds }, ref) {
  const { camera, gl } = useThree()
  const keys = useRef({ forward: false, back: false, left: false, right: false })
  const velocity = useRef(new THREE.Vector3())
  // Spawn just inside the entrance, facing down the hallway (+z).
  const yaw = useRef(Math.PI)
  const pitch = useRef(0)
  const locked = useRef(false)

  const transition = useRef(null)
  const suspended = useRef(false)

  useImperativeHandle(ref, () => ({
    approach(targetPosition, targetYaw, targetPitch, duration, onDone) {
      transition.current = {
        t: 0,
        duration,
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(...targetPosition),
        fromYaw: yaw.current,
        toYaw: targetYaw,
        fromPitch: pitch.current,
        toPitch: targetPitch,
        onDone,
      }
      velocity.current.set(0, 0, 0)
    },
    // Hands full camera control to something else. Restores cleanly:
    // yaw/pitch are re-synced from the camera's actual rotation on resume
    // so mouse-look doesn't jump.
    setSuspended(value) {
      suspended.current = value
      if (!value) {
        yaw.current = camera.rotation.y
        pitch.current = camera.rotation.x
        velocity.current.set(0, 0, 0)
      }
    },
  }))

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 1.6)
  }, [camera])

  useEffect(() => {
    const canvas = gl.domElement

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.back = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true
          break
        default:
          break
      }
    }
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.back = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false
          break
        default:
          break
      }
    }

    const onClick = () => {
      if (!locked.current && !suspended.current) canvas.requestPointerLock()
    }

    const onPointerLockChange = () => {
      locked.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e) => {
      if (!locked.current || transition.current || suspended.current) return
      yaw.current -= e.movementX * MOUSE_SENSITIVITY
      pitch.current -= e.movementY * MOUSE_SENSITIVITY
      pitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch.current))
    }

    // Mouse-drag fallback for users who don't want pointer lock
    let dragging = false
    let lastX = 0
    let lastY = 0
    const onMouseDown = (e) => {
      if (locked.current) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onMouseUp = () => {
      dragging = false
    }
    const onMouseDragMove = (e) => {
      if (!dragging || locked.current || transition.current || suspended.current) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      yaw.current -= dx * MOUSE_SENSITIVITY
      pitch.current -= dy * MOUSE_SENSITIVITY
      pitch.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch.current))
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('click', onClick)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseDragMove)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseDragMove)
    }
  }, [gl])

  const bobTime = useRef(0)

  useFrame((_, delta) => {
    if (suspended.current) return
    const dt = Math.min(delta, 0.05)

    // Approach transition: smoothly push the camera toward a frame, ignoring
    // normal walk/look input until it arrives.
    if (transition.current) {
      const tr = transition.current
      tr.t = Math.min(1, tr.t + dt / tr.duration)
      const e = easeInOutCubic(tr.t)
      camera.position.lerpVectors(tr.fromPos, tr.toPos, e)
      yaw.current = THREE.MathUtils.lerp(tr.fromYaw, tr.toYaw, e)
      pitch.current = THREE.MathUtils.lerp(tr.fromPitch, tr.toPitch, e)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw.current
      camera.rotation.x = pitch.current

      if (tr.t >= 1) {
        const onDone = tr.onDone
        transition.current = null
        onDone && onDone()
      }
      return
    }

    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current

    // Only respond to WASD/arrows while pointer-locked, so the hall camera
    // doesn't drift when arrow keys are being used to flip through a
    // Category Room overlay (or any other unlocked UI) instead.
    const forwardInput = locked.current ? (keys.current.forward ? 1 : 0) - (keys.current.back ? 1 : 0) : 0
    const strafeInput = locked.current ? (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0) : 0

    const forward = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current)).multiplyScalar(-1)
    // NOTE: unlike `forward`, this is not negated — (cos(yaw), 0, -sin(yaw))
    // is already the camera's true world-space right vector at this yaw.
    // Negating it (as a copy-paste from `forward` once did) swaps A/D and
    // the left/right arrow keys.
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const wishDir = new THREE.Vector3()
    wishDir.addScaledVector(forward, forwardInput)
    wishDir.addScaledVector(right, strafeInput)
    if (wishDir.lengthSq() > 0) wishDir.normalize()

    const targetVel = wishDir.multiplyScalar(WALK_SPEED)
    const moving = forwardInput !== 0 || strafeInput !== 0

    velocity.current.x += (targetVel.x - velocity.current.x) * Math.min(1, ACCEL * dt)
    velocity.current.z += (targetVel.z - velocity.current.z) * Math.min(1, ACCEL * dt)
    if (!moving) {
      velocity.current.x -= velocity.current.x * Math.min(1, DAMPING * dt)
      velocity.current.z -= velocity.current.z * Math.min(1, DAMPING * dt)
    }

    let nextX = camera.position.x + velocity.current.x * dt
    let nextZ = camera.position.z + velocity.current.z * dt

    // Collision: clamp inside the hallway's current bounds (grows as
    // categories are added — see App.jsx).
    if (bounds) {
      nextX = Math.max(bounds.minX, Math.min(bounds.maxX, nextX))
      nextZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, nextZ))
    }

    camera.position.x = nextX
    camera.position.z = nextZ

    const speed = Math.hypot(velocity.current.x, velocity.current.z)
    if (speed > 0.05) {
      bobTime.current += dt * speed * 3.2
    }
    const bob = moving ? Math.sin(bobTime.current) * 0.035 : 0
    camera.position.y = EYE_HEIGHT + bob
  })

  return null
})

export default PlayerControls
