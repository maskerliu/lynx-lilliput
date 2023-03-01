import {
  Component, instantiate, Node, Prefab, resources,
  SkeletalAnimation, SkinnedMeshRenderer,
  Texture2D, v2, v3, _decorator
} from 'cc'
const { ccclass, property } = _decorator
// import Paho from 'paho-mqtt'
import { Game } from './model'

let v3_1 = v3()
let v3_2 = v3()
let v2_1 = v2()

const V3_0 = v3()
const V2_0 = v2()


const StateAnim: Map<Game.CharacterState, string> = new Map()

StateAnim.set(Game.CharacterState.Idle, 'Idle')
StateAnim.set(Game.CharacterState.Running, 'Running')
StateAnim.set(Game.CharacterState.Jump, 'Jumping')
StateAnim.set(Game.CharacterState.JumpUp, 'JumpUp')
StateAnim.set(Game.CharacterState.JumpLanding, 'JumpLanding')
StateAnim.set(Game.CharacterState.Sitting, 'Sitting')
StateAnim.set(Game.CharacterState.Dancing, 'Dancing')
StateAnim.set(Game.CharacterState.Lifting, 'Lifting')
StateAnim.set(Game.CharacterState.Throwing, 'Throw')
StateAnim.set(Game.CharacterState.Kicking, 'Kicking')

@ccclass('CharacterMgr')
export default class CharacterMgr extends Component {
  private animation: SkeletalAnimation
  private meshRenderer: SkinnedMeshRenderer
  private _state: Game.CharacterState = Game.CharacterState.Idle
  private model: Node

  onLoad() {
    this.model = this.node.getChildByName('model')
    this.node.getChildByName('model').scale = v3(.35, .35, .35)
    this.animation = this.getComponentInChildren(SkeletalAnimation)
    this.meshRenderer = this.getComponentInChildren(SkinnedMeshRenderer)
  }

  async start() {
    resources.load('prefab/terrain/arrow', Prefab, (err, prefab) => {
      let node = instantiate(prefab)
      node.scale = v3(0.03, .03, .03)
      this.animation.sockets[0].target.addChild(node)
    })
  }


  set skin(skin: string) {
    resources.load(`texture/character/skin/${skin}/texture`, Texture2D, (err, texture) => {
      if (err) {
        console.error(err)
        return
      }
      this.meshRenderer.material.setProperty('mainTexture', texture)
    })
  }

  update(dt: number) {

    if (this._state == Game.CharacterState.JumpUp && !this.animState()) {
      this.updateState(Game.CharacterState.JumpLanding)
    }


    if (this._state == Game.CharacterState.Running) {
      // console.log(this.model.position)
    }

    if (this._state == Game.CharacterState.Jump ||
      this._state == Game.CharacterState.JumpLanding ||
      this._state == Game.CharacterState.Lifting ||
      this._state == Game.CharacterState.Throwing ||
      this._state == Game.CharacterState.Kicking) {
      if (!this.animState()) {
        this.updateState(Game.CharacterState.Idle)
      }
    }
  }

  get state() { return this._state }

  updateState(state: Game.CharacterState): boolean {
    if (this._state == state) return false
    if (this._state != Game.CharacterState.Idle && this._state != Game.CharacterState.Running && this.animState()) return false

    this.animation?.crossFade(StateAnim.get(state), 0)
    this._state = state
    return true
  }

  private animState() {
    return this.animation.getState(StateAnim.get(this.state)).isPlaying
  }
}

