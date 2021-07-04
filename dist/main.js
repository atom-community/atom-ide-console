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

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyIsIk1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyIsIkFjdGl2YXRpb24iLCJjb25zdHJ1Y3RvciIsInJhd1N0YXRlIiwiX2Rpc3Bvc2FibGVzIiwiX3Jhd1N0YXRlIiwiX3N0b3JlIiwiX25leHRNZXNzYWdlSWQiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYXRvbSIsImNvbnRleHRNZW51IiwiYWRkIiwibGFiZWwiLCJjb21tYW5kIiwiY29tbWFuZHMiLCJldmVudCIsImVsIiwidGFyZ2V0IiwiaW5uZXJUZXh0IiwiY2xpcGJvYXJkIiwid3JpdGUiLCJfZ2V0U3RvcmUiLCJkaXNwYXRjaCIsIkFjdGlvbnMiLCJjbGVhclJlY29yZHMiLCJmZWF0dXJlQ29uZmlnIiwib2JzZXJ2ZSIsIm1heE1lc3NhZ2VDb3VudCIsInNldE1heE1lc3NhZ2VDb3VudCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwiY2IiLCJjb25maWciLCJvYnNlcnZlQXNTdHJlYW0iLCJmb250U2l6ZSIsImZvbnRTY2FsZSIsInBhcnNlRmxvYXQiLCJtYXAiLCJzZXRGb250U2l6ZSIsInN1YnNjcmliZSIsIl9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIiLCJpbml0aWFsU3RhdGUiLCJkZXNlcmlhbGl6ZUFwcFN0YXRlIiwicm9vdEVwaWMiLCJFcGljcyIsIlJlZHVjZXJzIiwiZGlzcG9zZSIsImNvbnN1bWVUb29sQmFyIiwiZ2V0VG9vbEJhciIsInRvb2xCYXIiLCJhZGRCdXR0b24iLCJpY29uIiwiY2FsbGJhY2siLCJ0b29sdGlwIiwicHJpb3JpdHkiLCJyZW1vdmVJdGVtcyIsImNvbnN1bWVQYXN0ZVByb3ZpZGVyIiwicHJvdmlkZXIiLCJjcmVhdGVQYXN0ZSIsInNldENyZWF0ZVBhc3RlRnVuY3Rpb24iLCJnZXRTdGF0ZSIsImNyZWF0ZVBhc3RlRnVuY3Rpb24iLCJjb25zdW1lV2F0Y2hFZGl0b3IiLCJ3YXRjaEVkaXRvciIsInNldFdhdGNoRWRpdG9yIiwicHJvdmlkZUF1dG9jb21wbGV0ZSIsImFjdGl2YXRpb24iLCJsYWJlbHMiLCJzZWxlY3RvciIsInN1Z2dlc3Rpb25Qcmlvcml0eSIsImdldFN1Z2dlc3Rpb25zIiwicmVxdWVzdCIsInByZWZpeCIsImVkaXRvciIsImdldFRleHQiLCJoaXN0b3J5Iiwic2VlbiIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsInRleHQiLCJzdGFydHNXaXRoIiwicmVwbGFjZW1lbnRQcmVmaXgiLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJXT1JLU1BBQ0VfVklFV19VUkkiLCJDb25zb2xlIiwic3RvcmUiLCJpdGVtIiwidG9nZ2xlIiwiZGVzZXJpYWxpemVDb25zb2xlIiwic3RhdGUiLCJpbml0aWFsRmlsdGVyVGV4dCIsImZpbHRlclRleHQiLCJpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJ1bnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RlZFNldmVyaXRpZXMiLCJwcm92aWRlQ29uc29sZSIsImNyZWF0ZVRva2VuIiwibWVzc2FnZUlkIiwiZmluZE1lc3NhZ2UiLCJpbmNvbXBsZXRlUmVjb3JkcyIsImZpbmQiLCJyIiwiT2JqZWN0IiwiZnJlZXplIiwiZ2V0Q3VycmVudFRleHQiLCJnZXRDdXJyZW50TGV2ZWwiLCJsZXZlbCIsInNldExldmVsIiwibmV3TGV2ZWwiLCJ1cGRhdGVNZXNzYWdlIiwiYXBwZW5kVGV4dCIsInNldENvbXBsZXRlIiwib3ZlcnJpZGVMZXZlbCIsInJlY29yZFVwZGF0ZWQiLCJzb3VyY2VJbmZvIiwiZGlzcG9zZWQiLCJyZWdpc3RlclNvdXJjZSIsImNvbnNvbGUiLCJsb2ciLCJvYmplY3QiLCJhcHBlbmQiLCJ3YXJuIiwiZXJyb3IiLCJpbmZvIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJpbmNvbXBsZXRlIiwiQm9vbGVhbiIsInJlY29yZCIsImZvcm1hdCIsImV4cHJlc3Npb25zIiwidGFncyIsInNjb3BlTmFtZSIsInNvdXJjZUlkIiwiaWQiLCJzb3VyY2VOYW1lIiwibmFtZSIsImtpbmQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicmVwZWF0Q291bnQiLCJ0b2tlbiIsInV1aWQiLCJ2NCIsInJlY29yZFJlY2VpdmVkIiwic2V0U3RhdHVzIiwic3RhdHVzIiwidXBkYXRlU3RhdHVzIiwicmVtb3ZlU291cmNlIiwicHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IiLCJleGVjdXRvciIsInJlZ2lzdGVyRXhlY3V0b3IiLCJ1bnJlZ2lzdGVyRXhlY3V0b3IiLCJzZXJpYWxpemUiLCJtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzIiwiZ2V0IiwibWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5IiwicmVjb3JkcyIsInNsaWNlIiwidG9BcnJheSIsInJlc3QiLCJleGVjdXRvcnMiLCJNYXAiLCJjdXJyZW50RXhlY3V0b3JJZCIsImRlc2VyaWFsaXplUmVjb3JkIiwicHJvdmlkZXJzIiwicHJvdmlkZXJTdGF0dXNlcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwicGFyc2VEYXRlIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicmF3IiwiZGF0ZSIsImlzTmFOIiwiZ2V0VGltZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBNEJBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQTlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBaUJBO0FBcUJBLE1BQU1BLGtDQUFrQyxHQUN0Qyw0Q0FERjtBQUVBLE1BQU1DLGlDQUFpQyxHQUNy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QWNHLE1BQU0sQ0FBQ0MsT0FBckIsRUFBOEJ2TCxVQUE5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgQXBwU3RhdGUsXG4gIENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSxcbiAgQ29uc29sZVNlcnZpY2UsXG4gIFNvdXJjZUluZm8sXG4gIE1lc3NhZ2UsXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXG4gIFJlY29yZCxcbiAgUmVjb3JkVG9rZW4sXG4gIFJlZ2lzdGVyRXhlY3V0b3JGdW5jdGlvbixcbiAgU3RvcmUsXG4gIExldmVsLFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB0eXBlIHtDcmVhdGVQYXN0ZUZ1bmN0aW9ufSBmcm9tICcuL3R5cGVzJztcblxuLy8gbG9hZCBzdHlsZXNcbmltcG9ydCBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpXCJcblxuaW1wb3J0IHtMaXN0fSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0IGNyZWF0ZVBhY2thZ2UgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9jcmVhdGVQYWNrYWdlJztcbmltcG9ydCB7ZGVzdHJveUl0ZW1XaGVyZX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9kZXN0cm95SXRlbVdoZXJlJztcbmltcG9ydCB7Y29tYmluZUVwaWNzRnJvbUltcG9ydHN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2VwaWNIZWxwZXJzJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzJztcbmltcG9ydCB7Y3JlYXRlRXBpY01pZGRsZXdhcmV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL3JlZHV4LW9ic2VydmFibGUnO1xuaW1wb3J0IHtvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9ufSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9ldmVudCc7XG5pbXBvcnQgZmVhdHVyZUNvbmZpZyBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL2ZlYXR1cmUtY29uZmlnJztcbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGUnO1xuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tICcuL3JlZHV4L0FjdGlvbnMnO1xuaW1wb3J0ICogYXMgRXBpY3MgZnJvbSAnLi9yZWR1eC9FcGljcyc7XG5pbXBvcnQgUmVkdWNlcnMgZnJvbSAnLi9yZWR1eC9SZWR1Y2Vycyc7XG5pbXBvcnQge0NvbnNvbGUsIFdPUktTUEFDRV9WSUVXX1VSSX0gZnJvbSAnLi91aS9Db25zb2xlJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7YXBwbHlNaWRkbGV3YXJlLCBjcmVhdGVTdG9yZX0gZnJvbSAncmVkdXgvZGlzdC9yZWR1eC5taW4uanMnO1xuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSAnbnVsbHRocm93cyc7XG5pbXBvcnQgdXVpZCBmcm9tICd1dWlkJztcblxuY29uc3QgTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyA9XG4gICdhdG9tLWlkZS1jb25zb2xlLm1heGltdW1TZXJpYWxpemVkTWVzc2FnZXMnO1xuY29uc3QgTUFYSU1VTV9TRVJJQUxJWkVEX0hJU1RPUllfQ09ORklHID1cbiAgJ2F0b20taWRlLWNvbnNvbGUubWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5JztcblxuY2xhc3MgQWN0aXZhdGlvbiB7XG4gIF9kaXNwb3NhYmxlczogVW5pdmVyc2FsRGlzcG9zYWJsZTtcbiAgX3Jhd1N0YXRlOiA/T2JqZWN0O1xuICBfc3RvcmU6IFN0b3JlO1xuICBfbmV4dE1lc3NhZ2VJZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHJhd1N0YXRlOiA/T2JqZWN0KSB7XG4gICAgdGhpcy5fcmF3U3RhdGUgPSByYXdTdGF0ZTtcbiAgICB0aGlzLl9uZXh0TWVzc2FnZUlkID0gMDtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKFxuICAgICAgYXRvbS5jb250ZXh0TWVudS5hZGQoe1xuICAgICAgICAnLmNvbnNvbGUtcmVjb3JkJzogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ29weSBNZXNzYWdlJyxcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdjb25zb2xlOmNvcHktbWVzc2FnZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJy5jb25zb2xlLXJlY29yZCcsICdjb25zb2xlOmNvcHktbWVzc2FnZScsIGV2ZW50ID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIC8vICRGbG93Rml4TWUoPj0wLjY4LjApIEZsb3cgc3VwcHJlc3MgKFQyNzE4Nzg1NylcbiAgICAgICAgaWYgKGVsID09IG51bGwgfHwgdHlwZW9mIGVsLmlubmVyVGV4dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoZWwuaW5uZXJUZXh0KTtcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2NvbnNvbGU6Y2xlYXInLCAoKSA9PlxuICAgICAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuY2xlYXJSZWNvcmRzKCkpLFxuICAgICAgKSxcbiAgICAgIGZlYXR1cmVDb25maWcub2JzZXJ2ZShcbiAgICAgICAgJ2F0b20taWRlLWNvbnNvbGUubWF4aW11bU1lc3NhZ2VDb3VudCcsXG4gICAgICAgIChtYXhNZXNzYWdlQ291bnQ6IGFueSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2dldFN0b3JlKCkuZGlzcGF0Y2goXG4gICAgICAgICAgICBBY3Rpb25zLnNldE1heE1lc3NhZ2VDb3VudChtYXhNZXNzYWdlQ291bnQpLFxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICApLFxuICAgICAgT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgICBvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9uKGNiID0+XG4gICAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnZWRpdG9yLmZvbnRTaXplJywgY2IpLFxuICAgICAgICApLFxuICAgICAgICBmZWF0dXJlQ29uZmlnLm9ic2VydmVBc1N0cmVhbSgnYXRvbS1pZGUtY29uc29sZS5mb250U2NhbGUnKSxcbiAgICAgICAgKGZvbnRTaXplLCBmb250U2NhbGUpID0+IGZvbnRTaXplICogcGFyc2VGbG9hdChmb250U2NhbGUpLFxuICAgICAgKVxuICAgICAgICAubWFwKEFjdGlvbnMuc2V0Rm9udFNpemUpXG4gICAgICAgIC5zdWJzY3JpYmUodGhpcy5fc3RvcmUuZGlzcGF0Y2gpLFxuICAgICAgdGhpcy5fcmVnaXN0ZXJDb21tYW5kQW5kT3BlbmVyKCksXG4gICAgKTtcbiAgfVxuXG4gIF9nZXRTdG9yZSgpOiBTdG9yZSB7XG4gICAgaWYgKHRoaXMuX3N0b3JlID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxTdGF0ZSA9IGRlc2VyaWFsaXplQXBwU3RhdGUodGhpcy5fcmF3U3RhdGUpO1xuICAgICAgY29uc3Qgcm9vdEVwaWMgPSBjb21iaW5lRXBpY3NGcm9tSW1wb3J0cyhFcGljcywgJ2F0b20taWRlLXVpJyk7XG4gICAgICB0aGlzLl9zdG9yZSA9IGNyZWF0ZVN0b3JlKFxuICAgICAgICBSZWR1Y2VycyxcbiAgICAgICAgaW5pdGlhbFN0YXRlLFxuICAgICAgICBhcHBseU1pZGRsZXdhcmUoY3JlYXRlRXBpY01pZGRsZXdhcmUocm9vdEVwaWMpKSxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9zdG9yZTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICB9XG5cbiAgY29uc3VtZVRvb2xCYXIoZ2V0VG9vbEJhcjogdG9vbGJhciRHZXRUb29sYmFyKTogdm9pZCB7XG4gICAgY29uc3QgdG9vbEJhciA9IGdldFRvb2xCYXIoJ251Y2xpZGUtY29uc29sZScpO1xuICAgIHRvb2xCYXIuYWRkQnV0dG9uKHtcbiAgICAgIGljb246ICdudWNsaWNvbi1jb25zb2xlJyxcbiAgICAgIGNhbGxiYWNrOiAnY29uc29sZTp0b2dnbGUnLFxuICAgICAgdG9vbHRpcDogJ1RvZ2dsZSBDb25zb2xlJyxcbiAgICAgIHByaW9yaXR5OiA3MDAsXG4gICAgfSk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKCgpID0+IHtcbiAgICAgIHRvb2xCYXIucmVtb3ZlSXRlbXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN1bWVQYXN0ZVByb3ZpZGVyKHByb3ZpZGVyOiBhbnkpOiBJRGlzcG9zYWJsZSB7XG4gICAgY29uc3QgY3JlYXRlUGFzdGU6IENyZWF0ZVBhc3RlRnVuY3Rpb24gPSBwcm92aWRlci5jcmVhdGVQYXN0ZTtcbiAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0Q3JlYXRlUGFzdGVGdW5jdGlvbihjcmVhdGVQYXN0ZSkpO1xuICAgIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fZ2V0U3RvcmUoKS5nZXRTdGF0ZSgpLmNyZWF0ZVBhc3RlRnVuY3Rpb24gPT09IGNyZWF0ZVBhc3RlKSB7XG4gICAgICAgIHRoaXMuX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5zZXRDcmVhdGVQYXN0ZUZ1bmN0aW9uKG51bGwpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN1bWVXYXRjaEVkaXRvcih3YXRjaEVkaXRvcjogYXRvbSRBdXRvY29tcGxldGVXYXRjaEVkaXRvcik6IElEaXNwb3NhYmxlIHtcbiAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0V2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3IpKTtcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS53YXRjaEVkaXRvciA9PT0gd2F0Y2hFZGl0b3IpIHtcbiAgICAgICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldFdhdGNoRWRpdG9yKG51bGwpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByb3ZpZGVBdXRvY29tcGxldGUoKTogYXRvbSRBdXRvY29tcGxldGVQcm92aWRlciB7XG4gICAgY29uc3QgYWN0aXZhdGlvbiA9IHRoaXM7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsczogWydudWNsaWRlLWNvbnNvbGUnXSxcbiAgICAgIHNlbGVjdG9yOiAnKicsXG4gICAgICAvLyBDb3BpZXMgQ2hyb21lIGRldnRvb2xzIGFuZCBwdXRzIGhpc3Rvcnkgc3VnZ2VzdGlvbnMgYXQgdGhlIGJvdHRvbS5cbiAgICAgIHN1Z2dlc3Rpb25Qcmlvcml0eTogLTEsXG4gICAgICBhc3luYyBnZXRTdWdnZXN0aW9ucyhyZXF1ZXN0KSB7XG4gICAgICAgIC8vIEhpc3RvcnkgcHJvdmlkZXMgc3VnZ2VzdGlvbiBvbmx5IG9uIGV4YWN0IG1hdGNoIHRvIGN1cnJlbnQgaW5wdXQuXG4gICAgICAgIGNvbnN0IHByZWZpeCA9IHJlcXVlc3QuZWRpdG9yLmdldFRleHQoKTtcbiAgICAgICAgY29uc3QgaGlzdG9yeSA9IGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS5oaXN0b3J5O1xuICAgICAgICAvLyBVc2UgYSBzZXQgdG8gcmVtb3ZlIGR1cGxpY2F0ZXMuXG4gICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KGhpc3RvcnkpO1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShzZWVuKVxuICAgICAgICAgIC5maWx0ZXIodGV4dCA9PiB0ZXh0LnN0YXJ0c1dpdGgocHJlZml4KSlcbiAgICAgICAgICAubWFwKHRleHQgPT4gKHt0ZXh0LCByZXBsYWNlbWVudFByZWZpeDogcHJlZml4fSkpO1xuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgX3JlZ2lzdGVyQ29tbWFuZEFuZE9wZW5lcigpOiBVbml2ZXJzYWxEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoXG4gICAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIodXJpID0+IHtcbiAgICAgICAgaWYgKHVyaSA9PT0gV09SS1NQQUNFX1ZJRVdfVVJJKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBDb25zb2xlKHtzdG9yZTogdGhpcy5fZ2V0U3RvcmUoKX0pO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgICgpID0+IGRlc3Ryb3lJdGVtV2hlcmUoaXRlbSA9PiBpdGVtIGluc3RhbmNlb2YgQ29uc29sZSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29uc29sZTp0b2dnbGUnLCAoKSA9PiB7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLnRvZ2dsZShXT1JLU1BBQ0VfVklFV19VUkkpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGRlc2VyaWFsaXplQ29uc29sZShzdGF0ZTogQ29uc29sZVBlcnNpc3RlZFN0YXRlKTogQ29uc29sZSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlKHtcbiAgICAgIHN0b3JlOiB0aGlzLl9nZXRTdG9yZSgpLFxuICAgICAgaW5pdGlhbEZpbHRlclRleHQ6IHN0YXRlLmZpbHRlclRleHQsXG4gICAgICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyOiBzdGF0ZS5lbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkczogc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllczogbmV3IFNldChzdGF0ZS51bnNlbGVjdGVkU2V2ZXJpdGllcyB8fCBbXSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBzZXJ2aWNlIHByb3ZpZGVzIGEgZmFjdG9yeSBmb3IgY3JlYXRpbmcgYSBjb25zb2xlIG9iamVjdCB0aWVkIHRvIGEgcGFydGljdWxhciBzb3VyY2UuIElmXG4gICAqIHRoZSBjb25zdW1lciB3YW50cyB0byBleHBvc2Ugc3RhcnRpbmcgYW5kIHN0b3BwaW5nIGZ1bmN0aW9uYWxpdHkgdGhyb3VnaCB0aGUgQ29uc29sZSBVSSAoZm9yXG4gICAqIGV4YW1wbGUsIHRvIGFsbG93IHRoZSB1c2VyIHRvIGRlY2lkZSB3aGVuIHRvIHN0YXJ0IGFuZCBzdG9wIHRhaWxpbmcgbG9ncyksIHRoZXkgY2FuIGluY2x1ZGVcbiAgICogYHN0YXJ0KClgIGFuZCBgc3RvcCgpYCBmdW5jdGlvbnMgb24gdGhlIG9iamVjdCB0aGV5IHBhc3MgdG8gdGhlIGZhY3RvcnkuXG4gICAqXG4gICAqIFdoZW4gdGhlIGZhY3RvcnkgaXMgaW52b2tlZCwgdGhlIHNvdXJjZSB3aWxsIGJlIGFkZGVkIHRvIHRoZSBDb25zb2xlIFVJJ3MgZmlsdGVyIGxpc3QuIFRoZVxuICAgKiBmYWN0b3J5IHJldHVybnMgYSBEaXNwb3NhYmxlIHdoaWNoIHNob3VsZCBiZSBkaXNwb3NlZCBvZiB3aGVuIHRoZSBzb3VyY2UgZ29lcyBhd2F5IChlLmcuIGl0c1xuICAgKiBwYWNrYWdlIGlzIGRpc2FibGVkKS4gVGhpcyB3aWxsIHJlbW92ZSB0aGUgc291cmNlIGZyb20gdGhlIENvbnNvbGUgVUkncyBmaWx0ZXIgbGlzdCAoYXMgbG9uZyBhc1xuICAgKiB0aGVyZSBhcmVuJ3QgYW55IHJlbWFpbmluZyBtZXNzYWdlcyBmcm9tIHRoZSBzb3VyY2UpLlxuICAgKi9cbiAgcHJvdmlkZUNvbnNvbGUoKTogQ29uc29sZVNlcnZpY2Uge1xuICAgIC8vIENyZWF0ZSBhIGxvY2FsLCBudWxsYWJsZSByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc2VydmljZSBjb25zdW1lcnMgZG9uJ3Qga2VlcCB0aGUgQWN0aXZhdGlvblxuICAgIC8vIGluc3RhbmNlIGluIG1lbW9yeS5cbiAgICBsZXQgYWN0aXZhdGlvbiA9IHRoaXM7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKCgpID0+IHtcbiAgICAgIGFjdGl2YXRpb24gPSBudWxsO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlcyBhbiBvYmpldCB3aXRoIGNhbGxiYWNrcyB0byByZXF1ZXN0IG1hbmlwdWxhdGlvbnMgb24gdGhlIGN1cnJlbnRcbiAgICAvLyBjb25zb2xlIG1lc3NhZ2UgZW50cnkuXG4gICAgY29uc3QgY3JlYXRlVG9rZW4gPSAobWVzc2FnZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGZpbmRNZXNzYWdlID0gKCkgPT4ge1xuICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKTtcbiAgICAgICAgcmV0dXJuIG51bGx0aHJvd3MoXG4gICAgICAgICAgYWN0aXZhdGlvblxuICAgICAgICAgICAgLl9nZXRTdG9yZSgpXG4gICAgICAgICAgICAuZ2V0U3RhdGUoKVxuICAgICAgICAgICAgLmluY29tcGxldGVSZWNvcmRzLmZpbmQociA9PiByLm1lc3NhZ2VJZCA9PT0gbWVzc2FnZUlkKSxcbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgLy8gTWVzc2FnZSBuZWVkcyB0byBiZSBsb29rZWQgdXAgbGF6aWx5IGF0IGNhbGwgdGltZSByYXRoZXIgdGhhblxuICAgICAgICAvLyBjYWNoZWQgaW4gdGhpcyBvYmplY3QgdG8gYXZvaWQgcmVxdWlyaW5nIHRoZSB1cGRhdGUgYWN0aW9uIHRvXG4gICAgICAgIC8vIG9wZXJhdGUgc3luY2hyb25vdXNseS4gV2hlbiB3ZSBhcHBlbmQgdGV4dCwgd2UgZG9uJ3Qga25vdyB0aGVcbiAgICAgICAgLy8gZnVsbCBuZXcgdGV4dCB3aXRob3V0IGxvb2tpbmcgdXAgdGhlIG5ldyBtZXNzYWdlIG9iamVjdCBpbiB0aGVcbiAgICAgICAgLy8gbmV3IHN0b3JlIHN0YXRlIGFmdGVyIHRoZSBtdXRhdGlvbi5cbiAgICAgICAgZ2V0Q3VycmVudFRleHQ6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZmluZE1lc3NhZ2UoKS50ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBnZXRDdXJyZW50TGV2ZWw6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZmluZE1lc3NhZ2UoKS5sZXZlbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0TGV2ZWw6IChuZXdMZXZlbDogTGV2ZWwpID0+IHtcbiAgICAgICAgICByZXR1cm4gdXBkYXRlTWVzc2FnZShtZXNzYWdlSWQsIG51bGwsIG5ld0xldmVsLCBmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZFRleHQ6ICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICByZXR1cm4gdXBkYXRlTWVzc2FnZShtZXNzYWdlSWQsIHRleHQsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0Q29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgbnVsbCwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgdXBkYXRlTWVzc2FnZSA9IChcbiAgICAgIG1lc3NhZ2VJZDogc3RyaW5nLFxuICAgICAgYXBwZW5kVGV4dDogP3N0cmluZyxcbiAgICAgIG92ZXJyaWRlTGV2ZWw6ID9MZXZlbCxcbiAgICAgIHNldENvbXBsZXRlOiBib29sZWFuLFxuICAgICkgPT4ge1xuICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XG4gICAgICBhY3RpdmF0aW9uXG4gICAgICAgIC5fZ2V0U3RvcmUoKVxuICAgICAgICAuZGlzcGF0Y2goXG4gICAgICAgICAgQWN0aW9ucy5yZWNvcmRVcGRhdGVkKFxuICAgICAgICAgICAgbWVzc2FnZUlkLFxuICAgICAgICAgICAgYXBwZW5kVGV4dCxcbiAgICAgICAgICAgIG92ZXJyaWRlTGV2ZWwsXG4gICAgICAgICAgICBzZXRDb21wbGV0ZSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgcmV0dXJuIGNyZWF0ZVRva2VuKG1lc3NhZ2VJZCk7XG4gICAgfTtcblxuICAgIHJldHVybiAoc291cmNlSW5mbzogU291cmNlSW5mbykgPT4ge1xuICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XG4gICAgICBsZXQgZGlzcG9zZWQ7XG4gICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVnaXN0ZXJTb3VyY2Uoc291cmNlSW5mbykpO1xuICAgICAgY29uc3QgY29uc29sZSA9IHtcbiAgICAgICAgLy8gVE9ETzogVXBkYXRlIHRoZXNlIHRvIGJlIChvYmplY3Q6IGFueSwgLi4ub2JqZWN0czogQXJyYXk8YW55Pik6IHZvaWQuXG4gICAgICAgIGxvZyhvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHt0ZXh0OiBvYmplY3QsIGxldmVsOiAnbG9nJ30pO1xuICAgICAgICB9LFxuICAgICAgICB3YXJuKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoe3RleHQ6IG9iamVjdCwgbGV2ZWw6ICd3YXJuaW5nJ30pO1xuICAgICAgICB9LFxuICAgICAgICBlcnJvcihvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHt0ZXh0OiBvYmplY3QsIGxldmVsOiAnZXJyb3InfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm8ob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ2luZm8nfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN1Y2Nlc3Mob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ3N1Y2Nlc3MnfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZChtZXNzYWdlOiBNZXNzYWdlKTogP1JlY29yZFRva2VuIHtcbiAgICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsICYmICFkaXNwb3NlZCk7XG4gICAgICAgICAgY29uc3QgaW5jb21wbGV0ZSA9IEJvb2xlYW4obWVzc2FnZS5pbmNvbXBsZXRlKTtcbiAgICAgICAgICBjb25zdCByZWNvcmQ6IFJlY29yZCA9IHtcbiAgICAgICAgICAgIC8vIEEgdW5pcXVlIG1lc3NhZ2UgSUQgaXMgbm90IHJlcXVpcmVkIGZvciBjb21wbGV0ZSBtZXNzYWdlcyxcbiAgICAgICAgICAgIC8vIHNpbmNlIHRoZXkgY2Fubm90IGJlIHVwZGF0ZWQgdGhleSBkb24ndCBuZWVkIHRvIGJlIGZvdW5kIGxhdGVyLlxuICAgICAgICAgICAgdGV4dDogbWVzc2FnZS50ZXh0LFxuICAgICAgICAgICAgbGV2ZWw6IG1lc3NhZ2UubGV2ZWwsXG4gICAgICAgICAgICBmb3JtYXQ6IG1lc3NhZ2UuZm9ybWF0LFxuICAgICAgICAgICAgZXhwcmVzc2lvbnM6IG1lc3NhZ2UuZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICB0YWdzOiBtZXNzYWdlLnRhZ3MsXG4gICAgICAgICAgICBzY29wZU5hbWU6IG1lc3NhZ2Uuc2NvcGVOYW1lLFxuICAgICAgICAgICAgc291cmNlSWQ6IHNvdXJjZUluZm8uaWQsXG4gICAgICAgICAgICBzb3VyY2VOYW1lOiBzb3VyY2VJbmZvLm5hbWUsXG4gICAgICAgICAgICBraW5kOiBtZXNzYWdlLmtpbmQgfHwgJ21lc3NhZ2UnLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLCAvLyBUT0RPOiBBbGxvdyB0aGlzIHRvIGNvbWUgd2l0aCB0aGUgbWVzc2FnZT9cbiAgICAgICAgICAgIHJlcGVhdENvdW50OiAxLFxuICAgICAgICAgICAgaW5jb21wbGV0ZSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGV0IHRva2VuID0gbnVsbDtcbiAgICAgICAgICBpZiAoaW5jb21wbGV0ZSkge1xuICAgICAgICAgICAgLy8gQW4gSUQgaXMgb25seSByZXF1aXJlZCBmb3IgaW5jb21wbGV0ZSBtZXNzYWdlcywgd2hpY2ggbmVlZFxuICAgICAgICAgICAgLy8gdG8gYmUgbG9va2VkIHVwIGZvciBtdXRhdGlvbnMuXG4gICAgICAgICAgICByZWNvcmQubWVzc2FnZUlkID0gdXVpZC52NCgpO1xuICAgICAgICAgICAgdG9rZW4gPSBjcmVhdGVUb2tlbihyZWNvcmQubWVzc2FnZUlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQocmVjb3JkKSk7XG4gICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9LFxuICAgICAgICBzZXRTdGF0dXMoc3RhdHVzOiBDb25zb2xlU291cmNlU3RhdHVzKTogdm9pZCB7XG4gICAgICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCAmJiAhZGlzcG9zZWQpO1xuICAgICAgICAgIGFjdGl2YXRpb25cbiAgICAgICAgICAgIC5fZ2V0U3RvcmUoKVxuICAgICAgICAgICAgLmRpc3BhdGNoKEFjdGlvbnMudXBkYXRlU3RhdHVzKHNvdXJjZUluZm8uaWQsIHN0YXR1cykpO1xuICAgICAgICB9LFxuICAgICAgICBkaXNwb3NlKCk6IHZvaWQge1xuICAgICAgICAgIGludmFyaWFudChhY3RpdmF0aW9uICE9IG51bGwpO1xuICAgICAgICAgIGlmICghZGlzcG9zZWQpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGFjdGl2YXRpb25cbiAgICAgICAgICAgICAgLl9nZXRTdG9yZSgpXG4gICAgICAgICAgICAgIC5kaXNwYXRjaChBY3Rpb25zLnJlbW92ZVNvdXJjZShzb3VyY2VJbmZvLmlkKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIHJldHVybiBjb25zb2xlO1xuICAgIH07XG4gIH1cblxuICBwcm92aWRlUmVnaXN0ZXJFeGVjdXRvcigpOiBSZWdpc3RlckV4ZWN1dG9yRnVuY3Rpb24ge1xuICAgIC8vIENyZWF0ZSBhIGxvY2FsLCBudWxsYWJsZSByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc2VydmljZSBjb25zdW1lcnMgZG9uJ3Qga2VlcCB0aGUgQWN0aXZhdGlvblxuICAgIC8vIGluc3RhbmNlIGluIG1lbW9yeS5cbiAgICBsZXQgYWN0aXZhdGlvbiA9IHRoaXM7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKCgpID0+IHtcbiAgICAgIGFjdGl2YXRpb24gPSBudWxsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGV4ZWN1dG9yID0+IHtcbiAgICAgIGludmFyaWFudChcbiAgICAgICAgYWN0aXZhdGlvbiAhPSBudWxsLFxuICAgICAgICAnRXhlY3V0b3IgcmVnaXN0cmF0aW9uIGF0dGVtcHRlZCBhZnRlciBkZWFjdGl2YXRpb24nLFxuICAgICAgKTtcbiAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWdpc3RlckV4ZWN1dG9yKGV4ZWN1dG9yKSk7XG4gICAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnVucmVnaXN0ZXJFeGVjdXRvcihleGVjdXRvcikpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbiAgc2VyaWFsaXplKCk6IE9iamVjdCB7XG4gICAgaWYgKHRoaXMuX3N0b3JlID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgbWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlczogbnVtYmVyID0gKGZlYXR1cmVDb25maWcuZ2V0KFxuICAgICAgTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyxcbiAgICApOiBhbnkpO1xuICAgIGNvbnN0IG1heGltdW1TZXJpYWxpemVkSGlzdG9yeTogbnVtYmVyID0gKGZlYXR1cmVDb25maWcuZ2V0KFxuICAgICAgTUFYSU1VTV9TRVJJQUxJWkVEX0hJU1RPUllfQ09ORklHLFxuICAgICk6IGFueSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlY29yZHM6IHRoaXMuX3N0b3JlXG4gICAgICAgIC5nZXRTdGF0ZSgpXG4gICAgICAgIC5yZWNvcmRzLnNsaWNlKC1tYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzKVxuICAgICAgICAudG9BcnJheSgpXG4gICAgICAgIC5tYXAocmVjb3JkID0+IHtcbiAgICAgICAgICAvLyBgRXhlY3V0b3JgIGlzIG5vdCBzZXJpYWxpemFibGUuIE1ha2Ugc3VyZSB0byByZW1vdmUgaXQgZmlyc3QuXG4gICAgICAgICAgY29uc3Qge2V4ZWN1dG9yLCAuLi5yZXN0fSA9IHJlY29yZDtcbiAgICAgICAgICByZXR1cm4gcmVzdDtcbiAgICAgICAgfSksXG4gICAgICBoaXN0b3J5OiB0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpLmhpc3Rvcnkuc2xpY2UoLW1heGltdW1TZXJpYWxpemVkSGlzdG9yeSksXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXNlcmlhbGl6ZUFwcFN0YXRlKHJhd1N0YXRlOiA/T2JqZWN0KTogQXBwU3RhdGUge1xuICByZXR1cm4ge1xuICAgIGV4ZWN1dG9yczogbmV3IE1hcCgpLFxuICAgIGNyZWF0ZVBhc3RlRnVuY3Rpb246IG51bGwsXG4gICAgY3VycmVudEV4ZWN1dG9ySWQ6IG51bGwsXG4gICAgcmVjb3JkczpcbiAgICAgIHJhd1N0YXRlICYmIHJhd1N0YXRlLnJlY29yZHNcbiAgICAgICAgPyBMaXN0KHJhd1N0YXRlLnJlY29yZHMubWFwKGRlc2VyaWFsaXplUmVjb3JkKSlcbiAgICAgICAgOiBMaXN0KCksXG4gICAgaW5jb21wbGV0ZVJlY29yZHM6XG4gICAgICByYXdTdGF0ZSAmJiByYXdTdGF0ZS5pbmNvbXBsZXRlUmVjb3Jkc1xuICAgICAgICA/IExpc3QocmF3U3RhdGUuaW5jb21wbGV0ZVJlY29yZHMubWFwKGRlc2VyaWFsaXplUmVjb3JkKSlcbiAgICAgICAgOiBMaXN0KCksXG4gICAgaGlzdG9yeTogcmF3U3RhdGUgJiYgcmF3U3RhdGUuaGlzdG9yeSA/IHJhd1N0YXRlLmhpc3RvcnkgOiBbXSxcbiAgICBwcm92aWRlcnM6IG5ldyBNYXAoKSxcbiAgICBwcm92aWRlclN0YXR1c2VzOiBuZXcgTWFwKCksXG5cbiAgICAvLyBUaGlzIHZhbHVlIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgdmFsdWUgZm9ybSB0aGUgY29uZmlnLiBXZSBqdXN0IHVzZSBgUE9TSVRJVkVfSU5GSU5JVFlgXG4gICAgLy8gaGVyZSB0byBjb25mb3JtIHRvIHRoZSBBcHBTdGF0ZSB0eXBlIGRlZmludGlvbi5cbiAgICBtYXhNZXNzYWdlQ291bnQ6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVzZXJpYWxpemVSZWNvcmQocmVjb3JkOiBPYmplY3QpOiBSZWNvcmQge1xuICByZXR1cm4ge1xuICAgIC4uLnJlY29yZCxcbiAgICB0aW1lc3RhbXA6IHBhcnNlRGF0ZShyZWNvcmQudGltZXN0YW1wKSB8fCBuZXcgRGF0ZSgwKSxcbiAgICAvLyBBdCBvbmUgcG9pbnQgaW4gdGhlIHRpbWUgdGhlIG1lc3NhZ2VJZCB3YXMgYSBudW1iZXIsIHNvIHRoZSB1c2VyIG1pZ2h0XG4gICAgLy8gaGF2ZSBhIG51bWJlciBzZXJpYWxpemVkLlxuICAgIG1lc3NhZ2VJZDpcbiAgICAgIHJlY29yZCA9PSBudWxsIHx8XG4gICAgICByZWNvcmQubWVzc2FnZUlkID09IG51bGwgfHxcbiAgICAgIC8vIFNpZ2guIFdlIChJLCAtamVsZHJlZGdlKSBoYWQgYSBidWcgYXQgb25lIHBvaW50IHdoZXJlIHdlIGFjY2lkZW50YWxseVxuICAgICAgLy8gY29udmVydGVkIHNlcmlhbGl6ZWQgdmFsdWVzIG9mIGB1bmRlZmluZWRgIHRvIHRoZSBzdHJpbmcgYFwidW5kZWZpZW5kXCJgLlxuICAgICAgLy8gVGhvc2UgY291bGQgdGhlbiBoYXZlIGJlZW4gc2VyaWFsaXplZCBiYWNrIHRvIGRpc2suIFNvLCBmb3IgYSBsaXR0bGVcbiAgICAgIC8vIHdoaWxlIGF0IGxlYXN0LCB3ZSBzaG91bGQgZW5zdXJlIHdlIGZpeCB0aGVzZSBiYWQgdmFsdWVzLlxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgPyB1bmRlZmluZWRcbiAgICAgICAgOiBTdHJpbmcocmVjb3JkLm1lc3NhZ2VJZCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGF0ZShyYXc6ID9zdHJpbmcpOiA/RGF0ZSB7XG4gIGlmIChyYXcgPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShyYXcpO1xuICByZXR1cm4gaXNOYU4oZGF0ZS5nZXRUaW1lKCkpID8gbnVsbCA6IGRhdGU7XG59XG5cbmNyZWF0ZVBhY2thZ2UobW9kdWxlLmV4cG9ydHMsIEFjdGl2YXRpb24pO1xuIl19