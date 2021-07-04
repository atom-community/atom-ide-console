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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGUuanMiXSwibmFtZXMiOlsiV09SS1NQQUNFX1ZJRVdfVVJJIiwiRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UiLCJBTExfU0VWRVJJVElFUyIsIlNldCIsIkNvbnNvbGUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfYWN0aW9uQ3JlYXRvcnMiLCJfdGl0bGVDaGFuZ2VzIiwiX21vZGVsIiwiX3N0b3JlIiwiX2VsZW1lbnQiLCJfZGVzdHJveWVkIiwiX2dldFNvdXJjZXNNZW1vaXplZCIsImdldFNvdXJjZXMiLCJvcHRzIiwiYSIsImIiLCJfcmVzZXRBbGxGaWx0ZXJzIiwiX3NlbGVjdFNvdXJjZXMiLCJfZ2V0U291cmNlcyIsIm1hcCIsInMiLCJpZCIsInNldFN0YXRlIiwiZmlsdGVyVGV4dCIsIl9jcmVhdGVQYXN0ZSIsImRpc3BsYXlhYmxlUmVjb3JkcyIsIlNlbGVjdG9ycyIsImdldEFsbFJlY29yZHMiLCJnZXRTdGF0ZSIsInRvQXJyYXkiLCJjcmVhdGVQYXN0ZUltcGwiLCJjcmVhdGVQYXN0ZUZ1bmN0aW9uIiwiY3JlYXRlUGFzdGUiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZUlkcyIsInNvdXJjZSIsInVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJmaWx0ZXIiLCJzb3VyY2VJZCIsImluZGV4T2YiLCJfdXBkYXRlRmlsdGVyIiwiY2hhbmdlIiwidGV4dCIsImlzUmVnRXhwIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiX3RvZ2dsZVNldmVyaXR5Iiwic2V2ZXJpdHkiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJzdGF0ZSIsIm5leHRTZWxlY3RlZFNldmVyaXRpZXMiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJzdG9yZSIsImluaXRpYWxGaWx0ZXJUZXh0IiwiaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciIsImluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwiTW9kZWwiLCJCb29sZWFuIiwiUmVwbGF5U3ViamVjdCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwidG9PYnNlcnZhYmxlIiwidGFrZVVudGlsIiwiZ2V0VGl0bGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsInNoYXJlIiwiZ2V0SWNvbk5hbWUiLCJlbmFibGVkUHJvdmlkZXJDb3VudCIsInByb3ZpZGVycyIsInNpemUiLCJsZW5ndGgiLCJzb3VyY2VzIiwic2VsZWN0ZWRTb3VyY2UiLCJmaW5kIiwibmFtZSIsImdldERlZmF1bHRMb2NhdGlvbiIsImdldFVSSSIsIm9uRGlkQ2hhbmdlVGl0bGUiLCJjYWxsYmFjayIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJzdWJzY3JpYmUiLCJwcm92aWRlclN0YXR1c2VzIiwicmVjb3JkcyIsImluY29tcGxldGVSZWNvcmRzIiwiZGVzdHJveSIsIm5leHQiLCJjb3B5IiwiX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMiLCJleGVjdXRlIiwiY29kZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsInNlbGVjdEV4ZWN1dG9yIiwiZXhlY3V0b3JJZCIsImNsZWFyUmVjb3JkcyIsIl9nZXRGaWx0ZXJJbmZvIiwicGF0dGVybiIsImludmFsaWQiLCJmaWx0ZXJlZFJlY29yZHMiLCJmaWx0ZXJSZWNvcmRzIiwiZ2V0RWxlbWVudCIsImFjdGlvbkNyZWF0b3JzIiwiZ2xvYmFsU3RhdGVzIiwicHJvcHMiLCJsZXQiLCJhdWRpdCIsIm5leHRBbmltYXRpb25GcmFtZSIsImxvY2FsU3RhdGUiLCJnbG9iYWxTdGF0ZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJjdXJyZW50RXhlY3V0b3IiLCJleGVjdXRvcnMiLCJnZXQiLCJpbnZhbGlkRmlsdGVySW5wdXQiLCJ3YXRjaEVkaXRvciIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJoaXN0b3J5Iiwic2VsZWN0U291cmNlcyIsImdldFByb3ZpZGVyIiwidXBkYXRlRmlsdGVyIiwicmVzZXRBbGxGaWx0ZXJzIiwiZm9udFNpemUiLCJ0b2dnbGVTZXZlcml0eSIsIlN0YXRlZnVsQ29uc29sZVZpZXciLCJDb25zb2xlVmlldyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplciIsInVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RTb3VyY2VzIiwiaWRzIiwibmV3SWRzIiwiaW5jbHVkZXMiLCJjb25jYXQiLCJtYXBPZlNvdXJjZXMiLCJNYXAiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwiayIsInByb3ZpZGVyIiwic3RhdHVzIiwic3RhcnQiLCJ1bmRlZmluZWQiLCJzdG9wIiwiZm9yRWFjaCIsInJlY29yZCIsImkiLCJzZXQiLCJ2YWx1ZXMiLCJmaWx0ZXJQYXR0ZXJuIiwiZmlsdGVyU291cmNlcyIsImtpbmQiLCJsZXZlbFRvU2V2ZXJpdHkiLCJsZXZlbCIsInNvdXJjZU1hdGNoZXMiLCJ0ZXN0Iiwic2VyaWFsaXplUmVjb3JkT2JqZWN0IiwidmlzaXRlZCIsImV4cHJlc3Npb24iLCJnZXRUZXh0IiwiZXhwIiwiaW5kZW50IiwiZ2V0VmFsdWUiLCJoYXNDaGlsZHJlbiIsImdldElkIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsInNlcmlhbGl6ZWRQcm9wcyIsImNoaWxkUHJvcCIsIlByb21pc2UiLCJhbGwiLCJqb2luIiwibGluZVByb21pc2VzIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRpbWVzdGFtcCIsInRvTG9jYWxlU3RyaW5nIiwiZXhwcmVzc2lvbnMiLCJsaW5lcyIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkV2FybmluZyIsImFkZEluZm8iLCJ1cmkiLCJ0aXRsZSIsImFkZFN1Y2Nlc3MiLCJlcnJvciIsInN0ZG91dCIsImFkZEVycm9yIiwiU3RyaW5nIiwibWVzc2FnZSIsImVycm9yTWVzc2FnZXMiLCJ0cmltIiwic3BsaXQiLCJKU09OIiwicGFyc2UiLCJlIiwiZGV0YWlsIiwiZGlzbWlzc2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUE2QkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUE0REE7QUFDQTtBQUNPLE1BQU1BLGtCQUFrQixHQUFHLHdCQUEzQjs7QUFFUCxNQUFNQywwQkFBMEIsR0FDOUIsb0RBREY7QUFHQSxNQUFNQyxjQUFjLEdBQUcsSUFBSUMsR0FBSixDQUFRLENBQUMsT0FBRCxFQUFVLFNBQVYsRUFBcUIsTUFBckIsQ0FBUixDQUF2QjtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ08sTUFBTUMsT0FBTixDQUFjO0FBU25CQyxFQUFBQSxXQUFXLENBQUNDLE9BQUQsRUFBbUI7QUFBQSxTQVI5QkMsZUFROEI7QUFBQSxTQU45QkMsYUFNOEI7QUFBQSxTQUw5QkMsTUFLOEI7QUFBQSxTQUo5QkMsTUFJOEI7QUFBQSxTQUg5QkMsUUFHOEI7QUFBQSxTQUY5QkMsVUFFOEI7QUFBQSxTQWlHOUJDLG1CQWpHOEIsR0FpR1Isa0NBQ3BCQyxVQURvQixFQUVwQkMsSUFBSSxJQUFJQSxJQUZZLEVBR3BCLENBQUNDLENBQUQsRUFBSUMsQ0FBSixLQUFVLDJCQUFhRCxDQUFiLEVBQWdCQyxDQUFoQixDQUhVLENBakdROztBQUFBLFNBeUk5QkMsZ0JBekk4QixHQXlJWCxNQUFZO0FBQzdCLFdBQUtDLGNBQUwsQ0FBb0IsS0FBS0MsV0FBTCxHQUFtQkMsR0FBbkIsQ0FBdUJDLENBQUMsSUFBSUEsQ0FBQyxDQUFDQyxFQUE5QixDQUFwQjs7QUFDQSxXQUFLZCxNQUFMLENBQVllLFFBQVosQ0FBcUI7QUFBQ0MsUUFBQUEsVUFBVSxFQUFFO0FBQWIsT0FBckI7QUFDRCxLQTVJNkI7O0FBQUEsU0E4STlCQyxZQTlJOEIsR0E4SWYsWUFBMkI7QUFDeEMsWUFBTUMsa0JBQWtCLEdBQUdDLFNBQVMsQ0FBQ0MsYUFBVixDQUN6QixLQUFLbkIsTUFBTCxDQUFZb0IsUUFBWixFQUR5QixFQUV6QkMsT0FGeUIsRUFBM0I7O0FBR0EsWUFBTUMsZUFBZSxHQUFHLEtBQUt0QixNQUFMLENBQVlvQixRQUFaLEdBQXVCRyxtQkFBL0M7O0FBQ0EsVUFBSUQsZUFBZSxJQUFJLElBQXZCLEVBQTZCO0FBQzNCO0FBQ0Q7O0FBQ0QsYUFBT0UsV0FBVyxDQUFDRixlQUFELEVBQWtCTCxrQkFBbEIsQ0FBbEI7QUFDRCxLQXZKNkI7O0FBQUEsU0E4UTlCUixjQTlROEIsR0E4UVpnQixpQkFBRCxJQUE0QztBQUMzRCxZQUFNQyxTQUFTLEdBQUcsS0FBS2hCLFdBQUwsR0FBbUJDLEdBQW5CLENBQXVCZ0IsTUFBTSxJQUFJQSxNQUFNLENBQUNkLEVBQXhDLENBQWxCOztBQUNBLFlBQU1lLG1CQUFtQixHQUFHRixTQUFTLENBQUNHLE1BQVYsQ0FDMUJDLFFBQVEsSUFBSUwsaUJBQWlCLENBQUNNLE9BQWxCLENBQTBCRCxRQUExQixNQUF3QyxDQUFDLENBRDNCLENBQTVCOztBQUdBLFdBQUsvQixNQUFMLENBQVllLFFBQVosQ0FBcUI7QUFBQ2MsUUFBQUE7QUFBRCxPQUFyQjtBQUNELEtBcFI2Qjs7QUFBQSxTQWdTOUJJLGFBaFM4QixHQWdTYkMsTUFBRCxJQUFzQztBQUNwRCxZQUFNO0FBQUNDLFFBQUFBLElBQUQ7QUFBT0MsUUFBQUE7QUFBUCxVQUFtQkYsTUFBekI7O0FBQ0EsV0FBS2xDLE1BQUwsQ0FBWWUsUUFBWixDQUFxQjtBQUNuQkMsUUFBQUEsVUFBVSxFQUFFbUIsSUFETztBQUVuQkUsUUFBQUEsa0JBQWtCLEVBQUVEO0FBRkQsT0FBckI7QUFJRCxLQXRTNkI7O0FBQUEsU0F3UzlCRSxlQXhTOEIsR0F3U1hDLFFBQUQsSUFBOEI7QUFDOUMsWUFBTTtBQUFDQyxRQUFBQTtBQUFELFVBQXVCLEtBQUt4QyxNQUFMLENBQVl5QyxLQUF6QztBQUNBLFlBQU1DLHNCQUFzQixHQUFHLElBQUloRCxHQUFKLENBQVE4QyxrQkFBUixDQUEvQjs7QUFDQSxVQUFJRSxzQkFBc0IsQ0FBQ0MsR0FBdkIsQ0FBMkJKLFFBQTNCLENBQUosRUFBMEM7QUFDeENHLFFBQUFBLHNCQUFzQixDQUFDRSxNQUF2QixDQUE4QkwsUUFBOUI7QUFDRCxPQUZELE1BRU87QUFDTEcsUUFBQUEsc0JBQXNCLENBQUNHLEdBQXZCLENBQTJCTixRQUEzQjtBQUNEOztBQUNELFdBQUt2QyxNQUFMLENBQVllLFFBQVosQ0FBcUI7QUFBQ3lCLFFBQUFBLGtCQUFrQixFQUFFRTtBQUFyQixPQUFyQjtBQUNELEtBalQ2Qjs7QUFDNUIsVUFBTTtBQUNKSSxNQUFBQSxLQURJO0FBRUpDLE1BQUFBLGlCQUZJO0FBR0pDLE1BQUFBLHlCQUhJO0FBSUpDLE1BQUFBLDBCQUpJO0FBS0pDLE1BQUFBO0FBTEksUUFNRnJELE9BTko7QUFPQSxTQUFLRyxNQUFMLEdBQWMsSUFBSW1ELGNBQUosQ0FBVTtBQUN0QmpDLE1BQUFBLGtCQUFrQixFQUFFLEVBREU7QUFFdEJGLE1BQUFBLFVBQVUsRUFBRStCLGlCQUFpQixJQUFJLElBQXJCLEdBQTRCLEVBQTVCLEdBQWlDQSxpQkFGdkI7QUFHdEJWLE1BQUFBLGtCQUFrQixFQUFFZSxPQUFPLENBQUNKLHlCQUFELENBSEw7QUFJdEJuQixNQUFBQSxtQkFBbUIsRUFDakJvQiwwQkFBMEIsSUFBSSxJQUE5QixHQUFxQyxFQUFyQyxHQUEwQ0EsMEJBTHRCO0FBTXRCVCxNQUFBQSxrQkFBa0IsRUFDaEJVLDJCQUEyQixJQUFJLElBQS9CLEdBQ0l6RCxjQURKLEdBRUksK0JBQWNBLGNBQWQsRUFBOEJ5RCwyQkFBOUI7QUFUZ0IsS0FBVixDQUFkO0FBWUEsU0FBS2pELE1BQUwsR0FBYzZDLEtBQWQ7QUFDQSxTQUFLM0MsVUFBTCxHQUFrQixJQUFJa0QsK0JBQUosQ0FBa0IsQ0FBbEIsQ0FBbEI7QUFFQSxTQUFLdEQsYUFBTCxHQUFxQnVELDZCQUFXQyxhQUFYLENBQ25CLEtBQUt2RCxNQUFMLENBQVl3RCxZQUFaLEVBRG1CLEVBRW5CLHVDQUF5QlYsS0FBekIsQ0FGbUIsRUFJbEJXLFNBSmtCLENBSVIsS0FBS3RELFVBSkcsRUFLbEJTLEdBTGtCLENBS2QsTUFBTSxLQUFLOEMsUUFBTCxFQUxRLEVBTWxCQyxvQkFOa0IsR0FPbEJDLEtBUGtCLEVBQXJCO0FBUUQ7O0FBRURDLEVBQUFBLFdBQVcsR0FBVztBQUNwQixXQUFPLGtCQUFQO0FBQ0QsR0E1Q2tCLENBOENuQjtBQUNBOzs7QUFDQUgsRUFBQUEsUUFBUSxHQUFXO0FBQ2pCLFVBQU1JLG9CQUFvQixHQUFHLEtBQUs3RCxNQUFMLENBQVlvQixRQUFaLEdBQXVCMEMsU0FBdkIsQ0FBaUNDLElBQTlEOztBQUNBLFVBQU07QUFBQ25DLE1BQUFBO0FBQUQsUUFBd0IsS0FBSzdCLE1BQUwsQ0FBWXlDLEtBQTFDLENBRmlCLENBSWpCO0FBQ0E7QUFDQTs7QUFDQSxRQUFJcUIsb0JBQW9CLEdBQUdqQyxtQkFBbUIsQ0FBQ29DLE1BQTNDLEdBQW9ELENBQXhELEVBQTJEO0FBQ3pELGFBQU8sU0FBUDtBQUNELEtBVGdCLENBV2pCOzs7QUFDQSxVQUFNQyxPQUFPLEdBQUcsS0FBS3ZELFdBQUwsRUFBaEI7O0FBQ0EsUUFBSXVELE9BQU8sQ0FBQ0QsTUFBUixHQUFpQnBDLG1CQUFtQixDQUFDb0MsTUFBckMsS0FBZ0QsQ0FBcEQsRUFBdUQ7QUFDckQsWUFBTUUsY0FBYyxHQUFHRCxPQUFPLENBQUNFLElBQVIsQ0FDckJ4QyxNQUFNLElBQUlDLG1CQUFtQixDQUFDRyxPQUFwQixDQUE0QkosTUFBTSxDQUFDZCxFQUFuQyxNQUEyQyxDQUFDLENBRGpDLENBQXZCOztBQUdBLFVBQUlxRCxjQUFKLEVBQW9CO0FBQ2xCLGVBQVEsWUFBV0EsY0FBYyxDQUFDRSxJQUFLLEVBQXZDO0FBQ0Q7QUFDRjs7QUFFRCxXQUFPLFNBQVA7QUFDRDs7QUFFREMsRUFBQUEsa0JBQWtCLEdBQVc7QUFDM0IsV0FBTyxRQUFQO0FBQ0Q7O0FBRURDLEVBQUFBLE1BQU0sR0FBVztBQUNmLFdBQU9oRixrQkFBUDtBQUNEOztBQUVEaUYsRUFBQUEsZ0JBQWdCLENBQUNDLFFBQUQsRUFBa0Q7QUFDaEUsV0FBTyxJQUFJQyw0QkFBSixDQUF3QixLQUFLM0UsYUFBTCxDQUFtQjRFLFNBQW5CLENBQTZCRixRQUE3QixDQUF4QixDQUFQO0FBQ0Q7O0FBRUQ5RCxFQUFBQSxXQUFXLEdBQWtCO0FBQzNCLFVBQU07QUFDSm9ELE1BQUFBLFNBREk7QUFFSmEsTUFBQUEsZ0JBRkk7QUFHSkMsTUFBQUEsT0FISTtBQUlKQyxNQUFBQTtBQUpJLFFBS0YsS0FBSzdFLE1BQUwsQ0FBWW9CLFFBQVosRUFMSjs7QUFNQSxXQUFPLEtBQUtqQixtQkFBTCxDQUF5QjtBQUM5QjJELE1BQUFBLFNBRDhCO0FBRTlCYSxNQUFBQSxnQkFGOEI7QUFHOUJDLE1BQUFBLE9BSDhCO0FBSTlCQyxNQUFBQTtBQUo4QixLQUF6QixDQUFQO0FBTUQsR0FsR2tCLENBb0duQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQU9BQyxFQUFBQSxPQUFPLEdBQVM7QUFDZCxTQUFLNUUsVUFBTCxDQUFnQjZFLElBQWhCO0FBQ0Q7O0FBRURDLEVBQUFBLElBQUksR0FBWTtBQUNkLFdBQU8sSUFBSXRGLE9BQUosQ0FBWTtBQUNqQm1ELE1BQUFBLEtBQUssRUFBRSxLQUFLN0MsTUFESztBQUVqQjhDLE1BQUFBLGlCQUFpQixFQUFFLEtBQUsvQyxNQUFMLENBQVl5QyxLQUFaLENBQWtCekIsVUFGcEI7QUFHakJnQyxNQUFBQSx5QkFBeUIsRUFBRSxLQUFLaEQsTUFBTCxDQUFZeUMsS0FBWixDQUFrQkosa0JBSDVCO0FBSWpCWSxNQUFBQSwwQkFBMEIsRUFBRSxLQUFLakQsTUFBTCxDQUFZeUMsS0FBWixDQUFrQlosbUJBSjdCO0FBS2pCcUIsTUFBQUEsMkJBQTJCLEVBQUUsK0JBQzNCekQsY0FEMkIsRUFFM0IsS0FBS08sTUFBTCxDQUFZeUMsS0FBWixDQUFrQkQsa0JBRlM7QUFMWixLQUFaLENBQVA7QUFVRDs7QUFFRDBDLEVBQUFBLHVCQUF1QixHQUF3QjtBQUM3QyxRQUFJLEtBQUtwRixlQUFMLElBQXdCLElBQTVCLEVBQWtDO0FBQ2hDLFdBQUtBLGVBQUwsR0FBdUI7QUFDckJxRixRQUFBQSxPQUFPLEVBQUVDLElBQUksSUFBSTtBQUNmLGVBQUtuRixNQUFMLENBQVlvRixRQUFaLENBQXFCQyxPQUFPLENBQUNILE9BQVIsQ0FBZ0JDLElBQWhCLENBQXJCO0FBQ0QsU0FIb0I7QUFJckJHLFFBQUFBLGNBQWMsRUFBRUMsVUFBVSxJQUFJO0FBQzVCLGVBQUt2RixNQUFMLENBQVlvRixRQUFaLENBQXFCQyxPQUFPLENBQUNDLGNBQVIsQ0FBdUJDLFVBQXZCLENBQXJCO0FBQ0QsU0FOb0I7QUFPckJDLFFBQUFBLFlBQVksRUFBRSxNQUFNO0FBQ2xCLGVBQUt4RixNQUFMLENBQVlvRixRQUFaLENBQXFCQyxPQUFPLENBQUNHLFlBQVIsRUFBckI7QUFDRDtBQVRvQixPQUF2QjtBQVdEOztBQUNELFdBQU8sS0FBSzNGLGVBQVo7QUFDRDs7QUFrQkQ0RixFQUFBQSxjQUFjLEdBS1o7QUFDQSxVQUFNO0FBQUNDLE1BQUFBLE9BQUQ7QUFBVUMsTUFBQUE7QUFBVixRQUFxQixvQ0FDekIsS0FBSzVGLE1BQUwsQ0FBWXlDLEtBQVosQ0FBa0J6QixVQURPLEVBRXpCLEtBQUtoQixNQUFMLENBQVl5QyxLQUFaLENBQWtCSixrQkFGTyxDQUEzQjs7QUFJQSxVQUFNNkIsT0FBTyxHQUFHLEtBQUt2RCxXQUFMLEVBQWhCOztBQUNBLFVBQU1lLGlCQUFpQixHQUFHd0MsT0FBTyxDQUM5QnRELEdBRHVCLENBQ25CZ0IsTUFBTSxJQUFJQSxNQUFNLENBQUNkLEVBREUsRUFFdkJnQixNQUZ1QixDQUd0QkMsUUFBUSxJQUNOLEtBQUsvQixNQUFMLENBQVl5QyxLQUFaLENBQWtCWixtQkFBbEIsQ0FBc0NHLE9BQXRDLENBQThDRCxRQUE5QyxNQUE0RCxDQUFDLENBSnpDLENBQTFCO0FBT0EsVUFBTTtBQUFDUyxNQUFBQTtBQUFELFFBQXVCLEtBQUt4QyxNQUFMLENBQVl5QyxLQUF6QztBQUNBLFVBQU1vRCxlQUFlLEdBQUdDLGFBQWEsQ0FDbkMzRSxTQUFTLENBQUNDLGFBQVYsQ0FBd0IsS0FBS25CLE1BQUwsQ0FBWW9CLFFBQVosRUFBeEIsRUFBZ0RDLE9BQWhELEVBRG1DLEVBRW5DSSxpQkFGbUMsRUFHbkNjLGtCQUhtQyxFQUluQ21ELE9BSm1DLEVBS25DekIsT0FBTyxDQUFDRCxNQUFSLEtBQW1CdkMsaUJBQWlCLENBQUN1QyxNQUxGLENBQXJDO0FBUUEsV0FBTztBQUNMMkIsTUFBQUEsT0FESztBQUVMbEUsTUFBQUEsaUJBRks7QUFHTGMsTUFBQUEsa0JBSEs7QUFJTHFELE1BQUFBO0FBSkssS0FBUDtBQU1EOztBQUVERSxFQUFBQSxVQUFVLEdBQWdCO0FBQ3hCLFFBQUksS0FBSzdGLFFBQUwsSUFBaUIsSUFBckIsRUFBMkI7QUFDekIsYUFBTyxLQUFLQSxRQUFaO0FBQ0Q7O0FBRUQsVUFBTThGLGNBQWMsR0FBRyxLQUFLZCx1QkFBTCxFQUF2Qjs7QUFDQSxVQUFNZSxZQUFrQyxHQUFHLHVDQUN6QyxLQUFLaEcsTUFEb0MsQ0FBM0M7O0FBSUEsVUFBTWlHLEtBQUssR0FBRzVDLDZCQUFXQyxhQUFYLENBQ1osS0FBS3ZELE1BQUwsQ0FBWXdELFlBQVosRUFEWSxFQUVaeUMsWUFGWSxFQUlaO0FBSlksS0FLWEUsR0FMVyxDQUtQLHdCQUFPLHdDQUEwQixJQUExQixDQUFQLENBTE8sRUFNWEMsS0FOVyxDQU1MLE1BQU1DLDhCQU5ELEVBT1h6RixHQVBXLENBT1AsQ0FBQyxDQUFDMEYsVUFBRCxFQUFhQyxXQUFiLENBQUQsS0FBK0I7QUFDbEMsWUFBTTtBQUNKWCxRQUFBQSxPQURJO0FBRUpsRSxRQUFBQSxpQkFGSTtBQUdKYyxRQUFBQSxrQkFISTtBQUlKcUQsUUFBQUE7QUFKSSxVQUtGLEtBQUtILGNBQUwsRUFMSjs7QUFPQSxZQUFNYyxpQkFBaUIsR0FBR3JGLFNBQVMsQ0FBQ3NGLG9CQUFWLENBQStCRixXQUEvQixDQUExQjtBQUNBLFlBQU1HLGVBQWUsR0FDbkJGLGlCQUFpQixJQUFJLElBQXJCLEdBQ0lELFdBQVcsQ0FBQ0ksU0FBWixDQUFzQkMsR0FBdEIsQ0FBMEJKLGlCQUExQixDQURKLEdBRUksSUFITjtBQUtBLGFBQU87QUFDTEssUUFBQUEsa0JBQWtCLEVBQUVqQixPQURmO0FBRUxULFFBQUFBLE9BQU8sRUFBRWEsY0FBYyxDQUFDYixPQUZuQjtBQUdMSSxRQUFBQSxjQUFjLEVBQUVTLGNBQWMsQ0FBQ1QsY0FIMUI7QUFJTEUsUUFBQUEsWUFBWSxFQUFFTyxjQUFjLENBQUNQLFlBSnhCO0FBS0xoRSxRQUFBQSxXQUFXLEVBQ1Q4RSxXQUFXLENBQUMvRSxtQkFBWixJQUFtQyxJQUFuQyxHQUEwQyxJQUExQyxHQUFpRCxLQUFLUCxZQU5uRDtBQU9MNkYsUUFBQUEsV0FBVyxFQUFFUCxXQUFXLENBQUNPLFdBUHBCO0FBUUxKLFFBQUFBLGVBUks7QUFTTDdFLFFBQUFBLG1CQUFtQixFQUFFeUUsVUFBVSxDQUFDekUsbUJBVDNCO0FBVUxiLFFBQUFBLFVBQVUsRUFBRXNGLFVBQVUsQ0FBQ3RGLFVBVmxCO0FBV0xxQixRQUFBQSxrQkFBa0IsRUFBRWlFLFVBQVUsQ0FBQ2pFLGtCQVgxQjtBQVlMd0MsUUFBQUEsT0FBTyxFQUFFZ0IsZUFaSjtBQWFMa0IsUUFBQUEsbUJBQW1CLEVBQ2pCNUYsU0FBUyxDQUFDQyxhQUFWLENBQXdCbUYsV0FBeEIsRUFBcUN2QyxJQUFyQyxHQUE0QzZCLGVBQWUsQ0FBQzVCLE1BZHpEO0FBZUwrQyxRQUFBQSxPQUFPLEVBQUVULFdBQVcsQ0FBQ1MsT0FmaEI7QUFnQkw5QyxRQUFBQSxPQUFPLEVBQUUsS0FBS3ZELFdBQUwsRUFoQko7QUFpQkxlLFFBQUFBLGlCQWpCSztBQWtCTHVGLFFBQUFBLGFBQWEsRUFBRSxLQUFLdkcsY0FsQmY7QUFtQkxpRyxRQUFBQSxTQUFTLEVBQUVKLFdBQVcsQ0FBQ0ksU0FuQmxCO0FBb0JMTyxRQUFBQSxXQUFXLEVBQUVwRyxFQUFFLElBQUl5RixXQUFXLENBQUN4QyxTQUFaLENBQXNCNkMsR0FBdEIsQ0FBMEI5RixFQUExQixDQXBCZDtBQXFCTHFHLFFBQUFBLFlBQVksRUFBRSxLQUFLbEYsYUFyQmQ7QUFzQkxtRixRQUFBQSxlQUFlLEVBQUUsS0FBSzNHLGdCQXRCakI7QUF1Qkw0RyxRQUFBQSxRQUFRLEVBQUVkLFdBQVcsQ0FBQ2MsUUF2QmpCO0FBd0JMN0UsUUFBQUEsa0JBeEJLO0FBeUJMOEUsUUFBQUEsY0FBYyxFQUFFLEtBQUtoRjtBQXpCaEIsT0FBUDtBQTJCRCxLQWhEVyxDQUFkOztBQWtEQSxVQUFNaUYsbUJBQW1CLEdBQUcsa0RBQXNCckIsS0FBdEIsRUFBNkJzQixvQkFBN0IsQ0FBNUI7QUFDQSxXQUFRLEtBQUt0SCxRQUFMLEdBQWdCLG9EQUFnQixvQkFBQyxtQkFBRCxPQUFoQixDQUF4QjtBQUNEOztBQUVEdUgsRUFBQUEsU0FBUyxHQUEwQjtBQUNqQyxVQUFNO0FBQ0p6RyxNQUFBQSxVQURJO0FBRUpxQixNQUFBQSxrQkFGSTtBQUdKUixNQUFBQSxtQkFISTtBQUlKVyxNQUFBQTtBQUpJLFFBS0YsS0FBS3hDLE1BQUwsQ0FBWXlDLEtBTGhCO0FBTUEsV0FBTztBQUNMaUYsTUFBQUEsWUFBWSxFQUFFLGlCQURUO0FBRUwxRyxNQUFBQSxVQUZLO0FBR0xxQixNQUFBQSxrQkFISztBQUlMUixNQUFBQSxtQkFKSztBQUtMOEYsTUFBQUEsb0JBQW9CLEVBQUUsQ0FDcEIsR0FBRywrQkFBY2xJLGNBQWQsRUFBOEIrQyxrQkFBOUIsQ0FEaUI7QUFMakIsS0FBUDtBQVNEOztBQVVEO0FBQ0FvRixFQUFBQSxlQUFlLENBQUNDLEdBQUQsRUFBMkI7QUFDeEMsVUFBTUMsTUFBTSxHQUFHRCxHQUFHLENBQUMvRixNQUFKLENBQ2JoQixFQUFFLElBQUksQ0FBQyxLQUFLZCxNQUFMLENBQVl5QyxLQUFaLENBQWtCWixtQkFBbEIsQ0FBc0NrRyxRQUF0QyxDQUErQ2pILEVBQS9DLENBRE0sQ0FBZjs7QUFHQSxTQUFLZCxNQUFMLENBQVllLFFBQVosQ0FBcUI7QUFDbkJjLE1BQUFBLG1CQUFtQixFQUFFLEtBQUs3QixNQUFMLENBQVl5QyxLQUFaLENBQWtCWixtQkFBbEIsQ0FBc0NtRyxNQUF0QyxDQUE2Q0YsTUFBN0M7QUFERixLQUFyQjtBQUdEOztBQXZTa0I7Ozs7QUE2VHJCLFNBQVN6SCxVQUFULENBQW9CUixPQUFwQixFQUlrQjtBQUNoQixRQUFNO0FBQUNrRSxJQUFBQSxTQUFEO0FBQVlhLElBQUFBLGdCQUFaO0FBQThCQyxJQUFBQTtBQUE5QixNQUF5Q2hGLE9BQS9DLENBRGdCLENBR2hCOztBQUNBLFFBQU1vSSxZQUFZLEdBQUcsSUFBSUMsR0FBSixDQUNuQkMsS0FBSyxDQUFDQyxJQUFOLENBQVdyRSxTQUFTLENBQUNzRSxPQUFWLEVBQVgsRUFBZ0N6SCxHQUFoQyxDQUFvQyxDQUFDLENBQUMwSCxDQUFELEVBQUlDLFFBQUosQ0FBRCxLQUFtQjtBQUNyRCxVQUFNM0csTUFBTSxHQUFHO0FBQ2JkLE1BQUFBLEVBQUUsRUFBRXlILFFBQVEsQ0FBQ3pILEVBREE7QUFFYnVELE1BQUFBLElBQUksRUFBRWtFLFFBQVEsQ0FBQ2xFLElBRkY7QUFHYm1FLE1BQUFBLE1BQU0sRUFBRTVELGdCQUFnQixDQUFDZ0MsR0FBakIsQ0FBcUIyQixRQUFRLENBQUN6SCxFQUE5QixLQUFxQyxTQUhoQztBQUliMkgsTUFBQUEsS0FBSyxFQUNILE9BQU9GLFFBQVEsQ0FBQ0UsS0FBaEIsS0FBMEIsVUFBMUIsR0FBdUNGLFFBQVEsQ0FBQ0UsS0FBaEQsR0FBd0RDLFNBTDdDO0FBTWJDLE1BQUFBLElBQUksRUFBRSxPQUFPSixRQUFRLENBQUNJLElBQWhCLEtBQXlCLFVBQXpCLEdBQXNDSixRQUFRLENBQUNJLElBQS9DLEdBQXNERDtBQU4vQyxLQUFmO0FBUUEsV0FBTyxDQUFDSixDQUFELEVBQUkxRyxNQUFKLENBQVA7QUFDRCxHQVZELENBRG1CLENBQXJCLENBSmdCLENBa0JoQjtBQUNBOztBQUNBaUQsRUFBQUEsT0FBTyxDQUFDK0QsT0FBUixDQUFnQixDQUFDQyxNQUFELEVBQVNDLENBQVQsS0FBZTtBQUM3QixRQUFJLENBQUNiLFlBQVksQ0FBQ3RGLEdBQWIsQ0FBaUJrRyxNQUFNLENBQUM5RyxRQUF4QixDQUFMLEVBQXdDO0FBQ3RDa0csTUFBQUEsWUFBWSxDQUFDYyxHQUFiLENBQWlCRixNQUFNLENBQUM5RyxRQUF4QixFQUFrQztBQUNoQ2pCLFFBQUFBLEVBQUUsRUFBRStILE1BQU0sQ0FBQzlHLFFBRHFCO0FBRWhDc0MsUUFBQUEsSUFBSSxFQUFFd0UsTUFBTSxDQUFDOUcsUUFGbUI7QUFHaEN5RyxRQUFBQSxNQUFNLEVBQUUsU0FId0I7QUFJaENDLFFBQUFBLEtBQUssRUFBRUMsU0FKeUI7QUFLaENDLFFBQUFBLElBQUksRUFBRUQ7QUFMMEIsT0FBbEM7QUFPRDtBQUNGLEdBVkQ7QUFZQSxTQUFPUCxLQUFLLENBQUNDLElBQU4sQ0FBV0gsWUFBWSxDQUFDZSxNQUFiLEVBQVgsQ0FBUDtBQUNEOztBQUVELFNBQVNsRCxhQUFULENBQ0VqQixPQURGLEVBRUVuRCxpQkFGRixFQUdFYyxrQkFIRixFQUlFeUcsYUFKRixFQUtFQyxhQUxGLEVBTWlCO0FBQ2YsTUFDRSxDQUFDQSxhQUFELElBQ0FELGFBQWEsSUFBSSxJQURqQixJQUVBLDhCQUFheEosY0FBYixFQUE2QitDLGtCQUE3QixDQUhGLEVBSUU7QUFDQSxXQUFPcUMsT0FBUDtBQUNEOztBQUVELFNBQU9BLE9BQU8sQ0FBQy9DLE1BQVIsQ0FBZStHLE1BQU0sSUFBSTtBQUM5QjtBQUNBLFFBQUlBLE1BQU0sQ0FBQ00sSUFBUCxLQUFnQixTQUFwQixFQUErQjtBQUM3QixhQUFPLElBQVA7QUFDRDs7QUFFRCxRQUFJLENBQUMzRyxrQkFBa0IsQ0FBQ0csR0FBbkIsQ0FBdUJ5RyxlQUFlLENBQUNQLE1BQU0sQ0FBQ1EsS0FBUixDQUF0QyxDQUFMLEVBQTREO0FBQzFELGFBQU8sS0FBUDtBQUNEOztBQUVELFVBQU1DLGFBQWEsR0FBRzVILGlCQUFpQixDQUFDTSxPQUFsQixDQUEwQjZHLE1BQU0sQ0FBQzlHLFFBQWpDLE1BQStDLENBQUMsQ0FBdEU7QUFDQSxXQUNFdUgsYUFBYSxLQUNaTCxhQUFhLElBQUksSUFBakIsSUFBeUJBLGFBQWEsQ0FBQ00sSUFBZCxDQUFtQlYsTUFBTSxDQUFDMUcsSUFBMUIsQ0FEYixDQURmO0FBSUQsR0FmTSxDQUFQO0FBZ0JEOztBQUVELGVBQWVxSCxxQkFBZixDQUNFQyxPQURGLEVBRUVDLFVBRkYsRUFHRXZILElBSEYsRUFJRWtILEtBSkYsRUFLbUI7QUFDakIsUUFBTU0sT0FBTyxHQUFHQyxHQUFHLElBQUk7QUFDckIsUUFBSUMsTUFBTSxHQUFHLEVBQWI7O0FBQ0EsU0FBSyxJQUFJZixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHTyxLQUFwQixFQUEyQlAsQ0FBQyxFQUE1QixFQUFnQztBQUM5QmUsTUFBQUEsTUFBTSxJQUFJLElBQVY7QUFDRDs7QUFDRCxXQUFPQSxNQUFNLEdBQUdELEdBQUcsQ0FBQ0UsUUFBSixFQUFoQjtBQUNELEdBTkQ7O0FBUUEsTUFBSSxDQUFDSixVQUFVLENBQUNLLFdBQVgsRUFBTCxFQUErQjtBQUM3QjtBQUNBLFdBQU81SCxJQUFJLEdBQUd3SCxPQUFPLENBQUNELFVBQUQsQ0FBckI7QUFDRDs7QUFFRCxRQUFNNUksRUFBRSxHQUFHNEksVUFBVSxDQUFDTSxLQUFYLEVBQVg7O0FBQ0EsTUFBSVAsT0FBTyxDQUFDOUcsR0FBUixDQUFZN0IsRUFBWixDQUFKLEVBQXFCO0FBQ25CO0FBQ0EsV0FBT3FCLElBQVA7QUFDRDs7QUFFRHNILEVBQUFBLE9BQU8sQ0FBQzVHLEdBQVIsQ0FBWS9CLEVBQVo7QUFFQSxRQUFNbUosUUFBUSxHQUFHLE1BQU1QLFVBQVUsQ0FBQ1EsV0FBWCxFQUF2QjtBQUNBLFFBQU1DLGVBQWUsR0FBR0YsUUFBUSxDQUFDckosR0FBVCxDQUFhd0osU0FBUyxJQUFJO0FBQ2hELFdBQU9aLHFCQUFxQixDQUFDQyxPQUFELEVBQVVXLFNBQVYsRUFBcUIsRUFBckIsRUFBeUJmLEtBQUssR0FBRyxDQUFqQyxDQUE1QjtBQUNELEdBRnVCLENBQXhCO0FBR0EsU0FDRU0sT0FBTyxDQUFDRCxVQUFELENBQVAsR0FBc0IsSUFBdEIsR0FBNkIsQ0FBQyxNQUFNVyxPQUFPLENBQUNDLEdBQVIsQ0FBWUgsZUFBWixDQUFQLEVBQXFDSSxJQUFyQyxDQUEwQyxJQUExQyxDQUQvQjtBQUdEOztBQUVELGVBQWU5SSxXQUFmLENBQ0VGLGVBREYsRUFFRXNELE9BRkYsRUFHaUI7QUFDZixRQUFNMkYsWUFBWSxHQUFHM0YsT0FBTyxDQUN6Qi9DLE1BRGtCLENBRWpCK0csTUFBTSxJQUNKQSxNQUFNLENBQUNNLElBQVAsS0FBZ0IsU0FBaEIsSUFDQU4sTUFBTSxDQUFDTSxJQUFQLEtBQWdCLFNBRGhCLElBRUFOLE1BQU0sQ0FBQ00sSUFBUCxLQUFnQixVQUxELEVBT2xCdkksR0FQa0IsQ0FPZCxNQUFNaUksTUFBTixJQUFnQjtBQUNuQixVQUFNUSxLQUFLLEdBQ1RSLE1BQU0sQ0FBQ1EsS0FBUCxJQUFnQixJQUFoQixHQUF1QlIsTUFBTSxDQUFDUSxLQUFQLENBQWFvQixRQUFiLEdBQXdCQyxXQUF4QixFQUF2QixHQUErRCxLQURqRTtBQUVBLFVBQU1DLFNBQVMsR0FBRzlCLE1BQU0sQ0FBQzhCLFNBQVAsQ0FBaUJDLGNBQWpCLEVBQWxCO0FBQ0EsUUFBSXpJLElBQUksR0FBRzBHLE1BQU0sQ0FBQzFHLElBQVAsSUFBZTNDLDBCQUExQjs7QUFFQSxRQUNFcUosTUFBTSxDQUFDTSxJQUFQLEtBQWdCLFVBQWhCLElBQ0FOLE1BQU0sQ0FBQ2dDLFdBQVAsSUFBc0IsSUFEdEIsSUFFQWhDLE1BQU0sQ0FBQ2dDLFdBQVAsQ0FBbUI1RyxNQUFuQixHQUE0QixDQUg5QixFQUlFO0FBQ0E5QixNQUFBQSxJQUFJLEdBQUcsRUFBUDs7QUFDQSxXQUFLLE1BQU11SCxVQUFYLElBQXlCYixNQUFNLENBQUNnQyxXQUFoQyxFQUE2QztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBMUksUUFBQUEsSUFBSSxJQUFJLE1BQU1xSCxxQkFBcUIsQ0FBQyxJQUFJOUosR0FBSixFQUFELEVBQVlnSyxVQUFaLEVBQXdCLEVBQXhCLEVBQTRCLENBQTVCLENBQW5DO0FBQ0Q7QUFDRjs7QUFFRCxXQUFRLElBQUdMLEtBQU0sS0FBSVIsTUFBTSxDQUFDOUcsUUFBUyxLQUFJNEksU0FBVSxPQUFNeEksSUFBSyxFQUE5RDtBQUNELEdBN0JrQixDQUFyQjtBQStCQSxRQUFNMkksS0FBSyxHQUFHLENBQUMsTUFBTVQsT0FBTyxDQUFDQyxHQUFSLENBQVlFLFlBQVosQ0FBUCxFQUFrQ0QsSUFBbEMsQ0FBdUMsSUFBdkMsQ0FBZDs7QUFFQSxNQUFJTyxLQUFLLEtBQUssRUFBZCxFQUFrQjtBQUNoQjtBQUNBQyxJQUFBQSxJQUFJLENBQUNDLGFBQUwsQ0FBbUJDLFVBQW5CLENBQ0Usc0ZBREY7QUFHQTtBQUNEOztBQUVERixFQUFBQSxJQUFJLENBQUNDLGFBQUwsQ0FBbUJFLE9BQW5CLENBQTJCLG1CQUEzQjs7QUFFQSxNQUFJO0FBQ0YsVUFBTUMsR0FBRyxHQUFHLE1BQU01SixlQUFlLENBQy9CdUosS0FEK0IsRUFFL0I7QUFDRU0sTUFBQUEsS0FBSyxFQUFFO0FBRFQsS0FGK0IsRUFLL0IsZUFMK0IsQ0FBakM7QUFPQUwsSUFBQUEsSUFBSSxDQUFDQyxhQUFMLENBQW1CSyxVQUFuQixDQUErQixvQkFBbUJGLEdBQUksRUFBdEQ7QUFDRCxHQVRELENBU0UsT0FBT0csS0FBUCxFQUFjO0FBQ2QsUUFBSUEsS0FBSyxDQUFDQyxNQUFOLElBQWdCLElBQXBCLEVBQTBCO0FBQ3hCUixNQUFBQSxJQUFJLENBQUNDLGFBQUwsQ0FBbUJRLFFBQW5CLENBQ0csMkJBQTBCQyxNQUFNLENBQUNILEtBQUssQ0FBQ0ksT0FBTixJQUFpQkosS0FBbEIsQ0FBeUIsRUFENUQ7QUFHQTtBQUNEOztBQUNELFVBQU1LLGFBQWEsR0FBR0wsS0FBSyxDQUFDQyxNQUFOLENBQ25CSyxJQURtQixHQUVuQkMsS0FGbUIsQ0FFYixJQUZhLEVBR25CakwsR0FIbUIsQ0FHZmtMLElBQUksQ0FBQ0MsS0FIVSxFQUluQm5MLEdBSm1CLENBSWZvTCxDQUFDLElBQUlBLENBQUMsQ0FBQ04sT0FKUSxDQUF0QjtBQUtBWCxJQUFBQSxJQUFJLENBQUNDLGFBQUwsQ0FBbUJRLFFBQW5CLENBQTRCLHdCQUE1QixFQUFzRDtBQUNwRFMsTUFBQUEsTUFBTSxFQUFFTixhQUFhLENBQUNwQixJQUFkLENBQW1CLElBQW5CLENBRDRDO0FBRXBEMkIsTUFBQUEsV0FBVyxFQUFFO0FBRnVDLEtBQXREO0FBSUQ7QUFDRjs7QUFFRCxTQUFTOUMsZUFBVCxDQUF5QkMsS0FBekIsRUFBaUQ7QUFDL0MsVUFBUUEsS0FBUjtBQUNFLFNBQUssT0FBTDtBQUNFLGFBQU8sT0FBUDs7QUFDRixTQUFLLFNBQUw7QUFDRSxhQUFPLFNBQVA7O0FBQ0YsU0FBSyxLQUFMO0FBQ0EsU0FBSyxNQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxTQUFMO0FBQ0UsYUFBTyxNQUFQOztBQUNGO0FBQ0U7QUFDQSxhQUFPLE1BQVA7QUFaSjtBQWNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbmltcG9ydCB0eXBlIHtJRXhwcmVzc2lvbn0gZnJvbSAnLi4vLi4vLi4vLi4nO1xuaW1wb3J0IHR5cGUge1xuICBDb25zb2xlUGVyc2lzdGVkU3RhdGUsXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXG4gIFJlY29yZCxcbiAgU291cmNlLFxuICBTdG9yZSxcbiAgU291cmNlSW5mbyxcbiAgU2V2ZXJpdHksXG4gIExldmVsLFxuICBBcHBTdGF0ZSxcbn0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUge0NyZWF0ZVBhc3RlRnVuY3Rpb259IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHtSZWdFeHBGaWx0ZXJDaGFuZ2V9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XG5cbmltcG9ydCBvYnNlcnZlUGFuZUl0ZW1WaXNpYmlsaXR5IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLWF0b20vb2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSc7XG5pbXBvcnQge3NldERpZmZlcmVuY2UsIGFyZVNldHNFcXVhbH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvY29sbGVjdGlvbic7XG5pbXBvcnQgTW9kZWwgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvTW9kZWwnO1xuaW1wb3J0IHNoYWxsb3dFcXVhbCBmcm9tICdzaGFsbG93ZXF1YWwnO1xuaW1wb3J0IHtiaW5kT2JzZXJ2YWJsZUFzUHJvcHN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2JpbmRPYnNlcnZhYmxlQXNQcm9wcyc7XG5pbXBvcnQge3JlbmRlclJlYWN0Um9vdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvcmVuZGVyUmVhY3RSb290JztcbmltcG9ydCBtZW1vaXplVW50aWxDaGFuZ2VkIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL21lbW9pemVVbnRpbENoYW5nZWQnO1xuaW1wb3J0IHt0b2dnbGV9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGUnO1xuaW1wb3J0IFVuaXZlcnNhbERpc3Bvc2FibGUgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZSc7XG5pbXBvcnQge25leHRBbmltYXRpb25GcmFtZX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgb2JzZXJ2YWJsZUZyb21SZWR1eFN0b3JlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGVGcm9tUmVkdXhTdG9yZSc7XG5pbXBvcnQge2dldEZpbHRlclBhdHRlcm59IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XG5pbXBvcnQgKiBhcyBBY3Rpb25zIGZyb20gJy4uL3JlZHV4L0FjdGlvbnMnO1xuaW1wb3J0ICogYXMgU2VsZWN0b3JzIGZyb20gJy4uL3JlZHV4L1NlbGVjdG9ycyc7XG5pbXBvcnQgQ29uc29sZVZpZXcgZnJvbSAnLi9Db25zb2xlVmlldyc7XG5pbXBvcnQge0xpc3R9IGZyb20gJ2ltbXV0YWJsZSc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5cbnR5cGUgT3B0aW9ucyA9IHt8XG4gIHN0b3JlOiBTdG9yZSxcbiAgaW5pdGlhbEZpbHRlclRleHQ/OiBzdHJpbmcsXG4gIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI/OiBib29sZWFuLFxuICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkcz86IEFycmF5PHN0cmluZz4sXG4gIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllcz86IFNldDxTZXZlcml0eT4sXG58fTtcblxuLy9cbi8vIFN0YXRlIHVuaXF1ZSB0byB0aGlzIHBhcnRpY3VsYXIgQ29uc29sZSBpbnN0YW5jZVxuLy9cbnR5cGUgU3RhdGUgPSB7XG4gIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgZW5hYmxlUmVnRXhwRmlsdGVyOiBib29sZWFuLFxuICB1bnNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXG59O1xuXG50eXBlIEJvdW5kQWN0aW9uQ3JlYXRvcnMgPSB7XG4gIGV4ZWN1dGU6IChjb2RlOiBzdHJpbmcpID0+IHZvaWQsXG4gIHNlbGVjdEV4ZWN1dG9yOiAoZXhlY3V0b3JJZDogc3RyaW5nKSA9PiB2b2lkLFxuICBjbGVhclJlY29yZHM6ICgpID0+IHZvaWQsXG59O1xuXG4vLyBPdGhlciBOdWNsaWRlIHBhY2thZ2VzICh3aGljaCBjYW5ub3QgaW1wb3J0IHRoaXMpIGRlcGVuZCBvbiB0aGlzIFVSSS4gSWYgdGhpc1xuLy8gbmVlZHMgdG8gYmUgY2hhbmdlZCwgZ3JlcCBmb3IgQ09OU09MRV9WSUVXX1VSSSBhbmQgZW5zdXJlIHRoYXQgdGhlIFVSSXMgbWF0Y2guXG5leHBvcnQgY29uc3QgV09SS1NQQUNFX1ZJRVdfVVJJID0gJ2F0b206Ly9udWNsaWRlL2NvbnNvbGUnO1xuXG5jb25zdCBFUlJPUl9UUkFOU0NSSUJJTkdfTUVTU0FHRSA9XG4gIFwiLy8gTnVjbGlkZSBjb3VsZG4ndCBmaW5kIHRoZSByaWdodCB0ZXh0IHRvIGRpc3BsYXlcIjtcblxuY29uc3QgQUxMX1NFVkVSSVRJRVMgPSBuZXcgU2V0KFsnZXJyb3InLCAnd2FybmluZycsICdpbmZvJ10pO1xuXG4vKipcbiAqIEFuIEF0b20gXCJ2aWV3IG1vZGVsXCIgZm9yIHRoZSBjb25zb2xlLiBUaGlzIG9iamVjdCBpcyByZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzdGF0ZWZ1bCB2aWV3XG4gKiAodmlhIGBnZXRFbGVtZW50KClgKS4gVGhhdCB2aWV3IGlzIGJvdW5kIHRvIGJvdGggZ2xvYmFsIHN0YXRlIChmcm9tIHRoZSBzdG9yZSkgYW5kIHZpZXctc3BlY2lmaWNcbiAqIHN0YXRlIChmcm9tIHRoaXMgaW5zdGFuY2UncyBgX21vZGVsYCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zb2xlIHtcbiAgX2FjdGlvbkNyZWF0b3JzOiBCb3VuZEFjdGlvbkNyZWF0b3JzO1xuXG4gIF90aXRsZUNoYW5nZXM6IE9ic2VydmFibGU8c3RyaW5nPjtcbiAgX21vZGVsOiBNb2RlbDxTdGF0ZT47XG4gIF9zdG9yZTogU3RvcmU7XG4gIF9lbGVtZW50OiA/SFRNTEVsZW1lbnQ7XG4gIF9kZXN0cm95ZWQ6IFJlcGxheVN1YmplY3Q8dm9pZD47XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogT3B0aW9ucykge1xuICAgIGNvbnN0IHtcbiAgICAgIHN0b3JlLFxuICAgICAgaW5pdGlhbEZpbHRlclRleHQsXG4gICAgICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgdGhpcy5fbW9kZWwgPSBuZXcgTW9kZWwoe1xuICAgICAgZGlzcGxheWFibGVSZWNvcmRzOiBbXSxcbiAgICAgIGZpbHRlclRleHQ6IGluaXRpYWxGaWx0ZXJUZXh0ID09IG51bGwgPyAnJyA6IGluaXRpYWxGaWx0ZXJUZXh0LFxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyOiBCb29sZWFuKGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXIpLFxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkczpcbiAgICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMgPT0gbnVsbCA/IFtdIDogaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXM6XG4gICAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllcyA9PSBudWxsXG4gICAgICAgICAgPyBBTExfU0VWRVJJVElFU1xuICAgICAgICAgIDogc2V0RGlmZmVyZW5jZShBTExfU0VWRVJJVElFUywgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzKSxcbiAgICB9KTtcblxuICAgIHRoaXMuX3N0b3JlID0gc3RvcmU7XG4gICAgdGhpcy5fZGVzdHJveWVkID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG5cbiAgICB0aGlzLl90aXRsZUNoYW5nZXMgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXG4gICAgICB0aGlzLl9tb2RlbC50b09ic2VydmFibGUoKSxcbiAgICAgIG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZShzdG9yZSksXG4gICAgKVxuICAgICAgLnRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpXG4gICAgICAubWFwKCgpID0+IHRoaXMuZ2V0VGl0bGUoKSlcbiAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAuc2hhcmUoKTtcbiAgfVxuXG4gIGdldEljb25OYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdudWNsaWNvbi1jb25zb2xlJztcbiAgfVxuXG4gIC8vIEdldCB0aGUgcGFuZSBpdGVtJ3MgdGl0bGUuIElmIHRoZXJlJ3Mgb25seSBvbmUgc291cmNlIHNlbGVjdGVkLCB3ZSdsbCB1c2UgdGhhdCB0byBtYWtlIGEgbW9yZVxuICAvLyBkZXNjcmlwdGl2ZSB0aXRsZS5cbiAgZ2V0VGl0bGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBlbmFibGVkUHJvdmlkZXJDb3VudCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkucHJvdmlkZXJzLnNpemU7XG4gICAgY29uc3Qge3Vuc2VsZWN0ZWRTb3VyY2VJZHN9ID0gdGhpcy5fbW9kZWwuc3RhdGU7XG5cbiAgICAvLyBDYWxsaW5nIGBfZ2V0U291cmNlcygpYCBpcyAoY3VycmVudGx5KSBleHBlbnNpdmUgYmVjYXVzZSBpdCBuZWVkcyB0byBzZWFyY2ggYWxsIHRoZSByZWNvcmRzXG4gICAgLy8gZm9yIHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gZGlzYWJsZWQgYnV0IHN0aWxsIGhhdmUgcmVjb3Jkcy4gV2UgdHJ5IHRvIGF2b2lkIGNhbGxpbmcgaXQgaWYgd2VcbiAgICAvLyBhbHJlYWR5IGtub3cgdGhhdCB0aGVyZSdzIG1vcmUgdGhhbiBvbmUgc2VsZWN0ZWQgc291cmNlLlxuICAgIGlmIChlbmFibGVkUHJvdmlkZXJDb3VudCAtIHVuc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuICdDb25zb2xlJztcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIHNvdXJjZSBzZWxlY3RlZCwgdXNlIGl0cyBuYW1lIGluIHRoZSB0YWIgdGl0bGUuXG4gICAgY29uc3Qgc291cmNlcyA9IHRoaXMuX2dldFNvdXJjZXMoKTtcbiAgICBpZiAoc291cmNlcy5sZW5ndGggLSB1bnNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRTb3VyY2UgPSBzb3VyY2VzLmZpbmQoXG4gICAgICAgIHNvdXJjZSA9PiB1bnNlbGVjdGVkU291cmNlSWRzLmluZGV4T2Yoc291cmNlLmlkKSA9PT0gLTEsXG4gICAgICApO1xuICAgICAgaWYgKHNlbGVjdGVkU291cmNlKSB7XG4gICAgICAgIHJldHVybiBgQ29uc29sZTogJHtzZWxlY3RlZFNvdXJjZS5uYW1lfWA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICdDb25zb2xlJztcbiAgfVxuXG4gIGdldERlZmF1bHRMb2NhdGlvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnYm90dG9tJztcbiAgfVxuXG4gIGdldFVSSSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBXT1JLU1BBQ0VfVklFV19VUkk7XG4gIH1cblxuICBvbkRpZENoYW5nZVRpdGxlKGNhbGxiYWNrOiAodGl0bGU6IHN0cmluZykgPT4gbWl4ZWQpOiBJRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKHRoaXMuX3RpdGxlQ2hhbmdlcy5zdWJzY3JpYmUoY2FsbGJhY2spKTtcbiAgfVxuXG4gIF9nZXRTb3VyY2VzKCk6IEFycmF5PFNvdXJjZT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHByb3ZpZGVycyxcbiAgICAgIHByb3ZpZGVyU3RhdHVzZXMsXG4gICAgICByZWNvcmRzLFxuICAgICAgaW5jb21wbGV0ZVJlY29yZHMsXG4gICAgfSA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCk7XG4gICAgcmV0dXJuIHRoaXMuX2dldFNvdXJjZXNNZW1vaXplZCh7XG4gICAgICBwcm92aWRlcnMsXG4gICAgICBwcm92aWRlclN0YXR1c2VzLFxuICAgICAgcmVjb3JkcyxcbiAgICAgIGluY29tcGxldGVSZWNvcmRzLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gTWVtb2l6ZSBgZ2V0U291cmNlcygpYC4gVW5mb3J0dW5hdGVseSwgc2luY2Ugd2UgbG9vayBmb3IgdW5yZXByZXNlbnRlZCBzb3VyY2VzIGluIHRoZSByZWNvcmRcbiAgLy8gbGlzdCwgdGhpcyBzdGlsbCBuZWVkcyB0byBiZSBjYWxsZWQgd2hlbmV2ZXIgdGhlIHJlY29yZHMgY2hhbmdlLlxuICAvLyBUT0RPOiBDb25zaWRlciByZW1vdmluZyByZWNvcmRzIHdoZW4gdGhlaXIgc291cmNlIGlzIHJlbW92ZWQuIFRoaXMgd2lsbCBsaWtlbHkgcmVxdWlyZSBhZGRpbmdcbiAgLy8gdGhlIGFiaWxpdHkgdG8gZW5hYmxlIGFuZCBkaXNhYmxlIHNvdXJjZXMgc28sIGZvciBleGFtcGxlLCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBubyBsb25nZXJcbiAgLy8gYWN0aXZlLCBpdCBzdGlsbCByZW1haW5zIGluIHRoZSBzb3VyY2UgbGlzdC5cbiAgLy8gJEZsb3dGaXhNZSAoPj0wLjg1LjApIChUMzU5ODY4OTYpIEZsb3cgdXBncmFkZSBzdXBwcmVzc1xuICBfZ2V0U291cmNlc01lbW9pemVkID0gbWVtb2l6ZVVudGlsQ2hhbmdlZChcbiAgICBnZXRTb3VyY2VzLFxuICAgIG9wdHMgPT4gb3B0cyxcbiAgICAoYSwgYikgPT4gc2hhbGxvd0VxdWFsKGEsIGIpLFxuICApO1xuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgfVxuXG4gIGNvcHkoKTogQ29uc29sZSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlKHtcbiAgICAgIHN0b3JlOiB0aGlzLl9zdG9yZSxcbiAgICAgIGluaXRpYWxGaWx0ZXJUZXh0OiB0aGlzLl9tb2RlbC5zdGF0ZS5maWx0ZXJUZXh0LFxuICAgICAgaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlcjogdGhpcy5fbW9kZWwuc3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM6IHNldERpZmZlcmVuY2UoXG4gICAgICAgIEFMTF9TRVZFUklUSUVTLFxuICAgICAgICB0aGlzLl9tb2RlbC5zdGF0ZS5zZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgICApLFxuICAgIH0pO1xuICB9XG5cbiAgX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMoKTogQm91bmRBY3Rpb25DcmVhdG9ycyB7XG4gICAgaWYgKHRoaXMuX2FjdGlvbkNyZWF0b3JzID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2FjdGlvbkNyZWF0b3JzID0ge1xuICAgICAgICBleGVjdXRlOiBjb2RlID0+IHtcbiAgICAgICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChBY3Rpb25zLmV4ZWN1dGUoY29kZSkpO1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RFeGVjdXRvcjogZXhlY3V0b3JJZCA9PiB7XG4gICAgICAgICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2goQWN0aW9ucy5zZWxlY3RFeGVjdXRvcihleGVjdXRvcklkKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyUmVjb3JkczogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuY2xlYXJSZWNvcmRzKCkpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FjdGlvbkNyZWF0b3JzO1xuICB9XG5cbiAgX3Jlc2V0QWxsRmlsdGVycyA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLl9zZWxlY3RTb3VyY2VzKHRoaXMuX2dldFNvdXJjZXMoKS5tYXAocyA9PiBzLmlkKSk7XG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe2ZpbHRlclRleHQ6ICcnfSk7XG4gIH07XG5cbiAgX2NyZWF0ZVBhc3RlID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IGRpc3BsYXlhYmxlUmVjb3JkcyA9IFNlbGVjdG9ycy5nZXRBbGxSZWNvcmRzKFxuICAgICAgdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKSxcbiAgICApLnRvQXJyYXkoKTtcbiAgICBjb25zdCBjcmVhdGVQYXN0ZUltcGwgPSB0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpLmNyZWF0ZVBhc3RlRnVuY3Rpb247XG4gICAgaWYgKGNyZWF0ZVBhc3RlSW1wbCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVQYXN0ZShjcmVhdGVQYXN0ZUltcGwsIGRpc3BsYXlhYmxlUmVjb3Jkcyk7XG4gIH07XG5cbiAgX2dldEZpbHRlckluZm8oKToge1xuICAgIGludmFsaWQ6IGJvb2xlYW4sXG4gICAgc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXG4gICAgZmlsdGVyZWRSZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxuICAgIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcbiAgfSB7XG4gICAgY29uc3Qge3BhdHRlcm4sIGludmFsaWR9ID0gZ2V0RmlsdGVyUGF0dGVybihcbiAgICAgIHRoaXMuX21vZGVsLnN0YXRlLmZpbHRlclRleHQsXG4gICAgICB0aGlzLl9tb2RlbC5zdGF0ZS5lbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgKTtcbiAgICBjb25zdCBzb3VyY2VzID0gdGhpcy5fZ2V0U291cmNlcygpO1xuICAgIGNvbnN0IHNlbGVjdGVkU291cmNlSWRzID0gc291cmNlc1xuICAgICAgLm1hcChzb3VyY2UgPT4gc291cmNlLmlkKVxuICAgICAgLmZpbHRlcihcbiAgICAgICAgc291cmNlSWQgPT5cbiAgICAgICAgICB0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLmluZGV4T2Yoc291cmNlSWQpID09PSAtMSxcbiAgICAgICk7XG5cbiAgICBjb25zdCB7c2VsZWN0ZWRTZXZlcml0aWVzfSA9IHRoaXMuX21vZGVsLnN0YXRlO1xuICAgIGNvbnN0IGZpbHRlcmVkUmVjb3JkcyA9IGZpbHRlclJlY29yZHMoXG4gICAgICBTZWxlY3RvcnMuZ2V0QWxsUmVjb3Jkcyh0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpKS50b0FycmF5KCksXG4gICAgICBzZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICAgIHBhdHRlcm4sXG4gICAgICBzb3VyY2VzLmxlbmd0aCAhPT0gc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoLFxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaW52YWxpZCxcbiAgICAgIHNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxuICAgICAgZmlsdGVyZWRSZWNvcmRzLFxuICAgIH07XG4gIH1cblxuICBnZXRFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBpZiAodGhpcy5fZWxlbWVudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZWxlbWVudDtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25DcmVhdG9ycyA9IHRoaXMuX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMoKTtcbiAgICBjb25zdCBnbG9iYWxTdGF0ZXM6IE9ic2VydmFibGU8QXBwU3RhdGU+ID0gb2JzZXJ2YWJsZUZyb21SZWR1eFN0b3JlKFxuICAgICAgdGhpcy5fc3RvcmUsXG4gICAgKTtcblxuICAgIGNvbnN0IHByb3BzID0gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgdGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksXG4gICAgICBnbG9iYWxTdGF0ZXMsXG4gICAgKVxuICAgICAgLy8gRG9uJ3QgcmUtcmVuZGVyIHdoZW4gdGhlIGNvbnNvbGUgaXNuJ3QgdmlzaWJsZS5cbiAgICAgIC5sZXQodG9nZ2xlKG9ic2VydmVQYW5lSXRlbVZpc2liaWxpdHkodGhpcykpKVxuICAgICAgLmF1ZGl0KCgpID0+IG5leHRBbmltYXRpb25GcmFtZSlcbiAgICAgIC5tYXAoKFtsb2NhbFN0YXRlLCBnbG9iYWxTdGF0ZV0pID0+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGludmFsaWQsXG4gICAgICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxuICAgICAgICAgIGZpbHRlcmVkUmVjb3JkcyxcbiAgICAgICAgfSA9IHRoaXMuX2dldEZpbHRlckluZm8oKTtcblxuICAgICAgICBjb25zdCBjdXJyZW50RXhlY3V0b3JJZCA9IFNlbGVjdG9ycy5nZXRDdXJyZW50RXhlY3V0b3JJZChnbG9iYWxTdGF0ZSk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvciA9XG4gICAgICAgICAgY3VycmVudEV4ZWN1dG9ySWQgIT0gbnVsbFxuICAgICAgICAgICAgPyBnbG9iYWxTdGF0ZS5leGVjdXRvcnMuZ2V0KGN1cnJlbnRFeGVjdXRvcklkKVxuICAgICAgICAgICAgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW52YWxpZEZpbHRlcklucHV0OiBpbnZhbGlkLFxuICAgICAgICAgIGV4ZWN1dGU6IGFjdGlvbkNyZWF0b3JzLmV4ZWN1dGUsXG4gICAgICAgICAgc2VsZWN0RXhlY3V0b3I6IGFjdGlvbkNyZWF0b3JzLnNlbGVjdEV4ZWN1dG9yLFxuICAgICAgICAgIGNsZWFyUmVjb3JkczogYWN0aW9uQ3JlYXRvcnMuY2xlYXJSZWNvcmRzLFxuICAgICAgICAgIGNyZWF0ZVBhc3RlOlxuICAgICAgICAgICAgZ2xvYmFsU3RhdGUuY3JlYXRlUGFzdGVGdW5jdGlvbiA9PSBudWxsID8gbnVsbCA6IHRoaXMuX2NyZWF0ZVBhc3RlLFxuICAgICAgICAgIHdhdGNoRWRpdG9yOiBnbG9iYWxTdGF0ZS53YXRjaEVkaXRvcixcbiAgICAgICAgICBjdXJyZW50RXhlY3V0b3IsXG4gICAgICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkczogbG9jYWxTdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgICAgIGZpbHRlclRleHQ6IGxvY2FsU3RhdGUuZmlsdGVyVGV4dCxcbiAgICAgICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IGxvY2FsU3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgICAgIHJlY29yZHM6IGZpbHRlcmVkUmVjb3JkcyxcbiAgICAgICAgICBmaWx0ZXJlZFJlY29yZENvdW50OlxuICAgICAgICAgICAgU2VsZWN0b3JzLmdldEFsbFJlY29yZHMoZ2xvYmFsU3RhdGUpLnNpemUgLSBmaWx0ZXJlZFJlY29yZHMubGVuZ3RoLFxuICAgICAgICAgIGhpc3Rvcnk6IGdsb2JhbFN0YXRlLmhpc3RvcnksXG4gICAgICAgICAgc291cmNlczogdGhpcy5fZ2V0U291cmNlcygpLFxuICAgICAgICAgIHNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgICAgIHNlbGVjdFNvdXJjZXM6IHRoaXMuX3NlbGVjdFNvdXJjZXMsXG4gICAgICAgICAgZXhlY3V0b3JzOiBnbG9iYWxTdGF0ZS5leGVjdXRvcnMsXG4gICAgICAgICAgZ2V0UHJvdmlkZXI6IGlkID0+IGdsb2JhbFN0YXRlLnByb3ZpZGVycy5nZXQoaWQpLFxuICAgICAgICAgIHVwZGF0ZUZpbHRlcjogdGhpcy5fdXBkYXRlRmlsdGVyLFxuICAgICAgICAgIHJlc2V0QWxsRmlsdGVyczogdGhpcy5fcmVzZXRBbGxGaWx0ZXJzLFxuICAgICAgICAgIGZvbnRTaXplOiBnbG9iYWxTdGF0ZS5mb250U2l6ZSxcbiAgICAgICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk6IHRoaXMuX3RvZ2dsZVNldmVyaXR5LFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBTdGF0ZWZ1bENvbnNvbGVWaWV3ID0gYmluZE9ic2VydmFibGVBc1Byb3BzKHByb3BzLCBDb25zb2xlVmlldyk7XG4gICAgcmV0dXJuICh0aGlzLl9lbGVtZW50ID0gcmVuZGVyUmVhY3RSb290KDxTdGF0ZWZ1bENvbnNvbGVWaWV3IC8+KSk7XG4gIH1cblxuICBzZXJpYWxpemUoKTogQ29uc29sZVBlcnNpc3RlZFN0YXRlIHtcbiAgICBjb25zdCB7XG4gICAgICBmaWx0ZXJUZXh0LFxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICB9ID0gdGhpcy5fbW9kZWwuc3RhdGU7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlc2VyaWFsaXplcjogJ251Y2xpZGUuQ29uc29sZScsXG4gICAgICBmaWx0ZXJUZXh0LFxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIHVuc2VsZWN0ZWRTZXZlcml0aWVzOiBbXG4gICAgICAgIC4uLnNldERpZmZlcmVuY2UoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcyksXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICBfc2VsZWN0U291cmNlcyA9IChzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHNvdXJjZUlkcyA9IHRoaXMuX2dldFNvdXJjZXMoKS5tYXAoc291cmNlID0+IHNvdXJjZS5pZCk7XG4gICAgY29uc3QgdW5zZWxlY3RlZFNvdXJjZUlkcyA9IHNvdXJjZUlkcy5maWx0ZXIoXG4gICAgICBzb3VyY2VJZCA9PiBzZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZUlkKSA9PT0gLTEsXG4gICAgKTtcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7dW5zZWxlY3RlZFNvdXJjZUlkc30pO1xuICB9O1xuXG4gIC8qKiBVbnNlbGVjdHMgdGhlIHNvdXJjZXMgZnJvbSB0aGUgZ2l2ZW4gSURzICovXG4gIHVuc2VsZWN0U291cmNlcyhpZHM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICBjb25zdCBuZXdJZHMgPSBpZHMuZmlsdGVyKFxuICAgICAgaWQgPT4gIXRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMuaW5jbHVkZXMoaWQpLFxuICAgICk7XG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe1xuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkczogdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5jb25jYXQobmV3SWRzKSxcbiAgICB9KTtcbiAgfVxuXG4gIF91cGRhdGVGaWx0ZXIgPSAoY2hhbmdlOiBSZWdFeHBGaWx0ZXJDaGFuZ2UpOiB2b2lkID0+IHtcbiAgICBjb25zdCB7dGV4dCwgaXNSZWdFeHB9ID0gY2hhbmdlO1xuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHtcbiAgICAgIGZpbHRlclRleHQ6IHRleHQsXG4gICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IGlzUmVnRXhwLFxuICAgIH0pO1xuICB9O1xuXG4gIF90b2dnbGVTZXZlcml0eSA9IChzZXZlcml0eTogU2V2ZXJpdHkpOiB2b2lkID0+IHtcbiAgICBjb25zdCB7c2VsZWN0ZWRTZXZlcml0aWVzfSA9IHRoaXMuX21vZGVsLnN0YXRlO1xuICAgIGNvbnN0IG5leHRTZWxlY3RlZFNldmVyaXRpZXMgPSBuZXcgU2V0KHNlbGVjdGVkU2V2ZXJpdGllcyk7XG4gICAgaWYgKG5leHRTZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KSkge1xuICAgICAgbmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5kZWxldGUoc2V2ZXJpdHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0U2VsZWN0ZWRTZXZlcml0aWVzLmFkZChzZXZlcml0eSk7XG4gICAgfVxuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHtzZWxlY3RlZFNldmVyaXRpZXM6IG5leHRTZWxlY3RlZFNldmVyaXRpZXN9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U291cmNlcyhvcHRpb25zOiB7XG4gIHJlY29yZHM6IExpc3Q8UmVjb3JkPixcbiAgcHJvdmlkZXJzOiBNYXA8c3RyaW5nLCBTb3VyY2VJbmZvPixcbiAgcHJvdmlkZXJTdGF0dXNlczogTWFwPHN0cmluZywgQ29uc29sZVNvdXJjZVN0YXR1cz4sXG59KTogQXJyYXk8U291cmNlPiB7XG4gIGNvbnN0IHtwcm92aWRlcnMsIHByb3ZpZGVyU3RhdHVzZXMsIHJlY29yZHN9ID0gb3B0aW9ucztcblxuICAvLyBDb252ZXJ0IHRoZSBwcm92aWRlcnMgdG8gYSBtYXAgb2Ygc291cmNlcy5cbiAgY29uc3QgbWFwT2ZTb3VyY2VzID0gbmV3IE1hcChcbiAgICBBcnJheS5mcm9tKHByb3ZpZGVycy5lbnRyaWVzKCkpLm1hcCgoW2ssIHByb3ZpZGVyXSkgPT4ge1xuICAgICAgY29uc3Qgc291cmNlID0ge1xuICAgICAgICBpZDogcHJvdmlkZXIuaWQsXG4gICAgICAgIG5hbWU6IHByb3ZpZGVyLm5hbWUsXG4gICAgICAgIHN0YXR1czogcHJvdmlkZXJTdGF0dXNlcy5nZXQocHJvdmlkZXIuaWQpIHx8ICdzdG9wcGVkJyxcbiAgICAgICAgc3RhcnQ6XG4gICAgICAgICAgdHlwZW9mIHByb3ZpZGVyLnN0YXJ0ID09PSAnZnVuY3Rpb24nID8gcHJvdmlkZXIuc3RhcnQgOiB1bmRlZmluZWQsXG4gICAgICAgIHN0b3A6IHR5cGVvZiBwcm92aWRlci5zdG9wID09PSAnZnVuY3Rpb24nID8gcHJvdmlkZXIuc3RvcCA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gW2ssIHNvdXJjZV07XG4gICAgfSksXG4gICk7XG5cbiAgLy8gU29tZSBwcm92aWRlcnMgbWF5IGhhdmUgYmVlbiB1bnJlZ2lzdGVyZWQsIGJ1dCBzdGlsbCBoYXZlIHJlY29yZHMuIEFkZCBzb3VyY2VzIGZvciB0aGVtIHRvby5cbiAgLy8gVE9ETzogSXRlcmF0aW5nIG92ZXIgYWxsIHRoZSByZWNvcmRzIHRvIGdldCB0aGlzIGV2ZXJ5IHRpbWUgd2UgZ2V0IGEgbmV3IHJlY29yZCBpcyBpbmVmZmljaWVudC5cbiAgcmVjb3Jkcy5mb3JFYWNoKChyZWNvcmQsIGkpID0+IHtcbiAgICBpZiAoIW1hcE9mU291cmNlcy5oYXMocmVjb3JkLnNvdXJjZUlkKSkge1xuICAgICAgbWFwT2ZTb3VyY2VzLnNldChyZWNvcmQuc291cmNlSWQsIHtcbiAgICAgICAgaWQ6IHJlY29yZC5zb3VyY2VJZCxcbiAgICAgICAgbmFtZTogcmVjb3JkLnNvdXJjZUlkLFxuICAgICAgICBzdGF0dXM6ICdzdG9wcGVkJyxcbiAgICAgICAgc3RhcnQ6IHVuZGVmaW5lZCxcbiAgICAgICAgc3RvcDogdW5kZWZpbmVkLFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gQXJyYXkuZnJvbShtYXBPZlNvdXJjZXMudmFsdWVzKCkpO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJSZWNvcmRzKFxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxuICBzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxuICBmaWx0ZXJQYXR0ZXJuOiA/UmVnRXhwLFxuICBmaWx0ZXJTb3VyY2VzOiBib29sZWFuLFxuKTogQXJyYXk8UmVjb3JkPiB7XG4gIGlmIChcbiAgICAhZmlsdGVyU291cmNlcyAmJlxuICAgIGZpbHRlclBhdHRlcm4gPT0gbnVsbCAmJlxuICAgIGFyZVNldHNFcXVhbChBTExfU0VWRVJJVElFUywgc2VsZWN0ZWRTZXZlcml0aWVzKVxuICApIHtcbiAgICByZXR1cm4gcmVjb3JkcztcbiAgfVxuXG4gIHJldHVybiByZWNvcmRzLmZpbHRlcihyZWNvcmQgPT4ge1xuICAgIC8vIE9ubHkgZmlsdGVyIHJlZ3VsYXIgbWVzc2FnZXNcbiAgICBpZiAocmVjb3JkLmtpbmQgIT09ICdtZXNzYWdlJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFzZWxlY3RlZFNldmVyaXRpZXMuaGFzKGxldmVsVG9TZXZlcml0eShyZWNvcmQubGV2ZWwpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZU1hdGNoZXMgPSBzZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHJlY29yZC5zb3VyY2VJZCkgIT09IC0xO1xuICAgIHJldHVybiAoXG4gICAgICBzb3VyY2VNYXRjaGVzICYmXG4gICAgICAoZmlsdGVyUGF0dGVybiA9PSBudWxsIHx8IGZpbHRlclBhdHRlcm4udGVzdChyZWNvcmQudGV4dCkpXG4gICAgKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZVJlY29yZE9iamVjdChcbiAgdmlzaXRlZDogU2V0PHN0cmluZz4sXG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxuICB0ZXh0OiBzdHJpbmcsXG4gIGxldmVsOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBnZXRUZXh0ID0gZXhwID0+IHtcbiAgICBsZXQgaW5kZW50ID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZXZlbDsgaSsrKSB7XG4gICAgICBpbmRlbnQgKz0gJ1xcdCc7XG4gICAgfVxuICAgIHJldHVybiBpbmRlbnQgKyBleHAuZ2V0VmFsdWUoKTtcbiAgfTtcblxuICBpZiAoIWV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKSkge1xuICAgIC8vIExlYWYgbm9kZS5cbiAgICByZXR1cm4gdGV4dCArIGdldFRleHQoZXhwcmVzc2lvbik7XG4gIH1cblxuICBjb25zdCBpZCA9IGV4cHJlc3Npb24uZ2V0SWQoKTtcbiAgaWYgKHZpc2l0ZWQuaGFzKGlkKSkge1xuICAgIC8vIEd1YXJkIGFnYWluc3QgY3ljbGVzLlxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgdmlzaXRlZC5hZGQoaWQpO1xuXG4gIGNvbnN0IGNoaWxkcmVuID0gYXdhaXQgZXhwcmVzc2lvbi5nZXRDaGlsZHJlbigpO1xuICBjb25zdCBzZXJpYWxpemVkUHJvcHMgPSBjaGlsZHJlbi5tYXAoY2hpbGRQcm9wID0+IHtcbiAgICByZXR1cm4gc2VyaWFsaXplUmVjb3JkT2JqZWN0KHZpc2l0ZWQsIGNoaWxkUHJvcCwgJycsIGxldmVsICsgMSk7XG4gIH0pO1xuICByZXR1cm4gKFxuICAgIGdldFRleHQoZXhwcmVzc2lvbikgKyAnXFxuJyArIChhd2FpdCBQcm9taXNlLmFsbChzZXJpYWxpemVkUHJvcHMpKS5qb2luKCdcXG4nKVxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVQYXN0ZShcbiAgY3JlYXRlUGFzdGVJbXBsOiBDcmVhdGVQYXN0ZUZ1bmN0aW9uLFxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGxpbmVQcm9taXNlcyA9IHJlY29yZHNcbiAgICAuZmlsdGVyKFxuICAgICAgcmVjb3JkID0+XG4gICAgICAgIHJlY29yZC5raW5kID09PSAnbWVzc2FnZScgfHxcbiAgICAgICAgcmVjb3JkLmtpbmQgPT09ICdyZXF1ZXN0JyB8fFxuICAgICAgICByZWNvcmQua2luZCA9PT0gJ3Jlc3BvbnNlJyxcbiAgICApXG4gICAgLm1hcChhc3luYyByZWNvcmQgPT4ge1xuICAgICAgY29uc3QgbGV2ZWwgPVxuICAgICAgICByZWNvcmQubGV2ZWwgIT0gbnVsbCA/IHJlY29yZC5sZXZlbC50b1N0cmluZygpLnRvVXBwZXJDYXNlKCkgOiAnTE9HJztcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IHJlY29yZC50aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoKTtcbiAgICAgIGxldCB0ZXh0ID0gcmVjb3JkLnRleHQgfHwgRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0U7XG5cbiAgICAgIGlmIChcbiAgICAgICAgcmVjb3JkLmtpbmQgPT09ICdyZXNwb25zZScgJiZcbiAgICAgICAgcmVjb3JkLmV4cHJlc3Npb25zICE9IG51bGwgJiZcbiAgICAgICAgcmVjb3JkLmV4cHJlc3Npb25zLmxlbmd0aCA+IDBcbiAgICAgICkge1xuICAgICAgICB0ZXh0ID0gJyc7XG4gICAgICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiByZWNvcmQuZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgcmVjb3JkIGhhcyBhIGRhdGEgb2JqZWN0LCBhbmQgdGhlIG9iamVjdCBoYXMgYW4gSUQsXG4gICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXhwYW5kIHRoZSBub2RlcyBvZiB0aGUgb2JqZWN0IGFuZCBzZXJpYWxpemUgaXRcbiAgICAgICAgICAvLyBmb3IgdGhlIHBhc3RlLlxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1hd2FpdC1pbi1sb29wXG4gICAgICAgICAgdGV4dCArPSBhd2FpdCBzZXJpYWxpemVSZWNvcmRPYmplY3QobmV3IFNldCgpLCBleHByZXNzaW9uLCAnJywgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGBbJHtsZXZlbH1dWyR7cmVjb3JkLnNvdXJjZUlkfV1bJHt0aW1lc3RhbXB9XVxcdCAke3RleHR9YDtcbiAgICB9KTtcblxuICBjb25zdCBsaW5lcyA9IChhd2FpdCBQcm9taXNlLmFsbChsaW5lUHJvbWlzZXMpKS5qb2luKCdcXG4nKTtcblxuICBpZiAobGluZXMgPT09ICcnKSB7XG4gICAgLy8gQ2FuJ3QgY3JlYXRlIGFuIGVtcHR5IHBhc3RlIVxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFxuICAgICAgJ1RoZXJlIGlzIG5vdGhpbmcgaW4geW91ciBjb25zb2xlIHRvIFBhc3RlISBDaGVjayB5b3VyIGNvbnNvbGUgZmlsdGVycyBhbmQgdHJ5IGFnYWluLicsXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnQ3JlYXRpbmcgUGFzdGUuLi4nKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHVyaSA9IGF3YWl0IGNyZWF0ZVBhc3RlSW1wbChcbiAgICAgIGxpbmVzLFxuICAgICAge1xuICAgICAgICB0aXRsZTogJ051Y2xpZGUgQ29uc29sZSBQYXN0ZScsXG4gICAgICB9LFxuICAgICAgJ2NvbnNvbGUgcGFzdGUnLFxuICAgICk7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoYENyZWF0ZWQgUGFzdGUgYXQgJHt1cml9YCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLnN0ZG91dCA9PSBudWxsKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIHBhc3RlOiAke1N0cmluZyhlcnJvci5tZXNzYWdlIHx8IGVycm9yKX1gLFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlcyA9IGVycm9yLnN0ZG91dFxuICAgICAgLnRyaW0oKVxuICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgLm1hcChKU09OLnBhcnNlKVxuICAgICAgLm1hcChlID0+IGUubWVzc2FnZSk7XG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHBhc3RlJywge1xuICAgICAgZGV0YWlsOiBlcnJvck1lc3NhZ2VzLmpvaW4oJ1xcbicpLFxuICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbGV2ZWxUb1NldmVyaXR5KGxldmVsOiBMZXZlbCk6IFNldmVyaXR5IHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIHJldHVybiAnZXJyb3InO1xuICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgcmV0dXJuICd3YXJuaW5nJztcbiAgICBjYXNlICdsb2cnOlxuICAgIGNhc2UgJ2luZm8nOlxuICAgIGNhc2UgJ2RlYnVnJzpcbiAgICBjYXNlICdzdWNjZXNzJzpcbiAgICAgIHJldHVybiAnaW5mbyc7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIEFsbCB0aGUgY29sb3JzIGFyZSBcImluZm9cIlxuICAgICAgcmV0dXJuICdpbmZvJztcbiAgfVxufVxuIl19