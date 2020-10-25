"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.consumeToolBar = consumeToolBar;
exports.consumePasteProvider = consumePasteProvider;
exports.consumeWatchEditor = consumeWatchEditor;
exports.provideAutocomplete = provideAutocomplete;
exports.deserializeConsole = deserializeConsole;
exports.provideConsole = provideConsole;
exports.provideRegisterExecutor = provideRegisterExecutor;
exports.serialize = serialize;

require("@atom-ide-community/nuclide-commons-ui");

var _immutable = require("immutable");

var _destroyItemWhere = require("@atom-ide-community/nuclide-commons-atom/destroyItemWhere");

var _epicHelpers = require("@atom-ide-community/nuclide-commons/epicHelpers");

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

var _reduxObservable = require("@atom-ide-community/nuclide-commons/redux-observable");

var _event = require("@atom-ide-community/nuclide-commons/event");

var _featureConfig = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-atom/feature-config"));

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var Actions = _interopRequireWildcard(require("./redux/Actions"));

var Epics = _interopRequireWildcard(require("./redux/Epics"));

var _Reducers = _interopRequireDefault(require("./redux/Reducers"));

var _Console = require("./ui/Console");

var _assert = _interopRequireDefault(require("assert"));

var _redux = require("redux");

var _nullthrows = _interopRequireDefault(require("nullthrows"));

