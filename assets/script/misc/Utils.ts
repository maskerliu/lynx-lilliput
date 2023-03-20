
import { Vec3 } from 'cc'

const MAP_X = 20
const MAP_Z = 20
const MAP_Y = 4

export const isDebug = true

export function v3ToXYZ(pos: Vec3) {
  return { x: pos.x, y: pos.y, z: pos.z }
}

export function terrainItemIdx(x: number, y: number, z: number) {
  let x0 = MAP_X / 2 + x
  let z0 = MAP_Z / 2 + z
  return x0 + z0 * MAP_X + y * MAP_Z * MAP_X
}