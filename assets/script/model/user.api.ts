import Crypto from 'crypto-es'
import { User } from '.'
import { RemoteAPI } from './api.const'
import { get, post } from './base.api'

export namespace UserApi {

  export function validCheck(phone?: string, username?: string) {
    let data = { phone: phone ? Crypto.MD5(phone) : null, username }
    return get<string>(RemoteAPI.User.BasePath + RemoteAPI.User.ValidCheck, data)
  }

  export function login(phone: string, username: string, pwd: string) {
    let data = { phone: Crypto.MD5(phone), username, pwd: Crypto.MD5(pwd) }
    return post<User.Account & User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.Login, data)
  }

  export function signUp(phone: string, username: string, pwd: string) {
    let data = { phone: `${phone}`, username, pwd: Crypto.MD5(pwd) }
    return post<User.Account & User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.SignUp, data)
  }

  export function userProfile(uid?: string) {
    return get<User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.Profile, { uid })
  }

  export function saveProfile(profile: User.Profile, avatar?: File) {
    let data = new FormData()
    if (profile) data.append('profile', JSON.stringify(profile))
    if (avatar) data.append('avatar', avatar)
    return post<string>(RemoteAPI.User.BasePath + RemoteAPI.User.ProfileSave, data)
  }

  export function searchUser(phone: string) {
    return get<User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.ProfileSearch, { phone: Crypto.MD5(phone) })
  }
}