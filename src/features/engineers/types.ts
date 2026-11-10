export type {
  CivilEngineer,
  CivilEngineerOption,
  CreateEngineerInput,
  UpdateEngineerInput,
} from "./api/engineers.types"

/** @deprecated Legacy shape for mock projects screens */
export interface Engineer {
  id: string
  name: string
  phone: string
  email: string
  specialty: string
  licenseNo: string
}
