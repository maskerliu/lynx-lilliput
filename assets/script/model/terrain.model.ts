
export namespace Terrain {

  export enum ModelAnchor {
    Center,
    BottomCenter,
    TopCenter,
  }

  export enum ModelType {
    BlockGrass,
    BlockSnow,
    BlockDirt,
    Skinnable,
    Prop,
    Weapon
  }

  export enum ModelInteraction {
    None,
    Throw,
    Push, // 可推动
    Lift, // 可捡起
    Shake, // 可晃动
    Grab, // 可采集
    Climb, // 可攀爬
    Sit, // 可坐下
    Attack, // 可攻击
    Fire, // 开火
  }

  export interface ModelConfig {
    name: string
    x: number
    y: number
    z: number
    anchor: ModelAnchor
    type: ModelType
    react?: ModelInteraction
    joint?: number[]
    material?: Array<string>
    skin?: number
    interactions?: Array<ModelInteraction> // 道具可被使用的动作
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