import { User, UserApi } from '../model'
import { updateAccessToken } from '../model/base.api'

class UserService {

  // 顾小兵
  // token be6db1131aef720df2639907367aa06a
  // uid 8f4e7438-4285-4268-910c-3898fb8d6d96

  // 刘大毛
  // token 5c2c44f25096b201d0c5a716704f4029 
  // uid   f947ed55-7e34-4a82-a9db-8a9cf6f2e608

  // 孙大强
  // token 4a8888c8b9294f50c19db6d93ca99eed
  // uid 5ee13634-340c-4741-b075-7fe169e38a13

  // 王武
  // token d43f32054bd2de9a430ef4bb6b1dbcc1
  // uid 4e6434d1-5910-46c3-879d-733c33ded257

  // 李国庆
  // token 73c1dfca26ef693a025fbf3cc0a67c87
  // uid b09272b8-d6a4-438b-96c3-df50ac206706

  private static _instance: UserService

  private _accessToken: string
  private _profile: User.Profile
  private _profiles: Map<string, User.Profile> = new Map()

  public static get instance() {
    if (UserService._instance == null) {
      return new UserService()
    }
    return this._instance
  }

  private constructor() {
    UserService._instance = this
  }

  set accessToken(token: string) {
    this._accessToken = token
    updateAccessToken(this._accessToken)

    this._profile = null
  }

  get accessToken() { return this._accessToken }

  async profile(uid?: string) {
    try {
      let key = uid
      if (key == null) {
        if (this._profile == null) {
          this._profile = await UserApi.userProfile()
          key = this._profile.uid
          this._profiles.set(key, this._profile)
        } else {
          key = this._profile.uid
        }
      } else {
        let profile = await UserApi.userProfile(uid)
        this._profiles.set(key, profile)
      }
      return this._profiles.get(key)
    } catch (err) {
      console.error(err)
    }
  }
}

export default UserService.instance