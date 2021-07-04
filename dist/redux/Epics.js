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
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */

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
          kind: 'response',
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
      kind: 'request',
      level: 'log',
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
    type: 'console:execute'
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
    typeof recordProvider.observeStatus === 'function' ? (0, _event.observableFromSubscribeFunction)(recordProvider.observeStatus).map(status => Actions.updateStatus(recordProvider.id, status)) : _rxjsCompatUmdMin.Observable.empty();
    const unregisteredEvents = actions.ofType(Actions.REMOVE_SOURCE).filter(a => {
      (0, _assert.default)(a.type === Actions.REMOVE_SOURCE);
      return a.payload.sourceId === recordProvider.id;
    });
    return _rxjsCompatUmdMin.Observable.merge(_rxjsCompatUmdMin.Observable.of(Actions.registerSource({ ...recordProvider,
      name: recordProvider.id
    })), messageActions, statusActions).takeUntil(unregisteredEvents);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkVwaWNzLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyRXhlY3V0b3JFcGljIiwiYWN0aW9ucyIsInN0b3JlIiwib2ZUeXBlIiwiQWN0aW9ucyIsIlJFR0lTVEVSX0VYRUNVVE9SIiwibWFwIiwiYWN0aW9uIiwidHlwZSIsImV4ZWN1dG9yIiwicGF5bG9hZCIsInJlZ2lzdGVyUmVjb3JkUHJvdmlkZXIiLCJpZCIsInJlY29yZHMiLCJvdXRwdXQiLCJtZXNzYWdlIiwiaW5jb21wbGV0ZSIsImtpbmQiLCJzb3VyY2VJZCIsInNjb3BlTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJleGVjdXRlRXBpYyIsIkVYRUNVVEUiLCJmbGF0TWFwIiwiY29kZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiU2VsZWN0b3JzIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJnZXRTdGF0ZSIsImV4ZWN1dG9ycyIsImdldCIsIk9ic2VydmFibGUiLCJvZiIsInJlY29yZFJlY2VpdmVkIiwic291cmNlTmFtZSIsIm5hbWUiLCJsZXZlbCIsInRleHQiLCJyZXBlYXRDb3VudCIsImZpbmFsbHkiLCJzZW5kIiwidHJhY2tFcGljIiwiZG8iLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiaWdub3JlRWxlbWVudHMiLCJyZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyIsIlJFR0lTVEVSX1JFQ09SRF9QUk9WSURFUiIsInJlY29yZFByb3ZpZGVyIiwibWVzc2FnZUFjdGlvbnMiLCJzdGF0dXNBY3Rpb25zIiwib2JzZXJ2ZVN0YXR1cyIsInN0YXR1cyIsInVwZGF0ZVN0YXR1cyIsImVtcHR5IiwidW5yZWdpc3RlcmVkRXZlbnRzIiwiUkVNT1ZFX1NPVVJDRSIsImZpbHRlciIsImEiLCJtZXJnZSIsInJlZ2lzdGVyU291cmNlIiwidGFrZVVudGlsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBcEJBOzs7Ozs7Ozs7Ozs7QUFz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VzRCLEtBQVgsQ0FDTDVCLDZCQUFXQyxFQUFYLENBQ0U3QixPQUFPLENBQUN5RCxjQUFSLENBQXVCLEVBQUMsR0FBR1osY0FBSjtBQUFvQmIsTUFBQUEsSUFBSSxFQUFFYSxjQUFjLENBQUNyQztBQUF6QyxLQUF2QixDQURGLENBREssRUFJTHNDLGNBSkssRUFLTEMsYUFMSyxFQU1MVyxTQU5LLENBTUtOLGtCQU5MLENBQVA7QUFPRCxHQWhDTSxDQUFQO0FBaUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93IHN0cmljdC1sb2NhbFxuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCB0eXBlIHtBY3Rpb24sIFN0b3JlfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7QWN0aW9uc09ic2VydmFibGV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL3JlZHV4LW9ic2VydmFibGUnO1xuXG5pbXBvcnQge29ic2VydmFibGVGcm9tU3Vic2NyaWJlRnVuY3Rpb259IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V2ZW50JztcbmltcG9ydCAqIGFzIEFjdGlvbnMgZnJvbSAnLi9BY3Rpb25zJztcbmltcG9ydCAqIGFzIFNlbGVjdG9ycyBmcm9tICcuL1NlbGVjdG9ycyc7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5pbXBvcnQgYW5hbHl0aWNzIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2FuYWx5dGljcyc7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSByZWNvcmQgcHJvdmlkZXIgZm9yIGV2ZXJ5IGV4ZWN1dG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJFeGVjdXRvckVwaWMoXG4gIGFjdGlvbnM6IEFjdGlvbnNPYnNlcnZhYmxlPEFjdGlvbj4sXG4gIHN0b3JlOiBTdG9yZSxcbik6IE9ic2VydmFibGU8QWN0aW9uPiB7XG4gIHJldHVybiBhY3Rpb25zLm9mVHlwZShBY3Rpb25zLlJFR0lTVEVSX0VYRUNVVE9SKS5tYXAoYWN0aW9uID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aW9uLnR5cGUgPT09IEFjdGlvbnMuUkVHSVNURVJfRVhFQ1VUT1IpO1xuICAgIGNvbnN0IHtleGVjdXRvcn0gPSBhY3Rpb24ucGF5bG9hZDtcbiAgICByZXR1cm4gQWN0aW9ucy5yZWdpc3RlclJlY29yZFByb3ZpZGVyKHtcbiAgICAgIGlkOiBleGVjdXRvci5pZCxcbiAgICAgIC8vICRGbG93SXNzdWU6IEZsb3cgaXMgaGF2aW5nIHNvbWUgdHJvdWJsZSB3aXRoIHRoZSBzcHJlYWQgaGVyZS5cbiAgICAgIHJlY29yZHM6IGV4ZWN1dG9yLm91dHB1dC5tYXAobWVzc2FnZSA9PiAoe1xuICAgICAgICAuLi5tZXNzYWdlLFxuICAgICAgICAvLyAkRmxvd0lzc3VlOiBUT0RPIHdpdGggYWJvdmUuXG4gICAgICAgIGluY29tcGxldGU6IG1lc3NhZ2UuaW5jb21wbGV0ZSA/PyBmYWxzZSxcbiAgICAgICAga2luZDogJ3Jlc3BvbnNlJyxcbiAgICAgICAgc291cmNlSWQ6IGV4ZWN1dG9yLmlkLFxuICAgICAgICBzY29wZU5hbWU6IG51bGwsIC8vIFRoZSBvdXRwdXQgd29uJ3QgYmUgaW4gdGhlIGxhbmd1YWdlJ3MgZ3JhbW1hci5cbiAgICAgICAgLy8gRXZlbnR1YWxseSwgd2UnbGwgd2FudCB0byBhbGxvdyBwcm92aWRlcnMgdG8gc3BlY2lmeSBjdXN0b20gdGltZXN0YW1wcyBmb3IgcmVjb3Jkcy5cbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBleGVjdXRvcixcbiAgICAgIH0pKSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgcHJvdmlkZWQgY29kZSB1c2luZyB0aGUgY3VycmVudCBleGVjdXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVFcGljKFxuICBhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LFxuICBzdG9yZTogU3RvcmUsXG4pOiBPYnNlcnZhYmxlPEFjdGlvbj4ge1xuICByZXR1cm4gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5FWEVDVVRFKS5mbGF0TWFwKGFjdGlvbiA9PiB7XG4gICAgaW52YXJpYW50KGFjdGlvbi50eXBlID09PSBBY3Rpb25zLkVYRUNVVEUpO1xuICAgIGNvbnN0IHtjb2RlfSA9IGFjdGlvbi5wYXlsb2FkO1xuICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvcklkID0gU2VsZWN0b3JzLmdldEN1cnJlbnRFeGVjdXRvcklkKHN0b3JlLmdldFN0YXRlKCkpO1xuICAgIC8vIGZsb3dsaW50LW5leHQtbGluZSBza2V0Y2h5LW51bGwtc3RyaW5nOm9mZlxuICAgIGludmFyaWFudChjdXJyZW50RXhlY3V0b3JJZCk7XG5cbiAgICBjb25zdCBleGVjdXRvciA9IHN0b3JlLmdldFN0YXRlKCkuZXhlY3V0b3JzLmdldChjdXJyZW50RXhlY3V0b3JJZCk7XG4gICAgaW52YXJpYW50KGV4ZWN1dG9yICE9IG51bGwpO1xuXG4gICAgLy8gVE9ETzogSXMgdGhpcyB0aGUgYmVzdCB3YXkgdG8gZG8gdGhpcz8gTWlnaHQgd2FudCB0byBnbyB0aHJvdWdoIG51Y2xpZGUtZXhlY3V0b3JzIGFuZCBoYXZlXG4gICAgLy8gICAgICAgdGhhdCByZWdpc3RlciBvdXRwdXQgc291cmNlcz9cbiAgICByZXR1cm4gKFxuICAgICAgT2JzZXJ2YWJsZS5vZihcbiAgICAgICAgQWN0aW9ucy5yZWNvcmRSZWNlaXZlZCh7XG4gICAgICAgICAgLy8gRXZlbnR1YWxseSwgd2UnbGwgd2FudCB0byBhbGxvdyBwcm92aWRlcnMgdG8gc3BlY2lmeSBjdXN0b20gdGltZXN0YW1wcyBmb3IgcmVjb3Jkcy5cbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgc291cmNlSWQ6IGN1cnJlbnRFeGVjdXRvcklkLFxuICAgICAgICAgIHNvdXJjZU5hbWU6IGV4ZWN1dG9yLm5hbWUsXG4gICAgICAgICAga2luZDogJ3JlcXVlc3QnLFxuICAgICAgICAgIGxldmVsOiAnbG9nJyxcbiAgICAgICAgICB0ZXh0OiBjb2RlLFxuICAgICAgICAgIHNjb3BlTmFtZTogZXhlY3V0b3Iuc2NvcGVOYW1lKCksXG4gICAgICAgICAgcmVwZWF0Q291bnQ6IDEsXG4gICAgICAgICAgaW5jb21wbGV0ZTogZmFsc2UsXG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgICAgICAvLyBFeGVjdXRlIHRoZSBjb2RlIGFzIGEgc2lkZS1lZmZlY3QuXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICBleGVjdXRvci5zZW5kKGNvZGUpO1xuICAgICAgICB9KVxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhY2tFcGljKFxuICBhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LFxuICBzdG9yZTogU3RvcmUsXG4pOiBPYnNlcnZhYmxlPGVtcHR5PiB7XG4gIHJldHVybiBhY3Rpb25zXG4gICAgLm9mVHlwZShBY3Rpb25zLkVYRUNVVEUpXG4gICAgLm1hcChhY3Rpb24gPT4gKHt0eXBlOiAnY29uc29sZTpleGVjdXRlJ30pKVxuICAgIC5kbyhhbmFseXRpY3MudHJhY2tFdmVudClcbiAgICAuaWdub3JlRWxlbWVudHMoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUmVjb3JkUHJvdmlkZXJFcGljKFxuICBhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LFxuICBzdG9yZTogU3RvcmUsXG4pOiBPYnNlcnZhYmxlPEFjdGlvbj4ge1xuICByZXR1cm4gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5SRUdJU1RFUl9SRUNPUkRfUFJPVklERVIpLmZsYXRNYXAoYWN0aW9uID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aW9uLnR5cGUgPT09IEFjdGlvbnMuUkVHSVNURVJfUkVDT1JEX1BST1ZJREVSKTtcbiAgICBjb25zdCB7cmVjb3JkUHJvdmlkZXJ9ID0gYWN0aW9uLnBheWxvYWQ7XG5cbiAgICAvLyBUcmFuc2Zvcm0gdGhlIG1lc3NhZ2VzIGludG8gYWN0aW9ucyBhbmQgbWVyZ2UgdGhlbSBpbnRvIHRoZSBhY3Rpb24gc3RyZWFtLlxuICAgIC8vIFRPRE86IEFkZCBlbmFibGluZy9kaXNhYmxpbmcgb2YgcmVnaXN0ZXJlZCBzb3VyY2UgYW5kIG9ubHkgc3Vic2NyaWJlIHdoZW4gZW5hYmxlZC4gVGhhdFxuICAgIC8vICAgICAgIHdheSwgd2Ugd29uJ3QgdHJpZ2dlciBjb2xkIG9ic2VydmVyIHNpZGUtZWZmZWN0cyB3aGVuIHdlIGRvbid0IG5lZWQgdGhlIHJlc3VsdHMuXG4gICAgY29uc3QgbWVzc2FnZUFjdGlvbnMgPSByZWNvcmRQcm92aWRlci5yZWNvcmRzLm1hcChBY3Rpb25zLnJlY29yZFJlY2VpdmVkKTtcblxuICAgIC8vIFRPRE86IENhbiB0aGlzIGJlIGRlbGF5ZWQgdW50aWwgc29tZXRpbWUgYWZ0ZXIgcmVnaXN0cmF0aW9uP1xuICAgIGNvbnN0IHN0YXR1c0FjdGlvbnMgPVxuICAgICAgLy8gJEZsb3dGaXhNZSg+PTAuNjguMCkgRmxvdyBzdXBwcmVzcyAoVDI3MTg3ODU3KVxuICAgICAgdHlwZW9mIHJlY29yZFByb3ZpZGVyLm9ic2VydmVTdGF0dXMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uKHJlY29yZFByb3ZpZGVyLm9ic2VydmVTdGF0dXMpLm1hcChcbiAgICAgICAgICAgIHN0YXR1cyA9PiBBY3Rpb25zLnVwZGF0ZVN0YXR1cyhyZWNvcmRQcm92aWRlci5pZCwgc3RhdHVzKSxcbiAgICAgICAgICApXG4gICAgICAgIDogT2JzZXJ2YWJsZS5lbXB0eSgpO1xuXG4gICAgY29uc3QgdW5yZWdpc3RlcmVkRXZlbnRzID0gYWN0aW9uc1xuICAgICAgLm9mVHlwZShBY3Rpb25zLlJFTU9WRV9TT1VSQ0UpXG4gICAgICAuZmlsdGVyKGEgPT4ge1xuICAgICAgICBpbnZhcmlhbnQoYS50eXBlID09PSBBY3Rpb25zLlJFTU9WRV9TT1VSQ0UpO1xuICAgICAgICByZXR1cm4gYS5wYXlsb2FkLnNvdXJjZUlkID09PSByZWNvcmRQcm92aWRlci5pZDtcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIE9ic2VydmFibGUubWVyZ2UoXG4gICAgICBPYnNlcnZhYmxlLm9mKFxuICAgICAgICBBY3Rpb25zLnJlZ2lzdGVyU291cmNlKHsuLi5yZWNvcmRQcm92aWRlciwgbmFtZTogcmVjb3JkUHJvdmlkZXIuaWR9KSxcbiAgICAgICksXG4gICAgICBtZXNzYWdlQWN0aW9ucyxcbiAgICAgIHN0YXR1c0FjdGlvbnMsXG4gICAgKS50YWtlVW50aWwodW5yZWdpc3RlcmVkRXZlbnRzKTtcbiAgfSk7XG59XG4iXX0=