var _uuid = _interopRequireDefault(require("uuid"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// load styles
const MAXIMUM_SERIALIZED_MESSAGES_CONFIG = "atom-ide-console.maximumSerializedMessages";
const MAXIMUM_SERIALIZED_HISTORY_CONFIG = "atom-ide-console.maximumSerializedHistory";

let _disposables;

let _rawState;

let _store;

let _nextMessageId;

function activate(rawState) {
  _rawState = rawState;
  _nextMessageId = 0;
  _disposables = new _UniversalDisposable.default(atom.contextMenu.add({
    ".console-record": [{
      label: "Copy Message",
      command: "console:copy-message"
    }]
  }), atom.commands.add(".console-record", "console:copy-message", event => {
    const el = event.target; // $FlowFixMe(>=0.68.0) Flow suppress (T27187857)

    if (el == null || typeof el.innerText !== "string") {
      return;
    }

    atom.clipboard.write(el.innerText);
  }), atom.commands.add("atom-workspace", "console:clear", () => _getStore().dispatch(Actions.clearRecords())), _featureConfig.default.observe("atom-ide-console.maximumMessageCount", maxMessageCount => {
    _getStore().dispatch(Actions.setMaxMessageCount(maxMessageCount));
  }), _rxjsCompatUmdMin.Observable.combineLatest((0, _event.observableFromSubscribeFunction)(cb => atom.config.observe("editor.fontSize", cb)), _featureConfig.default.observeAsStream("atom-ide-console.fontScale"), (fontSize, fontScale) => fontSize * parseFloat(fontScale)).map(Actions.setFontSize).subscribe(_store.dispatch), _registerCommandAndOpener());
}

function _getStore() {
  if (_store == null) {
    const initialState = deserializeAppState(_rawState);
    const rootEpic = (0, _epicHelpers.combineEpicsFromImports)(Epics, "atom-ide-ui");
    _store = (0, _redux.createStore)(_Reducers.default, initialState, (0, _redux.applyMiddleware)((0, _reduxObservable.createEpicMiddleware)(rootEpic)));
  }

  return _store;
}

function deactivate() {
  _disposables.dispose();
}

function consumeToolBar(getToolBar) {
  const toolBar = getToolBar("nuclide-console");
  toolBar.addButton({
    icon: "nuclicon-console",
    callback: "console:toggle",
    tooltip: "Toggle Console",
    priority: 700
  });

  _disposables.add(() => {
    toolBar.removeItems();
  });
}

function consumePasteProvider(provider) {
  const createPaste = provider.createPaste;

  _getStore().dispatch(Actions.setCreatePasteFunction(createPaste));

  return new _UniversalDisposable.default(() => {
    if (_getStore().getState().createPasteFunction === createPaste) {
      _getStore().dispatch(Actions.setCreatePasteFunction(null));
    }
  });
}

function consumeWatchEditor(watchEditor) {
  _getStore().dispatch(Actions.setWatchEditor(watchEditor));

  return new _UniversalDisposable.default(() => {
    if (_getStore().getState().watchEditor === watchEditor) {
      _getStore().dispatch(Actions.setWatchEditor(null));
    }
  });
}

function provideAutocomplete() {
  const activation = this;
  return {
    labels: ["nuclide-console"],
    selector: "*",
    // Copies Chrome devtools and puts history suggestions at the bottom.
    suggestionPriority: -1,

    async getSuggestions(request) {
      // History provides suggestion only on exact match to current input.
      const prefix = request.editor.getText();

      const history = activation._getStore().getState().history; // Use a set to remove duplicates.


      const seen = new Set(history);
      return Array.from(seen).filter(text => text.startsWith(prefix)).map(text => ({
        text,
        replacementPrefix: prefix
      }));
    }

  };
}

function _registerCommandAndOpener() {
  return new _UniversalDisposable.default(atom.workspace.addOpener(uri => {
    if (uri === _Console.WORKSPACE_VIEW_URI) {
      return new _Console.Console({
        store: _getStore()
      });
    }
  }), () => (0, _destroyItemWhere.destroyItemWhere)(item => item instanceof _Console.Console), atom.commands.add("atom-workspace", "console:toggle", () => {
    atom.workspace.toggle(_Console.WORKSPACE_VIEW_URI);
  }));
}

function deserializeConsole(state) {
  return new _Console.Console({
    store: _getStore(),
    initialFilterText: state.filterText,
    initialEnableRegExpFilter: state.enableRegExpFilter,
    initialUnselectedSourceIds: state.unselectedSourceIds,
    initialUnselectedSeverities: new Set(state.unselectedSeverities || [])
  });
}
/**
 * This service provides a factory for creating a console object tied to a particular source. If
 * the consumer wants to expose starting and stopping functionality through the Console UI (for
 * example, to allow the user to decide when to start and stop tailing logs), they can include
 * `start()` and `stop()` functions on the object they pass to the factory.
 *
 * When the factory is invoked, the source will be added to the Console UI's filter list. The
 * factory returns a Disposable which should be disposed of when the source goes away (e.g. its
 * package is disabled). This will remove the source from the Console UI's filter list (as long as
 * there aren't any remaining messages from the source).
 */


function provideConsole() {
  // Create a local, nullable reference so that the service consumers don't keep the Activation
  // instance in memory.
  let activation = this;

  _disposables.add(() => {
    activation = null;
  }); // Creates an objet with callbacks to request manipulations on the current
  // console message entry.


  const createToken = messageId => {
    const findMessage = () => {
      (0, _assert.default)(activation != null);
      return (0, _nullthrows.default)(activation._getStore().getState().incompleteRecords.find(r => r.messageId === messageId));
    };

    return Object.freeze({
      // Message needs to be looked up lazily at call time rather than
      // cached in this object to avoid requiring the update action to
      // operate synchronously. When we append text, we don't know the
      // full new text without looking up the new message object in the
      // new store state after the mutation.
      getCurrentText: () => {
        return findMessage().text;
      },
      getCurrentLevel: () => {
        return findMessage().level;
      },
      setLevel: newLevel => {
        return updateMessage(messageId, null, newLevel, false);
      },
      appendText: text => {
        return updateMessage(messageId, text, null, false);
      },
      setComplete: () => {
        updateMessage(messageId, null, null, true);
      }
    });
  };

  const updateMessage = (messageId, appendText, overrideLevel, setComplete) => {
    (0, _assert.default)(activation != null);

    activation._getStore().dispatch(Actions.recordUpdated(messageId, appendText, overrideLevel, setComplete));

    return createToken(messageId);
  };

  return sourceInfo => {
    (0, _assert.default)(activation != null);
    let disposed;

    activation._getStore().dispatch(Actions.registerSource(sourceInfo));

    const console = {
      // TODO: Update these to be (object: any, ...objects: Array<any>): void.
      log(object) {
        return console.append({
          text: object,
          level: "log"
        });
      },

      warn(object) {
        return console.append({
          text: object,
          level: "warning"
        });
      },

      error(object) {
        return console.append({
          text: object,
          level: "error"
        });
      },

      info(object) {
        return console.append({
          text: object,
          level: "info"
        });
      },

      success(object) {
        return console.append({
          text: object,
          level: "success"
        });
      },

      append(message) {
        (0, _assert.default)(activation != null && !disposed);
        const incomplete = Boolean(message.incomplete);
        const record = {
          // A unique message ID is not required for complete messages,
          // since they cannot be updated they don't need to be found later.
          text: message.text,
          level: message.level,
          format: message.format,
          expressions: message.expressions,
          tags: message.tags,
          scopeName: message.scopeName,
          sourceId: sourceInfo.id,
          sourceName: sourceInfo.name,
          kind: message.kind || "message",
          timestamp: new Date(),
          // TODO: Allow this to come with the message?
          repeatCount: 1,
          incomplete
        };
        let token = null;

        if (incomplete) {
          // An ID is only required for incomplete messages, which need
          // to be looked up for mutations.
          record.messageId = _uuid.default.v4();
          token = createToken(record.messageId);
        }

        activation._getStore().dispatch(Actions.recordReceived(record));

        return token;
      },

      setStatus(status) {
        (0, _assert.default)(activation != null && !disposed);

        activation._getStore().dispatch(Actions.updateStatus(sourceInfo.id, status));
      },

      dispose() {
        (0, _assert.default)(activation != null);

        if (!disposed) {
          disposed = true;

          activation._getStore().dispatch(Actions.removeSource(sourceInfo.id));
        }
      }

    };
    return console;
  };
}

function provideRegisterExecutor() {
  // Create a local, nullable reference so that the service consumers don't keep the Activation
  // instance in memory.
  let activation = this;

  _disposables.add(() => {
    activation = null;
  });

  return executor => {
    (0, _assert.default)(activation != null, "Executor registration attempted after deactivation");

    activation._getStore().dispatch(Actions.registerExecutor(executor));

    return new _UniversalDisposable.default(() => {
      if (activation != null) {
        activation._getStore().dispatch(Actions.unregisterExecutor(executor));
      }
    });
  };
}

function serialize() {
  if (_store == null) {
    return {};
  }

  const maximumSerializedMessages = _featureConfig.default.get(MAXIMUM_SERIALIZED_MESSAGES_CONFIG);

  const maximumSerializedHistory = _featureConfig.default.get(MAXIMUM_SERIALIZED_HISTORY_CONFIG);

  return {
    records: _store.getState().records.slice(-maximumSerializedMessages).toArray().map(record => {
      // `Executor` is not serializable. Make sure to remove it first.
      const {
        executor,
        ...rest
      } = record;
      return rest;
    }),
    history: _store.getState().history.slice(-maximumSerializedHistory)
  };
}

function deserializeAppState(rawState) {
  return {
    executors: new Map(),
    createPasteFunction: null,
    currentExecutorId: null,
    records: rawState && rawState.records ? (0, _immutable.List)(rawState.records.map(deserializeRecord)) : (0, _immutable.List)(),
    incompleteRecords: rawState && rawState.incompleteRecords ? (0, _immutable.List)(rawState.incompleteRecords.map(deserializeRecord)) : (0, _immutable.List)(),
    history: rawState && rawState.history ? rawState.history : [],
    providers: new Map(),
    providerStatuses: new Map(),
    // This value will be replaced with the value form the config. We just use `POSITIVE_INFINITY`
    // here to conform to the AppState type defintion.
    maxMessageCount: Number.POSITIVE_INFINITY
  };
}

function deserializeRecord(record) {
  return { ...record,
    timestamp: parseDate(record.timestamp) || new Date(0),
    // At one point in the time the messageId was a number, so the user might
    // have a number serialized.
    messageId: record == null || record.messageId == null || // Sigh. We (I, -jeldredge) had a bug at one point where we accidentally
    // converted serialized values of `undefined` to the string `"undefiend"`.
    // Those could then have been serialized back to disk. So, for a little
    // while at least, we should ensure we fix these bad values.
    record.messageId === "undefined" ? undefined : String(record.messageId)
  };
}

function parseDate(raw) {
  if (raw == null) {
    return null;
  }

  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyIsIk1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyIsIl9kaXNwb3NhYmxlcyIsIl9yYXdTdGF0ZSIsIl9zdG9yZSIsIl9uZXh0TWVzc2FnZUlkIiwiYWN0aXZhdGUiLCJyYXdTdGF0ZSIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJhdG9tIiwiY29udGV4dE1lbnUiLCJhZGQiLCJsYWJlbCIsImNvbW1hbmQiLCJjb21tYW5kcyIsImV2ZW50IiwiZWwiLCJ0YXJnZXQiLCJpbm5lclRleHQiLCJjbGlwYm9hcmQiLCJ3cml0ZSIsIl9nZXRTdG9yZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsImNsZWFyUmVjb3JkcyIsImZlYXR1cmVDb25maWciLCJvYnNlcnZlIiwibWF4TWVzc2FnZUNvdW50Iiwic2V0TWF4TWVzc2FnZUNvdW50IiwiT2JzZXJ2YWJsZSIsImNvbWJpbmVMYXRlc3QiLCJjYiIsImNvbmZpZyIsIm9ic2VydmVBc1N0cmVhbSIsImZvbnRTaXplIiwiZm9udFNjYWxlIiwicGFyc2VGbG9hdCIsIm1hcCIsInNldEZvbnRTaXplIiwic3Vic2NyaWJlIiwiX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lciIsImluaXRpYWxTdGF0ZSIsImRlc2VyaWFsaXplQXBwU3RhdGUiLCJyb290RXBpYyIsIkVwaWNzIiwiUmVkdWNlcnMiLCJkZWFjdGl2YXRlIiwiZGlzcG9zZSIsImNvbnN1bWVUb29sQmFyIiwiZ2V0VG9vbEJhciIsInRvb2xCYXIiLCJhZGRCdXR0b24iLCJpY29uIiwiY2FsbGJhY2siLCJ0b29sdGlwIiwicHJpb3JpdHkiLCJyZW1vdmVJdGVtcyIsImNvbnN1bWVQYXN0ZVByb3ZpZGVyIiwicHJvdmlkZXIiLCJjcmVhdGVQYXN0ZSIsInNldENyZWF0ZVBhc3RlRnVuY3Rpb24iLCJnZXRTdGF0ZSIsImNyZWF0ZVBhc3RlRnVuY3Rpb24iLCJjb25zdW1lV2F0Y2hFZGl0b3IiLCJ3YXRjaEVkaXRvciIsInNldFdhdGNoRWRpdG9yIiwicHJvdmlkZUF1dG9jb21wbGV0ZSIsImFjdGl2YXRpb24iLCJsYWJlbHMiLCJzZWxlY3RvciIsInN1Z2dlc3Rpb25Qcmlvcml0eSIsImdldFN1Z2dlc3Rpb25zIiwicmVxdWVzdCIsInByZWZpeCIsImVkaXRvciIsImdldFRleHQiLCJoaXN0b3J5Iiwic2VlbiIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsInRleHQiLCJzdGFydHNXaXRoIiwicmVwbGFjZW1lbnRQcmVmaXgiLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJXT1JLU1BBQ0VfVklFV19VUkkiLCJDb25zb2xlIiwic3RvcmUiLCJpdGVtIiwidG9nZ2xlIiwiZGVzZXJpYWxpemVDb25zb2xlIiwic3RhdGUiLCJpbml0aWFsRmlsdGVyVGV4dCIsImZpbHRlclRleHQiLCJpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJ1bnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RlZFNldmVyaXRpZXMiLCJwcm92aWRlQ29uc29sZSIsImNyZWF0ZVRva2VuIiwibWVzc2FnZUlkIiwiZmluZE1lc3NhZ2UiLCJpbmNvbXBsZXRlUmVjb3JkcyIsImZpbmQiLCJyIiwiT2JqZWN0IiwiZnJlZXplIiwiZ2V0Q3VycmVudFRleHQiLCJnZXRDdXJyZW50TGV2ZWwiLCJsZXZlbCIsInNldExldmVsIiwibmV3TGV2ZWwiLCJ1cGRhdGVNZXNzYWdlIiwiYXBwZW5kVGV4dCIsInNldENvbXBsZXRlIiwib3ZlcnJpZGVMZXZlbCIsInJlY29yZFVwZGF0ZWQiLCJzb3VyY2VJbmZvIiwiZGlzcG9zZWQiLCJyZWdpc3RlclNvdXJjZSIsImNvbnNvbGUiLCJsb2ciLCJvYmplY3QiLCJhcHBlbmQiLCJ3YXJuIiwiZXJyb3IiLCJpbmZvIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJpbmNvbXBsZXRlIiwiQm9vbGVhbiIsInJlY29yZCIsImZvcm1hdCIsImV4cHJlc3Npb25zIiwidGFncyIsInNjb3BlTmFtZSIsInNvdXJjZUlkIiwiaWQiLCJzb3VyY2VOYW1lIiwibmFtZSIsImtpbmQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicmVwZWF0Q291bnQiLCJ0b2tlbiIsInV1aWQiLCJ2NCIsInJlY29yZFJlY2VpdmVkIiwic2V0U3RhdHVzIiwic3RhdHVzIiwidXBkYXRlU3RhdHVzIiwicmVtb3ZlU291cmNlIiwicHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IiLCJleGVjdXRvciIsInJlZ2lzdGVyRXhlY3V0b3IiLCJ1bnJlZ2lzdGVyRXhlY3V0b3IiLCJzZXJpYWxpemUiLCJtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzIiwiZ2V0IiwibWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5IiwicmVjb3JkcyIsInNsaWNlIiwidG9BcnJheSIsInJlc3QiLCJleGVjdXRvcnMiLCJNYXAiLCJjdXJyZW50RXhlY3V0b3JJZCIsImRlc2VyaWFsaXplUmVjb3JkIiwicHJvdmlkZXJzIiwicHJvdmlkZXJTdGF0dXNlcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwicGFyc2VEYXRlIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicmF3IiwiZGF0ZSIsImlzTmFOIiwiZ2V0VGltZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFsQkE7QUFvQkEsTUFBTUEsa0NBQWtDLEdBQUcsNENBQTNDO0FBQ0EsTUFBTUMsaUNBQWlDLEdBQUcsMkNBQTFDOztBQUVBLElBQUlDLFlBQUo7O0FBQ0EsSUFBSUMsU0FBSjs7QUFDQSxJQUFJQyxNQUFKOztBQUNBLElBQUlDLGNBQUo7O0FBRU8sU0FBU0MsUUFBVCxDQUFrQkMsUUFBbEIsRUFBcUM7QUFDMUNKLEVBQUFBLFNBQVMsR0FBR0ksUUFBWjtBQUNBRixFQUFBQSxjQUFjLEdBQUcsQ0FBakI7QUFDQUgsRUFBQUEsWUFBWSxHQUFHLElBQUlNLDRCQUFKLENBQ2JDLElBQUksQ0FBQ0MsV0FBTCxDQUFpQkMsR0FBakIsQ0FBcUI7QUFDbkIsdUJBQW1CLENBQ2pCO0FBQ0VDLE1BQUFBLEtBQUssRUFBRSxjQURUO0FBRUVDLE1BQUFBLE9BQU8sRUFBRTtBQUZYLEtBRGlCO0FBREEsR0FBckIsQ0FEYSxFQVNiSixJQUFJLENBQUNLLFFBQUwsQ0FBY0gsR0FBZCxDQUFrQixpQkFBbEIsRUFBcUMsc0JBQXJDLEVBQThESSxLQUFELElBQVc7QUFDdEUsVUFBTUMsRUFBRSxHQUFHRCxLQUFLLENBQUNFLE1BQWpCLENBRHNFLENBRXRFOztBQUNBLFFBQUlELEVBQUUsSUFBSSxJQUFOLElBQWMsT0FBT0EsRUFBRSxDQUFDRSxTQUFWLEtBQXdCLFFBQTFDLEVBQW9EO0FBQ2xEO0FBQ0Q7O0FBQ0RULElBQUFBLElBQUksQ0FBQ1UsU0FBTCxDQUFlQyxLQUFmLENBQXFCSixFQUFFLENBQUNFLFNBQXhCO0FBQ0QsR0FQRCxDQVRhLEVBaUJiVCxJQUFJLENBQUNLLFFBQUwsQ0FBY0gsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsZUFBcEMsRUFBcUQsTUFBTVUsU0FBUyxHQUFHQyxRQUFaLENBQXFCQyxPQUFPLENBQUNDLFlBQVIsRUFBckIsQ0FBM0QsQ0FqQmEsRUFrQmJDLHVCQUFjQyxPQUFkLENBQXNCLHNDQUF0QixFQUErREMsZUFBRCxJQUEwQjtBQUN0Rk4sSUFBQUEsU0FBUyxHQUFHQyxRQUFaLENBQXFCQyxPQUFPLENBQUNLLGtCQUFSLENBQTJCRCxlQUEzQixDQUFyQjtBQUNELEdBRkQsQ0FsQmEsRUFxQmJFLDZCQUFXQyxhQUFYLENBQ0UsNENBQWlDQyxFQUFELElBQVF0QixJQUFJLENBQUN1QixNQUFMLENBQVlOLE9BQVosQ0FBb0IsaUJBQXBCLEVBQXVDSyxFQUF2QyxDQUF4QyxDQURGLEVBRUVOLHVCQUFjUSxlQUFkLENBQThCLDRCQUE5QixDQUZGLEVBR0UsQ0FBQ0MsUUFBRCxFQUFXQyxTQUFYLEtBQXlCRCxRQUFRLEdBQUdFLFVBQVUsQ0FBQ0QsU0FBRCxDQUhoRCxFQUtHRSxHQUxILENBS09kLE9BQU8sQ0FBQ2UsV0FMZixFQU1HQyxTQU5ILENBTWFuQyxNQUFNLENBQUNrQixRQU5wQixDQXJCYSxFQTRCYmtCLHlCQUF5QixFQTVCWixDQUFmO0FBOEJEOztBQUVELFNBQVNuQixTQUFULEdBQTRCO0FBQzFCLE1BQUlqQixNQUFNLElBQUksSUFBZCxFQUFvQjtBQUNsQixVQUFNcUMsWUFBWSxHQUFHQyxtQkFBbUIsQ0FBQ3ZDLFNBQUQsQ0FBeEM7QUFDQSxVQUFNd0MsUUFBUSxHQUFHLDBDQUF3QkMsS0FBeEIsRUFBK0IsYUFBL0IsQ0FBakI7QUFDQXhDLElBQUFBLE1BQU0sR0FBRyx3QkFBWXlDLGlCQUFaLEVBQXNCSixZQUF0QixFQUFvQyw0QkFBZ0IsMkNBQXFCRSxRQUFyQixDQUFoQixDQUFwQyxDQUFUO0FBQ0Q7O0FBQ0QsU0FBT3ZDLE1BQVA7QUFDRDs7QUFFTSxTQUFTMEMsVUFBVCxHQUFzQjtBQUMzQjVDLEVBQUFBLFlBQVksQ0FBQzZDLE9BQWI7QUFDRDs7QUFFTSxTQUFTQyxjQUFULENBQXdCQyxVQUF4QixFQUE4RDtBQUNuRSxRQUFNQyxPQUFPLEdBQUdELFVBQVUsQ0FBQyxpQkFBRCxDQUExQjtBQUNBQyxFQUFBQSxPQUFPLENBQUNDLFNBQVIsQ0FBa0I7QUFDaEJDLElBQUFBLElBQUksRUFBRSxrQkFEVTtBQUVoQkMsSUFBQUEsUUFBUSxFQUFFLGdCQUZNO0FBR2hCQyxJQUFBQSxPQUFPLEVBQUUsZ0JBSE87QUFJaEJDLElBQUFBLFFBQVEsRUFBRTtBQUpNLEdBQWxCOztBQU1BckQsRUFBQUEsWUFBWSxDQUFDUyxHQUFiLENBQWlCLE1BQU07QUFDckJ1QyxJQUFBQSxPQUFPLENBQUNNLFdBQVI7QUFDRCxHQUZEO0FBR0Q7O0FBRU0sU0FBU0Msb0JBQVQsQ0FBOEJDLFFBQTlCLEVBQTBEO0FBQy9ELFFBQU1DLFdBQWdDLEdBQUdELFFBQVEsQ0FBQ0MsV0FBbEQ7O0FBQ0F0QyxFQUFBQSxTQUFTLEdBQUdDLFFBQVosQ0FBcUJDLE9BQU8sQ0FBQ3FDLHNCQUFSLENBQStCRCxXQUEvQixDQUFyQjs7QUFDQSxTQUFPLElBQUluRCw0QkFBSixDQUF3QixNQUFNO0FBQ25DLFFBQUlhLFNBQVMsR0FBR3dDLFFBQVosR0FBdUJDLG1CQUF2QixLQUErQ0gsV0FBbkQsRUFBZ0U7QUFDOUR0QyxNQUFBQSxTQUFTLEdBQUdDLFFBQVosQ0FBcUJDLE9BQU8sQ0FBQ3FDLHNCQUFSLENBQStCLElBQS9CLENBQXJCO0FBQ0Q7QUFDRixHQUpNLENBQVA7QUFLRDs7QUFFTSxTQUFTRyxrQkFBVCxDQUE0QkMsV0FBNUIsRUFBb0Y7QUFDekYzQyxFQUFBQSxTQUFTLEdBQUdDLFFBQVosQ0FBcUJDLE9BQU8sQ0FBQzBDLGNBQVIsQ0FBdUJELFdBQXZCLENBQXJCOztBQUNBLFNBQU8sSUFBSXhELDRCQUFKLENBQXdCLE1BQU07QUFDbkMsUUFBSWEsU0FBUyxHQUFHd0MsUUFBWixHQUF1QkcsV0FBdkIsS0FBdUNBLFdBQTNDLEVBQXdEO0FBQ3REM0MsTUFBQUEsU0FBUyxHQUFHQyxRQUFaLENBQXFCQyxPQUFPLENBQUMwQyxjQUFSLENBQXVCLElBQXZCLENBQXJCO0FBQ0Q7QUFDRixHQUpNLENBQVA7QUFLRDs7QUFFTSxTQUFTQyxtQkFBVCxHQUEwRDtBQUMvRCxRQUFNQyxVQUFVLEdBQUcsSUFBbkI7QUFDQSxTQUFPO0FBQ0xDLElBQUFBLE1BQU0sRUFBRSxDQUFDLGlCQUFELENBREg7QUFFTEMsSUFBQUEsUUFBUSxFQUFFLEdBRkw7QUFHTDtBQUNBQyxJQUFBQSxrQkFBa0IsRUFBRSxDQUFDLENBSmhCOztBQUtMLFVBQU1DLGNBQU4sQ0FBcUJDLE9BQXJCLEVBQThCO0FBQzVCO0FBQ0EsWUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUNFLE1BQVIsQ0FBZUMsT0FBZixFQUFmOztBQUNBLFlBQU1DLE9BQU8sR0FBR1QsVUFBVSxDQUFDOUMsU0FBWCxHQUF1QndDLFFBQXZCLEdBQWtDZSxPQUFsRCxDQUg0QixDQUk1Qjs7O0FBQ0EsWUFBTUMsSUFBSSxHQUFHLElBQUlDLEdBQUosQ0FBUUYsT0FBUixDQUFiO0FBQ0EsYUFBT0csS0FBSyxDQUFDQyxJQUFOLENBQVdILElBQVgsRUFDSkksTUFESSxDQUNJQyxJQUFELElBQVVBLElBQUksQ0FBQ0MsVUFBTCxDQUFnQlYsTUFBaEIsQ0FEYixFQUVKcEMsR0FGSSxDQUVDNkMsSUFBRCxLQUFXO0FBQUVBLFFBQUFBLElBQUY7QUFBUUUsUUFBQUEsaUJBQWlCLEVBQUVYO0FBQTNCLE9BQVgsQ0FGQSxDQUFQO0FBR0Q7O0FBZEksR0FBUDtBQWdCRDs7QUFFRCxTQUFTakMseUJBQVQsR0FBMEQ7QUFDeEQsU0FBTyxJQUFJaEMsNEJBQUosQ0FDTEMsSUFBSSxDQUFDNEUsU0FBTCxDQUFlQyxTQUFmLENBQTBCQyxHQUFELElBQVM7QUFDaEMsUUFBSUEsR0FBRyxLQUFLQywyQkFBWixFQUFnQztBQUM5QixhQUFPLElBQUlDLGdCQUFKLENBQVk7QUFBRUMsUUFBQUEsS0FBSyxFQUFFckUsU0FBUztBQUFsQixPQUFaLENBQVA7QUFDRDtBQUNGLEdBSkQsQ0FESyxFQU1MLE1BQU0sd0NBQWtCc0UsSUFBRCxJQUFVQSxJQUFJLFlBQVlGLGdCQUEzQyxDQU5ELEVBT0xoRixJQUFJLENBQUNLLFFBQUwsQ0FBY0gsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsZ0JBQXBDLEVBQXNELE1BQU07QUFDMURGLElBQUFBLElBQUksQ0FBQzRFLFNBQUwsQ0FBZU8sTUFBZixDQUFzQkosMkJBQXRCO0FBQ0QsR0FGRCxDQVBLLENBQVA7QUFXRDs7QUFFTSxTQUFTSyxrQkFBVCxDQUE0QkMsS0FBNUIsRUFBbUU7QUFDeEUsU0FBTyxJQUFJTCxnQkFBSixDQUFZO0FBQ2pCQyxJQUFBQSxLQUFLLEVBQUVyRSxTQUFTLEVBREM7QUFFakIwRSxJQUFBQSxpQkFBaUIsRUFBRUQsS0FBSyxDQUFDRSxVQUZSO0FBR2pCQyxJQUFBQSx5QkFBeUIsRUFBRUgsS0FBSyxDQUFDSSxrQkFIaEI7QUFJakJDLElBQUFBLDBCQUEwQixFQUFFTCxLQUFLLENBQUNNLG1CQUpqQjtBQUtqQkMsSUFBQUEsMkJBQTJCLEVBQUUsSUFBSXZCLEdBQUosQ0FBUWdCLEtBQUssQ0FBQ1Esb0JBQU4sSUFBOEIsRUFBdEM7QUFMWixHQUFaLENBQVA7QUFPRDtBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNPLFNBQVNDLGNBQVQsR0FBMEM7QUFDL0M7QUFDQTtBQUNBLE1BQUlwQyxVQUFVLEdBQUcsSUFBakI7O0FBQ0FqRSxFQUFBQSxZQUFZLENBQUNTLEdBQWIsQ0FBaUIsTUFBTTtBQUNyQndELElBQUFBLFVBQVUsR0FBRyxJQUFiO0FBQ0QsR0FGRCxFQUorQyxDQVEvQztBQUNBOzs7QUFDQSxRQUFNcUMsV0FBVyxHQUFJQyxTQUFELElBQXVCO0FBQ3pDLFVBQU1DLFdBQVcsR0FBRyxNQUFNO0FBQ3hCLDJCQUFVdkMsVUFBVSxJQUFJLElBQXhCO0FBQ0EsYUFBTyx5QkFDTEEsVUFBVSxDQUNQOUMsU0FESCxHQUVHd0MsUUFGSCxHQUdHOEMsaUJBSEgsQ0FHcUJDLElBSHJCLENBRzJCQyxDQUFELElBQU9BLENBQUMsQ0FBQ0osU0FBRixLQUFnQkEsU0FIakQsQ0FESyxDQUFQO0FBTUQsS0FSRDs7QUFVQSxXQUFPSyxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FDLE1BQUFBLGNBQWMsRUFBRSxNQUFNO0FBQ3BCLGVBQU9OLFdBQVcsR0FBR3hCLElBQXJCO0FBQ0QsT0FSa0I7QUFTbkIrQixNQUFBQSxlQUFlLEVBQUUsTUFBTTtBQUNyQixlQUFPUCxXQUFXLEdBQUdRLEtBQXJCO0FBQ0QsT0FYa0I7QUFZbkJDLE1BQUFBLFFBQVEsRUFBR0MsUUFBRCxJQUFxQjtBQUM3QixlQUFPQyxhQUFhLENBQUNaLFNBQUQsRUFBWSxJQUFaLEVBQWtCVyxRQUFsQixFQUE0QixLQUE1QixDQUFwQjtBQUNELE9BZGtCO0FBZW5CRSxNQUFBQSxVQUFVLEVBQUdwQyxJQUFELElBQWtCO0FBQzVCLGVBQU9tQyxhQUFhLENBQUNaLFNBQUQsRUFBWXZCLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEIsQ0FBcEI7QUFDRCxPQWpCa0I7QUFrQm5CcUMsTUFBQUEsV0FBVyxFQUFFLE1BQU07QUFDakJGLFFBQUFBLGFBQWEsQ0FBQ1osU0FBRCxFQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsSUFBeEIsQ0FBYjtBQUNEO0FBcEJrQixLQUFkLENBQVA7QUFzQkQsR0FqQ0Q7O0FBbUNBLFFBQU1ZLGFBQWEsR0FBRyxDQUFDWixTQUFELEVBQW9CYSxVQUFwQixFQUF5Q0UsYUFBekMsRUFBZ0VELFdBQWhFLEtBQXlGO0FBQzdHLHlCQUFVcEQsVUFBVSxJQUFJLElBQXhCOztBQUNBQSxJQUFBQSxVQUFVLENBQUM5QyxTQUFYLEdBQXVCQyxRQUF2QixDQUFnQ0MsT0FBTyxDQUFDa0csYUFBUixDQUFzQmhCLFNBQXRCLEVBQWlDYSxVQUFqQyxFQUE2Q0UsYUFBN0MsRUFBNERELFdBQTVELENBQWhDOztBQUNBLFdBQU9mLFdBQVcsQ0FBQ0MsU0FBRCxDQUFsQjtBQUNELEdBSkQ7O0FBTUEsU0FBUWlCLFVBQUQsSUFBNEI7QUFDakMseUJBQVV2RCxVQUFVLElBQUksSUFBeEI7QUFDQSxRQUFJd0QsUUFBSjs7QUFDQXhELElBQUFBLFVBQVUsQ0FBQzlDLFNBQVgsR0FBdUJDLFFBQXZCLENBQWdDQyxPQUFPLENBQUNxRyxjQUFSLENBQXVCRixVQUF2QixDQUFoQzs7QUFDQSxVQUFNRyxPQUFPLEdBQUc7QUFDZDtBQUNBQyxNQUFBQSxHQUFHLENBQUNDLE1BQUQsRUFBK0I7QUFDaEMsZUFBT0YsT0FBTyxDQUFDRyxNQUFSLENBQWU7QUFBRTlDLFVBQUFBLElBQUksRUFBRTZDLE1BQVI7QUFBZ0JiLFVBQUFBLEtBQUssRUFBRTtBQUF2QixTQUFmLENBQVA7QUFDRCxPQUphOztBQUtkZSxNQUFBQSxJQUFJLENBQUNGLE1BQUQsRUFBK0I7QUFDakMsZUFBT0YsT0FBTyxDQUFDRyxNQUFSLENBQWU7QUFBRTlDLFVBQUFBLElBQUksRUFBRTZDLE1BQVI7QUFBZ0JiLFVBQUFBLEtBQUssRUFBRTtBQUF2QixTQUFmLENBQVA7QUFDRCxPQVBhOztBQVFkZ0IsTUFBQUEsS0FBSyxDQUFDSCxNQUFELEVBQStCO0FBQ2xDLGVBQU9GLE9BQU8sQ0FBQ0csTUFBUixDQUFlO0FBQUU5QyxVQUFBQSxJQUFJLEVBQUU2QyxNQUFSO0FBQWdCYixVQUFBQSxLQUFLLEVBQUU7QUFBdkIsU0FBZixDQUFQO0FBQ0QsT0FWYTs7QUFXZGlCLE1BQUFBLElBQUksQ0FBQ0osTUFBRCxFQUErQjtBQUNqQyxlQUFPRixPQUFPLENBQUNHLE1BQVIsQ0FBZTtBQUFFOUMsVUFBQUEsSUFBSSxFQUFFNkMsTUFBUjtBQUFnQmIsVUFBQUEsS0FBSyxFQUFFO0FBQXZCLFNBQWYsQ0FBUDtBQUNELE9BYmE7O0FBY2RrQixNQUFBQSxPQUFPLENBQUNMLE1BQUQsRUFBK0I7QUFDcEMsZUFBT0YsT0FBTyxDQUFDRyxNQUFSLENBQWU7QUFBRTlDLFVBQUFBLElBQUksRUFBRTZDLE1BQVI7QUFBZ0JiLFVBQUFBLEtBQUssRUFBRTtBQUF2QixTQUFmLENBQVA7QUFDRCxPQWhCYTs7QUFpQmRjLE1BQUFBLE1BQU0sQ0FBQ0ssT0FBRCxFQUFpQztBQUNyQyw2QkFBVWxFLFVBQVUsSUFBSSxJQUFkLElBQXNCLENBQUN3RCxRQUFqQztBQUNBLGNBQU1XLFVBQVUsR0FBR0MsT0FBTyxDQUFDRixPQUFPLENBQUNDLFVBQVQsQ0FBMUI7QUFDQSxjQUFNRSxNQUFjLEdBQUc7QUFDckI7QUFDQTtBQUNBdEQsVUFBQUEsSUFBSSxFQUFFbUQsT0FBTyxDQUFDbkQsSUFITztBQUlyQmdDLFVBQUFBLEtBQUssRUFBRW1CLE9BQU8sQ0FBQ25CLEtBSk07QUFLckJ1QixVQUFBQSxNQUFNLEVBQUVKLE9BQU8sQ0FBQ0ksTUFMSztBQU1yQkMsVUFBQUEsV0FBVyxFQUFFTCxPQUFPLENBQUNLLFdBTkE7QUFPckJDLFVBQUFBLElBQUksRUFBRU4sT0FBTyxDQUFDTSxJQVBPO0FBUXJCQyxVQUFBQSxTQUFTLEVBQUVQLE9BQU8sQ0FBQ08sU0FSRTtBQVNyQkMsVUFBQUEsUUFBUSxFQUFFbkIsVUFBVSxDQUFDb0IsRUFUQTtBQVVyQkMsVUFBQUEsVUFBVSxFQUFFckIsVUFBVSxDQUFDc0IsSUFWRjtBQVdyQkMsVUFBQUEsSUFBSSxFQUFFWixPQUFPLENBQUNZLElBQVIsSUFBZ0IsU0FYRDtBQVlyQkMsVUFBQUEsU0FBUyxFQUFFLElBQUlDLElBQUosRUFaVTtBQVlFO0FBQ3ZCQyxVQUFBQSxXQUFXLEVBQUUsQ0FiUTtBQWNyQmQsVUFBQUE7QUFkcUIsU0FBdkI7QUFpQkEsWUFBSWUsS0FBSyxHQUFHLElBQVo7O0FBQ0EsWUFBSWYsVUFBSixFQUFnQjtBQUNkO0FBQ0E7QUFDQUUsVUFBQUEsTUFBTSxDQUFDL0IsU0FBUCxHQUFtQjZDLGNBQUtDLEVBQUwsRUFBbkI7QUFDQUYsVUFBQUEsS0FBSyxHQUFHN0MsV0FBVyxDQUFDZ0MsTUFBTSxDQUFDL0IsU0FBUixDQUFuQjtBQUNEOztBQUVEdEMsUUFBQUEsVUFBVSxDQUFDOUMsU0FBWCxHQUF1QkMsUUFBdkIsQ0FBZ0NDLE9BQU8sQ0FBQ2lJLGNBQVIsQ0FBdUJoQixNQUF2QixDQUFoQzs7QUFDQSxlQUFPYSxLQUFQO0FBQ0QsT0EvQ2E7O0FBZ0RkSSxNQUFBQSxTQUFTLENBQUNDLE1BQUQsRUFBb0M7QUFDM0MsNkJBQVV2RixVQUFVLElBQUksSUFBZCxJQUFzQixDQUFDd0QsUUFBakM7O0FBQ0F4RCxRQUFBQSxVQUFVLENBQUM5QyxTQUFYLEdBQXVCQyxRQUF2QixDQUFnQ0MsT0FBTyxDQUFDb0ksWUFBUixDQUFxQmpDLFVBQVUsQ0FBQ29CLEVBQWhDLEVBQW9DWSxNQUFwQyxDQUFoQztBQUNELE9BbkRhOztBQW9EZDNHLE1BQUFBLE9BQU8sR0FBUztBQUNkLDZCQUFVb0IsVUFBVSxJQUFJLElBQXhCOztBQUNBLFlBQUksQ0FBQ3dELFFBQUwsRUFBZTtBQUNiQSxVQUFBQSxRQUFRLEdBQUcsSUFBWDs7QUFDQXhELFVBQUFBLFVBQVUsQ0FBQzlDLFNBQVgsR0FBdUJDLFFBQXZCLENBQWdDQyxPQUFPLENBQUNxSSxZQUFSLENBQXFCbEMsVUFBVSxDQUFDb0IsRUFBaEMsQ0FBaEM7QUFDRDtBQUNGOztBQTFEYSxLQUFoQjtBQTREQSxXQUFPakIsT0FBUDtBQUNELEdBakVEO0FBa0VEOztBQUVNLFNBQVNnQyx1QkFBVCxHQUE2RDtBQUNsRTtBQUNBO0FBQ0EsTUFBSTFGLFVBQVUsR0FBRyxJQUFqQjs7QUFDQWpFLEVBQUFBLFlBQVksQ0FBQ1MsR0FBYixDQUFpQixNQUFNO0FBQ3JCd0QsSUFBQUEsVUFBVSxHQUFHLElBQWI7QUFDRCxHQUZEOztBQUlBLFNBQVEyRixRQUFELElBQWM7QUFDbkIseUJBQVUzRixVQUFVLElBQUksSUFBeEIsRUFBOEIsb0RBQTlCOztBQUNBQSxJQUFBQSxVQUFVLENBQUM5QyxTQUFYLEdBQXVCQyxRQUF2QixDQUFnQ0MsT0FBTyxDQUFDd0ksZ0JBQVIsQ0FBeUJELFFBQXpCLENBQWhDOztBQUNBLFdBQU8sSUFBSXRKLDRCQUFKLENBQXdCLE1BQU07QUFDbkMsVUFBSTJELFVBQVUsSUFBSSxJQUFsQixFQUF3QjtBQUN0QkEsUUFBQUEsVUFBVSxDQUFDOUMsU0FBWCxHQUF1QkMsUUFBdkIsQ0FBZ0NDLE9BQU8sQ0FBQ3lJLGtCQUFSLENBQTJCRixRQUEzQixDQUFoQztBQUNEO0FBQ0YsS0FKTSxDQUFQO0FBS0QsR0FSRDtBQVNEOztBQUVNLFNBQVNHLFNBQVQsR0FBNkI7QUFDbEMsTUFBSTdKLE1BQU0sSUFBSSxJQUFkLEVBQW9CO0FBQ2xCLFdBQU8sRUFBUDtBQUNEOztBQUNELFFBQU04Six5QkFBaUMsR0FBSXpJLHVCQUFjMEksR0FBZCxDQUFrQm5LLGtDQUFsQixDQUEzQzs7QUFDQSxRQUFNb0ssd0JBQWdDLEdBQUkzSSx1QkFBYzBJLEdBQWQsQ0FBa0JsSyxpQ0FBbEIsQ0FBMUM7O0FBQ0EsU0FBTztBQUNMb0ssSUFBQUEsT0FBTyxFQUFFakssTUFBTSxDQUNaeUQsUUFETSxHQUVOd0csT0FGTSxDQUVFQyxLQUZGLENBRVEsQ0FBQ0oseUJBRlQsRUFHTkssT0FITSxHQUlObEksR0FKTSxDQUlEbUcsTUFBRCxJQUFZO0FBQ2Y7QUFDQSxZQUFNO0FBQUVzQixRQUFBQSxRQUFGO0FBQVksV0FBR1U7QUFBZixVQUF3QmhDLE1BQTlCO0FBQ0EsYUFBT2dDLElBQVA7QUFDRCxLQVJNLENBREo7QUFVTDVGLElBQUFBLE9BQU8sRUFBRXhFLE1BQU0sQ0FBQ3lELFFBQVAsR0FBa0JlLE9BQWxCLENBQTBCMEYsS0FBMUIsQ0FBZ0MsQ0FBQ0Ysd0JBQWpDO0FBVkosR0FBUDtBQVlEOztBQUVELFNBQVMxSCxtQkFBVCxDQUE2Qm5DLFFBQTdCLEVBQTBEO0FBQ3hELFNBQU87QUFDTGtLLElBQUFBLFNBQVMsRUFBRSxJQUFJQyxHQUFKLEVBRE47QUFFTDVHLElBQUFBLG1CQUFtQixFQUFFLElBRmhCO0FBR0w2RyxJQUFBQSxpQkFBaUIsRUFBRSxJQUhkO0FBSUxOLElBQUFBLE9BQU8sRUFBRTlKLFFBQVEsSUFBSUEsUUFBUSxDQUFDOEosT0FBckIsR0FBK0IscUJBQUs5SixRQUFRLENBQUM4SixPQUFULENBQWlCaEksR0FBakIsQ0FBcUJ1SSxpQkFBckIsQ0FBTCxDQUEvQixHQUErRSxzQkFKbkY7QUFLTGpFLElBQUFBLGlCQUFpQixFQUNmcEcsUUFBUSxJQUFJQSxRQUFRLENBQUNvRyxpQkFBckIsR0FBeUMscUJBQUtwRyxRQUFRLENBQUNvRyxpQkFBVCxDQUEyQnRFLEdBQTNCLENBQStCdUksaUJBQS9CLENBQUwsQ0FBekMsR0FBbUcsc0JBTmhHO0FBT0xoRyxJQUFBQSxPQUFPLEVBQUVyRSxRQUFRLElBQUlBLFFBQVEsQ0FBQ3FFLE9BQXJCLEdBQStCckUsUUFBUSxDQUFDcUUsT0FBeEMsR0FBa0QsRUFQdEQ7QUFRTGlHLElBQUFBLFNBQVMsRUFBRSxJQUFJSCxHQUFKLEVBUk47QUFTTEksSUFBQUEsZ0JBQWdCLEVBQUUsSUFBSUosR0FBSixFQVRiO0FBV0w7QUFDQTtBQUNBL0ksSUFBQUEsZUFBZSxFQUFFb0osTUFBTSxDQUFDQztBQWJuQixHQUFQO0FBZUQ7O0FBRUQsU0FBU0osaUJBQVQsQ0FBMkJwQyxNQUEzQixFQUFtRDtBQUNqRCxTQUFPLEVBQ0wsR0FBR0EsTUFERTtBQUVMVSxJQUFBQSxTQUFTLEVBQUUrQixTQUFTLENBQUN6QyxNQUFNLENBQUNVLFNBQVIsQ0FBVCxJQUErQixJQUFJQyxJQUFKLENBQVMsQ0FBVCxDQUZyQztBQUdMO0FBQ0E7QUFDQTFDLElBQUFBLFNBQVMsRUFDUCtCLE1BQU0sSUFBSSxJQUFWLElBQ0FBLE1BQU0sQ0FBQy9CLFNBQVAsSUFBb0IsSUFEcEIsSUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBK0IsSUFBQUEsTUFBTSxDQUFDL0IsU0FBUCxLQUFxQixXQU5yQixHQU9JeUUsU0FQSixHQVFJQyxNQUFNLENBQUMzQyxNQUFNLENBQUMvQixTQUFSO0FBZFAsR0FBUDtBQWdCRDs7QUFFRCxTQUFTd0UsU0FBVCxDQUFtQkcsR0FBbkIsRUFBd0M7QUFDdEMsTUFBSUEsR0FBRyxJQUFJLElBQVgsRUFBaUI7QUFDZixXQUFPLElBQVA7QUFDRDs7QUFDRCxRQUFNQyxJQUFJLEdBQUcsSUFBSWxDLElBQUosQ0FBU2lDLEdBQVQsQ0FBYjtBQUNBLFNBQU9FLEtBQUssQ0FBQ0QsSUFBSSxDQUFDRSxPQUFMLEVBQUQsQ0FBTCxHQUF3QixJQUF4QixHQUErQkYsSUFBdEM7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBwU3RhdGUsXG4gIENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSxcbiAgQ29uc29sZVNlcnZpY2UsXG4gIFNvdXJjZUluZm8sXG4gIE1lc3NhZ2UsXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXG4gIFJlY29yZCxcbiAgUmVjb3JkVG9rZW4sXG4gIFJlZ2lzdGVyRXhlY3V0b3JGdW5jdGlvbixcbiAgU3RvcmUsXG4gIExldmVsLFxufSBmcm9tIFwiLi90eXBlc1wiXG5pbXBvcnQgdHlwZSB7IENyZWF0ZVBhc3RlRnVuY3Rpb24gfSBmcm9tIFwiLi90eXBlc1wiXG5cbi8vIGxvYWQgc3R5bGVzXG5pbXBvcnQgXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aVwiXG5cbmltcG9ydCB7IExpc3QgfSBmcm9tIFwiaW1tdXRhYmxlXCJcbmltcG9ydCB7IGRlc3Ryb3lJdGVtV2hlcmUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9kZXN0cm95SXRlbVdoZXJlXCJcbmltcG9ydCB7IGNvbWJpbmVFcGljc0Zyb21JbXBvcnRzIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2VwaWNIZWxwZXJzXCJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzXCJcbmltcG9ydCB7IGNyZWF0ZUVwaWNNaWRkbGV3YXJlIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL3JlZHV4LW9ic2VydmFibGVcIlxuaW1wb3J0IHsgb2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbiB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9ldmVudFwiXG5pbXBvcnQgZmVhdHVyZUNvbmZpZyBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9mZWF0dXJlLWNvbmZpZ1wiXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZVwiXG5pbXBvcnQgKiBhcyBBY3Rpb25zIGZyb20gXCIuL3JlZHV4L0FjdGlvbnNcIlxuaW1wb3J0ICogYXMgRXBpY3MgZnJvbSBcIi4vcmVkdXgvRXBpY3NcIlxuaW1wb3J0IFJlZHVjZXJzIGZyb20gXCIuL3JlZHV4L1JlZHVjZXJzXCJcbmltcG9ydCB7IENvbnNvbGUsIFdPUktTUEFDRV9WSUVXX1VSSSB9IGZyb20gXCIuL3VpL0NvbnNvbGVcIlxuaW1wb3J0IGludmFyaWFudCBmcm9tIFwiYXNzZXJ0XCJcbmltcG9ydCB7IGFwcGx5TWlkZGxld2FyZSwgY3JlYXRlU3RvcmUgfSBmcm9tIFwicmVkdXhcIlxuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSBcIm51bGx0aHJvd3NcIlxuaW1wb3J0IHV1aWQgZnJvbSBcInV1aWRcIlxuXG5jb25zdCBNQVhJTVVNX1NFUklBTElaRURfTUVTU0FHRVNfQ09ORklHID0gXCJhdG9tLWlkZS1jb25zb2xlLm1heGltdW1TZXJpYWxpemVkTWVzc2FnZXNcIlxuY29uc3QgTUFYSU1VTV9TRVJJQUxJWkVEX0hJU1RPUllfQ09ORklHID0gXCJhdG9tLWlkZS1jb25zb2xlLm1heGltdW1TZXJpYWxpemVkSGlzdG9yeVwiXG5cbmxldCBfZGlzcG9zYWJsZXM6IFVuaXZlcnNhbERpc3Bvc2FibGVcbmxldCBfcmF3U3RhdGU6ID9PYmplY3RcbmxldCBfc3RvcmU6IFN0b3JlXG5sZXQgX25leHRNZXNzYWdlSWQ6IG51bWJlclxuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUocmF3U3RhdGU6ID9PYmplY3QpIHtcbiAgX3Jhd1N0YXRlID0gcmF3U3RhdGVcbiAgX25leHRNZXNzYWdlSWQgPSAwXG4gIF9kaXNwb3NhYmxlcyA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKFxuICAgIGF0b20uY29udGV4dE1lbnUuYWRkKHtcbiAgICAgIFwiLmNvbnNvbGUtcmVjb3JkXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiBcIkNvcHkgTWVzc2FnZVwiLFxuICAgICAgICAgIGNvbW1hbmQ6IFwiY29uc29sZTpjb3B5LW1lc3NhZ2VcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoXCIuY29uc29sZS1yZWNvcmRcIiwgXCJjb25zb2xlOmNvcHktbWVzc2FnZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGVsID0gZXZlbnQudGFyZ2V0XG4gICAgICAvLyAkRmxvd0ZpeE1lKD49MC42OC4wKSBGbG93IHN1cHByZXNzIChUMjcxODc4NTcpXG4gICAgICBpZiAoZWwgPT0gbnVsbCB8fCB0eXBlb2YgZWwuaW5uZXJUZXh0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoZWwuaW5uZXJUZXh0KVxuICAgIH0pLFxuICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb25zb2xlOmNsZWFyXCIsICgpID0+IF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuY2xlYXJSZWNvcmRzKCkpKSxcbiAgICBmZWF0dXJlQ29uZmlnLm9ic2VydmUoXCJhdG9tLWlkZS1jb25zb2xlLm1heGltdW1NZXNzYWdlQ291bnRcIiwgKG1heE1lc3NhZ2VDb3VudDogYW55KSA9PiB7XG4gICAgICBfZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldE1heE1lc3NhZ2VDb3VudChtYXhNZXNzYWdlQ291bnQpKVxuICAgIH0pLFxuICAgIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgIG9ic2VydmFibGVGcm9tU3Vic2NyaWJlRnVuY3Rpb24oKGNiKSA9PiBhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIGNiKSksXG4gICAgICBmZWF0dXJlQ29uZmlnLm9ic2VydmVBc1N0cmVhbShcImF0b20taWRlLWNvbnNvbGUuZm9udFNjYWxlXCIpLFxuICAgICAgKGZvbnRTaXplLCBmb250U2NhbGUpID0+IGZvbnRTaXplICogcGFyc2VGbG9hdChmb250U2NhbGUpXG4gICAgKVxuICAgICAgLm1hcChBY3Rpb25zLnNldEZvbnRTaXplKVxuICAgICAgLnN1YnNjcmliZShfc3RvcmUuZGlzcGF0Y2gpLFxuICAgIF9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIoKVxuICApXG59XG5cbmZ1bmN0aW9uIF9nZXRTdG9yZSgpOiBTdG9yZSB7XG4gIGlmIChfc3RvcmUgPT0gbnVsbCkge1xuICAgIGNvbnN0IGluaXRpYWxTdGF0ZSA9IGRlc2VyaWFsaXplQXBwU3RhdGUoX3Jhd1N0YXRlKVxuICAgIGNvbnN0IHJvb3RFcGljID0gY29tYmluZUVwaWNzRnJvbUltcG9ydHMoRXBpY3MsIFwiYXRvbS1pZGUtdWlcIilcbiAgICBfc3RvcmUgPSBjcmVhdGVTdG9yZShSZWR1Y2VycywgaW5pdGlhbFN0YXRlLCBhcHBseU1pZGRsZXdhcmUoY3JlYXRlRXBpY01pZGRsZXdhcmUocm9vdEVwaWMpKSlcbiAgfVxuICByZXR1cm4gX3N0b3JlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xuICBfZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lVG9vbEJhcihnZXRUb29sQmFyOiB0b29sYmFyJEdldFRvb2xiYXIpOiB2b2lkIHtcbiAgY29uc3QgdG9vbEJhciA9IGdldFRvb2xCYXIoXCJudWNsaWRlLWNvbnNvbGVcIilcbiAgdG9vbEJhci5hZGRCdXR0b24oe1xuICAgIGljb246IFwibnVjbGljb24tY29uc29sZVwiLFxuICAgIGNhbGxiYWNrOiBcImNvbnNvbGU6dG9nZ2xlXCIsXG4gICAgdG9vbHRpcDogXCJUb2dnbGUgQ29uc29sZVwiLFxuICAgIHByaW9yaXR5OiA3MDAsXG4gIH0pXG4gIF9kaXNwb3NhYmxlcy5hZGQoKCkgPT4ge1xuICAgIHRvb2xCYXIucmVtb3ZlSXRlbXMoKVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVBhc3RlUHJvdmlkZXIocHJvdmlkZXI6IGFueSk6IElEaXNwb3NhYmxlIHtcbiAgY29uc3QgY3JlYXRlUGFzdGU6IENyZWF0ZVBhc3RlRnVuY3Rpb24gPSBwcm92aWRlci5jcmVhdGVQYXN0ZVxuICBfZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldENyZWF0ZVBhc3RlRnVuY3Rpb24oY3JlYXRlUGFzdGUpKVxuICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgIGlmIChfZ2V0U3RvcmUoKS5nZXRTdGF0ZSgpLmNyZWF0ZVBhc3RlRnVuY3Rpb24gPT09IGNyZWF0ZVBhc3RlKSB7XG4gICAgICBfZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldENyZWF0ZVBhc3RlRnVuY3Rpb24obnVsbCkpXG4gICAgfVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVdhdGNoRWRpdG9yKHdhdGNoRWRpdG9yOiBhdG9tJEF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yKTogSURpc3Bvc2FibGUge1xuICBfZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldFdhdGNoRWRpdG9yKHdhdGNoRWRpdG9yKSlcbiAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCgpID0+IHtcbiAgICBpZiAoX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS53YXRjaEVkaXRvciA9PT0gd2F0Y2hFZGl0b3IpIHtcbiAgICAgIF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0V2F0Y2hFZGl0b3IobnVsbCkpXG4gICAgfVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUF1dG9jb21wbGV0ZSgpOiBhdG9tJEF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcbiAgY29uc3QgYWN0aXZhdGlvbiA9IHRoaXNcbiAgcmV0dXJuIHtcbiAgICBsYWJlbHM6IFtcIm51Y2xpZGUtY29uc29sZVwiXSxcbiAgICBzZWxlY3RvcjogXCIqXCIsXG4gICAgLy8gQ29waWVzIENocm9tZSBkZXZ0b29scyBhbmQgcHV0cyBoaXN0b3J5IHN1Z2dlc3Rpb25zIGF0IHRoZSBib3R0b20uXG4gICAgc3VnZ2VzdGlvblByaW9yaXR5OiAtMSxcbiAgICBhc3luYyBnZXRTdWdnZXN0aW9ucyhyZXF1ZXN0KSB7XG4gICAgICAvLyBIaXN0b3J5IHByb3ZpZGVzIHN1Z2dlc3Rpb24gb25seSBvbiBleGFjdCBtYXRjaCB0byBjdXJyZW50IGlucHV0LlxuICAgICAgY29uc3QgcHJlZml4ID0gcmVxdWVzdC5lZGl0b3IuZ2V0VGV4dCgpXG4gICAgICBjb25zdCBoaXN0b3J5ID0gYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5nZXRTdGF0ZSgpLmhpc3RvcnlcbiAgICAgIC8vIFVzZSBhIHNldCB0byByZW1vdmUgZHVwbGljYXRlcy5cbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KGhpc3RvcnkpXG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShzZWVuKVxuICAgICAgICAuZmlsdGVyKCh0ZXh0KSA9PiB0ZXh0LnN0YXJ0c1dpdGgocHJlZml4KSlcbiAgICAgICAgLm1hcCgodGV4dCkgPT4gKHsgdGV4dCwgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeCB9KSlcbiAgICB9LFxuICB9XG59XG5cbmZ1bmN0aW9uIF9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIoKTogVW5pdmVyc2FsRGlzcG9zYWJsZSB7XG4gIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZShcbiAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaSkgPT4ge1xuICAgICAgaWYgKHVyaSA9PT0gV09SS1NQQUNFX1ZJRVdfVVJJKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29uc29sZSh7IHN0b3JlOiBfZ2V0U3RvcmUoKSB9KVxuICAgICAgfVxuICAgIH0pLFxuICAgICgpID0+IGRlc3Ryb3lJdGVtV2hlcmUoKGl0ZW0pID0+IGl0ZW0gaW5zdGFuY2VvZiBDb25zb2xlKSxcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwiY29uc29sZTp0b2dnbGVcIiwgKCkgPT4ge1xuICAgICAgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKFdPUktTUEFDRV9WSUVXX1VSSSlcbiAgICB9KVxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNlcmlhbGl6ZUNvbnNvbGUoc3RhdGU6IENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSk6IENvbnNvbGUge1xuICByZXR1cm4gbmV3IENvbnNvbGUoe1xuICAgIHN0b3JlOiBfZ2V0U3RvcmUoKSxcbiAgICBpbml0aWFsRmlsdGVyVGV4dDogc3RhdGUuZmlsdGVyVGV4dCxcbiAgICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyOiBzdGF0ZS5lbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzOiBuZXcgU2V0KHN0YXRlLnVuc2VsZWN0ZWRTZXZlcml0aWVzIHx8IFtdKSxcbiAgfSlcbn1cblxuLyoqXG4gKiBUaGlzIHNlcnZpY2UgcHJvdmlkZXMgYSBmYWN0b3J5IGZvciBjcmVhdGluZyBhIGNvbnNvbGUgb2JqZWN0IHRpZWQgdG8gYSBwYXJ0aWN1bGFyIHNvdXJjZS4gSWZcbiAqIHRoZSBjb25zdW1lciB3YW50cyB0byBleHBvc2Ugc3RhcnRpbmcgYW5kIHN0b3BwaW5nIGZ1bmN0aW9uYWxpdHkgdGhyb3VnaCB0aGUgQ29uc29sZSBVSSAoZm9yXG4gKiBleGFtcGxlLCB0byBhbGxvdyB0aGUgdXNlciB0byBkZWNpZGUgd2hlbiB0byBzdGFydCBhbmQgc3RvcCB0YWlsaW5nIGxvZ3MpLCB0aGV5IGNhbiBpbmNsdWRlXG4gKiBgc3RhcnQoKWAgYW5kIGBzdG9wKClgIGZ1bmN0aW9ucyBvbiB0aGUgb2JqZWN0IHRoZXkgcGFzcyB0byB0aGUgZmFjdG9yeS5cbiAqXG4gKiBXaGVuIHRoZSBmYWN0b3J5IGlzIGludm9rZWQsIHRoZSBzb3VyY2Ugd2lsbCBiZSBhZGRlZCB0byB0aGUgQ29uc29sZSBVSSdzIGZpbHRlciBsaXN0LiBUaGVcbiAqIGZhY3RvcnkgcmV0dXJucyBhIERpc3Bvc2FibGUgd2hpY2ggc2hvdWxkIGJlIGRpc3Bvc2VkIG9mIHdoZW4gdGhlIHNvdXJjZSBnb2VzIGF3YXkgKGUuZy4gaXRzXG4gKiBwYWNrYWdlIGlzIGRpc2FibGVkKS4gVGhpcyB3aWxsIHJlbW92ZSB0aGUgc291cmNlIGZyb20gdGhlIENvbnNvbGUgVUkncyBmaWx0ZXIgbGlzdCAoYXMgbG9uZyBhc1xuICogdGhlcmUgYXJlbid0IGFueSByZW1haW5pbmcgbWVzc2FnZXMgZnJvbSB0aGUgc291cmNlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVDb25zb2xlKCk6IENvbnNvbGVTZXJ2aWNlIHtcbiAgLy8gQ3JlYXRlIGEgbG9jYWwsIG51bGxhYmxlIHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzZXJ2aWNlIGNvbnN1bWVycyBkb24ndCBrZWVwIHRoZSBBY3RpdmF0aW9uXG4gIC8vIGluc3RhbmNlIGluIG1lbW9yeS5cbiAgbGV0IGFjdGl2YXRpb24gPSB0aGlzXG4gIF9kaXNwb3NhYmxlcy5hZGQoKCkgPT4ge1xuICAgIGFjdGl2YXRpb24gPSBudWxsXG4gIH0pXG5cbiAgLy8gQ3JlYXRlcyBhbiBvYmpldCB3aXRoIGNhbGxiYWNrcyB0byByZXF1ZXN0IG1hbmlwdWxhdGlvbnMgb24gdGhlIGN1cnJlbnRcbiAgLy8gY29uc29sZSBtZXNzYWdlIGVudHJ5LlxuICBjb25zdCBjcmVhdGVUb2tlbiA9IChtZXNzYWdlSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGZpbmRNZXNzYWdlID0gKCkgPT4ge1xuICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbClcbiAgICAgIHJldHVybiBudWxsdGhyb3dzKFxuICAgICAgICBhY3RpdmF0aW9uXG4gICAgICAgICAgLl9nZXRTdG9yZSgpXG4gICAgICAgICAgLmdldFN0YXRlKClcbiAgICAgICAgICAuaW5jb21wbGV0ZVJlY29yZHMuZmluZCgocikgPT4gci5tZXNzYWdlSWQgPT09IG1lc3NhZ2VJZClcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICAvLyBNZXNzYWdlIG5lZWRzIHRvIGJlIGxvb2tlZCB1cCBsYXppbHkgYXQgY2FsbCB0aW1lIHJhdGhlciB0aGFuXG4gICAgICAvLyBjYWNoZWQgaW4gdGhpcyBvYmplY3QgdG8gYXZvaWQgcmVxdWlyaW5nIHRoZSB1cGRhdGUgYWN0aW9uIHRvXG4gICAgICAvLyBvcGVyYXRlIHN5bmNocm9ub3VzbHkuIFdoZW4gd2UgYXBwZW5kIHRleHQsIHdlIGRvbid0IGtub3cgdGhlXG4gICAgICAvLyBmdWxsIG5ldyB0ZXh0IHdpdGhvdXQgbG9va2luZyB1cCB0aGUgbmV3IG1lc3NhZ2Ugb2JqZWN0IGluIHRoZVxuICAgICAgLy8gbmV3IHN0b3JlIHN0YXRlIGFmdGVyIHRoZSBtdXRhdGlvbi5cbiAgICAgIGdldEN1cnJlbnRUZXh0OiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBmaW5kTWVzc2FnZSgpLnRleHRcbiAgICAgIH0sXG4gICAgICBnZXRDdXJyZW50TGV2ZWw6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGZpbmRNZXNzYWdlKCkubGV2ZWxcbiAgICAgIH0sXG4gICAgICBzZXRMZXZlbDogKG5ld0xldmVsOiBMZXZlbCkgPT4ge1xuICAgICAgICByZXR1cm4gdXBkYXRlTWVzc2FnZShtZXNzYWdlSWQsIG51bGwsIG5ld0xldmVsLCBmYWxzZSlcbiAgICAgIH0sXG4gICAgICBhcHBlbmRUZXh0OiAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgdGV4dCwgbnVsbCwgZmFsc2UpXG4gICAgICB9LFxuICAgICAgc2V0Q29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgdXBkYXRlTWVzc2FnZShtZXNzYWdlSWQsIG51bGwsIG51bGwsIHRydWUpXG4gICAgICB9LFxuICAgIH0pXG4gIH1cblxuICBjb25zdCB1cGRhdGVNZXNzYWdlID0gKG1lc3NhZ2VJZDogc3RyaW5nLCBhcHBlbmRUZXh0OiA/c3RyaW5nLCBvdmVycmlkZUxldmVsOiA/TGV2ZWwsIHNldENvbXBsZXRlOiBib29sZWFuKSA9PiB7XG4gICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbClcbiAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVjb3JkVXBkYXRlZChtZXNzYWdlSWQsIGFwcGVuZFRleHQsIG92ZXJyaWRlTGV2ZWwsIHNldENvbXBsZXRlKSlcbiAgICByZXR1cm4gY3JlYXRlVG9rZW4obWVzc2FnZUlkKVxuICB9XG5cbiAgcmV0dXJuIChzb3VyY2VJbmZvOiBTb3VyY2VJbmZvKSA9PiB7XG4gICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbClcbiAgICBsZXQgZGlzcG9zZWRcbiAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVnaXN0ZXJTb3VyY2Uoc291cmNlSW5mbykpXG4gICAgY29uc3QgY29uc29sZSA9IHtcbiAgICAgIC8vIFRPRE86IFVwZGF0ZSB0aGVzZSB0byBiZSAob2JqZWN0OiBhbnksIC4uLm9iamVjdHM6IEFycmF5PGFueT4pOiB2b2lkLlxuICAgICAgbG9nKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHsgdGV4dDogb2JqZWN0LCBsZXZlbDogXCJsb2dcIiB9KVxuICAgICAgfSxcbiAgICAgIHdhcm4ob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoeyB0ZXh0OiBvYmplY3QsIGxldmVsOiBcIndhcm5pbmdcIiB9KVxuICAgICAgfSxcbiAgICAgIGVycm9yKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHsgdGV4dDogb2JqZWN0LCBsZXZlbDogXCJlcnJvclwiIH0pXG4gICAgICB9LFxuICAgICAgaW5mbyhvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7IHRleHQ6IG9iamVjdCwgbGV2ZWw6IFwiaW5mb1wiIH0pXG4gICAgICB9LFxuICAgICAgc3VjY2VzcyhvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7IHRleHQ6IG9iamVjdCwgbGV2ZWw6IFwic3VjY2Vzc1wiIH0pXG4gICAgICB9LFxuICAgICAgYXBwZW5kKG1lc3NhZ2U6IE1lc3NhZ2UpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsICYmICFkaXNwb3NlZClcbiAgICAgICAgY29uc3QgaW5jb21wbGV0ZSA9IEJvb2xlYW4obWVzc2FnZS5pbmNvbXBsZXRlKVxuICAgICAgICBjb25zdCByZWNvcmQ6IFJlY29yZCA9IHtcbiAgICAgICAgICAvLyBBIHVuaXF1ZSBtZXNzYWdlIElEIGlzIG5vdCByZXF1aXJlZCBmb3IgY29tcGxldGUgbWVzc2FnZXMsXG4gICAgICAgICAgLy8gc2luY2UgdGhleSBjYW5ub3QgYmUgdXBkYXRlZCB0aGV5IGRvbid0IG5lZWQgdG8gYmUgZm91bmQgbGF0ZXIuXG4gICAgICAgICAgdGV4dDogbWVzc2FnZS50ZXh0LFxuICAgICAgICAgIGxldmVsOiBtZXNzYWdlLmxldmVsLFxuICAgICAgICAgIGZvcm1hdDogbWVzc2FnZS5mb3JtYXQsXG4gICAgICAgICAgZXhwcmVzc2lvbnM6IG1lc3NhZ2UuZXhwcmVzc2lvbnMsXG4gICAgICAgICAgdGFnczogbWVzc2FnZS50YWdzLFxuICAgICAgICAgIHNjb3BlTmFtZTogbWVzc2FnZS5zY29wZU5hbWUsXG4gICAgICAgICAgc291cmNlSWQ6IHNvdXJjZUluZm8uaWQsXG4gICAgICAgICAgc291cmNlTmFtZTogc291cmNlSW5mby5uYW1lLFxuICAgICAgICAgIGtpbmQ6IG1lc3NhZ2Uua2luZCB8fCBcIm1lc3NhZ2VcIixcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksIC8vIFRPRE86IEFsbG93IHRoaXMgdG8gY29tZSB3aXRoIHRoZSBtZXNzYWdlP1xuICAgICAgICAgIHJlcGVhdENvdW50OiAxLFxuICAgICAgICAgIGluY29tcGxldGUsXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdG9rZW4gPSBudWxsXG4gICAgICAgIGlmIChpbmNvbXBsZXRlKSB7XG4gICAgICAgICAgLy8gQW4gSUQgaXMgb25seSByZXF1aXJlZCBmb3IgaW5jb21wbGV0ZSBtZXNzYWdlcywgd2hpY2ggbmVlZFxuICAgICAgICAgIC8vIHRvIGJlIGxvb2tlZCB1cCBmb3IgbXV0YXRpb25zLlxuICAgICAgICAgIHJlY29yZC5tZXNzYWdlSWQgPSB1dWlkLnY0KClcbiAgICAgICAgICB0b2tlbiA9IGNyZWF0ZVRva2VuKHJlY29yZC5tZXNzYWdlSWQpXG4gICAgICAgIH1cblxuICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQocmVjb3JkKSlcbiAgICAgICAgcmV0dXJuIHRva2VuXG4gICAgICB9LFxuICAgICAgc2V0U3RhdHVzKHN0YXR1czogQ29uc29sZVNvdXJjZVN0YXR1cyk6IHZvaWQge1xuICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsICYmICFkaXNwb3NlZClcbiAgICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnVwZGF0ZVN0YXR1cyhzb3VyY2VJbmZvLmlkLCBzdGF0dXMpKVxuICAgICAgfSxcbiAgICAgIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwpXG4gICAgICAgIGlmICghZGlzcG9zZWQpIHtcbiAgICAgICAgICBkaXNwb3NlZCA9IHRydWVcbiAgICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVtb3ZlU291cmNlKHNvdXJjZUluZm8uaWQpKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgICByZXR1cm4gY29uc29sZVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlUmVnaXN0ZXJFeGVjdXRvcigpOiBSZWdpc3RlckV4ZWN1dG9yRnVuY3Rpb24ge1xuICAvLyBDcmVhdGUgYSBsb2NhbCwgbnVsbGFibGUgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHNlcnZpY2UgY29uc3VtZXJzIGRvbid0IGtlZXAgdGhlIEFjdGl2YXRpb25cbiAgLy8gaW5zdGFuY2UgaW4gbWVtb3J5LlxuICBsZXQgYWN0aXZhdGlvbiA9IHRoaXNcbiAgX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgYWN0aXZhdGlvbiA9IG51bGxcbiAgfSlcblxuICByZXR1cm4gKGV4ZWN1dG9yKSA9PiB7XG4gICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCwgXCJFeGVjdXRvciByZWdpc3RyYXRpb24gYXR0ZW1wdGVkIGFmdGVyIGRlYWN0aXZhdGlvblwiKVxuICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWdpc3RlckV4ZWN1dG9yKGV4ZWN1dG9yKSlcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKGFjdGl2YXRpb24gIT0gbnVsbCkge1xuICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMudW5yZWdpc3RlckV4ZWN1dG9yKGV4ZWN1dG9yKSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoKTogT2JqZWN0IHtcbiAgaWYgKF9zdG9yZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHt9XG4gIH1cbiAgY29uc3QgbWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlczogbnVtYmVyID0gKGZlYXR1cmVDb25maWcuZ2V0KE1BWElNVU1fU0VSSUFMSVpFRF9NRVNTQUdFU19DT05GSUcpOiBhbnkpXG4gIGNvbnN0IG1heGltdW1TZXJpYWxpemVkSGlzdG9yeTogbnVtYmVyID0gKGZlYXR1cmVDb25maWcuZ2V0KE1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyk6IGFueSlcbiAgcmV0dXJuIHtcbiAgICByZWNvcmRzOiBfc3RvcmVcbiAgICAgIC5nZXRTdGF0ZSgpXG4gICAgICAucmVjb3Jkcy5zbGljZSgtbWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlcylcbiAgICAgIC50b0FycmF5KClcbiAgICAgIC5tYXAoKHJlY29yZCkgPT4ge1xuICAgICAgICAvLyBgRXhlY3V0b3JgIGlzIG5vdCBzZXJpYWxpemFibGUuIE1ha2Ugc3VyZSB0byByZW1vdmUgaXQgZmlyc3QuXG4gICAgICAgIGNvbnN0IHsgZXhlY3V0b3IsIC4uLnJlc3QgfSA9IHJlY29yZFxuICAgICAgICByZXR1cm4gcmVzdFxuICAgICAgfSksXG4gICAgaGlzdG9yeTogX3N0b3JlLmdldFN0YXRlKCkuaGlzdG9yeS5zbGljZSgtbWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5KSxcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXNlcmlhbGl6ZUFwcFN0YXRlKHJhd1N0YXRlOiA/T2JqZWN0KTogQXBwU3RhdGUge1xuICByZXR1cm4ge1xuICAgIGV4ZWN1dG9yczogbmV3IE1hcCgpLFxuICAgIGNyZWF0ZVBhc3RlRnVuY3Rpb246IG51bGwsXG4gICAgY3VycmVudEV4ZWN1dG9ySWQ6IG51bGwsXG4gICAgcmVjb3JkczogcmF3U3RhdGUgJiYgcmF3U3RhdGUucmVjb3JkcyA/IExpc3QocmF3U3RhdGUucmVjb3Jkcy5tYXAoZGVzZXJpYWxpemVSZWNvcmQpKSA6IExpc3QoKSxcbiAgICBpbmNvbXBsZXRlUmVjb3JkczpcbiAgICAgIHJhd1N0YXRlICYmIHJhd1N0YXRlLmluY29tcGxldGVSZWNvcmRzID8gTGlzdChyYXdTdGF0ZS5pbmNvbXBsZXRlUmVjb3Jkcy5tYXAoZGVzZXJpYWxpemVSZWNvcmQpKSA6IExpc3QoKSxcbiAgICBoaXN0b3J5OiByYXdTdGF0ZSAmJiByYXdTdGF0ZS5oaXN0b3J5ID8gcmF3U3RhdGUuaGlzdG9yeSA6IFtdLFxuICAgIHByb3ZpZGVyczogbmV3IE1hcCgpLFxuICAgIHByb3ZpZGVyU3RhdHVzZXM6IG5ldyBNYXAoKSxcblxuICAgIC8vIFRoaXMgdmFsdWUgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSB2YWx1ZSBmb3JtIHRoZSBjb25maWcuIFdlIGp1c3QgdXNlIGBQT1NJVElWRV9JTkZJTklUWWBcbiAgICAvLyBoZXJlIHRvIGNvbmZvcm0gdG8gdGhlIEFwcFN0YXRlIHR5cGUgZGVmaW50aW9uLlxuICAgIG1heE1lc3NhZ2VDb3VudDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplUmVjb3JkKHJlY29yZDogT2JqZWN0KTogUmVjb3JkIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZWNvcmQsXG4gICAgdGltZXN0YW1wOiBwYXJzZURhdGUocmVjb3JkLnRpbWVzdGFtcCkgfHwgbmV3IERhdGUoMCksXG4gICAgLy8gQXQgb25lIHBvaW50IGluIHRoZSB0aW1lIHRoZSBtZXNzYWdlSWQgd2FzIGEgbnVtYmVyLCBzbyB0aGUgdXNlciBtaWdodFxuICAgIC8vIGhhdmUgYSBudW1iZXIgc2VyaWFsaXplZC5cbiAgICBtZXNzYWdlSWQ6XG4gICAgICByZWNvcmQgPT0gbnVsbCB8fFxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9PSBudWxsIHx8XG4gICAgICAvLyBTaWdoLiBXZSAoSSwgLWplbGRyZWRnZSkgaGFkIGEgYnVnIGF0IG9uZSBwb2ludCB3aGVyZSB3ZSBhY2NpZGVudGFsbHlcbiAgICAgIC8vIGNvbnZlcnRlZCBzZXJpYWxpemVkIHZhbHVlcyBvZiBgdW5kZWZpbmVkYCB0byB0aGUgc3RyaW5nIGBcInVuZGVmaWVuZFwiYC5cbiAgICAgIC8vIFRob3NlIGNvdWxkIHRoZW4gaGF2ZSBiZWVuIHNlcmlhbGl6ZWQgYmFjayB0byBkaXNrLiBTbywgZm9yIGEgbGl0dGxlXG4gICAgICAvLyB3aGlsZSBhdCBsZWFzdCwgd2Ugc2hvdWxkIGVuc3VyZSB3ZSBmaXggdGhlc2UgYmFkIHZhbHVlcy5cbiAgICAgIHJlY29yZC5tZXNzYWdlSWQgPT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiBTdHJpbmcocmVjb3JkLm1lc3NhZ2VJZCksXG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VEYXRlKHJhdzogP3N0cmluZyk6ID9EYXRlIHtcbiAgaWYgKHJhdyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBkYXRlID0gbmV3IERhdGUocmF3KVxuICByZXR1cm4gaXNOYU4oZGF0ZS5nZXRUaW1lKCkpID8gbnVsbCA6IGRhdGVcbn1cbiJdfQ==