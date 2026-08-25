// Turns an ordered list of plain category records (id/title/wallText/cover/
// images) into a hallway: frames face each other across two side walls,
// added in pairs (left, right, left, right, ...) walking away from the
// entrance, and the hallway's length grows to fit however many categories
// exist — always ending in open space for the terminus piece at the far end.
export const HALLWAY_WIDTH = 8
export const WALL_Y = 2.1
export const SEGMENT_DEPTH = 4.4
export const ENTRANCE_MARGIN = 4.5
export const END_MARGIN = 5.5
export const MIN_LENGTH = ENTRANCE_MARGIN + END_MARGIN

// How far in front of a wall the standing marker sits, and how close you
// need to be to it for the frame to light up and respond to a click.
export const STANDOFF = 1.7
export const INTERACT_RADIUS = 1.05

// The point on the floor STANDOFF metres in front of a wall-mounted frame,
// derived from the frame's own facing (rotation[1]).
export function standingSpotFor(position, rotationY) {
  const forward = [-Math.sin(rotationY), -Math.cos(rotationY)] // world XZ the frame faces toward
  return [position[0] - forward[0] * STANDOFF, 0.02, position[2] - forward[1] * STANDOFF]
}

export function layoutCategories(rawList) {
  const pairCount = Math.ceil(rawList.length / 2)
  const totalLength = Math.max(MIN_LENGTH, ENTRANCE_MARGIN + pairCount * SEGMENT_DEPTH + END_MARGIN)

  const frames = rawList.map((cat, i) => {
    const pairIndex = Math.floor(i / 2)
    const side = i % 2 === 0 ? 'left' : 'right'
    const z = ENTRANCE_MARGIN + pairIndex * SEGMENT_DEPTH + SEGMENT_DEPTH / 2
    const x = side === 'left' ? -HALLWAY_WIDTH / 2 + 0.08 : HALLWAY_WIDTH / 2 - 0.08
    const rotationY = side === 'left' ? Math.PI / 2 : -Math.PI / 2
    const position = [x, WALL_Y, z]
    const rotation = [0, rotationY, 0]
    return { ...cat, side, position, rotation, standingSpot: standingSpotFor(position, rotationY) }
  })

  return { frames, totalLength }
}
