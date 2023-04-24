import { Enum, PhysicMaterial } from "cc";

export enum PhyEnvGroup {
  Default = 1 << 0,
  Terrain = 1 << 1,
  Prop = 1 << 2,
  Player = 1 << 3,
  Vehicle = 1 << 4,
  Test = 1 << 5,
}

export const TerrainMtl = new PhysicMaterial()
TerrainMtl.setValues(0.8, 0, 0, 0.4)

export const PropMtl = new PhysicMaterial()
PropMtl.setValues(0, 0, 0, 0.5)

export const DynamicPropMtl = new PhysicMaterial()
DynamicPropMtl.setValues(1, 0, 0, 0.5)

Enum(PhyEnvGroup)