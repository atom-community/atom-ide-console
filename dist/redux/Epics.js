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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkVwaWNzLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyRXhlY3V0b3JFcGljIiwiYWN0aW9ucyIsInN0b3JlIiwib2ZUeXBlIiwiQWN0aW9ucyIsIlJFR0lTVEVSX0VYRUNVVE9SIiwibWFwIiwiYWN0aW9uIiwidHlwZSIsImV4ZWN1dG9yIiwicGF5bG9hZCIsInJlZ2lzdGVyUmVjb3JkUHJvdmlkZXIiLCJpZCIsInJlY29yZHMiLCJvdXRwdXQiLCJtZXNzYWdlIiwiaW5jb21wbGV0ZSIsImtpbmQiLCJzb3VyY2VJZCIsInNjb3BlTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJleGVjdXRlRXBpYyIsIkVYRUNVVEUiLCJmbGF0TWFwIiwiY29kZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiU2VsZWN0b3JzIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJnZXRTdGF0ZSIsImV4ZWN1dG9ycyIsImdldCIsIk9ic2VydmFibGUiLCJvZiIsInJlY29yZFJlY2VpdmVkIiwic291cmNlTmFtZSIsIm5hbWUiLCJsZXZlbCIsInRleHQiLCJyZXBlYXRDb3VudCIsImZpbmFsbHkiLCJzZW5kIiwidHJhY2tFcGljIiwiZG8iLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiaWdub3JlRWxlbWVudHMiLCJyZWdpc3RlclJlY29yZFByb3ZpZGVyRXBpYyIsIlJFR0lTVEVSX1JFQ09SRF9QUk9WSURFUiIsInJlY29yZFByb3ZpZGVyIiwibWVzc2FnZUFjdGlvbnMiLCJzdGF0dXNBY3Rpb25zIiwib2JzZXJ2ZVN0YXR1cyIsInN0YXR1cyIsInVwZGF0ZVN0YXR1cyIsImVtcHR5IiwidW5yZWdpc3RlcmVkRXZlbnRzIiwiUkVNT1ZFX1NPVVJDRSIsImZpbHRlciIsImEiLCJtZXJnZSIsInJlZ2lzdGVyU291cmNlIiwidGFrZVVudGlsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ08sU0FBU0Esb0JBQVQsQ0FBOEJDLE9BQTlCLEVBQWtFQyxLQUFsRSxFQUFvRztBQUN6RyxTQUFPRCxPQUFPLENBQUNFLE1BQVIsQ0FBZUMsT0FBTyxDQUFDQyxpQkFBdkIsRUFBMENDLEdBQTFDLENBQStDQyxNQUFELElBQVk7QUFDL0QseUJBQVVBLE1BQU0sQ0FBQ0MsSUFBUCxLQUFnQkosT0FBTyxDQUFDQyxpQkFBbEM7QUFDQSxVQUFNO0FBQUVJLE1BQUFBO0FBQUYsUUFBZUYsTUFBTSxDQUFDRyxPQUE1QjtBQUNBLFdBQU9OLE9BQU8sQ0FBQ08sc0JBQVIsQ0FBK0I7QUFDcENDLE1BQUFBLEVBQUUsRUFBRUgsUUFBUSxDQUFDRyxFQUR1QjtBQUVwQztBQUNBQyxNQUFBQSxPQUFPLEVBQUVKLFFBQVEsQ0FBQ0ssTUFBVCxDQUFnQlIsR0FBaEIsQ0FBcUJTLE9BQUQ7QUFBQTs7QUFBQSxlQUFjLEVBQ3pDLEdBQUdBLE9BRHNDO0FBRXpDO0FBQ0FDLFVBQUFBLFVBQVUseUJBQUVELE9BQU8sQ0FBQ0MsVUFBVixxRUFBd0IsS0FITztBQUl6Q0MsVUFBQUEsSUFBSSxFQUFFLFVBSm1DO0FBS3pDQyxVQUFBQSxRQUFRLEVBQUVULFFBQVEsQ0FBQ0csRUFMc0I7QUFNekNPLFVBQUFBLFNBQVMsRUFBRSxJQU44QjtBQU14QjtBQUNqQjtBQUNBQyxVQUFBQSxTQUFTLEVBQUUsSUFBSUMsSUFBSixFQVI4QjtBQVN6Q1osVUFBQUE7QUFUeUMsU0FBZDtBQUFBLE9BQXBCO0FBSDJCLEtBQS9CLENBQVA7QUFlRCxHQWxCTSxDQUFQO0FBbUJEO0FBRUQ7QUFDQTtBQUNBOzs7QUFDTyxTQUFTYSxXQUFULENBQXFCckIsT0FBckIsRUFBeURDLEtBQXpELEVBQTJGO0FBQ2hHLFNBQU9ELE9BQU8sQ0FBQ0UsTUFBUixDQUFlQyxPQUFPLENBQUNtQixPQUF2QixFQUFnQ0MsT0FBaEMsQ0FBeUNqQixNQUFELElBQVk7QUFDekQseUJBQVVBLE1BQU0sQ0FBQ0MsSUFBUCxLQUFnQkosT0FBTyxDQUFDbUIsT0FBbEM7QUFDQSxVQUFNO0FBQUVFLE1BQUFBO0FBQUYsUUFBV2xCLE1BQU0sQ0FBQ0csT0FBeEI7QUFDQSxVQUFNZ0IsaUJBQWlCLEdBQUdDLFNBQVMsQ0FBQ0Msb0JBQVYsQ0FBK0IxQixLQUFLLENBQUMyQixRQUFOLEVBQS9CLENBQTFCLENBSHlELENBSXpEOztBQUNBLHlCQUFVSCxpQkFBVjtBQUVBLFVBQU1qQixRQUFRLEdBQUdQLEtBQUssQ0FBQzJCLFFBQU4sR0FBaUJDLFNBQWpCLENBQTJCQyxHQUEzQixDQUErQkwsaUJBQS9CLENBQWpCO0FBQ0EseUJBQVVqQixRQUFRLElBQUksSUFBdEIsRUFSeUQsQ0FVekQ7QUFDQTs7QUFDQSxXQUNFdUIsNkJBQVdDLEVBQVgsQ0FDRTdCLE9BQU8sQ0FBQzhCLGNBQVIsQ0FBdUI7QUFDckI7QUFDQWQsTUFBQUEsU0FBUyxFQUFFLElBQUlDLElBQUosRUFGVTtBQUdyQkgsTUFBQUEsUUFBUSxFQUFFUSxpQkFIVztBQUlyQlMsTUFBQUEsVUFBVSxFQUFFMUIsUUFBUSxDQUFDMkIsSUFKQTtBQUtyQm5CLE1BQUFBLElBQUksRUFBRSxTQUxlO0FBTXJCb0IsTUFBQUEsS0FBSyxFQUFFLEtBTmM7QUFPckJDLE1BQUFBLElBQUksRUFBRWIsSUFQZTtBQVFyQk4sTUFBQUEsU0FBUyxFQUFFVixRQUFRLENBQUNVLFNBQVQsRUFSVTtBQVNyQm9CLE1BQUFBLFdBQVcsRUFBRSxDQVRRO0FBVXJCdkIsTUFBQUEsVUFBVSxFQUFFO0FBVlMsS0FBdkIsQ0FERixFQWNFO0FBZEYsS0FlR3dCLE9BZkgsQ0FlVyxNQUFNO0FBQ2IvQixNQUFBQSxRQUFRLENBQUNnQyxJQUFULENBQWNoQixJQUFkO0FBQ0QsS0FqQkgsQ0FERjtBQW9CRCxHQWhDTSxDQUFQO0FBaUNEOztBQUVNLFNBQVNpQixTQUFULENBQW1CekMsT0FBbkIsRUFBdURDLEtBQXZELEVBQXdGO0FBQzdGLFNBQU9ELE9BQU8sQ0FDWEUsTUFESSxDQUNHQyxPQUFPLENBQUNtQixPQURYLEVBRUpqQixHQUZJLENBRUNDLE1BQUQsS0FBYTtBQUFFQyxJQUFBQSxJQUFJLEVBQUU7QUFBUixHQUFiLENBRkEsRUFHSm1DLEVBSEksQ0FHREMsbUJBQVVDLFVBSFQsRUFJSkMsY0FKSSxFQUFQO0FBS0Q7O0FBRU0sU0FBU0MsMEJBQVQsQ0FBb0M5QyxPQUFwQyxFQUF3RUMsS0FBeEUsRUFBMEc7QUFDL0csU0FBT0QsT0FBTyxDQUFDRSxNQUFSLENBQWVDLE9BQU8sQ0FBQzRDLHdCQUF2QixFQUFpRHhCLE9BQWpELENBQTBEakIsTUFBRCxJQUFZO0FBQzFFLHlCQUFVQSxNQUFNLENBQUNDLElBQVAsS0FBZ0JKLE9BQU8sQ0FBQzRDLHdCQUFsQztBQUNBLFVBQU07QUFBRUMsTUFBQUE7QUFBRixRQUFxQjFDLE1BQU0sQ0FBQ0csT0FBbEMsQ0FGMEUsQ0FJMUU7QUFDQTtBQUNBOztBQUNBLFVBQU13QyxjQUFjLEdBQUdELGNBQWMsQ0FBQ3BDLE9BQWYsQ0FBdUJQLEdBQXZCLENBQTJCRixPQUFPLENBQUM4QixjQUFuQyxDQUF2QixDQVAwRSxDQVMxRTs7QUFDQSxVQUFNaUIsYUFBYSxHQUNqQjtBQUNBLFdBQU9GLGNBQWMsQ0FBQ0csYUFBdEIsS0FBd0MsVUFBeEMsR0FDSSw0Q0FBZ0NILGNBQWMsQ0FBQ0csYUFBL0MsRUFBOEQ5QyxHQUE5RCxDQUFtRStDLE1BQUQsSUFDaEVqRCxPQUFPLENBQUNrRCxZQUFSLENBQXFCTCxjQUFjLENBQUNyQyxFQUFwQyxFQUF3Q3lDLE1BQXhDLENBREYsQ0FESixHQUlJckIsNkJBQVd1QixLQUFYLEVBTk47QUFRQSxVQUFNQyxrQkFBa0IsR0FBR3ZELE9BQU8sQ0FBQ0UsTUFBUixDQUFlQyxPQUFPLENBQUNxRCxhQUF2QixFQUFzQ0MsTUFBdEMsQ0FBOENDLENBQUQsSUFBTztBQUM3RSwyQkFBVUEsQ0FBQyxDQUFDbkQsSUFBRixLQUFXSixPQUFPLENBQUNxRCxhQUE3QjtBQUNBLGFBQU9FLENBQUMsQ0FBQ2pELE9BQUYsQ0FBVVEsUUFBVixLQUF1QitCLGNBQWMsQ0FBQ3JDLEVBQTdDO0FBQ0QsS0FIMEIsQ0FBM0I7QUFLQSxXQUFPb0IsNkJBQVc0QixLQUFYLENBQ0w1Qiw2QkFBV0MsRUFBWCxDQUFjN0IsT0FBTyxDQUFDeUQsY0FBUixDQUF1QixFQUFFLEdBQUdaLGNBQUw7QUFBcUJiLE1BQUFBLElBQUksRUFBRWEsY0FBYyxDQUFDckM7QUFBMUMsS0FBdkIsQ0FBZCxDQURLLEVBRUxzQyxjQUZLLEVBR0xDLGFBSEssRUFJTFcsU0FKSyxDQUlLTixrQkFKTCxDQUFQO0FBS0QsR0E1Qk0sQ0FBUDtBQTZCRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQWN0aW9uLCBTdG9yZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgdHlwZSB7IEFjdGlvbnNPYnNlcnZhYmxlIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL3JlZHV4LW9ic2VydmFibGVcIlxuXG5pbXBvcnQgeyBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V2ZW50XCJcbmltcG9ydCAqIGFzIEFjdGlvbnMgZnJvbSBcIi4vQWN0aW9uc1wiXG5pbXBvcnQgKiBhcyBTZWxlY3RvcnMgZnJvbSBcIi4vU2VsZWN0b3JzXCJcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSBcImFzc2VydFwiXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qc1wiXG5pbXBvcnQgYW5hbHl0aWNzIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9hbmFseXRpY3NcIlxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgcmVjb3JkIHByb3ZpZGVyIGZvciBldmVyeSBleGVjdXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRXhlY3V0b3JFcGljKGFjdGlvbnM6IEFjdGlvbnNPYnNlcnZhYmxlPEFjdGlvbj4sIHN0b3JlOiBTdG9yZSk6IE9ic2VydmFibGU8QWN0aW9uPiB7XG4gIHJldHVybiBhY3Rpb25zLm9mVHlwZShBY3Rpb25zLlJFR0lTVEVSX0VYRUNVVE9SKS5tYXAoKGFjdGlvbikgPT4ge1xuICAgIGludmFyaWFudChhY3Rpb24udHlwZSA9PT0gQWN0aW9ucy5SRUdJU1RFUl9FWEVDVVRPUilcbiAgICBjb25zdCB7IGV4ZWN1dG9yIH0gPSBhY3Rpb24ucGF5bG9hZFxuICAgIHJldHVybiBBY3Rpb25zLnJlZ2lzdGVyUmVjb3JkUHJvdmlkZXIoe1xuICAgICAgaWQ6IGV4ZWN1dG9yLmlkLFxuICAgICAgLy8gJEZsb3dJc3N1ZTogRmxvdyBpcyBoYXZpbmcgc29tZSB0cm91YmxlIHdpdGggdGhlIHNwcmVhZCBoZXJlLlxuICAgICAgcmVjb3JkczogZXhlY3V0b3Iub3V0cHV0Lm1hcCgobWVzc2FnZSkgPT4gKHtcbiAgICAgICAgLi4ubWVzc2FnZSxcbiAgICAgICAgLy8gJEZsb3dJc3N1ZTogVE9ETyB3aXRoIGFib3ZlLlxuICAgICAgICBpbmNvbXBsZXRlOiBtZXNzYWdlLmluY29tcGxldGUgPz8gZmFsc2UsXG4gICAgICAgIGtpbmQ6IFwicmVzcG9uc2VcIixcbiAgICAgICAgc291cmNlSWQ6IGV4ZWN1dG9yLmlkLFxuICAgICAgICBzY29wZU5hbWU6IG51bGwsIC8vIFRoZSBvdXRwdXQgd29uJ3QgYmUgaW4gdGhlIGxhbmd1YWdlJ3MgZ3JhbW1hci5cbiAgICAgICAgLy8gRXZlbnR1YWxseSwgd2UnbGwgd2FudCB0byBhbGxvdyBwcm92aWRlcnMgdG8gc3BlY2lmeSBjdXN0b20gdGltZXN0YW1wcyBmb3IgcmVjb3Jkcy5cbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBleGVjdXRvcixcbiAgICAgIH0pKSxcbiAgICB9KVxuICB9KVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgdGhlIHByb3ZpZGVkIGNvZGUgdXNpbmcgdGhlIGN1cnJlbnQgZXhlY3V0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlRXBpYyhhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LCBzdG9yZTogU3RvcmUpOiBPYnNlcnZhYmxlPEFjdGlvbj4ge1xuICByZXR1cm4gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5FWEVDVVRFKS5mbGF0TWFwKChhY3Rpb24pID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aW9uLnR5cGUgPT09IEFjdGlvbnMuRVhFQ1VURSlcbiAgICBjb25zdCB7IGNvZGUgfSA9IGFjdGlvbi5wYXlsb2FkXG4gICAgY29uc3QgY3VycmVudEV4ZWN1dG9ySWQgPSBTZWxlY3RvcnMuZ2V0Q3VycmVudEV4ZWN1dG9ySWQoc3RvcmUuZ2V0U3RhdGUoKSlcbiAgICAvLyBmbG93bGludC1uZXh0LWxpbmUgc2tldGNoeS1udWxsLXN0cmluZzpvZmZcbiAgICBpbnZhcmlhbnQoY3VycmVudEV4ZWN1dG9ySWQpXG5cbiAgICBjb25zdCBleGVjdXRvciA9IHN0b3JlLmdldFN0YXRlKCkuZXhlY3V0b3JzLmdldChjdXJyZW50RXhlY3V0b3JJZClcbiAgICBpbnZhcmlhbnQoZXhlY3V0b3IgIT0gbnVsbClcblxuICAgIC8vIFRPRE86IElzIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIGRvIHRoaXM/IE1pZ2h0IHdhbnQgdG8gZ28gdGhyb3VnaCBudWNsaWRlLWV4ZWN1dG9ycyBhbmQgaGF2ZVxuICAgIC8vICAgICAgIHRoYXQgcmVnaXN0ZXIgb3V0cHV0IHNvdXJjZXM/XG4gICAgcmV0dXJuIChcbiAgICAgIE9ic2VydmFibGUub2YoXG4gICAgICAgIEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQoe1xuICAgICAgICAgIC8vIEV2ZW50dWFsbHksIHdlJ2xsIHdhbnQgdG8gYWxsb3cgcHJvdmlkZXJzIHRvIHNwZWNpZnkgY3VzdG9tIHRpbWVzdGFtcHMgZm9yIHJlY29yZHMuXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHNvdXJjZUlkOiBjdXJyZW50RXhlY3V0b3JJZCxcbiAgICAgICAgICBzb3VyY2VOYW1lOiBleGVjdXRvci5uYW1lLFxuICAgICAgICAgIGtpbmQ6IFwicmVxdWVzdFwiLFxuICAgICAgICAgIGxldmVsOiBcImxvZ1wiLFxuICAgICAgICAgIHRleHQ6IGNvZGUsXG4gICAgICAgICAgc2NvcGVOYW1lOiBleGVjdXRvci5zY29wZU5hbWUoKSxcbiAgICAgICAgICByZXBlYXRDb3VudDogMSxcbiAgICAgICAgICBpbmNvbXBsZXRlOiBmYWxzZSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgICAgLy8gRXhlY3V0ZSB0aGUgY29kZSBhcyBhIHNpZGUtZWZmZWN0LlxuICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgZXhlY3V0b3Iuc2VuZChjb2RlKVxuICAgICAgICB9KVxuICAgIClcbiAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYWNrRXBpYyhhY3Rpb25zOiBBY3Rpb25zT2JzZXJ2YWJsZTxBY3Rpb24+LCBzdG9yZTogU3RvcmUpOiBPYnNlcnZhYmxlPGVtcHR5PiB7XG4gIHJldHVybiBhY3Rpb25zXG4gICAgLm9mVHlwZShBY3Rpb25zLkVYRUNVVEUpXG4gICAgLm1hcCgoYWN0aW9uKSA9PiAoeyB0eXBlOiBcImNvbnNvbGU6ZXhlY3V0ZVwiIH0pKVxuICAgIC5kbyhhbmFseXRpY3MudHJhY2tFdmVudClcbiAgICAuaWdub3JlRWxlbWVudHMoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJSZWNvcmRQcm92aWRlckVwaWMoYWN0aW9uczogQWN0aW9uc09ic2VydmFibGU8QWN0aW9uPiwgc3RvcmU6IFN0b3JlKTogT2JzZXJ2YWJsZTxBY3Rpb24+IHtcbiAgcmV0dXJuIGFjdGlvbnMub2ZUeXBlKEFjdGlvbnMuUkVHSVNURVJfUkVDT1JEX1BST1ZJREVSKS5mbGF0TWFwKChhY3Rpb24pID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aW9uLnR5cGUgPT09IEFjdGlvbnMuUkVHSVNURVJfUkVDT1JEX1BST1ZJREVSKVxuICAgIGNvbnN0IHsgcmVjb3JkUHJvdmlkZXIgfSA9IGFjdGlvbi5wYXlsb2FkXG5cbiAgICAvLyBUcmFuc2Zvcm0gdGhlIG1lc3NhZ2VzIGludG8gYWN0aW9ucyBhbmQgbWVyZ2UgdGhlbSBpbnRvIHRoZSBhY3Rpb24gc3RyZWFtLlxuICAgIC8vIFRPRE86IEFkZCBlbmFibGluZy9kaXNhYmxpbmcgb2YgcmVnaXN0ZXJlZCBzb3VyY2UgYW5kIG9ubHkgc3Vic2NyaWJlIHdoZW4gZW5hYmxlZC4gVGhhdFxuICAgIC8vICAgICAgIHdheSwgd2Ugd29uJ3QgdHJpZ2dlciBjb2xkIG9ic2VydmVyIHNpZGUtZWZmZWN0cyB3aGVuIHdlIGRvbid0IG5lZWQgdGhlIHJlc3VsdHMuXG4gICAgY29uc3QgbWVzc2FnZUFjdGlvbnMgPSByZWNvcmRQcm92aWRlci5yZWNvcmRzLm1hcChBY3Rpb25zLnJlY29yZFJlY2VpdmVkKVxuXG4gICAgLy8gVE9ETzogQ2FuIHRoaXMgYmUgZGVsYXllZCB1bnRpbCBzb21ldGltZSBhZnRlciByZWdpc3RyYXRpb24/XG4gICAgY29uc3Qgc3RhdHVzQWN0aW9ucyA9XG4gICAgICAvLyAkRmxvd0ZpeE1lKD49MC42OC4wKSBGbG93IHN1cHByZXNzIChUMjcxODc4NTcpXG4gICAgICB0eXBlb2YgcmVjb3JkUHJvdmlkZXIub2JzZXJ2ZVN0YXR1cyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gb2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbihyZWNvcmRQcm92aWRlci5vYnNlcnZlU3RhdHVzKS5tYXAoKHN0YXR1cykgPT5cbiAgICAgICAgICAgIEFjdGlvbnMudXBkYXRlU3RhdHVzKHJlY29yZFByb3ZpZGVyLmlkLCBzdGF0dXMpXG4gICAgICAgICAgKVxuICAgICAgICA6IE9ic2VydmFibGUuZW1wdHkoKVxuXG4gICAgY29uc3QgdW5yZWdpc3RlcmVkRXZlbnRzID0gYWN0aW9ucy5vZlR5cGUoQWN0aW9ucy5SRU1PVkVfU09VUkNFKS5maWx0ZXIoKGEpID0+IHtcbiAgICAgIGludmFyaWFudChhLnR5cGUgPT09IEFjdGlvbnMuUkVNT1ZFX1NPVVJDRSlcbiAgICAgIHJldHVybiBhLnBheWxvYWQuc291cmNlSWQgPT09IHJlY29yZFByb3ZpZGVyLmlkXG4gICAgfSlcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLm1lcmdlKFxuICAgICAgT2JzZXJ2YWJsZS5vZihBY3Rpb25zLnJlZ2lzdGVyU291cmNlKHsgLi4ucmVjb3JkUHJvdmlkZXIsIG5hbWU6IHJlY29yZFByb3ZpZGVyLmlkIH0pKSxcbiAgICAgIG1lc3NhZ2VBY3Rpb25zLFxuICAgICAgc3RhdHVzQWN0aW9uc1xuICAgICkudGFrZVVudGlsKHVucmVnaXN0ZXJlZEV2ZW50cylcbiAgfSlcbn1cbiJdfQ==