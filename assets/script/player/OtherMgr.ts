import { Node, quat, Quat, v3, Vec3, _decorator } from 'cc'
import BattleService from '../BattleService'
import { PropMgrs } from '../IslandMgr'
import { Game } from '../model'
import TerrainItemMgr from '../TerrainItemMgr'
import PlayerMgr, { Climb_Speed, Push_Speed } from './PlayerMgr'
const { ccclass, property } = _decorator

const SPEED = 2.6

@ccclass('OtherMgr')
export default class OtherMgr extends PlayerMgr {
  private pos = v3(0, 0, 0.42)
  private prediction: Node
  private _speed = 2.5
  private _needInsert = false // 插帧
  private lstPos = v3()


  onLoad() {
    super.onLoad()

    this.prediction = this.node.getChildByName('Prediction')

  }

  start() {
    super.start()
  }

  onAction(msg: Game.PlayerMsg) {
    super.onAction(msg)

    if (this.curInteractProp) {
      let mgr: TerrainItemMgr
      let clazz = PropMgrs.get(this.curInteractProp.name)
      if (clazz != null) {
        mgr = this.curInteractProp.getComponent(clazz)
      } else {
        mgr = this.curInteractProp.getComponent(TerrainItemMgr)
      }
      BattleService.island()?.handleInteract(mgr.index, msg.state)
    }
  }

  update(dt: number) {
    if (this._isEdit) return
    
    this.popFrame(dt)
    super.update(dt)

    if (this._postState == Game.CharacterState.Run || this._state == Game.CharacterState.Run) {
      // this.character.position = this.pos
      // this.character.rotation = this.node.rotation
    } else {
      // this.character.position = Vec3.ZERO
      // this.character.rotation = this.q
    }

    // this.prediction.rotation = this.node.rotation
  }

  lateUpdate(dt: number) {
    switch (this._state) {
      case Game.CharacterState.Run:
      case Game.CharacterState.Push:
        this.rigidBody.getLinearVelocity(this.v3_speed)
        let speedY = this.v3_speed.y
        if (this.dstPos.equals(Vec3.NEG_ONE)) {
          // if (BattleService.playerFrameCount(this.userProfile.uid) == 0) {
          //   Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), 0)
          // } else {

          // }
          this.v3_speed.set(Vec3.ZERO)
        } else {
          if (this._state == Game.CharacterState.Push) {
            this._speed = Push_Speed
          } else {
            this._speed = SPEED
          }
          Vec3.multiplyScalar(this.v3_speed, this.node.forward.negative(), this._speed)
        }
        this.v3_speed.y = speedY
        this.rigidBody.setLinearVelocity(this.v3_speed)
        break
      case Game.CharacterState.Climb:
        if (this._canClimb) {
          this.v3_speed.set(0, Climb_Speed, 0)
          this.rigidBody.setLinearVelocity(this.v3_speed)
        } else {
          Vec3.multiplyScalar(this.dstPos, this.node.forward.negative(), 0.5)
          this.dstPos.add(this.node.position)
          this._postState = Game.CharacterState.None
        }
        break
    }
    
  }

  protected runTo(dt: number) {
    if (this.dstPos.equals(Vec3.NEG_ONE)) {
      this._canSync = true
      return
    }

    this._canSync = false

    if (this.dstPos.equals(this.node.position, 0.024)) {
      this._canSync = true

      if (this._postState != Game.CharacterState.None) {
        this.state = this._postState
        if (this._postState == Game.CharacterState.Idle) {
          this.node.forward = this.dstForward
          this.dstForward.set(Vec3.NEG_ONE)
        }
        this._postState = Game.CharacterState.None
      }

      this.dstPos.set(Vec3.NEG_ONE)
      return
    }

    this.v3_pos.set(this.node.position)
    this.v3_pos.y = this.dstPos.y

    // 当前位置与目标帧出现较大误差或堆积较多帧时，直接跳帧
    if (Math.abs(this.node.position.y - this.dstPos.y) > 0.1 || BattleService.playerFrameCount(this.userProfile.uid) > 4) {
      this.node.position = this.dstPos
      this.dstPos.set(Vec3.NEG_ONE)
      this.state = this._postState
    } else {
      this.state = Game.CharacterState.Run
      Vec3.subtract(this.v3_dir, this.dstPos, this.v3_pos)
      this._rotationSpeedTo = 0 //Roate_Speed
      this._rotateSpeed = 0
      Quat.fromViewUp(this._rotation, this.v3_dir)
      this.node.rotation = this._rotation
    }
  }

  private popFrame(dt: number) {
    if (!this.dstPos.equals(Vec3.NEG_ONE) || !this._canSync) return

    let frame = BattleService.popPlayerFrame(this.userProfile.uid)
    if (frame) {
      this.onAction(frame)
      return
    }

    if (this._state == Game.CharacterState.Run) {
      // console.log('waitting for frame')
      // this.dstPos.set(this.node.position)
      // this.dstPos.add(this.node.forward.negative().multiplyScalar(dt * 5.6))
      // this._postState = this._state
    }
  }
}