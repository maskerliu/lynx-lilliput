import { Component, Event, MeshCollider, MeshRenderer, PhysicMaterial, RigidBody, tween, v3, Vec3, _decorator } from 'cc'
// import IslandMgr from './IslandMgr'
import { isDebug, terrainItemIdx } from './misc/Utils'
const { ccclass, property } = _decorator

import IslandAssetMgr, { PhyEnvGroup } from './IslandAssetMgr'
import { Game, Terrain } from './model'

const DROP_Height = 0.4
const DropPos: Vec3 = v3()
const PreviewScale = v3(0.8, 1, 0.8)

const PhyMtl = new PhysicMaterial()
PhyMtl.friction = 0.6
PhyMtl.rollingFriction = 0
PhyMtl.spinningFriction = 0
PhyMtl.restitution = 0.2


export class PropEvent extends Event {
  static Name = 'PropEvent'
  static Type = {
    ShowInteraction: 'ShowInteraction'
  }

  canAction: boolean = false
  propIndex: number = -1
  interactions: Array<Terrain.ModelInteraction>

  constructor(type: string, canAction: boolean, interactions?: Array<Terrain.ModelInteraction>, propIndex: number = -1) {
    super(PropEvent.Name, true)
    this.type = type
    this.canAction = canAction
    this.interactions = interactions
    this.propIndex = propIndex
  }
}

@ccclass('TerrainItemMgr')
export default class TerrainItemMgr extends Component {
  static ItemName: string
  protected _config: Terrain.ModelConfig
  protected _info: Game.MapItem

  public isSelected: boolean = false
  protected isTranslucent: boolean = false
  protected meshRenderer: MeshRenderer
  private isDroping: boolean = false

  protected rigidBody: RigidBody

  get config() { return this._config }
  get info() { return this._info }

  private _index: number = -1
  get index() { return this._index }

  get skinnable() {
    return this._config.skin != null
  }

  onLoad() {
    this.meshRenderer = this.node.getComponentInChildren(MeshRenderer)
    this.rigidBody = this.getComponent(RigidBody)

    let debugNode = this.node.getChildByName('Debug')
    if (debugNode) debugNode.active = isDebug
  }

  init(info: Game.MapItem) {
    this._info = info
    this._config = IslandAssetMgr.getModelConfig(info.prefab)
    this._index = terrainItemIdx(this.info.x, this.info.y, this.info.z)

    switch (this.config.type) {
      case Terrain.ModelType.BlockGrass:
      case Terrain.ModelType.BlockSnow:
      case Terrain.ModelType.BlockDirt:
        this.node.position = v3(info.x, info.y + 1 - this.config.y, info.z)

        if (this.rigidBody == null) {
          this.addComponent(RigidBody)

          this.rigidBody = this.getComponent(RigidBody)
          this.rigidBody.type = RigidBody.Type.STATIC
          this.rigidBody.group = PhyEnvGroup.Terrain
          this.rigidBody.setMask(PhyEnvGroup.Prop | PhyEnvGroup.Player | PhyEnvGroup.Vehicle)

          this.node.addComponent(MeshCollider)
          let collider = this.node.getComponent(MeshCollider)
          collider.convex = true
          collider.mesh = this.meshRenderer.mesh
          collider.material = PhyMtl
        }

        break
      case Terrain.ModelType.Skinnable:
      case Terrain.ModelType.Prop: {
        this.node.position = v3(info.x, info.y, info.z)
        break
      }
    }
  }

  updatePosition(pos: Vec3) {
    this.node.active = true
    this.info.x = pos.x
    this.info.y = pos.y
    this.info.z = pos.z
    let tmp = v3(pos)
    this.node.active = true
    if (this.config.type != Terrain.ModelType.Prop && this.config.type != Terrain.ModelType.Skinnable) {
      tmp.y = tmp.y + 1 - this.config.y
    }
    tmp.y += DROP_Height
    this.node.position = tmp

    this.node.scale = v3(0.8, 1, 0.8)
    this.isSelected = true
    this.onSelected(false)
  }

  onSelected(selected: boolean) {
    if (this.isSelected == selected) return
    if (this.isDroping) return

    this.isDroping = true
    DropPos.set(this.node.position)

    if (!selected && this.isSelected) {
      DropPos.y -= DROP_Height
    }

    if (selected && !this.isSelected) {
      DropPos.y += DROP_Height
    }

    tween(this.node).to(0.5, { position: DropPos }, {
      easing: 'bounceOut', onComplete: () => {
        this.isSelected = selected
        this.isDroping = false
      }
    }).start()
  }

  preview() {
    tween(this.node).to(0.5, { scale: PreviewScale }, { easing: 'bounceOut' }).start()
  }

  translucent(did: boolean) {
    if (this.isTranslucent == did) return

    for (let i = 0; i < this.config.material.length; ++i) {
      let name = !this.isTranslucent && did ? `${this.config.material[i]}-translucent` : this.config.material[i]
      this.meshRenderer.setMaterial(IslandAssetMgr.getMaterial(name), i)
    }

    this.isTranslucent = did
  }

  apply() {
    this.onSelected(false)
    this.translucent(false)
    tween(this.node).to(0.5, { scale: Vec3.ONE }, { easing: 'bounceIn' }).start()
  }

  interact(action: Game.CharacterState) {
    // default do nothing, u can implement this func to apply interact 
    console.log(action)
  }

  shake(dir: Vec3) {
    let origin = v3(this.node.position)
    let pos = v3(this.node.position)
    pos.x += dir.x / 8
    pos.z += dir.z / 8
    tween(this.node).delay(0.3).to(0.5, { position: pos }, {
      easing: 'bounceIn', onComplete: () => {
        this.node.position = origin
      }
    }).start()
  }

  beenCollected() {
    let info = Object.assign(this.info)
    info.prefab = null
    // this.node.parent.getComponent(IslandMgr).updateMap(info)
  }
}