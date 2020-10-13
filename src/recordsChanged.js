import type { Record } from "./types"

/**
 * Check to see if the records have changed. This is optimized to take advantage of the knowledge
 * knowledge that record lists are only ever appended.
 */

export default function recordsChanged(a: Array<Record>, b: Array<Record>): boolean {
  return a.length !== b.length || last(a) !== last(b)
}

const last = (arr) => arr[arr.length - 1]
