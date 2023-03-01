import { User } from '.'
import { RemoteAPI } from './api.const'
import { formPost, get, post } from './base.api'


export namespace UserApi {

  export function login(phone: string, verifyCode: string) {
    let data = new FormData()
    data.append('phone', phone)
    data.append('verifyCode', verifyCode)
    return formPost<string>(RemoteAPI.User.BasePath + RemoteAPI.User.Login, data)
  }

  export function userProfile(uid?: string) {
    return get<User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.ProfileInfo, { uid: uid })
  }

  export function saveProfile(profile: User.Profile, avatar?: File) {
    let data = new FormData()
    if (profile) data.append('profile', JSON.stringify(profile))
    if (avatar) data.append('avatar', avatar)
    return formPost<string>(RemoteAPI.User.BasePath + RemoteAPI.User.ProfileSave, data,)
  }

  export function searchUser(phone: string) {
    let data = new FormData()
    data.append('phone', phone)
    return formPost<User.Profile>(RemoteAPI.User.BasePath + RemoteAPI.User.ProfileSearch, data)
  }

  export function getContact(page?: number) {
    return get<Array<User.Profile & User.Account>>(RemoteAPI.User.BasePath + RemoteAPI.User.Contact, { page })
  }

  export function vipConfig() {
    return get<Array<User.VIPItem>>(RemoteAPI.VIP.BasePath + RemoteAPI.VIP.Config)
  }

  export function myVIP() {
    return get<User.VIPOrder>(RemoteAPI.VIP.BasePath + RemoteAPI.VIP.MyVIP)
  }

  export function buyVIP(vipId: string) {
    return post<User.VIPOrder>(RemoteAPI.VIP.BasePath + RemoteAPI.VIP.Buy, {}, { vipId })
  }

  export function userGradeInfo() {
    return post<User.UserGradeInfo>(RemoteAPI.User.BasePath + RemoteAPI.User.UserGrade)
  }
}