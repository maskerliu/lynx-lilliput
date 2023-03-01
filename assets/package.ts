import * as _axios from '../node_modules/axios/dist/esm/axios.min.js'
import { AxiosStatic } from 'axios'

const ensureImport = <T>(raw: T): T =>
  typeof (raw as any).default === 'object' ? (raw as any).default : raw

// 将其解包、并添加相关的类型推断
export const axios = ensureImport(_axios).default as AxiosStatic
