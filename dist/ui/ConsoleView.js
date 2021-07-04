"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _observable = require("@atom-ide-community/nuclide-commons/observable");

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var React = _interopRequireWildcard(require("react"));

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

var _FilterReminder = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/FilterReminder"));

var _OutputTable = _interopRequireDefault(require("./OutputTable"));

var _ConsoleHeader = _interopRequireDefault(require("./ConsoleHeader"));

var _InputArea = _interopRequireDefault(require("./InputArea"));

var _PromptButton = _interopRequireDefault(require("./PromptButton"));

var _NewMessagesNotification = _interopRequireDefault(require("./NewMessagesNotification"));

var _assert = _interopRequireDefault(require("assert"));

var _nullthrows = _interopRequireDefault(require("nullthrows"));

var _shallowequal = _interopRequireDefault(require("shallowequal"));

var _recordsChanged = _interopRequireDefault(require("../recordsChanged"));

var _StyleSheet = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/StyleSheet"));

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
// Maximum time (ms) for the console to try scrolling to the bottom.
const MAXIMUM_SCROLLING_TIME = 3000;
const DEFAULT_SCOPE_NAME = 'text.plain';
let count = 0;

class ConsoleView extends React.Component {
  // Used when _scrollToBottom is called. The console optimizes message loading
  // so scrolling to the bottom once doesn't always scroll to the bottom since
  // more messages can be loaded after.
  constructor(props) {
    super(props);
    this._consoleScrollPaneEl = void 0;
    this._consoleHeaderComponent = void 0;
    this._disposables = void 0;
    this._executorScopeDisposables = void 0;
    this._isScrolledNearBottom = void 0;
    this._id = void 0;
    this._inputArea = void 0;
    this._continuouslyScrollToBottom = void 0;
    this._scrollingThrottle = void 0;
    this._outputTable = void 0;

    this._getExecutor = id => {
      return this.props.executors.get(id);
    };

    this._getProvider = id => {
      return this.props.getProvider(id);
    };

    this._executePrompt = code => {
      this.props.execute(code); // Makes the console to scroll to the bottom.

      this._isScrolledNearBottom = true;
    };

    this._handleScroll = (offsetHeight, scrollHeight, scrollTop) => {
      this._handleScrollEnd(offsetHeight, scrollHeight, scrollTop);
    };

    this._handleOutputTable = ref => {
      this._outputTable = ref;
    };

    this._scrollToBottom = () => {
      if (!this._outputTable) {
        return;
      }

      this._outputTable.scrollToBottom();

      this.setState({
        unseenMessages: false
      });
    };

    this._startScrollToBottom = () => {
      if (!this._continuouslyScrollToBottom) {
        this._continuouslyScrollToBottom = true;
        this._scrollingThrottle = _rxjsCompatUmdMin.Observable.timer(MAXIMUM_SCROLLING_TIME).subscribe(() => {
          this._stopScrollToBottom();
        });
      }

      this._scrollToBottom();
    };

    this._stopScrollToBottom = () => {
      this._continuouslyScrollToBottom = false;

      if (this._scrollingThrottle != null) {
        this._scrollingThrottle.unsubscribe();
      }
    };

    this._shouldScrollToBottom = () => {
      return this._isScrolledNearBottom || this._continuouslyScrollToBottom;
    };

    this.state = {
      unseenMessages: false,
      scopeName: DEFAULT_SCOPE_NAME
    };
    this._disposables = new _UniversalDisposable.default();
    this._executorScopeDisposables = new _UniversalDisposable.default();
    this._isScrolledNearBottom = true;
    this._continuouslyScrollToBottom = false;
    this._id = count++;
  }

  componentDidMount() {
    this._disposables.add( // Wait for `<OutputTable />` to render itself via react-virtualized before scrolling and
    // re-measuring; Otherwise, the scrolled location will be inaccurate, preventing the Console
    // from auto-scrolling.
    _observable.macrotask.subscribe(() => {
      this._startScrollToBottom();
    }), () => {
      if (this._scrollingThrottle != null) {
        this._scrollingThrottle.unsubscribe();
      }
    }, atom.commands.add('atom-workspace', {
      // eslint-disable-next-line nuclide-internal/atom-apis
      'atom-ide-console:focus-console-prompt': () => {
        if (this._inputArea != null) {
          this._inputArea.focus();
        }
      }
    }), atom.commands.add('atom-workspace', {
      // eslint-disable-next-line nuclide-internal/atom-apis
      'atom-ide-console:scroll-to-bottom': () => {
        this._scrollToBottom();
      }
    }), atom.commands.add((0, _nullthrows.default)(this._consoleScrollPaneEl), 'atom-ide:filter', () => this._focusFilter()));
  }

  componentWillUnmount() {
    this._disposables.dispose();

    this._executorScopeDisposables.dispose();
  }

  componentDidUpdate(prevProps) {
    // If records are added while we're scrolled to the bottom (or very very close, at least),
    // automatically scroll.
    if (this._isScrolledNearBottom && (0, _recordsChanged.default)(prevProps.records, this.props.records)) {
      this._startScrollToBottom();
    }
  }

  _focusFilter() {
    if (this._consoleHeaderComponent != null) {
      this._consoleHeaderComponent.focusFilter();
    }
  }

