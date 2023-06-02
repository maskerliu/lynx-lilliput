
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
    map: Array<MapItem>
    status: IslandStatus
  }

  export enum MapItemSkin {
    Grass,
    Snow,
    Dirt
  }

  export interface MapItem {
    x: number
    y: number
    z: number
    prefab: string
    angle: number
    skin?: MapItemSkin
  }
  
}