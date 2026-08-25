// Turns an ordered list of plain category records (id/title/wallText/cover/
// images) into positioned frames on the hall's four walls. This is what
// makes the hall "data-driven": add a 5th category and it just takes the
// next open slot, round-robin across the walls, with no code change.
export const HALL_RADIUS = 10
export const WALL_Y = 2.1
export const FRAME_SPACING = 2.6

// How far in front of a wall the standing marker sits, and how close you
// need to be to it for the frame to light up and respond to a click.
export const STANDOFF = 2.0
export const INTERACT_RADIUS = 1.1

const WALLS = ['north', 'south', 'west', 'east']

function wallTransform(wall, offset) {
  switch (wall) {
    case 'north':
      return { position: [offset, WALL_Y, -HALL_RADIUS + 0.08], rotation: [0, 0, 0] }
    case 'south':
      return { position: [-offset, WALL_Y, HALL_RADIUS - 0.08], rotation: [0, Math.PI, 0] }
    case 'west':
      return { position: [-HALL_RADIUS + 0.08, WALL_Y, offset], rotation: [0, Math.PI / 2, 0] }
    case 'east':
    default:
      return { position: [HALL_RADIUS - 0.08, WALL_Y, -offset], rotation: [0, -Math.PI / 2, 0] }
  }
}

// The point on the floor STANDOFF metres in front of a wall-mounted frame,
// derived from the frame's own facing (rotation[1]).
export function standingSpotFor(position, rotationY) {
  const forward = [-Math.sin(rotationY), -Math.cos(rotationY)] // world XZ the frame faces toward
  return [position[0] - forward[0] * STANDOFF, 0.02, position[2] - forward[1] * STANDOFF]
}

export function layoutCategories(rawList) {
  const byWall = { north: [], south: [], west: [], east: [] }
  rawList.forEach((cat, i) => byWall[WALLS[i % WALLS.length]].push(cat))

  const placed = []
  for (const wall of WALLS) {
    const arr = byWall[wall]
    const n = arr.length
    arr.forEach((cat, idx) => {
      const offset = (idx - (n - 1) / 2) * FRAME_SPACING
      const { position, rotation } = wallTransform(wall, offset)
      placed.push({
        ...cat,
        wall,
        position,
        rotation,
        standingSpot: standingSpotFor(position, rotation[1]),
      })
    })
  }
  return placed
}
