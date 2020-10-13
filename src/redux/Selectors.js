import type { AppState, Record } from "../types"
import type { List } from "immutable"

export function getAllRecords(state: AppState): List<Record> {
  const { records, incompleteRecords } = state
  return records.concat(incompleteRecords)
}

export function getCurrentExecutorId(state: AppState): ?string {
  let { currentExecutorId } = state
  if (currentExecutorId == null) {
    const firstExecutor = Array.from(state.executors.values())[0]
    currentExecutorId = firstExecutor && firstExecutor.id
  }
  return currentExecutorId
}
