import { Vec3 } from "cc"

export enum TerrainEditActionType {
  None = 0,
  Add_Preview = 1,
  Add_Done = 2,
  Erase = 3,
  Rotate = 4,
  Move = 5,
  Selected = 6,
  Layer = 7,
}

export interface TerrainEditAction {
  pos: Vec3
  type: TerrainEditActionType
  angle: number
}

export interface TerrainEditHandler {

  onEditModeChanged(isEdit: boolean): void

  onEditItemChanged(name: string): void

  onEditActionChanged(type: TerrainEditActionType): void

  onEditLayerChanged(layer: number): void

  onRotate(degree: number): void

  onSkinChanged(skin: string): void
}