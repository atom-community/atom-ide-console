"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Console = exports.WORKSPACE_VIEW_URI = void 0;

var _observePaneItemVisibility = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-atom/observePaneItemVisibility"));

var _collection = require("@atom-ide-community/nuclide-commons/collection");

var _Model = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/Model"));

var _shallowequal = _interopRequireDefault(require("shallowequal"));

var _bindObservableAsProps = require("@atom-ide-community/nuclide-commons-ui/bindObservableAsProps");

var _renderReactRoot = require("@atom-ide-community/nuclide-commons-ui/renderReactRoot");

var _memoizeUntilChanged = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/memoizeUntilChanged"));

var _observable = require("@atom-ide-community/nuclide-commons/observable");

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var _observableFromReduxStore = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/observableFromReduxStore"));

var _RegExpFilter = require("@atom-ide-community/nuclide-commons-ui/RegExpFilter");

var Actions = _interopRequireWildcard(require("../redux/Actions"));

var Selectors = _interopRequireWildcard(require("../redux/Selectors"));

var _ConsoleView = _interopRequireDefault(require("./ConsoleView"));

var _immutable = require("immutable");

var React = _interopRequireWildcard(require("react"));

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

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

/* eslint-env browser */
// Other Nuclide packages (which cannot import this) depend on this URI. If this
// needs to be changed, grep for CONSOLE_VIEW_URI and ensure that the URIs match.
const WORKSPACE_VIEW_URI = 'atom://nuclide/console';
exports.WORKSPACE_VIEW_URI = WORKSPACE_VIEW_URI;
const ERROR_TRANSCRIBING_MESSAGE = "// Nuclide couldn't find the right text to display";
const ALL_SEVERITIES = new Set(['error', 'warning', 'info']);
/**
 * An Atom "view model" for the console. This object is responsible for creating a stateful view
 * (via `getElement()`). That view is bound to both global state (from the store) and view-specific
 * state (from this instance's `_model`).
 */

class Console {
  constructor(options) {
    this._actionCreators = void 0;
    this._titleChanges = void 0;
    this._model = void 0;
    this._store = void 0;
    this._element = void 0;
    this._destroyed = void 0;
    this._getSourcesMemoized = (0, _memoizeUntilChanged.default)(getSources, opts => opts, (a, b) => (0, _shallowequal.default)(a, b));

    this._resetAllFilters = () => {
      this._selectSources(this._getSources().map(s => s.id));

      this._model.setState({
        filterText: ''
      });
    };

    this._createPaste = async () => {
      const displayableRecords = Selectors.getAllRecords(this._store.getState()).toArray();

      const createPasteImpl = this._store.getState().createPasteFunction;

      if (createPasteImpl == null) {
        return;
      }

      return createPaste(createPasteImpl, displayableRecords);
    };

    this._selectSources = selectedSourceIds => {
      const sourceIds = this._getSources().map(source => source.id);

      const unselectedSourceIds = sourceIds.filter(sourceId => selectedSourceIds.indexOf(sourceId) === -1);

      this._model.setState({
        unselectedSourceIds
      });
    };

    this._updateFilter = change => {
      const {
        text,
        isRegExp
      } = change;

      this._model.setState({
        filterText: text,
        enableRegExpFilter: isRegExp
      });
    };

    this._toggleSeverity = severity => {
      const {
        selectedSeverities
      } = this._model.state;
      const nextSelectedSeverities = new Set(selectedSeverities);

      if (nextSelectedSeverities.has(severity)) {
        nextSelectedSeverities.delete(severity);
      } else {
        nextSelectedSeverities.add(severity);
      }

      this._model.setState({
        selectedSeverities: nextSelectedSeverities
      });
    };

    const {
      store,
      initialFilterText,
      initialEnableRegExpFilter,
      initialUnselectedSourceIds,
      initialUnselectedSeverities
    } = options;
    this._model = new _Model.default({
      displayableRecords: [],
      filterText: initialFilterText == null ? '' : initialFilterText,
      enableRegExpFilter: Boolean(initialEnableRegExpFilter),
      unselectedSourceIds: initialUnselectedSourceIds == null ? [] : initialUnselectedSourceIds,
      selectedSeverities: initialUnselectedSeverities == null ? ALL_SEVERITIES : (0, _collection.setDifference)(ALL_SEVERITIES, initialUnselectedSeverities)
    });
    this._store = store;
    this._destroyed = new _rxjsCompatUmdMin.ReplaySubject(1);
    this._titleChanges = _rxjsCompatUmdMin.Observable.combineLatest(this._model.toObservable(), (0, _observableFromReduxStore.default)(store)).takeUntil(this._destroyed).map(() => this.getTitle()).distinctUntilChanged().share();
  }

  getIconName() {
    return 'nuclicon-console';
  } // Get the pane item's title. If there's only one source selected, we'll use that to make a more
  // descriptive title.


  getTitle() {
    const enabledProviderCount = this._store.getState().providers.size;

    const {
      unselectedSourceIds
    } = this._model.state; // Calling `_getSources()` is (currently) expensive because it needs to search all the records
    // for sources that have been disabled but still have records. We try to avoid calling it if we
    // already know that there's more than one selected source.

    if (enabledProviderCount - unselectedSourceIds.length > 1) {
      return 'Console';
    } // If there's only one source selected, use its name in the tab title.


    const sources = this._getSources();

    if (sources.length - unselectedSourceIds.length === 1) {
      const selectedSource = sources.find(source => unselectedSourceIds.indexOf(source.id) === -1);

      if (selectedSource) {
        return `Console: ${selectedSource.name}`;
      }
    }

    return 'Console';
  }

  getDefaultLocation() {
    return 'bottom';
  }

  getURI() {
    return WORKSPACE_VIEW_URI;
  }

  onDidChangeTitle(callback) {
    return new _UniversalDisposable.default(this._titleChanges.subscribe(callback));
  }

  _getSources() {
    const {
      providers,
      providerStatuses,
      records,
      incompleteRecords
    } = this._store.getState();

    return this._getSourcesMemoized({
      providers,
      providerStatuses,
      records,
      incompleteRecords
    });
  } // Memoize `getSources()`. Unfortunately, since we look for unrepresented sources in the record
  // list, this still needs to be called whenever the records change.
  // TODO: Consider removing records when their source is removed. This will likely require adding
  // the ability to enable and disable sources so, for example, when the debugger is no longer
  // active, it still remains in the source list.
  // $FlowFixMe (>=0.85.0) (T35986896) Flow upgrade suppress


  destroy() {
    this._destroyed.next();
  }

  copy() {
    return new Console({
      store: this._store,
      initialFilterText: this._model.state.filterText,
      initialEnableRegExpFilter: this._model.state.enableRegExpFilter,
      initialUnselectedSourceIds: this._model.state.unselectedSourceIds,
      initialUnselectedSeverities: (0, _collection.setDifference)(ALL_SEVERITIES, this._model.state.selectedSeverities)
    });
  }

  _getBoundActionCreators() {
    if (this._actionCreators == null) {
      this._actionCreators = {
        execute: code => {
          this._store.dispatch(Actions.execute(code));
        },
        selectExecutor: executorId => {
          this._store.dispatch(Actions.selectExecutor(executorId));
        },
        clearRecords: () => {
          this._store.dispatch(Actions.clearRecords());
        }
      };
    }

    return this._actionCreators;
  }

  _getFilterInfo() {
    const {
      pattern,
      invalid
    } = (0, _RegExpFilter.getFilterPattern)(this._model.state.filterText, this._model.state.enableRegExpFilter);

    const sources = this._getSources();

    const selectedSourceIds = sources.map(source => source.id).filter(sourceId => this._model.state.unselectedSourceIds.indexOf(sourceId) === -1);
    const {
      selectedSeverities
    } = this._model.state;
    const filteredRecords = filterRecords(Selectors.getAllRecords(this._store.getState()).toArray(), selectedSourceIds, selectedSeverities, pattern, sources.length !== selectedSourceIds.length);
    return {
      invalid,
      selectedSourceIds,
      selectedSeverities,
      filteredRecords
    };
  }

