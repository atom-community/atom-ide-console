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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyIsIk1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyIsIl9kaXNwb3NhYmxlcyIsIl9yYXdTdGF0ZSIsIl9zdG9yZSIsIl9uZXh0TWVzc2FnZUlkIiwiYWN0aXZhdGUiLCJyYXdTdGF0ZSIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJhdG9tIiwiY29udGV4dE1lbnUiLCJhZGQiLCJsYWJlbCIsImNvbW1hbmQiLCJjb21tYW5kcyIsImV2ZW50IiwiZWwiLCJ0YXJnZXQiLCJpbm5lclRleHQiLCJjbGlwYm9hcmQiLCJ3cml0ZSIsIl9nZXRTdG9yZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsImNsZWFyUmVjb3JkcyIsImZlYXR1cmVDb25maWciLCJvYnNlcnZlIiwibWF4TWVzc2FnZUNvdW50Iiwic2V0TWF4TWVzc2FnZUNvdW50IiwiT2JzZXJ2YWJsZSIsImNvbWJpbmVMYXRlc3QiLCJjYiIsImNvbmZpZyIsIm9ic2VydmVBc1N0cmVhbSIsImZvbnRTaXplIiwiZm9udFNjYWxlIiwicGFyc2VGbG9hdCIsIm1hcCIsInNldEZvbnRTaXplIiwic3Vic2NyaWJlIiwiX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lciIsImluaXRpYWxTdGF0ZSIsImRlc2VyaWFsaXplQXBwU3RhdGUiLCJyb290RXBpYyIsIkVwaWNzIiwiUmVkdWNlcnMiLCJkZWFjdGl2YXRlIiwiZGlzcG9zZSIsImNvbnN1bWVUb29sQmFyIiwiZ2V0VG9vbEJhciIsInRvb2xCYXIiLCJhZGRCdXR0b24iLCJpY29uIiwiY2FsbGJhY2siLCJ0b29sdGlwIiwicHJpb3JpdHkiLCJyZW1vdmVJdGVtcyIsImNvbnN1bWVQYXN0ZVByb3ZpZGVyIiwicHJvdmlkZXIiLCJjcmVhdGVQYXN0ZSIsInNldENyZWF0ZVBhc3RlRnVuY3Rpb24iLCJnZXRTdGF0ZSIsImNyZWF0ZVBhc3RlRnVuY3Rpb24iLCJjb25zdW1lV2F0Y2hFZGl0b3IiLCJ3YXRjaEVkaXRvciIsInNldFdhdGNoRWRpdG9yIiwicHJvdmlkZUF1dG9jb21wbGV0ZSIsImFjdGl2YXRpb24iLCJsYWJlbHMiLCJzZWxlY3RvciIsInN1Z2dlc3Rpb25Qcmlvcml0eSIsImdldFN1Z2dlc3Rpb25zIiwicmVxdWVzdCIsInByZWZpeCIsImVkaXRvciIsImdldFRleHQiLCJoaXN0b3J5Iiwic2VlbiIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsInRleHQiLCJzdGFydHNXaXRoIiwicmVwbGFjZW1lbnRQcmVmaXgiLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJXT1JLU1BBQ0VfVklFV19VUkkiLCJDb25zb2xlIiwic3RvcmUiLCJpdGVtIiwidG9nZ2xlIiwiZGVzZXJpYWxpemVDb25zb2xlIiwic3RhdGUiLCJpbml0aWFsRmlsdGVyVGV4dCIsImZpbHRlclRleHQiLCJpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJ1bnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RlZFNldmVyaXRpZXMiLCJwcm92aWRlQ29uc29sZSIsImNyZWF0ZVRva2VuIiwibWVzc2FnZUlkIiwiZmluZE1lc3NhZ2UiLCJpbmNvbXBsZXRlUmVjb3JkcyIsImZpbmQiLCJyIiwiT2JqZWN0IiwiZnJlZXplIiwiZ2V0Q3VycmVudFRleHQiLCJnZXRDdXJyZW50TGV2ZWwiLCJsZXZlbCIsInNldExldmVsIiwibmV3TGV2ZWwiLCJ1cGRhdGVNZXNzYWdlIiwiYXBwZW5kVGV4dCIsInNldENvbXBsZXRlIiwib3ZlcnJpZGVMZXZlbCIsInJlY29yZFVwZGF0ZWQiLCJzb3VyY2VJbmZvIiwiZGlzcG9zZWQiLCJyZWdpc3RlclNvdXJjZSIsImNvbnNvbGUiLCJsb2ciLCJvYmplY3QiLCJhcHBlbmQiLCJ3YXJuIiwiZXJyb3IiLCJpbmZvIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJpbmNvbXBsZXRlIiwiQm9vbGVhbiIsInJlY29yZCIsImZvcm1hdCIsImV4cHJlc3Npb25zIiwidGFncyIsInNjb3BlTmFtZSIsInNvdXJjZUlkIiwiaWQiLCJzb3VyY2VOYW1lIiwibmFtZSIsImtpbmQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicmVwZWF0Q291bnQiLCJ0b2tlbiIsInV1aWQiLCJ2NCIsInJlY29yZFJlY2VpdmVkIiwic2V0U3RhdHVzIiwic3RhdHVzIiwidXBkYXRlU3RhdHVzIiwicmVtb3ZlU291cmNlIiwicHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IiLCJleGVjdXRvciIsInJlZ2lzdGVyRXhlY3V0b3IiLCJ1bnJlZ2lzdGVyRXhlY3V0b3IiLCJzZXJpYWxpemUiLCJtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzIiwiZ2V0IiwibWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5IiwicmVjb3JkcyIsInNsaWNlIiwidG9BcnJheSIsInJlc3QiLCJleGVjdXRvcnMiLCJNYXAiLCJjdXJyZW50RXhlY3V0b3JJZCIsImRlc2VyaWFsaXplUmVjb3JkIiwicHJvdmlkZXJzIiwicHJvdmlkZXJTdGF0dXNlcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwicGFyc2VEYXRlIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicmF3IiwiZGF0ZSIsImlzTmFOIiwiZ2V0VGltZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFsQkE7QUFvQkEsTUFBTUEsa0NBQWtDLEdBQUcsNENBQTNDO0FBQ0EsTUFBTUMsaUNBQWlDLEdBQUcsMkNBQTFDOztBQUVBLElBQUlDLFlBQUo7O0FBQ0EsSUFBSUMsU0FBSjs7QUFDQSxJQUFJQyxNQUFKOztBQUNBLElBQUlD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QSxnQkFBZ0IsRUFBRSxJQUFJSixHQUFKLEVBVGI7QUFXTDtBQUNBO0FBQ0EvSSxJQUFBQSxlQUFlLEVBQUVvSixNQUFNLENBQUNDO0FBYm5CLEdBQVA7QUFlRDs7QUFFRCxTQUFTSixpQkFBVCxDQUEyQnBDLE1BQTNCLEVBQW1EO0FBQ2pELFNBQU8sRUFDTCxHQUFHQSxNQURFO0FBRUxVLElBQUFBLFNBQVMsRUFBRStCLFNBQVMsQ0FBQ3pDLE1BQU0sQ0FBQ1UsU0FBUixDQUFULElBQStCLElBQUlDLElBQUosQ0FBUyxDQUFULENBRnJDO0FBR0w7QUFDQTtBQUNBMUMsSUFBQUEsU0FBUyxFQUNQK0IsTUFBTSxJQUFJLElBQVYsSUFDQUEsTUFBTSxDQUFDL0IsU0FBUCxJQUFvQixJQURwQixJQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0ErQixJQUFBQSxNQUFNLENBQUMvQixTQUFQLEtBQXFCLFdBTnJCLEdBT0l5RSxTQVBKLEdBUUlDLE1BQU0sQ0FBQzNDLE1BQU0sQ0FBQy9CLFNBQVI7QUFkUCxHQUFQO0FBZ0JEOztBQUVELFNBQVN3RSxTQUFULENBQW1CRyxHQUFuQixFQUF3QztBQUN0QyxNQUFJQSxHQUFHLElBQUksSUFBWCxFQUFpQjtBQUNmLFdBQU8sSUFBUDtBQUNEOztBQUNELFFBQU1DLElBQUksR0FBRyxJQUFJbEMsSUFBSixDQUFTaUMsR0FBVCxDQUFiO0FBQ0EsU0FBT0UsS0FBSyxDQUFDRCxJQUFJLENBQUNFLE9BQUwsRUFBRCxDQUFMLEdBQXdCLElBQXhCLEdBQStCRixJQUF0QztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBcHBTdGF0ZSxcbiAgQ29uc29sZVBlcnNpc3RlZFN0YXRlLFxuICBDb25zb2xlU2VydmljZSxcbiAgU291cmNlSW5mbyxcbiAgTWVzc2FnZSxcbiAgQ29uc29sZVNvdXJjZVN0YXR1cyxcbiAgUmVjb3JkLFxuICBSZWNvcmRUb2tlbixcbiAgUmVnaXN0ZXJFeGVjdXRvckZ1bmN0aW9uLFxuICBTdG9yZSxcbiAgTGV2ZWwsXG59IGZyb20gXCIuL3R5cGVzXCJcbmltcG9ydCB0eXBlIHsgQ3JlYXRlUGFzdGVGdW5jdGlvbiB9IGZyb20gXCIuL3R5cGVzXCJcblxuLy8gbG9hZCBzdHlsZXNcbmltcG9ydCBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpXCJcblxuaW1wb3J0IHsgTGlzdCB9IGZyb20gXCJpbW11dGFibGVcIlxuaW1wb3J0IHsgZGVzdHJveUl0ZW1XaGVyZSB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL2Rlc3Ryb3lJdGVtV2hlcmVcIlxuaW1wb3J0IHsgY29tYmluZUVwaWNzRnJvbUltcG9ydHMgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZXBpY0hlbHBlcnNcIlxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanNcIlxuaW1wb3J0IHsgY3JlYXRlRXBpY01pZGRsZXdhcmUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvcmVkdXgtb2JzZXJ2YWJsZVwiXG5pbXBvcnQgeyBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V2ZW50XCJcbmltcG9ydCBmZWF0dXJlQ29uZmlnIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL2ZlYXR1cmUtY29uZmlnXCJcbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlXCJcbmltcG9ydCAqIGFzIEFjdGlvbnMgZnJvbSBcIi4vcmVkdXgvQWN0aW9uc1wiXG5pbXBvcnQgKiBhcyBFcGljcyBmcm9tIFwiLi9yZWR1eC9FcGljc1wiXG5pbXBvcnQgUmVkdWNlcnMgZnJvbSBcIi4vcmVkdXgvUmVkdWNlcnNcIlxuaW1wb3J0IHsgQ29uc29sZSwgV09SS1NQQUNFX1ZJRVdfVVJJIH0gZnJvbSBcIi4vdWkvQ29uc29sZVwiXG5pbXBvcnQgaW52YXJpYW50IGZyb20gXCJhc3NlcnRcIlxuaW1wb3J0IHsgYXBwbHlNaWRkbGV3YXJlLCBjcmVhdGVTdG9yZSB9IGZyb20gXCJyZWR1eFwiXG5pbXBvcnQgbnVsbHRocm93cyBmcm9tIFwibnVsbHRocm93c1wiXG5pbXBvcnQgdXVpZCBmcm9tIFwidXVpZFwiXG5cbmNvbnN0IE1BWElNVU1fU0VSSUFMSVpFRF9NRVNTQUdFU19DT05GSUcgPSBcImF0b20taWRlLWNvbnNvbGUubWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlc1wiXG5jb25zdCBNQVhJTVVNX1NFUklBTElaRURfSElTVE9SWV9DT05GSUcgPSBcImF0b20taWRlLWNvbnNvbGUubWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5XCJcblxubGV0IF9kaXNwb3NhYmxlczogVW5pdmVyc2FsRGlzcG9zYWJsZVxubGV0IF9yYXdTdGF0ZTogP09iamVjdFxubGV0IF9zdG9yZTogU3RvcmVcbmxldCBfbmV4dE1lc3NhZ2VJZDogbnVtYmVyXG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShyYXdTdGF0ZTogP09iamVjdCkge1xuICBfcmF3U3RhdGUgPSByYXdTdGF0ZVxuICBfbmV4dE1lc3NhZ2VJZCA9IDBcbiAgX2Rpc3Bvc2FibGVzID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoXG4gICAgYXRvbS5jb250ZXh0TWVudS5hZGQoe1xuICAgICAgXCIuY29uc29sZS1yZWNvcmRcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6IFwiQ29weSBNZXNzYWdlXCIsXG4gICAgICAgICAgY29tbWFuZDogXCJjb25zb2xlOmNvcHktbWVzc2FnZVwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KSxcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChcIi5jb25zb2xlLXJlY29yZFwiLCBcImNvbnNvbGU6Y29weS1tZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICAgICAgY29uc3QgZWwgPSBldmVudC50YXJnZXRcbiAgICAgIC8vICRGbG93Rml4TWUoPj0wLjY4LjApIEZsb3cgc3VwcHJlc3MgKFQyNzE4Nzg1NylcbiAgICAgIGlmIChlbCA9PSBudWxsIHx8IHR5cGVvZiBlbC5pbm5lclRleHQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZShlbC5pbm5lclRleHQpXG4gICAgfSksXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcImNvbnNvbGU6Y2xlYXJcIiwgKCkgPT4gX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5jbGVhclJlY29yZHMoKSkpLFxuICAgIGZlYXR1cmVDb25maWcub2JzZXJ2ZShcImF0b20taWRlLWNvbnNvbGUubWF4aW11bU1lc3NhZ2VDb3VudFwiLCAobWF4TWVzc2FnZUNvdW50OiBhbnkpID0+IHtcbiAgICAgIF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0TWF4TWVzc2FnZUNvdW50KG1heE1lc3NhZ2VDb3VudCkpXG4gICAgfSksXG4gICAgT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgb2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbigoY2IpID0+IGF0b20uY29uZmlnLm9ic2VydmUoXCJlZGl0b3IuZm9udFNpemVcIiwgY2IpKSxcbiAgICAgIGZlYXR1cmVDb25maWcub2JzZXJ2ZUFzU3RyZWFtKFwiYXRvbS1pZGUtY29uc29sZS5mb250U2NhbGVcIiksXG4gICAgICAoZm9udFNpemUsIGZvbnRTY2FsZSkgPT4gZm9udFNpemUgKiBwYXJzZUZsb2F0KGZvbnRTY2FsZSlcbiAgICApXG4gICAgICAubWFwKEFjdGlvbnMuc2V0Rm9udFNpemUpXG4gICAgICAuc3Vic2NyaWJlKF9zdG9yZS5kaXNwYXRjaCksXG4gICAgX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lcigpXG4gIClcbn1cblxuZnVuY3Rpb24gX2dldFN0b3JlKCk6IFN0b3JlIHtcbiAgaWYgKF9zdG9yZSA9PSBudWxsKSB7XG4gICAgY29uc3QgaW5pdGlhbFN0YXRlID0gZGVzZXJpYWxpemVBcHBTdGF0ZShfcmF3U3RhdGUpXG4gICAgY29uc3Qgcm9vdEVwaWMgPSBjb21iaW5lRXBpY3NGcm9tSW1wb3J0cyhFcGljcywgXCJhdG9tLWlkZS11aVwiKVxuICAgIF9zdG9yZSA9IGNyZWF0ZVN0b3JlKFJlZHVjZXJzLCBpbml0aWFsU3RhdGUsIGFwcGx5TWlkZGxld2FyZShjcmVhdGVFcGljTWlkZGxld2FyZShyb290RXBpYykpKVxuICB9XG4gIHJldHVybiBfc3RvcmVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIF9kaXNwb3NhYmxlcy5kaXNwb3NlKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVUb29sQmFyKGdldFRvb2xCYXI6IHRvb2xiYXIkR2V0VG9vbGJhcik6IHZvaWQge1xuICBjb25zdCB0b29sQmFyID0gZ2V0VG9vbEJhcihcIm51Y2xpZGUtY29uc29sZVwiKVxuICB0b29sQmFyLmFkZEJ1dHRvbih7XG4gICAgaWNvbjogXCJudWNsaWNvbi1jb25zb2xlXCIsXG4gICAgY2FsbGJhY2s6IFwiY29uc29sZTp0b2dnbGVcIixcbiAgICB0b29sdGlwOiBcIlRvZ2dsZSBDb25zb2xlXCIsXG4gICAgcHJpb3JpdHk6IDcwMCxcbiAgfSlcbiAgX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgdG9vbEJhci5yZW1vdmVJdGVtcygpXG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lUGFzdGVQcm92aWRlcihwcm92aWRlcjogYW55KTogSURpc3Bvc2FibGUge1xuICBjb25zdCBjcmVhdGVQYXN0ZTogQ3JlYXRlUGFzdGVGdW5jdGlvbiA9IHByb3ZpZGVyLmNyZWF0ZVBhc3RlXG4gIF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0Q3JlYXRlUGFzdGVGdW5jdGlvbihjcmVhdGVQYXN0ZSkpXG4gIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgaWYgKF9nZXRTdG9yZSgpLmdldFN0YXRlKCkuY3JlYXRlUGFzdGVGdW5jdGlvbiA9PT0gY3JlYXRlUGFzdGUpIHtcbiAgICAgIF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0Q3JlYXRlUGFzdGVGdW5jdGlvbihudWxsKSlcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lV2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3I6IGF0b20kQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IpOiBJRGlzcG9zYWJsZSB7XG4gIF9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0V2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3IpKVxuICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgIGlmIChfZ2V0U3RvcmUoKS5nZXRTdGF0ZSgpLndhdGNoRWRpdG9yID09PSB3YXRjaEVkaXRvcikge1xuICAgICAgX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5zZXRXYXRjaEVkaXRvcihudWxsKSlcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlQXV0b2NvbXBsZXRlKCk6IGF0b20kQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICBjb25zdCBhY3RpdmF0aW9uID0gdGhpc1xuICByZXR1cm4ge1xuICAgIGxhYmVsczogW1wibnVjbGlkZS1jb25zb2xlXCJdLFxuICAgIHNlbGVjdG9yOiBcIipcIixcbiAgICAvLyBDb3BpZXMgQ2hyb21lIGRldnRvb2xzIGFuZCBwdXRzIGhpc3Rvcnkgc3VnZ2VzdGlvbnMgYXQgdGhlIGJvdHRvbS5cbiAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IC0xLFxuICAgIGFzeW5jIGdldFN1Z2dlc3Rpb25zKHJlcXVlc3QpIHtcbiAgICAgIC8vIEhpc3RvcnkgcHJvdmlkZXMgc3VnZ2VzdGlvbiBvbmx5IG9uIGV4YWN0IG1hdGNoIHRvIGN1cnJlbnQgaW5wdXQuXG4gICAgICBjb25zdCBwcmVmaXggPSByZXF1ZXN0LmVkaXRvci5nZXRUZXh0KClcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmdldFN0YXRlKCkuaGlzdG9yeVxuICAgICAgLy8gVXNlIGEgc2V0IHRvIHJlbW92ZSBkdXBsaWNhdGVzLlxuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoaGlzdG9yeSlcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHNlZW4pXG4gICAgICAgIC5maWx0ZXIoKHRleHQpID0+IHRleHQuc3RhcnRzV2l0aChwcmVmaXgpKVxuICAgICAgICAubWFwKCh0ZXh0KSA9PiAoeyB0ZXh0LCByZXBsYWNlbWVudFByZWZpeDogcHJlZml4IH0pKVxuICAgIH0sXG4gIH1cbn1cblxuZnVuY3Rpb24gX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lcigpOiBVbml2ZXJzYWxEaXNwb3NhYmxlIHtcbiAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKFxuICAgIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpKSA9PiB7XG4gICAgICBpZiAodXJpID09PSBXT1JLU1BBQ0VfVklFV19VUkkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zb2xlKHsgc3RvcmU6IF9nZXRTdG9yZSgpIH0pXG4gICAgICB9XG4gICAgfSksXG4gICAgKCkgPT4gZGVzdHJveUl0ZW1XaGVyZSgoaXRlbSkgPT4gaXRlbSBpbnN0YW5jZW9mIENvbnNvbGUpLFxuICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJjb25zb2xlOnRvZ2dsZVwiLCAoKSA9PiB7XG4gICAgICBhdG9tLndvcmtzcGFjZS50b2dnbGUoV09SS1NQQUNFX1ZJRVdfVVJJKVxuICAgIH0pXG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2VyaWFsaXplQ29uc29sZShzdGF0ZTogQ29uc29sZVBlcnNpc3RlZFN0YXRlKTogQ29uc29sZSB7XG4gIHJldHVybiBuZXcgQ29uc29sZSh7XG4gICAgc3RvcmU6IF9nZXRTdG9yZSgpLFxuICAgIGluaXRpYWxGaWx0ZXJUZXh0OiBzdGF0ZS5maWx0ZXJUZXh0LFxuICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI6IHN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkczogc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM6IG5ldyBTZXQoc3RhdGUudW5zZWxlY3RlZFNldmVyaXRpZXMgfHwgW10pLFxuICB9KVxufVxuXG4vKipcbiAqIFRoaXMgc2VydmljZSBwcm92aWRlcyBhIGZhY3RvcnkgZm9yIGNyZWF0aW5nIGEgY29uc29sZSBvYmplY3QgdGllZCB0byBhIHBhcnRpY3VsYXIgc291cmNlLiBJZlxuICogdGhlIGNvbnN1bWVyIHdhbnRzIHRvIGV4cG9zZSBzdGFydGluZyBhbmQgc3RvcHBpbmcgZnVuY3Rpb25hbGl0eSB0aHJvdWdoIHRoZSBDb25zb2xlIFVJIChmb3JcbiAqIGV4YW1wbGUsIHRvIGFsbG93IHRoZSB1c2VyIHRvIGRlY2lkZSB3aGVuIHRvIHN0YXJ0IGFuZCBzdG9wIHRhaWxpbmcgbG9ncyksIHRoZXkgY2FuIGluY2x1ZGVcbiAqIGBzdGFydCgpYCBhbmQgYHN0b3AoKWAgZnVuY3Rpb25zIG9uIHRoZSBvYmplY3QgdGhleSBwYXNzIHRvIHRoZSBmYWN0b3J5LlxuICpcbiAqIFdoZW4gdGhlIGZhY3RvcnkgaXMgaW52b2tlZCwgdGhlIHNvdXJjZSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBDb25zb2xlIFVJJ3MgZmlsdGVyIGxpc3QuIFRoZVxuICogZmFjdG9yeSByZXR1cm5zIGEgRGlzcG9zYWJsZSB3aGljaCBzaG91bGQgYmUgZGlzcG9zZWQgb2Ygd2hlbiB0aGUgc291cmNlIGdvZXMgYXdheSAoZS5nLiBpdHNcbiAqIHBhY2thZ2UgaXMgZGlzYWJsZWQpLiBUaGlzIHdpbGwgcmVtb3ZlIHRoZSBzb3VyY2UgZnJvbSB0aGUgQ29uc29sZSBVSSdzIGZpbHRlciBsaXN0IChhcyBsb25nIGFzXG4gKiB0aGVyZSBhcmVuJ3QgYW55IHJlbWFpbmluZyBtZXNzYWdlcyBmcm9tIHRoZSBzb3VyY2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUNvbnNvbGUoKTogQ29uc29sZVNlcnZpY2Uge1xuICAvLyBDcmVhdGUgYSBsb2NhbCwgbnVsbGFibGUgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHNlcnZpY2UgY29uc3VtZXJzIGRvbid0IGtlZXAgdGhlIEFjdGl2YXRpb25cbiAgLy8gaW5zdGFuY2UgaW4gbWVtb3J5LlxuICBsZXQgYWN0aXZhdGlvbiA9IHRoaXNcbiAgX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgYWN0aXZhdGlvbiA9IG51bGxcbiAgfSlcblxuICAvLyBDcmVhdGVzIGFuIG9iamV0IHdpdGggY2FsbGJhY2tzIHRvIHJlcXVlc3QgbWFuaXB1bGF0aW9ucyBvbiB0aGUgY3VycmVudFxuICAvLyBjb25zb2xlIG1lc3NhZ2UgZW50cnkuXG4gIGNvbnN0IGNyZWF0ZVRva2VuID0gKG1lc3NhZ2VJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgZmluZE1lc3NhZ2UgPSAoKSA9PiB7XG4gICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKVxuICAgICAgcmV0dXJuIG51bGx0aHJvd3MoXG4gICAgICAgIGFjdGl2YXRpb25cbiAgICAgICAgICAuX2dldFN0b3JlKClcbiAgICAgICAgICAuZ2V0U3RhdGUoKVxuICAgICAgICAgIC5pbmNvbXBsZXRlUmVjb3Jkcy5maW5kKChyKSA9PiByLm1lc3NhZ2VJZCA9PT0gbWVzc2FnZUlkKVxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgIC8vIE1lc3NhZ2UgbmVlZHMgdG8gYmUgbG9va2VkIHVwIGxhemlseSBhdCBjYWxsIHRpbWUgcmF0aGVyIHRoYW5cbiAgICAgIC8vIGNhY2hlZCBpbiB0aGlzIG9iamVjdCB0byBhdm9pZCByZXF1aXJpbmcgdGhlIHVwZGF0ZSBhY3Rpb24gdG9cbiAgICAgIC8vIG9wZXJhdGUgc3luY2hyb25vdXNseS4gV2hlbiB3ZSBhcHBlbmQgdGV4dCwgd2UgZG9uJ3Qga25vdyB0aGVcbiAgICAgIC8vIGZ1bGwgbmV3IHRleHQgd2l0aG91dCBsb29raW5nIHVwIHRoZSBuZXcgbWVzc2FnZSBvYmplY3QgaW4gdGhlXG4gICAgICAvLyBuZXcgc3RvcmUgc3RhdGUgYWZ0ZXIgdGhlIG11dGF0aW9uLlxuICAgICAgZ2V0Q3VycmVudFRleHQ6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGZpbmRNZXNzYWdlKCkudGV4dFxuICAgICAgfSxcbiAgICAgIGdldEN1cnJlbnRMZXZlbDogKCkgPT4ge1xuICAgICAgICByZXR1cm4gZmluZE1lc3NhZ2UoKS5sZXZlbFxuICAgICAgfSxcbiAgICAgIHNldExldmVsOiAobmV3TGV2ZWw6IExldmVsKSA9PiB7XG4gICAgICAgIHJldHVybiB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgbnVsbCwgbmV3TGV2ZWwsIGZhbHNlKVxuICAgICAgfSxcbiAgICAgIGFwcGVuZFRleHQ6ICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZUlkLCB0ZXh0LCBudWxsLCBmYWxzZSlcbiAgICAgIH0sXG4gICAgICBzZXRDb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgbnVsbCwgbnVsbCwgdHJ1ZSlcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZU1lc3NhZ2UgPSAobWVzc2FnZUlkOiBzdHJpbmcsIGFwcGVuZFRleHQ6ID9zdHJpbmcsIG92ZXJyaWRlTGV2ZWw6ID9MZXZlbCwgc2V0Q29tcGxldGU6IGJvb2xlYW4pID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKVxuICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWNvcmRVcGRhdGVkKG1lc3NhZ2VJZCwgYXBwZW5kVGV4dCwgb3ZlcnJpZGVMZXZlbCwgc2V0Q29tcGxldGUpKVxuICAgIHJldHVybiBjcmVhdGVUb2tlbihtZXNzYWdlSWQpXG4gIH1cblxuICByZXR1cm4gKHNvdXJjZUluZm86IFNvdXJjZUluZm8pID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKVxuICAgIGxldCBkaXNwb3NlZFxuICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWdpc3RlclNvdXJjZShzb3VyY2VJbmZvKSlcbiAgICBjb25zdCBjb25zb2xlID0ge1xuICAgICAgLy8gVE9ETzogVXBkYXRlIHRoZXNlIHRvIGJlIChvYmplY3Q6IGFueSwgLi4ub2JqZWN0czogQXJyYXk8YW55Pik6IHZvaWQuXG4gICAgICBsb2cob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoeyB0ZXh0OiBvYmplY3QsIGxldmVsOiBcImxvZ1wiIH0pXG4gICAgICB9LFxuICAgICAgd2FybihvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7IHRleHQ6IG9iamVjdCwgbGV2ZWw6IFwid2FybmluZ1wiIH0pXG4gICAgICB9LFxuICAgICAgZXJyb3Iob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoeyB0ZXh0OiBvYmplY3QsIGxldmVsOiBcImVycm9yXCIgfSlcbiAgICAgIH0sXG4gICAgICBpbmZvKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHsgdGV4dDogb2JqZWN0LCBsZXZlbDogXCJpbmZvXCIgfSlcbiAgICAgIH0sXG4gICAgICBzdWNjZXNzKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHsgdGV4dDogb2JqZWN0LCBsZXZlbDogXCJzdWNjZXNzXCIgfSlcbiAgICAgIH0sXG4gICAgICBhcHBlbmQobWVzc2FnZTogTWVzc2FnZSk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwgJiYgIWRpc3Bvc2VkKVxuICAgICAgICBjb25zdCBpbmNvbXBsZXRlID0gQm9vbGVhbihtZXNzYWdlLmluY29tcGxldGUpXG4gICAgICAgIGNvbnN0IHJlY29yZDogUmVjb3JkID0ge1xuICAgICAgICAgIC8vIEEgdW5pcXVlIG1lc3NhZ2UgSUQgaXMgbm90IHJlcXVpcmVkIGZvciBjb21wbGV0ZSBtZXNzYWdlcyxcbiAgICAgICAgICAvLyBzaW5jZSB0aGV5IGNhbm5vdCBiZSB1cGRhdGVkIHRoZXkgZG9uJ3QgbmVlZCB0byBiZSBmb3VuZCBsYXRlci5cbiAgICAgICAgICB0ZXh0OiBtZXNzYWdlLnRleHQsXG4gICAgICAgICAgbGV2ZWw6IG1lc3NhZ2UubGV2ZWwsXG4gICAgICAgICAgZm9ybWF0OiBtZXNzYWdlLmZvcm1hdCxcbiAgICAgICAgICBleHByZXNzaW9uczogbWVzc2FnZS5leHByZXNzaW9ucyxcbiAgICAgICAgICB0YWdzOiBtZXNzYWdlLnRhZ3MsXG4gICAgICAgICAgc2NvcGVOYW1lOiBtZXNzYWdlLnNjb3BlTmFtZSxcbiAgICAgICAgICBzb3VyY2VJZDogc291cmNlSW5mby5pZCxcbiAgICAgICAgICBzb3VyY2VOYW1lOiBzb3VyY2VJbmZvLm5hbWUsXG4gICAgICAgICAga2luZDogbWVzc2FnZS5raW5kIHx8IFwibWVzc2FnZVwiLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSwgLy8gVE9ETzogQWxsb3cgdGhpcyB0byBjb21lIHdpdGggdGhlIG1lc3NhZ2U/XG4gICAgICAgICAgcmVwZWF0Q291bnQ6IDEsXG4gICAgICAgICAgaW5jb21wbGV0ZSxcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0b2tlbiA9IG51bGxcbiAgICAgICAgaWYgKGluY29tcGxldGUpIHtcbiAgICAgICAgICAvLyBBbiBJRCBpcyBvbmx5IHJlcXVpcmVkIGZvciBpbmNvbXBsZXRlIG1lc3NhZ2VzLCB3aGljaCBuZWVkXG4gICAgICAgICAgLy8gdG8gYmUgbG9va2VkIHVwIGZvciBtdXRhdGlvbnMuXG4gICAgICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9IHV1aWQudjQoKVxuICAgICAgICAgIHRva2VuID0gY3JlYXRlVG9rZW4ocmVjb3JkLm1lc3NhZ2VJZClcbiAgICAgICAgfVxuXG4gICAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWNvcmRSZWNlaXZlZChyZWNvcmQpKVxuICAgICAgICByZXR1cm4gdG9rZW5cbiAgICAgIH0sXG4gICAgICBzZXRTdGF0dXMoc3RhdHVzOiBDb25zb2xlU291cmNlU3RhdHVzKTogdm9pZCB7XG4gICAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwgJiYgIWRpc3Bvc2VkKVxuICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMudXBkYXRlU3RhdHVzKHNvdXJjZUluZm8uaWQsIHN0YXR1cykpXG4gICAgICB9LFxuICAgICAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbClcbiAgICAgICAgaWYgKCFkaXNwb3NlZCkge1xuICAgICAgICAgIGRpc3Bvc2VkID0gdHJ1ZVxuICAgICAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZW1vdmVTb3VyY2Uoc291cmNlSW5mby5pZCkpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICAgIHJldHVybiBjb25zb2xlXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVSZWdpc3RlckV4ZWN1dG9yKCk6IFJlZ2lzdGVyRXhlY3V0b3JGdW5jdGlvbiB7XG4gIC8vIENyZWF0ZSBhIGxvY2FsLCBudWxsYWJsZSByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc2VydmljZSBjb25zdW1lcnMgZG9uJ3Qga2VlcCB0aGUgQWN0aXZhdGlvblxuICAvLyBpbnN0YW5jZSBpbiBtZW1vcnkuXG4gIGxldCBhY3RpdmF0aW9uID0gdGhpc1xuICBfZGlzcG9zYWJsZXMuYWRkKCgpID0+IHtcbiAgICBhY3RpdmF0aW9uID0gbnVsbFxuICB9KVxuXG4gIHJldHVybiAoZXhlY3V0b3IpID0+IHtcbiAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsLCBcIkV4ZWN1dG9yIHJlZ2lzdHJhdGlvbiBhdHRlbXB0ZWQgYWZ0ZXIgZGVhY3RpdmF0aW9uXCIpXG4gICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnJlZ2lzdGVyRXhlY3V0b3IoZXhlY3V0b3IpKVxuICAgIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAoYWN0aXZhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy51bnJlZ2lzdGVyRXhlY3V0b3IoZXhlY3V0b3IpKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZSgpOiBPYmplY3Qge1xuICBpZiAoX3N0b3JlID09IG51bGwpIHtcbiAgICByZXR1cm4ge31cbiAgfVxuICBjb25zdCBtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzOiBudW1iZXIgPSAoZmVhdHVyZUNvbmZpZy5nZXQoTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyk6IGFueSlcbiAgY29uc3QgbWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5OiBudW1iZXIgPSAoZmVhdHVyZUNvbmZpZy5nZXQoTUFYSU1VTV9TRVJJQUxJWkVEX0hJU1RPUllfQ09ORklHKTogYW55KVxuICByZXR1cm4ge1xuICAgIHJlY29yZHM6IF9zdG9yZVxuICAgICAgLmdldFN0YXRlKClcbiAgICAgIC5yZWNvcmRzLnNsaWNlKC1tYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzKVxuICAgICAgLnRvQXJyYXkoKVxuICAgICAgLm1hcCgocmVjb3JkKSA9PiB7XG4gICAgICAgIC8vIGBFeGVjdXRvcmAgaXMgbm90IHNlcmlhbGl6YWJsZS4gTWFrZSBzdXJlIHRvIHJlbW92ZSBpdCBmaXJzdC5cbiAgICAgICAgY29uc3QgeyBleGVjdXRvciwgLi4ucmVzdCB9ID0gcmVjb3JkXG4gICAgICAgIHJldHVybiByZXN0XG4gICAgICB9KSxcbiAgICBoaXN0b3J5OiBfc3RvcmUuZ2V0U3RhdGUoKS5oaXN0b3J5LnNsaWNlKC1tYXhpbXVtU2VyaWFsaXplZEhpc3RvcnkpLFxuICB9XG59XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplQXBwU3RhdGUocmF3U3RhdGU6ID9PYmplY3QpOiBBcHBTdGF0ZSB7XG4gIHJldHVybiB7XG4gICAgZXhlY3V0b3JzOiBuZXcgTWFwKCksXG4gICAgY3JlYXRlUGFzdGVGdW5jdGlvbjogbnVsbCxcbiAgICBjdXJyZW50RXhlY3V0b3JJZDogbnVsbCxcbiAgICByZWNvcmRzOiByYXdTdGF0ZSAmJiByYXdTdGF0ZS5yZWNvcmRzID8gTGlzdChyYXdTdGF0ZS5yZWNvcmRzLm1hcChkZXNlcmlhbGl6ZVJlY29yZCkpIDogTGlzdCgpLFxuICAgIGluY29tcGxldGVSZWNvcmRzOlxuICAgICAgcmF3U3RhdGUgJiYgcmF3U3RhdGUuaW5jb21wbGV0ZVJlY29yZHMgPyBMaXN0KHJhd1N0YXRlLmluY29tcGxldGVSZWNvcmRzLm1hcChkZXNlcmlhbGl6ZVJlY29yZCkpIDogTGlzdCgpLFxuICAgIGhpc3Rvcnk6IHJhd1N0YXRlICYmIHJhd1N0YXRlLmhpc3RvcnkgPyByYXdTdGF0ZS5oaXN0b3J5IDogW10sXG4gICAgcHJvdmlkZXJzOiBuZXcgTWFwKCksXG4gICAgcHJvdmlkZXJTdGF0dXNlczogbmV3IE1hcCgpLFxuXG4gICAgLy8gVGhpcyB2YWx1ZSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIHZhbHVlIGZvcm0gdGhlIGNvbmZpZy4gV2UganVzdCB1c2UgYFBPU0lUSVZFX0lORklOSVRZYFxuICAgIC8vIGhlcmUgdG8gY29uZm9ybSB0byB0aGUgQXBwU3RhdGUgdHlwZSBkZWZpbnRpb24uXG4gICAgbWF4TWVzc2FnZUNvdW50OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzZXJpYWxpemVSZWNvcmQocmVjb3JkOiBPYmplY3QpOiBSZWNvcmQge1xuICByZXR1cm4ge1xuICAgIC4uLnJlY29yZCxcbiAgICB0aW1lc3RhbXA6IHBhcnNlRGF0ZShyZWNvcmQudGltZXN0YW1wKSB8fCBuZXcgRGF0ZSgwKSxcbiAgICAvLyBBdCBvbmUgcG9pbnQgaW4gdGhlIHRpbWUgdGhlIG1lc3NhZ2VJZCB3YXMgYSBudW1iZXIsIHNvIHRoZSB1c2VyIG1pZ2h0XG4gICAgLy8gaGF2ZSBhIG51bWJlciBzZXJpYWxpemVkLlxuICAgIG1lc3NhZ2VJZDpcbiAgICAgIHJlY29yZCA9PSBudWxsIHx8XG4gICAgICByZWNvcmQubWVzc2FnZUlkID09IG51bGwgfHxcbiAgICAgIC8vIFNpZ2guIFdlIChJLCAtamVsZHJlZGdlKSBoYWQgYSBidWcgYXQgb25lIHBvaW50IHdoZXJlIHdlIGFjY2lkZW50YWxseVxuICAgICAgLy8gY29udmVydGVkIHNlcmlhbGl6ZWQgdmFsdWVzIG9mIGB1bmRlZmluZWRgIHRvIHRoZSBzdHJpbmcgYFwidW5kZWZpZW5kXCJgLlxuICAgICAgLy8gVGhvc2UgY291bGQgdGhlbiBoYXZlIGJlZW4gc2VyaWFsaXplZCBiYWNrIHRvIGRpc2suIFNvLCBmb3IgYSBsaXR0bGVcbiAgICAgIC8vIHdoaWxlIGF0IGxlYXN0LCB3ZSBzaG91bGQgZW5zdXJlIHdlIGZpeCB0aGVzZSBiYWQgdmFsdWVzLlxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9PT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICA6IFN0cmluZyhyZWNvcmQubWVzc2FnZUlkKSxcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZURhdGUocmF3OiA/c3RyaW5nKTogP0RhdGUge1xuICBpZiAocmF3ID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShyYXcpXG4gIHJldHVybiBpc05hTihkYXRlLmdldFRpbWUoKSkgPyBudWxsIDogZGF0ZVxufVxuIl19