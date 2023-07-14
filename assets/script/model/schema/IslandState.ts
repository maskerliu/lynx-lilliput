import Colyseus from '@colyseus/schema'
import { ProfileState } from './UserState'

export class PlayerState extends Colyseus.Schema {
  @Colyseus.type('string') clientId: string = 'ID'

  //Position
  @Colyseus.type('number') px: number = 0.0
  @Colyseus.type('number') py: number = 0.0
  @Colyseus.type('number') pz: number = 0.0
  //Rotation
  @Colyseus.type('number') dx: number = 0.0
  @Colyseus.type('number') dy: number = 0.0
  @Colyseus.type('number') dz: number = 0.0

  // Game.CharacterState
  @Colyseus.type('number') state: number = 0

  @Colyseus.type('number') interactObj: number = Number.MAX_VALUE

  @Colyseus.type('number') timestamp: number = 0.0

  @Colyseus.type(ProfileState) profile: ProfileState = new ProfileState()
}

export class PropState extends Colyseus.Schema {
  @Colyseus.type('string') id: string = 'ID'
  @Colyseus.type('boolean') inUse: boolean = false
  @Colyseus.type('string') interactableType: string = ''
  @Colyseus.type('number') availableTimestamp: number = 0.0
  @Colyseus.type('number') coinChange: number = 0.0
  @Colyseus.type('number') useDuration: number = 0.0
}

export class IslandState extends Colyseus.Schema {
  @Colyseus.type('string') id = ''
  @Colyseus.type({ map: PlayerState }) players = new Colyseus.MapSchema<PlayerState>()
  @Colyseus.type({ map: PropState }) props = new Colyseus.MapSchema<PropState>()
  @Colyseus.type('number') serverTime: number = 0.0
}