
export namespace Terrain {

  export enum ModelAnchor {
    Center,
    BottomCenter,
    TopCenter,
  }

  export enum ModelType {
    Ground,
    Prop,
  }

  export enum ModelReact {
    None,
    Push, // 可推动
    Lift, // 可捡起
    Shake // 可晃动
  }

  export interface ModelConfig {
    name: string
    x: number
    y: number
    z: number
    anchor: ModelAnchor
    type: ModelType
    react?: ModelReact
    joint?: number[]
    material?: Array<string>
    skin?: any
    action?: Array<number> // 道具可被使用的动作
  }

  export enum AssetType {
    Texture,
    SpriteFrame,
    SpriteAtlas,
  }

  export interface AssetConfig {
    name: string
    path: string
    type: AssetType

  }
}