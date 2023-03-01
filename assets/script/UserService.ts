import { User, UserApi } from './model'
import { updateAccessToken } from './model/base.api'

class UserService {

  // a04d4751801fd1af5a1c15c24316ea40 顾小兵
  // 5c2c44f25096b201d0c5a716704f4029 刘大毛

  private static _instance: UserService

  private _accessToken: string
  private _profile: User.Profile
  private _profiles: Map<string, User.Profile> = new Map()

  public static instance() {
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

export default UserService.instance()