  getElement() {
    if (this._element != null) {
      return this._element;
    }

    const actionCreators = this._getBoundActionCreators();

    const globalStates = (0, _observableFromReduxStore.default)(this._store);

    const props = _rxjsCompatUmdMin.Observable.combineLatest(this._model.toObservable(), globalStates) // Don't re-render when the console isn't visible.
    .let((0, _observable.toggle)((0, _observePaneItemVisibility.default)(this))).audit(() => _observable.nextAnimationFrame).map(([localState, globalState]) => {
      const {
        invalid,
        selectedSourceIds,
        selectedSeverities,
        filteredRecords
      } = this._getFilterInfo();

      const currentExecutorId = Selectors.getCurrentExecutorId(globalState);
      const currentExecutor = currentExecutorId != null ? globalState.executors.get(currentExecutorId) : null;
      return {
        invalidFilterInput: invalid,
        execute: actionCreators.execute,
        selectExecutor: actionCreators.selectExecutor,
        clearRecords: actionCreators.clearRecords,
        createPaste: globalState.createPasteFunction == null ? null : this._createPaste,
        watchEditor: globalState.watchEditor,
        currentExecutor,
        unselectedSourceIds: localState.unselectedSourceIds,
        filterText: localState.filterText,
        enableRegExpFilter: localState.enableRegExpFilter,
        records: filteredRecords,
        filteredRecordCount: Selectors.getAllRecords(globalState).size - filteredRecords.length,
        history: globalState.history,
        sources: this._getSources(),
        selectedSourceIds,
        selectSources: this._selectSources,
        executors: globalState.executors,
        getProvider: id => globalState.providers.get(id),
        updateFilter: this._updateFilter,
        resetAllFilters: this._resetAllFilters,
        fontSize: globalState.fontSize,
        selectedSeverities,
        toggleSeverity: this._toggleSeverity
      };
    });

    const StatefulConsoleView = (0, _bindObservableAsProps.bindObservableAsProps)(props, _ConsoleView.default);
    return this._element = (0, _renderReactRoot.renderReactRoot)( /*#__PURE__*/React.createElement(StatefulConsoleView, null));
  }

  serialize() {
    const {
      filterText,
      enableRegExpFilter,
      unselectedSourceIds,
      selectedSeverities
    } = this._model.state;
    return {
      deserializer: 'nuclide.Console',
      filterText,
      enableRegExpFilter,
      unselectedSourceIds,
      unselectedSeverities: [...(0, _collection.setDifference)(ALL_SEVERITIES, selectedSeverities)]
    };
  }

  /** Unselects the sources from the given IDs */
  unselectSources(ids) {
    const newIds = ids.filter(id => !this._model.state.unselectedSourceIds.includes(id));

    this._model.setState({
      unselectedSourceIds: this._model.state.unselectedSourceIds.concat(newIds)
    });
  }

}

exports.Console = Console;

function getSources(options) {
  const {
    providers,
    providerStatuses,
    records
  } = options; // Convert the providers to a map of sources.

  const mapOfSources = new Map(Array.from(providers.entries()).map(([k, provider]) => {
    const source = {
      id: provider.id,
      name: provider.name,
      status: providerStatuses.get(provider.id) || 'stopped',
      start: typeof provider.start === 'function' ? provider.start : undefined,
      stop: typeof provider.stop === 'function' ? provider.stop : undefined
    };
    return [k, source];
  })); // Some providers may have been unregistered, but still have records. Add sources for them too.
  // TODO: Iterating over all the records to get this every time we get a new record is inefficient.

  records.forEach((record, i) => {
    if (!mapOfSources.has(record.sourceId)) {
      mapOfSources.set(record.sourceId, {
        id: record.sourceId,
        name: record.sourceId,
        status: 'stopped',
        start: undefined,
        stop: undefined
      });
    }
  });
  return Array.from(mapOfSources.values());
}

function filterRecords(records, selectedSourceIds, selectedSeverities, filterPattern, filterSources) {
  if (!filterSources && filterPattern == null && (0, _collection.areSetsEqual)(ALL_SEVERITIES, selectedSeverities)) {
    return records;
  }

  return records.filter(record => {
    // Only filter regular messages
    if (record.kind !== 'message') {
      return true;
    }

    if (!selectedSeverities.has(levelToSeverity(record.level))) {
      return false;
    }

    const sourceMatches = selectedSourceIds.indexOf(record.sourceId) !== -1;
    return sourceMatches && (filterPattern == null || filterPattern.test(record.text));
  });
}

async function serializeRecordObject(visited, expression, text, level) {
  const getText = exp => {
    let indent = '';

    for (let i = 0; i < level; i++) {
      indent += '\t';
    }

    return indent + exp.getValue();
  };

  if (!expression.hasChildren()) {
    // Leaf node.
    return text + getText(expression);
  }

  const id = expression.getId();

  if (visited.has(id)) {
    // Guard against cycles.
    return text;
  }

  visited.add(id);
  const children = await expression.getChildren();
  const serializedProps = children.map(childProp => {
    return serializeRecordObject(visited, childProp, '', level + 1);
  });
  return getText(expression) + '\n' + (await Promise.all(serializedProps)).join('\n');
}

async function createPaste(createPasteImpl, records) {
  const linePromises = records.filter(record => record.kind === 'message' || record.kind === 'request' || record.kind === 'response').map(async record => {
    const level = record.level != null ? record.level.toString().toUpperCase() : 'LOG';
    const timestamp = record.timestamp.toLocaleString();
    let text = record.text || ERROR_TRANSCRIBING_MESSAGE;

    if (record.kind === 'response' && record.expressions != null && record.expressions.length > 0) {
      text = '';

      for (const expression of record.expressions) {
        // If the record has a data object, and the object has an ID,
        // recursively expand the nodes of the object and serialize it
        // for the paste.
        // eslint-disable-next-line no-await-in-loop
        text += await serializeRecordObject(new Set(), expression, '', 0);
      }
    }

    return `[${level}][${record.sourceId}][${timestamp}]\t ${text}`;
  });
  const lines = (await Promise.all(linePromises)).join('\n');

  if (lines === '') {
    // Can't create an empty paste!
    atom.notifications.addWarning('There is nothing in your console to Paste! Check your console filters and try again.');
    return;
  }

  atom.notifications.addInfo('Creating Paste...');

  try {
    const uri = await createPasteImpl(lines, {
      title: 'Nuclide Console Paste'
    }, 'console paste');
    atom.notifications.addSuccess(`Created Paste at ${uri}`);
  } catch (error) {
    if (error.stdout == null) {
      atom.notifications.addError(`Failed to create paste: ${String(error.message || error)}`);
      return;
    }

    const errorMessages = error.stdout.trim().split('\n').map(JSON.parse).map(e => e.message);
    atom.notifications.addError('Failed to create paste', {
      detail: errorMessages.join('\n'),
      dismissable: true
    });
  }
}

