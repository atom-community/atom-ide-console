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

/* eslint-env browser */
// Other Nuclide packages (which cannot import this) depend on this URI. If this
// needs to be changed, grep for CONSOLE_VIEW_URI and ensure that the URIs match.
const WORKSPACE_VIEW_URI = "atom://nuclide/console";
exports.WORKSPACE_VIEW_URI = WORKSPACE_VIEW_URI;
const ERROR_TRANSCRIBING_MESSAGE = "// Nuclide couldn't find the right text to display";
const ALL_SEVERITIES = new Set(["error", "warning", "info"]);
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
        filterText: ""
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
      filterText: initialFilterText == null ? "" : initialFilterText,
      enableRegExpFilter: Boolean(initialEnableRegExpFilter),
      unselectedSourceIds: initialUnselectedSourceIds == null ? [] : initialUnselectedSourceIds,
      selectedSeverities: initialUnselectedSeverities == null ? ALL_SEVERITIES : (0, _collection.setDifference)(ALL_SEVERITIES, initialUnselectedSeverities)
    });
    this._store = store;
    this._destroyed = new _rxjsCompatUmdMin.ReplaySubject(1);
    this._titleChanges = _rxjsCompatUmdMin.Observable.combineLatest(this._model.toObservable(), (0, _observableFromReduxStore.default)(store)).takeUntil(this._destroyed).map(() => this.getTitle()).distinctUntilChanged().share();
  }

  getIconName() {
    return "nuclicon-console";
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
      return "Console";
    } // If there's only one source selected, use its name in the tab title.


    const sources = this._getSources();

    if (sources.length - unselectedSourceIds.length === 1) {
      const selectedSource = sources.find(source => unselectedSourceIds.indexOf(source.id) === -1);

      if (selectedSource) {
        return `Console: ${selectedSource.name}`;
      }
    }

    return "Console";
  }

  getDefaultLocation() {
    return "bottom";
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
      deserializer: "nuclide.Console",
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
      status: providerStatuses.get(provider.id) || "stopped",
      start: typeof provider.start === "function" ? provider.start : undefined,
      stop: typeof provider.stop === "function" ? provider.stop : undefined
    };
    return [k, source];
  })); // Some providers may have been unregistered, but still have records. Add sources for them too.
  // TODO: Iterating over all the records to get this every time we get a new record is inefficient.

  records.forEach((record, i) => {
    if (!mapOfSources.has(record.sourceId)) {
      mapOfSources.set(record.sourceId, {
        id: record.sourceId,
        name: record.sourceId,
        status: "stopped",
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
    if (record.kind !== "message") {
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
    let indent = "";

    for (let i = 0; i < level; i++) {
      indent += "\t";
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
    return serializeRecordObject(visited, childProp, "", level + 1);
  });
  return getText(expression) + "\n" + (await Promise.all(serializedProps)).join("\n");
}

async function createPaste(createPasteImpl, records) {
  const linePromises = records.filter(record => record.kind === "message" || record.kind === "request" || record.kind === "response").map(async record => {
    const level = record.level != null ? record.level.toString().toUpperCase() : "LOG";
    const timestamp = record.timestamp.toLocaleString();
    let text = record.text || ERROR_TRANSCRIBING_MESSAGE;

    if (record.kind === "response" && record.expressions != null && record.expressions.length > 0) {
      text = "";

      for (const expression of record.expressions) {
        // If the record has a data object, and the object has an ID,
        // recursively expand the nodes of the object and serialize it
        // for the paste.
        // eslint-disable-next-line no-await-in-loop
        text += await serializeRecordObject(new Set(), expression, "", 0);
      }
    }

    return `[${level}][${record.sourceId}][${timestamp}]\t ${text}`;
  });
  const lines = (await Promise.all(linePromises)).join("\n");

  if (lines === "") {
    // Can't create an empty paste!
    atom.notifications.addWarning("There is nothing in your console to Paste! Check your console filters and try again.");
    return;
  }

  atom.notifications.addInfo("Creating Paste...");

  try {
    const uri = await createPasteImpl(lines, {
      title: "Nuclide Console Paste"
    }, "console paste");
    atom.notifications.addSuccess(`Created Paste at ${uri}`);
  } catch (error) {
    if (error.stdout == null) {
      atom.notifications.addError(`Failed to create paste: ${String(error.message || error)}`);
      return;
    }

    const errorMessages = error.stdout.trim().split("\n").map(JSON.parse).map(e => e.message);
    atom.notifications.addError("Failed to create paste", {
      detail: errorMessages.join("\n"),
      dismissable: true
    });
  }
}

function levelToSeverity(level) {
  switch (level) {
    case "error":
      return "error";

    case "warning":
      return "warning";

    case "log":
    case "info":
    case "debug":
    case "success":
      return "info";

    default:
      // All the colors are "info"
      return "info";
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGUuanMiXSwibmFtZXMiOlsiV09SS1NQQUNFX1ZJRVdfVVJJIiwiRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UiLCJBTExfU0VWRVJJVElFUyIsIlNldCIsIkNvbnNvbGUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfYWN0aW9uQ3JlYXRvcnMiLCJfdGl0bGVDaGFuZ2VzIiwiX21vZGVsIiwiX3N0b3JlIiwiX2VsZW1lbnQiLCJfZGVzdHJveWVkIiwiX2dldFNvdXJjZXNNZW1vaXplZCIsImdldFNvdXJjZXMiLCJvcHRzIiwiYSIsImIiLCJfcmVzZXRBbGxGaWx0ZXJzIiwiX3NlbGVjdFNvdXJjZXMiLCJfZ2V0U291cmNlcyIsIm1hcCIsInMiLCJpZCIsInNldFN0YXRlIiwiZmlsdGVyVGV4dCIsIl9jcmVhdGVQYXN0ZSIsImRpc3BsYXlhYmxlUmVjb3JkcyIsIlNlbGVjdG9ycyIsImdldEFsbFJlY29yZHMiLCJnZXRTdGF0ZSIsInRvQXJyYXkiLCJjcmVhdGVQYXN0ZUltcGwiLCJjcmVhdGVQYXN0ZUZ1bmN0aW9uIiwiY3JlYXRlUGFzdGUiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZUlkcyIsInNvdXJjZSIsInVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJmaWx0ZXIiLCJzb3VyY2VJZCIsImluZGV4T2YiLCJfdXBkYXRlRmlsdGVyIiwiY2hhbmdlIiwidGV4dCIsImlzUmVnRXhwIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiX3RvZ2dsZVNldmVyaXR5Iiwic2V2ZXJpdHkiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJzdGF0ZSIsIm5leHRTZWxlY3RlZFNldmVyaXRpZXMiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJzdG9yZSIsImluaXRpYWxGaWx0ZXJUZXh0IiwiaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciIsImluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwiTW9kZWwiLCJCb29sZWFuIiwiUmVwbGF5U3ViamVjdCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwidG9PYnNlcnZhYmxlIiwidGFrZVVudGlsIiwiZ2V0VGl0bGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsInNoYXJlIiwiZ2V0SWNvbk5hbWUiLCJlbmFibGVkUHJvdmlkZXJDb3VudCIsInByb3ZpZGVycyIsInNpemUiLCJsZW5ndGgiLCJzb3VyY2VzIiwic2VsZWN0ZWRTb3VyY2UiLCJmaW5kIiwibmFtZSIsImdldERlZmF1bHRMb2NhdGlvbiIsImdldFVSSSIsIm9uRGlkQ2hhbmdlVGl0bGUiLCJjYWxsYmFjayIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJzdWJzY3JpYmUiLCJwcm92aWRlclN0YXR1c2VzIiwicmVjb3JkcyIsImluY29tcGxldGVSZWNvcmRzIiwiZGVzdHJveSIsIm5leHQiLCJjb3B5IiwiX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMiLCJleGVjdXRlIiwiY29kZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsInNlbGVjdEV4ZWN1dG9yIiwiZXhlY3V0b3JJZCIsImNsZWFyUmVjb3JkcyIsIl9nZXRGaWx0ZXJJbmZvIiwicGF0dGVybiIsImludmFsaWQiLCJmaWx0ZXJlZFJlY29yZHMiLCJmaWx0ZXJSZWNvcmRzIiwiZ2V0RWxlbWVudCIsImFjdGlvbkNyZWF0b3JzIiwiZ2xvYmFsU3RhdGVzIiwicHJvcHMiLCJsZXQiLCJhdWRpdCIsIm5leHRBbmltYXRpb25GcmFtZSIsImxvY2FsU3RhdGUiLCJnbG9iYWxTdGF0ZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJjdXJyZW50RXhlY3V0b3IiLCJleGVjdXRvcnMiLCJnZXQiLCJpbnZhbGlkRmlsdGVySW5wdXQiLCJ3YXRjaEVkaXRvciIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJoaXN0b3J5Iiwic2VsZWN0U291cmNlcyIsImdldFByb3ZpZGVyIiwidXBkYXRlRmlsdGVyIiwicmVzZXRBbGxGaWx0ZXJzIiwiZm9udFNpemUiLCJ0b2dnbGVTZXZlcml0eSIsIlN0YXRlZnVsQ29uc29sZVZpZXciLCJDb25zb2xlVmlldyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplciIsInVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RTb3VyY2VzIiwiaWRzIiwibmV3SWRzIiwiaW5jbHVkZXMiLCJjb25jYXQiLCJtYXBPZlNvdXJjZXMiLCJNYXAiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwiayIsInByb3ZpZGVyIiwic3RhdHVzIiwic3RhcnQiLCJ1bmRlZmluZWQiLCJzdG9wIiwiZm9yRWFjaCIsInJlY29yZCIsImkiLCJzZXQiLCJ2YWx1ZXMiLCJmaWx0ZXJQYXR0ZXJuIiwiZmlsdGVyU291cmNlcyIsImtpbmQiLCJsZXZlbFRvU2V2ZXJpdHkiLCJsZXZlbCIsInNvdXJjZU1hdGNoZXMiLCJ0ZXN0Iiwic2VyaWFsaXplUmVjb3JkT2JqZWN0IiwidmlzaXRlZCIsImV4cHJlc3Npb24iLCJnZXRUZXh0IiwiZXhwIiwiaW5kZW50IiwiZ2V0VmFsdWUiLCJoYXNDaGlsZHJlbiIsImdldElkIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsInNlcmlhbGl6ZWRQcm9wcyIsImNoaWxkUHJvcCIsIlByb21pc2UiLCJhbGwiLCJqb2luIiwibGluZVByb21pc2VzIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRpbWVzdGFtcCIsInRvTG9jYWxlU3RyaW5nIiwiZXhwcmVzc2lvbnMiLCJsaW5lcyIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkV2FybmluZyIsImFkZEluZm8iLCJ1cmkiLCJ0aXRsZSIsImFkZFN1Y2Nlc3MiLCJlcnJvciIsInN0ZG91dCIsImFkZEVycm9yIiwiU3RyaW5nIiwibWVzc2FnZSIsImVycm9yTWVzc2FnZXMiLCJ0cmltIiwic3BsaXQiLCJKU09OIiwicGFyc2UiLCJlIiwiZGV0YWlsIiwiZGlzbWlzc2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7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LHdCQUE1QixFQUFzRDtBQUNwRFMsTUFBQUEsTUFBTSxFQUFFTixhQUFhLENBQUNwQixJQUFkLENBQW1CLElBQW5CLENBRDRDO0FBRXBEMkIsTUFBQUEsV0FBVyxFQUFFO0FBRnVDLEtBQXREO0FBSUQ7QUFDRjs7QUFFRCxTQUFTOUMsZUFBVCxDQUF5QkMsS0FBekIsRUFBaUQ7QUFDL0MsVUFBUUEsS0FBUjtBQUNFLFNBQUssT0FBTDtBQUNFLGFBQU8sT0FBUDs7QUFDRixTQUFLLFNBQUw7QUFDRSxhQUFPLFNBQVA7O0FBQ0YsU0FBSyxLQUFMO0FBQ0EsU0FBSyxNQUFMO0FBQ0EsU0FBSyxPQUFMO0FBQ0EsU0FBSyxTQUFMO0FBQ0UsYUFBTyxNQUFQOztBQUNGO0FBQ0U7QUFDQSxhQUFPLE1BQVA7QUFaSjtBQWNEIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbmltcG9ydCB0eXBlIHsgSUV4cHJlc3Npb24gfSBmcm9tIFwiLi4vLi4vLi4vLi5cIlxuaW1wb3J0IHR5cGUge1xuICBDb25zb2xlUGVyc2lzdGVkU3RhdGUsXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXG4gIFJlY29yZCxcbiAgU291cmNlLFxuICBTdG9yZSxcbiAgU291cmNlSW5mbyxcbiAgU2V2ZXJpdHksXG4gIExldmVsLFxuICBBcHBTdGF0ZSxcbn0gZnJvbSBcIi4uL3R5cGVzXCJcbmltcG9ydCB0eXBlIHsgQ3JlYXRlUGFzdGVGdW5jdGlvbiB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgdHlwZSB7IFJlZ0V4cEZpbHRlckNoYW5nZSB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9SZWdFeHBGaWx0ZXJcIlxuXG5pbXBvcnQgb2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9vYnNlcnZlUGFuZUl0ZW1WaXNpYmlsaXR5XCJcbmltcG9ydCB7IHNldERpZmZlcmVuY2UsIGFyZVNldHNFcXVhbCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9jb2xsZWN0aW9uXCJcbmltcG9ydCBNb2RlbCBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvTW9kZWxcIlxuaW1wb3J0IHNoYWxsb3dFcXVhbCBmcm9tIFwic2hhbGxvd2VxdWFsXCJcbmltcG9ydCB7IGJpbmRPYnNlcnZhYmxlQXNQcm9wcyB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9iaW5kT2JzZXJ2YWJsZUFzUHJvcHNcIlxuaW1wb3J0IHsgcmVuZGVyUmVhY3RSb290IH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL3JlbmRlclJlYWN0Um9vdFwiXG5pbXBvcnQgbWVtb2l6ZVVudGlsQ2hhbmdlZCBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvbWVtb2l6ZVVudGlsQ2hhbmdlZFwiXG5pbXBvcnQgeyB0b2dnbGUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvb2JzZXJ2YWJsZVwiXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZVwiXG5pbXBvcnQgeyBuZXh0QW5pbWF0aW9uRnJhbWUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvb2JzZXJ2YWJsZVwiXG5pbXBvcnQgb2JzZXJ2YWJsZUZyb21SZWR1eFN0b3JlIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9vYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmVcIlxuaW1wb3J0IHsgZ2V0RmlsdGVyUGF0dGVybiB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9SZWdFeHBGaWx0ZXJcIlxuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tIFwiLi4vcmVkdXgvQWN0aW9uc1wiXG5pbXBvcnQgKiBhcyBTZWxlY3RvcnMgZnJvbSBcIi4uL3JlZHV4L1NlbGVjdG9yc1wiXG5pbXBvcnQgQ29uc29sZVZpZXcgZnJvbSBcIi4vQ29uc29sZVZpZXdcIlxuaW1wb3J0IHsgTGlzdCB9IGZyb20gXCJpbW11dGFibGVcIlxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCJcbmltcG9ydCB7IE9ic2VydmFibGUsIFJlcGxheVN1YmplY3QgfSBmcm9tIFwicnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzXCJcblxudHlwZSBPcHRpb25zID0ge1xuICBzdG9yZTogU3RvcmUsXG4gIGluaXRpYWxGaWx0ZXJUZXh0Pzogc3RyaW5nLFxuICBpbml0aWFsRW5hYmxlUmVnRXhwRmlsdGVyPzogYm9vbGVhbixcbiAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM/OiBBcnJheTxzdHJpbmc+LFxuICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM/OiBTZXQ8U2V2ZXJpdHk+LFxufVxuXG4vL1xuLy8gU3RhdGUgdW5pcXVlIHRvIHRoaXMgcGFydGljdWxhciBDb25zb2xlIGluc3RhbmNlXG4vL1xudHlwZSBTdGF0ZSA9IHtcbiAgZmlsdGVyVGV4dDogc3RyaW5nLFxuICBlbmFibGVSZWdFeHBGaWx0ZXI6IGJvb2xlYW4sXG4gIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5Pixcbn1cblxudHlwZSBCb3VuZEFjdGlvbkNyZWF0b3JzID0ge1xuICBleGVjdXRlOiAoY29kZTogc3RyaW5nKSA9PiB2b2lkLFxuICBzZWxlY3RFeGVjdXRvcjogKGV4ZWN1dG9ySWQ6IHN0cmluZykgPT4gdm9pZCxcbiAgY2xlYXJSZWNvcmRzOiAoKSA9PiB2b2lkLFxufVxuXG4vLyBPdGhlciBOdWNsaWRlIHBhY2thZ2VzICh3aGljaCBjYW5ub3QgaW1wb3J0IHRoaXMpIGRlcGVuZCBvbiB0aGlzIFVSSS4gSWYgdGhpc1xuLy8gbmVlZHMgdG8gYmUgY2hhbmdlZCwgZ3JlcCBmb3IgQ09OU09MRV9WSUVXX1VSSSBhbmQgZW5zdXJlIHRoYXQgdGhlIFVSSXMgbWF0Y2guXG5leHBvcnQgY29uc3QgV09SS1NQQUNFX1ZJRVdfVVJJID0gXCJhdG9tOi8vbnVjbGlkZS9jb25zb2xlXCJcblxuY29uc3QgRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UgPSBcIi8vIE51Y2xpZGUgY291bGRuJ3QgZmluZCB0aGUgcmlnaHQgdGV4dCB0byBkaXNwbGF5XCJcblxuY29uc3QgQUxMX1NFVkVSSVRJRVMgPSBuZXcgU2V0KFtcImVycm9yXCIsIFwid2FybmluZ1wiLCBcImluZm9cIl0pXG5cbi8qKlxuICogQW4gQXRvbSBcInZpZXcgbW9kZWxcIiBmb3IgdGhlIGNvbnNvbGUuIFRoaXMgb2JqZWN0IGlzIHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHN0YXRlZnVsIHZpZXdcbiAqICh2aWEgYGdldEVsZW1lbnQoKWApLiBUaGF0IHZpZXcgaXMgYm91bmQgdG8gYm90aCBnbG9iYWwgc3RhdGUgKGZyb20gdGhlIHN0b3JlKSBhbmQgdmlldy1zcGVjaWZpY1xuICogc3RhdGUgKGZyb20gdGhpcyBpbnN0YW5jZSdzIGBfbW9kZWxgKS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnNvbGUge1xuICBfYWN0aW9uQ3JlYXRvcnM6IEJvdW5kQWN0aW9uQ3JlYXRvcnNcblxuICBfdGl0bGVDaGFuZ2VzOiBPYnNlcnZhYmxlPHN0cmluZz5cbiAgX21vZGVsOiBNb2RlbDxTdGF0ZT5cbiAgX3N0b3JlOiBTdG9yZVxuICBfZWxlbWVudDogP0hUTUxFbGVtZW50XG4gIF9kZXN0cm95ZWQ6IFJlcGxheVN1YmplY3Q8dm9pZD5cblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgY29uc3Qge1xuICAgICAgc3RvcmUsXG4gICAgICBpbml0aWFsRmlsdGVyVGV4dCxcbiAgICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICB9ID0gb3B0aW9uc1xuICAgIHRoaXMuX21vZGVsID0gbmV3IE1vZGVsKHtcbiAgICAgIGRpc3BsYXlhYmxlUmVjb3JkczogW10sXG4gICAgICBmaWx0ZXJUZXh0OiBpbml0aWFsRmlsdGVyVGV4dCA9PSBudWxsID8gXCJcIiA6IGluaXRpYWxGaWx0ZXJUZXh0LFxuICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyOiBCb29sZWFuKGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXIpLFxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkczogaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMgPT0gbnVsbCA/IFtdIDogaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXM6XG4gICAgICAgIGluaXRpYWxVbnNlbGVjdGVkU2V2ZXJpdGllcyA9PSBudWxsXG4gICAgICAgICAgPyBBTExfU0VWRVJJVElFU1xuICAgICAgICAgIDogc2V0RGlmZmVyZW5jZShBTExfU0VWRVJJVElFUywgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzKSxcbiAgICB9KVxuXG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZVxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpXG5cbiAgICB0aGlzLl90aXRsZUNoYW5nZXMgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksIG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZShzdG9yZSkpXG4gICAgICAudGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZClcbiAgICAgIC5tYXAoKCkgPT4gdGhpcy5nZXRUaXRsZSgpKVxuICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgIC5zaGFyZSgpXG4gIH1cblxuICBnZXRJY29uTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIm51Y2xpY29uLWNvbnNvbGVcIlxuICB9XG5cbiAgLy8gR2V0IHRoZSBwYW5lIGl0ZW0ncyB0aXRsZS4gSWYgdGhlcmUncyBvbmx5IG9uZSBzb3VyY2Ugc2VsZWN0ZWQsIHdlJ2xsIHVzZSB0aGF0IHRvIG1ha2UgYSBtb3JlXG4gIC8vIGRlc2NyaXB0aXZlIHRpdGxlLlxuICBnZXRUaXRsZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGVuYWJsZWRQcm92aWRlckNvdW50ID0gdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKS5wcm92aWRlcnMuc2l6ZVxuICAgIGNvbnN0IHsgdW5zZWxlY3RlZFNvdXJjZUlkcyB9ID0gdGhpcy5fbW9kZWwuc3RhdGVcblxuICAgIC8vIENhbGxpbmcgYF9nZXRTb3VyY2VzKClgIGlzIChjdXJyZW50bHkpIGV4cGVuc2l2ZSBiZWNhdXNlIGl0IG5lZWRzIHRvIHNlYXJjaCBhbGwgdGhlIHJlY29yZHNcbiAgICAvLyBmb3Igc291cmNlcyB0aGF0IGhhdmUgYmVlbiBkaXNhYmxlZCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBXZSB0cnkgdG8gYXZvaWQgY2FsbGluZyBpdCBpZiB3ZVxuICAgIC8vIGFscmVhZHkga25vdyB0aGF0IHRoZXJlJ3MgbW9yZSB0aGFuIG9uZSBzZWxlY3RlZCBzb3VyY2UuXG4gICAgaWYgKGVuYWJsZWRQcm92aWRlckNvdW50IC0gdW5zZWxlY3RlZFNvdXJjZUlkcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gXCJDb25zb2xlXCJcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIHNvdXJjZSBzZWxlY3RlZCwgdXNlIGl0cyBuYW1lIGluIHRoZSB0YWIgdGl0bGUuXG4gICAgY29uc3Qgc291cmNlcyA9IHRoaXMuX2dldFNvdXJjZXMoKVxuICAgIGlmIChzb3VyY2VzLmxlbmd0aCAtIHVuc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBzZWxlY3RlZFNvdXJjZSA9IHNvdXJjZXMuZmluZCgoc291cmNlKSA9PiB1bnNlbGVjdGVkU291cmNlSWRzLmluZGV4T2Yoc291cmNlLmlkKSA9PT0gLTEpXG4gICAgICBpZiAoc2VsZWN0ZWRTb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIGBDb25zb2xlOiAke3NlbGVjdGVkU291cmNlLm5hbWV9YFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBcIkNvbnNvbGVcIlxuICB9XG5cbiAgZ2V0RGVmYXVsdExvY2F0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiYm90dG9tXCJcbiAgfVxuXG4gIGdldFVSSSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBXT1JLU1BBQ0VfVklFV19VUklcbiAgfVxuXG4gIG9uRGlkQ2hhbmdlVGl0bGUoY2FsbGJhY2s6ICh0aXRsZTogc3RyaW5nKSA9PiBtaXhlZCk6IElEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUodGhpcy5fdGl0bGVDaGFuZ2VzLnN1YnNjcmliZShjYWxsYmFjaykpXG4gIH1cblxuICBfZ2V0U291cmNlcygpOiBBcnJheTxTb3VyY2U+IHtcbiAgICBjb25zdCB7IHByb3ZpZGVycywgcHJvdmlkZXJTdGF0dXNlcywgcmVjb3JkcywgaW5jb21wbGV0ZVJlY29yZHMgfSA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKClcbiAgICByZXR1cm4gdGhpcy5fZ2V0U291cmNlc01lbW9pemVkKHtcbiAgICAgIHByb3ZpZGVycyxcbiAgICAgIHByb3ZpZGVyU3RhdHVzZXMsXG4gICAgICByZWNvcmRzLFxuICAgICAgaW5jb21wbGV0ZVJlY29yZHMsXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1lbW9pemUgYGdldFNvdXJjZXMoKWAuIFVuZm9ydHVuYXRlbHksIHNpbmNlIHdlIGxvb2sgZm9yIHVucmVwcmVzZW50ZWQgc291cmNlcyBpbiB0aGUgcmVjb3JkXG4gIC8vIGxpc3QsIHRoaXMgc3RpbGwgbmVlZHMgdG8gYmUgY2FsbGVkIHdoZW5ldmVyIHRoZSByZWNvcmRzIGNoYW5nZS5cbiAgLy8gVE9ETzogQ29uc2lkZXIgcmVtb3ZpbmcgcmVjb3JkcyB3aGVuIHRoZWlyIHNvdXJjZSBpcyByZW1vdmVkLiBUaGlzIHdpbGwgbGlrZWx5IHJlcXVpcmUgYWRkaW5nXG4gIC8vIHRoZSBhYmlsaXR5IHRvIGVuYWJsZSBhbmQgZGlzYWJsZSBzb3VyY2VzIHNvLCBmb3IgZXhhbXBsZSwgd2hlbiB0aGUgZGVidWdnZXIgaXMgbm8gbG9uZ2VyXG4gIC8vIGFjdGl2ZSwgaXQgc3RpbGwgcmVtYWlucyBpbiB0aGUgc291cmNlIGxpc3QuXG4gIC8vICRGbG93Rml4TWUgKD49MC44NS4wKSAoVDM1OTg2ODk2KSBGbG93IHVwZ3JhZGUgc3VwcHJlc3NcbiAgX2dldFNvdXJjZXNNZW1vaXplZCA9IG1lbW9pemVVbnRpbENoYW5nZWQoXG4gICAgZ2V0U291cmNlcyxcbiAgICAob3B0cykgPT4gb3B0cyxcbiAgICAoYSwgYikgPT4gc2hhbGxvd0VxdWFsKGEsIGIpXG4gIClcblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KClcbiAgfVxuXG4gIGNvcHkoKTogQ29uc29sZSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlKHtcbiAgICAgIHN0b3JlOiB0aGlzLl9zdG9yZSxcbiAgICAgIGluaXRpYWxGaWx0ZXJUZXh0OiB0aGlzLl9tb2RlbC5zdGF0ZS5maWx0ZXJUZXh0LFxuICAgICAgaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlcjogdGhpcy5fbW9kZWwuc3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTb3VyY2VJZHM6IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM6IHNldERpZmZlcmVuY2UoQUxMX1NFVkVSSVRJRVMsIHRoaXMuX21vZGVsLnN0YXRlLnNlbGVjdGVkU2V2ZXJpdGllcyksXG4gICAgfSlcbiAgfVxuXG4gIF9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKCk6IEJvdW5kQWN0aW9uQ3JlYXRvcnMge1xuICAgIGlmICh0aGlzLl9hY3Rpb25DcmVhdG9ycyA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9hY3Rpb25DcmVhdG9ycyA9IHtcbiAgICAgICAgZXhlY3V0ZTogKGNvZGUpID0+IHtcbiAgICAgICAgICB0aGlzLl9zdG9yZS5kaXNwYXRjaChBY3Rpb25zLmV4ZWN1dGUoY29kZSkpXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdEV4ZWN1dG9yOiAoZXhlY3V0b3JJZCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuc2VsZWN0RXhlY3V0b3IoZXhlY3V0b3JJZCkpXG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyUmVjb3JkczogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuY2xlYXJSZWNvcmRzKCkpXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hY3Rpb25DcmVhdG9yc1xuICB9XG5cbiAgX3Jlc2V0QWxsRmlsdGVycyA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLl9zZWxlY3RTb3VyY2VzKHRoaXMuX2dldFNvdXJjZXMoKS5tYXAoKHMpID0+IHMuaWQpKVxuICAgIHRoaXMuX21vZGVsLnNldFN0YXRlKHsgZmlsdGVyVGV4dDogXCJcIiB9KVxuICB9XG5cbiAgX2NyZWF0ZVBhc3RlID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IGRpc3BsYXlhYmxlUmVjb3JkcyA9IFNlbGVjdG9ycy5nZXRBbGxSZWNvcmRzKHRoaXMuX3N0b3JlLmdldFN0YXRlKCkpLnRvQXJyYXkoKVxuICAgIGNvbnN0IGNyZWF0ZVBhc3RlSW1wbCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkuY3JlYXRlUGFzdGVGdW5jdGlvblxuICAgIGlmIChjcmVhdGVQYXN0ZUltcGwgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVQYXN0ZShjcmVhdGVQYXN0ZUltcGwsIGRpc3BsYXlhYmxlUmVjb3JkcylcbiAgfVxuXG4gIF9nZXRGaWx0ZXJJbmZvKCk6IHtcbiAgICBpbnZhbGlkOiBib29sZWFuLFxuICAgIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxuICAgIGZpbHRlcmVkUmVjb3JkczogQXJyYXk8UmVjb3JkPixcbiAgICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXG4gIH0ge1xuICAgIGNvbnN0IHsgcGF0dGVybiwgaW52YWxpZCB9ID0gZ2V0RmlsdGVyUGF0dGVybih0aGlzLl9tb2RlbC5zdGF0ZS5maWx0ZXJUZXh0LCB0aGlzLl9tb2RlbC5zdGF0ZS5lbmFibGVSZWdFeHBGaWx0ZXIpXG4gICAgY29uc3Qgc291cmNlcyA9IHRoaXMuX2dldFNvdXJjZXMoKVxuICAgIGNvbnN0IHNlbGVjdGVkU291cmNlSWRzID0gc291cmNlc1xuICAgICAgLm1hcCgoc291cmNlKSA9PiBzb3VyY2UuaWQpXG4gICAgICAuZmlsdGVyKChzb3VyY2VJZCkgPT4gdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZUlkKSA9PT0gLTEpXG5cbiAgICBjb25zdCB7IHNlbGVjdGVkU2V2ZXJpdGllcyB9ID0gdGhpcy5fbW9kZWwuc3RhdGVcbiAgICBjb25zdCBmaWx0ZXJlZFJlY29yZHMgPSBmaWx0ZXJSZWNvcmRzKFxuICAgICAgU2VsZWN0b3JzLmdldEFsbFJlY29yZHModGhpcy5fc3RvcmUuZ2V0U3RhdGUoKSkudG9BcnJheSgpLFxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgICBwYXR0ZXJuLFxuICAgICAgc291cmNlcy5sZW5ndGggIT09IHNlbGVjdGVkU291cmNlSWRzLmxlbmd0aFxuICAgIClcblxuICAgIHJldHVybiB7XG4gICAgICBpbnZhbGlkLFxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXMsXG4gICAgICBmaWx0ZXJlZFJlY29yZHMsXG4gICAgfVxuICB9XG5cbiAgZ2V0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgaWYgKHRoaXMuX2VsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb25DcmVhdG9ycyA9IHRoaXMuX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMoKVxuICAgIGNvbnN0IGdsb2JhbFN0YXRlczogT2JzZXJ2YWJsZTxBcHBTdGF0ZT4gPSBvYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUodGhpcy5fc3RvcmUpXG5cbiAgICBjb25zdCBwcm9wcyA9IE9ic2VydmFibGUuY29tYmluZUxhdGVzdCh0aGlzLl9tb2RlbC50b09ic2VydmFibGUoKSwgZ2xvYmFsU3RhdGVzKVxuICAgICAgLy8gRG9uJ3QgcmUtcmVuZGVyIHdoZW4gdGhlIGNvbnNvbGUgaXNuJ3QgdmlzaWJsZS5cbiAgICAgIC5sZXQodG9nZ2xlKG9ic2VydmVQYW5lSXRlbVZpc2liaWxpdHkodGhpcykpKVxuICAgICAgLmF1ZGl0KCgpID0+IG5leHRBbmltYXRpb25GcmFtZSlcbiAgICAgIC5tYXAoKFtsb2NhbFN0YXRlLCBnbG9iYWxTdGF0ZV0pID0+IHtcbiAgICAgICAgY29uc3QgeyBpbnZhbGlkLCBzZWxlY3RlZFNvdXJjZUlkcywgc2VsZWN0ZWRTZXZlcml0aWVzLCBmaWx0ZXJlZFJlY29yZHMgfSA9IHRoaXMuX2dldEZpbHRlckluZm8oKVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvcklkID0gU2VsZWN0b3JzLmdldEN1cnJlbnRFeGVjdXRvcklkKGdsb2JhbFN0YXRlKVxuICAgICAgICBjb25zdCBjdXJyZW50RXhlY3V0b3IgPSBjdXJyZW50RXhlY3V0b3JJZCAhPSBudWxsID8gZ2xvYmFsU3RhdGUuZXhlY3V0b3JzLmdldChjdXJyZW50RXhlY3V0b3JJZCkgOiBudWxsXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbnZhbGlkRmlsdGVySW5wdXQ6IGludmFsaWQsXG4gICAgICAgICAgZXhlY3V0ZTogYWN0aW9uQ3JlYXRvcnMuZXhlY3V0ZSxcbiAgICAgICAgICBzZWxlY3RFeGVjdXRvcjogYWN0aW9uQ3JlYXRvcnMuc2VsZWN0RXhlY3V0b3IsXG4gICAgICAgICAgY2xlYXJSZWNvcmRzOiBhY3Rpb25DcmVhdG9ycy5jbGVhclJlY29yZHMsXG4gICAgICAgICAgY3JlYXRlUGFzdGU6IGdsb2JhbFN0YXRlLmNyZWF0ZVBhc3RlRnVuY3Rpb24gPT0gbnVsbCA/IG51bGwgOiB0aGlzLl9jcmVhdGVQYXN0ZSxcbiAgICAgICAgICB3YXRjaEVkaXRvcjogZ2xvYmFsU3RhdGUud2F0Y2hFZGl0b3IsXG4gICAgICAgICAgY3VycmVudEV4ZWN1dG9yLFxuICAgICAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IGxvY2FsU3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcbiAgICAgICAgICBmaWx0ZXJUZXh0OiBsb2NhbFN0YXRlLmZpbHRlclRleHQsXG4gICAgICAgICAgZW5hYmxlUmVnRXhwRmlsdGVyOiBsb2NhbFN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgICAgICByZWNvcmRzOiBmaWx0ZXJlZFJlY29yZHMsXG4gICAgICAgICAgZmlsdGVyZWRSZWNvcmRDb3VudDogU2VsZWN0b3JzLmdldEFsbFJlY29yZHMoZ2xvYmFsU3RhdGUpLnNpemUgLSBmaWx0ZXJlZFJlY29yZHMubGVuZ3RoLFxuICAgICAgICAgIGhpc3Rvcnk6IGdsb2JhbFN0YXRlLmhpc3RvcnksXG4gICAgICAgICAgc291cmNlczogdGhpcy5fZ2V0U291cmNlcygpLFxuICAgICAgICAgIHNlbGVjdGVkU291cmNlSWRzLFxuICAgICAgICAgIHNlbGVjdFNvdXJjZXM6IHRoaXMuX3NlbGVjdFNvdXJjZXMsXG4gICAgICAgICAgZXhlY3V0b3JzOiBnbG9iYWxTdGF0ZS5leGVjdXRvcnMsXG4gICAgICAgICAgZ2V0UHJvdmlkZXI6IChpZCkgPT4gZ2xvYmFsU3RhdGUucHJvdmlkZXJzLmdldChpZCksXG4gICAgICAgICAgdXBkYXRlRmlsdGVyOiB0aGlzLl91cGRhdGVGaWx0ZXIsXG4gICAgICAgICAgcmVzZXRBbGxGaWx0ZXJzOiB0aGlzLl9yZXNldEFsbEZpbHRlcnMsXG4gICAgICAgICAgZm9udFNpemU6IGdsb2JhbFN0YXRlLmZvbnRTaXplLFxuICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcbiAgICAgICAgICB0b2dnbGVTZXZlcml0eTogdGhpcy5fdG9nZ2xlU2V2ZXJpdHksXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICBjb25zdCBTdGF0ZWZ1bENvbnNvbGVWaWV3ID0gYmluZE9ic2VydmFibGVBc1Byb3BzKHByb3BzLCBDb25zb2xlVmlldylcbiAgICByZXR1cm4gKHRoaXMuX2VsZW1lbnQgPSByZW5kZXJSZWFjdFJvb3QoPFN0YXRlZnVsQ29uc29sZVZpZXcgLz4pKVxuICB9XG5cbiAgc2VyaWFsaXplKCk6IENvbnNvbGVQZXJzaXN0ZWRTdGF0ZSB7XG4gICAgY29uc3QgeyBmaWx0ZXJUZXh0LCBlbmFibGVSZWdFeHBGaWx0ZXIsIHVuc2VsZWN0ZWRTb3VyY2VJZHMsIHNlbGVjdGVkU2V2ZXJpdGllcyB9ID0gdGhpcy5fbW9kZWwuc3RhdGVcbiAgICByZXR1cm4ge1xuICAgICAgZGVzZXJpYWxpemVyOiBcIm51Y2xpZGUuQ29uc29sZVwiLFxuICAgICAgZmlsdGVyVGV4dCxcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHMsXG4gICAgICB1bnNlbGVjdGVkU2V2ZXJpdGllczogWy4uLnNldERpZmZlcmVuY2UoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcyldLFxuICAgIH1cbiAgfVxuXG4gIF9zZWxlY3RTb3VyY2VzID0gKHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgY29uc3Qgc291cmNlSWRzID0gdGhpcy5fZ2V0U291cmNlcygpLm1hcCgoc291cmNlKSA9PiBzb3VyY2UuaWQpXG4gICAgY29uc3QgdW5zZWxlY3RlZFNvdXJjZUlkcyA9IHNvdXJjZUlkcy5maWx0ZXIoKHNvdXJjZUlkKSA9PiBzZWxlY3RlZFNvdXJjZUlkcy5pbmRleE9mKHNvdXJjZUlkKSA9PT0gLTEpXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoeyB1bnNlbGVjdGVkU291cmNlSWRzIH0pXG4gIH1cblxuICAvKiogVW5zZWxlY3RzIHRoZSBzb3VyY2VzIGZyb20gdGhlIGdpdmVuIElEcyAqL1xuICB1bnNlbGVjdFNvdXJjZXMoaWRzOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgY29uc3QgbmV3SWRzID0gaWRzLmZpbHRlcigoaWQpID0+ICF0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLmluY2x1ZGVzKGlkKSlcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7XG4gICAgICB1bnNlbGVjdGVkU291cmNlSWRzOiB0aGlzLl9tb2RlbC5zdGF0ZS51bnNlbGVjdGVkU291cmNlSWRzLmNvbmNhdChuZXdJZHMpLFxuICAgIH0pXG4gIH1cblxuICBfdXBkYXRlRmlsdGVyID0gKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKTogdm9pZCA9PiB7XG4gICAgY29uc3QgeyB0ZXh0LCBpc1JlZ0V4cCB9ID0gY2hhbmdlXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoe1xuICAgICAgZmlsdGVyVGV4dDogdGV4dCxcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcjogaXNSZWdFeHAsXG4gICAgfSlcbiAgfVxuXG4gIF90b2dnbGVTZXZlcml0eSA9IChzZXZlcml0eTogU2V2ZXJpdHkpOiB2b2lkID0+IHtcbiAgICBjb25zdCB7IHNlbGVjdGVkU2V2ZXJpdGllcyB9ID0gdGhpcy5fbW9kZWwuc3RhdGVcbiAgICBjb25zdCBuZXh0U2VsZWN0ZWRTZXZlcml0aWVzID0gbmV3IFNldChzZWxlY3RlZFNldmVyaXRpZXMpXG4gICAgaWYgKG5leHRTZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KSkge1xuICAgICAgbmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5kZWxldGUoc2V2ZXJpdHkpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRTZWxlY3RlZFNldmVyaXRpZXMuYWRkKHNldmVyaXR5KVxuICAgIH1cbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7IHNlbGVjdGVkU2V2ZXJpdGllczogbmV4dFNlbGVjdGVkU2V2ZXJpdGllcyB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZXMob3B0aW9uczoge1xuICByZWNvcmRzOiBMaXN0PFJlY29yZD4sXG4gIHByb3ZpZGVyczogTWFwPHN0cmluZywgU291cmNlSW5mbz4sXG4gIHByb3ZpZGVyU3RhdHVzZXM6IE1hcDxzdHJpbmcsIENvbnNvbGVTb3VyY2VTdGF0dXM+LFxufSk6IEFycmF5PFNvdXJjZT4ge1xuICBjb25zdCB7IHByb3ZpZGVycywgcHJvdmlkZXJTdGF0dXNlcywgcmVjb3JkcyB9ID0gb3B0aW9uc1xuXG4gIC8vIENvbnZlcnQgdGhlIHByb3ZpZGVycyB0byBhIG1hcCBvZiBzb3VyY2VzLlxuICBjb25zdCBtYXBPZlNvdXJjZXMgPSBuZXcgTWFwKFxuICAgIEFycmF5LmZyb20ocHJvdmlkZXJzLmVudHJpZXMoKSkubWFwKChbaywgcHJvdmlkZXJdKSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2UgPSB7XG4gICAgICAgIGlkOiBwcm92aWRlci5pZCxcbiAgICAgICAgbmFtZTogcHJvdmlkZXIubmFtZSxcbiAgICAgICAgc3RhdHVzOiBwcm92aWRlclN0YXR1c2VzLmdldChwcm92aWRlci5pZCkgfHwgXCJzdG9wcGVkXCIsXG4gICAgICAgIHN0YXJ0OiB0eXBlb2YgcHJvdmlkZXIuc3RhcnQgPT09IFwiZnVuY3Rpb25cIiA/IHByb3ZpZGVyLnN0YXJ0IDogdW5kZWZpbmVkLFxuICAgICAgICBzdG9wOiB0eXBlb2YgcHJvdmlkZXIuc3RvcCA9PT0gXCJmdW5jdGlvblwiID8gcHJvdmlkZXIuc3RvcCA6IHVuZGVmaW5lZCxcbiAgICAgIH1cbiAgICAgIHJldHVybiBbaywgc291cmNlXVxuICAgIH0pXG4gIClcblxuICAvLyBTb21lIHByb3ZpZGVycyBtYXkgaGF2ZSBiZWVuIHVucmVnaXN0ZXJlZCwgYnV0IHN0aWxsIGhhdmUgcmVjb3Jkcy4gQWRkIHNvdXJjZXMgZm9yIHRoZW0gdG9vLlxuICAvLyBUT0RPOiBJdGVyYXRpbmcgb3ZlciBhbGwgdGhlIHJlY29yZHMgdG8gZ2V0IHRoaXMgZXZlcnkgdGltZSB3ZSBnZXQgYSBuZXcgcmVjb3JkIGlzIGluZWZmaWNpZW50LlxuICByZWNvcmRzLmZvckVhY2goKHJlY29yZCwgaSkgPT4ge1xuICAgIGlmICghbWFwT2ZTb3VyY2VzLmhhcyhyZWNvcmQuc291cmNlSWQpKSB7XG4gICAgICBtYXBPZlNvdXJjZXMuc2V0KHJlY29yZC5zb3VyY2VJZCwge1xuICAgICAgICBpZDogcmVjb3JkLnNvdXJjZUlkLFxuICAgICAgICBuYW1lOiByZWNvcmQuc291cmNlSWQsXG4gICAgICAgIHN0YXR1czogXCJzdG9wcGVkXCIsXG4gICAgICAgIHN0YXJ0OiB1bmRlZmluZWQsXG4gICAgICAgIHN0b3A6IHVuZGVmaW5lZCxcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBBcnJheS5mcm9tKG1hcE9mU291cmNlcy52YWx1ZXMoKSlcbn1cblxuZnVuY3Rpb24gZmlsdGVyUmVjb3JkcyhcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcbiAgc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcbiAgZmlsdGVyUGF0dGVybjogP1JlZ0V4cCxcbiAgZmlsdGVyU291cmNlczogYm9vbGVhblxuKTogQXJyYXk8UmVjb3JkPiB7XG4gIGlmICghZmlsdGVyU291cmNlcyAmJiBmaWx0ZXJQYXR0ZXJuID09IG51bGwgJiYgYXJlU2V0c0VxdWFsKEFMTF9TRVZFUklUSUVTLCBzZWxlY3RlZFNldmVyaXRpZXMpKSB7XG4gICAgcmV0dXJuIHJlY29yZHNcbiAgfVxuXG4gIHJldHVybiByZWNvcmRzLmZpbHRlcigocmVjb3JkKSA9PiB7XG4gICAgLy8gT25seSBmaWx0ZXIgcmVndWxhciBtZXNzYWdlc1xuICAgIGlmIChyZWNvcmQua2luZCAhPT0gXCJtZXNzYWdlXCIpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgaWYgKCFzZWxlY3RlZFNldmVyaXRpZXMuaGFzKGxldmVsVG9TZXZlcml0eShyZWNvcmQubGV2ZWwpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlTWF0Y2hlcyA9IHNlbGVjdGVkU291cmNlSWRzLmluZGV4T2YocmVjb3JkLnNvdXJjZUlkKSAhPT0gLTFcbiAgICByZXR1cm4gc291cmNlTWF0Y2hlcyAmJiAoZmlsdGVyUGF0dGVybiA9PSBudWxsIHx8IGZpbHRlclBhdHRlcm4udGVzdChyZWNvcmQudGV4dCkpXG4gIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlcmlhbGl6ZVJlY29yZE9iamVjdChcbiAgdmlzaXRlZDogU2V0PHN0cmluZz4sXG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxuICB0ZXh0OiBzdHJpbmcsXG4gIGxldmVsOiBudW1iZXJcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGdldFRleHQgPSAoZXhwKSA9PiB7XG4gICAgbGV0IGluZGVudCA9IFwiXCJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxldmVsOyBpKyspIHtcbiAgICAgIGluZGVudCArPSBcIlxcdFwiXG4gICAgfVxuICAgIHJldHVybiBpbmRlbnQgKyBleHAuZ2V0VmFsdWUoKVxuICB9XG5cbiAgaWYgKCFleHByZXNzaW9uLmhhc0NoaWxkcmVuKCkpIHtcbiAgICAvLyBMZWFmIG5vZGUuXG4gICAgcmV0dXJuIHRleHQgKyBnZXRUZXh0KGV4cHJlc3Npb24pXG4gIH1cblxuICBjb25zdCBpZCA9IGV4cHJlc3Npb24uZ2V0SWQoKVxuICBpZiAodmlzaXRlZC5oYXMoaWQpKSB7XG4gICAgLy8gR3VhcmQgYWdhaW5zdCBjeWNsZXMuXG4gICAgcmV0dXJuIHRleHRcbiAgfVxuXG4gIHZpc2l0ZWQuYWRkKGlkKVxuXG4gIGNvbnN0IGNoaWxkcmVuID0gYXdhaXQgZXhwcmVzc2lvbi5nZXRDaGlsZHJlbigpXG4gIGNvbnN0IHNlcmlhbGl6ZWRQcm9wcyA9IGNoaWxkcmVuLm1hcCgoY2hpbGRQcm9wKSA9PiB7XG4gICAgcmV0dXJuIHNlcmlhbGl6ZVJlY29yZE9iamVjdCh2aXNpdGVkLCBjaGlsZFByb3AsIFwiXCIsIGxldmVsICsgMSlcbiAgfSlcbiAgcmV0dXJuIGdldFRleHQoZXhwcmVzc2lvbikgKyBcIlxcblwiICsgKGF3YWl0IFByb21pc2UuYWxsKHNlcmlhbGl6ZWRQcm9wcykpLmpvaW4oXCJcXG5cIilcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlUGFzdGUoY3JlYXRlUGFzdGVJbXBsOiBDcmVhdGVQYXN0ZUZ1bmN0aW9uLCByZWNvcmRzOiBBcnJheTxSZWNvcmQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGxpbmVQcm9taXNlcyA9IHJlY29yZHNcbiAgICAuZmlsdGVyKChyZWNvcmQpID0+IHJlY29yZC5raW5kID09PSBcIm1lc3NhZ2VcIiB8fCByZWNvcmQua2luZCA9PT0gXCJyZXF1ZXN0XCIgfHwgcmVjb3JkLmtpbmQgPT09IFwicmVzcG9uc2VcIilcbiAgICAubWFwKGFzeW5jIChyZWNvcmQpID0+IHtcbiAgICAgIGNvbnN0IGxldmVsID0gcmVjb3JkLmxldmVsICE9IG51bGwgPyByZWNvcmQubGV2ZWwudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpIDogXCJMT0dcIlxuICAgICAgY29uc3QgdGltZXN0YW1wID0gcmVjb3JkLnRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygpXG4gICAgICBsZXQgdGV4dCA9IHJlY29yZC50ZXh0IHx8IEVSUk9SX1RSQU5TQ1JJQklOR19NRVNTQUdFXG5cbiAgICAgIGlmIChyZWNvcmQua2luZCA9PT0gXCJyZXNwb25zZVwiICYmIHJlY29yZC5leHByZXNzaW9ucyAhPSBudWxsICYmIHJlY29yZC5leHByZXNzaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRleHQgPSBcIlwiXG4gICAgICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiByZWNvcmQuZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgcmVjb3JkIGhhcyBhIGRhdGEgb2JqZWN0LCBhbmQgdGhlIG9iamVjdCBoYXMgYW4gSUQsXG4gICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXhwYW5kIHRoZSBub2RlcyBvZiB0aGUgb2JqZWN0IGFuZCBzZXJpYWxpemUgaXRcbiAgICAgICAgICAvLyBmb3IgdGhlIHBhc3RlLlxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1hd2FpdC1pbi1sb29wXG4gICAgICAgICAgdGV4dCArPSBhd2FpdCBzZXJpYWxpemVSZWNvcmRPYmplY3QobmV3IFNldCgpLCBleHByZXNzaW9uLCBcIlwiLCAwKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgWyR7bGV2ZWx9XVske3JlY29yZC5zb3VyY2VJZH1dWyR7dGltZXN0YW1wfV1cXHQgJHt0ZXh0fWBcbiAgICB9KVxuXG4gIGNvbnN0IGxpbmVzID0gKGF3YWl0IFByb21pc2UuYWxsKGxpbmVQcm9taXNlcykpLmpvaW4oXCJcXG5cIilcblxuICBpZiAobGluZXMgPT09IFwiXCIpIHtcbiAgICAvLyBDYW4ndCBjcmVhdGUgYW4gZW1wdHkgcGFzdGUhXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICBcIlRoZXJlIGlzIG5vdGhpbmcgaW4geW91ciBjb25zb2xlIHRvIFBhc3RlISBDaGVjayB5b3VyIGNvbnNvbGUgZmlsdGVycyBhbmQgdHJ5IGFnYWluLlwiXG4gICAgKVxuICAgIHJldHVyblxuICB9XG5cbiAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJDcmVhdGluZyBQYXN0ZS4uLlwiKVxuXG4gIHRyeSB7XG4gICAgY29uc3QgdXJpID0gYXdhaXQgY3JlYXRlUGFzdGVJbXBsKFxuICAgICAgbGluZXMsXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiBcIk51Y2xpZGUgQ29uc29sZSBQYXN0ZVwiLFxuICAgICAgfSxcbiAgICAgIFwiY29uc29sZSBwYXN0ZVwiXG4gICAgKVxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKGBDcmVhdGVkIFBhc3RlIGF0ICR7dXJpfWApXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGVycm9yLnN0ZG91dCA9PSBudWxsKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgcGFzdGU6ICR7U3RyaW5nKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpfWApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlcyA9IGVycm9yLnN0ZG91dFxuICAgICAgLnRyaW0oKVxuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKEpTT04ucGFyc2UpXG4gICAgICAubWFwKChlKSA9PiBlLm1lc3NhZ2UpXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFwiRmFpbGVkIHRvIGNyZWF0ZSBwYXN0ZVwiLCB7XG4gICAgICBkZXRhaWw6IGVycm9yTWVzc2FnZXMuam9pbihcIlxcblwiKSxcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gbGV2ZWxUb1NldmVyaXR5KGxldmVsOiBMZXZlbCk6IFNldmVyaXR5IHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgXCJlcnJvclwiOlxuICAgICAgcmV0dXJuIFwiZXJyb3JcIlxuICAgIGNhc2UgXCJ3YXJuaW5nXCI6XG4gICAgICByZXR1cm4gXCJ3YXJuaW5nXCJcbiAgICBjYXNlIFwibG9nXCI6XG4gICAgY2FzZSBcImluZm9cIjpcbiAgICBjYXNlIFwiZGVidWdcIjpcbiAgICBjYXNlIFwic3VjY2Vzc1wiOlxuICAgICAgcmV0dXJuIFwiaW5mb1wiXG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIEFsbCB0aGUgY29sb3JzIGFyZSBcImluZm9cIlxuICAgICAgcmV0dXJuIFwiaW5mb1wiXG4gIH1cbn1cbiJdfQ==