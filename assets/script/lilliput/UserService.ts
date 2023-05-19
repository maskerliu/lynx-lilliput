import LocalPrefs from '../misc/LocalPrefs'
import { User, UserApi } from '../model'

class UserService {
  private static _instance: UserService

  private _accessToken: string
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

  async profile(uid?: string) {
    try {
      if (uid == null) {
        if (LocalPrefs.myself == null) throw '请先登录'
        this._profiles.set(LocalPrefs.myself.id, LocalPrefs.myself)

        return LocalPrefs.myself
      } else {
        let profile = await UserApi.userProfile(uid)
        this._profiles.set(uid, profile)
        return profile
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export default UserService.instance