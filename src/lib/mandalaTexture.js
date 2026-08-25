import * as THREE from 'three'

// Draws an original geometric mandala (concentric rings, two tiers of
// lotus-petal segments, fine radial spokes, a center medallion) onto a
// canvas, then derives both an emissive map (the etched lines glowing gold)
// and a normal map (so the etching catches light like carved glass/gold
// leaf as the object rotates) from the same pattern. Computed once and
// cached — not recomputed per frame — per the PRD's baked-texture
// requirement.
function drawMandala(ctx, size) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.46

  ctx.clearRect(0, 0, size, size)
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineCap = 'round'

  // Concentric rings
  const ringRadii = [0.18, 0.32, 0.46, 0.62, 0.78, 0.94].map((f) => f * maxR)
  ringRadii.forEach((r, i) => {
    ctx.globalAlpha = i % 2 === 0 ? 0.9 : 0.45
    ctx.lineWidth = i === 0 ? size * 0.006 : size * 0.0025
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  })

  // Lotus petal tiers
  function petalTier(radius, count, petalLen, petalWidth, alpha) {
    ctx.globalAlpha = alpha
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      ctx.save()
      ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
      ctx.rotate(a + Math.PI / 2)
      ctx.beginPath()
      ctx.moveTo(0, -petalLen / 2)
      ctx.quadraticCurveTo(petalWidth / 2, 0, 0, petalLen / 2)
      ctx.quadraticCurveTo(-petalWidth / 2, 0, 0, -petalLen / 2)
      ctx.lineWidth = size * 0.0018
      ctx.stroke()
      ctx.restore()
    }
  }
  petalTier(0.4 * maxR, 12, maxR * 0.22, maxR * 0.1, 0.7)
  petalTier(0.7 * maxR, 20, maxR * 0.26, maxR * 0.11, 0.5)

  // Fine radial spokes
  ctx.globalAlpha = 0.25
  ctx.lineWidth = size * 0.0012
  const spokeCount = 48
  for (let i = 0; i < spokeCount; i++) {
    const a = (i / spokeCount) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * ringRadii[1], cy + Math.sin(a) * ringRadii[1])
    ctx.lineTo(cx + Math.cos(a) * ringRadii[4], cy + Math.sin(a) * ringRadii[4])
    ctx.stroke()
  }

  // Center medallion
  ctx.globalAlpha = 1
  ctx.lineWidth = size * 0.004
  ctx.beginPath()
  ctx.arc(cx, cy, ringRadii[0] * 0.55, 0, Math.PI * 2)
  ctx.stroke()
  const dotCount = 8
  for (let i = 0; i < dotCount; i++) {
    const a = (i / dotCount) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * ringRadii[0] * 0.3, cy + Math.sin(a) * ringRadii[0] * 0.3, size * 0.006, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function heightToNormalMap(sourceCanvas, size) {
  const src = sourceCanvas.getContext('2d').getImageData(0, 0, size, size).data
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const octx = out.getContext('2d')
  const img = octx.createImageData(size, size)

  const luminanceAt = (x, y) => {
    const xi = Math.min(size - 1, Math.max(0, x))
    const yi = Math.min(size - 1, Math.max(0, y))
    return src[(yi * size + xi) * 4] / 255 // red channel, pattern is white-on-black
  }

  const strength = 2.5
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (luminanceAt(x + 1, y) - luminanceAt(x - 1, y)) * strength
      const dy = (luminanceAt(x, y + 1) - luminanceAt(x, y - 1)) * strength
      const nz = 1
      const len = Math.sqrt(dx * dx + dy * dy + nz * nz)
      const idx = (y * size + x) * 4
      img.data[idx] = ((dx / len) * 0.5 + 0.5) * 255
      img.data[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255
      img.data[idx + 3] = 255
    }
  }
  octx.putImageData(img, 0, 0)
  return out
}

function tintCanvas(sourceCanvas, size, hex) {
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const octx = out.getContext('2d')
  octx.drawImage(sourceCanvas, 0, 0)
  octx.globalCompositeOperation = 'source-in'
  octx.fillStyle = hex
  octx.fillRect(0, 0, size, size)
  return out
}

let cached = null

export function getMandalaTextures(color = '#e8a33d', size = 1024) {
  if (cached) return cached

  const pattern = document.createElement('canvas')
  pattern.width = size
  pattern.height = size
  drawMandala(pattern.getContext('2d'), size)

  const normalCanvas = heightToNormalMap(pattern, size)
  const emissiveCanvas = tintCanvas(pattern, size, color)

  const normalMap = new THREE.CanvasTexture(normalCanvas)
  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas)
  normalMap.colorSpace = THREE.NoColorSpace
  emissiveMap.colorSpace = THREE.SRGBColorSpace
  ;[normalMap, emissiveMap].forEach((t) => {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    t.needsUpdate = true
  })

  cached = { normalMap, emissiveMap }
  return cached
}
