
export namespace Island {
  export const Idx_Id = 0
  export const Idx_X = 1
  export const Idx_Y = 2
  export const Idx_Z = 3
  export const Idx_Angle = 4
  export const Idx_Skin = 5

  export enum IslandStatus {
    None,
    Open,
    Close,
    Private
  }

  export interface Island {
    id: string
    owner?: string
    info?: Array<Array<any>>
    status: IslandStatus
  }

  export enum MapItemSkin {
    Grass,
    Snow,
    Dirt
  }

  export enum InfoIndex {
    Id, X, Y, Z, Angle, Skin
  }

  export interface MapItem1 {
    id: number
    x: number
    y: number
    z: number
    angle: number
    skin?: MapItemSkin
    prefab?: string
  }

}