import { Camera, Component, Enum, Event, Node, RigidBody, SkeletalAnimation, Vec3, __private } from 'cc'
import { Game, Island, PlayerState, User } from '../model'


export namespace BigWorld {

  export const Cube_F = 0b000000001
  export const Cube_B = 0b000000010
  export const Cube_L = 0b000000100
  export const Cube_R = 0b000001000
  export const Cube_U = 0b000010000
  export const Cube_UL = 0b000100000
  export const Cube_UR = 0b001000000
  export const Cube_UF = 0b010000000
  export const Cube_UB = 0b100000000

  export enum PhyEnvGroup {
    Default = 1 << 0,
    Terrain = 1 << 1,
    Prop = 1 << 2,
    Player = 1 << 3,
    Vehicle = 1 << 4,
    Test = 1 << 5,
  }

  Enum(PhyEnvGroup)

  export const GroundMask = PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle
  export const PropMask = PhyEnvGroup.Terrain | PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle
  export const PlayerMask = PhyEnvGroup.Terrain | PhyEnvGroup.Prop | PhyEnvGroup.Default

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
    Weapon,
    Decorator
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
    id: number
    name: string
    group: ModelGroup
    skinnable?: boolean
    skins?: string[]
    physical?: {
      type?: RigidBody.Type
      group?: PhyEnvGroup
      mass?: number
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

  export class IslandEvent extends Event {
    customData: {
      prefab?: number // model id
      action?: ActionType
      layer?: number
      degree?: number
      skin?: Island.MapItemSkin
      show?: boolean // show skin menu
      msg?: any
    }

    static Type = {
      OnEditChanged: 'OnEditChanged',
      OnItemChanged: 'OnEditItemChanged',
      OnActionChanged: 'OnEditActionChanged',
      OnLayerChanged: 'OnEditLayerChanged',
      OnRotate: 'OnRotate',
      OnSkinChanged: 'OnSkinChanged',
      SkinMenu: 'SkinMenu',
      OnMsgArrived: 'OnMsgArrived'
    }

    constructor(type: string, data?: any) {
      super(type, true)

      this.customData = data
    }
  }

  export class PropEvent extends Event {
    static Type = {
      ShowInteractMenu: 'ShowInteractMenu'
    }

    interactions: Array<InteractType>

    constructor(type: string, interactions?: Array<InteractType>) {
      super(type, true)
      this.type = type
      this.interactions = interactions
    }
  }

  export class PlayerEvent extends Event {
    action: Game.CharacterState
    interactProp: number
    customData?: any

    static Type = {
      TryEnter: 'TryEnter',
      DidEnter: 'DidEnter',
      OnLeave: 'OnLeave',
      OnAction: 'OnAction',
    }

    constructor(type: string, action: Game.CharacterState = Game.CharacterState.None, interactProp: number = -1) {
      super(type, true)
      this.action = action
      this.interactProp = interactProp
    }
  }

  export abstract class MapItemMgr extends Component {
    static ItemName: string = 'common'

    abstract get index(): number
    abstract get config(): ModelInfo
    abstract get info(): Array<number>
    abstract get loaded(): boolean
    abstract get selected(): boolean
    abstract set selected(isSelected: boolean)
    abstract get skinnable(): boolean
    get modelPos(): Vec3 { return this.node.position }
    set matrix(data: number) { }

    abstract init(info: Array<number>, preview: boolean): void
    abstract preview(preview: boolean): void
    abstract hide(): void
    abstract angle(oldAngle: number): number
    abstract rotate(angle: number): void
    abstract enablePhysic(active: boolean): void

    protected abstract initPhysical(): void

    canInteract(action: InteractType): boolean {
      if (this.config.interaction == null) return false
      return this.config.interaction.includes(action)
    }

    interact(action: Game.CharacterState) {
      // default do nothing, u can implement this func to apply interact
    }

    updateSkin(skin?: Island.MapItemSkin): void { }
  }

  export abstract class IslandMgr extends Component {
    abstract get senceInfo(): Island.Island
    abstract get isEdit(): boolean

    abstract set reactArea(node: Node)

    abstract init(camera: Camera, id?: string, uid?: string): Promise<void>
    abstract mapInfo(idx: number): MapItemMgr
    abstract canEdit(uid: string): boolean
    abstract enablePhysic(enable: boolean): void

    abstract handleInteract(index: number, action: Game.CharacterState): void

    abstract onEditModeChanged(): Promise<void>
    abstract onEditItemChanged(event: IslandEvent): void
    abstract onEditActionChanged(event: IslandEvent): void
    abstract onEditLayerChanged(event: IslandEvent): void
    abstract onRotate(event: IslandEvent): void
    abstract onSkinChanged(event: IslandEvent): void
  }


  export const PlayerSyncableStates = [
    Game.CharacterState.Idle,
    Game.CharacterState.Run,
    Game.CharacterState.TreadWater,
    Game.CharacterState.Swim
  ]

  export const PlayerInteractStates = [
    Game.CharacterState.Attack,
    Game.CharacterState.Climb,
    Game.CharacterState.Grab,
    Game.CharacterState.Kick,
    Game.CharacterState.Lift,
    Game.CharacterState.PickUp,
    Game.CharacterState.Sit,
  ]

  const PlayerAnim: Map<Game.CharacterState, string> = new Map()

  PlayerAnim.set(Game.CharacterState.Idle, 'Idle')
  PlayerAnim.set(Game.CharacterState.Run, 'Run')
  PlayerAnim.set(Game.CharacterState.Sit, 'Sit')
  PlayerAnim.set(Game.CharacterState.Climb, 'Climb')
  PlayerAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
  PlayerAnim.set(Game.CharacterState.JumpLand, 'JumpLand')
  PlayerAnim.set(Game.CharacterState.Lift, 'Lift')
  PlayerAnim.set(Game.CharacterState.Throw, 'Throw')
  PlayerAnim.set(Game.CharacterState.Kick, 'Kick')
  PlayerAnim.set(Game.CharacterState.Grab, 'Grab')
  PlayerAnim.set(Game.CharacterState.PickUp, 'PickUp')
  PlayerAnim.set(Game.CharacterState.Attack, 'AttackDownward')
  PlayerAnim.set(Game.CharacterState.BwolingThrow, 'BwolingThrow')
  PlayerAnim.set(Game.CharacterState.FrisbeeThrow, 'FrisbeeThrow')
  PlayerAnim.set(Game.CharacterState.GunFire, 'GunFire')
  PlayerAnim.set(Game.CharacterState.Swim, 'Swim')
  PlayerAnim.set(Game.CharacterState.TreadWater, 'TreadWater')
  PlayerAnim.set(Game.CharacterState.Kneel, 'Kneel')

  export abstract class PlayerMgr extends Component {

    protected animation: SkeletalAnimation

    abstract get profile(): User.Profile
    abstract get state(): Game.CharacterState

    abstract set followCamera(node: Node)

    abstract init(profile: User.Profile): void
    enter(island: IslandMgr, state: PlayerState): void { }
    leave(): void { }

    abstract onAction(msg: Game.PlayerMsg): void

    sleep(active: boolean): void { }

    protected anim(state: Game.CharacterState) {
      return PlayerAnim.get(state)
    }

    protected get animState() {
      return this.animation?.getState(PlayerAnim.get(this.state))?.isPlaying
    }
  }

  const propMgrs: Map<string, __private._types_globals__Constructor<MapItemMgr>> = new Map()

  export function setPropMgr(name: string, clazz: __private._types_globals__Constructor<MapItemMgr>) {
    propMgrs.set(name, clazz)
  }

  export function getPropMgr(name: string) {
    return propMgrs.has(name) ? propMgrs.get(name) : propMgrs.get(MapItemMgr.ItemName)
  }
}

