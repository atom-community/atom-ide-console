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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsiTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyIsIk1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyIsIkFjdGl2YXRpb24iLCJjb25zdHJ1Y3RvciIsInJhd1N0YXRlIiwiX2Rpc3Bvc2FibGVzIiwiX3Jhd1N0YXRlIiwiX3N0b3JlIiwiX25leHRNZXNzYWdlSWQiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYXRvbSIsImNvbnRleHRNZW51IiwiYWRkIiwibGFiZWwiLCJjb21tYW5kIiwiY29tbWFuZHMiLCJldmVudCIsImVsIiwidGFyZ2V0IiwiaW5uZXJUZXh0IiwiY2xpcGJvYXJkIiwid3JpdGUiLCJfZ2V0U3RvcmUiLCJkaXNwYXRjaCIsIkFjdGlvbnMiLCJjbGVhclJlY29yZHMiLCJmZWF0dXJlQ29uZmlnIiwib2JzZXJ2ZSIsIm1heE1lc3NhZ2VDb3VudCIsInNldE1heE1lc3NhZ2VDb3VudCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwiY2IiLCJjb25maWciLCJvYnNlcnZlQXNTdHJlYW0iLCJmb250U2l6ZSIsImZvbnRTY2FsZSIsInBhcnNlRmxvYXQiLCJtYXAiLCJzZXRGb250U2l6ZSIsInN1YnNjcmliZSIsIl9yZWdpc3RlckNvbW1hbmRBbmRPcGVuZXIiLCJpbml0aWFsU3RhdGUiLCJkZXNlcmlhbGl6ZUFwcFN0YXRlIiwicm9vdEVwaWMiLCJFcGljcyIsIlJlZHVjZXJzIiwiZGlzcG9zZSIsImNvbnN1bWVUb29sQmFyIiwiZ2V0VG9vbEJhciIsInRvb2xCYXIiLCJhZGRCdXR0b24iLCJpY29uIiwiY2FsbGJhY2siLCJ0b29sdGlwIiwicHJpb3JpdHkiLCJyZW1vdmVJdGVtcyIsImNvbnN1bWVQYXN0ZVByb3ZpZGVyIiwicHJvdmlkZXIiLCJjcmVhdGVQYXN0ZSIsInNldENyZWF0ZVBhc3RlRnVuY3Rpb24iLCJnZXRTdGF0ZSIsImNyZWF0ZVBhc3RlRnVuY3Rpb24iLCJjb25zdW1lV2F0Y2hFZGl0b3IiLCJ3YXRjaEVkaXRvciIsInNldFdhdGNoRWRpdG9yIiwicHJvdmlkZUF1dG9jb21wbGV0ZSIsImFjdGl2YXRpb24iLCJsYWJlbHMiLCJzZWxlY3RvciIsInN1Z2dlc3Rpb25Qcmlvcml0eSIsImdldFN1Z2dlc3Rpb25zIiwicmVxdWVzdCIsInByZWZpeCIsImVkaXRvciIsImdldFRleHQiLCJoaXN0b3J5Iiwic2VlbiIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsInRleHQiLCJzdGFydHNXaXRoIiwicmVwbGFjZW1lbnRQcmVmaXgiLCJ3b3Jrc3BhY2UiLCJhZGRPcGVuZXIiLCJ1cmkiLCJXT1JLU1BBQ0VfVklFV19VUkkiLCJDb25zb2xlIiwic3RvcmUiLCJpdGVtIiwidG9nZ2xlIiwiZGVzZXJpYWxpemVDb25zb2xlIiwic3RhdGUiLCJpbml0aWFsRmlsdGVyVGV4dCIsImZpbHRlclRleHQiLCJpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJ1bnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RlZFNldmVyaXRpZXMiLCJwcm92aWRlQ29uc29sZSIsImNyZWF0ZVRva2VuIiwibWVzc2FnZUlkIiwiZmluZE1lc3NhZ2UiLCJpbmNvbXBsZXRlUmVjb3JkcyIsImZpbmQiLCJyIiwiT2JqZWN0IiwiZnJlZXplIiwiZ2V0Q3VycmVudFRleHQiLCJnZXRDdXJyZW50TGV2ZWwiLCJsZXZlbCIsInNldExldmVsIiwibmV3TGV2ZWwiLCJ1cGRhdGVNZXNzYWdlIiwiYXBwZW5kVGV4dCIsInNldENvbXBsZXRlIiwib3ZlcnJpZGVMZXZlbCIsInJlY29yZFVwZGF0ZWQiLCJzb3VyY2VJbmZvIiwiZGlzcG9zZWQiLCJyZWdpc3RlclNvdXJjZSIsImNvbnNvbGUiLCJsb2ciLCJvYmplY3QiLCJhcHBlbmQiLCJ3YXJuIiwiZXJyb3IiLCJpbmZvIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJpbmNvbXBsZXRlIiwiQm9vbGVhbiIsInJlY29yZCIsImZvcm1hdCIsImV4cHJlc3Npb25zIiwidGFncyIsInNjb3BlTmFtZSIsInNvdXJjZUlkIiwiaWQiLCJzb3VyY2VOYW1lIiwibmFtZSIsImtpbmQiLCJ0aW1lc3RhbXAiLCJEYXRlIiwicmVwZWF0Q291bnQiLCJ0b2tlbiIsInV1aWQiLCJ2NCIsInJlY29yZFJlY2VpdmVkIiwic2V0U3RhdHVzIiwic3RhdHVzIiwidXBkYXRlU3RhdHVzIiwicmVtb3ZlU291cmNlIiwicHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IiLCJleGVjdXRvciIsInJlZ2lzdGVyRXhlY3V0b3IiLCJ1bnJlZ2lzdGVyRXhlY3V0b3IiLCJzZXJpYWxpemUiLCJtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzIiwiZ2V0IiwibWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5IiwicmVjb3JkcyIsInNsaWNlIiwidG9BcnJheSIsInJlc3QiLCJleGVjdXRvcnMiLCJNYXAiLCJjdXJyZW50RXhlY3V0b3JJZCIsImRlc2VyaWFsaXplUmVjb3JkIiwicHJvdmlkZXJzIiwicHJvdmlkZXJTdGF0dXNlcyIsIk51bWJlciIsIlBPU0lUSVZFX0lORklOSVRZIiwicGFyc2VEYXRlIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicmF3IiwiZGF0ZSIsImlzTmFOIiwiZ2V0VGltZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBNEJBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQTlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBaUJBO0FBcUJBLE1BQU1BLGtDQUFrQyxHQUN0Qyw0Q0FERjtBQUVBLE1BQU1DLGlDQUFpQyxHQUNy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QWNHLE1BQU0sQ0FBQ0MsT0FBckIsRUFBOEJ2TCxVQUE5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXHJcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxyXG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cclxuICpcclxuICogQGZsb3dcclxuICogQGZvcm1hdFxyXG4gKi9cclxuXHJcbmltcG9ydCB0eXBlIHtcclxuICBBcHBTdGF0ZSxcclxuICBDb25zb2xlUGVyc2lzdGVkU3RhdGUsXHJcbiAgQ29uc29sZVNlcnZpY2UsXHJcbiAgU291cmNlSW5mbyxcclxuICBNZXNzYWdlLFxyXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXHJcbiAgUmVjb3JkLFxyXG4gIFJlY29yZFRva2VuLFxyXG4gIFJlZ2lzdGVyRXhlY3V0b3JGdW5jdGlvbixcclxuICBTdG9yZSxcclxuICBMZXZlbCxcclxufSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHR5cGUge0NyZWF0ZVBhc3RlRnVuY3Rpb259IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuLy8gbG9hZCBzdHlsZXNcclxuaW1wb3J0IFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWlcIlxyXG5cclxuaW1wb3J0IHtMaXN0fSBmcm9tICdpbW11dGFibGUnO1xyXG5pbXBvcnQgY3JlYXRlUGFja2FnZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL2NyZWF0ZVBhY2thZ2UnO1xyXG5pbXBvcnQge2Rlc3Ryb3lJdGVtV2hlcmV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vZGVzdHJveUl0ZW1XaGVyZSc7XHJcbmltcG9ydCB7Y29tYmluZUVwaWNzRnJvbUltcG9ydHN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2VwaWNIZWxwZXJzJztcclxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xyXG5pbXBvcnQge2NyZWF0ZUVwaWNNaWRkbGV3YXJlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9yZWR1eC1vYnNlcnZhYmxlJztcclxuaW1wb3J0IHtvYnNlcnZhYmxlRnJvbVN1YnNjcmliZUZ1bmN0aW9ufSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9ldmVudCc7XHJcbmltcG9ydCBmZWF0dXJlQ29uZmlnIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vZmVhdHVyZS1jb25maWcnO1xyXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcclxuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tICcuL3JlZHV4L0FjdGlvbnMnO1xyXG5pbXBvcnQgKiBhcyBFcGljcyBmcm9tICcuL3JlZHV4L0VwaWNzJztcclxuaW1wb3J0IFJlZHVjZXJzIGZyb20gJy4vcmVkdXgvUmVkdWNlcnMnO1xyXG5pbXBvcnQge0NvbnNvbGUsIFdPUktTUEFDRV9WSUVXX1VSSX0gZnJvbSAnLi91aS9Db25zb2xlJztcclxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQge2FwcGx5TWlkZGxld2FyZSwgY3JlYXRlU3RvcmV9IGZyb20gJ3JlZHV4L2Rpc3QvcmVkdXgubWluLmpzJztcclxuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSAnbnVsbHRocm93cyc7XHJcbmltcG9ydCB1dWlkIGZyb20gJ3V1aWQnO1xyXG5cclxuY29uc3QgTUFYSU1VTV9TRVJJQUxJWkVEX01FU1NBR0VTX0NPTkZJRyA9XHJcbiAgJ2F0b20taWRlLWNvbnNvbGUubWF4aW11bVNlcmlhbGl6ZWRNZXNzYWdlcyc7XHJcbmNvbnN0IE1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyA9XHJcbiAgJ2F0b20taWRlLWNvbnNvbGUubWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5JztcclxuXHJcbmNsYXNzIEFjdGl2YXRpb24ge1xyXG4gIF9kaXNwb3NhYmxlczogVW5pdmVyc2FsRGlzcG9zYWJsZTtcclxuICBfcmF3U3RhdGU6ID9PYmplY3Q7XHJcbiAgX3N0b3JlOiBTdG9yZTtcclxuICBfbmV4dE1lc3NhZ2VJZDogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihyYXdTdGF0ZTogP09iamVjdCkge1xyXG4gICAgdGhpcy5fcmF3U3RhdGUgPSByYXdTdGF0ZTtcclxuICAgIHRoaXMuX25leHRNZXNzYWdlSWQgPSAwO1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZXMgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZShcclxuICAgICAgYXRvbS5jb250ZXh0TWVudS5hZGQoe1xyXG4gICAgICAgICcuY29uc29sZS1yZWNvcmQnOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGxhYmVsOiAnQ29weSBNZXNzYWdlJyxcclxuICAgICAgICAgICAgY29tbWFuZDogJ2NvbnNvbGU6Y29weS1tZXNzYWdlJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSksXHJcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCcuY29uc29sZS1yZWNvcmQnLCAnY29uc29sZTpjb3B5LW1lc3NhZ2UnLCBldmVudCA9PiB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgLy8gJEZsb3dGaXhNZSg+PTAuNjguMCkgRmxvdyBzdXBwcmVzcyAoVDI3MTg3ODU3KVxyXG4gICAgICAgIGlmIChlbCA9PSBudWxsIHx8IHR5cGVvZiBlbC5pbm5lclRleHQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGVsLmlubmVyVGV4dCk7XHJcbiAgICAgIH0pLFxyXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29uc29sZTpjbGVhcicsICgpID0+XHJcbiAgICAgICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLmNsZWFyUmVjb3JkcygpKSxcclxuICAgICAgKSxcclxuICAgICAgZmVhdHVyZUNvbmZpZy5vYnNlcnZlKFxyXG4gICAgICAgICdhdG9tLWlkZS1jb25zb2xlLm1heGltdW1NZXNzYWdlQ291bnQnLFxyXG4gICAgICAgIChtYXhNZXNzYWdlQ291bnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChcclxuICAgICAgICAgICAgQWN0aW9ucy5zZXRNYXhNZXNzYWdlQ291bnQobWF4TWVzc2FnZUNvdW50KSxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgKSxcclxuICAgICAgT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgIG9ic2VydmFibGVGcm9tU3Vic2NyaWJlRnVuY3Rpb24oY2IgPT5cclxuICAgICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2VkaXRvci5mb250U2l6ZScsIGNiKSxcclxuICAgICAgICApLFxyXG4gICAgICAgIGZlYXR1cmVDb25maWcub2JzZXJ2ZUFzU3RyZWFtKCdhdG9tLWlkZS1jb25zb2xlLmZvbnRTY2FsZScpLFxyXG4gICAgICAgIChmb250U2l6ZSwgZm9udFNjYWxlKSA9PiBmb250U2l6ZSAqIHBhcnNlRmxvYXQoZm9udFNjYWxlKSxcclxuICAgICAgKVxyXG4gICAgICAgIC5tYXAoQWN0aW9ucy5zZXRGb250U2l6ZSlcclxuICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX3N0b3JlLmRpc3BhdGNoKSxcclxuICAgICAgdGhpcy5fcmVnaXN0ZXJDb21tYW5kQW5kT3BlbmVyKCksXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgX2dldFN0b3JlKCk6IFN0b3JlIHtcclxuICAgIGlmICh0aGlzLl9zdG9yZSA9PSBudWxsKSB7XHJcbiAgICAgIGNvbnN0IGluaXRpYWxTdGF0ZSA9IGRlc2VyaWFsaXplQXBwU3RhdGUodGhpcy5fcmF3U3RhdGUpO1xyXG4gICAgICBjb25zdCByb290RXBpYyA9IGNvbWJpbmVFcGljc0Zyb21JbXBvcnRzKEVwaWNzLCAnYXRvbS1pZGUtdWknKTtcclxuICAgICAgdGhpcy5fc3RvcmUgPSBjcmVhdGVTdG9yZShcclxuICAgICAgICBSZWR1Y2VycyxcclxuICAgICAgICBpbml0aWFsU3RhdGUsXHJcbiAgICAgICAgYXBwbHlNaWRkbGV3YXJlKGNyZWF0ZUVwaWNNaWRkbGV3YXJlKHJvb3RFcGljKSksXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fc3RvcmU7XHJcbiAgfVxyXG5cclxuICBkaXNwb3NlKCkge1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3VtZVRvb2xCYXIoZ2V0VG9vbEJhcjogdG9vbGJhciRHZXRUb29sYmFyKTogdm9pZCB7XHJcbiAgICBjb25zdCB0b29sQmFyID0gZ2V0VG9vbEJhcignbnVjbGlkZS1jb25zb2xlJyk7XHJcbiAgICB0b29sQmFyLmFkZEJ1dHRvbih7XHJcbiAgICAgIGljb246ICdudWNsaWNvbi1jb25zb2xlJyxcclxuICAgICAgY2FsbGJhY2s6ICdjb25zb2xlOnRvZ2dsZScsXHJcbiAgICAgIHRvb2x0aXA6ICdUb2dnbGUgQ29uc29sZScsXHJcbiAgICAgIHByaW9yaXR5OiA3MDAsXHJcbiAgICB9KTtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XHJcbiAgICAgIHRvb2xCYXIucmVtb3ZlSXRlbXMoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3VtZVBhc3RlUHJvdmlkZXIocHJvdmlkZXI6IGFueSk6IElEaXNwb3NhYmxlIHtcclxuICAgIGNvbnN0IGNyZWF0ZVBhc3RlOiBDcmVhdGVQYXN0ZUZ1bmN0aW9uID0gcHJvdmlkZXIuY3JlYXRlUGFzdGU7XHJcbiAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0Q3JlYXRlUGFzdGVGdW5jdGlvbihjcmVhdGVQYXN0ZSkpO1xyXG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCgpID0+IHtcclxuICAgICAgaWYgKHRoaXMuX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS5jcmVhdGVQYXN0ZUZ1bmN0aW9uID09PSBjcmVhdGVQYXN0ZSkge1xyXG4gICAgICAgIHRoaXMuX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5zZXRDcmVhdGVQYXN0ZUZ1bmN0aW9uKG51bGwpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdW1lV2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3I6IGF0b20kQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICB0aGlzLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMuc2V0V2F0Y2hFZGl0b3Iod2F0Y2hFZGl0b3IpKTtcclxuICAgIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgoKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLl9nZXRTdG9yZSgpLmdldFN0YXRlKCkud2F0Y2hFZGl0b3IgPT09IHdhdGNoRWRpdG9yKSB7XHJcbiAgICAgICAgdGhpcy5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnNldFdhdGNoRWRpdG9yKG51bGwpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcm92aWRlQXV0b2NvbXBsZXRlKCk6IGF0b20kQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xyXG4gICAgY29uc3QgYWN0aXZhdGlvbiA9IHRoaXM7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBsYWJlbHM6IFsnbnVjbGlkZS1jb25zb2xlJ10sXHJcbiAgICAgIHNlbGVjdG9yOiAnKicsXHJcbiAgICAgIC8vIENvcGllcyBDaHJvbWUgZGV2dG9vbHMgYW5kIHB1dHMgaGlzdG9yeSBzdWdnZXN0aW9ucyBhdCB0aGUgYm90dG9tLlxyXG4gICAgICBzdWdnZXN0aW9uUHJpb3JpdHk6IC0xLFxyXG4gICAgICBhc3luYyBnZXRTdWdnZXN0aW9ucyhyZXF1ZXN0KSB7XHJcbiAgICAgICAgLy8gSGlzdG9yeSBwcm92aWRlcyBzdWdnZXN0aW9uIG9ubHkgb24gZXhhY3QgbWF0Y2ggdG8gY3VycmVudCBpbnB1dC5cclxuICAgICAgICBjb25zdCBwcmVmaXggPSByZXF1ZXN0LmVkaXRvci5nZXRUZXh0KCk7XHJcbiAgICAgICAgY29uc3QgaGlzdG9yeSA9IGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZ2V0U3RhdGUoKS5oaXN0b3J5O1xyXG4gICAgICAgIC8vIFVzZSBhIHNldCB0byByZW1vdmUgZHVwbGljYXRlcy5cclxuICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldChoaXN0b3J5KTtcclxuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShzZWVuKVxyXG4gICAgICAgICAgLmZpbHRlcih0ZXh0ID0+IHRleHQuc3RhcnRzV2l0aChwcmVmaXgpKVxyXG4gICAgICAgICAgLm1hcCh0ZXh0ID0+ICh7dGV4dCwgcmVwbGFjZW1lbnRQcmVmaXg6IHByZWZpeH0pKTtcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBfcmVnaXN0ZXJDb21tYW5kQW5kT3BlbmVyKCk6IFVuaXZlcnNhbERpc3Bvc2FibGUge1xyXG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKFxyXG4gICAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIodXJpID0+IHtcclxuICAgICAgICBpZiAodXJpID09PSBXT1JLU1BBQ0VfVklFV19VUkkpIHtcclxuICAgICAgICAgIHJldHVybiBuZXcgQ29uc29sZSh7c3RvcmU6IHRoaXMuX2dldFN0b3JlKCl9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgICAoKSA9PiBkZXN0cm95SXRlbVdoZXJlKGl0ZW0gPT4gaXRlbSBpbnN0YW5jZW9mIENvbnNvbGUpLFxyXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnY29uc29sZTp0b2dnbGUnLCAoKSA9PiB7XHJcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UudG9nZ2xlKFdPUktTUEFDRV9WSUVXX1VSSSk7XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGRlc2VyaWFsaXplQ29uc29sZShzdGF0ZTogQ29uc29sZVBlcnNpc3RlZFN0YXRlKTogQ29uc29sZSB7XHJcbiAgICByZXR1cm4gbmV3IENvbnNvbGUoe1xyXG4gICAgICBzdG9yZTogdGhpcy5fZ2V0U3RvcmUoKSxcclxuICAgICAgaW5pdGlhbEZpbHRlclRleHQ6IHN0YXRlLmZpbHRlclRleHQsXHJcbiAgICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI6IHN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllczogbmV3IFNldChzdGF0ZS51bnNlbGVjdGVkU2V2ZXJpdGllcyB8fCBbXSksXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoaXMgc2VydmljZSBwcm92aWRlcyBhIGZhY3RvcnkgZm9yIGNyZWF0aW5nIGEgY29uc29sZSBvYmplY3QgdGllZCB0byBhIHBhcnRpY3VsYXIgc291cmNlLiBJZlxyXG4gICAqIHRoZSBjb25zdW1lciB3YW50cyB0byBleHBvc2Ugc3RhcnRpbmcgYW5kIHN0b3BwaW5nIGZ1bmN0aW9uYWxpdHkgdGhyb3VnaCB0aGUgQ29uc29sZSBVSSAoZm9yXHJcbiAgICogZXhhbXBsZSwgdG8gYWxsb3cgdGhlIHVzZXIgdG8gZGVjaWRlIHdoZW4gdG8gc3RhcnQgYW5kIHN0b3AgdGFpbGluZyBsb2dzKSwgdGhleSBjYW4gaW5jbHVkZVxyXG4gICAqIGBzdGFydCgpYCBhbmQgYHN0b3AoKWAgZnVuY3Rpb25zIG9uIHRoZSBvYmplY3QgdGhleSBwYXNzIHRvIHRoZSBmYWN0b3J5LlxyXG4gICAqXHJcbiAgICogV2hlbiB0aGUgZmFjdG9yeSBpcyBpbnZva2VkLCB0aGUgc291cmNlIHdpbGwgYmUgYWRkZWQgdG8gdGhlIENvbnNvbGUgVUkncyBmaWx0ZXIgbGlzdC4gVGhlXHJcbiAgICogZmFjdG9yeSByZXR1cm5zIGEgRGlzcG9zYWJsZSB3aGljaCBzaG91bGQgYmUgZGlzcG9zZWQgb2Ygd2hlbiB0aGUgc291cmNlIGdvZXMgYXdheSAoZS5nLiBpdHNcclxuICAgKiBwYWNrYWdlIGlzIGRpc2FibGVkKS4gVGhpcyB3aWxsIHJlbW92ZSB0aGUgc291cmNlIGZyb20gdGhlIENvbnNvbGUgVUkncyBmaWx0ZXIgbGlzdCAoYXMgbG9uZyBhc1xyXG4gICAqIHRoZXJlIGFyZW4ndCBhbnkgcmVtYWluaW5nIG1lc3NhZ2VzIGZyb20gdGhlIHNvdXJjZSkuXHJcbiAgICovXHJcbiAgcHJvdmlkZUNvbnNvbGUoKTogQ29uc29sZVNlcnZpY2Uge1xyXG4gICAgLy8gQ3JlYXRlIGEgbG9jYWwsIG51bGxhYmxlIHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzZXJ2aWNlIGNvbnN1bWVycyBkb24ndCBrZWVwIHRoZSBBY3RpdmF0aW9uXHJcbiAgICAvLyBpbnN0YW5jZSBpbiBtZW1vcnkuXHJcbiAgICBsZXQgYWN0aXZhdGlvbiA9IHRoaXM7XHJcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoKCkgPT4ge1xyXG4gICAgICBhY3RpdmF0aW9uID0gbnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZXMgYW4gb2JqZXQgd2l0aCBjYWxsYmFja3MgdG8gcmVxdWVzdCBtYW5pcHVsYXRpb25zIG9uIHRoZSBjdXJyZW50XHJcbiAgICAvLyBjb25zb2xlIG1lc3NhZ2UgZW50cnkuXHJcbiAgICBjb25zdCBjcmVhdGVUb2tlbiA9IChtZXNzYWdlSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICBjb25zdCBmaW5kTWVzc2FnZSA9ICgpID0+IHtcclxuICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsKTtcclxuICAgICAgICByZXR1cm4gbnVsbHRocm93cyhcclxuICAgICAgICAgIGFjdGl2YXRpb25cclxuICAgICAgICAgICAgLl9nZXRTdG9yZSgpXHJcbiAgICAgICAgICAgIC5nZXRTdGF0ZSgpXHJcbiAgICAgICAgICAgIC5pbmNvbXBsZXRlUmVjb3Jkcy5maW5kKHIgPT4gci5tZXNzYWdlSWQgPT09IG1lc3NhZ2VJZCksXHJcbiAgICAgICAgKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcclxuICAgICAgICAvLyBNZXNzYWdlIG5lZWRzIHRvIGJlIGxvb2tlZCB1cCBsYXppbHkgYXQgY2FsbCB0aW1lIHJhdGhlciB0aGFuXHJcbiAgICAgICAgLy8gY2FjaGVkIGluIHRoaXMgb2JqZWN0IHRvIGF2b2lkIHJlcXVpcmluZyB0aGUgdXBkYXRlIGFjdGlvbiB0b1xyXG4gICAgICAgIC8vIG9wZXJhdGUgc3luY2hyb25vdXNseS4gV2hlbiB3ZSBhcHBlbmQgdGV4dCwgd2UgZG9uJ3Qga25vdyB0aGVcclxuICAgICAgICAvLyBmdWxsIG5ldyB0ZXh0IHdpdGhvdXQgbG9va2luZyB1cCB0aGUgbmV3IG1lc3NhZ2Ugb2JqZWN0IGluIHRoZVxyXG4gICAgICAgIC8vIG5ldyBzdG9yZSBzdGF0ZSBhZnRlciB0aGUgbXV0YXRpb24uXHJcbiAgICAgICAgZ2V0Q3VycmVudFRleHQ6ICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiBmaW5kTWVzc2FnZSgpLnRleHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRDdXJyZW50TGV2ZWw6ICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiBmaW5kTWVzc2FnZSgpLmxldmVsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0TGV2ZWw6IChuZXdMZXZlbDogTGV2ZWwpID0+IHtcclxuICAgICAgICAgIHJldHVybiB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgbnVsbCwgbmV3TGV2ZWwsIGZhbHNlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFwcGVuZFRleHQ6ICh0ZXh0OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgIHJldHVybiB1cGRhdGVNZXNzYWdlKG1lc3NhZ2VJZCwgdGV4dCwgbnVsbCwgZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0Q29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgIHVwZGF0ZU1lc3NhZ2UobWVzc2FnZUlkLCBudWxsLCBudWxsLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgdXBkYXRlTWVzc2FnZSA9IChcclxuICAgICAgbWVzc2FnZUlkOiBzdHJpbmcsXHJcbiAgICAgIGFwcGVuZFRleHQ6ID9zdHJpbmcsXHJcbiAgICAgIG92ZXJyaWRlTGV2ZWw6ID9MZXZlbCxcclxuICAgICAgc2V0Q29tcGxldGU6IGJvb2xlYW4sXHJcbiAgICApID0+IHtcclxuICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XHJcbiAgICAgIGFjdGl2YXRpb25cclxuICAgICAgICAuX2dldFN0b3JlKClcclxuICAgICAgICAuZGlzcGF0Y2goXHJcbiAgICAgICAgICBBY3Rpb25zLnJlY29yZFVwZGF0ZWQoXHJcbiAgICAgICAgICAgIG1lc3NhZ2VJZCxcclxuICAgICAgICAgICAgYXBwZW5kVGV4dCxcclxuICAgICAgICAgICAgb3ZlcnJpZGVMZXZlbCxcclxuICAgICAgICAgICAgc2V0Q29tcGxldGUsXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICk7XHJcbiAgICAgIHJldHVybiBjcmVhdGVUb2tlbihtZXNzYWdlSWQpO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gKHNvdXJjZUluZm86IFNvdXJjZUluZm8pID0+IHtcclxuICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XHJcbiAgICAgIGxldCBkaXNwb3NlZDtcclxuICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnJlZ2lzdGVyU291cmNlKHNvdXJjZUluZm8pKTtcclxuICAgICAgY29uc3QgY29uc29sZSA9IHtcclxuICAgICAgICAvLyBUT0RPOiBVcGRhdGUgdGhlc2UgdG8gYmUgKG9iamVjdDogYW55LCAuLi5vYmplY3RzOiBBcnJheTxhbnk+KTogdm9pZC5cclxuICAgICAgICBsb2cob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xyXG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHt0ZXh0OiBvYmplY3QsIGxldmVsOiAnbG9nJ30pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd2FybihvYmplY3Q6IHN0cmluZyk6ID9SZWNvcmRUb2tlbiB7XHJcbiAgICAgICAgICByZXR1cm4gY29uc29sZS5hcHBlbmQoe3RleHQ6IG9iamVjdCwgbGV2ZWw6ICd3YXJuaW5nJ30pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3Iob2JqZWN0OiBzdHJpbmcpOiA/UmVjb3JkVG9rZW4ge1xyXG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuYXBwZW5kKHt0ZXh0OiBvYmplY3QsIGxldmVsOiAnZXJyb3InfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpbmZvKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcclxuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ2luZm8nfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzKG9iamVjdDogc3RyaW5nKTogP1JlY29yZFRva2VuIHtcclxuICAgICAgICAgIHJldHVybiBjb25zb2xlLmFwcGVuZCh7dGV4dDogb2JqZWN0LCBsZXZlbDogJ3N1Y2Nlc3MnfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhcHBlbmQobWVzc2FnZTogTWVzc2FnZSk6ID9SZWNvcmRUb2tlbiB7XHJcbiAgICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsICYmICFkaXNwb3NlZCk7XHJcbiAgICAgICAgICBjb25zdCBpbmNvbXBsZXRlID0gQm9vbGVhbihtZXNzYWdlLmluY29tcGxldGUpO1xyXG4gICAgICAgICAgY29uc3QgcmVjb3JkOiBSZWNvcmQgPSB7XHJcbiAgICAgICAgICAgIC8vIEEgdW5pcXVlIG1lc3NhZ2UgSUQgaXMgbm90IHJlcXVpcmVkIGZvciBjb21wbGV0ZSBtZXNzYWdlcyxcclxuICAgICAgICAgICAgLy8gc2luY2UgdGhleSBjYW5ub3QgYmUgdXBkYXRlZCB0aGV5IGRvbid0IG5lZWQgdG8gYmUgZm91bmQgbGF0ZXIuXHJcbiAgICAgICAgICAgIHRleHQ6IG1lc3NhZ2UudGV4dCxcclxuICAgICAgICAgICAgbGV2ZWw6IG1lc3NhZ2UubGV2ZWwsXHJcbiAgICAgICAgICAgIGZvcm1hdDogbWVzc2FnZS5mb3JtYXQsXHJcbiAgICAgICAgICAgIGV4cHJlc3Npb25zOiBtZXNzYWdlLmV4cHJlc3Npb25zLFxyXG4gICAgICAgICAgICB0YWdzOiBtZXNzYWdlLnRhZ3MsXHJcbiAgICAgICAgICAgIHNjb3BlTmFtZTogbWVzc2FnZS5zY29wZU5hbWUsXHJcbiAgICAgICAgICAgIHNvdXJjZUlkOiBzb3VyY2VJbmZvLmlkLFxyXG4gICAgICAgICAgICBzb3VyY2VOYW1lOiBzb3VyY2VJbmZvLm5hbWUsXHJcbiAgICAgICAgICAgIGtpbmQ6IG1lc3NhZ2Uua2luZCB8fCAnbWVzc2FnZScsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSwgLy8gVE9ETzogQWxsb3cgdGhpcyB0byBjb21lIHdpdGggdGhlIG1lc3NhZ2U/XHJcbiAgICAgICAgICAgIHJlcGVhdENvdW50OiAxLFxyXG4gICAgICAgICAgICBpbmNvbXBsZXRlLFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBsZXQgdG9rZW4gPSBudWxsO1xyXG4gICAgICAgICAgaWYgKGluY29tcGxldGUpIHtcclxuICAgICAgICAgICAgLy8gQW4gSUQgaXMgb25seSByZXF1aXJlZCBmb3IgaW5jb21wbGV0ZSBtZXNzYWdlcywgd2hpY2ggbmVlZFxyXG4gICAgICAgICAgICAvLyB0byBiZSBsb29rZWQgdXAgZm9yIG11dGF0aW9ucy5cclxuICAgICAgICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9IHV1aWQudjQoKTtcclxuICAgICAgICAgICAgdG9rZW4gPSBjcmVhdGVUb2tlbihyZWNvcmQubWVzc2FnZUlkKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBhY3RpdmF0aW9uLl9nZXRTdG9yZSgpLmRpc3BhdGNoKEFjdGlvbnMucmVjb3JkUmVjZWl2ZWQocmVjb3JkKSk7XHJcbiAgICAgICAgICByZXR1cm4gdG9rZW47XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXRTdGF0dXMoc3RhdHVzOiBDb25zb2xlU291cmNlU3RhdHVzKTogdm9pZCB7XHJcbiAgICAgICAgICBpbnZhcmlhbnQoYWN0aXZhdGlvbiAhPSBudWxsICYmICFkaXNwb3NlZCk7XHJcbiAgICAgICAgICBhY3RpdmF0aW9uXHJcbiAgICAgICAgICAgIC5fZ2V0U3RvcmUoKVxyXG4gICAgICAgICAgICAuZGlzcGF0Y2goQWN0aW9ucy51cGRhdGVTdGF0dXMoc291cmNlSW5mby5pZCwgc3RhdHVzKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgICAgICAgaW52YXJpYW50KGFjdGl2YXRpb24gIT0gbnVsbCk7XHJcbiAgICAgICAgICBpZiAoIWRpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGRpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgYWN0aXZhdGlvblxyXG4gICAgICAgICAgICAgIC5fZ2V0U3RvcmUoKVxyXG4gICAgICAgICAgICAgIC5kaXNwYXRjaChBY3Rpb25zLnJlbW92ZVNvdXJjZShzb3VyY2VJbmZvLmlkKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIGNvbnNvbGU7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJvdmlkZVJlZ2lzdGVyRXhlY3V0b3IoKTogUmVnaXN0ZXJFeGVjdXRvckZ1bmN0aW9uIHtcclxuICAgIC8vIENyZWF0ZSBhIGxvY2FsLCBudWxsYWJsZSByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc2VydmljZSBjb25zdW1lcnMgZG9uJ3Qga2VlcCB0aGUgQWN0aXZhdGlvblxyXG4gICAgLy8gaW5zdGFuY2UgaW4gbWVtb3J5LlxyXG4gICAgbGV0IGFjdGl2YXRpb24gPSB0aGlzO1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKCgpID0+IHtcclxuICAgICAgYWN0aXZhdGlvbiA9IG51bGw7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZXhlY3V0b3IgPT4ge1xyXG4gICAgICBpbnZhcmlhbnQoXHJcbiAgICAgICAgYWN0aXZhdGlvbiAhPSBudWxsLFxyXG4gICAgICAgICdFeGVjdXRvciByZWdpc3RyYXRpb24gYXR0ZW1wdGVkIGFmdGVyIGRlYWN0aXZhdGlvbicsXHJcbiAgICAgICk7XHJcbiAgICAgIGFjdGl2YXRpb24uX2dldFN0b3JlKCkuZGlzcGF0Y2goQWN0aW9ucy5yZWdpc3RlckV4ZWN1dG9yKGV4ZWN1dG9yKSk7XHJcbiAgICAgIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgoKSA9PiB7XHJcbiAgICAgICAgaWYgKGFjdGl2YXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgYWN0aXZhdGlvbi5fZ2V0U3RvcmUoKS5kaXNwYXRjaChBY3Rpb25zLnVucmVnaXN0ZXJFeGVjdXRvcihleGVjdXRvcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgc2VyaWFsaXplKCk6IE9iamVjdCB7XHJcbiAgICBpZiAodGhpcy5fc3RvcmUgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4ge307XHJcbiAgICB9XHJcbiAgICBjb25zdCBtYXhpbXVtU2VyaWFsaXplZE1lc3NhZ2VzOiBudW1iZXIgPSAoZmVhdHVyZUNvbmZpZy5nZXQoXHJcbiAgICAgIE1BWElNVU1fU0VSSUFMSVpFRF9NRVNTQUdFU19DT05GSUcsXHJcbiAgICApOiBhbnkpO1xyXG4gICAgY29uc3QgbWF4aW11bVNlcmlhbGl6ZWRIaXN0b3J5OiBudW1iZXIgPSAoZmVhdHVyZUNvbmZpZy5nZXQoXHJcbiAgICAgIE1BWElNVU1fU0VSSUFMSVpFRF9ISVNUT1JZX0NPTkZJRyxcclxuICAgICk6IGFueSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZWNvcmRzOiB0aGlzLl9zdG9yZVxyXG4gICAgICAgIC5nZXRTdGF0ZSgpXHJcbiAgICAgICAgLnJlY29yZHMuc2xpY2UoLW1heGltdW1TZXJpYWxpemVkTWVzc2FnZXMpXHJcbiAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgIC5tYXAocmVjb3JkID0+IHtcclxuICAgICAgICAgIC8vIGBFeGVjdXRvcmAgaXMgbm90IHNlcmlhbGl6YWJsZS4gTWFrZSBzdXJlIHRvIHJlbW92ZSBpdCBmaXJzdC5cclxuICAgICAgICAgIGNvbnN0IHtleGVjdXRvciwgLi4ucmVzdH0gPSByZWNvcmQ7XHJcbiAgICAgICAgICByZXR1cm4gcmVzdDtcclxuICAgICAgICB9KSxcclxuICAgICAgaGlzdG9yeTogdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKS5oaXN0b3J5LnNsaWNlKC1tYXhpbXVtU2VyaWFsaXplZEhpc3RvcnkpLFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlc2VyaWFsaXplQXBwU3RhdGUocmF3U3RhdGU6ID9PYmplY3QpOiBBcHBTdGF0ZSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGV4ZWN1dG9yczogbmV3IE1hcCgpLFxyXG4gICAgY3JlYXRlUGFzdGVGdW5jdGlvbjogbnVsbCxcclxuICAgIGN1cnJlbnRFeGVjdXRvcklkOiBudWxsLFxyXG4gICAgcmVjb3JkczpcclxuICAgICAgcmF3U3RhdGUgJiYgcmF3U3RhdGUucmVjb3Jkc1xyXG4gICAgICAgID8gTGlzdChyYXdTdGF0ZS5yZWNvcmRzLm1hcChkZXNlcmlhbGl6ZVJlY29yZCkpXHJcbiAgICAgICAgOiBMaXN0KCksXHJcbiAgICBpbmNvbXBsZXRlUmVjb3JkczpcclxuICAgICAgcmF3U3RhdGUgJiYgcmF3U3RhdGUuaW5jb21wbGV0ZVJlY29yZHNcclxuICAgICAgICA/IExpc3QocmF3U3RhdGUuaW5jb21wbGV0ZVJlY29yZHMubWFwKGRlc2VyaWFsaXplUmVjb3JkKSlcclxuICAgICAgICA6IExpc3QoKSxcclxuICAgIGhpc3Rvcnk6IHJhd1N0YXRlICYmIHJhd1N0YXRlLmhpc3RvcnkgPyByYXdTdGF0ZS5oaXN0b3J5IDogW10sXHJcbiAgICBwcm92aWRlcnM6IG5ldyBNYXAoKSxcclxuICAgIHByb3ZpZGVyU3RhdHVzZXM6IG5ldyBNYXAoKSxcclxuXHJcbiAgICAvLyBUaGlzIHZhbHVlIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgdmFsdWUgZm9ybSB0aGUgY29uZmlnLiBXZSBqdXN0IHVzZSBgUE9TSVRJVkVfSU5GSU5JVFlgXHJcbiAgICAvLyBoZXJlIHRvIGNvbmZvcm0gdG8gdGhlIEFwcFN0YXRlIHR5cGUgZGVmaW50aW9uLlxyXG4gICAgbWF4TWVzc2FnZUNvdW50OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVzZXJpYWxpemVSZWNvcmQocmVjb3JkOiBPYmplY3QpOiBSZWNvcmQge1xyXG4gIHJldHVybiB7XHJcbiAgICAuLi5yZWNvcmQsXHJcbiAgICB0aW1lc3RhbXA6IHBhcnNlRGF0ZShyZWNvcmQudGltZXN0YW1wKSB8fCBuZXcgRGF0ZSgwKSxcclxuICAgIC8vIEF0IG9uZSBwb2ludCBpbiB0aGUgdGltZSB0aGUgbWVzc2FnZUlkIHdhcyBhIG51bWJlciwgc28gdGhlIHVzZXIgbWlnaHRcclxuICAgIC8vIGhhdmUgYSBudW1iZXIgc2VyaWFsaXplZC5cclxuICAgIG1lc3NhZ2VJZDpcclxuICAgICAgcmVjb3JkID09IG51bGwgfHxcclxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCA9PSBudWxsIHx8XHJcbiAgICAgIC8vIFNpZ2guIFdlIChJLCAtamVsZHJlZGdlKSBoYWQgYSBidWcgYXQgb25lIHBvaW50IHdoZXJlIHdlIGFjY2lkZW50YWxseVxyXG4gICAgICAvLyBjb252ZXJ0ZWQgc2VyaWFsaXplZCB2YWx1ZXMgb2YgYHVuZGVmaW5lZGAgdG8gdGhlIHN0cmluZyBgXCJ1bmRlZmllbmRcImAuXHJcbiAgICAgIC8vIFRob3NlIGNvdWxkIHRoZW4gaGF2ZSBiZWVuIHNlcmlhbGl6ZWQgYmFjayB0byBkaXNrLiBTbywgZm9yIGEgbGl0dGxlXHJcbiAgICAgIC8vIHdoaWxlIGF0IGxlYXN0LCB3ZSBzaG91bGQgZW5zdXJlIHdlIGZpeCB0aGVzZSBiYWQgdmFsdWVzLlxyXG4gICAgICByZWNvcmQubWVzc2FnZUlkID09PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgID8gdW5kZWZpbmVkXHJcbiAgICAgICAgOiBTdHJpbmcocmVjb3JkLm1lc3NhZ2VJZCksXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VEYXRlKHJhdzogP3N0cmluZyk6ID9EYXRlIHtcclxuICBpZiAocmF3ID09IG51bGwpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBjb25zdCBkYXRlID0gbmV3IERhdGUocmF3KTtcclxuICByZXR1cm4gaXNOYU4oZGF0ZS5nZXRUaW1lKCkpID8gbnVsbCA6IGRhdGU7XHJcbn1cclxuXHJcbmNyZWF0ZVBhY2thZ2UobW9kdWxlLmV4cG9ydHMsIEFjdGl2YXRpb24pO1xyXG4iXX0=