"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerExecutorEpic = registerExecutorEpic;
exports.executeEpic = executeEpic;
exports.trackEpic = trackEpic;
exports.registerRecordProviderEpic = registerRecordProviderEpic;

var _event = require("@atom-ide-community/nuclide-commons/event");

var Actions = _interopRequireWildcard(require("./Actions"));

var Selectors = _interopRequireWildcard(require("./Selectors"));

var _assert = _interopRequireDefault(require("assert"));

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

var _analytics = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/analytics"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Register a record provider for every executor.
 */
function registerExecutorEpic(actions, store) {
  return actions.ofType(Actions.REGISTER_EXECUTOR).map(action => {
    (0, _assert.default)(action.type === Actions.REGISTER_EXECUTOR);
    const {
      executor
    } = action.payload;
    return Actions.registerRecordProvider({
      id: executor.id,
      // $FlowIssue: Flow is having some trouble with the spread here.
      records: executor.output.map(message => {
        var _message$incomplete;

        return { ...message,
          // $FlowIssue: TODO with above.
          incomplete: (_message$incomplete = message.incomplete) !== null && _message$incomplete !== void 0 ? _message$incomplete : false,
          kind: "response",
          sourceId: executor.id,
          scopeName: null,
          // The output won't be in the language's grammar.
          // Eventually, we'll want to allow providers to specify custom timestamps for records.
          timestamp: new Date(),
          executor
        };
      })
    });
  });
}
/**
 * Execute the provided code using the current executor.
 */


function executeEpic(actions, store) {
  return actions.ofType(Actions.EXECUTE).flatMap(action => {
    (0, _assert.default)(action.type === Actions.EXECUTE);
    const {
      code
    } = action.payload;
    const currentExecutorId = Selectors.getCurrentExecutorId(store.getState()); // flowlint-next-line sketchy-null-string:off

    (0, _assert.default)(currentExecutorId);
    const executor = store.getState().executors.get(currentExecutorId);
    (0, _assert.default)(executor != null); // TODO: Is this the best way to do this? Might want to go through nuclide-executors and have
    //       that register output sources?

    return _rxjsCompatUmdMin.Observable.of(Actions.recordReceived({
      // Eventually, we'll want to allow providers to specify custom timestamps for records.
      timestamp: new Date(),
      sourceId: currentExecutorId,
      sourceName: executor.name,
      kind: "request",
      level: "log",
      text: code,
      scopeName: executor.scopeName(),
      repeatCount: 1,
      incomplete: false
    })) // Execute the code as a side-effect.
    .finally(() => {
      executor.send(code);
    });
  });
}

function trackEpic(actions, store) {
  return actions.ofType(Actions.EXECUTE).map(action => ({
    type: "console:execute"
  })).do(_analytics.default.trackEvent).ignoreElements();
}