function levelToSeverity(level) {
  switch (level) {
    case 'error':
      return 'error';

    case 'warning':
      return 'warning';

    case 'log':
    case 'info':
    case 'debug':
    case 'success':
      return 'info';

    default:
      // All the colors are "info"
      return 'info';
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGUuanMiXSwibmFtZXMiOlsiV09SS1NQQUNFX1ZJRVdfVVJJIiwiRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UiLCJBTExfU0VWRVJJVElFUyIsIlNldCIsIkNvbnNvbGUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfYWN0aW9uQ3JlYXRvcnMiLCJfdGl0bGVDaGFuZ2VzIiwiX21vZGVsIiwiX3N0b3JlIiwiX2VsZW1lbnQiLCJfZGVzdHJveWVkIiwiX2dldFNvdXJjZXNNZW1vaXplZCIsImdldFNvdXJjZXMiLCJvcHRzIiwiYSIsImIiLCJfcmVzZXRBbGxGaWx0ZXJzIiwiX3NlbGVjdFNvdXJjZXMiLCJfZ2V0U291cmNlcyIsIm1hcCIsInMiLCJpZCIsInNldFN0YXRlIiwiZmlsdGVyVGV4dCIsIl9jcmVhdGVQYXN0ZSIsImRpc3BsYXlhYmxlUmVjb3JkcyIsIlNlbGVjdG9ycyIsImdldEFsbFJlY29yZHMiLCJnZXRTdGF0ZSIsInRvQXJyYXkiLCJjcmVhdGVQYXN0ZUltcGwiLCJjcmVhdGVQYXN0ZUZ1bmN0aW9uIiwiY3JlYXRlUGFzdGUiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZUlkcyIsInNvdXJjZSIsInVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJmaWx0ZXIiLCJzb3VyY2VJZCIsImluZGV4T2YiLCJfdXBkYXRlRmlsdGVyIiwiY2hhbmdlIiwidGV4dCIsImlzUmVnRXhwIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiX3RvZ2dsZVNldmVyaXR5Iiwic2V2ZXJpdHkiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJzdGF0ZSIsIm5leHRTZWxlY3RlZFNldmVyaXRpZXMiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJzdG9yZSIsImluaXRpYWxGaWx0ZXJUZXh0IiwiaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciIsImluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwiTW9kZWwiLCJCb29sZWFuIiwiUmVwbGF5U3ViamVjdCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwidG9PYnNlcnZhYmxlIiwidGFrZVVudGlsIiwiZ2V0VGl0bGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsInNoYXJlIiwiZ2V0SWNvbk5hbWUiLCJlbmFibGVkUHJvdmlkZXJDb3VudCIsInByb3ZpZGVycyIsInNpemUiLCJsZW5ndGgiLCJzb3VyY2VzIiwic2VsZWN0ZWRTb3VyY2UiLCJmaW5kIiwibmFtZSIsImdldERlZmF1bHRMb2NhdGlvbiIsImdldFVSSSIsIm9uRGlkQ2hhbmdlVGl0bGUiLCJjYWxsYmFjayIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJzdWJzY3JpYmUiLCJwcm92aWRlclN0YXR1c2VzIiwicmVjb3JkcyIsImluY29tcGxldGVSZWNvcmRzIiwiZGVzdHJveSIsIm5leHQiLCJjb3B5IiwiX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMiLCJleGVjdXRlIiwiY29kZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsInNlbGVjdEV4ZWN1dG9yIiwiZXhlY3V0b3JJZCIsImNsZWFyUmVjb3JkcyIsIl9nZXRGaWx0ZXJJbmZvIiwicGF0dGVybiIsImludmFsaWQiLCJmaWx0ZXJlZFJlY29yZHMiLCJmaWx0ZXJSZWNvcmRzIiwiZ2V0RWxlbWVudCIsImFjdGlvbkNyZWF0b3JzIiwiZ2xvYmFsU3RhdGVzIiwicHJvcHMiLCJsZXQiLCJhdWRpdCIsIm5leHRBbmltYXRpb25GcmFtZSIsImxvY2FsU3RhdGUiLCJnbG9iYWxTdGF0ZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJjdXJyZW50RXhlY3V0b3IiLCJleGVjdXRvcnMiLCJnZXQiLCJpbnZhbGlkRmlsdGVySW5wdXQiLCJ3YXRjaEVkaXRvciIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJoaXN0b3J5Iiwic2VsZWN0U291cmNlcyIsImdldFByb3ZpZGVyIiwidXBkYXRlRmlsdGVyIiwicmVzZXRBbGxGaWx0ZXJzIiwiZm9udFNpemUiLCJ0b2dnbGVTZXZlcml0eSIsIlN0YXRlZnVsQ29uc29sZVZpZXciLCJDb25zb2xlVmlldyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplciIsInVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RTb3VyY2VzIiwiaWRzIiwibmV3SWRzIiwiaW5jbHVkZXMiLCJjb25jYXQiLCJtYXBPZlNvdXJjZXMiLCJNYXAiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwiayIsInByb3ZpZGVyIiwic3RhdHVzIiwic3RhcnQiLCJ1bmRlZmluZWQiLCJzdG9wIiwiZm9yRWFjaCIsInJlY29yZCIsImkiLCJzZXQiLCJ2YWx1ZXMiLCJmaWx0ZXJQYXR0ZXJuIiwiZmlsdGVyU291cmNlcyIsImtpbmQiLCJsZXZlbFRvU2V2ZXJpdHkiLCJsZXZlbCIsInNvdXJjZU1hdGNoZXMiLCJ0ZXN0Iiwic2VyaWFsaXplUmVjb3JkT2JqZWN0IiwidmlzaXRlZCIsImV4cHJlc3Npb24iLCJnZXRUZXh0IiwiZXhwIiwiaW5kZW50IiwiZ2V0VmFsdWUiLCJoYXNDaGlsZHJlbiIsImdldElkIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsInNlcmlhbGl6ZWRQcm9wcyIsImNoaWxkUHJvcCIsIlByb21pc2UiLCJhbGwiLCJqb2luIiwibGluZVByb21pc2VzIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRpbWVzdGFtcCIsInRvTG9jYWxlU3RyaW5nIiwiZXhwcmVzc2lvbnMiLCJsaW5lcyIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkV2FybmluZyIsImFkZEluZm8iLCJ1cmkiLCJ0aXRsZSIsImFkZFN1Y2Nlc3MiLCJlcnJvciIsInN0ZG91dCIsImFkZEVycm9yIiwiU3RyaW5nIiwibWVzc2FnZSIsImVycm9yTWVzc2FnZXMiLCJ0cmltIiwic3BsaXQiLCJKU09OIiwicGFyc2UiLCJlIiwiZGV0YWlsIiwiZGlzbWlzc2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUE2QkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7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YUFBYSxDQUFDcEIsSUFBZCxDQUFtQixJQUFuQixDQUQ0QztBQUVwRDJCLE1BQUFBLFdBQVcsRUFBRTtBQUZ1QyxLQUF0RDtBQUlEO0FBQ0Y7O0FBRUQsU0FBUzlDLGVBQVQsQ0FBeUJDLEtBQXpCLEVBQWlEO0FBQy9DLFVBQVFBLEtBQVI7QUFDRSxTQUFLLE9BQUw7QUFDRSxhQUFPLE9BQVA7O0FBQ0YsU0FBSyxTQUFMO0FBQ0UsYUFBTyxTQUFQOztBQUNGLFNBQUssS0FBTDtBQUNBLFNBQUssTUFBTDtBQUNBLFNBQUssT0FBTDtBQUNBLFNBQUssU0FBTDtBQUNFLGFBQU8sTUFBUDs7QUFDRjtBQUNFO0FBQ0EsYUFBTyxNQUFQO0FBWko7QUFjRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG5pbXBvcnQgdHlwZSB7SUV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uLy4uJztcbmltcG9ydCB0eXBlIHtcbiAgQ29uc29sZVBlcnNpc3RlZFN0YXRlLFxuICBDb25zb2xlU291cmNlU3RhdHVzLFxuICBSZWNvcmQsXG4gIFNvdXJjZSxcbiAgU3RvcmUsXG4gIFNvdXJjZUluZm8sXG4gIFNldmVyaXR5LFxuICBMZXZlbCxcbiAgQXBwU3RhdGUsXG59IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHtDcmVhdGVQYXN0ZUZ1bmN0aW9ufSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7UmVnRXhwRmlsdGVyQ2hhbmdlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9SZWdFeHBGaWx0ZXInO1xuXG5pbXBvcnQgb2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL29ic2VydmVQYW5lSXRlbVZpc2liaWxpdHknO1xuaW1wb3J0IHtzZXREaWZmZXJlbmNlLCBhcmVTZXRzRXF1YWx9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2NvbGxlY3Rpb24nO1xuaW1wb3J0IE1vZGVsIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL01vZGVsJztcbmltcG9ydCBzaGFsbG93RXF1YWwgZnJvbSAnc2hhbGxvd2VxdWFsJztcbmltcG9ydCB7YmluZE9ic2VydmFibGVBc1Byb3BzfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9iaW5kT2JzZXJ2YWJsZUFzUHJvcHMnO1xuaW1wb3J0IHtyZW5kZXJSZWFjdFJvb3R9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL3JlbmRlclJlYWN0Um9vdCc7XG5pbXBvcnQgbWVtb2l6ZVVudGlsQ2hhbmdlZCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9tZW1vaXplVW50aWxDaGFuZ2VkJztcbmltcG9ydCB7dG9nZ2xlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9vYnNlcnZhYmxlJztcbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGUnO1xuaW1wb3J0IHtuZXh0QW5pbWF0aW9uRnJhbWV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGUnO1xuaW1wb3J0IG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9vYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUnO1xuaW1wb3J0IHtnZXRGaWx0ZXJQYXR0ZXJufSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9SZWdFeHBGaWx0ZXInO1xuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tICcuLi9yZWR1eC9BY3Rpb25zJztcbmltcG9ydCAqIGFzIFNlbGVjdG9ycyBmcm9tICcuLi9yZWR1eC9TZWxlY3RvcnMnO1xuaW1wb3J0IENvbnNvbGVWaWV3IGZyb20gJy4vQ29uc29sZVZpZXcnO1xuaW1wb3J0IHtMaXN0fSBmcm9tICdpbW11dGFibGUnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0fSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuXG50eXBlIE9wdGlvbnMgPSB7fFxuICBzdG9yZTogU3RvcmUsXG4gIGluaXRpYWxGaWx0ZXJUZXh0Pzogc3RyaW5nLFxuICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyPzogYm9vbGVhbixcbiAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM/OiBBcnJheTxzdHJpbmc+LFxuICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM/OiBTZXQ8U2V2ZXJpdHk+LFxufH07XG5cbi8vXG4vLyBTdGF0ZSB1bmlxdWUgdG8gdGhpcyBwYXJ0aWN1bGFyIENvbnNvbGUgaW5zdGFuY2Vcbi8vXG50eXBlIFN0YXRlID0ge1xuICBmaWx0ZXJUZXh0OiBzdHJpbmcsXG4gIGVuYWJsZVJlZ0V4cEZpbHRlcjogYm9vbGVhbixcbiAgdW5zZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxufTtcblxudHlwZSBCb3VuZEFjdGlvbkNyZWF0b3JzID0ge1xuICBleGVjdXRlOiAoY29kZTogc3RyaW5nKSA9PiB2b2lkLFxuICBzZWxlY3RFeGVjdXRvcjogKGV4ZWN1dG9ySWQ6IHN0cmluZykgPT4gdm9pZCxcbiAgY2xlYXJSZWNvcmRzOiAoKSA9PiB2b2lkLFxufTtcblxuLy8gT3RoZXIgTnVjbGlkZSBwYWNrYWdlcyAod2hpY2ggY2Fubm90IGltcG9ydCB0aGlzKSBkZXBlbmQgb24gdGhpcyBVUkkuIElmIHRoaXNcbi8vIG5lZWRzIHRvIGJlIGNoYW5nZWQsIGdyZXAgZm9yIENPTlNPTEVfVklFV19VUkkgYW5kIGVuc3VyZSB0aGF0IHRoZSBVUklzIG1hdGNoLlxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9WSUVXX1VSSSA9ICdhdG9tOi8vbnVjbGlkZS9jb25zb2xlJztcblxuY29uc3QgRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UgPVxuICBcIi8vIE51Y2xpZGUgY291bGRuJ3QgZmluZCB0aGUgcmlnaHQgdGV4dCB0byBkaXNwbGF5XCI7XG5cbmNvbnN0IEFMTF9TRVZFUklUSUVTID0gbmV3IFNldChbJ2Vycm9yJywgJ3dhcm5pbmcnLCAnaW5mbyddKTtcblxuLyoqXG4gKiBBbiBBdG9tIFwidmlldyBtb2RlbFwiIGZvciB0aGUgY29uc29sZS4gVGhpcyBvYmplY3QgaXMgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIGEgc3RhdGVmdWwgdmlld1xuICogKHZpYSBgZ2V0RWxlbWVudCgpYCkuIFRoYXQgdmlldyBpcyBib3VuZCB0byBib3RoIGdsb2JhbCBzdGF0ZSAoZnJvbSB0aGUgc3RvcmUpIGFuZCB2aWV3LXNwZWNpZmljXG4gKiBzdGF0ZSAoZnJvbSB0aGlzIGluc3RhbmNlJ3MgYF9tb2RlbGApLlxuICovXG5leHBvcnQgY2xhc3MgQ29uc29sZSB7XG4gIF9hY3Rpb25DcmVhdG9yczogQm91bmRBY3Rpb25DcmVhdG9ycztcblxuICBfdGl0bGVDaGFuZ2VzOiBPYnNlcnZhYmxlPHN0cmluZz47XG4gIF9tb2RlbDogTW9kZWw8U3RhdGU+O1xuICBfc3RvcmU6IFN0b3JlO1xuICBfZWxlbWVudDogP0hUTUxFbGVtZW50O1xuICBfZGVzdHJveWVkOiBSZXBsYXlTdWJqZWN0PHZvaWQ+O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBzdG9yZSxcbiAgICAgIGluaXRpYWxGaWx0ZXJUZXh0LFxuICAgICAgaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzLFxuICAgIH0gPSBvcHRpb25zO1xuICAgIHRoaXMuX21vZGVsID0gbmV3IE1vZGVsKHtcbiAgICAgIGRpc3BsYXlhYmxlUmVjb3JkczogW10sXG4gICAgICBmaWx0ZXJUZXh0OiBpbml0aWFsRmlsdGVyVGV4dCA9PSBudWxsID8gJycgOiBpbml0aWFsRmlsdGVyVGV4dCxcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcjogQm9vbGVhbihpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyKSxcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6XG4gICAgICAgIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzID09IG51bGwgPyBbXSA6IGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzOlxuICAgICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXMgPT0gbnVsbFxuICAgICAgICAgID8gQUxMX1NFVkVSSVRJRVNcbiAgICAgICAgICA6IHNldERpZmZlcmVuY2UoQUxMX1NFVkVSSVRJRVMsIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllcyksXG4gICAgfSk7XG5cbiAgICB0aGlzLl9zdG9yZSA9IHN0b3JlO1xuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuXG4gICAgdGhpcy5fdGl0bGVDaGFuZ2VzID0gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgdGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksXG4gICAgICBvYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUoc3RvcmUpLFxuICAgIClcbiAgICAgIC50YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxuICAgICAgLm1hcCgoKSA9PiB0aGlzLmdldFRpdGxlKCkpXG4gICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgLnNoYXJlKCk7XG4gIH1cblxuICBnZXRJY29uTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnbnVjbGljb24tY29uc29sZSc7XG4gIH1cblxuICAvLyBHZXQgdGhlIHBhbmUgaXRlbSdzIHRpdGxlLiBJZiB0aGVyZSdzIG9ubHkgb25lIHNvdXJjZSBzZWxlY3RlZCwgd2UnbGwgdXNlIHRoYXQgdG8gbWFrZSBhIG1vcmVcbiAgLy8gZGVzY3JpcHRpdmUgdGl0bGUuXG4gIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZW5hYmxlZFByb3ZpZGVyQ291bnQgPSB0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpLnByb3ZpZGVycy5zaXplO1xuICAgIGNvbnN0IHt1bnNlbGVjdGVkU291cmNlSWRzfSA9IHRoaXMuX21vZGVsLnN0YXRlO1xuXG4gICAgLy8gQ2FsbGluZyBgX2dldFNvdXJjZXMoKWAgaXMgKGN1cnJlbnRseSkgZXhwZW5zaXZlIGJlY2F1c2UgaXQgbmVlZHMgdG8gc2VhcmNoIGFsbCB0aGUgcmVjb3Jkc1xuICAgIC8vIGZvciBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIGRpc2FibGVkIGJ1dCBzdGlsbCBoYXZlIHJlY29yZHMuIFdlIHRyeSB0byBhdm9pZCBjYWxsaW5nIGl0IGlmIHdlXG4gICAgLy8gYWxyZWFkeSBrbm93IHRoYXQgdGhlcmUncyBtb3JlIHRoYW4gb25lIHNlbGVjdGVkIHNvdXJjZS5cbiAgICBpZiAoZW5hYmxlZFByb3ZpZGVyQ291bnQgLSB1bnNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiAnQ29uc29sZSc7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUncyBvbmx5IG9uZSBzb3VyY2Ugc2VsZWN0ZWQsIHVzZSBpdHMgbmFtZSBpbiB0aGUgdGFiIHRpdGxlLlxuICAgIGNvbnN0IHNvdXJjZXMgPSB0aGlzLl9nZXRTb3VyY2VzKCk7XG4gICAgaWYgKHNvdXJjZXMubGVuZ3RoIC0gdW5zZWxlY3RlZFNvdXJjZUlkcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkU291cmNlID0gc291cmNlcy5maW5kKFxuICAgICAgICBzb3VyY2UgPT4gdW5zZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZS5pZCkgPT09IC0xLFxuICAgICAgKTtcbiAgICAgIGlmIChzZWxlY3RlZFNvdXJjZSkge1xuICAgICAgICByZXR1cm4gYENvbnNvbGU6ICR7c2VsZWN0ZWRTb3VyY2UubmFtZX1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnQ29uc29sZSc7XG4gIH1cblxuICBnZXREZWZhdWx0TG9jYXRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ2JvdHRvbSc7XG4gIH1cblxuICBnZXRVUkkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gV09SS1NQQUNFX1ZJRVdfVVJJO1xuICB9XG5cbiAgb25EaWRDaGFuZ2VUaXRsZShjYWxsYmFjazogKHRpdGxlOiBzdHJpbmcpID0+IG1peGVkKTogSURpc3Bvc2FibGUge1xuICAgIHJldHVybiBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSh0aGlzLl90aXRsZUNoYW5nZXMuc3Vic2NyaWJlKGNhbGxiYWNrKSk7XG4gIH1cblxuICBfZ2V0U291cmNlcygpOiBBcnJheTxTb3VyY2U+IHtcbiAgICBjb25zdCB7XG4gICAgICBwcm92aWRlcnMsXG4gICAgICBwcm92aWRlclN0YXR1c2VzLFxuICAgICAgcmVjb3JkcyxcbiAgICAgIGluY29tcGxldGVSZWNvcmRzLFxuICAgIH0gPSB0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIHJldHVybiB0aGlzLl9nZXRTb3VyY2VzTWVtb2l6ZWQoe1xuICAgICAgcHJvdmlkZXJzLFxuICAgICAgcHJvdmlkZXJTdGF0dXNlcyxcbiAgICAgIHJlY29yZHMsXG4gICAgICBpbmNvbXBsZXRlUmVjb3JkcyxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE1lbW9pemUgYGdldFNvdXJjZXMoKWAuIFVuZm9ydHVuYXRlbHksIHNpbmNlIHdlIGxvb2sgZm9yIHVucmVwcmVzZW50ZWQgc291cmNlcyBpbiB0aGUgcmVjb3JkXG4gIC8vIGxpc3QsIHRoaXMgc3RpbGwgbmVlZHMgdG8gYmUgY2FsbGVkIHdoZW5ldmVyIHRoZSByZWNvcmRzIGNoYW5nZS5cbiAgLy8gVE9ETzogQ29uc2lkZXIgcmVtb3ZpbmcgcmVjb3JkcyB3aGVuIHRoZWlyIHNvdXJjZSBpcyByZW1vdmVkLiBUaGlzIHdpbGwgbGlrZWx5IHJlcXVpcmUgYWRkaW5nXG4gIC8vIHRoZSBhYmlsaXR5IHRvIGVuYWJsZSBhbmQgZGlzYWJsZSBzb3VyY2VzIHNvLCBmb3IgZXhhbXBsZSwgd2hlbiB0aGUgZGVidWdnZXIgaXMgbm8gbG9uZ2VyXG4gIC8vIGFjdGl2ZSwgaXQgc3RpbGwgcmVtYWlucyBpbiB0aGUgc291cmNlIGxpc3QuXG4gIC8vICRGbG93Rml4TWUgKD49MC44NS4wKSAoVDM1OTg2ODk2KSBGbG93IHVwZ3JhZGUgc3VwcHJlc3NcbiAgX2dldFNvdXJjZXNNZW1vaXplZCA9IG1lbW9pemVVbnRpbENoYW5nZWQoXG4gICAgZ2V0U291cmNlcyxcbiAgICBvcHRzID0+IG9wdHMsXG4gICAgKGEsIGIpID0+IHNoYWxsb3dFcXVhbChhLCBiKSxcbiAgKTtcblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gIH1cblxuICBjb3B5KCk6IENvbnNvbGUge1xuICAgIHJldHVybiBuZXcgQ29uc29sZSh7XG4gICAgICBzdG9yZTogdGhpcy5fc3RvcmUsXG4gICAgICBpbml0aWFsRmlsdGVyVGV4dDogdGhpcy5fbW9kZWwuc3RhdGUuZmlsdGVyVGV4dCxcbiAgICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI6IHRoaXMuX21vZGVsLnN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzOiB0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzOiBzZXREaWZmZXJlbmNlKFxuICAgICAgICBBTExfU0VWRVJJVElFUyxcbiAgICAgICAgdGhpcy5fbW9kZWwuc3RhdGUuc2VsZWN0ZWRTZXZlcml0aWVzLFxuICAgICAgKSxcbiAgICB9KTtcbiAgfVxuXG4gIF9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKCk6IEJvdW5kQWN0aW9uQ3JlYXRvcnMge1xuICAgIGlmICh0aGlzLl9hY3Rpb25DcmVhdG9ycyA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9hY3Rpb25DcmVhdG9ycyA9IHtcbiAgICAgICAgZXhlY3V0ZTogY29kZSA9PiB7XG4gICAgICAgICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2goQWN0aW9ucy5leGVjdXRlKGNvZGUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0RXhlY3V0b3I6IGV4ZWN1dG9ySWQgPT4ge1xuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuc2VsZWN0RXhlY3V0b3IoZXhlY3V0b3JJZCkpO1xuICAgICAgICB9LFxuICAgICAgICBjbGVhclJlY29yZHM6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChBY3Rpb25zLmNsZWFyUmVjb3JkcygpKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hY3Rpb25DcmVhdG9ycztcbiAgfVxuXG4gIF9yZXNldEFsbEZpbHRlcnMgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5fc2VsZWN0U291cmNlcyh0aGlzLl9nZXRTb3VyY2VzKCkubWFwKHMgPT4gcy5pZCkpO1xuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHtmaWx0ZXJUZXh0OiAnJ30pO1xuICB9O1xuXG4gIF9jcmVhdGVQYXN0ZSA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBkaXNwbGF5YWJsZVJlY29yZHMgPSBTZWxlY3RvcnMuZ2V0QWxsUmVjb3JkcyhcbiAgICAgIHRoaXMuX3N0b3JlLmdldFN0YXRlKCksXG4gICAgKS50b0FycmF5KCk7XG4gICAgY29uc3QgY3JlYXRlUGFzdGVJbXBsID0gdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKS5jcmVhdGVQYXN0ZUZ1bmN0aW9uO1xuICAgIGlmIChjcmVhdGVQYXN0ZUltcGwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUGFzdGUoY3JlYXRlUGFzdGVJbXBsLCBkaXNwbGF5YWJsZVJlY29yZHMpO1xuICB9O1xuXG4gIF9nZXRGaWx0ZXJJbmZvKCk6IHtcbiAgICBpbnZhbGlkOiBib29sZWFuLFxuICAgIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxuICAgIGZpbHRlcmVkUmVjb3JkczogQXJyYXk8UmVjb3JkPixcbiAgICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXG4gIH0ge1xuICAgIGNvbnN0IHtwYXR0ZXJuLCBpbnZhbGlkfSA9IGdldEZpbHRlclBhdHRlcm4oXG4gICAgICB0aGlzLl9tb2RlbC5zdGF0ZS5maWx0ZXJUZXh0LFxuICAgICAgdGhpcy5fbW9kZWwuc3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICk7XG4gICAgY29uc3Qgc291cmNlcyA9IHRoaXMuX2dldFNvdXJjZXMoKTtcbiAgICBjb25zdCBzZWxlY3RlZFNvdXJjZUlkcyA9IHNvdXJjZXNcbiAgICAgIC5tYXAoc291cmNlID0+IHNvdXJjZS5pZClcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIHNvdXJjZUlkID0+XG4gICAgICAgICAgdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZUlkKSA9PT0gLTEsXG4gICAgICApO1xuXG4gICAgY29uc3Qge3NlbGVjdGVkU2V2ZXJpdGllc30gPSB0aGlzLl9tb2RlbC5zdGF0ZTtcbiAgICBjb25zdCBmaWx0ZXJlZFJlY29yZHMgPSBmaWx0ZXJSZWNvcmRzKFxuICAgICAgU2VsZWN0b3JzLmdldEFsbFJlY29yZHModGhpcy5fc3RvcmUuZ2V0U3RhdGUoKSkudG9BcnJheSgpLFxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgICBwYXR0ZXJuLFxuICAgICAgc291cmNlcy5sZW5ndGggIT09IHNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCxcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGludmFsaWQsXG4gICAgICBzZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICAgIGZpbHRlcmVkUmVjb3JkcyxcbiAgICB9O1xuICB9XG5cbiAgZ2V0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgaWYgKHRoaXMuX2VsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uQ3JlYXRvcnMgPSB0aGlzLl9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKCk7XG4gICAgY29uc3QgZ2xvYmFsU3RhdGVzOiBPYnNlcnZhYmxlPEFwcFN0YXRlPiA9IG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZShcbiAgICAgIHRoaXMuX3N0b3JlLFxuICAgICk7XG5cbiAgICBjb25zdCBwcm9wcyA9IE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgIHRoaXMuX21vZGVsLnRvT2JzZXJ2YWJsZSgpLFxuICAgICAgZ2xvYmFsU3RhdGVzLFxuICAgIClcbiAgICAgIC8vIERvbid0IHJlLXJlbmRlciB3aGVuIHRoZSBjb25zb2xlIGlzbid0IHZpc2libGUuXG4gICAgICAubGV0KHRvZ2dsZShvYnNlcnZlUGFuZUl0ZW1WaXNpYmlsaXR5KHRoaXMpKSlcbiAgICAgIC5hdWRpdCgoKSA9PiBuZXh0QW5pbWF0aW9uRnJhbWUpXG4gICAgICAubWFwKChbbG9jYWxTdGF0ZSwgZ2xvYmFsU3RhdGVdKSA9PiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBpbnZhbGlkLFxuICAgICAgICAgIHNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICAgICAgICBmaWx0ZXJlZFJlY29yZHMsXG4gICAgICAgIH0gPSB0aGlzLl9nZXRGaWx0ZXJJbmZvKCk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudEV4ZWN1dG9ySWQgPSBTZWxlY3RvcnMuZ2V0Q3VycmVudEV4ZWN1dG9ySWQoZ2xvYmFsU3RhdGUpO1xuICAgICAgICBjb25zdCBjdXJyZW50RXhlY3V0b3IgPVxuICAgICAgICAgIGN1cnJlbnRFeGVjdXRvcklkICE9IG51bGxcbiAgICAgICAgICAgID8gZ2xvYmFsU3RhdGUuZXhlY3V0b3JzLmdldChjdXJyZW50RXhlY3V0b3JJZClcbiAgICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludmFsaWRGaWx0ZXJJbnB1dDogaW52YWxpZCxcbiAgICAgICAgICBleGVjdXRlOiBhY3Rpb25DcmVhdG9ycy5leGVjdXRlLFxuICAgICAgICAgIHNlbGVjdEV4ZWN1dG9yOiBhY3Rpb25DcmVhdG9ycy5zZWxlY3RFeGVjdXRvcixcbiAgICAgICAgICBjbGVhclJlY29yZHM6IGFjdGlvbkNyZWF0b3JzLmNsZWFyUmVjb3JkcyxcbiAgICAgICAgICBjcmVhdGVQYXN0ZTpcbiAgICAgICAgICAgIGdsb2JhbFN0YXRlLmNyZWF0ZVBhc3RlRnVuY3Rpb24gPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9jcmVhdGVQYXN0ZSxcbiAgICAgICAgICB3YXRjaEVkaXRvcjogZ2xvYmFsU3RhdGUud2F0Y2hFZGl0b3IsXG4gICAgICAgICAgY3VycmVudEV4ZWN1dG9yLFxuICAgICAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IGxvY2FsU3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgICAgICBmaWx0ZXJUZXh0OiBsb2NhbFN0YXRlLmZpbHRlclRleHQsXG4gICAgICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyOiBsb2NhbFN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgICAgICByZWNvcmRzOiBmaWx0ZXJlZFJlY29yZHMsXG4gICAgICAgICAgZmlsdGVyZWRSZWNvcmRDb3VudDpcbiAgICAgICAgICAgIFNlbGVjdG9ycy5nZXRBbGxSZWNvcmRzKGdsb2JhbFN0YXRlKS5zaXplIC0gZmlsdGVyZWRSZWNvcmRzLmxlbmd0aCxcbiAgICAgICAgICBoaXN0b3J5OiBnbG9iYWxTdGF0ZS5oaXN0b3J5LFxuICAgICAgICAgIHNvdXJjZXM6IHRoaXMuX2dldFNvdXJjZXMoKSxcbiAgICAgICAgICBzZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgICAgICBzZWxlY3RTb3VyY2VzOiB0aGlzLl9zZWxlY3RTb3VyY2VzLFxuICAgICAgICAgIGV4ZWN1dG9yczogZ2xvYmFsU3RhdGUuZXhlY3V0b3JzLFxuICAgICAgICAgIGdldFByb3ZpZGVyOiBpZCA9PiBnbG9iYWxTdGF0ZS5wcm92aWRlcnMuZ2V0KGlkKSxcbiAgICAgICAgICB1cGRhdGVGaWx0ZXI6IHRoaXMuX3VwZGF0ZUZpbHRlcixcbiAgICAgICAgICByZXNldEFsbEZpbHRlcnM6IHRoaXMuX3Jlc2V0QWxsRmlsdGVycyxcbiAgICAgICAgICBmb250U2l6ZTogZ2xvYmFsU3RhdGUuZm9udFNpemUsXG4gICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxuICAgICAgICAgIHRvZ2dsZVNldmVyaXR5OiB0aGlzLl90b2dnbGVTZXZlcml0eSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgY29uc3QgU3RhdGVmdWxDb25zb2xlVmlldyA9IGJpbmRPYnNlcnZhYmxlQXNQcm9wcyhwcm9wcywgQ29uc29sZVZpZXcpO1xuICAgIHJldHVybiAodGhpcy5fZWxlbWVudCA9IHJlbmRlclJlYWN0Um9vdCg8U3RhdGVmdWxDb25zb2xlVmlldyAvPikpO1xuICB9XG5cbiAgc2VyaWFsaXplKCk6IENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSB7XG4gICAgY29uc3Qge1xuICAgICAgZmlsdGVyVGV4dCxcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgfSA9IHRoaXMuX21vZGVsLnN0YXRlO1xuICAgIHJldHVybiB7XG4gICAgICBkZXNlcmlhbGl6ZXI6ICdudWNsaWRlLkNvbnNvbGUnLFxuICAgICAgZmlsdGVyVGV4dCxcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICB1bnNlbGVjdGVkU2V2ZXJpdGllczogW1xuICAgICAgICAuLi5zZXREaWZmZXJlbmNlKEFMTF9TRVZFUklUSUVTLCBzZWxlY3RlZFNldmVyaXRpZXMpLFxuICAgICAgXSxcbiAgICB9O1xuICB9XG5cbiAgX3NlbGVjdFNvdXJjZXMgPSAoc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICBjb25zdCBzb3VyY2VJZHMgPSB0aGlzLl9nZXRTb3VyY2VzKCkubWFwKHNvdXJjZSA9PiBzb3VyY2UuaWQpO1xuICAgIGNvbnN0IHVuc2VsZWN0ZWRTb3VyY2VJZHMgPSBzb3VyY2VJZHMuZmlsdGVyKFxuICAgICAgc291cmNlSWQgPT4gc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihzb3VyY2VJZCkgPT09IC0xLFxuICAgICk7XG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe3Vuc2VsZWN0ZWRTb3VyY2VJZHN9KTtcbiAgfTtcblxuICAvKiogVW5zZWxlY3RzIHRoZSBzb3VyY2VzIGZyb20gdGhlIGdpdmVuIElEcyAqL1xuICB1bnNlbGVjdFNvdXJjZXMoaWRzOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgY29uc3QgbmV3SWRzID0gaWRzLmZpbHRlcihcbiAgICAgIGlkID0+ICF0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLmluY2x1ZGVzKGlkKSxcbiAgICApO1xuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHtcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMuY29uY2F0KG5ld0lkcyksXG4gICAgfSk7XG4gIH1cblxuICBfdXBkYXRlRmlsdGVyID0gKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKTogdm9pZCA9PiB7XG4gICAgY29uc3Qge3RleHQsIGlzUmVnRXhwfSA9IGNoYW5nZTtcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7XG4gICAgICBmaWx0ZXJUZXh0OiB0ZXh0LFxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyOiBpc1JlZ0V4cCxcbiAgICB9KTtcbiAgfTtcblxuICBfdG9nZ2xlU2V2ZXJpdHkgPSAoc2V2ZXJpdHk6IFNldmVyaXR5KTogdm9pZCA9PiB7XG4gICAgY29uc3Qge3NlbGVjdGVkU2V2ZXJpdGllc30gPSB0aGlzLl9tb2RlbC5zdGF0ZTtcbiAgICBjb25zdCBuZXh0U2VsZWN0ZWRTZXZlcml0aWVzID0gbmV3IFNldChzZWxlY3RlZFNldmVyaXRpZXMpO1xuICAgIGlmIChuZXh0U2VsZWN0ZWRTZXZlcml0aWVzLmhhcyhzZXZlcml0eSkpIHtcbiAgICAgIG5leHRTZWxlY3RlZFNldmVyaXRpZXMuZGVsZXRlKHNldmVyaXR5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5hZGQoc2V2ZXJpdHkpO1xuICAgIH1cbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7c2VsZWN0ZWRTZXZlcml0aWVzOiBuZXh0U2VsZWN0ZWRTZXZlcml0aWVzfSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZXMob3B0aW9uczoge1xuICByZWNvcmRzOiBMaXN0PFJlY29yZD4sXG4gIHByb3ZpZGVyczogTWFwPHN0cmluZywgU291cmNlSW5mbz4sXG4gIHByb3ZpZGVyU3RhdHVzZXM6IE1hcDxzdHJpbmcsIENvbnNvbGVTb3VyY2VTdGF0dXM+LFxufSk6IEFycmF5PFNvdXJjZT4ge1xuICBjb25zdCB7cHJvdmlkZXJzLCBwcm92aWRlclN0YXR1c2VzLCByZWNvcmRzfSA9IG9wdGlvbnM7XG5cbiAgLy8gQ29udmVydCB0aGUgcHJvdmlkZXJzIHRvIGEgbWFwIG9mIHNvdXJjZXMuXG4gIGNvbnN0IG1hcE9mU291cmNlcyA9IG5ldyBNYXAoXG4gICAgQXJyYXkuZnJvbShwcm92aWRlcnMuZW50cmllcygpKS5tYXAoKFtrLCBwcm92aWRlcl0pID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IHtcbiAgICAgICAgaWQ6IHByb3ZpZGVyLmlkLFxuICAgICAgICBuYW1lOiBwcm92aWRlci5uYW1lLFxuICAgICAgICBzdGF0dXM6IHByb3ZpZGVyU3RhdHVzZXMuZ2V0KHByb3ZpZGVyLmlkKSB8fCAnc3RvcHBlZCcsXG4gICAgICAgIHN0YXJ0OlxuICAgICAgICAgIHR5cGVvZiBwcm92aWRlci5zdGFydCA9PT0gJ2Z1bmN0aW9uJyA/IHByb3ZpZGVyLnN0YXJ0IDogdW5kZWZpbmVkLFxuICAgICAgICBzdG9wOiB0eXBlb2YgcHJvdmlkZXIuc3RvcCA9PT0gJ2Z1bmN0aW9uJyA/IHByb3ZpZGVyLnN0b3AgOiB1bmRlZmluZWQsXG4gICAgICB9O1xuICAgICAgcmV0dXJuIFtrLCBzb3VyY2VdO1xuICAgIH0pLFxuICApO1xuXG4gIC8vIFNvbWUgcHJvdmlkZXJzIG1heSBoYXZlIGJlZW4gdW5yZWdpc3RlcmVkLCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBBZGQgc291cmNlcyBmb3IgdGhlbSB0b28uXG4gIC8vIFRPRE86IEl0ZXJhdGluZyBvdmVyIGFsbCB0aGUgcmVjb3JkcyB0byBnZXQgdGhpcyBldmVyeSB0aW1lIHdlIGdldCBhIG5ldyByZWNvcmQgaXMgaW5lZmZpY2llbnQuXG4gIHJlY29yZHMuZm9yRWFjaCgocmVjb3JkLCBpKSA9PiB7XG4gICAgaWYgKCFtYXBPZlNvdXJjZXMuaGFzKHJlY29yZC5zb3VyY2VJZCkpIHtcbiAgICAgIG1hcE9mU291cmNlcy5zZXQocmVjb3JkLnNvdXJjZUlkLCB7XG4gICAgICAgIGlkOiByZWNvcmQuc291cmNlSWQsXG4gICAgICAgIG5hbWU6IHJlY29yZC5zb3VyY2VJZCxcbiAgICAgICAgc3RhdHVzOiAnc3RvcHBlZCcsXG4gICAgICAgIHN0YXJ0OiB1bmRlZmluZWQsXG4gICAgICAgIHN0b3A6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIEFycmF5LmZyb20obWFwT2ZTb3VyY2VzLnZhbHVlcygpKTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyUmVjb3JkcyhcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcbiAgc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcbiAgZmlsdGVyUGF0dGVybjogP1JlZ0V4cCxcbiAgZmlsdGVyU291cmNlczogYm9vbGVhbixcbik6IEFycmF5PFJlY29yZD4ge1xuICBpZiAoXG4gICAgIWZpbHRlclNvdXJjZXMgJiZcbiAgICBmaWx0ZXJQYXR0ZXJuID09IG51bGwgJiZcbiAgICBhcmVTZXRzRXF1YWwoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcylcbiAgKSB7XG4gICAgcmV0dXJuIHJlY29yZHM7XG4gIH1cblxuICByZXR1cm4gcmVjb3Jkcy5maWx0ZXIocmVjb3JkID0+IHtcbiAgICAvLyBPbmx5IGZpbHRlciByZWd1bGFyIG1lc3NhZ2VzXG4gICAgaWYgKHJlY29yZC5raW5kICE9PSAnbWVzc2FnZScpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICghc2VsZWN0ZWRTZXZlcml0aWVzLmhhcyhsZXZlbFRvU2V2ZXJpdHkocmVjb3JkLmxldmVsKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VNYXRjaGVzID0gc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihyZWNvcmQuc291cmNlSWQpICE9PSAtMTtcbiAgICByZXR1cm4gKFxuICAgICAgc291cmNlTWF0Y2hlcyAmJlxuICAgICAgKGZpbHRlclBhdHRlcm4gPT0gbnVsbCB8fCBmaWx0ZXJQYXR0ZXJuLnRlc3QocmVjb3JkLnRleHQpKVxuICAgICk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZXJpYWxpemVSZWNvcmRPYmplY3QoXG4gIHZpc2l0ZWQ6IFNldDxzdHJpbmc+LFxuICBleHByZXNzaW9uOiBJRXhwcmVzc2lvbixcbiAgdGV4dDogc3RyaW5nLFxuICBsZXZlbDogbnVtYmVyLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgZ2V0VGV4dCA9IGV4cCA9PiB7XG4gICAgbGV0IGluZGVudCA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGV2ZWw7IGkrKykge1xuICAgICAgaW5kZW50ICs9ICdcXHQnO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZW50ICsgZXhwLmdldFZhbHVlKCk7XG4gIH07XG5cbiAgaWYgKCFleHByZXNzaW9uLmhhc0NoaWxkcmVuKCkpIHtcbiAgICAvLyBMZWFmIG5vZGUuXG4gICAgcmV0dXJuIHRleHQgKyBnZXRUZXh0KGV4cHJlc3Npb24pO1xuICB9XG5cbiAgY29uc3QgaWQgPSBleHByZXNzaW9uLmdldElkKCk7XG4gIGlmICh2aXNpdGVkLmhhcyhpZCkpIHtcbiAgICAvLyBHdWFyZCBhZ2FpbnN0IGN5Y2xlcy5cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIHZpc2l0ZWQuYWRkKGlkKTtcblxuICBjb25zdCBjaGlsZHJlbiA9IGF3YWl0IGV4cHJlc3Npb24uZ2V0Q2hpbGRyZW4oKTtcbiAgY29uc3Qgc2VyaWFsaXplZFByb3BzID0gY2hpbGRyZW4ubWFwKGNoaWxkUHJvcCA9PiB7XG4gICAgcmV0dXJuIHNlcmlhbGl6ZVJlY29yZE9iamVjdCh2aXNpdGVkLCBjaGlsZFByb3AsICcnLCBsZXZlbCArIDEpO1xuICB9KTtcbiAgcmV0dXJuIChcbiAgICBnZXRUZXh0KGV4cHJlc3Npb24pICsgJ1xcbicgKyAoYXdhaXQgUHJvbWlzZS5hbGwoc2VyaWFsaXplZFByb3BzKSkuam9pbignXFxuJylcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlUGFzdGUoXG4gIGNyZWF0ZVBhc3RlSW1wbDogQ3JlYXRlUGFzdGVGdW5jdGlvbixcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBsaW5lUHJvbWlzZXMgPSByZWNvcmRzXG4gICAgLmZpbHRlcihcbiAgICAgIHJlY29yZCA9PlxuICAgICAgICByZWNvcmQua2luZCA9PT0gJ21lc3NhZ2UnIHx8XG4gICAgICAgIHJlY29yZC5raW5kID09PSAncmVxdWVzdCcgfHxcbiAgICAgICAgcmVjb3JkLmtpbmQgPT09ICdyZXNwb25zZScsXG4gICAgKVxuICAgIC5tYXAoYXN5bmMgcmVjb3JkID0+IHtcbiAgICAgIGNvbnN0IGxldmVsID1cbiAgICAgICAgcmVjb3JkLmxldmVsICE9IG51bGwgPyByZWNvcmQubGV2ZWwudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpIDogJ0xPRyc7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSByZWNvcmQudGltZXN0YW1wLnRvTG9jYWxlU3RyaW5nKCk7XG4gICAgICBsZXQgdGV4dCA9IHJlY29yZC50ZXh0IHx8IEVSUk9SX1RSQU5TQ1JJQklOR19NRVNTQUdFO1xuXG4gICAgICBpZiAoXG4gICAgICAgIHJlY29yZC5raW5kID09PSAncmVzcG9uc2UnICYmXG4gICAgICAgIHJlY29yZC5leHByZXNzaW9ucyAhPSBudWxsICYmXG4gICAgICAgIHJlY29yZC5leHByZXNzaW9ucy5sZW5ndGggPiAwXG4gICAgICApIHtcbiAgICAgICAgdGV4dCA9ICcnO1xuICAgICAgICBmb3IgKGNvbnN0IGV4cHJlc3Npb24gb2YgcmVjb3JkLmV4cHJlc3Npb25zKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHJlY29yZCBoYXMgYSBkYXRhIG9iamVjdCwgYW5kIHRoZSBvYmplY3QgaGFzIGFuIElELFxuICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGV4cGFuZCB0aGUgbm9kZXMgb2YgdGhlIG9iamVjdCBhbmQgc2VyaWFsaXplIGl0XG4gICAgICAgICAgLy8gZm9yIHRoZSBwYXN0ZS5cbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYXdhaXQtaW4tbG9vcFxuICAgICAgICAgIHRleHQgKz0gYXdhaXQgc2VyaWFsaXplUmVjb3JkT2JqZWN0KG5ldyBTZXQoKSwgZXhwcmVzc2lvbiwgJycsIDApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgWyR7bGV2ZWx9XVske3JlY29yZC5zb3VyY2VJZH1dWyR7dGltZXN0YW1wfV1cXHQgJHt0ZXh0fWA7XG4gICAgfSk7XG5cbiAgY29uc3QgbGluZXMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobGluZVByb21pc2VzKSkuam9pbignXFxuJyk7XG5cbiAgaWYgKGxpbmVzID09PSAnJykge1xuICAgIC8vIENhbid0IGNyZWF0ZSBhbiBlbXB0eSBwYXN0ZSFcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICdUaGVyZSBpcyBub3RoaW5nIGluIHlvdXIgY29uc29sZSB0byBQYXN0ZSEgQ2hlY2sgeW91ciBjb25zb2xlIGZpbHRlcnMgYW5kIHRyeSBhZ2Fpbi4nLFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ0NyZWF0aW5nIFBhc3RlLi4uJyk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB1cmkgPSBhd2FpdCBjcmVhdGVQYXN0ZUltcGwoXG4gICAgICBsaW5lcyxcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6ICdOdWNsaWRlIENvbnNvbGUgUGFzdGUnLFxuICAgICAgfSxcbiAgICAgICdjb25zb2xlIHBhc3RlJyxcbiAgICApO1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKGBDcmVhdGVkIFBhc3RlIGF0ICR7dXJpfWApO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChlcnJvci5zdGRvdXQgPT0gbnVsbCkge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSBwYXN0ZTogJHtTdHJpbmcoZXJyb3IubWVzc2FnZSB8fCBlcnJvcil9YCxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGVycm9yTWVzc2FnZXMgPSBlcnJvci5zdGRvdXRcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgIC5tYXAoSlNPTi5wYXJzZSlcbiAgICAgIC5tYXAoZSA9PiBlLm1lc3NhZ2UpO1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwYXN0ZScsIHtcbiAgICAgIGRldGFpbDogZXJyb3JNZXNzYWdlcy5qb2luKCdcXG4nKSxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxldmVsVG9TZXZlcml0eShsZXZlbDogTGV2ZWwpOiBTZXZlcml0eSB7XG4gIHN3aXRjaCAobGV2ZWwpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICByZXR1cm4gJ2Vycm9yJztcbiAgICBjYXNlICd3YXJuaW5nJzpcbiAgICAgIHJldHVybiAnd2FybmluZyc7XG4gICAgY2FzZSAnbG9nJzpcbiAgICBjYXNlICdpbmZvJzpcbiAgICBjYXNlICdkZWJ1Zyc6XG4gICAgY2FzZSAnc3VjY2Vzcyc6XG4gICAgICByZXR1cm4gJ2luZm8nO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBBbGwgdGhlIGNvbG9ycyBhcmUgXCJpbmZvXCJcbiAgICAgIHJldHVybiAnaW5mbyc7XG4gIH1cbn1cbiJdfQ==