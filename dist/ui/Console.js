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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGUuanMiXSwibmFtZXMiOlsiV09SS1NQQUNFX1ZJRVdfVVJJIiwiRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UiLCJBTExfU0VWRVJJVElFUyIsIlNldCIsIkNvbnNvbGUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfYWN0aW9uQ3JlYXRvcnMiLCJfdGl0bGVDaGFuZ2VzIiwiX21vZGVsIiwiX3N0b3JlIiwiX2VsZW1lbnQiLCJfZGVzdHJveWVkIiwiX2dldFNvdXJjZXNNZW1vaXplZCIsImdldFNvdXJjZXMiLCJvcHRzIiwiYSIsImIiLCJfcmVzZXRBbGxGaWx0ZXJzIiwiX3NlbGVjdFNvdXJjZXMiLCJfZ2V0U291cmNlcyIsIm1hcCIsInMiLCJpZCIsInNldFN0YXRlIiwiZmlsdGVyVGV4dCIsIl9jcmVhdGVQYXN0ZSIsImRpc3BsYXlhYmxlUmVjb3JkcyIsIlNlbGVjdG9ycyIsImdldEFsbFJlY29yZHMiLCJnZXRTdGF0ZSIsInRvQXJyYXkiLCJjcmVhdGVQYXN0ZUltcGwiLCJjcmVhdGVQYXN0ZUZ1bmN0aW9uIiwiY3JlYXRlUGFzdGUiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZUlkcyIsInNvdXJjZSIsInVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJmaWx0ZXIiLCJzb3VyY2VJZCIsImluZGV4T2YiLCJfdXBkYXRlRmlsdGVyIiwiY2hhbmdlIiwidGV4dCIsImlzUmVnRXhwIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiX3RvZ2dsZVNldmVyaXR5Iiwic2V2ZXJpdHkiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJzdGF0ZSIsIm5leHRTZWxlY3RlZFNldmVyaXRpZXMiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJzdG9yZSIsImluaXRpYWxGaWx0ZXJUZXh0IiwiaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciIsImluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwiTW9kZWwiLCJCb29sZWFuIiwiUmVwbGF5U3ViamVjdCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwidG9PYnNlcnZhYmxlIiwidGFrZVVudGlsIiwiZ2V0VGl0bGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsInNoYXJlIiwiZ2V0SWNvbk5hbWUiLCJlbmFibGVkUHJvdmlkZXJDb3VudCIsInByb3ZpZGVycyIsInNpemUiLCJsZW5ndGgiLCJzb3VyY2VzIiwic2VsZWN0ZWRTb3VyY2UiLCJmaW5kIiwibmFtZSIsImdldERlZmF1bHRMb2NhdGlvbiIsImdldFVSSSIsIm9uRGlkQ2hhbmdlVGl0bGUiLCJjYWxsYmFjayIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJzdWJzY3JpYmUiLCJwcm92aWRlclN0YXR1c2VzIiwicmVjb3JkcyIsImluY29tcGxldGVSZWNvcmRzIiwiZGVzdHJveSIsIm5leHQiLCJjb3B5IiwiX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMiLCJleGVjdXRlIiwiY29kZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsInNlbGVjdEV4ZWN1dG9yIiwiZXhlY3V0b3JJZCIsImNsZWFyUmVjb3JkcyIsIl9nZXRGaWx0ZXJJbmZvIiwicGF0dGVybiIsImludmFsaWQiLCJmaWx0ZXJlZFJlY29yZHMiLCJmaWx0ZXJSZWNvcmRzIiwiZ2V0RWxlbWVudCIsImFjdGlvbkNyZWF0b3JzIiwiZ2xvYmFsU3RhdGVzIiwicHJvcHMiLCJsZXQiLCJhdWRpdCIsIm5leHRBbmltYXRpb25GcmFtZSIsImxvY2FsU3RhdGUiLCJnbG9iYWxTdGF0ZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJjdXJyZW50RXhlY3V0b3IiLCJleGVjdXRvcnMiLCJnZXQiLCJpbnZhbGlkRmlsdGVySW5wdXQiLCJ3YXRjaEVkaXRvciIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJoaXN0b3J5Iiwic2VsZWN0U291cmNlcyIsImdldFByb3ZpZGVyIiwidXBkYXRlRmlsdGVyIiwicmVzZXRBbGxGaWx0ZXJzIiwiZm9udFNpemUiLCJ0b2dnbGVTZXZlcml0eSIsIlN0YXRlZnVsQ29uc29sZVZpZXciLCJDb25zb2xlVmlldyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplciIsInVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RTb3VyY2VzIiwiaWRzIiwibmV3SWRzIiwiaW5jbHVkZXMiLCJjb25jYXQiLCJtYXBPZlNvdXJjZXMiLCJNYXAiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwiayIsInByb3ZpZGVyIiwic3RhdHVzIiwic3RhcnQiLCJ1bmRlZmluZWQiLCJzdG9wIiwiZm9yRWFjaCIsInJlY29yZCIsImkiLCJzZXQiLCJ2YWx1ZXMiLCJmaWx0ZXJQYXR0ZXJuIiwiZmlsdGVyU291cmNlcyIsImtpbmQiLCJsZXZlbFRvU2V2ZXJpdHkiLCJsZXZlbCIsInNvdXJjZU1hdGNoZXMiLCJ0ZXN0Iiwic2VyaWFsaXplUmVjb3JkT2JqZWN0IiwidmlzaXRlZCIsImV4cHJlc3Npb24iLCJnZXRUZXh0IiwiZXhwIiwiaW5kZW50IiwiZ2V0VmFsdWUiLCJoYXNDaGlsZHJlbiIsImdldElkIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsInNlcmlhbGl6ZWRQcm9wcyIsImNoaWxkUHJvcCIsIlByb21pc2UiLCJhbGwiLCJqb2luIiwibGluZVByb21pc2VzIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRpbWVzdGFtcCIsInRvTG9jYWxlU3RyaW5nIiwiZXhwcmVzc2lvbnMiLCJsaW5lcyIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkV2FybmluZyIsImFkZEluZm8iLCJ1cmkiLCJ0aXRsZSIsImFkZFN1Y2Nlc3MiLCJlcnJvciIsInN0ZG91dCIsImFkZEVycm9yIiwiU3RyaW5nIiwibWVzc2FnZSIsImVycm9yTWVzc2FnZXMiLCJ0cmltIiwic3BsaXQiLCJKU09OIiwicGFyc2UiLCJlIiwiZGV0YWlsIiwiZGlzbWlzc2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUE2QkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7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Q0FBbUJRLFFBQW5CLENBQTRCLHdCQUE1QixFQUFzRDtBQUNwRFMsTUFBQUEsTUFBTSxFQUFFTixhQUFhLENBQUNwQixJQUFkLENBQW1CLElBQW5CLENBRDRDO0FBRXBEMkIsTUFBQUEsV0FBVyxFQUFFO0FBRnVDLEtBQXREO0FBSUQ7QUFDRjs7QUFFRCxTQUFTOUMsZUFBVCxDQUF5QkMsS0FBekIsRUFBaUQ7QUFDL0MsVUFBUUEsS0FBUjtBQUNFLFNBQUssT0FBTDtBQUNFLGFBQU8sT0FBUDs7QUFDRixTQUFLLFNBQUw7QUFDRSxhQUFPLFNBQVA7O0FBQ0YsU0FBSyxLQUFMO0FBQ0EsU0FBSyxNQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxTQUFMO0FBQ0UsYUFBTyxNQUFQOztBQUNGO0FBQ0U7QUFDQSxhQUFPLE1BQVA7QUFaSjtBQWNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxyXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKlxyXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcclxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XHJcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxyXG4gKlxyXG4gKiBAZmxvd1xyXG4gKiBAZm9ybWF0XHJcbiAqL1xyXG5cclxuLyogZXNsaW50LWVudiBicm93c2VyICovXHJcblxyXG5pbXBvcnQgdHlwZSB7SUV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uLy4uJztcclxuaW1wb3J0IHR5cGUge1xyXG4gIENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSxcclxuICBDb25zb2xlU291cmNlU3RhdHVzLFxyXG4gIFJlY29yZCxcclxuICBTb3VyY2UsXHJcbiAgU3RvcmUsXHJcbiAgU291cmNlSW5mbyxcclxuICBTZXZlcml0eSxcclxuICBMZXZlbCxcclxuICBBcHBTdGF0ZSxcclxufSBmcm9tICcuLi90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHtDcmVhdGVQYXN0ZUZ1bmN0aW9ufSBmcm9tICcuLi90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHtSZWdFeHBGaWx0ZXJDaGFuZ2V9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XHJcblxyXG5pbXBvcnQgb2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy1hdG9tL29ic2VydmVQYW5lSXRlbVZpc2liaWxpdHknO1xyXG5pbXBvcnQge3NldERpZmZlcmVuY2UsIGFyZVNldHNFcXVhbH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvY29sbGVjdGlvbic7XHJcbmltcG9ydCBNb2RlbCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Nb2RlbCc7XHJcbmltcG9ydCBzaGFsbG93RXF1YWwgZnJvbSAnc2hhbGxvd2VxdWFsJztcclxuaW1wb3J0IHtiaW5kT2JzZXJ2YWJsZUFzUHJvcHN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2JpbmRPYnNlcnZhYmxlQXNQcm9wcyc7XHJcbmltcG9ydCB7cmVuZGVyUmVhY3RSb290fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9yZW5kZXJSZWFjdFJvb3QnO1xyXG5pbXBvcnQgbWVtb2l6ZVVudGlsQ2hhbmdlZCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9tZW1vaXplVW50aWxDaGFuZ2VkJztcclxuaW1wb3J0IHt0b2dnbGV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGUnO1xyXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcclxuaW1wb3J0IHtuZXh0QW5pbWF0aW9uRnJhbWV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGUnO1xyXG5pbXBvcnQgb2JzZXJ2YWJsZUZyb21SZWR1eFN0b3JlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGVGcm9tUmVkdXhTdG9yZSc7XHJcbmltcG9ydCB7Z2V0RmlsdGVyUGF0dGVybn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyJztcclxuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tICcuLi9yZWR1eC9BY3Rpb25zJztcclxuaW1wb3J0ICogYXMgU2VsZWN0b3JzIGZyb20gJy4uL3JlZHV4L1NlbGVjdG9ycyc7XHJcbmltcG9ydCBDb25zb2xlVmlldyBmcm9tICcuL0NvbnNvbGVWaWV3JztcclxuaW1wb3J0IHtMaXN0fSBmcm9tICdpbW11dGFibGUnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdH0gZnJvbSAncnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzJztcclxuXHJcbnR5cGUgT3B0aW9ucyA9IHt8XHJcbiAgc3RvcmU6IFN0b3JlLFxyXG4gIGluaXRpYWxGaWx0ZXJUZXh0Pzogc3RyaW5nLFxyXG4gIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI/OiBib29sZWFuLFxyXG4gIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzPzogQXJyYXk8c3RyaW5nPixcclxuICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM/OiBTZXQ8U2V2ZXJpdHk+LFxyXG58fTtcclxuXHJcbi8vXHJcbi8vIFN0YXRlIHVuaXF1ZSB0byB0aGlzIHBhcnRpY3VsYXIgQ29uc29sZSBpbnN0YW5jZVxyXG4vL1xyXG50eXBlIFN0YXRlID0ge1xyXG4gIGZpbHRlclRleHQ6IHN0cmluZyxcclxuICBlbmFibGVSZWdFeHBGaWx0ZXI6IGJvb2xlYW4sXHJcbiAgdW5zZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcclxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXHJcbn07XHJcblxyXG50eXBlIEJvdW5kQWN0aW9uQ3JlYXRvcnMgPSB7XHJcbiAgZXhlY3V0ZTogKGNvZGU6IHN0cmluZykgPT4gdm9pZCxcclxuICBzZWxlY3RFeGVjdXRvcjogKGV4ZWN1dG9ySWQ6IHN0cmluZykgPT4gdm9pZCxcclxuICBjbGVhclJlY29yZHM6ICgpID0+IHZvaWQsXHJcbn07XHJcblxyXG4vLyBPdGhlciBOdWNsaWRlIHBhY2thZ2VzICh3aGljaCBjYW5ub3QgaW1wb3J0IHRoaXMpIGRlcGVuZCBvbiB0aGlzIFVSSS4gSWYgdGhpc1xyXG4vLyBuZWVkcyB0byBiZSBjaGFuZ2VkLCBncmVwIGZvciBDT05TT0xFX1ZJRVdfVVJJIGFuZCBlbnN1cmUgdGhhdCB0aGUgVVJJcyBtYXRjaC5cclxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9WSUVXX1VSSSA9ICdhdG9tOi8vbnVjbGlkZS9jb25zb2xlJztcclxuXHJcbmNvbnN0IEVSUk9SX1RSQU5TQ1JJQklOR19NRVNTQUdFID1cclxuICBcIi8vIE51Y2xpZGUgY291bGRuJ3QgZmluZCB0aGUgcmlnaHQgdGV4dCB0byBkaXNwbGF5XCI7XHJcblxyXG5jb25zdCBBTExfU0VWRVJJVElFUyA9IG5ldyBTZXQoWydlcnJvcicsICd3YXJuaW5nJywgJ2luZm8nXSk7XHJcblxyXG4vKipcclxuICogQW4gQXRvbSBcInZpZXcgbW9kZWxcIiBmb3IgdGhlIGNvbnNvbGUuIFRoaXMgb2JqZWN0IGlzIHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHN0YXRlZnVsIHZpZXdcclxuICogKHZpYSBgZ2V0RWxlbWVudCgpYCkuIFRoYXQgdmlldyBpcyBib3VuZCB0byBib3RoIGdsb2JhbCBzdGF0ZSAoZnJvbSB0aGUgc3RvcmUpIGFuZCB2aWV3LXNwZWNpZmljXHJcbiAqIHN0YXRlIChmcm9tIHRoaXMgaW5zdGFuY2UncyBgX21vZGVsYCkuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ29uc29sZSB7XHJcbiAgX2FjdGlvbkNyZWF0b3JzOiBCb3VuZEFjdGlvbkNyZWF0b3JzO1xyXG5cclxuICBfdGl0bGVDaGFuZ2VzOiBPYnNlcnZhYmxlPHN0cmluZz47XHJcbiAgX21vZGVsOiBNb2RlbDxTdGF0ZT47XHJcbiAgX3N0b3JlOiBTdG9yZTtcclxuICBfZWxlbWVudDogP0hUTUxFbGVtZW50O1xyXG4gIF9kZXN0cm95ZWQ6IFJlcGxheVN1YmplY3Q8dm9pZD47XHJcblxyXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHtcclxuICAgICAgc3RvcmUsXHJcbiAgICAgIGluaXRpYWxGaWx0ZXJUZXh0LFxyXG4gICAgICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyLFxyXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzLFxyXG4gICAgfSA9IG9wdGlvbnM7XHJcbiAgICB0aGlzLl9tb2RlbCA9IG5ldyBNb2RlbCh7XHJcbiAgICAgIGRpc3BsYXlhYmxlUmVjb3JkczogW10sXHJcbiAgICAgIGZpbHRlclRleHQ6IGluaXRpYWxGaWx0ZXJUZXh0ID09IG51bGwgPyAnJyA6IGluaXRpYWxGaWx0ZXJUZXh0LFxyXG4gICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IEJvb2xlYW4oaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciksXHJcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6XHJcbiAgICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMgPT0gbnVsbCA/IFtdIDogaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllczpcclxuICAgICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXMgPT0gbnVsbFxyXG4gICAgICAgICAgPyBBTExfU0VWRVJJVElFU1xyXG4gICAgICAgICAgOiBzZXREaWZmZXJlbmNlKEFMTF9TRVZFUklUSUVTLCBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXMpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZTtcclxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xyXG5cclxuICAgIHRoaXMuX3RpdGxlQ2hhbmdlcyA9IE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgdGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksXHJcbiAgICAgIG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZShzdG9yZSksXHJcbiAgICApXHJcbiAgICAgIC50YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxyXG4gICAgICAubWFwKCgpID0+IHRoaXMuZ2V0VGl0bGUoKSlcclxuICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcclxuICAgICAgLnNoYXJlKCk7XHJcbiAgfVxyXG5cclxuICBnZXRJY29uTmFtZSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuICdudWNsaWNvbi1jb25zb2xlJztcclxuICB9XHJcblxyXG4gIC8vIEdldCB0aGUgcGFuZSBpdGVtJ3MgdGl0bGUuIElmIHRoZXJlJ3Mgb25seSBvbmUgc291cmNlIHNlbGVjdGVkLCB3ZSdsbCB1c2UgdGhhdCB0byBtYWtlIGEgbW9yZVxyXG4gIC8vIGRlc2NyaXB0aXZlIHRpdGxlLlxyXG4gIGdldFRpdGxlKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBlbmFibGVkUHJvdmlkZXJDb3VudCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkucHJvdmlkZXJzLnNpemU7XHJcbiAgICBjb25zdCB7dW5zZWxlY3RlZFNvdXJjZUlkc30gPSB0aGlzLl9tb2RlbC5zdGF0ZTtcclxuXHJcbiAgICAvLyBDYWxsaW5nIGBfZ2V0U291cmNlcygpYCBpcyAoY3VycmVudGx5KSBleHBlbnNpdmUgYmVjYXVzZSBpdCBuZWVkcyB0byBzZWFyY2ggYWxsIHRoZSByZWNvcmRzXHJcbiAgICAvLyBmb3Igc291cmNlcyB0aGF0IGhhdmUgYmVlbiBkaXNhYmxlZCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBXZSB0cnkgdG8gYXZvaWQgY2FsbGluZyBpdCBpZiB3ZVxyXG4gICAgLy8gYWxyZWFkeSBrbm93IHRoYXQgdGhlcmUncyBtb3JlIHRoYW4gb25lIHNlbGVjdGVkIHNvdXJjZS5cclxuICAgIGlmIChlbmFibGVkUHJvdmlkZXJDb3VudCAtIHVuc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoID4gMSkge1xyXG4gICAgICByZXR1cm4gJ0NvbnNvbGUnO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZXJlJ3Mgb25seSBvbmUgc291cmNlIHNlbGVjdGVkLCB1c2UgaXRzIG5hbWUgaW4gdGhlIHRhYiB0aXRsZS5cclxuICAgIGNvbnN0IHNvdXJjZXMgPSB0aGlzLl9nZXRTb3VyY2VzKCk7XHJcbiAgICBpZiAoc291cmNlcy5sZW5ndGggLSB1bnNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICBjb25zdCBzZWxlY3RlZFNvdXJjZSA9IHNvdXJjZXMuZmluZChcclxuICAgICAgICBzb3VyY2UgPT4gdW5zZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZS5pZCkgPT09IC0xLFxyXG4gICAgICApO1xyXG4gICAgICBpZiAoc2VsZWN0ZWRTb3VyY2UpIHtcclxuICAgICAgICByZXR1cm4gYENvbnNvbGU6ICR7c2VsZWN0ZWRTb3VyY2UubmFtZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICdDb25zb2xlJztcclxuICB9XHJcblxyXG4gIGdldERlZmF1bHRMb2NhdGlvbigpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuICdib3R0b20nO1xyXG4gIH1cclxuXHJcbiAgZ2V0VVJJKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gV09SS1NQQUNFX1ZJRVdfVVJJO1xyXG4gIH1cclxuXHJcbiAgb25EaWRDaGFuZ2VUaXRsZShjYWxsYmFjazogKHRpdGxlOiBzdHJpbmcpID0+IG1peGVkKTogSURpc3Bvc2FibGUge1xyXG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKHRoaXMuX3RpdGxlQ2hhbmdlcy5zdWJzY3JpYmUoY2FsbGJhY2spKTtcclxuICB9XHJcblxyXG4gIF9nZXRTb3VyY2VzKCk6IEFycmF5PFNvdXJjZT4ge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBwcm92aWRlcnMsXHJcbiAgICAgIHByb3ZpZGVyU3RhdHVzZXMsXHJcbiAgICAgIHJlY29yZHMsXHJcbiAgICAgIGluY29tcGxldGVSZWNvcmRzLFxyXG4gICAgfSA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCk7XHJcbiAgICByZXR1cm4gdGhpcy5fZ2V0U291cmNlc01lbW9pemVkKHtcclxuICAgICAgcHJvdmlkZXJzLFxyXG4gICAgICBwcm92aWRlclN0YXR1c2VzLFxyXG4gICAgICByZWNvcmRzLFxyXG4gICAgICBpbmNvbXBsZXRlUmVjb3JkcyxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gTWVtb2l6ZSBgZ2V0U291cmNlcygpYC4gVW5mb3J0dW5hdGVseSwgc2luY2Ugd2UgbG9vayBmb3IgdW5yZXByZXNlbnRlZCBzb3VyY2VzIGluIHRoZSByZWNvcmRcclxuICAvLyBsaXN0LCB0aGlzIHN0aWxsIG5lZWRzIHRvIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgcmVjb3JkcyBjaGFuZ2UuXHJcbiAgLy8gVE9ETzogQ29uc2lkZXIgcmVtb3ZpbmcgcmVjb3JkcyB3aGVuIHRoZWlyIHNvdXJjZSBpcyByZW1vdmVkLiBUaGlzIHdpbGwgbGlrZWx5IHJlcXVpcmUgYWRkaW5nXHJcbiAgLy8gdGhlIGFiaWxpdHkgdG8gZW5hYmxlIGFuZCBkaXNhYmxlIHNvdXJjZXMgc28sIGZvciBleGFtcGxlLCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBubyBsb25nZXJcclxuICAvLyBhY3RpdmUsIGl0IHN0aWxsIHJlbWFpbnMgaW4gdGhlIHNvdXJjZSBsaXN0LlxyXG4gIC8vICRGbG93Rml4TWUgKD49MC44NS4wKSAoVDM1OTg2ODk2KSBGbG93IHVwZ3JhZGUgc3VwcHJlc3NcclxuICBfZ2V0U291cmNlc01lbW9pemVkID0gbWVtb2l6ZVVudGlsQ2hhbmdlZChcclxuICAgIGdldFNvdXJjZXMsXHJcbiAgICBvcHRzID0+IG9wdHMsXHJcbiAgICAoYSwgYikgPT4gc2hhbGxvd0VxdWFsKGEsIGIpLFxyXG4gICk7XHJcblxyXG4gIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xyXG4gIH1cclxuXHJcbiAgY29weSgpOiBDb25zb2xlIHtcclxuICAgIHJldHVybiBuZXcgQ29uc29sZSh7XHJcbiAgICAgIHN0b3JlOiB0aGlzLl9zdG9yZSxcclxuICAgICAgaW5pdGlhbEZpbHRlclRleHQ6IHRoaXMuX21vZGVsLnN0YXRlLmZpbHRlclRleHQsXHJcbiAgICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI6IHRoaXMuX21vZGVsLnN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllczogc2V0RGlmZmVyZW5jZShcclxuICAgICAgICBBTExfU0VWRVJJVElFUyxcclxuICAgICAgICB0aGlzLl9tb2RlbC5zdGF0ZS5zZWxlY3RlZFNldmVyaXRpZXMsXHJcbiAgICAgICksXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIF9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKCk6IEJvdW5kQWN0aW9uQ3JlYXRvcnMge1xyXG4gICAgaWYgKHRoaXMuX2FjdGlvbkNyZWF0b3JzID09IG51bGwpIHtcclxuICAgICAgdGhpcy5fYWN0aW9uQ3JlYXRvcnMgPSB7XHJcbiAgICAgICAgZXhlY3V0ZTogY29kZSA9PiB7XHJcbiAgICAgICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChBY3Rpb25zLmV4ZWN1dGUoY29kZSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VsZWN0RXhlY3V0b3I6IGV4ZWN1dG9ySWQgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2goQWN0aW9ucy5zZWxlY3RFeGVjdXRvcihleGVjdXRvcklkKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbGVhclJlY29yZHM6ICgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuY2xlYXJSZWNvcmRzKCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYWN0aW9uQ3JlYXRvcnM7XHJcbiAgfVxyXG5cclxuICBfcmVzZXRBbGxGaWx0ZXJzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5fc2VsZWN0U291cmNlcyh0aGlzLl9nZXRTb3VyY2VzKCkubWFwKHMgPT4gcy5pZCkpO1xyXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe2ZpbHRlclRleHQ6ICcnfSk7XHJcbiAgfTtcclxuXHJcbiAgX2NyZWF0ZVBhc3RlID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xyXG4gICAgY29uc3QgZGlzcGxheWFibGVSZWNvcmRzID0gU2VsZWN0b3JzLmdldEFsbFJlY29yZHMoXHJcbiAgICAgIHRoaXMuX3N0b3JlLmdldFN0YXRlKCksXHJcbiAgICApLnRvQXJyYXkoKTtcclxuICAgIGNvbnN0IGNyZWF0ZVBhc3RlSW1wbCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkuY3JlYXRlUGFzdGVGdW5jdGlvbjtcclxuICAgIGlmIChjcmVhdGVQYXN0ZUltcGwgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY3JlYXRlUGFzdGUoY3JlYXRlUGFzdGVJbXBsLCBkaXNwbGF5YWJsZVJlY29yZHMpO1xyXG4gIH07XHJcblxyXG4gIF9nZXRGaWx0ZXJJbmZvKCk6IHtcclxuICAgIGludmFsaWQ6IGJvb2xlYW4sXHJcbiAgICBzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcclxuICAgIGZpbHRlcmVkUmVjb3JkczogQXJyYXk8UmVjb3JkPixcclxuICAgIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcclxuICB9IHtcclxuICAgIGNvbnN0IHtwYXR0ZXJuLCBpbnZhbGlkfSA9IGdldEZpbHRlclBhdHRlcm4oXHJcbiAgICAgIHRoaXMuX21vZGVsLnN0YXRlLmZpbHRlclRleHQsXHJcbiAgICAgIHRoaXMuX21vZGVsLnN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICk7XHJcbiAgICBjb25zdCBzb3VyY2VzID0gdGhpcy5fZ2V0U291cmNlcygpO1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRTb3VyY2VJZHMgPSBzb3VyY2VzXHJcbiAgICAgIC5tYXAoc291cmNlID0+IHNvdXJjZS5pZClcclxuICAgICAgLmZpbHRlcihcclxuICAgICAgICBzb3VyY2VJZCA9PlxyXG4gICAgICAgICAgdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZUlkKSA9PT0gLTEsXHJcbiAgICAgICk7XHJcblxyXG4gICAgY29uc3Qge3NlbGVjdGVkU2V2ZXJpdGllc30gPSB0aGlzLl9tb2RlbC5zdGF0ZTtcclxuICAgIGNvbnN0IGZpbHRlcmVkUmVjb3JkcyA9IGZpbHRlclJlY29yZHMoXHJcbiAgICAgIFNlbGVjdG9ycy5nZXRBbGxSZWNvcmRzKHRoaXMuX3N0b3JlLmdldFN0YXRlKCkpLnRvQXJyYXkoKSxcclxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcclxuICAgICAgcGF0dGVybixcclxuICAgICAgc291cmNlcy5sZW5ndGggIT09IHNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCxcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaW52YWxpZCxcclxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcclxuICAgICAgZmlsdGVyZWRSZWNvcmRzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGdldEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xyXG4gICAgaWYgKHRoaXMuX2VsZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhY3Rpb25DcmVhdG9ycyA9IHRoaXMuX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMoKTtcclxuICAgIGNvbnN0IGdsb2JhbFN0YXRlczogT2JzZXJ2YWJsZTxBcHBTdGF0ZT4gPSBvYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUoXHJcbiAgICAgIHRoaXMuX3N0b3JlLFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBwcm9wcyA9IE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgdGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksXHJcbiAgICAgIGdsb2JhbFN0YXRlcyxcclxuICAgIClcclxuICAgICAgLy8gRG9uJ3QgcmUtcmVuZGVyIHdoZW4gdGhlIGNvbnNvbGUgaXNuJ3QgdmlzaWJsZS5cclxuICAgICAgLmxldCh0b2dnbGUob2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSh0aGlzKSkpXHJcbiAgICAgIC5hdWRpdCgoKSA9PiBuZXh0QW5pbWF0aW9uRnJhbWUpXHJcbiAgICAgIC5tYXAoKFtsb2NhbFN0YXRlLCBnbG9iYWxTdGF0ZV0pID0+IHtcclxuICAgICAgICBjb25zdCB7XHJcbiAgICAgICAgICBpbnZhbGlkLFxyXG4gICAgICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXHJcbiAgICAgICAgICBmaWx0ZXJlZFJlY29yZHMsXHJcbiAgICAgICAgfSA9IHRoaXMuX2dldEZpbHRlckluZm8oKTtcclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudEV4ZWN1dG9ySWQgPSBTZWxlY3RvcnMuZ2V0Q3VycmVudEV4ZWN1dG9ySWQoZ2xvYmFsU3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvciA9XHJcbiAgICAgICAgICBjdXJyZW50RXhlY3V0b3JJZCAhPSBudWxsXHJcbiAgICAgICAgICAgID8gZ2xvYmFsU3RhdGUuZXhlY3V0b3JzLmdldChjdXJyZW50RXhlY3V0b3JJZClcclxuICAgICAgICAgICAgOiBudWxsO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaW52YWxpZEZpbHRlcklucHV0OiBpbnZhbGlkLFxyXG4gICAgICAgICAgZXhlY3V0ZTogYWN0aW9uQ3JlYXRvcnMuZXhlY3V0ZSxcclxuICAgICAgICAgIHNlbGVjdEV4ZWN1dG9yOiBhY3Rpb25DcmVhdG9ycy5zZWxlY3RFeGVjdXRvcixcclxuICAgICAgICAgIGNsZWFyUmVjb3JkczogYWN0aW9uQ3JlYXRvcnMuY2xlYXJSZWNvcmRzLFxyXG4gICAgICAgICAgY3JlYXRlUGFzdGU6XHJcbiAgICAgICAgICAgIGdsb2JhbFN0YXRlLmNyZWF0ZVBhc3RlRnVuY3Rpb24gPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9jcmVhdGVQYXN0ZSxcclxuICAgICAgICAgIHdhdGNoRWRpdG9yOiBnbG9iYWxTdGF0ZS53YXRjaEVkaXRvcixcclxuICAgICAgICAgIGN1cnJlbnRFeGVjdXRvcixcclxuICAgICAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IGxvY2FsU3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgICAgIGZpbHRlclRleHQ6IGxvY2FsU3RhdGUuZmlsdGVyVGV4dCxcclxuICAgICAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcjogbG9jYWxTdGF0ZS5lbmFibGVSZWdFeHBGaWx0ZXIsXHJcbiAgICAgICAgICByZWNvcmRzOiBmaWx0ZXJlZFJlY29yZHMsXHJcbiAgICAgICAgICBmaWx0ZXJlZFJlY29yZENvdW50OlxyXG4gICAgICAgICAgICBTZWxlY3RvcnMuZ2V0QWxsUmVjb3JkcyhnbG9iYWxTdGF0ZSkuc2l6ZSAtIGZpbHRlcmVkUmVjb3Jkcy5sZW5ndGgsXHJcbiAgICAgICAgICBoaXN0b3J5OiBnbG9iYWxTdGF0ZS5oaXN0b3J5LFxyXG4gICAgICAgICAgc291cmNlczogdGhpcy5fZ2V0U291cmNlcygpLFxyXG4gICAgICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgICAgICBzZWxlY3RTb3VyY2VzOiB0aGlzLl9zZWxlY3RTb3VyY2VzLFxyXG4gICAgICAgICAgZXhlY3V0b3JzOiBnbG9iYWxTdGF0ZS5leGVjdXRvcnMsXHJcbiAgICAgICAgICBnZXRQcm92aWRlcjogaWQgPT4gZ2xvYmFsU3RhdGUucHJvdmlkZXJzLmdldChpZCksXHJcbiAgICAgICAgICB1cGRhdGVGaWx0ZXI6IHRoaXMuX3VwZGF0ZUZpbHRlcixcclxuICAgICAgICAgIHJlc2V0QWxsRmlsdGVyczogdGhpcy5fcmVzZXRBbGxGaWx0ZXJzLFxyXG4gICAgICAgICAgZm9udFNpemU6IGdsb2JhbFN0YXRlLmZvbnRTaXplLFxyXG4gICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxyXG4gICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk6IHRoaXMuX3RvZ2dsZVNldmVyaXR5LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IFN0YXRlZnVsQ29uc29sZVZpZXcgPSBiaW5kT2JzZXJ2YWJsZUFzUHJvcHMocHJvcHMsIENvbnNvbGVWaWV3KTtcclxuICAgIHJldHVybiAodGhpcy5fZWxlbWVudCA9IHJlbmRlclJlYWN0Um9vdCg8U3RhdGVmdWxDb25zb2xlVmlldyAvPikpO1xyXG4gIH1cclxuXHJcbiAgc2VyaWFsaXplKCk6IENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIGZpbHRlclRleHQsXHJcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxyXG4gICAgfSA9IHRoaXMuX21vZGVsLnN0YXRlO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZGVzZXJpYWxpemVyOiAnbnVjbGlkZS5Db25zb2xlJyxcclxuICAgICAgZmlsdGVyVGV4dCxcclxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyLFxyXG4gICAgICB1bnNlbGVjdGVkU291cmNlSWRzLFxyXG4gICAgICB1bnNlbGVjdGVkU2V2ZXJpdGllczogW1xyXG4gICAgICAgIC4uLnNldERpZmZlcmVuY2UoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcyksXHJcbiAgICAgIF0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgX3NlbGVjdFNvdXJjZXMgPSAoc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4pOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IHNvdXJjZUlkcyA9IHRoaXMuX2dldFNvdXJjZXMoKS5tYXAoc291cmNlID0+IHNvdXJjZS5pZCk7XHJcbiAgICBjb25zdCB1bnNlbGVjdGVkU291cmNlSWRzID0gc291cmNlSWRzLmZpbHRlcihcclxuICAgICAgc291cmNlSWQgPT4gc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihzb3VyY2VJZCkgPT09IC0xLFxyXG4gICAgKTtcclxuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHt1bnNlbGVjdGVkU291cmNlSWRzfSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIFVuc2VsZWN0cyB0aGUgc291cmNlcyBmcm9tIHRoZSBnaXZlbiBJRHMgKi9cclxuICB1bnNlbGVjdFNvdXJjZXMoaWRzOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XHJcbiAgICBjb25zdCBuZXdJZHMgPSBpZHMuZmlsdGVyKFxyXG4gICAgICBpZCA9PiAhdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5pbmNsdWRlcyhpZCksXHJcbiAgICApO1xyXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe1xyXG4gICAgICB1bnNlbGVjdGVkU291cmNlSWRzOiB0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLmNvbmNhdChuZXdJZHMpLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBfdXBkYXRlRmlsdGVyID0gKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKTogdm9pZCA9PiB7XHJcbiAgICBjb25zdCB7dGV4dCwgaXNSZWdFeHB9ID0gY2hhbmdlO1xyXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe1xyXG4gICAgICBmaWx0ZXJUZXh0OiB0ZXh0LFxyXG4gICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IGlzUmVnRXhwLFxyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgX3RvZ2dsZVNldmVyaXR5ID0gKHNldmVyaXR5OiBTZXZlcml0eSk6IHZvaWQgPT4ge1xyXG4gICAgY29uc3Qge3NlbGVjdGVkU2V2ZXJpdGllc30gPSB0aGlzLl9tb2RlbC5zdGF0ZTtcclxuICAgIGNvbnN0IG5leHRTZWxlY3RlZFNldmVyaXRpZXMgPSBuZXcgU2V0KHNlbGVjdGVkU2V2ZXJpdGllcyk7XHJcbiAgICBpZiAobmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5oYXMoc2V2ZXJpdHkpKSB7XHJcbiAgICAgIG5leHRTZWxlY3RlZFNldmVyaXRpZXMuZGVsZXRlKHNldmVyaXR5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5leHRTZWxlY3RlZFNldmVyaXRpZXMuYWRkKHNldmVyaXR5KTtcclxuICAgIH1cclxuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHtzZWxlY3RlZFNldmVyaXRpZXM6IG5leHRTZWxlY3RlZFNldmVyaXRpZXN9KTtcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTb3VyY2VzKG9wdGlvbnM6IHtcclxuICByZWNvcmRzOiBMaXN0PFJlY29yZD4sXHJcbiAgcHJvdmlkZXJzOiBNYXA8c3RyaW5nLCBTb3VyY2VJbmZvPixcclxuICBwcm92aWRlclN0YXR1c2VzOiBNYXA8c3RyaW5nLCBDb25zb2xlU291cmNlU3RhdHVzPixcclxufSk6IEFycmF5PFNvdXJjZT4ge1xyXG4gIGNvbnN0IHtwcm92aWRlcnMsIHByb3ZpZGVyU3RhdHVzZXMsIHJlY29yZHN9ID0gb3B0aW9ucztcclxuXHJcbiAgLy8gQ29udmVydCB0aGUgcHJvdmlkZXJzIHRvIGEgbWFwIG9mIHNvdXJjZXMuXHJcbiAgY29uc3QgbWFwT2ZTb3VyY2VzID0gbmV3IE1hcChcclxuICAgIEFycmF5LmZyb20ocHJvdmlkZXJzLmVudHJpZXMoKSkubWFwKChbaywgcHJvdmlkZXJdKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNvdXJjZSA9IHtcclxuICAgICAgICBpZDogcHJvdmlkZXIuaWQsXHJcbiAgICAgICAgbmFtZTogcHJvdmlkZXIubmFtZSxcclxuICAgICAgICBzdGF0dXM6IHByb3ZpZGVyU3RhdHVzZXMuZ2V0KHByb3ZpZGVyLmlkKSB8fCAnc3RvcHBlZCcsXHJcbiAgICAgICAgc3RhcnQ6XHJcbiAgICAgICAgICB0eXBlb2YgcHJvdmlkZXIuc3RhcnQgPT09ICdmdW5jdGlvbicgPyBwcm92aWRlci5zdGFydCA6IHVuZGVmaW5lZCxcclxuICAgICAgICBzdG9wOiB0eXBlb2YgcHJvdmlkZXIuc3RvcCA9PT0gJ2Z1bmN0aW9uJyA/IHByb3ZpZGVyLnN0b3AgOiB1bmRlZmluZWQsXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBbaywgc291cmNlXTtcclxuICAgIH0pLFxyXG4gICk7XHJcblxyXG4gIC8vIFNvbWUgcHJvdmlkZXJzIG1heSBoYXZlIGJlZW4gdW5yZWdpc3RlcmVkLCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBBZGQgc291cmNlcyBmb3IgdGhlbSB0b28uXHJcbiAgLy8gVE9ETzogSXRlcmF0aW5nIG92ZXIgYWxsIHRoZSByZWNvcmRzIHRvIGdldCB0aGlzIGV2ZXJ5IHRpbWUgd2UgZ2V0IGEgbmV3IHJlY29yZCBpcyBpbmVmZmljaWVudC5cclxuICByZWNvcmRzLmZvckVhY2goKHJlY29yZCwgaSkgPT4ge1xyXG4gICAgaWYgKCFtYXBPZlNvdXJjZXMuaGFzKHJlY29yZC5zb3VyY2VJZCkpIHtcclxuICAgICAgbWFwT2ZTb3VyY2VzLnNldChyZWNvcmQuc291cmNlSWQsIHtcclxuICAgICAgICBpZDogcmVjb3JkLnNvdXJjZUlkLFxyXG4gICAgICAgIG5hbWU6IHJlY29yZC5zb3VyY2VJZCxcclxuICAgICAgICBzdGF0dXM6ICdzdG9wcGVkJyxcclxuICAgICAgICBzdGFydDogdW5kZWZpbmVkLFxyXG4gICAgICAgIHN0b3A6IHVuZGVmaW5lZCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBBcnJheS5mcm9tKG1hcE9mU291cmNlcy52YWx1ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbHRlclJlY29yZHMoXHJcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcclxuICBzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcclxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXHJcbiAgZmlsdGVyUGF0dGVybjogP1JlZ0V4cCxcclxuICBmaWx0ZXJTb3VyY2VzOiBib29sZWFuLFxyXG4pOiBBcnJheTxSZWNvcmQ+IHtcclxuICBpZiAoXHJcbiAgICAhZmlsdGVyU291cmNlcyAmJlxyXG4gICAgZmlsdGVyUGF0dGVybiA9PSBudWxsICYmXHJcbiAgICBhcmVTZXRzRXF1YWwoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcylcclxuICApIHtcclxuICAgIHJldHVybiByZWNvcmRzO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlY29yZHMuZmlsdGVyKHJlY29yZCA9PiB7XHJcbiAgICAvLyBPbmx5IGZpbHRlciByZWd1bGFyIG1lc3NhZ2VzXHJcbiAgICBpZiAocmVjb3JkLmtpbmQgIT09ICdtZXNzYWdlJykge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNlbGVjdGVkU2V2ZXJpdGllcy5oYXMobGV2ZWxUb1NldmVyaXR5KHJlY29yZC5sZXZlbCkpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzb3VyY2VNYXRjaGVzID0gc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihyZWNvcmQuc291cmNlSWQpICE9PSAtMTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIHNvdXJjZU1hdGNoZXMgJiZcclxuICAgICAgKGZpbHRlclBhdHRlcm4gPT0gbnVsbCB8fCBmaWx0ZXJQYXR0ZXJuLnRlc3QocmVjb3JkLnRleHQpKVxyXG4gICAgKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplUmVjb3JkT2JqZWN0KFxyXG4gIHZpc2l0ZWQ6IFNldDxzdHJpbmc+LFxyXG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxyXG4gIHRleHQ6IHN0cmluZyxcclxuICBsZXZlbDogbnVtYmVyLFxyXG4pOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGdldFRleHQgPSBleHAgPT4ge1xyXG4gICAgbGV0IGluZGVudCA9ICcnO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZXZlbDsgaSsrKSB7XHJcbiAgICAgIGluZGVudCArPSAnXFx0JztcclxuICAgIH1cclxuICAgIHJldHVybiBpbmRlbnQgKyBleHAuZ2V0VmFsdWUoKTtcclxuICB9O1xyXG5cclxuICBpZiAoIWV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKSkge1xyXG4gICAgLy8gTGVhZiBub2RlLlxyXG4gICAgcmV0dXJuIHRleHQgKyBnZXRUZXh0KGV4cHJlc3Npb24pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaWQgPSBleHByZXNzaW9uLmdldElkKCk7XHJcbiAgaWYgKHZpc2l0ZWQuaGFzKGlkKSkge1xyXG4gICAgLy8gR3VhcmQgYWdhaW5zdCBjeWNsZXMuXHJcbiAgICByZXR1cm4gdGV4dDtcclxuICB9XHJcblxyXG4gIHZpc2l0ZWQuYWRkKGlkKTtcclxuXHJcbiAgY29uc3QgY2hpbGRyZW4gPSBhd2FpdCBleHByZXNzaW9uLmdldENoaWxkcmVuKCk7XHJcbiAgY29uc3Qgc2VyaWFsaXplZFByb3BzID0gY2hpbGRyZW4ubWFwKGNoaWxkUHJvcCA9PiB7XHJcbiAgICByZXR1cm4gc2VyaWFsaXplUmVjb3JkT2JqZWN0KHZpc2l0ZWQsIGNoaWxkUHJvcCwgJycsIGxldmVsICsgMSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIChcclxuICAgIGdldFRleHQoZXhwcmVzc2lvbikgKyAnXFxuJyArIChhd2FpdCBQcm9taXNlLmFsbChzZXJpYWxpemVkUHJvcHMpKS5qb2luKCdcXG4nKVxyXG4gICk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVBhc3RlKFxyXG4gIGNyZWF0ZVBhc3RlSW1wbDogQ3JlYXRlUGFzdGVGdW5jdGlvbixcclxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxyXG4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBsaW5lUHJvbWlzZXMgPSByZWNvcmRzXHJcbiAgICAuZmlsdGVyKFxyXG4gICAgICByZWNvcmQgPT5cclxuICAgICAgICByZWNvcmQua2luZCA9PT0gJ21lc3NhZ2UnIHx8XHJcbiAgICAgICAgcmVjb3JkLmtpbmQgPT09ICdyZXF1ZXN0JyB8fFxyXG4gICAgICAgIHJlY29yZC5raW5kID09PSAncmVzcG9uc2UnLFxyXG4gICAgKVxyXG4gICAgLm1hcChhc3luYyByZWNvcmQgPT4ge1xyXG4gICAgICBjb25zdCBsZXZlbCA9XHJcbiAgICAgICAgcmVjb3JkLmxldmVsICE9IG51bGwgPyByZWNvcmQubGV2ZWwudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpIDogJ0xPRyc7XHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IHJlY29yZC50aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoKTtcclxuICAgICAgbGV0IHRleHQgPSByZWNvcmQudGV4dCB8fCBFUlJPUl9UUkFOU0NSSUJJTkdfTUVTU0FHRTtcclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICByZWNvcmQua2luZCA9PT0gJ3Jlc3BvbnNlJyAmJlxyXG4gICAgICAgIHJlY29yZC5leHByZXNzaW9ucyAhPSBudWxsICYmXHJcbiAgICAgICAgcmVjb3JkLmV4cHJlc3Npb25zLmxlbmd0aCA+IDBcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGV4dCA9ICcnO1xyXG4gICAgICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiByZWNvcmQuZXhwcmVzc2lvbnMpIHtcclxuICAgICAgICAgIC8vIElmIHRoZSByZWNvcmQgaGFzIGEgZGF0YSBvYmplY3QsIGFuZCB0aGUgb2JqZWN0IGhhcyBhbiBJRCxcclxuICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGV4cGFuZCB0aGUgbm9kZXMgb2YgdGhlIG9iamVjdCBhbmQgc2VyaWFsaXplIGl0XHJcbiAgICAgICAgICAvLyBmb3IgdGhlIHBhc3RlLlxyXG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWF3YWl0LWluLWxvb3BcclxuICAgICAgICAgIHRleHQgKz0gYXdhaXQgc2VyaWFsaXplUmVjb3JkT2JqZWN0KG5ldyBTZXQoKSwgZXhwcmVzc2lvbiwgJycsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGBbJHtsZXZlbH1dWyR7cmVjb3JkLnNvdXJjZUlkfV1bJHt0aW1lc3RhbXB9XVxcdCAke3RleHR9YDtcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBsaW5lcyA9IChhd2FpdCBQcm9taXNlLmFsbChsaW5lUHJvbWlzZXMpKS5qb2luKCdcXG4nKTtcclxuXHJcbiAgaWYgKGxpbmVzID09PSAnJykge1xyXG4gICAgLy8gQ2FuJ3QgY3JlYXRlIGFuIGVtcHR5IHBhc3RlIVxyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXHJcbiAgICAgICdUaGVyZSBpcyBub3RoaW5nIGluIHlvdXIgY29uc29sZSB0byBQYXN0ZSEgQ2hlY2sgeW91ciBjb25zb2xlIGZpbHRlcnMgYW5kIHRyeSBhZ2Fpbi4nLFxyXG4gICAgKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdDcmVhdGluZyBQYXN0ZS4uLicpO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgdXJpID0gYXdhaXQgY3JlYXRlUGFzdGVJbXBsKFxyXG4gICAgICBsaW5lcyxcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTnVjbGlkZSBDb25zb2xlIFBhc3RlJyxcclxuICAgICAgfSxcclxuICAgICAgJ2NvbnNvbGUgcGFzdGUnLFxyXG4gICAgKTtcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKGBDcmVhdGVkIFBhc3RlIGF0ICR7dXJpfWApO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBpZiAoZXJyb3Iuc3Rkb3V0ID09IG51bGwpIHtcclxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIHBhc3RlOiAke1N0cmluZyhlcnJvci5tZXNzYWdlIHx8IGVycm9yKX1gLFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBlcnJvck1lc3NhZ2VzID0gZXJyb3Iuc3Rkb3V0XHJcbiAgICAgIC50cmltKClcclxuICAgICAgLnNwbGl0KCdcXG4nKVxyXG4gICAgICAubWFwKEpTT04ucGFyc2UpXHJcbiAgICAgIC5tYXAoZSA9PiBlLm1lc3NhZ2UpO1xyXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHBhc3RlJywge1xyXG4gICAgICBkZXRhaWw6IGVycm9yTWVzc2FnZXMuam9pbignXFxuJyksXHJcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBsZXZlbFRvU2V2ZXJpdHkobGV2ZWw6IExldmVsKTogU2V2ZXJpdHkge1xyXG4gIHN3aXRjaCAobGV2ZWwpIHtcclxuICAgIGNhc2UgJ2Vycm9yJzpcclxuICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICBjYXNlICd3YXJuaW5nJzpcclxuICAgICAgcmV0dXJuICd3YXJuaW5nJztcclxuICAgIGNhc2UgJ2xvZyc6XHJcbiAgICBjYXNlICdpbmZvJzpcclxuICAgIGNhc2UgJ2RlYnVnJzpcclxuICAgIGNhc2UgJ3N1Y2Nlc3MnOlxyXG4gICAgICByZXR1cm4gJ2luZm8nO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gQWxsIHRoZSBjb2xvcnMgYXJlIFwiaW5mb1wiXHJcbiAgICAgIHJldHVybiAnaW5mbyc7XHJcbiAgfVxyXG59XHJcbiJdfQ==