function registerRecordProviderEpic(actions, store) {
  return actions.ofType(Actions.REGISTER_RECORD_PROVIDER).flatMap(action => {
    (0, _assert.default)(action.type === Actions.REGISTER_RECORD_PROVIDER);
    const {
      recordProvider
    } = action.payload; // Transform the messages into actions and merge them into the action stream.
    // TODO: Add enabling/disabling of registered source and only subscribe when enabled. That
    //       way, we won't trigger cold observer side-effects when we don't need the results.

    const messageActions = recordProvider.records.map(Actions.recordReceived); // TODO: Can this be delayed until sometime after registration?

    const statusActions = // $FlowFixMe(>=0.68.0) Flow suppress (T27187857)
    typeof recordProvider.observeStatus === "function" ? (0, _event.observableFromSubscribeFunction)(recordProvider.observeStatus).map(status => Actions.updateStatus(recordProvider.id, status)) : _rxjsCompatUmdMin.Observable.empty();
    const unregisteredEvents = actions.ofType(Actions.REMOVE_SOURCE).filter(a => {
      (0, _assert.default)(a.type === Actions.REMOVE_SOURCE);
      return a.payload.sourceId === recordProvider.id;
    });
    return _rxjsCompatUmdMin.Observable.merge(_rxjsCompatUmdMin.Observable.of(Actions.registerSource({ ...recordProvider,
      name: recordProvider.id
    })), messageActions, statusActions).takeUntil(unregisteredEvents);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkVwaWNzLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyRXhlY3V0b3JFcGljIiwiYWN0aW9ucyIsInN0b3JlIiwib2ZUeXBlIiwiQWN0aW9ucyIsIlJFR0lTVEVSX0VYRUNVVE9SIiwibWFwIiwiYWN0aW9uIiwidHlwZSIsImV4ZWN1dG9yIiwicGF5bG9hZCIsInJlZ2lzdGVyUmVjb3JkUHJvdmlkZXIiLCJpZCIsInJlY29yZHMiLCJvdXRwdXQiLCJtZXNzYWdlIiwiaW5jb21wbGV0ZSIsImtpbmQiLCJzb3VyY2VJZCIsInNjb3BlTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJleGVjdXRlRXBpYyIsIkVYRUNVVEUiLCJmbGF0TWFwIiwiY29kZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiU2VsZWN0b3JzIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJnZXRTdGF0ZSIsImV4ZWN1dG9ycyIsImdldCIsIk9ic2VydmFibGUiLCJvZiIsInJlY29yZFJlY2VpdmVkIiwic291cmNlTmFtZSIsIm5hbWUiLCJsZXZlbCIsInRleHQiLCJyZXBlYXRDb3VudCIsImZpbmFsbHkiLCJzZW5kIiwidHJhY2tFcGljIiwiZG8iLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiaWdub3JlRWxlbWVudHMiLCJyZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyIsIlJFR0lTVEVSX1JFQ09SRF9QUk9WSURFUiIsInJlY29yZFByb3ZpZGVyIiwibWVzc2FnZUFjdGlvbnMiLCJzdGF0dXNBY3Rpb25zIiwib2JzZXJ2ZVN0YXR1cyIsInN0YXR1cyIsInVwZGF0ZVN0YXR1cyIsImVtcHR5IiwidW5yZWdpc3RlcmVkRXZlbnRzIiwiUkVNT1ZFX1NPVVJDRSIsImZpbHRlciIsImEiLCJtZXJnZSIsInJlZ2lzdGVyU291cmNlIiwidGFrZVVudGlsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUE7OztBQUdPLFNBQVNBLG9C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QkFBVzRCLEtBQVgsQ0FDTDVCLDZCQUFXQyxFQUFYLENBQWM3QixPQUFPLENBQUN5RCxjQUFSLENBQXVCLEVBQUUsR0FBR1osY0FBTDtBQUFxQmIsTUFBQUEsSUFBSSxFQUFFYSxjQUFjLENBQUNyQztBQUExQyxLQUF2QixDQUFkLENBREssRUFFTHNDLGNBRkssRUFHTEMsYUFISyxFQUlMVyxTQUpLLENBSUtOLGtCQUpMLENBQVA7QUFLRCxHQTVCTSxDQUFQO0FBNkJEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBY3Rpb24sIFN0b3JlIH0gZnJvbSBcIi4uL3R5cGVzXCJcbmltcG9ydCB0eXBlIHsgQWN0aW9uc09ic2VydmFibGUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvcmVkdXgtb2JzZXJ2YWJsZVwiXG5cbmltcG9ydCB7IG9ic2VydmFibGVGcm9tU3Vic2NyaWJlRnVuY3Rpb24gfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZXZlbnRcIlxuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tIFwiLi9BY3Rpb25zXCJcbmltcG9ydCAqIGFzIFNlbGVjdG9ycyBmcm9tIFwiLi9TZWxlY3RvcnNcIlxuaW1wb3J0IGludmFyaWFudCBmcm9tIFwiYXNzZXJ0XCJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzXCJcbmltcG9ydCBhbmFseXRpY3MgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2FuYWx5dGljc1wiXG5cbi8qKlxuICogUmVnaXN0ZXIgYSByZWNvcmQgcHJvdmlkZXIgZm9yIGV2ZXJ5IGV4ZWN1dG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJFeGVjdXRvckVwaWMoYWN0aW9uczogQWN0aW9uc09ic2VydmFibGU8QWN0aW9uPiwgc3RvcmU6IFN0b3JlKTogT2JzZXJ2YWJsZTxBY3Rpb24+IHtcbiAgcmV0dXJuIGFjdGlvbnMub2ZUeXBlKEFjdGlvbnMuUkVHSVNURVJfRVhFQ1VUT1IpLm1hcCgoYWN0aW9uKSA9PiB7XG4gICAgaW52YXJpYW50KGFjdGlvbi50eXBlID09PSBBY3Rpb25zLlJFR0lTVEVSX0VYRUNVVE9SKVxuICAgIGNvbnN0IHsgZXhlY3V0b3IgfSA9IGFjdGlvbi5wYXlsb2FkXG4gICAgcmV0dXJuIEFjdGlvbnMucmVnaXN0ZXJSZWNvcmRQcm92aWRlcih7XG4gICAgICBpZDogZXhlY3V0b3IuaWQsXG4gICAgICAvLyAkRmxvd0lzc3VlOiBGbG93IGlzIGhhdmluZyBzb21lIHRyb3VibGUgd2l0aCB0aGUgc3ByZWFkIGhlcmUuXG4gICAgICByZWNvcmRzOiBleGVjdXRvci5vdXRwdXQubWFwKChtZXNzYWdlKSA9PiAoe1xuICAgICAgICAuLi5tZXNzYWdlLFxuICAgICAgICAvLyAkRmxvd0lzc3VlOiBUT0RPIHdpdGggYWJvdmUuXG4gICAgICAgIGluY29tcGxldGU6IG1lc3NhZ2UuaW5jb21wbGV0ZSA/PyBmYWxzZSxcbiAgICAgICAga2luZDogXCJyZXNwb25zZVwiLFxuICAgICAgICBzb3VyY2VJZDogZXhlY3V0b3IuaWQsXG4gICAgICAgIHNjb3BlTmFtZTogbnVsbCwgLy8gVGhlIG91dHB1dCB3b24ndCBiZSBpbiB0aGUgbGFuZ3VhZ2UncyBncmFtbWFyLlxuICAgICAgICAvLyBFdmVudHVhbGx5LCB3ZSdsbCB3YW50IHRvIGFsbG93IHByb3ZpZGVycyB0byBzcGVjaWZ5IGN1c3RvbSB0aW1lc3RhbXBzIGZvciByZWNvcmRzLlxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGV4ZWN1dG9yLFxuICAgICAgfSkpLFxuICAgIH0pXG4gIH0pXG59XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgcHJvdmlkZWQgY29kZSB1c2luZyB0aGUgY3VycmVudCBleGVjdXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVFcGljKGFjdGlvbnM6IEFjdGlvbnNPYnNlcnZhYmxlPEFjdGlvbj4sIHN0b3JlOiBTdG9yZSk6IE9ic2VydmFibGU8QWN0aW9uPiB7XG4gIHJldHVybiBhY3Rpb25zLm9mVHlwZShBY3Rpb25zLkVYRUNVVEUpLmZsYXRNYXAoKGFjdGlvbikgPT4ge1xuICAgIGludmFyaWFudChhY3Rpb24udHlwZSA9PT0gQWN0aW9ucy5FWEVDVVRFKVxuICAgIGNvbnN0IHsgY29kZSB9ID0gYWN0aW9uLnBheWxvYWRcbiAgICBjb25zdCBjdXJyZW50RXhlY3V0b3JJZCA9IFNlbGVjdG9ycy5nZXRDdXJyZW50RXhlY3V0b3JJZChzdG9yZS5nZXRTdGF0ZSgpKVxuICAgIC8vIGZsb3dsaW50LW5leHQtbGluZSBza2V0Y2h5LW51bGwtc3RyaW5nOm9mZlxuICAgIGludmFyaWFudChjdXJyZW50RXhlY3V0b3JJZClcblxuICAgIGNvbnN0IGV4ZWN1dG9yID0gc3RvcmUuZ2V0U3RhdGUoKS5leGVjdXRvcnMuZ2V0KGN1cnJlbnRFeGVjdXRvcklkKVxuICAgIGludmFyaWFudChleGVjdXRvciAhPSBudWxsKVxuXG4gICAgLy8gVE9ETzogSXMgdGhpcyB0aGUgYmVzdCB3YXkgdG8gZG8gdGhpcz8gTWlnaHQgd2FudCB0byBnbyB0aHJvdWdoIG51Y2xpZGUtZXhlY3V0b3JzIGFuZCBoYXZlXG4gICAgLy8gICAgICAgdGhhdCByZWdpc3RlciBvdXRwdXQgc291cmNlcz9cbiAgICByZXR1cm4gKFxuICAgICAgT2JzZXJ2YWJsZS5vZihcbiAgICAgICAgQWN0aW9ucy5yZWNvcmRSZWNlaXZlZCh7XG4gICAgICAgICAgLy8gRXZlbnR1YWxseSwgd2UnbGwgd2FudCB0byBhbGxvdyBwcm92aWRlcnMgdG8gc3BlY2lmeSBjdXN0b20gdGltZXN0YW1wcyBmb3IgcmVjb3Jkcy5cbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgc291cmNlSWQ6IGN1cnJlbnRFeGVjdXRvcklkLFxuICAgICAgICAgIHNvdXJjZU5hbWU6IGV4ZWN1dG9yLm5hbWUsXG4gICAgICAgICAga2luZDogXCJyZXF1ZXN0XCIsXG4gICAgICAgICAgbGV2ZWw6IFwibG9nXCIsXG4gICAgICAgICAgdGV4dDogY29kZSxcbiAgICAgICAgICBzY29wZU5hbWU6IGV4ZWN1dG9yLnNjb3BlTmFtZSgpLFxuICAgICAgICAgIHJlcGVhdENvdW50OiAxLFxuICAgICAgICAgIGluY29tcGxldGU6IGZhbHNlLFxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgICAvLyBFeGVjdXRlIHRoZSBjb2RlIGFzIGEgc2lkZS1lZmZlY3QuXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICBleGVjdXRvci5zZW5kKGNvZGUpXG4gICAgICAgIH0pXG4gICAgKVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhY2tFcGljKGFjdGlvbnM6IEFjdGlvbnNPYnNlcnZhYmxlPEFjdGlvbj4sIHN0b3JlOiBTdG9yZSk6IE9ic2VydmFibGU8ZW1wdHk+IHtcbiAgcmV0dXJuIGFjdGlvbnNcbiAgICAub2ZUeXBlKEFjdGlvbnMuRVhFQ1VURSlcbiAgICAubWFwKChhY3Rpb24pID0+ICh7IHR5cGU6IFwiY29uc29sZTpleGVjdXRlXCIgfSkpXG4gICAgLmRvKGFuYWx5dGljcy50cmFja0V2ZW50KVxuICAgIC5pZ25vcmVFbGVtZW50cygpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyhhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LCBzdG9yZTogU3RvcmUpOiBPYnNlcnZhYmxlPEFjdGlvbj4ge1xuICByZXR1cm4gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5SRUdJU1RFUl9SRUNPUkRfUFJPVklERVIpLmZsYXRNYXAoKGFjdGlvbikgPT4ge1xuICAgIGludmFyaWFudChhY3Rpb24udHlwZSA9PT0gQWN0aW9ucy5SRUdJU1RFUl9SRUNPUkRfUFJPVklERVIpXG4gICAgY29uc3QgeyByZWNvcmRQcm92aWRlciB9ID0gYWN0aW9uLnBheWxvYWRcblxuICAgIC8vIFRyYW5zZm9ybSB0aGUgbWVzc2FnZXMgaW50byBhY3Rpb25zIGFuZCBtZXJnZSB0aGVtIGludG8gdGhlIGFjdGlvbiBzdHJlYW0uXG4gICAgLy8gVE9ETzogQWRkIGVuYWJsaW5nL2Rpc2FibGluZyBvZiByZWdpc3RlcmVkIHNvdXJjZSBhbmQgb25seSBzdWJzY3JpYmUgd2hlbiBlbmFibGVkLiBUaGF0XG4gICAgLy8gICAgICAgd2F5LCB3ZSB3b24ndCB0cmlnZ2VyIGNvbGQgb2JzZXJ2ZXIgc2lkZS1lZmZlY3RzIHdoZW4gd2UgZG9uJ3QgbmVlZCB0aGUgcmVzdWx0cy5cbiAgICBjb25zdCBtZXNzYWdlQWN0aW9ucyA9IHJlY29yZFByb3ZpZGVyLnJlY29yZHMubWFwKEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQpXG5cbiAgICAvLyBUT0RPOiBDYW4gdGhpcyBiZSBkZWxheWVkIHVudGlsIHNvbWV0aW1lIGFmdGVyIHJlZ2lzdHJhdGlvbj9cbiAgICBjb25zdCBzdGF0dXNBY3Rpb25zID1cbiAgICAgIC8vICRGbG93Rml4TWUoPj0wLjY4LjApIEZsb3cgc3VwcHJlc3MgKFQyNzE4Nzg1NylcbiAgICAgIHR5cGVvZiByZWNvcmRQcm92aWRlci5vYnNlcnZlU3RhdHVzID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uKHJlY29yZFByb3ZpZGVyLm9ic2VydmVTdGF0dXMpLm1hcCgoc3RhdHVzKSA9PlxuICAgICAgICAgICAgQWN0aW9ucy51cGRhdGVTdGF0dXMocmVjb3JkUHJvdmlkZXIuaWQsIHN0YXR1cylcbiAgICAgICAgICApXG4gICAgICAgIDogT2JzZXJ2YWJsZS5lbXB0eSgpXG5cbiAgICBjb25zdCB1bnJlZ2lzdGVyZWRFdmVudHMgPSBhY3Rpb25zLm9mVHlwZShBY3Rpb25zLlJFTU9WRV9TT1VSQ0UpLmZpbHRlcigoYSkgPT4ge1xuICAgICAgaW52YXJpYW50KGEudHlwZSA9PT0gQWN0aW9ucy5SRU1PVkVfU09VUkNFKVxuICAgICAgcmV0dXJuIGEucGF5bG9hZC5zb3VyY2VJZCA9PT0gcmVjb3JkUHJvdmlkZXIuaWRcbiAgICB9KVxuXG4gICAgcmV0dXJuIE9ic2VydmFibGUubWVyZ2UoXG4gICAgICBPYnNlcnZhYmxlLm9mKEFjdGlvbnMucmVnaXN0ZXJTb3VyY2UoeyAuLi5yZWNvcmRQcm92aWRlciwgbmFtZTogcmVjb3JkUHJvdmlkZXIuaWQgfSkpLFxuICAgICAgbWVzc2FnZUFjdGlvbnMsXG4gICAgICBzdGF0dXNBY3Rpb25zXG4gICAgKS50YWtlVW50aWwodW5yZWdpc3RlcmVkRXZlbnRzKVxuICB9KVxufVxuIl19