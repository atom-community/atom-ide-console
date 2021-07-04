"use strict";

require("@atom-ide-community/nuclide-commons-ui");

var _immutable = require("immutable");

var _createPackage = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-atom/createPackage"));

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

var _reduxMin = require("redux/dist/redux.min.js");

var _nullthrows = _interopRequireDefault(require("nullthrows"));

var _uuid = _interopRequireDefault(require("uuid"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
// load styles
const MAXIMUM_SERIALIZED_MESSAGES_CONFIG = 'atom-ide-console.maximumSerializedMessages';
const MAXIMUM_SERIALIZED_HISTORY_CONFIG = 'atom-ide-console.maximumSerializedHistory';

class Activation {
  constructor(rawState) {
    this._disposables = void 0;
    this._rawState = void 0;
    this._store = void 0;
    this._nextMessageId = void 0;
    this._rawState = rawState;
    this._nextMessageId = 0;
    this._disposables = new _UniversalDisposable.default(atom.contextMenu.add({
      '.console-record': [{
        label: 'Copy Message',
        command: 'console:copy-message'
      }]
    }), atom.commands.add('.console-record', 'console:copy-message', event => {
      const el = event.target; // $FlowFixMe(>=0.68.0) Flow suppress (T27187857)

      if (el == null || typeof el.innerText !== 'string') {
        return;
      }

      atom.clipboard.write(el.innerText);
    }), atom.commands.add('atom-workspace', 'console:clear', () => this._getStore().dispatch(Actions.clearRecords())), _featureConfig.default.observe('atom-ide-console.maximumMessageCount', maxMessageCount => {
      this._getStore().dispatch(Actions.setMaxMessageCount(maxMessageCount));
    }), _rxjsCompatUmdMin.Observable.combineLatest((0, _event.observableFromSubscribeFunction)(cb => atom.config.observe('editor.fontSize', cb)), _featureConfig.default.observeAsStream('atom-ide-console.fontScale'), (fontSize, fontScale) => fontSize * parseFloat(fontScale)).map(Actions.setFontSize).subscribe(this._store.dispatch), this._registerCommandAndOpener());
  }

  _getStore() {
    if (this._store == null) {
      const initialState = deserializeAppState(this._rawState);
      const rootEpic = (0, _epicHelpers.combineEpicsFromImports)(Epics, 'atom-ide-ui');
      this._store = (0, _reduxMin.createStore)(_Reducers.default, initialState, (0, _reduxMin.applyMiddleware)((0, _reduxObservable.createEpicMiddleware)(rootEpic)));
    }

    return this._store;
  }

  dispose() {
    this._disposables.dispose();
  }

  consumeToolBar(getToolBar) {
    const toolBar = getToolBar('nuclide-console');
    toolBar.addButton({
      icon: 'nuclicon-console',
      callback: 'console:toggle',
      tooltip: 'Toggle Console',
      priority: 700
    });

    this._disposables.add(() => {
      toolBar.removeItems();
    });
  }

  consumePasteProvider(provider) {
    const createPaste = provider.createPaste;

    this._getStore().dispatch(Actions.setCreatePasteFunction(createPaste));

    return new _UniversalDisposable.default(() => {
      if (this._getStore().getState().createPasteFunction === createPaste) {
        this._getStore().dispatch(Actions.setCreatePasteFunction(null));
      }
    });
  }

  consumeWatchEditor(watchEditor) {
    this._getStore().dispatch(Actions.setWatchEditor(watchEditor));

    return new _UniversalDisposable.default(() => {
      if (this._getStore().getState().watchEditor === watchEditor) {
        this._getStore().dispatch(Actions.setWatchEditor(null));
      }
    });
  }

  provideAutocomplete() {
    const activation = this;
    return {
      labels: ['nuclide-console'],
      selector: '*',
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

  _registerCommandAndOpener() {
    return new _UniversalDisposable.default(atom.workspace.addOpener(uri => {
      if (uri === _Console.WORKSPACE_VIEW_URI) {
        return new _Console.Console({
          store: this._getStore()
        });
      }
    }), () => (0, _destroyItemWhere.destroyItemWhere)(item => item instanceof _Console.Console), atom.commands.add('atom-workspace', 'console:toggle', () => {
      atom.workspace.toggle(_Console.WORKSPACE_VIEW_URI);
    }));
  }

  deserializeConsole(state) {
    return new _Console.Console({
      store: this._getStore(),
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


  provideConsole() {
    // Create a local, nullable reference so that the service consumers don't keep the Activation
    // instance in memory.
    let activation = this;

    this._disposables.add(() => {
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
            level: 'log'
          });
        },

        warn(object) {
          return console.append({
            text: object,
            level: 'warning'
          });
        },

        error(object) {
          return console.append({
            text: object,
            level: 'error'
          });
        },

        info(object) {
          return console.append({
            text: object,
            level: 'info'
          });
        },

        success(object) {
          return console.append({
            text: object,
            level: 'success'
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
            kind: message.kind || 'message',
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

  provideRegisterExecutor() {
    // Create a local, nullable reference so that the service consumers don't keep the Activation
    // instance in memory.
    let activation = this;

    this._disposables.add(() => {
      activation = null;
    });

    return executor => {
      (0, _assert.default)(activation != null, 'Executor registration attempted after deactivation');

      activation._getStore().dispatch(Actions.registerExecutor(executor));

      return new _UniversalDisposable.default(() => {
        if (activation != null) {
          activation._getStore().dispatch(Actions.unregisterExecutor(executor));
        }
      });
    };
  }

  serialize() {
    if (this._store == null) {
      return {};
    }

    const maximumSerializedMessages = _featureConfig.default.get(MAXIMUM_SERIALIZED_MESSAGES_CONFIG);

    const maximumSerializedHistory = _featureConfig.default.get(MAXIMUM_SERIALIZED_HISTORY_CONFIG);

    return {
      records: this._store.getState().records.slice(-maximumSerializedMessages).toArray().map(record => {
        // `Executor` is not serializable. Make sure to remove it first.
        const {
          executor,
          ...rest
        } = record;
        return rest;
      }),
      history: this._store.getState().history.slice(-maximumSerializedHistory)
    };
  }

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
    record.messageId === 'undefined' ? undefined : String(record.messageId)
  };
}

function parseDate(raw) {
  if (raw == null) {
    return null;
  }

  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

(0, _createPackage.default)(module.exports, Activation);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyIsIk1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyIsIkFjdGl2YXRpb24iLCJjb25zdHJ1Y3RvciIsInJhd1N0YXRlIiwiX2Rpc3Bvc2FibGVzIiwiX3Jhd1N0YXRlIiwiX3N0b3JlIiwiX25leHRNZXNzYWdlSWQiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYXRvbSIsImNvbnRleHRNZW51IiwiYWRkIiwibGFiZWwiLCJjb21tYW5kIiwiY29tbWFuZHMiLCJldmVudCIsImVsIiwidGFyZ2V0IiwiaW5uZXJUZXh0IiwiY2xpcGJvYXJkIiwid3JpdGUiLCJfZ2V0U3RvcmUiLCJkaXNwYXRjaCIsIkFjdGlvbnMiLCJjbGVhclJlY29yZHMiLCJmZWF0dXJlQ29uZmlnIiwib2JzZXJ2ZSIsIm1heE1lc3NhZ2VDb3VudCIsInNldE1heE1lc3NhZ2VDb3VudCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwiY2IiLCJjb25maWciLCJvYnNlcnZlQXNTdHJlYW0iLCJmb250U2l6ZSIsImZvbnRTY2FsZSIsInBhcnNlRmxvYXQiLCJtYXAiLCJzZXRGb250U2l6ZSIsInN1YnNjcmliZSIsIl9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIiLCJpbml0aWFsU3RhdGUiLCJkZXNlcmlhbGl6ZUFwcFN0YXRlIiwicm9vdEVwaWMiLCJFcGljcyIsIlJlZHVjZXJzIiwiZGlzcG9zZSIsImNvbnN1bWVUb29sQmFyIiwiZ2V0VG9vbEJhciIsInRvb2xCYXIiLCJhZGRCdXR0b24iLCJpY29uIiwiY2FsbGJhY2siLCJ0b29sdGlwIiwicHJpb3JpdHkiLCJyZW1vdmVJdGVtcyIsImNvbnN1bWVQYXN0ZVByb3ZpZGVyIiwicHJvdmlkZXIiLCJjcmVhdGVQYXN0ZSIsInNldENyZWF0ZVBhc3RlRnVuY3Rpb24iLCJnZXRTdGF0ZSIsImNyZWF0ZVBhc3RlRnVuY3Rpb24iLCJjb25zdW1lV2F0Y2hFZGl0b3IiLCJ3YXRjaEVkaXRvciIsInNldFdhdGNoRWRpdG9yIiwicHJvdmlkZUF1dG9jb21wbGV0ZSIsImFjdGl2YXRpb24iLCJsYWJlbHMiLCJzZWxlY3RvciIsInN1Z2dlc3Rpb25Qcmlvcml0eSIsImdldFN1Z2dlc3Rpb25zIiwicmVxdWVzdCIsInByZWZpeCIsImVkaXRvciIsImdldFRleHQiLCJoaXN0b3J5Iiwic2VlbiIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsInRleHQiLCJzdGFydHNXaXRoIiwicmVwbGFjZW1lbnRQcmVmaXgiLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJXT1JLU1BBQ0VfVklFV19VUkkiLCJDb25zb2xlIiwic3RvcmUiLCJpdGVtIiwidG9nZ2xlIiwiZGVzZXJpYWxpemVDb25zb2xlIiwic3RhdGUiLCJpbml0aWFsRmlsdGVyVGV4dCIsImZpbHRlclRleHQiLCJpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJ1bnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RlZFNldmVyaXRpZXMiLCJwcm92aWRlQ29uc29sZSIsImNyZWF0ZVRva2VuIiwibWVzc2FnZUlkIiwiZmluZE1lc3NhZ2UiLCJpbmNvbXBsZXRlUmVjb3JkcyIsImZpbmQiLCJyIiwiT2JqZWN0IiwiZnJlZXplIiwiZ2V0Q3VycmVudFRleHQiLCJnZXRDdXJyZW50TGV2ZWwiLCJsZXZlbCIsInNldExldmVsIiwibmV3TGV2ZWwiLCJ1cGRhdGVNZXNzYWdlIiwiYXBwZW5kVGV4dCIsInNldENvbXBsZXRlIiwib3ZlcnJpZGVMZXZlbCIsInJlY29yZFVwZGF0ZWQiLCJzb3VyY2VJbmZvIiwiZGlzcG9zZWQiLCJyZWdpc3RlclNvdXJjZSIsImNvbnNvbGUiLCJsb2ciLCJvYmplY3QiLCJhcHBlbmQiLCJ3YXJuIiwiZXJyb3IiLCJpbmZvIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJpbmNvbXBsZXRlIiwiQm9vbGVhbiIsInJlY29yZCIsImZvcm1hdCIsImV4cHJlc3Npb25zIiwidGFncyIsInNjb3BlTmFtZSIsInNvdXJjZUlkIiwiaWQiLCJzb3VyY2VOYW1lIiwibmFtZSIsImtpbmQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicmVwZWF0Q291bnQiLCJ0b2tlbiIsInV1aWQiLCJ2NCIsInJlY29yZFJlY2VpdmVkIiwic2V0U3RhdHVzIiwic3RhdHVzIiwidXBkYXRlU3RhdHVzIiwicmVtb3ZlU291cmNlIiwicHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IiLCJleGVjdXRvciIsInJlZ2lzdGVyRXhlY3V0b3IiLCJ1bnJlZ2lzdGVyRXhlY3V0b3IiLCJzZXJpYWxpemUiLCJtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzIiwiZ2V0IiwibWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5IiwicmVjb3JkcyIsInNsaWNlIiwidG9BcnJheSIsInJlc3QiLCJleGVjdXRvcnMiLCJNYXAiLCJjdXJyZW50RXhlY3V0b3JJZCIsImRlc2VyaWFsaXplUmVjb3JkIiwicHJvdmlkZXJzIiwicHJvdmlkZXJTdGF0dXNlcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwicGFyc2VEYXRlIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicmF3IiwiZGF0ZSIsImlzTmFOIiwiZ2V0VGltZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBNEJBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQTlDQTs7Ozs7Ozs7Ozs7QUEyQkE7QUFxQkEsTUFBTUEsa0NBQWtDLEdBQ3RDLDRDQURGO0FBRUEsTUFBTUMsaUNBQWlDLEdBQ3JDLDJDQURGOztBQUdBLE1BQU1DLFVBQU4sQ0FBaUI7QUFNZkMsRUFB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Ny1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQGZsb3dcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEFwcFN0YXRlLFxuICBDb25zb2xlUGVyc2lzdGVkU3RhdGUsXG4gIENvbnNvbGVTZXJ2aWNlLFxuICBTb3VyY2VJbmZvLFxuICBNZXNzYWdlLFxuICBDb25zb2xlU291cmNlU3RhdHVzLFxuICBSZWNvcmQsXG4gIFJlY29yZFRva2VuLFxuICBSZWdpc3RlckV4ZWN1dG9yRnVuY3Rpb24sXG4gIFN0b3JlLFxuICBMZXZlbCxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7Q3JlYXRlUGFzdGVGdW5jdGlvbn0gZnJvbSAnLi90eXBlcyc7XG5cbi8vIGxvYWQgc3R5bGVzXG5pbXBvcnQgXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aVwiXG5cbmltcG9ydCB7TGlzdH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCBjcmVhdGVQYWNrYWdlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vY3JlYXRlUGFja2FnZSc7XG5pbXBvcnQge2Rlc3Ryb3lJdGVtV2hlcmV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vZGVzdHJveUl0ZW1XaGVyZSc7XG5pbXBvcnQge2NvbWJpbmVFcGljc0Zyb21JbXBvcnRzfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9lcGljSGVscGVycyc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5pbXBvcnQge2NyZWF0ZUVwaWNNaWRkbGV3YXJlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9yZWR1eC1vYnNlcnZhYmxlJztcbmltcG9ydCB7b2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZXZlbnQnO1xuaW1wb3J0IGZlYXR1cmVDb25maWcgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9mZWF0dXJlLWNvbmZpZyc7XG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcbmltcG9ydCAqIGFzIEFjdGlvbnMgZnJvbSAnLi9yZWR1eC9BY3Rpb25zJztcbmltcG9ydCAqIGFzIEVwaWNzIGZyb20gJy4vcmVkdXgvRXBpY3MnO1xuaW1wb3J0IFJlZHVjZXJzIGZyb20gJy4vcmVkdXgvUmVkdWNlcnMnO1xuaW1wb3J0IHtDb25zb2xlLCBXT1JLU1BBQ0VfVklFV19VUkl9IGZyb20gJy4vdWkvQ29uc29sZSc7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge2FwcGx5TWlkZGxld2FyZSwgY3JlYXRlU3RvcmV9IGZyb20gJ3JlZHV4L2Rpc3QvcmVkdXgubWluLmpzJztcbmltcG9ydCBudWxsdGhyb3dzIGZyb20gJ251bGx0aHJvd3MnO1xuaW1wb3J0IHV1aWQgZnJvbSAndXVpZCc7XG5cbmNvbnN0IE1BWElNVU1fU0VSSUFMSVpFRF9NRVNTQUdFU19DT05GSUcgPVxuICAnYXRvbS1pZGUtY29uc29sZS5tYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzJztcbmNvbnN0IE1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyA9XG4gICdhdG9tLWlkZS1jb25zb2xlLm1heGltdW1TZXJpYWxpemVkSGlzdG9yeSc7XG5cbmNsYXNzIEFjdGl2YXRpb24ge1xuICBfZGlzcG9zYWJsZXM6IFVuaXZlcnNhbERpc3Bvc2FibGU7XG4gIF9yYXdTdGF0ZTogP09iamVjdDtcbiAgX3N0b3JlOiBTdG9yZTtcbiAgX25leHRNZXNzYWdlSWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihyYXdTdGF0ZTogP09iamVjdCkge1xuICAgIHRoaXMuX3Jhd1N0YXRlID0gcmF3U3RhdGU7XG4gICAgdGhpcy5fbmV4dE1lc3NhZ2VJZCA9IDA7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZShcbiAgICAgIGF0b20uY29udGV4dE1lbnUuYWRkKHtcbiAgICAgICAgJy5jb25zb2xlLXJlY29yZCc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0NvcHkgTWVzc2FnZScsXG4gICAgICAgICAgICBjb21tYW5kOiAnY29uc29sZTpjb3B5LW1lc3NhZ2UnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCcuY29uc29sZS1yZWNvcmQnLCAnY29uc29sZTpjb3B5LW1lc3NhZ2UnLCBldmVudCA9PiB7XG4gICAgICAgIGNvbnN0IGVsID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAvLyAkRmxvd0ZpeE1lKD49MC42OC4wKSBGbG93IHN1cHByZXNzIChUMjcxODc4NTcpXG4gICAgICAgIGlmIChlbCA9PSBudWxsIHx8IHR5cGVvZiBlbC5pbm5lclRleHQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGVsLmlubmVyVGV4dCk7XG4gICAgICB9KSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdjb25zb2xlOmNsZWFyJywgKCkgPT5cbiAgICAgICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLmNsZWFyUmVjb3JkcygpKSxcbiAgICAgICksXG4gICAgICBmZWF0dXJlQ29uZmlnLm9ic2VydmUoXG4gICAgICAgICdhdG9tLWlkZS1jb25zb2xlLm1heGltdW1NZXNzYWdlQ291bnQnLFxuICAgICAgICAobWF4TWVzc2FnZUNvdW50OiBhbnkpID0+IHtcbiAgICAgICAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKFxuICAgICAgICAgICAgQWN0aW9ucy5zZXRNYXhNZXNzYWdlQ291bnQobWF4TWVzc2FnZUNvdW50KSxcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgKSxcbiAgICAgIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgICAgb2JzZXJ2YWJsZUZyb21TdWJzY3JpYmVGdW5jdGlvbihjYiA9PlxuICAgICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2VkaXRvci5mb250U2l6ZScsIGNiKSxcbiAgICAgICAgKSxcbiAgICAgICAgZmVhdHVyZUNvbmZpZy5vYnNlcnZlQXNTdHJlYW0oJ2F0b20taWRlLWNvbnNvbGUuZm9udFNjYWxlJyksXG4gICAgICAgIChmb250U2l6ZSwgZm9udFNjYWxlKSA9PiBmb250U2l6ZSAqIHBhcnNlRmxvYXQoZm9udFNjYWxlKSxcbiAgICAgIClcbiAgICAgICAgLm1hcChBY3Rpb25zLnNldEZvbnRTaXplKVxuICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX3N0b3JlLmRpc3BhdGNoKSxcbiAgICAgIHRoaXMuX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lcigpLFxuICAgICk7XG4gIH1cblxuICBfZ2V0U3RvcmUoKTogU3RvcmUge1xuICAgIGlmICh0aGlzLl9zdG9yZSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBpbml0aWFsU3RhdGUgPSBkZXNlcmlhbGl6ZUFwcFN0YXRlKHRoaXMuX3Jhd1N0YXRlKTtcbiAgICAgIGNvbnN0IHJvb3RFcGljID0gY29tYmluZUVwaWNzRnJvbUltcG9ydHMoRXBpY3MsICdhdG9tLWlkZS11aScpO1xuICAgICAgdGhpcy5fc3RvcmUgPSBjcmVhdGVTdG9yZShcbiAgICAgICAgUmVkdWNlcnMsXG4gICAgICAgIGluaXRpYWxTdGF0ZSxcbiAgICAgICAgYXBwbHlNaWRkbGV3YXJlKGNyZWF0ZUVwaWNNaWRkbGV3YXJlKHJvb3RFcGljKSksXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3RvcmU7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIGNvbnN1bWVUb29sQmFyKGdldFRvb2xCYXI6IHRvb2xiYXIkR2V0VG9vbGJhcik6IHZvaWQge1xuICAgIGNvbnN0IHRvb2xCYXIgPSBnZXRUb29sQmFyKCdudWNsaWRlLWNvbnNvbGUnKTtcbiAgICB0b29sQmFyLmFkZEJ1dHRvbih7XG4gICAgICBpY29uOiAnbnVjbGljb24tY29uc29sZScsXG4gICAgICBjYWxsYmFjazogJ2NvbnNvbGU6dG9nZ2xlJyxcbiAgICAgIHRvb2x0aXA6ICdUb2dnbGUgQ29uc29sZScsXG4gICAgICBwcmlvcml0eTogNzAwLFxuICAgIH0pO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgICB0b29sQmFyLnJlbW92ZUl0ZW1zKCk7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdW1lUGFzdGVQcm92aWRlcihwcm92aWRlcjogYW55KTogSURpc3Bvc2FibGUge1xuICAgIGNvbnN0IGNyZWF0ZVBhc3RlOiBDcmVhdGVQYXN0ZUZ1bmN0aW9uID0gcHJvdmlkZXIuY3JlYXRlUGFzdGU7XG4gICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldENyZWF0ZVBhc3RlRnVuY3Rpb24oY3JlYXRlUGFzdGUpKTtcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS5jcmVhdGVQYXN0ZUZ1bmN0aW9uID09PSBjcmVhdGVQYXN0ZSkge1xuICAgICAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0Q3JlYXRlUGFzdGVGdW5jdGlvbihudWxsKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25zdW1lV2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3I6IGF0b20kQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IpOiBJRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldFdhdGNoRWRpdG9yKHdhdGNoRWRpdG9yKSk7XG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9nZXRTdG9yZSgpLmdldFN0YXRlKCkud2F0Y2hFZGl0b3IgPT09IHdhdGNoRWRpdG9yKSB7XG4gICAgICAgIHRoaXMuX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5zZXRXYXRjaEVkaXRvcihudWxsKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcm92aWRlQXV0b2NvbXBsZXRlKCk6IGF0b20kQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIGNvbnN0IGFjdGl2YXRpb24gPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBsYWJlbHM6IFsnbnVjbGlkZS1jb25zb2xlJ10sXG4gICAgICBzZWxlY3RvcjogJyonLFxuICAgICAgLy8gQ29waWVzIENocm9tZSBkZXZ0b29scyBhbmQgcHV0cyBoaXN0b3J5IHN1Z2dlc3Rpb25zIGF0IHRoZSBib3R0b20uXG4gICAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IC0xLFxuICAgICAgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMocmVxdWVzdCkge1xuICAgICAgICAvLyBIaXN0b3J5IHByb3ZpZGVzIHN1Z2dlc3Rpb24gb25seSBvbiBleGFjdCBtYXRjaCB0byBjdXJyZW50IGlucHV0LlxuICAgICAgICBjb25zdCBwcmVmaXggPSByZXF1ZXN0LmVkaXRvci5nZXRUZXh0KCk7XG4gICAgICAgIGNvbnN0IGhpc3RvcnkgPSBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmdldFN0YXRlKCkuaGlzdG9yeTtcbiAgICAgICAgLy8gVXNlIGEgc2V0IHRvIHJlbW92ZSBkdXBsaWNhdGVzLlxuICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldChoaXN0b3J5KTtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20oc2VlbilcbiAgICAgICAgICAuZmlsdGVyKHRleHQgPT4gdGV4dC5zdGFydHNXaXRoKHByZWZpeCkpXG4gICAgICAgICAgLm1hcCh0ZXh0ID0+ICh7dGV4dCwgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeH0pKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIF9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIoKTogVW5pdmVyc2FsRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKFxuICAgICAgYXRvbS53b3Jrc3BhY2UuYWRkT3BlbmVyKHVyaSA9PiB7XG4gICAgICAgIGlmICh1cmkgPT09IFdPUktTUEFDRV9WSUVXX1VSSSkge1xuICAgICAgICAgIHJldHVybiBuZXcgQ29uc29sZSh7c3RvcmU6IHRoaXMuX2dldFN0b3JlKCl9KTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICAoKSA9PiBkZXN0cm95SXRlbVdoZXJlKGl0ZW0gPT4gaXRlbSBpbnN0YW5jZW9mIENvbnNvbGUpLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2NvbnNvbGU6dG9nZ2xlJywgKCkgPT4ge1xuICAgICAgICBhdG9tLndvcmtzcGFjZS50b2dnbGUoV09SS1NQQUNFX1ZJRVdfVVJJKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBkZXNlcmlhbGl6ZUNvbnNvbGUoc3RhdGU6IENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSk6IENvbnNvbGUge1xuICAgIHJldHVybiBuZXcgQ29uc29sZSh7XG4gICAgICBzdG9yZTogdGhpcy5fZ2V0U3RvcmUoKSxcbiAgICAgIGluaXRpYWxGaWx0ZXJUZXh0OiBzdGF0ZS5maWx0ZXJUZXh0LFxuICAgICAgaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlcjogc3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM6IG5ldyBTZXQoc3RhdGUudW5zZWxlY3RlZFNldmVyaXRpZXMgfHwgW10pLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgc2VydmljZSBwcm92aWRlcyBhIGZhY3RvcnkgZm9yIGNyZWF0aW5nIGEgY29uc29sZSBvYmplY3QgdGllZCB0byBhIHBhcnRpY3VsYXIgc291cmNlLiBJZlxuICAgKiB0aGUgY29uc3VtZXIgd2FudHMgdG8gZXhwb3NlIHN0YXJ0aW5nIGFuZCBzdG9wcGluZyBmdW5jdGlvbmFsaXR5IHRocm91Z2ggdGhlIENvbnNvbGUgVUkgKGZvclxuICAgKiBleGFtcGxlLCB0byBhbGxvdyB0aGUgdXNlciB0byBkZWNpZGUgd2hlbiB0byBzdGFydCBhbmQgc3RvcCB0YWlsaW5nIGxvZ3MpLCB0aGV5IGNhbiBpbmNsdWRlXG4gICAqIGBzdGFydCgpYCBhbmQgYHN0b3AoKWAgZnVuY3Rpb25zIG9uIHRoZSBvYmplY3QgdGhleSBwYXNzIHRvIHRoZSBmYWN0b3J5LlxuICAgKlxuICAgKiBXaGVuIHRoZSBmYWN0b3J5IGlzIGludm9rZWQsIHRoZSBzb3VyY2Ugd2lsbCBiZSBhZGRlZCB0byB0aGUgQ29uc29sZSBVSSdzIGZpbHRlciBsaXN0LiBUaGVcbiAgICogZmFjdG9yeSByZXR1cm5zIGEgRGlzcG9zYWJsZSB3aGljaCBzaG91bGQgYmUgZGlzcG9zZWQgb2Ygd2hlbiB0aGUgc291cmNlIGdvZXMgYXdheSAoZS5nLiBpdHNcbiAgICogcGFja2FnZSBpcyBkaXNhYmxlZCkuIFRoaXMgd2lsbCByZW1vdmUgdGhlIHNvdXJjZSBmcm9tIHRoZSBDb25zb2xlIFVJJ3MgZmlsdGVyIGxpc3QgKGFzIGxvbmcgYXNcbiAgICogdGhlcmUgYXJlbid0IGFueSByZW1haW5pbmcgbWVzc2FnZXMgZnJvbSB0aGUgc291cmNlKS5cbiAgICovXG4gIHByb3ZpZGVDb25zb2xlKCk6IENvbnNvbGVTZXJ2aWNlIHtcbiAgICAvLyBDcmVhdGUgYSBsb2NhbCwgbnVsbGFibGUgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHNlcnZpY2UgY29uc3VtZXJzIGRvbid0IGtlZXAgdGhlIEFjdGl2YXRpb25cbiAgICAvLyBpbnN0YW5jZSBpbiBtZW1vcnkuXG4gICAgbGV0IGFjdGl2YXRpb24gPSB0aGlzO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgICBhY3RpdmF0aW9uID0gbnVsbDtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZXMgYW4gb2JqZXQgd2l0aCBjYWxsYmFja3MgdG8gcmVxdWVzdCBtYW5pcHVsYXRpb25zIG9uIHRoZSBjdXJyZW50XG4gICAgLy8gY29uc29sZSBtZXNzYWdlIGVudHJ5LlxuICAgIGNvbnN0IGNyZWF0ZVRva2VuID0gKG1lc3NhZ2VJZDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBmaW5kTWVzc2FnZSA9ICgpID0+IHtcbiAgICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XG4gICAgICAgIHJldHVybiBudWxsdGhyb3dzKFxuICAgICAgICAgIGFjdGl2YXRpb25cbiAgICAgICAgICAgIC5fZ2V0U3RvcmUoKVxuICAgICAgICAgICAgLmdldFN0YXRlKClcbiAgICAgICAgICAgIC5pbmNvbXBsZXRlUmVjb3Jkcy5maW5kKHIgPT4gci5tZXNzYWdlSWQgPT09IG1lc3NhZ2VJZCksXG4gICAgICAgICk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICAgIC8vIE1lc3NhZ2UgbmVlZHMgdG8gYmUgbG9va2VkIHVwIGxhemlseSBhdCBjYWxsIHRpbWUgcmF0aGVyIHRoYW5cbiAgICAgICAgLy8gY2FjaGVkIGluIHRoaXMgb2JqZWN0IHRvIGF2b2lkIHJlcXVpcmluZyB0aGUgdXBkYXRlIGFjdGlvbiB0b1xuICAgICAgICAvLyBvcGVyYXRlIHN5bmNocm9ub3VzbHkuIFdoZW4gd2UgYXBwZW5kIHRleHQsIHdlIGRvbid0IGtub3cgdGhlXG4gICAgICAgIC8vIGZ1bGwgbmV3IHRleHQgd2l0aG91dCBsb29raW5nIHVwIHRoZSBuZXcgbWVzc2FnZSBvYmplY3QgaW4gdGhlXG4gICAgICAgIC8vIG5ldyBzdG9yZSBzdGF0ZSBhZnRlciB0aGUgbXV0YXRpb24uXG4gICAgICAgIGdldEN1cnJlbnRUZXh0OiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRNZXNzYWdlKCkudGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0Q3VycmVudExldmVsOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGZpbmRNZXNzYWdlKCkubGV2ZWw7XG4gICAgICAgIH0sXG4gICAgICAgIHNldExldmVsOiAobmV3TGV2ZWw6IExldmVsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZUlkLCBudWxsLCBuZXdMZXZlbCwgZmFsc2UpO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmRUZXh0OiAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZUlkLCB0ZXh0LCBudWxsLCBmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldENvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgdXBkYXRlTWVzc2FnZShtZXNzYWdlSWQsIG51bGwsIG51bGwsIHRydWUpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHVwZGF0ZU1lc3NhZ2UgPSAoXG4gICAgICBtZXNzYWdlSWQ6IHN0cmluZyxcbiAgICAgIGFwcGVuZFRleHQ6ID9zdHJpbmcsXG4gICAgICBvdmVycmlkZUxldmVsOiA/TGV2ZWwsXG4gICAgICBzZXRDb21wbGV0ZTogYm9vbGVhbixcbiAgICApID0+IHtcbiAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwpO1xuICAgICAgYWN0aXZhdGlvblxuICAgICAgICAuX2dldFN0b3JlKClcbiAgICAgICAgLmRpc3BhdGNoKFxuICAgICAgICAgIEFjdGlvbnMucmVjb3JkVXBkYXRlZChcbiAgICAgICAgICAgIG1lc3NhZ2VJZCxcbiAgICAgICAgICAgIGFwcGVuZFRleHQsXG4gICAgICAgICAgICBvdmVycmlkZUxldmVsLFxuICAgICAgICAgICAgc2V0Q29tcGxldGUsXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIHJldHVybiBjcmVhdGVUb2tlbihtZXNzYWdlSWQpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKHNvdXJjZUluZm86IFNvdXJjZUluZm8pID0+IHtcbiAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwpO1xuICAgICAgbGV0IGRpc3Bvc2VkO1xuICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnJlZ2lzdGVyU291cmNlKHNvdXJjZUluZm8pKTtcbiAgICAgIGNvbnN0IGNvbnNvbGUgPSB7XG4gICAgICAgIC8vIFRPRE86IFVwZGF0ZSB0aGVzZSB0byBiZSAob2JqZWN0OiBhbnksIC4uLm9iamVjdHM6IEFycmF5PGFueT4pOiB2b2lkLlxuICAgICAgICBsb2cob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ2xvZyd9KTtcbiAgICAgICAgfSxcbiAgICAgICAgd2FybihvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHt0ZXh0OiBvYmplY3QsIGxldmVsOiAnd2FybmluZyd9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3Iob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ2Vycm9yJ30pO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoe3RleHQ6IG9iamVjdCwgbGV2ZWw6ICdpbmZvJ30pO1xuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoe3RleHQ6IG9iamVjdCwgbGV2ZWw6ICdzdWNjZXNzJ30pO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmQobWVzc2FnZTogTWVzc2FnZSk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCAmJiAhZGlzcG9zZWQpO1xuICAgICAgICAgIGNvbnN0IGluY29tcGxldGUgPSBCb29sZWFuKG1lc3NhZ2UuaW5jb21wbGV0ZSk7XG4gICAgICAgICAgY29uc3QgcmVjb3JkOiBSZWNvcmQgPSB7XG4gICAgICAgICAgICAvLyBBIHVuaXF1ZSBtZXNzYWdlIElEIGlzIG5vdCByZXF1aXJlZCBmb3IgY29tcGxldGUgbWVzc2FnZXMsXG4gICAgICAgICAgICAvLyBzaW5jZSB0aGV5IGNhbm5vdCBiZSB1cGRhdGVkIHRoZXkgZG9uJ3QgbmVlZCB0byBiZSBmb3VuZCBsYXRlci5cbiAgICAgICAgICAgIHRleHQ6IG1lc3NhZ2UudGV4dCxcbiAgICAgICAgICAgIGxldmVsOiBtZXNzYWdlLmxldmVsLFxuICAgICAgICAgICAgZm9ybWF0OiBtZXNzYWdlLmZvcm1hdCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25zOiBtZXNzYWdlLmV4cHJlc3Npb25zLFxuICAgICAgICAgICAgdGFnczogbWVzc2FnZS50YWdzLFxuICAgICAgICAgICAgc2NvcGVOYW1lOiBtZXNzYWdlLnNjb3BlTmFtZSxcbiAgICAgICAgICAgIHNvdXJjZUlkOiBzb3VyY2VJbmZvLmlkLFxuICAgICAgICAgICAgc291cmNlTmFtZTogc291cmNlSW5mby5uYW1lLFxuICAgICAgICAgICAga2luZDogbWVzc2FnZS5raW5kIHx8ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSwgLy8gVE9ETzogQWxsb3cgdGhpcyB0byBjb21lIHdpdGggdGhlIG1lc3NhZ2U/XG4gICAgICAgICAgICByZXBlYXRDb3VudDogMSxcbiAgICAgICAgICAgIGluY29tcGxldGUsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGxldCB0b2tlbiA9IG51bGw7XG4gICAgICAgICAgaWYgKGluY29tcGxldGUpIHtcbiAgICAgICAgICAgIC8vIEFuIElEIGlzIG9ubHkgcmVxdWlyZWQgZm9yIGluY29tcGxldGUgbWVzc2FnZXMsIHdoaWNoIG5lZWRcbiAgICAgICAgICAgIC8vIHRvIGJlIGxvb2tlZCB1cCBmb3IgbXV0YXRpb25zLlxuICAgICAgICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9IHV1aWQudjQoKTtcbiAgICAgICAgICAgIHRva2VuID0gY3JlYXRlVG9rZW4ocmVjb3JkLm1lc3NhZ2VJZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnJlY29yZFJlY2VpdmVkKHJlY29yZCkpO1xuICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0U3RhdHVzKHN0YXR1czogQ29uc29sZVNvdXJjZVN0YXR1cyk6IHZvaWQge1xuICAgICAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwgJiYgIWRpc3Bvc2VkKTtcbiAgICAgICAgICBhY3RpdmF0aW9uXG4gICAgICAgICAgICAuX2dldFN0b3JlKClcbiAgICAgICAgICAgIC5kaXNwYXRjaChBY3Rpb25zLnVwZGF0ZVN0YXR1cyhzb3VyY2VJbmZvLmlkLCBzdGF0dXMpKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKTtcbiAgICAgICAgICBpZiAoIWRpc3Bvc2VkKSB7XG4gICAgICAgICAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgICAgICAgICBhY3RpdmF0aW9uXG4gICAgICAgICAgICAgIC5fZ2V0U3RvcmUoKVxuICAgICAgICAgICAgICAuZGlzcGF0Y2goQWN0aW9ucy5yZW1vdmVTb3VyY2Uoc291cmNlSW5mby5pZCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICByZXR1cm4gY29uc29sZTtcbiAgICB9O1xuICB9XG5cbiAgcHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IoKTogUmVnaXN0ZXJFeGVjdXRvckZ1bmN0aW9uIHtcbiAgICAvLyBDcmVhdGUgYSBsb2NhbCwgbnVsbGFibGUgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHNlcnZpY2UgY29uc3VtZXJzIGRvbid0IGtlZXAgdGhlIEFjdGl2YXRpb25cbiAgICAvLyBpbnN0YW5jZSBpbiBtZW1vcnkuXG4gICAgbGV0IGFjdGl2YXRpb24gPSB0aGlzO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgICBhY3RpdmF0aW9uID0gbnVsbDtcbiAgICB9KTtcblxuICAgIHJldHVybiBleGVjdXRvciA9PiB7XG4gICAgICBpbnZhcmlhbnQoXG4gICAgICAgIGFjdGl2YXRpb24gIT0gbnVsbCxcbiAgICAgICAgJ0V4ZWN1dG9yIHJlZ2lzdHJhdGlvbiBhdHRlbXB0ZWQgYWZ0ZXIgZGVhY3RpdmF0aW9uJyxcbiAgICAgICk7XG4gICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVnaXN0ZXJFeGVjdXRvcihleGVjdXRvcikpO1xuICAgICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2YXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy51bnJlZ2lzdGVyRXhlY3V0b3IoZXhlY3V0b3IpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSgpOiBPYmplY3Qge1xuICAgIGlmICh0aGlzLl9zdG9yZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIGNvbnN0IG1heGltdW1TZXJpYWxpemVkTWVzc2FnZXM6IG51bWJlciA9IChmZWF0dXJlQ29uZmlnLmdldChcbiAgICAgIE1BWElNVU1fU0VSSUFMSVpFRF9NRVNTQUdFU19DT05GSUcsXG4gICAgKTogYW55KTtcbiAgICBjb25zdCBtYXhpbXVtU2VyaWFsaXplZEhpc3Rvcnk6IG51bWJlciA9IChmZWF0dXJlQ29uZmlnLmdldChcbiAgICAgIE1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyxcbiAgICApOiBhbnkpO1xuICAgIHJldHVybiB7XG4gICAgICByZWNvcmRzOiB0aGlzLl9zdG9yZVxuICAgICAgICAuZ2V0U3RhdGUoKVxuICAgICAgICAucmVjb3Jkcy5zbGljZSgtbWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlcylcbiAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAubWFwKHJlY29yZCA9PiB7XG4gICAgICAgICAgLy8gYEV4ZWN1dG9yYCBpcyBub3Qgc2VyaWFsaXphYmxlLiBNYWtlIHN1cmUgdG8gcmVtb3ZlIGl0IGZpcnN0LlxuICAgICAgICAgIGNvbnN0IHtleGVjdXRvciwgLi4ucmVzdH0gPSByZWNvcmQ7XG4gICAgICAgICAgcmV0dXJuIHJlc3Q7XG4gICAgICAgIH0pLFxuICAgICAgaGlzdG9yeTogdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKS5oaXN0b3J5LnNsaWNlKC1tYXhpbXVtU2VyaWFsaXplZEhpc3RvcnkpLFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzZXJpYWxpemVBcHBTdGF0ZShyYXdTdGF0ZTogP09iamVjdCk6IEFwcFN0YXRlIHtcbiAgcmV0dXJuIHtcbiAgICBleGVjdXRvcnM6IG5ldyBNYXAoKSxcbiAgICBjcmVhdGVQYXN0ZUZ1bmN0aW9uOiBudWxsLFxuICAgIGN1cnJlbnRFeGVjdXRvcklkOiBudWxsLFxuICAgIHJlY29yZHM6XG4gICAgICByYXdTdGF0ZSAmJiByYXdTdGF0ZS5yZWNvcmRzXG4gICAgICAgID8gTGlzdChyYXdTdGF0ZS5yZWNvcmRzLm1hcChkZXNlcmlhbGl6ZVJlY29yZCkpXG4gICAgICAgIDogTGlzdCgpLFxuICAgIGluY29tcGxldGVSZWNvcmRzOlxuICAgICAgcmF3U3RhdGUgJiYgcmF3U3RhdGUuaW5jb21wbGV0ZVJlY29yZHNcbiAgICAgICAgPyBMaXN0KHJhd1N0YXRlLmluY29tcGxldGVSZWNvcmRzLm1hcChkZXNlcmlhbGl6ZVJlY29yZCkpXG4gICAgICAgIDogTGlzdCgpLFxuICAgIGhpc3Rvcnk6IHJhd1N0YXRlICYmIHJhd1N0YXRlLmhpc3RvcnkgPyByYXdTdGF0ZS5oaXN0b3J5IDogW10sXG4gICAgcHJvdmlkZXJzOiBuZXcgTWFwKCksXG4gICAgcHJvdmlkZXJTdGF0dXNlczogbmV3IE1hcCgpLFxuXG4gICAgLy8gVGhpcyB2YWx1ZSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIHZhbHVlIGZvcm0gdGhlIGNvbmZpZy4gV2UganVzdCB1c2UgYFBPU0lUSVZFX0lORklOSVRZYFxuICAgIC8vIGhlcmUgdG8gY29uZm9ybSB0byB0aGUgQXBwU3RhdGUgdHlwZSBkZWZpbnRpb24uXG4gICAgbWF4TWVzc2FnZUNvdW50OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlc2VyaWFsaXplUmVjb3JkKHJlY29yZDogT2JqZWN0KTogUmVjb3JkIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZWNvcmQsXG4gICAgdGltZXN0YW1wOiBwYXJzZURhdGUocmVjb3JkLnRpbWVzdGFtcCkgfHwgbmV3IERhdGUoMCksXG4gICAgLy8gQXQgb25lIHBvaW50IGluIHRoZSB0aW1lIHRoZSBtZXNzYWdlSWQgd2FzIGEgbnVtYmVyLCBzbyB0aGUgdXNlciBtaWdodFxuICAgIC8vIGhhdmUgYSBudW1iZXIgc2VyaWFsaXplZC5cbiAgICBtZXNzYWdlSWQ6XG4gICAgICByZWNvcmQgPT0gbnVsbCB8fFxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9PSBudWxsIHx8XG4gICAgICAvLyBTaWdoLiBXZSAoSSwgLWplbGRyZWRnZSkgaGFkIGEgYnVnIGF0IG9uZSBwb2ludCB3aGVyZSB3ZSBhY2NpZGVudGFsbHlcbiAgICAgIC8vIGNvbnZlcnRlZCBzZXJpYWxpemVkIHZhbHVlcyBvZiBgdW5kZWZpbmVkYCB0byB0aGUgc3RyaW5nIGBcInVuZGVmaWVuZFwiYC5cbiAgICAgIC8vIFRob3NlIGNvdWxkIHRoZW4gaGF2ZSBiZWVuIHNlcmlhbGl6ZWQgYmFjayB0byBkaXNrLiBTbywgZm9yIGEgbGl0dGxlXG4gICAgICAvLyB3aGlsZSBhdCBsZWFzdCwgd2Ugc2hvdWxkIGVuc3VyZSB3ZSBmaXggdGhlc2UgYmFkIHZhbHVlcy5cbiAgICAgIHJlY29yZC5tZXNzYWdlSWQgPT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgIDogU3RyaW5nKHJlY29yZC5tZXNzYWdlSWQpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBwYXJzZURhdGUocmF3OiA/c3RyaW5nKTogP0RhdGUge1xuICBpZiAocmF3ID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBkYXRlID0gbmV3IERhdGUocmF3KTtcbiAgcmV0dXJuIGlzTmFOKGRhdGUuZ2V0VGltZSgpKSA/IG51bGwgOiBkYXRlO1xufVxuXG5jcmVhdGVQYWNrYWdlKG1vZHVsZS5leHBvcnRzLCBBY3RpdmF0aW9uKTtcbiJdfQ==