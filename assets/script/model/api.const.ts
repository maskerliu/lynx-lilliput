export namespace RemoteAPI {

  export const Host = '192.168.24.77'
  // export const Host = '192.168.101.7'

  export const User = {
    BasePath: '/user',
    ValidCheck: '/validCheck',
    Login: '/login',
    SignUp: '/signUp',
    Profile: '/profile/info',
    ProfileSave: '/profile/save',
    ProfileSearch: '/profile/search',
  }

  export const Island = {
    BasePath: '/island',
    Info: '/info',
    Update: '/update',
    Enter: '/enter',
    Leave: '/leave',
    Action: '/sync',
  }
}