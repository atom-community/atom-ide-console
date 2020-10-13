import type { Observable } from "rxjs"
import type { Level } from "./types"

type Send = (event: Object) => void
type Events = Observable<Object>

export default function (send: Send, eventsFromService: Events) {
  return {
    // TODO: Update these to be `(object: any, ...objects: Array<any>): void` to allow for logging objects.
    log(...args: Array<any>): void {
      send(createMessageEvent("log", args))
    },
    error(...args: Array<any>): void {
      send(createMessageEvent("error", args))
    },
    warn(...args: Array<any>): void {
      send(createMessageEvent("warning", args))
    },
    info(...args: Array<any>): void {
      send(createMessageEvent("info", args))
    },
    success(...args: Array<any>): void {
      send(createMessageEvent("success", args))
    },
  }
}

function createMessageEvent(level: Level, args: Array<any>) {
  return {
    type: "message",
    data: { level, args },
  }
}
