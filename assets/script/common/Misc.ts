import { Enum, PhysicMaterial } from "cc";

export enum PhyEnvGroup {
  Default = 1 << 0,
  Terrain = 1 << 1,
  Prop = 1 << 2,
  Player = 1 << 3,
  Vehicle = 1 << 4,
  Test = 1 << 5,
}

export const TerrainPhyMtl = new PhysicMaterial()
TerrainPhyMtl.setValues(0.8, 0, 0, 0.4)

export const StaticPropPhyMtl = new PhysicMaterial()
StaticPropPhyMtl.setValues(0, 0, 0, 0.5)

export const DynamicPropPhyMtl = new PhysicMaterial()
DynamicPropPhyMtl.setValues(1, 0, 0, 0.5)

Enum(PhyEnvGroup)