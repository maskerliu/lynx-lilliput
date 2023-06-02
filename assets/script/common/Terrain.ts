import { Enum, RigidBody, Vec3 } from "cc"
import { Game } from "../model"




export namespace Terrain {

  export enum PhyEnvGroup {
    Default = 1 << 0,
    Terrain = 1 << 1,
    Prop = 1 << 2,
    Player = 1 << 3,
    Vehicle = 1 << 4,
    Test = 1 << 5,
  }

  Enum(PhyEnvGroup)

  export const TerrainMask = Terrain.PhyEnvGroup.Prop | Terrain.PhyEnvGroup.Player | Terrain.PhyEnvGroup.Vehicle
  export const PropMask = Terrain.PhyEnvGroup.Terrain | Terrain.PhyEnvGroup.Prop | Terrain.PhyEnvGroup.Player | Terrain.PhyEnvGroup.Vehicle
  export const PlayerMask = Terrain.PhyEnvGroup.Terrain | Terrain.PhyEnvGroup.Prop

  export enum ActionType {
    None = 0,
    Add = 2,
    Erase = 3,
    Rotate = 4,
    Move = 5,
    Selected = 6,
    Layer = 7,
  }

  export interface EditAction {
    pos: Vec3
    type: ActionType
    angle: number
  }

  export enum ModelGroup {
    Ground,
    Prop,
    Weapon
  }

  export enum ColliderType {
    None = -1,
    Mesh,
    Box,
    Sphere,
    Cylinder
  }

  export enum InteractType {
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

  export interface ModelInfo {
    name: string
    group: ModelGroup
    skinnable?: boolean
    skins?: string[]
    physical?: {
      type?: RigidBody.Type
      group?: PhyEnvGroup
      isTrriger?: boolean
      collider?: ColliderType
    }
    interaction?: Array<InteractType>
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