  _renderPromptButton() {
    (0, _assert.default)(this.props.currentExecutor != null);
    const {
      currentExecutor
    } = this.props;
    const options = Array.from(this.props.executors.values()).map(executor => ({
      id: executor.id,
      label: executor.name
    }));
    return /*#__PURE__*/React.createElement(_PromptButton.default, {
      value: currentExecutor.id,
      onChange: this.props.selectExecutor,
      options: options,
      children: currentExecutor.name
    });
  }

  _isScrolledToBottom(offsetHeight, scrollHeight, scrollTop) {
    return scrollHeight - (offsetHeight + scrollTop) < 5;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // If the messages were cleared, hide the notification.
    if (nextProps.records.length === 0) {
      this._isScrolledNearBottom = true;
      this.setState({
        unseenMessages: false
      });
    } else if ( // If we receive new messages after we've scrolled away from the bottom, show the "new
    // messages" notification.
    !this._isScrolledNearBottom && (0, _recordsChanged.default)(this.props.records, nextProps.records)) {
      this.setState({
        unseenMessages: true
      });
    }

    this._executorScopeDisposables.dispose();

    this._executorScopeDisposables = new _UniversalDisposable.default();

    for (const executor of nextProps.executors.values()) {
      if (executor != null && executor.onDidChangeScopeName != null) {
        this._executorScopeDisposables.add(executor.onDidChangeScopeName(() => {
          const scopeName = executor.scopeName();
          this.setState({
            scopeName
          });
        }));
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(0, _shallowequal.default)(this.props, nextProps) || !(0, _shallowequal.default)(this.state, nextState);
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "console"
    }, /*#__PURE__*/React.createElement(_StyleSheet.default, {
      sourcePath: "console-font-style",
      priority: -1,
      css: `
            #console-font-size-${this._id} {
              font-size: ${this.props.fontSize}px;
            }
          `
    }), /*#__PURE__*/React.createElement(_ConsoleHeader.default, {
      clear: this.props.clearRecords,
      createPaste: this.props.createPaste,
      invalidFilterInput: this.props.invalidFilterInput,
      enableRegExpFilter: this.props.enableRegExpFilter,
      filterText: this.props.filterText,
      ref: component => this._consoleHeaderComponent = component,
      selectedSourceIds: this.props.selectedSourceIds,
      sources: this.props.sources,
      onFilterChange: this.props.updateFilter,
      onSelectedSourcesChange: this.props.selectSources,
      selectedSeverities: this.props.selectedSeverities,
      toggleSeverity: this.props.toggleSeverity
    }), /*#__PURE__*/React.createElement("div", {
      className: "console-body",
      id: 'console-font-size-' + this._id
    }, /*#__PURE__*/React.createElement("div", {
      className: "console-scroll-pane-wrapper atom-ide-filterable",
      ref: el => this._consoleScrollPaneEl = el
    }, /*#__PURE__*/React.createElement(_FilterReminder.default, {
      noun: "message",
      nounPlural: "messages",
      filteredRecordCount: this.props.filteredRecordCount,
      onReset: this.props.resetAllFilters
    }), /*#__PURE__*/React.createElement(_OutputTable.default // $FlowFixMe(>=0.53.0) Flow suppress
    , {
      ref: this._handleOutputTable,
      records: this.props.records,
      showSourceLabels: this.props.selectedSourceIds.length > 1,
      fontSize: this.props.fontSize,
      getExecutor: this._getExecutor,
      getProvider: this._getProvider,
      onScroll: this._handleScroll,
      shouldScrollToBottom: this._shouldScrollToBottom
    }), /*#__PURE__*/React.createElement(_NewMessagesNotification.default, {
      visible: this.state.unseenMessages,
      onClick: this._startScrollToBottom
    })), this._renderPrompt()));
  }

  _getMultiLineTip() {
    const {
      currentExecutor
    } = this.props;

    if (currentExecutor == null) {
      return '';
    }

    const keyCombo = process.platform === 'darwin' ? // Option + Enter on Mac
    '\u2325  + \u23CE' : // Shift + Enter on Windows and Linux.
    'Shift + Enter';
    return `Tip: ${keyCombo} to insert a newline`;
  }

  _renderPrompt() {
    const {
      currentExecutor
    } = this.props;

    if (currentExecutor == null) {
      return;
    }

    return /*#__PURE__*/React.createElement("div", {
      className: "console-prompt"
    }, this._renderPromptButton(), /*#__PURE__*/React.createElement(_InputArea.default, {
      ref: component => this._inputArea = component,
      scopeName: this.state.scopeName,
      fontSize: this.props.fontSize,
      onSubmit: this._executePrompt,
      history: this.props.history,
      watchEditor: this.props.watchEditor,
      placeholderText: this._getMultiLineTip()
    }));
  }

  _handleScrollEnd(offsetHeight, scrollHeight, scrollTop) {
    const isScrolledToBottom = this._isScrolledToBottom(offsetHeight, scrollHeight, scrollTop);

    this._isScrolledNearBottom = isScrolledToBottom;

    this._stopScrollToBottom();

    this.setState({
      // TODO: (wbinnssmith) T30771435 this setState depends on current state
      // and should use an updater function rather than an object
      // eslint-disable-next-line react/no-access-state-in-setstate
      unseenMessages: this.state.unseenMessages && !this._isScrolledNearBottom
    });
  }

}

