/** In-process lock so historical + recent sync don't overlap for one athlete. */
const syncingAthletes = new Set<string>()

export function tryBeginAthleteSync(athleteId: string): boolean {
  if (syncingAthletes.has(athleteId)) return false
  syncingAthletes.add(athleteId)
  return true
}

export function endAthleteSync(athleteId: string): void {
  syncingAthletes.delete(athleteId)
}
