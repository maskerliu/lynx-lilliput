import Colyseus from '@colyseus/schema'

export class ChatMessage extends Colyseus.Schema {
  @Colyseus.type("string") senderId: string = ''
  @Colyseus.type("string") content: string = ''
  @Colyseus.type("number") timestamp: number = 0.0
}

export class ChatRoomState extends Colyseus.Schema {
  @Colyseus.type({ array: ChatMessage }) chatMessages = new Colyseus.ArraySchema<ChatMessage>()
}