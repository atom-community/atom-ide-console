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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGUuanMiXSwibmFtZXMiOlsiV09SS1NQQUNFX1ZJRVdfVVJJIiwiRVJST1JfVFJBTlNDUklCSU5HX01FU1NBR0UiLCJBTExfU0VWRVJJVElFUyIsIlNldCIsIkNvbnNvbGUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJfYWN0aW9uQ3JlYXRvcnMiLCJfdGl0bGVDaGFuZ2VzIiwiX21vZGVsIiwiX3N0b3JlIiwiX2VsZW1lbnQiLCJfZGVzdHJveWVkIiwiX2dldFNvdXJjZXNNZW1vaXplZCIsImdldFNvdXJjZXMiLCJvcHRzIiwiYSIsImIiLCJfcmVzZXRBbGxGaWx0ZXJzIiwiX3NlbGVjdFNvdXJjZXMiLCJfZ2V0U291cmNlcyIsIm1hcCIsInMiLCJpZCIsInNldFN0YXRlIiwiZmlsdGVyVGV4dCIsIl9jcmVhdGVQYXN0ZSIsImRpc3BsYXlhYmxlUmVjb3JkcyIsIlNlbGVjdG9ycyIsImdldEFsbFJlY29yZHMiLCJnZXRTdGF0ZSIsInRvQXJyYXkiLCJjcmVhdGVQYXN0ZUltcGwiLCJjcmVhdGVQYXN0ZUZ1bmN0aW9uIiwiY3JlYXRlUGFzdGUiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZUlkcyIsInNvdXJjZSIsInVuc2VsZWN0ZWRTb3VyY2VJZHMiLCJmaWx0ZXIiLCJzb3VyY2VJZCIsImluZGV4T2YiLCJfdXBkYXRlRmlsdGVyIiwiY2hhbmdlIiwidGV4dCIsImlzUmVnRXhwIiwiZW5hYmxlUmVnRXhwRmlsdGVyIiwiX3RvZ2dsZVNldmVyaXR5Iiwic2V2ZXJpdHkiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJzdGF0ZSIsIm5leHRTZWxlY3RlZFNldmVyaXRpZXMiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJzdG9yZSIsImluaXRpYWxGaWx0ZXJUZXh0IiwiaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciIsImluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzIiwiaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzIiwiTW9kZWwiLCJCb29sZWFuIiwiUmVwbGF5U3ViamVjdCIsIk9ic2VydmFibGUiLCJjb21iaW5lTGF0ZXN0IiwidG9PYnNlcnZhYmxlIiwidGFrZVVudGlsIiwiZ2V0VGl0bGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsInNoYXJlIiwiZ2V0SWNvbk5hbWUiLCJlbmFibGVkUHJvdmlkZXJDb3VudCIsInByb3ZpZGVycyIsInNpemUiLCJsZW5ndGgiLCJzb3VyY2VzIiwic2VsZWN0ZWRTb3VyY2UiLCJmaW5kIiwibmFtZSIsImdldERlZmF1bHRMb2NhdGlvbiIsImdldFVSSSIsIm9uRGlkQ2hhbmdlVGl0bGUiLCJjYWxsYmFjayIsIlVuaXZlcnNhbERpc3Bvc2FibGUiLCJzdWJzY3JpYmUiLCJwcm92aWRlclN0YXR1c2VzIiwicmVjb3JkcyIsImluY29tcGxldGVSZWNvcmRzIiwiZGVzdHJveSIsIm5leHQiLCJjb3B5IiwiX2dldEJvdW5kQWN0aW9uQ3JlYXRvcnMiLCJleGVjdXRlIiwiY29kZSIsImRpc3BhdGNoIiwiQWN0aW9ucyIsInNlbGVjdEV4ZWN1dG9yIiwiZXhlY3V0b3JJZCIsImNsZWFyUmVjb3JkcyIsIl9nZXRGaWx0ZXJJbmZvIiwicGF0dGVybiIsImludmFsaWQiLCJmaWx0ZXJlZFJlY29yZHMiLCJmaWx0ZXJSZWNvcmRzIiwiZ2V0RWxlbWVudCIsImFjdGlvbkNyZWF0b3JzIiwiZ2xvYmFsU3RhdGVzIiwicHJvcHMiLCJsZXQiLCJhdWRpdCIsIm5leHRBbmltYXRpb25GcmFtZSIsImxvY2FsU3RhdGUiLCJnbG9iYWxTdGF0ZSIsImN1cnJlbnRFeGVjdXRvcklkIiwiZ2V0Q3VycmVudEV4ZWN1dG9ySWQiLCJjdXJyZW50RXhlY3V0b3IiLCJleGVjdXRvcnMiLCJnZXQiLCJpbnZhbGlkRmlsdGVySW5wdXQiLCJ3YXRjaEVkaXRvciIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJoaXN0b3J5Iiwic2VsZWN0U291cmNlcyIsImdldFByb3ZpZGVyIiwidXBkYXRlRmlsdGVyIiwicmVzZXRBbGxGaWx0ZXJzIiwiZm9udFNpemUiLCJ0b2dnbGVTZXZlcml0eSIsIlN0YXRlZnVsQ29uc29sZVZpZXciLCJDb25zb2xlVmlldyIsInNlcmlhbGl6ZSIsImRlc2VyaWFsaXplciIsInVuc2VsZWN0ZWRTZXZlcml0aWVzIiwidW5zZWxlY3RTb3VyY2VzIiwiaWRzIiwibmV3SWRzIiwiaW5jbHVkZXMiLCJjb25jYXQiLCJtYXBPZlNvdXJjZXMiLCJNYXAiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwiayIsInByb3ZpZGVyIiwic3RhdHVzIiwic3RhcnQiLCJ1bmRlZmluZWQiLCJzdG9wIiwiZm9yRWFjaCIsInJlY29yZCIsImkiLCJzZXQiLCJ2YWx1ZXMiLCJmaWx0ZXJQYXR0ZXJuIiwiZmlsdGVyU291cmNlcyIsImtpbmQiLCJsZXZlbFRvU2V2ZXJpdHkiLCJsZXZlbCIsInNvdXJjZU1hdGNoZXMiLCJ0ZXN0Iiwic2VyaWFsaXplUmVjb3JkT2JqZWN0IiwidmlzaXRlZCIsImV4cHJlc3Npb24iLCJnZXRUZXh0IiwiZXhwIiwiaW5kZW50IiwiZ2V0VmFsdWUiLCJoYXNDaGlsZHJlbiIsImdldElkIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsInNlcmlhbGl6ZWRQcm9wcyIsImNoaWxkUHJvcCIsIlByb21pc2UiLCJhbGwiLCJqb2luIiwibGluZVByb21pc2VzIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInRpbWVzdGFtcCIsInRvTG9jYWxlU3RyaW5nIiwiZXhwcmVzc2lvbnMiLCJsaW5lcyIsImF0b20iLCJub3RpZmljYXRpb25zIiwiYWRkV2FybmluZyIsImFkZEluZm8iLCJ1cmkiLCJ0aXRsZSIsImFkZFN1Y2Nlc3MiLCJlcnJvciIsInN0ZG91dCIsImFkZEVycm9yIiwiU3RyaW5nIiwibWVzc2FnZSIsImVycm9yTWVzc2FnZXMiLCJ0cmltIiwic3BsaXQiLCJKU09OIiwicGFyc2UiLCJlIiwiZGV0YWlsIiwiZGlzbWlzc2FibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7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Q3BEUyxNQUFBQSxNQUFNLEVBQUVOLGFBQWEsQ0FBQ3BCLElBQWQsQ0FBbUIsSUFBbkIsQ0FENEM7QUFFcEQyQixNQUFBQSxXQUFXLEVBQUU7QUFGdUMsS0FBdEQ7QUFJRDtBQUNGOztBQUVELFNBQVM5QyxlQUFULENBQXlCQyxLQUF6QixFQUFpRDtBQUMvQyxVQUFRQSxLQUFSO0FBQ0UsU0FBSyxPQUFMO0FBQ0UsYUFBTyxPQUFQOztBQUNGLFNBQUssU0FBTDtBQUNFLGFBQU8sU0FBUDs7QUFDRixTQUFLLEtBQUw7QUFDQSxTQUFLLE1BQUw7QUFDQSxTQUFLLE9BQUw7QUFDQSxTQUFLLFNBQUw7QUFDRSxhQUFPLE1BQVA7O0FBQ0Y7QUFDRTtBQUNBLGFBQU8sTUFBUDtBQVpKO0FBY0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cclxuXHJcbmltcG9ydCB0eXBlIHsgSUV4cHJlc3Npb24gfSBmcm9tIFwiLi4vLi4vLi4vLi5cIlxyXG5pbXBvcnQgdHlwZSB7XHJcbiAgQ29uc29sZVBlcnNpc3RlZFN0YXRlLFxyXG4gIENvbnNvbGVTb3VyY2VTdGF0dXMsXHJcbiAgUmVjb3JkLFxyXG4gIFNvdXJjZSxcclxuICBTdG9yZSxcclxuICBTb3VyY2VJbmZvLFxyXG4gIFNldmVyaXR5LFxyXG4gIExldmVsLFxyXG4gIEFwcFN0YXRlLFxyXG59IGZyb20gXCIuLi90eXBlc1wiXHJcbmltcG9ydCB0eXBlIHsgQ3JlYXRlUGFzdGVGdW5jdGlvbiB9IGZyb20gXCIuLi90eXBlc1wiXHJcbmltcG9ydCB0eXBlIHsgUmVnRXhwRmlsdGVyQ2hhbmdlIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlclwiXHJcblxyXG5pbXBvcnQgb2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtYXRvbS9vYnNlcnZlUGFuZUl0ZW1WaXNpYmlsaXR5XCJcclxuaW1wb3J0IHsgc2V0RGlmZmVyZW5jZSwgYXJlU2V0c0VxdWFsIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2NvbGxlY3Rpb25cIlxyXG5pbXBvcnQgTW9kZWwgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL01vZGVsXCJcclxuaW1wb3J0IHNoYWxsb3dFcXVhbCBmcm9tIFwic2hhbGxvd2VxdWFsXCJcclxuaW1wb3J0IHsgYmluZE9ic2VydmFibGVBc1Byb3BzIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2JpbmRPYnNlcnZhYmxlQXNQcm9wc1wiXHJcbmltcG9ydCB7IHJlbmRlclJlYWN0Um9vdCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9yZW5kZXJSZWFjdFJvb3RcIlxyXG5pbXBvcnQgbWVtb2l6ZVVudGlsQ2hhbmdlZCBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvbWVtb2l6ZVVudGlsQ2hhbmdlZFwiXHJcbmltcG9ydCB7IHRvZ2dsZSB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9vYnNlcnZhYmxlXCJcclxuaW1wb3J0IFVuaXZlcnNhbERpc3Bvc2FibGUgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGVcIlxyXG5pbXBvcnQgeyBuZXh0QW5pbWF0aW9uRnJhbWUgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvb2JzZXJ2YWJsZVwiXHJcbmltcG9ydCBvYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL29ic2VydmFibGVGcm9tUmVkdXhTdG9yZVwiXHJcbmltcG9ydCB7IGdldEZpbHRlclBhdHRlcm4gfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyXCJcclxuaW1wb3J0ICogYXMgQWN0aW9ucyBmcm9tIFwiLi4vcmVkdXgvQWN0aW9uc1wiXHJcbmltcG9ydCAqIGFzIFNlbGVjdG9ycyBmcm9tIFwiLi4vcmVkdXgvU2VsZWN0b3JzXCJcclxuaW1wb3J0IENvbnNvbGVWaWV3IGZyb20gXCIuL0NvbnNvbGVWaWV3XCJcclxuaW1wb3J0IHsgTGlzdCB9IGZyb20gXCJpbW11dGFibGVcIlxyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIlxyXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0IH0gZnJvbSBcInJ4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qc1wiXHJcblxyXG50eXBlIE9wdGlvbnMgPSB7XHJcbiAgc3RvcmU6IFN0b3JlLFxyXG4gIGluaXRpYWxGaWx0ZXJUZXh0Pzogc3RyaW5nLFxyXG4gIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXI/OiBib29sZWFuLFxyXG4gIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzPzogQXJyYXk8c3RyaW5nPixcclxuICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXM/OiBTZXQ8U2V2ZXJpdHk+LFxyXG59XHJcblxyXG4vL1xyXG4vLyBTdGF0ZSB1bmlxdWUgdG8gdGhpcyBwYXJ0aWN1bGFyIENvbnNvbGUgaW5zdGFuY2VcclxuLy9cclxudHlwZSBTdGF0ZSA9IHtcclxuICBmaWx0ZXJUZXh0OiBzdHJpbmcsXHJcbiAgZW5hYmxlUmVnRXhwRmlsdGVyOiBib29sZWFuLFxyXG4gIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXHJcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxyXG59XHJcblxyXG50eXBlIEJvdW5kQWN0aW9uQ3JlYXRvcnMgPSB7XHJcbiAgZXhlY3V0ZTogKGNvZGU6IHN0cmluZykgPT4gdm9pZCxcclxuICBzZWxlY3RFeGVjdXRvcjogKGV4ZWN1dG9ySWQ6IHN0cmluZykgPT4gdm9pZCxcclxuICBjbGVhclJlY29yZHM6ICgpID0+IHZvaWQsXHJcbn1cclxuXHJcbi8vIE90aGVyIE51Y2xpZGUgcGFja2FnZXMgKHdoaWNoIGNhbm5vdCBpbXBvcnQgdGhpcykgZGVwZW5kIG9uIHRoaXMgVVJJLiBJZiB0aGlzXHJcbi8vIG5lZWRzIHRvIGJlIGNoYW5nZWQsIGdyZXAgZm9yIENPTlNPTEVfVklFV19VUkkgYW5kIGVuc3VyZSB0aGF0IHRoZSBVUklzIG1hdGNoLlxyXG5leHBvcnQgY29uc3QgV09SS1NQQUNFX1ZJRVdfVVJJID0gXCJhdG9tOi8vbnVjbGlkZS9jb25zb2xlXCJcclxuXHJcbmNvbnN0IEVSUk9SX1RSQU5TQ1JJQklOR19NRVNTQUdFID0gXCIvLyBOdWNsaWRlIGNvdWxkbid0IGZpbmQgdGhlIHJpZ2h0IHRleHQgdG8gZGlzcGxheVwiXHJcblxyXG5jb25zdCBBTExfU0VWRVJJVElFUyA9IG5ldyBTZXQoW1wiZXJyb3JcIiwgXCJ3YXJuaW5nXCIsIFwiaW5mb1wiXSlcclxuXHJcbi8qKlxyXG4gKiBBbiBBdG9tIFwidmlldyBtb2RlbFwiIGZvciB0aGUgY29uc29sZS4gVGhpcyBvYmplY3QgaXMgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIGEgc3RhdGVmdWwgdmlld1xyXG4gKiAodmlhIGBnZXRFbGVtZW50KClgKS4gVGhhdCB2aWV3IGlzIGJvdW5kIHRvIGJvdGggZ2xvYmFsIHN0YXRlIChmcm9tIHRoZSBzdG9yZSkgYW5kIHZpZXctc3BlY2lmaWNcclxuICogc3RhdGUgKGZyb20gdGhpcyBpbnN0YW5jZSdzIGBfbW9kZWxgKS5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBDb25zb2xlIHtcclxuICBfYWN0aW9uQ3JlYXRvcnM6IEJvdW5kQWN0aW9uQ3JlYXRvcnNcclxuXHJcbiAgX3RpdGxlQ2hhbmdlczogT2JzZXJ2YWJsZTxzdHJpbmc+XHJcbiAgX21vZGVsOiBNb2RlbDxTdGF0ZT5cclxuICBfc3RvcmU6IFN0b3JlXHJcbiAgX2VsZW1lbnQ6ID9IVE1MRWxlbWVudFxyXG4gIF9kZXN0cm95ZWQ6IFJlcGxheVN1YmplY3Q8dm9pZD5cclxuXHJcbiAgY29uc3RydWN0b3Iob3B0aW9uczogT3B0aW9ucykge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBzdG9yZSxcclxuICAgICAgaW5pdGlhbEZpbHRlclRleHQsXHJcbiAgICAgIGluaXRpYWxFbmFibGVSZWdFeHBGaWx0ZXIsXHJcbiAgICAgIGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzLFxyXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNldmVyaXRpZXMsXHJcbiAgICB9ID0gb3B0aW9uc1xyXG4gICAgdGhpcy5fbW9kZWwgPSBuZXcgTW9kZWwoe1xyXG4gICAgICBkaXNwbGF5YWJsZVJlY29yZHM6IFtdLFxyXG4gICAgICBmaWx0ZXJUZXh0OiBpbml0aWFsRmlsdGVyVGV4dCA9PSBudWxsID8gXCJcIiA6IGluaXRpYWxGaWx0ZXJUZXh0LFxyXG4gICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IEJvb2xlYW4oaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlciksXHJcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzID09IG51bGwgPyBbXSA6IGluaXRpYWxVbnNlbGVjdGVkU291cmNlSWRzLFxyXG4gICAgICBzZWxlY3RlZFNldmVyaXRpZXM6XHJcbiAgICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzID09IG51bGxcclxuICAgICAgICAgID8gQUxMX1NFVkVSSVRJRVNcclxuICAgICAgICAgIDogc2V0RGlmZmVyZW5jZShBTExfU0VWRVJJVElFUywgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzKSxcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5fc3RvcmUgPSBzdG9yZVxyXG4gICAgdGhpcy5fZGVzdHJveWVkID0gbmV3IFJlcGxheVN1YmplY3QoMSlcclxuXHJcbiAgICB0aGlzLl90aXRsZUNoYW5nZXMgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksIG9ic2VydmFibGVGcm9tUmVkdXhTdG9yZShzdG9yZSkpXHJcbiAgICAgIC50YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKVxyXG4gICAgICAubWFwKCgpID0+IHRoaXMuZ2V0VGl0bGUoKSlcclxuICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcclxuICAgICAgLnNoYXJlKClcclxuICB9XHJcblxyXG4gIGdldEljb25OYW1lKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gXCJudWNsaWNvbi1jb25zb2xlXCJcclxuICB9XHJcblxyXG4gIC8vIEdldCB0aGUgcGFuZSBpdGVtJ3MgdGl0bGUuIElmIHRoZXJlJ3Mgb25seSBvbmUgc291cmNlIHNlbGVjdGVkLCB3ZSdsbCB1c2UgdGhhdCB0byBtYWtlIGEgbW9yZVxyXG4gIC8vIGRlc2NyaXB0aXZlIHRpdGxlLlxyXG4gIGdldFRpdGxlKCk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBlbmFibGVkUHJvdmlkZXJDb3VudCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkucHJvdmlkZXJzLnNpemVcclxuICAgIGNvbnN0IHsgdW5zZWxlY3RlZFNvdXJjZUlkcyB9ID0gdGhpcy5fbW9kZWwuc3RhdGVcclxuXHJcbiAgICAvLyBDYWxsaW5nIGBfZ2V0U291cmNlcygpYCBpcyAoY3VycmVudGx5KSBleHBlbnNpdmUgYmVjYXVzZSBpdCBuZWVkcyB0byBzZWFyY2ggYWxsIHRoZSByZWNvcmRzXHJcbiAgICAvLyBmb3Igc291cmNlcyB0aGF0IGhhdmUgYmVlbiBkaXNhYmxlZCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBXZSB0cnkgdG8gYXZvaWQgY2FsbGluZyBpdCBpZiB3ZVxyXG4gICAgLy8gYWxyZWFkeSBrbm93IHRoYXQgdGhlcmUncyBtb3JlIHRoYW4gb25lIHNlbGVjdGVkIHNvdXJjZS5cclxuICAgIGlmIChlbmFibGVkUHJvdmlkZXJDb3VudCAtIHVuc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoID4gMSkge1xyXG4gICAgICByZXR1cm4gXCJDb25zb2xlXCJcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB0aGVyZSdzIG9ubHkgb25lIHNvdXJjZSBzZWxlY3RlZCwgdXNlIGl0cyBuYW1lIGluIHRoZSB0YWIgdGl0bGUuXHJcbiAgICBjb25zdCBzb3VyY2VzID0gdGhpcy5fZ2V0U291cmNlcygpXHJcbiAgICBpZiAoc291cmNlcy5sZW5ndGggLSB1bnNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICBjb25zdCBzZWxlY3RlZFNvdXJjZSA9IHNvdXJjZXMuZmluZCgoc291cmNlKSA9PiB1bnNlbGVjdGVkU291cmNlSWRzLmluZGV4T2Yoc291cmNlLmlkKSA9PT0gLTEpXHJcbiAgICAgIGlmIChzZWxlY3RlZFNvdXJjZSkge1xyXG4gICAgICAgIHJldHVybiBgQ29uc29sZTogJHtzZWxlY3RlZFNvdXJjZS5uYW1lfWBcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBcIkNvbnNvbGVcIlxyXG4gIH1cclxuXHJcbiAgZ2V0RGVmYXVsdExvY2F0aW9uKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gXCJib3R0b21cIlxyXG4gIH1cclxuXHJcbiAgZ2V0VVJJKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gV09SS1NQQUNFX1ZJRVdfVVJJXHJcbiAgfVxyXG5cclxuICBvbkRpZENoYW5nZVRpdGxlKGNhbGxiYWNrOiAodGl0bGU6IHN0cmluZykgPT4gbWl4ZWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICByZXR1cm4gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUodGhpcy5fdGl0bGVDaGFuZ2VzLnN1YnNjcmliZShjYWxsYmFjaykpXHJcbiAgfVxyXG5cclxuICBfZ2V0U291cmNlcygpOiBBcnJheTxTb3VyY2U+IHtcclxuICAgIGNvbnN0IHsgcHJvdmlkZXJzLCBwcm92aWRlclN0YXR1c2VzLCByZWNvcmRzLCBpbmNvbXBsZXRlUmVjb3JkcyB9ID0gdGhpcy5fc3RvcmUuZ2V0U3RhdGUoKVxyXG4gICAgcmV0dXJuIHRoaXMuX2dldFNvdXJjZXNNZW1vaXplZCh7XHJcbiAgICAgIHByb3ZpZGVycyxcclxuICAgICAgcHJvdmlkZXJTdGF0dXNlcyxcclxuICAgICAgcmVjb3JkcyxcclxuICAgICAgaW5jb21wbGV0ZVJlY29yZHMsXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy8gTWVtb2l6ZSBgZ2V0U291cmNlcygpYC4gVW5mb3J0dW5hdGVseSwgc2luY2Ugd2UgbG9vayBmb3IgdW5yZXByZXNlbnRlZCBzb3VyY2VzIGluIHRoZSByZWNvcmRcclxuICAvLyBsaXN0LCB0aGlzIHN0aWxsIG5lZWRzIHRvIGJlIGNhbGxlZCB3aGVuZXZlciB0aGUgcmVjb3JkcyBjaGFuZ2UuXHJcbiAgLy8gVE9ETzogQ29uc2lkZXIgcmVtb3ZpbmcgcmVjb3JkcyB3aGVuIHRoZWlyIHNvdXJjZSBpcyByZW1vdmVkLiBUaGlzIHdpbGwgbGlrZWx5IHJlcXVpcmUgYWRkaW5nXHJcbiAgLy8gdGhlIGFiaWxpdHkgdG8gZW5hYmxlIGFuZCBkaXNhYmxlIHNvdXJjZXMgc28sIGZvciBleGFtcGxlLCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBubyBsb25nZXJcclxuICAvLyBhY3RpdmUsIGl0IHN0aWxsIHJlbWFpbnMgaW4gdGhlIHNvdXJjZSBsaXN0LlxyXG4gIC8vICRGbG93Rml4TWUgKD49MC44NS4wKSAoVDM1OTg2ODk2KSBGbG93IHVwZ3JhZGUgc3VwcHJlc3NcclxuICBfZ2V0U291cmNlc01lbW9pemVkID0gbWVtb2l6ZVVudGlsQ2hhbmdlZChcclxuICAgIGdldFNvdXJjZXMsXHJcbiAgICAob3B0cykgPT4gb3B0cyxcclxuICAgIChhLCBiKSA9PiBzaGFsbG93RXF1YWwoYSwgYilcclxuICApXHJcblxyXG4gIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpXHJcbiAgfVxyXG5cclxuICBjb3B5KCk6IENvbnNvbGUge1xyXG4gICAgcmV0dXJuIG5ldyBDb25zb2xlKHtcclxuICAgICAgc3RvcmU6IHRoaXMuX3N0b3JlLFxyXG4gICAgICBpbml0aWFsRmlsdGVyVGV4dDogdGhpcy5fbW9kZWwuc3RhdGUuZmlsdGVyVGV4dCxcclxuICAgICAgaW5pdGlhbEVuYWJsZVJlZ0V4cEZpbHRlcjogdGhpcy5fbW9kZWwuc3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxyXG4gICAgICBpbml0aWFsVW5zZWxlY3RlZFNvdXJjZUlkczogdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgaW5pdGlhbFVuc2VsZWN0ZWRTZXZlcml0aWVzOiBzZXREaWZmZXJlbmNlKEFMTF9TRVZFUklUSUVTLCB0aGlzLl9tb2RlbC5zdGF0ZS5zZWxlY3RlZFNldmVyaXRpZXMpLFxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIF9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKCk6IEJvdW5kQWN0aW9uQ3JlYXRvcnMge1xyXG4gICAgaWYgKHRoaXMuX2FjdGlvbkNyZWF0b3JzID09IG51bGwpIHtcclxuICAgICAgdGhpcy5fYWN0aW9uQ3JlYXRvcnMgPSB7XHJcbiAgICAgICAgZXhlY3V0ZTogKGNvZGUpID0+IHtcclxuICAgICAgICAgIHRoaXMuX3N0b3JlLmRpc3BhdGNoKEFjdGlvbnMuZXhlY3V0ZShjb2RlKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdEV4ZWN1dG9yOiAoZXhlY3V0b3JJZCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2goQWN0aW9ucy5zZWxlY3RFeGVjdXRvcihleGVjdXRvcklkKSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsZWFyUmVjb3JkczogKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5fc3RvcmUuZGlzcGF0Y2goQWN0aW9ucy5jbGVhclJlY29yZHMoKSlcclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fYWN0aW9uQ3JlYXRvcnNcclxuICB9XHJcblxyXG4gIF9yZXNldEFsbEZpbHRlcnMgPSAoKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLl9zZWxlY3RTb3VyY2VzKHRoaXMuX2dldFNvdXJjZXMoKS5tYXAoKHMpID0+IHMuaWQpKVxyXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoeyBmaWx0ZXJUZXh0OiBcIlwiIH0pXHJcbiAgfVxyXG5cclxuICBfY3JlYXRlUGFzdGUgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbiAgICBjb25zdCBkaXNwbGF5YWJsZVJlY29yZHMgPSBTZWxlY3RvcnMuZ2V0QWxsUmVjb3Jkcyh0aGlzLl9zdG9yZS5nZXRTdGF0ZSgpKS50b0FycmF5KClcclxuICAgIGNvbnN0IGNyZWF0ZVBhc3RlSW1wbCA9IHRoaXMuX3N0b3JlLmdldFN0YXRlKCkuY3JlYXRlUGFzdGVGdW5jdGlvblxyXG4gICAgaWYgKGNyZWF0ZVBhc3RlSW1wbCA9PSBudWxsKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNyZWF0ZVBhc3RlKGNyZWF0ZVBhc3RlSW1wbCwgZGlzcGxheWFibGVSZWNvcmRzKVxyXG4gIH1cclxuXHJcbiAgX2dldEZpbHRlckluZm8oKToge1xyXG4gICAgaW52YWxpZDogYm9vbGVhbixcclxuICAgIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxyXG4gICAgZmlsdGVyZWRSZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxyXG4gICAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxyXG4gIH0ge1xyXG4gICAgY29uc3QgeyBwYXR0ZXJuLCBpbnZhbGlkIH0gPSBnZXRGaWx0ZXJQYXR0ZXJuKHRoaXMuX21vZGVsLnN0YXRlLmZpbHRlclRleHQsIHRoaXMuX21vZGVsLnN0YXRlLmVuYWJsZVJlZ0V4cEZpbHRlcilcclxuICAgIGNvbnN0IHNvdXJjZXMgPSB0aGlzLl9nZXRTb3VyY2VzKClcclxuICAgIGNvbnN0IHNlbGVjdGVkU291cmNlSWRzID0gc291cmNlc1xyXG4gICAgICAubWFwKChzb3VyY2UpID0+IHNvdXJjZS5pZClcclxuICAgICAgLmZpbHRlcigoc291cmNlSWQpID0+IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihzb3VyY2VJZCkgPT09IC0xKVxyXG5cclxuICAgIGNvbnN0IHsgc2VsZWN0ZWRTZXZlcml0aWVzIH0gPSB0aGlzLl9tb2RlbC5zdGF0ZVxyXG4gICAgY29uc3QgZmlsdGVyZWRSZWNvcmRzID0gZmlsdGVyUmVjb3JkcyhcclxuICAgICAgU2VsZWN0b3JzLmdldEFsbFJlY29yZHModGhpcy5fc3RvcmUuZ2V0U3RhdGUoKSkudG9BcnJheSgpLFxyXG4gICAgICBzZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxyXG4gICAgICBwYXR0ZXJuLFxyXG4gICAgICBzb3VyY2VzLmxlbmd0aCAhPT0gc2VsZWN0ZWRTb3VyY2VJZHMubGVuZ3RoXHJcbiAgICApXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaW52YWxpZCxcclxuICAgICAgc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcyxcclxuICAgICAgZmlsdGVyZWRSZWNvcmRzLFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICBpZiAodGhpcy5fZWxlbWVudCAhPSBudWxsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9lbGVtZW50XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWN0aW9uQ3JlYXRvcnMgPSB0aGlzLl9nZXRCb3VuZEFjdGlvbkNyZWF0b3JzKClcclxuICAgIGNvbnN0IGdsb2JhbFN0YXRlczogT2JzZXJ2YWJsZTxBcHBTdGF0ZT4gPSBvYnNlcnZhYmxlRnJvbVJlZHV4U3RvcmUodGhpcy5fc3RvcmUpXHJcblxyXG4gICAgY29uc3QgcHJvcHMgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy5fbW9kZWwudG9PYnNlcnZhYmxlKCksIGdsb2JhbFN0YXRlcylcclxuICAgICAgLy8gRG9uJ3QgcmUtcmVuZGVyIHdoZW4gdGhlIGNvbnNvbGUgaXNuJ3QgdmlzaWJsZS5cclxuICAgICAgLmxldCh0b2dnbGUob2JzZXJ2ZVBhbmVJdGVtVmlzaWJpbGl0eSh0aGlzKSkpXHJcbiAgICAgIC5hdWRpdCgoKSA9PiBuZXh0QW5pbWF0aW9uRnJhbWUpXHJcbiAgICAgIC5tYXAoKFtsb2NhbFN0YXRlLCBnbG9iYWxTdGF0ZV0pID0+IHtcclxuICAgICAgICBjb25zdCB7IGludmFsaWQsIHNlbGVjdGVkU291cmNlSWRzLCBzZWxlY3RlZFNldmVyaXRpZXMsIGZpbHRlcmVkUmVjb3JkcyB9ID0gdGhpcy5fZ2V0RmlsdGVySW5mbygpXHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvcklkID0gU2VsZWN0b3JzLmdldEN1cnJlbnRFeGVjdXRvcklkKGdsb2JhbFN0YXRlKVxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRFeGVjdXRvciA9IGN1cnJlbnRFeGVjdXRvcklkICE9IG51bGwgPyBnbG9iYWxTdGF0ZS5leGVjdXRvcnMuZ2V0KGN1cnJlbnRFeGVjdXRvcklkKSA6IG51bGxcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGludmFsaWRGaWx0ZXJJbnB1dDogaW52YWxpZCxcclxuICAgICAgICAgIGV4ZWN1dGU6IGFjdGlvbkNyZWF0b3JzLmV4ZWN1dGUsXHJcbiAgICAgICAgICBzZWxlY3RFeGVjdXRvcjogYWN0aW9uQ3JlYXRvcnMuc2VsZWN0RXhlY3V0b3IsXHJcbiAgICAgICAgICBjbGVhclJlY29yZHM6IGFjdGlvbkNyZWF0b3JzLmNsZWFyUmVjb3JkcyxcclxuICAgICAgICAgIGNyZWF0ZVBhc3RlOiBnbG9iYWxTdGF0ZS5jcmVhdGVQYXN0ZUZ1bmN0aW9uID09IG51bGwgPyBudWxsIDogdGhpcy5fY3JlYXRlUGFzdGUsXHJcbiAgICAgICAgICB3YXRjaEVkaXRvcjogZ2xvYmFsU3RhdGUud2F0Y2hFZGl0b3IsXHJcbiAgICAgICAgICBjdXJyZW50RXhlY3V0b3IsXHJcbiAgICAgICAgICB1bnNlbGVjdGVkU291cmNlSWRzOiBsb2NhbFN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMsXHJcbiAgICAgICAgICBmaWx0ZXJUZXh0OiBsb2NhbFN0YXRlLmZpbHRlclRleHQsXHJcbiAgICAgICAgICBlbmFibGVSZWdFeHBGaWx0ZXI6IGxvY2FsU3RhdGUuZW5hYmxlUmVnRXhwRmlsdGVyLFxyXG4gICAgICAgICAgcmVjb3JkczogZmlsdGVyZWRSZWNvcmRzLFxyXG4gICAgICAgICAgZmlsdGVyZWRSZWNvcmRDb3VudDogU2VsZWN0b3JzLmdldEFsbFJlY29yZHMoZ2xvYmFsU3RhdGUpLnNpemUgLSBmaWx0ZXJlZFJlY29yZHMubGVuZ3RoLFxyXG4gICAgICAgICAgaGlzdG9yeTogZ2xvYmFsU3RhdGUuaGlzdG9yeSxcclxuICAgICAgICAgIHNvdXJjZXM6IHRoaXMuX2dldFNvdXJjZXMoKSxcclxuICAgICAgICAgIHNlbGVjdGVkU291cmNlSWRzLFxyXG4gICAgICAgICAgc2VsZWN0U291cmNlczogdGhpcy5fc2VsZWN0U291cmNlcyxcclxuICAgICAgICAgIGV4ZWN1dG9yczogZ2xvYmFsU3RhdGUuZXhlY3V0b3JzLFxyXG4gICAgICAgICAgZ2V0UHJvdmlkZXI6IChpZCkgPT4gZ2xvYmFsU3RhdGUucHJvdmlkZXJzLmdldChpZCksXHJcbiAgICAgICAgICB1cGRhdGVGaWx0ZXI6IHRoaXMuX3VwZGF0ZUZpbHRlcixcclxuICAgICAgICAgIHJlc2V0QWxsRmlsdGVyczogdGhpcy5fcmVzZXRBbGxGaWx0ZXJzLFxyXG4gICAgICAgICAgZm9udFNpemU6IGdsb2JhbFN0YXRlLmZvbnRTaXplLFxyXG4gICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzLFxyXG4gICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk6IHRoaXMuX3RvZ2dsZVNldmVyaXR5LFxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICBjb25zdCBTdGF0ZWZ1bENvbnNvbGVWaWV3ID0gYmluZE9ic2VydmFibGVBc1Byb3BzKHByb3BzLCBDb25zb2xlVmlldylcclxuICAgIHJldHVybiAodGhpcy5fZWxlbWVudCA9IHJlbmRlclJlYWN0Um9vdCg8U3RhdGVmdWxDb25zb2xlVmlldyAvPikpXHJcbiAgfVxyXG5cclxuICBzZXJpYWxpemUoKTogQ29uc29sZVBlcnNpc3RlZFN0YXRlIHtcclxuICAgIGNvbnN0IHsgZmlsdGVyVGV4dCwgZW5hYmxlUmVnRXhwRmlsdGVyLCB1bnNlbGVjdGVkU291cmNlSWRzLCBzZWxlY3RlZFNldmVyaXRpZXMgfSA9IHRoaXMuX21vZGVsLnN0YXRlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkZXNlcmlhbGl6ZXI6IFwibnVjbGlkZS5Db25zb2xlXCIsXHJcbiAgICAgIGZpbHRlclRleHQsXHJcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICAgdW5zZWxlY3RlZFNvdXJjZUlkcyxcclxuICAgICAgdW5zZWxlY3RlZFNldmVyaXRpZXM6IFsuLi5zZXREaWZmZXJlbmNlKEFMTF9TRVZFUklUSUVTLCBzZWxlY3RlZFNldmVyaXRpZXMpXSxcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9zZWxlY3RTb3VyY2VzID0gKHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XHJcbiAgICBjb25zdCBzb3VyY2VJZHMgPSB0aGlzLl9nZXRTb3VyY2VzKCkubWFwKChzb3VyY2UpID0+IHNvdXJjZS5pZClcclxuICAgIGNvbnN0IHVuc2VsZWN0ZWRTb3VyY2VJZHMgPSBzb3VyY2VJZHMuZmlsdGVyKChzb3VyY2VJZCkgPT4gc2VsZWN0ZWRTb3VyY2VJZHMuaW5kZXhPZihzb3VyY2VJZCkgPT09IC0xKVxyXG4gICAgdGhpcy5fbW9kZWwuc2V0U3RhdGUoeyB1bnNlbGVjdGVkU291cmNlSWRzIH0pXHJcbiAgfVxyXG5cclxuICAvKiogVW5zZWxlY3RzIHRoZSBzb3VyY2VzIGZyb20gdGhlIGdpdmVuIElEcyAqL1xyXG4gIHVuc2VsZWN0U291cmNlcyhpZHM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcclxuICAgIGNvbnN0IG5ld0lkcyA9IGlkcy5maWx0ZXIoKGlkKSA9PiAhdGhpcy5fbW9kZWwuc3RhdGUudW5zZWxlY3RlZFNvdXJjZUlkcy5pbmNsdWRlcyhpZCkpXHJcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7XHJcbiAgICAgIHVuc2VsZWN0ZWRTb3VyY2VJZHM6IHRoaXMuX21vZGVsLnN0YXRlLnVuc2VsZWN0ZWRTb3VyY2VJZHMuY29uY2F0KG5ld0lkcyksXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgX3VwZGF0ZUZpbHRlciA9IChjaGFuZ2U6IFJlZ0V4cEZpbHRlckNoYW5nZSk6IHZvaWQgPT4ge1xyXG4gICAgY29uc3QgeyB0ZXh0LCBpc1JlZ0V4cCB9ID0gY2hhbmdlXHJcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7XHJcbiAgICAgIGZpbHRlclRleHQ6IHRleHQsXHJcbiAgICAgIGVuYWJsZVJlZ0V4cEZpbHRlcjogaXNSZWdFeHAsXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgX3RvZ2dsZVNldmVyaXR5ID0gKHNldmVyaXR5OiBTZXZlcml0eSk6IHZvaWQgPT4ge1xyXG4gICAgY29uc3QgeyBzZWxlY3RlZFNldmVyaXRpZXMgfSA9IHRoaXMuX21vZGVsLnN0YXRlXHJcbiAgICBjb25zdCBuZXh0U2VsZWN0ZWRTZXZlcml0aWVzID0gbmV3IFNldChzZWxlY3RlZFNldmVyaXRpZXMpXHJcbiAgICBpZiAobmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5oYXMoc2V2ZXJpdHkpKSB7XHJcbiAgICAgIG5leHRTZWxlY3RlZFNldmVyaXRpZXMuZGVsZXRlKHNldmVyaXR5KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbmV4dFNlbGVjdGVkU2V2ZXJpdGllcy5hZGQoc2V2ZXJpdHkpXHJcbiAgICB9XHJcbiAgICB0aGlzLl9tb2RlbC5zZXRTdGF0ZSh7IHNlbGVjdGVkU2V2ZXJpdGllczogbmV4dFNlbGVjdGVkU2V2ZXJpdGllcyB9KVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U291cmNlcyhvcHRpb25zOiB7XHJcbiAgcmVjb3JkczogTGlzdDxSZWNvcmQ+LFxyXG4gIHByb3ZpZGVyczogTWFwPHN0cmluZywgU291cmNlSW5mbz4sXHJcbiAgcHJvdmlkZXJTdGF0dXNlczogTWFwPHN0cmluZywgQ29uc29sZVNvdXJjZVN0YXR1cz4sXHJcbn0pOiBBcnJheTxTb3VyY2U+IHtcclxuICBjb25zdCB7IHByb3ZpZGVycywgcHJvdmlkZXJTdGF0dXNlcywgcmVjb3JkcyB9ID0gb3B0aW9uc1xyXG5cclxuICAvLyBDb252ZXJ0IHRoZSBwcm92aWRlcnMgdG8gYSBtYXAgb2Ygc291cmNlcy5cclxuICBjb25zdCBtYXBPZlNvdXJjZXMgPSBuZXcgTWFwKFxyXG4gICAgQXJyYXkuZnJvbShwcm92aWRlcnMuZW50cmllcygpKS5tYXAoKFtrLCBwcm92aWRlcl0pID0+IHtcclxuICAgICAgY29uc3Qgc291cmNlID0ge1xyXG4gICAgICAgIGlkOiBwcm92aWRlci5pZCxcclxuICAgICAgICBuYW1lOiBwcm92aWRlci5uYW1lLFxyXG4gICAgICAgIHN0YXR1czogcHJvdmlkZXJTdGF0dXNlcy5nZXQocHJvdmlkZXIuaWQpIHx8IFwic3RvcHBlZFwiLFxyXG4gICAgICAgIHN0YXJ0OiB0eXBlb2YgcHJvdmlkZXIuc3RhcnQgPT09IFwiZnVuY3Rpb25cIiA/IHByb3ZpZGVyLnN0YXJ0IDogdW5kZWZpbmVkLFxyXG4gICAgICAgIHN0b3A6IHR5cGVvZiBwcm92aWRlci5zdG9wID09PSBcImZ1bmN0aW9uXCIgPyBwcm92aWRlci5zdG9wIDogdW5kZWZpbmVkLFxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBbaywgc291cmNlXVxyXG4gICAgfSlcclxuICApXHJcblxyXG4gIC8vIFNvbWUgcHJvdmlkZXJzIG1heSBoYXZlIGJlZW4gdW5yZWdpc3RlcmVkLCBidXQgc3RpbGwgaGF2ZSByZWNvcmRzLiBBZGQgc291cmNlcyBmb3IgdGhlbSB0b28uXHJcbiAgLy8gVE9ETzogSXRlcmF0aW5nIG92ZXIgYWxsIHRoZSByZWNvcmRzIHRvIGdldCB0aGlzIGV2ZXJ5IHRpbWUgd2UgZ2V0IGEgbmV3IHJlY29yZCBpcyBpbmVmZmljaWVudC5cclxuICByZWNvcmRzLmZvckVhY2goKHJlY29yZCwgaSkgPT4ge1xyXG4gICAgaWYgKCFtYXBPZlNvdXJjZXMuaGFzKHJlY29yZC5zb3VyY2VJZCkpIHtcclxuICAgICAgbWFwT2ZTb3VyY2VzLnNldChyZWNvcmQuc291cmNlSWQsIHtcclxuICAgICAgICBpZDogcmVjb3JkLnNvdXJjZUlkLFxyXG4gICAgICAgIG5hbWU6IHJlY29yZC5zb3VyY2VJZCxcclxuICAgICAgICBzdGF0dXM6IFwic3RvcHBlZFwiLFxyXG4gICAgICAgIHN0YXJ0OiB1bmRlZmluZWQsXHJcbiAgICAgICAgc3RvcDogdW5kZWZpbmVkLFxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH0pXHJcblxyXG4gIHJldHVybiBBcnJheS5mcm9tKG1hcE9mU291cmNlcy52YWx1ZXMoKSlcclxufVxyXG5cclxuZnVuY3Rpb24gZmlsdGVyUmVjb3JkcyhcclxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxyXG4gIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxyXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcclxuICBmaWx0ZXJQYXR0ZXJuOiA/UmVnRXhwLFxyXG4gIGZpbHRlclNvdXJjZXM6IGJvb2xlYW5cclxuKTogQXJyYXk8UmVjb3JkPiB7XHJcbiAgaWYgKCFmaWx0ZXJTb3VyY2VzICYmIGZpbHRlclBhdHRlcm4gPT0gbnVsbCAmJiBhcmVTZXRzRXF1YWwoQUxMX1NFVkVSSVRJRVMsIHNlbGVjdGVkU2V2ZXJpdGllcykpIHtcclxuICAgIHJldHVybiByZWNvcmRzXHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVjb3Jkcy5maWx0ZXIoKHJlY29yZCkgPT4ge1xyXG4gICAgLy8gT25seSBmaWx0ZXIgcmVndWxhciBtZXNzYWdlc1xyXG4gICAgaWYgKHJlY29yZC5raW5kICE9PSBcIm1lc3NhZ2VcIikge1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghc2VsZWN0ZWRTZXZlcml0aWVzLmhhcyhsZXZlbFRvU2V2ZXJpdHkocmVjb3JkLmxldmVsKSkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc291cmNlTWF0Y2hlcyA9IHNlbGVjdGVkU291cmNlSWRzLmluZGV4T2YocmVjb3JkLnNvdXJjZUlkKSAhPT0gLTFcclxuICAgIHJldHVybiBzb3VyY2VNYXRjaGVzICYmIChmaWx0ZXJQYXR0ZXJuID09IG51bGwgfHwgZmlsdGVyUGF0dGVybi50ZXN0KHJlY29yZC50ZXh0KSlcclxuICB9KVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXJpYWxpemVSZWNvcmRPYmplY3QoXHJcbiAgdmlzaXRlZDogU2V0PHN0cmluZz4sXHJcbiAgZXhwcmVzc2lvbjogSUV4cHJlc3Npb24sXHJcbiAgdGV4dDogc3RyaW5nLFxyXG4gIGxldmVsOiBudW1iZXJcclxuKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICBjb25zdCBnZXRUZXh0ID0gKGV4cCkgPT4ge1xyXG4gICAgbGV0IGluZGVudCA9IFwiXCJcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGV2ZWw7IGkrKykge1xyXG4gICAgICBpbmRlbnQgKz0gXCJcXHRcIlxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGluZGVudCArIGV4cC5nZXRWYWx1ZSgpXHJcbiAgfVxyXG5cclxuICBpZiAoIWV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKSkge1xyXG4gICAgLy8gTGVhZiBub2RlLlxyXG4gICAgcmV0dXJuIHRleHQgKyBnZXRUZXh0KGV4cHJlc3Npb24pXHJcbiAgfVxyXG5cclxuICBjb25zdCBpZCA9IGV4cHJlc3Npb24uZ2V0SWQoKVxyXG4gIGlmICh2aXNpdGVkLmhhcyhpZCkpIHtcclxuICAgIC8vIEd1YXJkIGFnYWluc3QgY3ljbGVzLlxyXG4gICAgcmV0dXJuIHRleHRcclxuICB9XHJcblxyXG4gIHZpc2l0ZWQuYWRkKGlkKVxyXG5cclxuICBjb25zdCBjaGlsZHJlbiA9IGF3YWl0IGV4cHJlc3Npb24uZ2V0Q2hpbGRyZW4oKVxyXG4gIGNvbnN0IHNlcmlhbGl6ZWRQcm9wcyA9IGNoaWxkcmVuLm1hcCgoY2hpbGRQcm9wKSA9PiB7XHJcbiAgICByZXR1cm4gc2VyaWFsaXplUmVjb3JkT2JqZWN0KHZpc2l0ZWQsIGNoaWxkUHJvcCwgXCJcIiwgbGV2ZWwgKyAxKVxyXG4gIH0pXHJcbiAgcmV0dXJuIGdldFRleHQoZXhwcmVzc2lvbikgKyBcIlxcblwiICsgKGF3YWl0IFByb21pc2UuYWxsKHNlcmlhbGl6ZWRQcm9wcykpLmpvaW4oXCJcXG5cIilcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlUGFzdGUoY3JlYXRlUGFzdGVJbXBsOiBDcmVhdGVQYXN0ZUZ1bmN0aW9uLCByZWNvcmRzOiBBcnJheTxSZWNvcmQ+KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgbGluZVByb21pc2VzID0gcmVjb3Jkc1xyXG4gICAgLmZpbHRlcigocmVjb3JkKSA9PiByZWNvcmQua2luZCA9PT0gXCJtZXNzYWdlXCIgfHwgcmVjb3JkLmtpbmQgPT09IFwicmVxdWVzdFwiIHx8IHJlY29yZC5raW5kID09PSBcInJlc3BvbnNlXCIpXHJcbiAgICAubWFwKGFzeW5jIChyZWNvcmQpID0+IHtcclxuICAgICAgY29uc3QgbGV2ZWwgPSByZWNvcmQubGV2ZWwgIT0gbnVsbCA/IHJlY29yZC5sZXZlbC50b1N0cmluZygpLnRvVXBwZXJDYXNlKCkgOiBcIkxPR1wiXHJcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IHJlY29yZC50aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoKVxyXG4gICAgICBsZXQgdGV4dCA9IHJlY29yZC50ZXh0IHx8IEVSUk9SX1RSQU5TQ1JJQklOR19NRVNTQUdFXHJcblxyXG4gICAgICBpZiAocmVjb3JkLmtpbmQgPT09IFwicmVzcG9uc2VcIiAmJiByZWNvcmQuZXhwcmVzc2lvbnMgIT0gbnVsbCAmJiByZWNvcmQuZXhwcmVzc2lvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHRleHQgPSBcIlwiXHJcbiAgICAgICAgZm9yIChjb25zdCBleHByZXNzaW9uIG9mIHJlY29yZC5leHByZXNzaW9ucykge1xyXG4gICAgICAgICAgLy8gSWYgdGhlIHJlY29yZCBoYXMgYSBkYXRhIG9iamVjdCwgYW5kIHRoZSBvYmplY3QgaGFzIGFuIElELFxyXG4gICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXhwYW5kIHRoZSBub2RlcyBvZiB0aGUgb2JqZWN0IGFuZCBzZXJpYWxpemUgaXRcclxuICAgICAgICAgIC8vIGZvciB0aGUgcGFzdGUuXHJcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYXdhaXQtaW4tbG9vcFxyXG4gICAgICAgICAgdGV4dCArPSBhd2FpdCBzZXJpYWxpemVSZWNvcmRPYmplY3QobmV3IFNldCgpLCBleHByZXNzaW9uLCBcIlwiLCAwKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGBbJHtsZXZlbH1dWyR7cmVjb3JkLnNvdXJjZUlkfV1bJHt0aW1lc3RhbXB9XVxcdCAke3RleHR9YFxyXG4gICAgfSlcclxuXHJcbiAgY29uc3QgbGluZXMgPSAoYXdhaXQgUHJvbWlzZS5hbGwobGluZVByb21pc2VzKSkuam9pbihcIlxcblwiKVxyXG5cclxuICBpZiAobGluZXMgPT09IFwiXCIpIHtcclxuICAgIC8vIENhbid0IGNyZWF0ZSBhbiBlbXB0eSBwYXN0ZSFcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFxyXG4gICAgICBcIlRoZXJlIGlzIG5vdGhpbmcgaW4geW91ciBjb25zb2xlIHRvIFBhc3RlISBDaGVjayB5b3VyIGNvbnNvbGUgZmlsdGVycyBhbmQgdHJ5IGFnYWluLlwiXHJcbiAgICApXHJcbiAgICByZXR1cm5cclxuICB9XHJcblxyXG4gIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiQ3JlYXRpbmcgUGFzdGUuLi5cIilcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHVyaSA9IGF3YWl0IGNyZWF0ZVBhc3RlSW1wbChcclxuICAgICAgbGluZXMsXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogXCJOdWNsaWRlIENvbnNvbGUgUGFzdGVcIixcclxuICAgICAgfSxcclxuICAgICAgXCJjb25zb2xlIHBhc3RlXCJcclxuICAgIClcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKGBDcmVhdGVkIFBhc3RlIGF0ICR7dXJpfWApXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGlmIChlcnJvci5zdGRvdXQgPT0gbnVsbCkge1xyXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgcGFzdGU6ICR7U3RyaW5nKGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpfWApXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgY29uc3QgZXJyb3JNZXNzYWdlcyA9IGVycm9yLnN0ZG91dFxyXG4gICAgICAudHJpbSgpXHJcbiAgICAgIC5zcGxpdChcIlxcblwiKVxyXG4gICAgICAubWFwKEpTT04ucGFyc2UpXHJcbiAgICAgIC5tYXAoKGUpID0+IGUubWVzc2FnZSlcclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkZhaWxlZCB0byBjcmVhdGUgcGFzdGVcIiwge1xyXG4gICAgICBkZXRhaWw6IGVycm9yTWVzc2FnZXMuam9pbihcIlxcblwiKSxcclxuICAgICAgZGlzbWlzc2FibGU6IHRydWUsXHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbGV2ZWxUb1NldmVyaXR5KGxldmVsOiBMZXZlbCk6IFNldmVyaXR5IHtcclxuICBzd2l0Y2ggKGxldmVsKSB7XHJcbiAgICBjYXNlIFwiZXJyb3JcIjpcclxuICAgICAgcmV0dXJuIFwiZXJyb3JcIlxyXG4gICAgY2FzZSBcIndhcm5pbmdcIjpcclxuICAgICAgcmV0dXJuIFwid2FybmluZ1wiXHJcbiAgICBjYXNlIFwibG9nXCI6XHJcbiAgICBjYXNlIFwiaW5mb1wiOlxyXG4gICAgY2FzZSBcImRlYnVnXCI6XHJcbiAgICBjYXNlIFwic3VjY2Vzc1wiOlxyXG4gICAgICByZXR1cm4gXCJpbmZvXCJcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIEFsbCB0aGUgY29sb3JzIGFyZSBcImluZm9cIlxyXG4gICAgICByZXR1cm4gXCJpbmZvXCJcclxuICB9XHJcbn1cclxuIl19