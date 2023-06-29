import { Event } from 'cc'

export namespace Lilliput {

  export class UIEvent extends Event {

    static Type = {
      ChatMsg: 'ChatMsg',
      UserInfoBind: 'OnUserInfoBind',
    }

    customData: any

    constructor(type: string, data?: any) {
      super(type, true)
      this.type = type
      this.customData = data
    }
  }
}