exports.default = ConsoleView;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVWaWV3LmpzIl0sIm5hbWVzIjpbIk1BWElNVU1fU0NST0xMSU5HX1RJTUUiLCJERUZBVUxUX1NDT1BFX05BTUUiLCJjb3VudCIsIkNvbnNvbGVWaWV3IiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiX2NvbnNvbGVTY3JvbGxQYW5lRWwiLCJfY29uc29sZUhlYWRlckNvbXBvbmVudCIsIl9kaXNwb3NhYmxlcyIsIl9leGVjdXRvclNjb3BlRGlzcG9zYWJsZXMiLCJfaXNTY3JvbGxlZE5lYXJCb3R0b20iLCJfaWQiLCJfaW5wdXRBcmVhIiwiX2NvbnRpbnVvdXNseVNjcm9sbFRvQm90dG9tIiwiX3Njcm9sbGluZ1Rocm90dGxlIiwiX291dHB1dFRhYmxlIiwiX2dldEV4ZWN1dG9yIiwiaWQiLCJleGVjdXRvcnMiLCJnZXQiLCJfZ2V0UHJvdmlkZXIiLCJnZXRQcm92aWRlciIsIl9leGVjdXRlUHJvbXB0IiwiY29kZSIsImV4ZWN1dGUiLCJfaGFuZGxlU2Nyb2xsIiwib2Zmc2V0SGVpZ2h0Iiwic2Nyb2xsSGVpZ2h0Iiwic2Nyb2xsVG9wIiwiX2hhbmRsZVNjcm9sbEVuZCIsIl9oYW5kbGVPdXRwdXRUYWJsZSIsInJlZiIsIl9zY3JvbGxUb0JvdHRvbSIsInNjcm9sbFRvQm90dG9tIiwic2V0U3RhdGUiLCJ1bnNlZW5NZXNzYWdlcyIsIl9zdGFydFNjcm9sbFRvQm90dG9tIiwiT2JzZXJ2YWJsZSIsInRpbWVyIiwic3Vic2NyaWJlIiwiX3N0b3BTY3JvbGxUb0JvdHRvbSIsInVuc3Vic2NyaWJlIiwiX3Nob3VsZFNjcm9sbFRvQm90dG9tIiwic3RhdGUiLCJzY29wZU5hbWUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiY29tcG9uZW50RGlkTW91bnQiLCJhZGQiLCJtYWNyb3Rhc2siLCJhdG9tIiwiY29tbWFuZHMiLCJmb2N1cyIsIl9mb2N1c0ZpbHRlciIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiZGlzcG9zZSIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInJlY29yZHMiLCJmb2N1c0ZpbHRlciIsIl9yZW5kZXJQcm9tcHRCdXR0b24iLCJjdXJyZW50RXhlY3V0b3IiLCJvcHRpb25zIiwiQXJyYXkiLCJmcm9tIiwidmFsdWVzIiwibWFwIiwiZXhlY3V0b3IiLCJsYWJlbCIsIm5hbWUiLCJzZWxlY3RFeGVjdXRvciIsIl9pc1Njcm9sbGVkVG9Cb3R0b20iLCJVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyIsIm5leHRQcm9wcyIsImxlbmd0aCIsIm9uRGlkQ2hhbmdlU2NvcGVOYW1lIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwibmV4dFN0YXRlIiwicmVuZGVyIiwiZm9udFNpemUiLCJjbGVhclJlY29yZHMiLCJjcmVhdGVQYXN0ZSIsImludmFsaWRGaWx0ZXJJbnB1dCIsImVuYWJsZVJlZ0V4cEZpbHRlciIsImZpbHRlclRleHQiLCJjb21wb25lbnQiLCJzZWxlY3RlZFNvdXJjZUlkcyIsInNvdXJjZXMiLCJ1cGRhdGVGaWx0ZXIiLCJzZWxlY3RTb3VyY2VzIiwic2VsZWN0ZWRTZXZlcml0aWVzIiwidG9nZ2xlU2V2ZXJpdHkiLCJlbCIsImZpbHRlcmVkUmVjb3JkQ291bnQiLCJyZXNldEFsbEZpbHRlcnMiLCJfcmVuZGVyUHJvbXB0IiwiX2dldE11bHRpTGluZVRpcCIsImtleUNvbWJvIiwicHJvY2VzcyIsInBsYXRmb3JtIiwiaGlzdG9yeSIsIndhdGNoRWRpdG9yIiwiaXNTY3JvbGxlZFRvQm90dG9tIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFtREE7QUFDQSxNQUFNQSxzQkFBc0IsR0FBRyxJQUEvQjtBQUNB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LyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IHR5cGUge0V4ZWN1dG9yLCBTZXZlcml0eSwgUmVjb3JkLCBTb3VyY2UsIFNvdXJjZUluZm99IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHtSZWdFeHBGaWx0ZXJDaGFuZ2V9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XG5cbmltcG9ydCB7bWFjcm90YXNrfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9vYnNlcnZhYmxlJztcbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGUnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuaW1wb3J0IEZpbHRlclJlbWluZGVyIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0ZpbHRlclJlbWluZGVyJztcbmltcG9ydCBPdXRwdXRUYWJsZSBmcm9tICcuL091dHB1dFRhYmxlJztcbmltcG9ydCBDb25zb2xlSGVhZGVyIGZyb20gJy4vQ29uc29sZUhlYWRlcic7XG5pbXBvcnQgSW5wdXRBcmVhIGZyb20gJy4vSW5wdXRBcmVhJztcbmltcG9ydCBQcm9tcHRCdXR0b24gZnJvbSAnLi9Qcm9tcHRCdXR0b24nO1xuaW1wb3J0IE5ld01lc3NhZ2VzTm90aWZpY2F0aW9uIGZyb20gJy4vTmV3TWVzc2FnZXNOb3RpZmljYXRpb24nO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSAnbnVsbHRocm93cyc7XG5pbXBvcnQgc2hhbGxvd0VxdWFsIGZyb20gJ3NoYWxsb3dlcXVhbCc7XG5pbXBvcnQgcmVjb3Jkc0NoYW5nZWQgZnJvbSAnLi4vcmVjb3Jkc0NoYW5nZWQnO1xuaW1wb3J0IFN0eWxlU2hlZXQgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvU3R5bGVTaGVldCc7XG5cbnR5cGUgUHJvcHMgPSB7fFxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxuICBoaXN0b3J5OiBBcnJheTxzdHJpbmc+LFxuICBjbGVhclJlY29yZHM6ICgpID0+IHZvaWQsXG4gIGNyZWF0ZVBhc3RlOiA/KCkgPT4gUHJvbWlzZTx2b2lkPixcbiAgd2F0Y2hFZGl0b3I6ID9hdG9tJEF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yLFxuICBleGVjdXRlOiAoY29kZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjdXJyZW50RXhlY3V0b3I6ID9FeGVjdXRvcixcbiAgZXhlY3V0b3JzOiBNYXA8c3RyaW5nLCBFeGVjdXRvcj4sXG4gIGludmFsaWRGaWx0ZXJJbnB1dDogYm9vbGVhbixcbiAgZW5hYmxlUmVnRXhwRmlsdGVyOiBib29sZWFuLFxuICBzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcbiAgc2VsZWN0RXhlY3V0b3I6IChleGVjdXRvcklkOiBzdHJpbmcpID0+IHZvaWQsXG4gIHNlbGVjdFNvdXJjZXM6IChzb3VyY2VJZHM6IEFycmF5PHN0cmluZz4pID0+IHZvaWQsXG4gIHNvdXJjZXM6IEFycmF5PFNvdXJjZT4sXG4gIHVwZGF0ZUZpbHRlcjogKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKSA9PiB2b2lkLFxuICBnZXRQcm92aWRlcjogKGlkOiBzdHJpbmcpID0+ID9Tb3VyY2VJbmZvLFxuICBmaWx0ZXJlZFJlY29yZENvdW50OiBudW1iZXIsXG4gIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgcmVzZXRBbGxGaWx0ZXJzOiAoKSA9PiB2b2lkLFxuICBmb250U2l6ZTogbnVtYmVyLFxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXG4gIHRvZ2dsZVNldmVyaXR5OiAoc2V2ZXJpdHk6IFNldmVyaXR5KSA9PiB2b2lkLFxufH07XG5cbnR5cGUgU3RhdGUgPSB7XG4gIHVuc2Vlbk1lc3NhZ2VzOiBib29sZWFuLFxuICBzY29wZU5hbWU6IHN0cmluZyxcbn07XG5cbi8vIE1heGltdW0gdGltZSAobXMpIGZvciB0aGUgY29uc29sZSB0byB0cnkgc2Nyb2xsaW5nIHRvIHRoZSBib3R0b20uXG5jb25zdCBNQVhJTVVNX1NDUk9MTElOR19USU1FID0gMzAwMDtcbmNvbnN0IERFRkFVTFRfU0NPUEVfTkFNRSA9ICd0ZXh0LnBsYWluJztcblxubGV0IGNvdW50ID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZVZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHMsIFN0YXRlPiB7XG4gIF9jb25zb2xlU2Nyb2xsUGFuZUVsOiA/SFRNTERpdkVsZW1lbnQ7XG4gIF9jb25zb2xlSGVhZGVyQ29tcG9uZW50OiA/Q29uc29sZUhlYWRlcjtcbiAgX2Rpc3Bvc2FibGVzOiBVbml2ZXJzYWxEaXNwb3NhYmxlO1xuICBfZXhlY3V0b3JTY29wZURpc3Bvc2FibGVzOiBVbml2ZXJzYWxEaXNwb3NhYmxlO1xuICBfaXNTY3JvbGxlZE5lYXJCb3R0b206IGJvb2xlYW47XG4gIF9pZDogbnVtYmVyO1xuICBfaW5wdXRBcmVhOiA/SW5wdXRBcmVhO1xuXG4gIC8vIFVzZWQgd2hlbiBfc2Nyb2xsVG9Cb3R0b20gaXMgY2FsbGVkLiBUaGUgY29uc29sZSBvcHRpbWl6ZXMgbWVzc2FnZSBsb2FkaW5nXG4gIC8vIHNvIHNjcm9sbGluZyB0byB0aGUgYm90dG9tIG9uY2UgZG9lc24ndCBhbHdheXMgc2Nyb2xsIHRvIHRoZSBib3R0b20gc2luY2VcbiAgLy8gbW9yZSBtZXNzYWdlcyBjYW4gYmUgbG9hZGVkIGFmdGVyLlxuICBfY29udGludW91c2x5U2Nyb2xsVG9Cb3R0b206IGJvb2xlYW47XG4gIF9zY3JvbGxpbmdUaHJvdHRsZTogP3J4anMkU3Vic2NyaXB0aW9uO1xuXG4gIF9vdXRwdXRUYWJsZTogP091dHB1dFRhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdW5zZWVuTWVzc2FnZXM6IGZhbHNlLFxuICAgICAgc2NvcGVOYW1lOiBERUZBVUxUX1NDT1BFX05BTUUsXG4gICAgfTtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fZXhlY3V0b3JTY29wZURpc3Bvc2FibGVzID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9pc1Njcm9sbGVkTmVhckJvdHRvbSA9IHRydWU7XG4gICAgdGhpcy5fY29udGludW91c2x5U2Nyb2xsVG9Cb3R0b20gPSBmYWxzZTtcbiAgICB0aGlzLl9pZCA9IGNvdW50Kys7XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoXG4gICAgICAvLyBXYWl0IGZvciBgPE91dHB1dFRhYmxlIC8+YCB0byByZW5kZXIgaXRzZWxmIHZpYSByZWFjdC12aXJ0dWFsaXplZCBiZWZvcmUgc2Nyb2xsaW5nIGFuZFxuICAgICAgLy8gcmUtbWVhc3VyaW5nOyBPdGhlcndpc2UsIHRoZSBzY3JvbGxlZCBsb2NhdGlvbiB3aWxsIGJlIGluYWNjdXJhdGUsIHByZXZlbnRpbmcgdGhlIENvbnNvbGVcbiAgICAgIC8vIGZyb20gYXV0by1zY3JvbGxpbmcuXG4gICAgICBtYWNyb3Rhc2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhcnRTY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgfSksXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGxpbmdUaHJvdHRsZSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fc2Nyb2xsaW5nVGhyb3R0bGUudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG51Y2xpZGUtaW50ZXJuYWwvYXRvbS1hcGlzXG4gICAgICAgICdhdG9tLWlkZS1jb25zb2xlOmZvY3VzLWNvbnNvbGUtcHJvbXB0JzogKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9pbnB1dEFyZWEgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5faW5wdXRBcmVhLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2F0b20tYXBpc1xuICAgICAgICAnYXRvbS1pZGUtY29uc29sZTpzY3JvbGwtdG8tYm90dG9tJzogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3Njcm9sbFRvQm90dG9tKCk7XG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICBudWxsdGhyb3dzKHRoaXMuX2NvbnNvbGVTY3JvbGxQYW5lRWwpLFxuICAgICAgICAnYXRvbS1pZGU6ZmlsdGVyJyxcbiAgICAgICAgKCkgPT4gdGhpcy5fZm9jdXNGaWx0ZXIoKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9leGVjdXRvclNjb3BlRGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICB9XG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBJZiByZWNvcmRzIGFyZSBhZGRlZCB3aGlsZSB3ZSdyZSBzY3JvbGxlZCB0byB0aGUgYm90dG9tIChvciB2ZXJ5IHZlcnkgY2xvc2UsIGF0IGxlYXN0KSxcbiAgICAvLyBhdXRvbWF0aWNhbGx5IHNjcm9sbC5cbiAgICBpZiAoXG4gICAgICB0aGlzLl9pc1Njcm9sbGVkTmVhckJvdHRvbSAmJlxuICAgICAgcmVjb3Jkc0NoYW5nZWQocHJldlByb3BzLnJlY29yZHMsIHRoaXMucHJvcHMucmVjb3JkcylcbiAgICApIHtcbiAgICAgIHRoaXMuX3N0YXJ0U2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gIH1cblxuICBfZm9jdXNGaWx0ZXIoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2NvbnNvbGVIZWFkZXJDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fY29uc29sZUhlYWRlckNvbXBvbmVudC5mb2N1c0ZpbHRlcigpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW5kZXJQcm9tcHRCdXR0b24oKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgICBpbnZhcmlhbnQodGhpcy5wcm9wcy5jdXJyZW50RXhlY3V0b3IgIT0gbnVsbCk7XG4gICAgY29uc3Qge2N1cnJlbnRFeGVjdXRvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBBcnJheS5mcm9tKHRoaXMucHJvcHMuZXhlY3V0b3JzLnZhbHVlcygpKS5tYXAoZXhlY3V0b3IgPT4gKHtcbiAgICAgIGlkOiBleGVjdXRvci5pZCxcbiAgICAgIGxhYmVsOiBleGVjdXRvci5uYW1lLFxuICAgIH0pKTtcbiAgICByZXR1cm4gKFxuICAgICAgPFByb21wdEJ1dHRvblxuICAgICAgICB2YWx1ZT17Y3VycmVudEV4ZWN1dG9yLmlkfVxuICAgICAgICBvbkNoYW5nZT17dGhpcy5wcm9wcy5zZWxlY3RFeGVjdXRvcn1cbiAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgY2hpbGRyZW49e2N1cnJlbnRFeGVjdXRvci5uYW1lfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgX2lzU2Nyb2xsZWRUb0JvdHRvbShcbiAgICBvZmZzZXRIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxUb3A6IG51bWJlcixcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNjcm9sbEhlaWdodCAtIChvZmZzZXRIZWlnaHQgKyBzY3JvbGxUb3ApIDwgNTtcbiAgfVxuXG4gIFVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wczogUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBJZiB0aGUgbWVzc2FnZXMgd2VyZSBjbGVhcmVkLCBoaWRlIHRoZSBub3RpZmljYXRpb24uXG4gICAgaWYgKG5leHRQcm9wcy5yZWNvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5faXNTY3JvbGxlZE5lYXJCb3R0b20gPSB0cnVlO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7dW5zZWVuTWVzc2FnZXM6IGZhbHNlfSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIC8vIElmIHdlIHJlY2VpdmUgbmV3IG1lc3NhZ2VzIGFmdGVyIHdlJ3ZlIHNjcm9sbGVkIGF3YXkgZnJvbSB0aGUgYm90dG9tLCBzaG93IHRoZSBcIm5ld1xuICAgICAgLy8gbWVzc2FnZXNcIiBub3RpZmljYXRpb24uXG4gICAgICAhdGhpcy5faXNTY3JvbGxlZE5lYXJCb3R0b20gJiZcbiAgICAgIHJlY29yZHNDaGFuZ2VkKHRoaXMucHJvcHMucmVjb3JkcywgbmV4dFByb3BzLnJlY29yZHMpXG4gICAgKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHt1bnNlZW5NZXNzYWdlczogdHJ1ZX0pO1xuICAgIH1cblxuICAgIHRoaXMuX2V4ZWN1dG9yU2NvcGVEaXNwb3NhYmxlcy5kaXNwb3NlKCk7XG4gICAgdGhpcy5fZXhlY3V0b3JTY29wZURpc3Bvc2FibGVzID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKTtcbiAgICBmb3IgKGNvbnN0IGV4ZWN1dG9yIG9mIG5leHRQcm9wcy5leGVjdXRvcnMudmFsdWVzKCkpIHtcbiAgICAgIGlmIChleGVjdXRvciAhPSBudWxsICYmIGV4ZWN1dG9yLm9uRGlkQ2hhbmdlU2NvcGVOYW1lICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fZXhlY3V0b3JTY29wZURpc3Bvc2FibGVzLmFkZChcbiAgICAgICAgICBleGVjdXRvci5vbkRpZENoYW5nZVNjb3BlTmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzY29wZU5hbWUgPSBleGVjdXRvci5zY29wZU5hbWUoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICBzY29wZU5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzOiBQcm9wcywgbmV4dFN0YXRlOiBTdGF0ZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICAhc2hhbGxvd0VxdWFsKHRoaXMucHJvcHMsIG5leHRQcm9wcykgfHxcbiAgICAgICFzaGFsbG93RXF1YWwodGhpcy5zdGF0ZSwgbmV4dFN0YXRlKVxuICAgICk7XG4gIH1cblxuICBfZ2V0RXhlY3V0b3IgPSAoaWQ6IHN0cmluZyk6ID9FeGVjdXRvciA9PiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZXhlY3V0b3JzLmdldChpZCk7XG4gIH07XG5cbiAgX2dldFByb3ZpZGVyID0gKGlkOiBzdHJpbmcpOiA/U291cmNlSW5mbyA9PiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZ2V0UHJvdmlkZXIoaWQpO1xuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlXCI+XG4gICAgICAgIDxTdHlsZVNoZWV0XG4gICAgICAgICAgc291cmNlUGF0aD1cImNvbnNvbGUtZm9udC1zdHlsZVwiXG4gICAgICAgICAgcHJpb3JpdHk9ey0xfVxuICAgICAgICAgIGNzcz17YFxuICAgICAgICAgICAgI2NvbnNvbGUtZm9udC1zaXplLSR7dGhpcy5faWR9IHtcbiAgICAgICAgICAgICAgZm9udC1zaXplOiAke3RoaXMucHJvcHMuZm9udFNpemV9cHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYH1cbiAgICAgICAgLz5cbiAgICAgICAgPENvbnNvbGVIZWFkZXJcbiAgICAgICAgICBjbGVhcj17dGhpcy5wcm9wcy5jbGVhclJlY29yZHN9XG4gICAgICAgICAgY3JlYXRlUGFzdGU9e3RoaXMucHJvcHMuY3JlYXRlUGFzdGV9XG4gICAgICAgICAgaW52YWxpZEZpbHRlcklucHV0PXt0aGlzLnByb3BzLmludmFsaWRGaWx0ZXJJbnB1dH1cbiAgICAgICAgICBlbmFibGVSZWdFeHBGaWx0ZXI9e3RoaXMucHJvcHMuZW5hYmxlUmVnRXhwRmlsdGVyfVxuICAgICAgICAgIGZpbHRlclRleHQ9e3RoaXMucHJvcHMuZmlsdGVyVGV4dH1cbiAgICAgICAgICByZWY9e2NvbXBvbmVudCA9PiAodGhpcy5fY29uc29sZUhlYWRlckNvbXBvbmVudCA9IGNvbXBvbmVudCl9XG4gICAgICAgICAgc2VsZWN0ZWRTb3VyY2VJZHM9e3RoaXMucHJvcHMuc2VsZWN0ZWRTb3VyY2VJZHN9XG4gICAgICAgICAgc291cmNlcz17dGhpcy5wcm9wcy5zb3VyY2VzfVxuICAgICAgICAgIG9uRmlsdGVyQ2hhbmdlPXt0aGlzLnByb3BzLnVwZGF0ZUZpbHRlcn1cbiAgICAgICAgICBvblNlbGVjdGVkU291cmNlc0NoYW5nZT17dGhpcy5wcm9wcy5zZWxlY3RTb3VyY2VzfVxuICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XG4gICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XG4gICAgICAgIC8+XG4gICAgICAgIHsvKlxuICAgICAgICAgIFdlIG5lZWQgYW4gZXh0cmEgd3JhcHBlciBlbGVtZW50IGhlcmUgaW4gb3JkZXIgdG8gaGF2ZSB0aGUgbmV3IG1lc3NhZ2VzIG5vdGlmaWNhdGlvbiBzdGlja1xuICAgICAgICAgIHRvIHRoZSBib3R0b20gb2YgdGhlIHNjcm9sbGFibGUgYXJlYSAoYW5kIG5vdCBzY3JvbGwgd2l0aCBpdCkuXG5cbiAgICAgICAgICBjb25zb2xlLWZvbnQtc2l6ZSBpcyBkZWZpbmVkIGluIG1haW4uanMgYW5kIHVwZGF0ZWQgdmlhIGEgdXNlciBzZXR0aW5nXG4gICAgICAgICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtYm9keVwiIGlkPXsnY29uc29sZS1mb250LXNpemUtJyArIHRoaXMuX2lkfT5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJjb25zb2xlLXNjcm9sbC1wYW5lLXdyYXBwZXIgYXRvbS1pZGUtZmlsdGVyYWJsZVwiXG4gICAgICAgICAgICByZWY9e2VsID0+ICh0aGlzLl9jb25zb2xlU2Nyb2xsUGFuZUVsID0gZWwpfT5cbiAgICAgICAgICAgIDxGaWx0ZXJSZW1pbmRlclxuICAgICAgICAgICAgICBub3VuPVwibWVzc2FnZVwiXG4gICAgICAgICAgICAgIG5vdW5QbHVyYWw9XCJtZXNzYWdlc1wiXG4gICAgICAgICAgICAgIGZpbHRlcmVkUmVjb3JkQ291bnQ9e3RoaXMucHJvcHMuZmlsdGVyZWRSZWNvcmRDb3VudH1cbiAgICAgICAgICAgICAgb25SZXNldD17dGhpcy5wcm9wcy5yZXNldEFsbEZpbHRlcnN9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPE91dHB1dFRhYmxlXG4gICAgICAgICAgICAgIC8vICRGbG93Rml4TWUoPj0wLjUzLjApIEZsb3cgc3VwcHJlc3NcbiAgICAgICAgICAgICAgcmVmPXt0aGlzLl9oYW5kbGVPdXRwdXRUYWJsZX1cbiAgICAgICAgICAgICAgcmVjb3Jkcz17dGhpcy5wcm9wcy5yZWNvcmRzfVxuICAgICAgICAgICAgICBzaG93U291cmNlTGFiZWxzPXt0aGlzLnByb3BzLnNlbGVjdGVkU291cmNlSWRzLmxlbmd0aCA+IDF9XG4gICAgICAgICAgICAgIGZvbnRTaXplPXt0aGlzLnByb3BzLmZvbnRTaXplfVxuICAgICAgICAgICAgICBnZXRFeGVjdXRvcj17dGhpcy5fZ2V0RXhlY3V0b3J9XG4gICAgICAgICAgICAgIGdldFByb3ZpZGVyPXt0aGlzLl9nZXRQcm92aWRlcn1cbiAgICAgICAgICAgICAgb25TY3JvbGw9e3RoaXMuX2hhbmRsZVNjcm9sbH1cbiAgICAgICAgICAgICAgc2hvdWxkU2Nyb2xsVG9Cb3R0b209e3RoaXMuX3Nob3VsZFNjcm9sbFRvQm90dG9tfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxOZXdNZXNzYWdlc05vdGlmaWNhdGlvblxuICAgICAgICAgICAgICB2aXNpYmxlPXt0aGlzLnN0YXRlLnVuc2Vlbk1lc3NhZ2VzfVxuICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9zdGFydFNjcm9sbFRvQm90dG9tfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7dGhpcy5fcmVuZGVyUHJvbXB0KCl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIF9nZXRNdWx0aUxpbmVUaXAoKTogc3RyaW5nIHtcbiAgICBjb25zdCB7Y3VycmVudEV4ZWN1dG9yfSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKGN1cnJlbnRFeGVjdXRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIGNvbnN0IGtleUNvbWJvID1cbiAgICAgIHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nXG4gICAgICAgID8gLy8gT3B0aW9uICsgRW50ZXIgb24gTWFjXG4gICAgICAgICAgJ1xcdTIzMjUgICsgXFx1MjNDRSdcbiAgICAgICAgOiAvLyBTaGlmdCArIEVudGVyIG9uIFdpbmRvd3MgYW5kIExpbnV4LlxuICAgICAgICAgICdTaGlmdCArIEVudGVyJztcblxuICAgIHJldHVybiBgVGlwOiAke2tleUNvbWJvfSB0byBpbnNlcnQgYSBuZXdsaW5lYDtcbiAgfVxuXG4gIF9yZW5kZXJQcm9tcHQoKTogP1JlYWN0LkVsZW1lbnQ8YW55PiB7XG4gICAgY29uc3Qge2N1cnJlbnRFeGVjdXRvcn0gPSB0aGlzLnByb3BzO1xuICAgIGlmIChjdXJyZW50RXhlY3V0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXByb21wdFwiPlxuICAgICAgICB7dGhpcy5fcmVuZGVyUHJvbXB0QnV0dG9uKCl9XG4gICAgICAgIDxJbnB1dEFyZWFcbiAgICAgICAgICByZWY9eyhjb21wb25lbnQ6ID9JbnB1dEFyZWEpID0+ICh0aGlzLl9pbnB1dEFyZWEgPSBjb21wb25lbnQpfVxuICAgICAgICAgIHNjb3BlTmFtZT17dGhpcy5zdGF0ZS5zY29wZU5hbWV9XG4gICAgICAgICAgZm9udFNpemU9e3RoaXMucHJvcHMuZm9udFNpemV9XG4gICAgICAgICAgb25TdWJtaXQ9e3RoaXMuX2V4ZWN1dGVQcm9tcHR9XG4gICAgICAgICAgaGlzdG9yeT17dGhpcy5wcm9wcy5oaXN0b3J5fVxuICAgICAgICAgIHdhdGNoRWRpdG9yPXt0aGlzLnByb3BzLndhdGNoRWRpdG9yfVxuICAgICAgICAgIHBsYWNlaG9sZGVyVGV4dD17dGhpcy5fZ2V0TXVsdGlMaW5lVGlwKCl9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgX2V4ZWN1dGVQcm9tcHQgPSAoY29kZTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgdGhpcy5wcm9wcy5leGVjdXRlKGNvZGUpO1xuICAgIC8vIE1ha2VzIHRoZSBjb25zb2xlIHRvIHNjcm9sbCB0byB0aGUgYm90dG9tLlxuICAgIHRoaXMuX2lzU2Nyb2xsZWROZWFyQm90dG9tID0gdHJ1ZTtcbiAgfTtcblxuICBfaGFuZGxlU2Nyb2xsID0gKFxuICAgIG9mZnNldEhlaWdodDogbnVtYmVyLFxuICAgIHNjcm9sbEhlaWdodDogbnVtYmVyLFxuICAgIHNjcm9sbFRvcDogbnVtYmVyLFxuICApOiB2b2lkID0+IHtcbiAgICB0aGlzLl9oYW5kbGVTY3JvbGxFbmQob2Zmc2V0SGVpZ2h0LCBzY3JvbGxIZWlnaHQsIHNjcm9sbFRvcCk7XG4gIH07XG5cbiAgX2hhbmRsZVNjcm9sbEVuZChcbiAgICBvZmZzZXRIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxUb3A6IG51bWJlcixcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgaXNTY3JvbGxlZFRvQm90dG9tID0gdGhpcy5faXNTY3JvbGxlZFRvQm90dG9tKFxuICAgICAgb2Zmc2V0SGVpZ2h0LFxuICAgICAgc2Nyb2xsSGVpZ2h0LFxuICAgICAgc2Nyb2xsVG9wLFxuICAgICk7XG5cbiAgICB0aGlzLl9pc1Njcm9sbGVkTmVhckJvdHRvbSA9IGlzU2Nyb2xsZWRUb0JvdHRvbTtcbiAgICB0aGlzLl9zdG9wU2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIC8vIFRPRE86ICh3YmlubnNzbWl0aCkgVDMwNzcxNDM1IHRoaXMgc2V0U3RhdGUgZGVwZW5kcyBvbiBjdXJyZW50IHN0YXRlXG4gICAgICAvLyBhbmQgc2hvdWxkIHVzZSBhbiB1cGRhdGVyIGZ1bmN0aW9uIHJhdGhlciB0aGFuIGFuIG9iamVjdFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0L25vLWFjY2Vzcy1zdGF0ZS1pbi1zZXRzdGF0ZVxuICAgICAgdW5zZWVuTWVzc2FnZXM6IHRoaXMuc3RhdGUudW5zZWVuTWVzc2FnZXMgJiYgIXRoaXMuX2lzU2Nyb2xsZWROZWFyQm90dG9tLFxuICAgIH0pO1xuICB9XG5cbiAgX2hhbmRsZU91dHB1dFRhYmxlID0gKHJlZjogT3V0cHV0VGFibGUpOiB2b2lkID0+IHtcbiAgICB0aGlzLl9vdXRwdXRUYWJsZSA9IHJlZjtcbiAgfTtcblxuICBfc2Nyb2xsVG9Cb3R0b20gPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKCF0aGlzLl9vdXRwdXRUYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX291dHB1dFRhYmxlLnNjcm9sbFRvQm90dG9tKCk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHt1bnNlZW5NZXNzYWdlczogZmFsc2V9KTtcbiAgfTtcblxuICBfc3RhcnRTY3JvbGxUb0JvdHRvbSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIXRoaXMuX2NvbnRpbnVvdXNseVNjcm9sbFRvQm90dG9tKSB7XG4gICAgICB0aGlzLl9jb250aW51b3VzbHlTY3JvbGxUb0JvdHRvbSA9IHRydWU7XG5cbiAgICAgIHRoaXMuX3Njcm9sbGluZ1Rocm90dGxlID0gT2JzZXJ2YWJsZS50aW1lcihcbiAgICAgICAgTUFYSU1VTV9TQ1JPTExJTkdfVElNRSxcbiAgICAgICkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RvcFNjcm9sbFRvQm90dG9tKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICB9O1xuXG4gIF9zdG9wU2Nyb2xsVG9Cb3R0b20gPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5fY29udGludW91c2x5U2Nyb2xsVG9Cb3R0b20gPSBmYWxzZTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsaW5nVGhyb3R0bGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fc2Nyb2xsaW5nVGhyb3R0bGUudW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH07XG5cbiAgX3Nob3VsZFNjcm9sbFRvQm90dG9tID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgIHJldHVybiB0aGlzLl9pc1Njcm9sbGVkTmVhckJvdHRvbSB8fCB0aGlzLl9jb250aW51b3VzbHlTY3JvbGxUb0JvdHRvbTtcbiAgfTtcbn1cbiJdfQ==