import { Observable } from "rxjs-compat/bundles/rxjs-compat.umd.min.js"
import type { Executor } from "../src/types"
import * as Selectors from "../src/redux/Selectors"
import * as Immutable from "immutable"

export function createDummyExecutor(id: string): Executor {
  return {
    id,
    name: id,
    scopeName: () => "text.plain",
    send: (code: string) => {},
    output: Observable.create((observer) => {}),
  }
}

const baseAppState = {
  createPasteFunction: null,
  currentExecutorId: "a",
  maxMessageCount: Number.POSITIVE_INFINITY,
  executors: new Map([["a", createDummyExecutor("a")]]),
  providers: new Map(),
  providerStatuses: new Map(),
  records: Immutable.List(),
  incompleteRecords: Immutable.List(),
  history: [],
}

describe("getCurrentExecutorId", () => {
  it("gets the current executor", () => {
    expect(Selectors.getCurrentExecutorId(baseAppState)).toBe("a")
  })

  it("returns an executor even if the current id is null", () => {
    const appState = {
      ...baseAppState,
      currentExecutorId: null,
    }
    expect(Selectors.getCurrentExecutorId(appState)).toBe("a")
  })
})
