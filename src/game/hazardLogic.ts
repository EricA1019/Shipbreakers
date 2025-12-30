export function calculateHazardSuccess(skill: number, hazardLevel: number): number {
  // Returns success percentage
  return skill * 20 - hazardLevel * 10;
}

export function damageOnFail(hazardLevel: number): number {
  return hazardLevel * 10;
}
