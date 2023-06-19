
export namespace Island {
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