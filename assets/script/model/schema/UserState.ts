import Colyseus from '@colyseus/schema'


export class ProfileState extends Colyseus.Schema {
  @Colyseus.type('string') uid: string
  @Colyseus.type('string') username: string
  @Colyseus.type('string') prefab: string = 'human'
  @Colyseus.type('string') skin: string = 'default'
}