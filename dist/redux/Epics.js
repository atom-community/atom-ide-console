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

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkVwaWNzLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyRXhlY3V0b3JFcGljIiwiYWN0aW9ucyIsInN0b3JlIiwib2ZUeXBlIiwiQWN0aW9ucyIsIlJFR0lTVEVSX0VYRUNVVE9SIiwibWFwIiwiYWN0aW9uIiwidHlwZSIsImV4ZWN1dG9yIiwicGF5bG9hZCIsInJlZ2lzdGVyUmVjb3JkUHJvdmlkZXIiLCJpZCIsInJlY29yZHMiLCJvdXRwdXQiLCJtZXNzYWdlIiwiaW5jb21wbGV0ZSIsImtpbmQiLCJzb3VyY2VJZCIsInNjb3BlTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJleGVjdXRlRXBpYyIsIkVYRUNVVEUiLCJmbGF0TWFwIiwiY29kZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiU2VsZWN0b3JzIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJnZXRTdGF0ZSIsImV4ZWN1dG9ycyIsImdldCIsIk9ic2VydmFibGUiLCJvZiIsInJlY29yZFJlY2VpdmVkIiwic291cmNlTmFtZSIsIm5hbWUiLCJsZXZlbCIsInRleHQiLCJyZXBlYXRDb3VudCIsImZpbmFsbHkiLCJzZW5kIiwidHJhY2tFcGljIiwiZG8iLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiaWdub3JlRWxlbWVudHMiLCJyZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyIsIlJFR0lTVEVSX1JFQ09SRF9QUk9WSURFUiIsInJlY29yZFByb3ZpZGVyIiwibWVzc2FnZUFjdGlvbnMiLCJzdGF0dXNBY3Rpb25zIiwib2JzZXJ2ZVN0YXR1cyIsInN0YXR1cyIsInVwZGF0ZVN0YXR1cyIsImVtcHR5IiwidW5yZWdpc3RlcmVkRXZlbnRzIiwiUkVNT1ZFX1NPVVJDRSIsImZpbHRlciIsImEiLCJtZXJnZSIsInJlZ2lzdGVyU291cmNlIiwidGFrZVVudGlsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBcEJBO0FBQ0E7QUFDQTtBQUNB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QitCLGNBQWMsQ0FBQ3JDLEVBQTdDO0FBQ0QsS0FMd0IsQ0FBM0I7QUFPQSxXQUFPb0IsNkJBQVc0QixLQUFYLENBQ0w1Qiw2QkFBV0MsRUFBWCxDQUNFN0IsT0FBTyxDQUFDeUQsY0FBUixDQUF1QixFQUFDLEdBQUdaLGNBQUo7QUFBb0JiLE1BQUFBLElBQUksRUFBRWEsY0FBYyxDQUFDckM7QUFBekMsS0FBdkIsQ0FERixDQURLLEVBSUxzQyxjQUpLLEVBS0xDLGFBTEssRUFNTFcsU0FOSyxDQU1LTixrQkFOTCxDQUFQO0FBT0QsR0FoQ00sQ0FBUDtBQWlDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvdyBzdHJpY3QtbG9jYWxcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7QWN0aW9uLCBTdG9yZX0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUge0FjdGlvbnNPYnNlcnZhYmxlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9yZWR1eC1vYnNlcnZhYmxlJztcblxuaW1wb3J0IHtvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9ufSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9ldmVudCc7XG5pbXBvcnQgKiBhcyBBY3Rpb25zIGZyb20gJy4vQWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBTZWxlY3RvcnMgZnJvbSAnLi9TZWxlY3RvcnMnO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuaW1wb3J0IGFuYWx5dGljcyBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9hbmFseXRpY3MnO1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgcmVjb3JkIHByb3ZpZGVyIGZvciBldmVyeSBleGVjdXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRXhlY3V0b3JFcGljKFxuICBhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LFxuICBzdG9yZTogU3RvcmUsXG4pOiBPYnNlcnZhYmxlPEFjdGlvbj4ge1xuICByZXR1cm4gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5SRUdJU1RFUl9FWEVDVVRPUikubWFwKGFjdGlvbiA9PiB7XG4gICAgaW52YXJpYW50KGFjdGlvbi50eXBlID09PSBBY3Rpb25zLlJFR0lTVEVSX0VYRUNVVE9SKTtcbiAgICBjb25zdCB7ZXhlY3V0b3J9ID0gYWN0aW9uLnBheWxvYWQ7XG4gICAgcmV0dXJuIEFjdGlvbnMucmVnaXN0ZXJSZWNvcmRQcm92aWRlcih7XG4gICAgICBpZDogZXhlY3V0b3IuaWQsXG4gICAgICAvLyAkRmxvd0lzc3VlOiBGbG93IGlzIGhhdmluZyBzb21lIHRyb3VibGUgd2l0aCB0aGUgc3ByZWFkIGhlcmUuXG4gICAgICByZWNvcmRzOiBleGVjdXRvci5vdXRwdXQubWFwKG1lc3NhZ2UgPT4gKHtcbiAgICAgICAgLi4ubWVzc2FnZSxcbiAgICAgICAgLy8gJEZsb3dJc3N1ZTogVE9ETyB3aXRoIGFib3ZlLlxuICAgICAgICBpbmNvbXBsZXRlOiBtZXNzYWdlLmluY29tcGxldGUgPz8gZmFsc2UsXG4gICAgICAgIGtpbmQ6ICdyZXNwb25zZScsXG4gICAgICAgIHNvdXJjZUlkOiBleGVjdXRvci5pZCxcbiAgICAgICAgc2NvcGVOYW1lOiBudWxsLCAvLyBUaGUgb3V0cHV0IHdvbid0IGJlIGluIHRoZSBsYW5ndWFnZSdzIGdyYW1tYXIuXG4gICAgICAgIC8vIEV2ZW50dWFsbHksIHdlJ2xsIHdhbnQgdG8gYWxsb3cgcHJvdmlkZXJzIHRvIHNwZWNpZnkgY3VzdG9tIHRpbWVzdGFtcHMgZm9yIHJlY29yZHMuXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgZXhlY3V0b3IsXG4gICAgICB9KSksXG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEV4ZWN1dGUgdGhlIHByb3ZpZGVkIGNvZGUgdXNpbmcgdGhlIGN1cnJlbnQgZXhlY3V0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlRXBpYyhcbiAgYWN0aW9uczogQWN0aW9uc09ic2VydmFibGU8QWN0aW9uPixcbiAgc3RvcmU6IFN0b3JlLFxuKTogT2JzZXJ2YWJsZTxBY3Rpb24+IHtcbiAgcmV0dXJuIGFjdGlvbnMub2ZUeXBlKEFjdGlvbnMuRVhFQ1VURSkuZmxhdE1hcChhY3Rpb24gPT4ge1xuICAgIGludmFyaWFudChhY3Rpb24udHlwZSA9PT0gQWN0aW9ucy5FWEVDVVRFKTtcbiAgICBjb25zdCB7Y29kZX0gPSBhY3Rpb24ucGF5bG9hZDtcbiAgICBjb25zdCBjdXJyZW50RXhlY3V0b3JJZCA9IFNlbGVjdG9ycy5nZXRDdXJyZW50RXhlY3V0b3JJZChzdG9yZS5nZXRTdGF0ZSgpKTtcbiAgICAvLyBmbG93bGludC1uZXh0LWxpbmUgc2tldGNoeS1udWxsLXN0cmluZzpvZmZcbiAgICBpbnZhcmlhbnQoY3VycmVudEV4ZWN1dG9ySWQpO1xuXG4gICAgY29uc3QgZXhlY3V0b3IgPSBzdG9yZS5nZXRTdGF0ZSgpLmV4ZWN1dG9ycy5nZXQoY3VycmVudEV4ZWN1dG9ySWQpO1xuICAgIGludmFyaWFudChleGVjdXRvciAhPSBudWxsKTtcblxuICAgIC8vIFRPRE86IElzIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIGRvIHRoaXM/IE1pZ2h0IHdhbnQgdG8gZ28gdGhyb3VnaCBudWNsaWRlLWV4ZWN1dG9ycyBhbmQgaGF2ZVxuICAgIC8vICAgICAgIHRoYXQgcmVnaXN0ZXIgb3V0cHV0IHNvdXJjZXM/XG4gICAgcmV0dXJuIChcbiAgICAgIE9ic2VydmFibGUub2YoXG4gICAgICAgIEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQoe1xuICAgICAgICAgIC8vIEV2ZW50dWFsbHksIHdlJ2xsIHdhbnQgdG8gYWxsb3cgcHJvdmlkZXJzIHRvIHNwZWNpZnkgY3VzdG9tIHRpbWVzdGFtcHMgZm9yIHJlY29yZHMuXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHNvdXJjZUlkOiBjdXJyZW50RXhlY3V0b3JJZCxcbiAgICAgICAgICBzb3VyY2VOYW1lOiBleGVjdXRvci5uYW1lLFxuICAgICAgICAgIGtpbmQ6ICdyZXF1ZXN0JyxcbiAgICAgICAgICBsZXZlbDogJ2xvZycsXG4gICAgICAgICAgdGV4dDogY29kZSxcbiAgICAgICAgICBzY29wZU5hbWU6IGV4ZWN1dG9yLnNjb3BlTmFtZSgpLFxuICAgICAgICAgIHJlcGVhdENvdW50OiAxLFxuICAgICAgICAgIGluY29tcGxldGU6IGZhbHNlLFxuICAgICAgICB9KSxcbiAgICAgIClcbiAgICAgICAgLy8gRXhlY3V0ZSB0aGUgY29kZSBhcyBhIHNpZGUtZWZmZWN0LlxuICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgZXhlY3V0b3Iuc2VuZChjb2RlKTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYWNrRXBpYyhcbiAgYWN0aW9uczogQWN0aW9uc09ic2VydmFibGU8QWN0aW9uPixcbiAgc3RvcmU6IFN0b3JlLFxuKTogT2JzZXJ2YWJsZTxlbXB0eT4ge1xuICByZXR1cm4gYWN0aW9uc1xuICAgIC5vZlR5cGUoQWN0aW9ucy5FWEVDVVRFKVxuICAgIC5tYXAoYWN0aW9uID0+ICh7dHlwZTogJ2NvbnNvbGU6ZXhlY3V0ZSd9KSlcbiAgICAuZG8oYW5hbHl0aWNzLnRyYWNrRXZlbnQpXG4gICAgLmlnbm9yZUVsZW1lbnRzKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyhcbiAgYWN0aW9uczogQWN0aW9uc09ic2VydmFibGU8QWN0aW9uPixcbiAgc3RvcmU6IFN0b3JlLFxuKTogT2JzZXJ2YWJsZTxBY3Rpb24+IHtcbiAgcmV0dXJuIGFjdGlvbnMub2ZUeXBlKEFjdGlvbnMuUkVHSVNURVJfUkVDT1JEX1BST1ZJREVSKS5mbGF0TWFwKGFjdGlvbiA9PiB7XG4gICAgaW52YXJpYW50KGFjdGlvbi50eXBlID09PSBBY3Rpb25zLlJFR0lTVEVSX1JFQ09SRF9QUk9WSURFUik7XG4gICAgY29uc3Qge3JlY29yZFByb3ZpZGVyfSA9IGFjdGlvbi5wYXlsb2FkO1xuXG4gICAgLy8gVHJhbnNmb3JtIHRoZSBtZXNzYWdlcyBpbnRvIGFjdGlvbnMgYW5kIG1lcmdlIHRoZW0gaW50byB0aGUgYWN0aW9uIHN0cmVhbS5cbiAgICAvLyBUT0RPOiBBZGQgZW5hYmxpbmcvZGlzYWJsaW5nIG9mIHJlZ2lzdGVyZWQgc291cmNlIGFuZCBvbmx5IHN1YnNjcmliZSB3aGVuIGVuYWJsZWQuIFRoYXRcbiAgICAvLyAgICAgICB3YXksIHdlIHdvbid0IHRyaWdnZXIgY29sZCBvYnNlcnZlciBzaWRlLWVmZmVjdHMgd2hlbiB3ZSBkb24ndCBuZWVkIHRoZSByZXN1bHRzLlxuICAgIGNvbnN0IG1lc3NhZ2VBY3Rpb25zID0gcmVjb3JkUHJvdmlkZXIucmVjb3Jkcy5tYXAoQWN0aW9ucy5yZWNvcmRSZWNlaXZlZCk7XG5cbiAgICAvLyBUT0RPOiBDYW4gdGhpcyBiZSBkZWxheWVkIHVudGlsIHNvbWV0aW1lIGFmdGVyIHJlZ2lzdHJhdGlvbj9cbiAgICBjb25zdCBzdGF0dXNBY3Rpb25zID1cbiAgICAgIC8vICRGbG93Rml4TWUoPj0wLjY4LjApIEZsb3cgc3VwcHJlc3MgKFQyNzE4Nzg1NylcbiAgICAgIHR5cGVvZiByZWNvcmRQcm92aWRlci5vYnNlcnZlU3RhdHVzID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gb2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbihyZWNvcmRQcm92aWRlci5vYnNlcnZlU3RhdHVzKS5tYXAoXG4gICAgICAgICAgICBzdGF0dXMgPT4gQWN0aW9ucy51cGRhdGVTdGF0dXMocmVjb3JkUHJvdmlkZXIuaWQsIHN0YXR1cyksXG4gICAgICAgICAgKVxuICAgICAgICA6IE9ic2VydmFibGUuZW1wdHkoKTtcblxuICAgIGNvbnN0IHVucmVnaXN0ZXJlZEV2ZW50cyA9IGFjdGlvbnNcbiAgICAgIC5vZlR5cGUoQWN0aW9ucy5SRU1PVkVfU09VUkNFKVxuICAgICAgLmZpbHRlcihhID0+IHtcbiAgICAgICAgaW52YXJpYW50KGEudHlwZSA9PT0gQWN0aW9ucy5SRU1PVkVfU09VUkNFKTtcbiAgICAgICAgcmV0dXJuIGEucGF5bG9hZC5zb3VyY2VJZCA9PT0gcmVjb3JkUHJvdmlkZXIuaWQ7XG4gICAgICB9KTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLm1lcmdlKFxuICAgICAgT2JzZXJ2YWJsZS5vZihcbiAgICAgICAgQWN0aW9ucy5yZWdpc3RlclNvdXJjZSh7Li4ucmVjb3JkUHJvdmlkZXIsIG5hbWU6IHJlY29yZFByb3ZpZGVyLmlkfSksXG4gICAgICApLFxuICAgICAgbWVzc2FnZUFjdGlvbnMsXG4gICAgICBzdGF0dXNBY3Rpb25zLFxuICAgICkudGFrZVVudGlsKHVucmVnaXN0ZXJlZEV2ZW50cyk7XG4gIH0pO1xufVxuIl19