"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _collection = require("@atom-ide-community/nuclide-commons/collection");

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var _nullthrows = _interopRequireDefault(require("nullthrows"));

var _observableDom = require("@atom-ide-community/nuclide-commons-ui/observable-dom");

var _Hasher = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/Hasher"));

var React = _interopRequireWildcard(require("react"));

var _List = _interopRequireDefault(require("react-virtualized/dist/commonjs/List"));

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

var _RecordView = _interopRequireDefault(require("./RecordView"));

var _recordsChanged = _interopRequireDefault(require("../recordsChanged"));

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

/* eslint-enable react/no-unused-prop-types */
// The number of extra rows to render beyond what is visible
const OVERSCAN_COUNT = 5;
const INITIAL_RECORD_HEIGHT = 21;

class OutputTable extends React.Component {
  // This is a <List> from react-virtualized (untyped library)
  // The currently rendered range.
  // ExpressionTreeComponent expects an expansionStateId which is a stable
  // object instance across renders, but is unique across consoles. We
  // technically support multiple consoles in the UI, so here we ensure these
  // references are local to the OutputTable instance.
  constructor(props) {
    super(props);
    this._disposable = void 0;
    this._hasher = void 0;
    this._list = void 0;
    this._wrapper = void 0;
    this._renderedRecords = new Map();
    this._startIndex = void 0;
    this._stopIndex = void 0;
    this._refs = void 0;
    this._heights = new _collection.DefaultWeakMap(() => INITIAL_RECORD_HEIGHT);
    this._expansionStateIds = new _collection.DefaultWeakMap(() => ({}));
    this._heightChanges = new _rxjsCompatUmdMin.Subject();

    this._handleRef = node => {
      this._refs.next(node);
    };

    this._recomputeRowHeights = () => {
      // The react-virtualized List component is provided the row heights
      // through a function, so it has no way of knowing that a row's height
      // has changed unless we explicitly notify it to recompute the heights.
      if (this._list == null) {
        return;
      } // $FlowIgnore Untyped react-virtualized List component method


      this._list.recomputeRowHeights(); // If we are already scrolled to the bottom, scroll to ensure that the scrollbar remains at
      // the bottom. This is important not just for if the last record changes height through user
      // interaction (e.g. expanding a debugger variable), but also because this is the mechanism
      // through which the record's true initial height is reported. Therefore, we may have scrolled
      // to the bottom, and only afterwards received its true height. In this case, it's important
      // that we then scroll to the new bottom.


      if (this.props.shouldScrollToBottom()) {
        this.scrollToBottom();
      }
    };

    this._handleListRender = opts => {
      this._startIndex = opts.startIndex;
      this._stopIndex = opts.stopIndex;
    };

    this._getExecutor = id => {
      return this.props.getExecutor(id);
    };

    this._getProvider = id => {
      return this.props.getProvider(id);
    };

    this._renderRow = rowMetadata => {
      const {
        index,
        style
      } = rowMetadata;
      const record = this.props.records[index];
      const key = record.messageId != null ? `messageId:${record.messageId}` : `recordHash:${this._hasher.getHash(record)}`;
      return /*#__PURE__*/React.createElement("div", {
        key: key,
        className: "console-table-row-wrapper",
        style: style
      }, /*#__PURE__*/React.createElement(_RecordView.default // eslint-disable-next-line nuclide-internal/jsx-simple-callback-refs
      , {
        ref: view => {
          if (view != null) {
            this._renderedRecords.set(record, view);
          } else {
            this._renderedRecords.delete(record);
          }
        },
        getExecutor: this._getExecutor,
        getProvider: this._getProvider,
        record: record,
        expansionStateId: this._expansionStateIds.get(record),
        showSourceLabel: this.props.showSourceLabels,
        onHeightChange: this._handleRecordHeightChange
      }));
    };

    this._getRowHeight = ({
      index
    }) => {
      return this._heights.get(this.props.records[index]);
    };

    this._handleTableWrapper = tableWrapper => {
      this._wrapper = tableWrapper;
    };

    this._handleListRef = listRef => {
      const previousValue = this._list;
      this._list = listRef; // The child rows render before this ref gets set. So, if we are coming from
      // a state where the ref was null, we should ensure we notify
      // react-virtualized that we have measurements.

      if (previousValue == null && this._list != null) {
        this._heightChanges.next(null);
      }
    };

    this._handleResize = (height, width) => {
      if (height === this.state.height && width === this.state.width) {
        return;
      }

      this.setState({
        width,
        height
      }); // When this component resizes, the inner records will
      // also resize and potentially have their heights change
      // So we measure all of their heights again here

      this._renderedRecords.forEach(recordView => recordView.measureAndNotifyHeight());
    };

    this._handleRecordHeightChange = (record, newHeight) => {
      const oldHeight = this._heights.get(record);

      if (oldHeight !== newHeight) {
        this._heights.set(record, newHeight);

        this._heightChanges.next(null);
      }
    };

    this._onScroll = ({
      clientHeight,
      scrollHeight,
      scrollTop
    }) => {
      this.props.onScroll(clientHeight, scrollHeight, scrollTop);
    };

    this._disposable = new _UniversalDisposable.default();
    this._hasher = new _Hasher.default();
    this.state = {
      width: 0,
      height: 0
    };
    this._startIndex = 0;
    this._stopIndex = 0;
    this._refs = new _rxjsCompatUmdMin.Subject();

    this._disposable.add(this._heightChanges.subscribe(() => {
      // Theoretically we should be able to (trailing) throttle this to once
      // per render/paint using microtask, but I haven't been able to get it
      // to work without seeing visible flashes of collapsed output.
      this._recomputeRowHeights();
    }), this._refs.filter(Boolean).switchMap(node => new _observableDom.ResizeObservable((0, _nullthrows.default)(node)).mapTo(node)).subscribe(node => {
      const {
        offsetHeight,
        offsetWidth
      } = (0, _nullthrows.default)(node);

      this._handleResize(offsetHeight, offsetWidth);
    }));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this._list != null && (0, _recordsChanged.default)(prevProps.records, this.props.records)) {
      // $FlowIgnore Untyped react-virtualized List method
      this._list.recomputeRowHeights();
    }

    if (prevProps.fontSize !== this.props.fontSize) {
      this._renderedRecords.forEach(recordView => recordView.measureAndNotifyHeight());
    }
  }

  componentWillUnmount() {
    this._disposable.dispose();
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "console-table-wrapper",
      ref: this._handleRef,
      tabIndex: "1"
    }, this._containerRendered() ? /*#__PURE__*/React.createElement(_List.default // $FlowFixMe(>=0.53.0) Flow suppress
    , {
      ref: this._handleListRef,
      height: this.state.height,
      width: this.state.width,
      rowCount: this.props.records.length,
      rowHeight: this._getRowHeight,
      rowRenderer: this._renderRow,
      overscanRowCount: OVERSCAN_COUNT,
      onScroll: this._onScroll,
      onRowsRendered: this._handleListRender
    }) : null);
  }

  scrollToBottom() {
    if (this._list != null) {
      // $FlowIgnore Untyped react-virtualized List method
      this._list.scrollToRow(this.props.records.length - 1);
    }
  }

  _containerRendered() {
    return this.state.width !== 0 && this.state.height !== 0;
  }

}

exports.default = OutputTable;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk91dHB1dFRhYmxlLmpzIl0sIm5hbWVzIjpbIk9WRVJTQ0FOX0NPVU5UIiwiSU5JVElBTF9SRUNPUkRfSEVJR0hUIiwiT3V0cHV0VGFibGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfZGlzcG9zYWJsZSIsIl9oYXNoZXIiLCJfbGlzdCIsIl93cmFwcGVyIiwiX3JlbmRlcmVkUmVjb3JkcyIsIk1hcCIsIl9zdGFydEluZGV4IiwiX3N0b3BJbmRleCIsIl9yZWZzIiwiX2hlaWdodHMiLCJEZWZhdWx0V2Vha01hcCIsIl9leHBhbnNpb25TdGF0ZUlkcyIsIl9oZWlnaHRDaGFuZ2VzIiwiU3ViamVjdCIsIl9oYW5kbGVSZWYiLCJub2RlIiwibmV4dCIsIl9yZWNvbXB1dGVSb3dIZWlnaHRzIiwicmVjb21wdXRlUm93SGVpZ2h0cyIsInNob3VsZFNjcm9sbFRvQm90dG9tIiwic2Nyb2xsVG9Cb3R0b20iLCJfaGFuZGxlTGlzdFJlbmRlciIsIm9wdHMiLCJzdGFydEluZGV4Iiwic3RvcEluZGV4IiwiX2dldEV4ZWN1dG9yIiwiaWQiLCJnZXRFeGVjdXRvciIsIl9nZXRQcm92aWRlciIsImdldFByb3ZpZGVyIiwiX3JlbmRlclJvdyIsInJvd01ldGFkYXRhIiwiaW5kZXgiLCJzdHlsZSIsInJlY29yZCIsInJlY29yZHMiLCJrZXkiLCJtZXNzYWdlSWQiLCJnZXRIYXNoIiwidmlldyIsInNldCIsImRlbGV0ZSIsImdldCIsInNob3dTb3VyY2VMYWJlbHMiLCJfaGFuZGxlUmVjb3JkSGVpZ2h0Q2hhbmdlIiwiX2dldFJvd0hlaWdodCIsIl9oYW5kbGVUYWJsZVdyYXBwZXIiLCJ0YWJsZVdyYXBwZXIiLCJfaGFuZGxlTGlzdFJlZiIsImxpc3RSZWYiLCJwcmV2aW91c1ZhbHVlIiwiX2hhbmRsZVJlc2l6ZSIsImhlaWdodCIsIndpZHRoIiwic3RhdGUiLCJzZXRTdGF0ZSIsImZvckVhY2giLCJyZWNvcmRWaWV3IiwibWVhc3VyZUFuZE5vdGlmeUhlaWdodCIsIm5ld0hlaWdodCIsIm9sZEhlaWdodCIsIl9vblNjcm9sbCIsImNsaWVudEhlaWdodCIsInNjcm9sbEhlaWdodCIsInNjcm9sbFRvcCIsIm9uU2Nyb2xsIiwiVW5pdmVyc2FsRGlzcG9zYWJsZSIsIkhhc2hlciIsImFkZCIsInN1YnNjcmliZSIsImZpbHRlciIsIkJvb2xlYW4iLCJzd2l0Y2hNYXAiLCJSZXNpemVPYnNlcnZhYmxlIiwibWFwVG8iLCJvZmZzZXRIZWlnaHQiLCJvZmZzZXRXaWR0aCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInByZXZTdGF0ZSIsImZvbnRTaXplIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwicmVuZGVyIiwiX2NvbnRhaW5lclJlbmRlcmVkIiwibGVuZ3RoIiwic2Nyb2xsVG9Sb3ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFjQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUF2QkE7Ozs7Ozs7Ozs7OztBQStEQTtBQUVBO0FBQ0EsTUFBTUEsY0FBYyxHQUFHLENBQXZCO0FBQ0EsTUFBTUMscUJBQXFCLEdBQUcsRUFBOUI7O0FBRWUsTUFBTUMsV0FBTixTQUEwQkMsS0FBSyxDQUFDQyxTQUFoQyxDQUF3RDtBQUdyRTtBQUtBO0FBT0E7QUFDQTtBQUNBO0FBQ0E7QUFNQUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQWU7QUFDeEIsVUFBTUEsS0FBTjtBQUR3QixTQXZCMUJDLFdBdUIwQjtBQUFBLFNBdEIxQkMsT0FzQjBCO0FBQUEsU0FwQjFCQyxLQW9CMEI7QUFBQSxTQW5CMUJDLFFBbUIwQjtBQUFBLFNBbEIxQkMsZ0JBa0IwQixHQWxCa0IsSUFBSUMsR0FBSixFQWtCbEI7QUFBQSxTQWYxQkMsV0FlMEI7QUFBQSxTQWQxQkMsVUFjMEI7QUFBQSxTQWIxQkMsS0FhMEI7QUFBQSxTQVoxQkMsUUFZMEIsR0FaaUIsSUFBSUMsMEJBQUosQ0FD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RXJDLGNBUnBCO0FBU0UsTUFBQSxRQUFRLEVBQUUsS0FBS29FLFNBVGpCO0FBVUUsTUFBQSxjQUFjLEVBQUUsS0FBS3hDO0FBVnZCLE1BREQsR0FhRyxJQWROLENBREY7QUFrQkQ7O0FBNEJERCxFQUFBQSxjQUFjLEdBQVM7QUFDckIsUUFBSSxLQUFLbEIsS0FBTCxJQUFjLElBQWxCLEVBQXdCO0FBQ3RCO0FBQ0EsV0FBS0EsS0FBTCxDQUFXb0YsV0FBWCxDQUF1QixLQUFLdkYsS0FBTCxDQUFXb0MsT0FBWCxDQUFtQmtELE1BQW5CLEdBQTRCLENBQW5EO0FBQ0Q7QUFDRjs7QUF3Q0RELEVBQUFBLGtCQUFrQixHQUFZO0FBQzVCLFdBQU8sS0FBSzlCLEtBQUwsQ0FBV0QsS0FBWCxLQUFxQixDQUFyQixJQUEwQixLQUFLQyxLQUFMLENBQVdGLE1BQVgsS0FBc0IsQ0FBdkQ7QUFDRDs7QUF6S29FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IHR5cGUge0V4ZWN1dG9yLCBSZWNvcmQsIFNvdXJjZUluZm99IGZyb20gJy4uL3R5cGVzJztcblxuaW1wb3J0IHtEZWZhdWx0V2Vha01hcH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvY29sbGVjdGlvbic7XG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcbmltcG9ydCBudWxsVGhyb3dzIGZyb20gJ251bGx0aHJvd3MnO1xuaW1wb3J0IHtSZXNpemVPYnNlcnZhYmxlfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9vYnNlcnZhYmxlLWRvbSc7XG5pbXBvcnQgSGFzaGVyIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL0hhc2hlcic7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgTGlzdCBmcm9tICdyZWFjdC12aXJ0dWFsaXplZC9kaXN0L2NvbW1vbmpzL0xpc3QnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuaW1wb3J0IFJlY29yZFZpZXcgZnJvbSAnLi9SZWNvcmRWaWV3JztcbmltcG9ydCByZWNvcmRzQ2hhbmdlZCBmcm9tICcuLi9yZWNvcmRzQ2hhbmdlZCc7XG5cbnR5cGUgUHJvcHMgPSB7fFxuICByZWNvcmRzOiBBcnJheTxSZWNvcmQ+LFxuICBzaG93U291cmNlTGFiZWxzOiBib29sZWFuLFxuICBmb250U2l6ZTogbnVtYmVyLFxuICBnZXRFeGVjdXRvcjogKGlkOiBzdHJpbmcpID0+ID9FeGVjdXRvcixcbiAgZ2V0UHJvdmlkZXI6IChpZDogc3RyaW5nKSA9PiA/U291cmNlSW5mbyxcbiAgb25TY3JvbGw6IChcbiAgICBvZmZzZXRIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxIZWlnaHQ6IG51bWJlcixcbiAgICBzY3JvbGxUb3A6IG51bWJlcixcbiAgKSA9PiB2b2lkLFxuICBzaG91bGRTY3JvbGxUb0JvdHRvbTogKCkgPT4gYm9vbGVhbixcbnx9O1xuXG50eXBlIFN0YXRlID0ge3xcbiAgd2lkdGg6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG58fTtcblxudHlwZSBSb3dSZW5kZXJlclBhcmFtcyA9IHt8XG4gIGluZGV4OiBudW1iZXIsXG4gIGtleTogc3RyaW5nLFxuICBzdHlsZTogT2JqZWN0LFxuICBpc1Njcm9sbGluZzogYm9vbGVhbixcbnx9O1xuXG50eXBlIFJvd0hlaWdodFBhcmFtcyA9IHt8XG4gIC8vIFRoZXNlIGFyZSBub3QgcHJvcHMgdG8gYSBjb21wb25lbnRcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0L25vLXVudXNlZC1wcm9wLXR5cGVzXG4gIGluZGV4OiBudW1iZXIsXG58fTtcblxuLyogZXNsaW50LWRpc2FibGUgcmVhY3Qvbm8tdW51c2VkLXByb3AtdHlwZXMgKi9cbnR5cGUgT25TY3JvbGxQYXJhbXMgPSB7fFxuICBjbGllbnRIZWlnaHQ6IG51bWJlcixcbiAgc2Nyb2xsSGVpZ2h0OiBudW1iZXIsXG4gIHNjcm9sbFRvcDogbnVtYmVyLFxufH07XG4vKiBlc2xpbnQtZW5hYmxlIHJlYWN0L25vLXVudXNlZC1wcm9wLXR5cGVzICovXG5cbi8vIFRoZSBudW1iZXIgb2YgZXh0cmEgcm93cyB0byByZW5kZXIgYmV5b25kIHdoYXQgaXMgdmlzaWJsZVxuY29uc3QgT1ZFUlNDQU5fQ09VTlQgPSA1O1xuY29uc3QgSU5JVElBTF9SRUNPUkRfSEVJR0hUID0gMjE7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dHB1dFRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzLCBTdGF0ZT4ge1xuICBfZGlzcG9zYWJsZTogVW5pdmVyc2FsRGlzcG9zYWJsZTtcbiAgX2hhc2hlcjogSGFzaGVyPFJlY29yZD47XG4gIC8vIFRoaXMgaXMgYSA8TGlzdD4gZnJvbSByZWFjdC12aXJ0dWFsaXplZCAodW50eXBlZCBsaWJyYXJ5KVxuICBfbGlzdDogP1JlYWN0LkVsZW1lbnQ8YW55PjtcbiAgX3dyYXBwZXI6ID9IVE1MRWxlbWVudDtcbiAgX3JlbmRlcmVkUmVjb3JkczogTWFwPFJlY29yZCwgUmVjb3JkVmlldz4gPSBuZXcgTWFwKCk7XG5cbiAgLy8gVGhlIGN1cnJlbnRseSByZW5kZXJlZCByYW5nZS5cbiAgX3N0YXJ0SW5kZXg6IG51bWJlcjtcbiAgX3N0b3BJbmRleDogbnVtYmVyO1xuICBfcmVmczogU3ViamVjdDw/SFRNTEVsZW1lbnQ+O1xuICBfaGVpZ2h0czogRGVmYXVsdFdlYWtNYXA8UmVjb3JkLCBudW1iZXI+ID0gbmV3IERlZmF1bHRXZWFrTWFwKFxuICAgICgpID0+IElOSVRJQUxfUkVDT1JEX0hFSUdIVCxcbiAgKTtcbiAgLy8gRXhwcmVzc2lvblRyZWVDb21wb25lbnQgZXhwZWN0cyBhbiBleHBhbnNpb25TdGF0ZUlkIHdoaWNoIGlzIGEgc3RhYmxlXG4gIC8vIG9iamVjdCBpbnN0YW5jZSBhY3Jvc3MgcmVuZGVycywgYnV0IGlzIHVuaXF1ZSBhY3Jvc3MgY29uc29sZXMuIFdlXG4gIC8vIHRlY2huaWNhbGx5IHN1cHBvcnQgbXVsdGlwbGUgY29uc29sZXMgaW4gdGhlIFVJLCBzbyBoZXJlIHdlIGVuc3VyZSB0aGVzZVxuICAvLyByZWZlcmVuY2VzIGFyZSBsb2NhbCB0byB0aGUgT3V0cHV0VGFibGUgaW5zdGFuY2UuXG4gIF9leHBhbnNpb25TdGF0ZUlkczogRGVmYXVsdFdlYWtNYXA8UmVjb3JkLCBPYmplY3Q+ID0gbmV3IERlZmF1bHRXZWFrTWFwKFxuICAgICgpID0+ICh7fSksXG4gICk7XG4gIF9oZWlnaHRDaGFuZ2VzOiBTdWJqZWN0PG51bGw+ID0gbmV3IFN1YmplY3QoKTtcblxuICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5faGFzaGVyID0gbmV3IEhhc2hlcigpO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB3aWR0aDogMCxcbiAgICAgIGhlaWdodDogMCxcbiAgICB9O1xuICAgIHRoaXMuX3N0YXJ0SW5kZXggPSAwO1xuICAgIHRoaXMuX3N0b3BJbmRleCA9IDA7XG4gICAgdGhpcy5fcmVmcyA9IG5ldyBTdWJqZWN0KCk7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXG4gICAgICB0aGlzLl9oZWlnaHRDaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIC8vIFRoZW9yZXRpY2FsbHkgd2Ugc2hvdWxkIGJlIGFibGUgdG8gKHRyYWlsaW5nKSB0aHJvdHRsZSB0aGlzIHRvIG9uY2VcbiAgICAgICAgLy8gcGVyIHJlbmRlci9wYWludCB1c2luZyBtaWNyb3Rhc2ssIGJ1dCBJIGhhdmVuJ3QgYmVlbiBhYmxlIHRvIGdldCBpdFxuICAgICAgICAvLyB0byB3b3JrIHdpdGhvdXQgc2VlaW5nIHZpc2libGUgZmxhc2hlcyBvZiBjb2xsYXBzZWQgb3V0cHV0LlxuICAgICAgICB0aGlzLl9yZWNvbXB1dGVSb3dIZWlnaHRzKCk7XG4gICAgICB9KSxcbiAgICAgIHRoaXMuX3JlZnNcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAuc3dpdGNoTWFwKG5vZGUgPT4gbmV3IFJlc2l6ZU9ic2VydmFibGUobnVsbFRocm93cyhub2RlKSkubWFwVG8obm9kZSkpXG4gICAgICAgIC5zdWJzY3JpYmUobm9kZSA9PiB7XG4gICAgICAgICAgY29uc3Qge29mZnNldEhlaWdodCwgb2Zmc2V0V2lkdGh9ID0gbnVsbFRocm93cyhub2RlKTtcbiAgICAgICAgICB0aGlzLl9oYW5kbGVSZXNpemUob2Zmc2V0SGVpZ2h0LCBvZmZzZXRXaWR0aCk7XG4gICAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBQcm9wcywgcHJldlN0YXRlOiBTdGF0ZSk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgIHRoaXMuX2xpc3QgIT0gbnVsbCAmJlxuICAgICAgcmVjb3Jkc0NoYW5nZWQocHJldlByb3BzLnJlY29yZHMsIHRoaXMucHJvcHMucmVjb3JkcylcbiAgICApIHtcbiAgICAgIC8vICRGbG93SWdub3JlIFVudHlwZWQgcmVhY3QtdmlydHVhbGl6ZWQgTGlzdCBtZXRob2RcbiAgICAgIHRoaXMuX2xpc3QucmVjb21wdXRlUm93SGVpZ2h0cygpO1xuICAgIH1cbiAgICBpZiAocHJldlByb3BzLmZvbnRTaXplICE9PSB0aGlzLnByb3BzLmZvbnRTaXplKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlZFJlY29yZHMuZm9yRWFjaChyZWNvcmRWaWV3ID0+XG4gICAgICAgIHJlY29yZFZpZXcubWVhc3VyZUFuZE5vdGlmeUhlaWdodCgpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIF9oYW5kbGVSZWYgPSAobm9kZTogP0hUTUxFbGVtZW50KSA9PiB7XG4gICAgdGhpcy5fcmVmcy5uZXh0KG5vZGUpO1xuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXRhYmxlLXdyYXBwZXJcIiByZWY9e3RoaXMuX2hhbmRsZVJlZn0gdGFiSW5kZXg9XCIxXCI+XG4gICAgICAgIHt0aGlzLl9jb250YWluZXJSZW5kZXJlZCgpID8gKFxuICAgICAgICAgIDxMaXN0XG4gICAgICAgICAgICAvLyAkRmxvd0ZpeE1lKD49MC41My4wKSBGbG93IHN1cHByZXNzXG4gICAgICAgICAgICByZWY9e3RoaXMuX2hhbmRsZUxpc3RSZWZ9XG4gICAgICAgICAgICBoZWlnaHQ9e3RoaXMuc3RhdGUuaGVpZ2h0fVxuICAgICAgICAgICAgd2lkdGg9e3RoaXMuc3RhdGUud2lkdGh9XG4gICAgICAgICAgICByb3dDb3VudD17dGhpcy5wcm9wcy5yZWNvcmRzLmxlbmd0aH1cbiAgICAgICAgICAgIHJvd0hlaWdodD17dGhpcy5fZ2V0Um93SGVpZ2h0fVxuICAgICAgICAgICAgcm93UmVuZGVyZXI9e3RoaXMuX3JlbmRlclJvd31cbiAgICAgICAgICAgIG92ZXJzY2FuUm93Q291bnQ9e09WRVJTQ0FOX0NPVU5UfVxuICAgICAgICAgICAgb25TY3JvbGw9e3RoaXMuX29uU2Nyb2xsfVxuICAgICAgICAgICAgb25Sb3dzUmVuZGVyZWQ9e3RoaXMuX2hhbmRsZUxpc3RSZW5kZXJ9XG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgX3JlY29tcHV0ZVJvd0hlaWdodHMgPSAoKSA9PiB7XG4gICAgLy8gVGhlIHJlYWN0LXZpcnR1YWxpemVkIExpc3QgY29tcG9uZW50IGlzIHByb3ZpZGVkIHRoZSByb3cgaGVpZ2h0c1xuICAgIC8vIHRocm91Z2ggYSBmdW5jdGlvbiwgc28gaXQgaGFzIG5vIHdheSBvZiBrbm93aW5nIHRoYXQgYSByb3cncyBoZWlnaHRcbiAgICAvLyBoYXMgY2hhbmdlZCB1bmxlc3Mgd2UgZXhwbGljaXRseSBub3RpZnkgaXQgdG8gcmVjb21wdXRlIHRoZSBoZWlnaHRzLlxuICAgIGlmICh0aGlzLl9saXN0ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gJEZsb3dJZ25vcmUgVW50eXBlZCByZWFjdC12aXJ0dWFsaXplZCBMaXN0IGNvbXBvbmVudCBtZXRob2RcbiAgICB0aGlzLl9saXN0LnJlY29tcHV0ZVJvd0hlaWdodHMoKTtcblxuICAgIC8vIElmIHdlIGFyZSBhbHJlYWR5IHNjcm9sbGVkIHRvIHRoZSBib3R0b20sIHNjcm9sbCB0byBlbnN1cmUgdGhhdCB0aGUgc2Nyb2xsYmFyIHJlbWFpbnMgYXRcbiAgICAvLyB0aGUgYm90dG9tLiBUaGlzIGlzIGltcG9ydGFudCBub3QganVzdCBmb3IgaWYgdGhlIGxhc3QgcmVjb3JkIGNoYW5nZXMgaGVpZ2h0IHRocm91Z2ggdXNlclxuICAgIC8vIGludGVyYWN0aW9uIChlLmcuIGV4cGFuZGluZyBhIGRlYnVnZ2VyIHZhcmlhYmxlKSwgYnV0IGFsc28gYmVjYXVzZSB0aGlzIGlzIHRoZSBtZWNoYW5pc21cbiAgICAvLyB0aHJvdWdoIHdoaWNoIHRoZSByZWNvcmQncyB0cnVlIGluaXRpYWwgaGVpZ2h0IGlzIHJlcG9ydGVkLiBUaGVyZWZvcmUsIHdlIG1heSBoYXZlIHNjcm9sbGVkXG4gICAgLy8gdG8gdGhlIGJvdHRvbSwgYW5kIG9ubHkgYWZ0ZXJ3YXJkcyByZWNlaXZlZCBpdHMgdHJ1ZSBoZWlnaHQuIEluIHRoaXMgY2FzZSwgaXQncyBpbXBvcnRhbnRcbiAgICAvLyB0aGF0IHdlIHRoZW4gc2Nyb2xsIHRvIHRoZSBuZXcgYm90dG9tLlxuICAgIGlmICh0aGlzLnByb3BzLnNob3VsZFNjcm9sbFRvQm90dG9tKCkpIHtcbiAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gIH07XG5cbiAgX2hhbmRsZUxpc3RSZW5kZXIgPSAob3B0czoge3N0YXJ0SW5kZXg6IG51bWJlciwgc3RvcEluZGV4OiBudW1iZXJ9KTogdm9pZCA9PiB7XG4gICAgdGhpcy5fc3RhcnRJbmRleCA9IG9wdHMuc3RhcnRJbmRleDtcbiAgICB0aGlzLl9zdG9wSW5kZXggPSBvcHRzLnN0b3BJbmRleDtcbiAgfTtcblxuICBzY3JvbGxUb0JvdHRvbSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fbGlzdCAhPSBudWxsKSB7XG4gICAgICAvLyAkRmxvd0lnbm9yZSBVbnR5cGVkIHJlYWN0LXZpcnR1YWxpemVkIExpc3QgbWV0aG9kXG4gICAgICB0aGlzLl9saXN0LnNjcm9sbFRvUm93KHRoaXMucHJvcHMucmVjb3Jkcy5sZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0RXhlY3V0b3IgPSAoaWQ6IHN0cmluZyk6ID9FeGVjdXRvciA9PiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuZ2V0RXhlY3V0b3IoaWQpO1xuICB9O1xuXG4gIF9nZXRQcm92aWRlciA9IChpZDogc3RyaW5nKTogP1NvdXJjZUluZm8gPT4ge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmdldFByb3ZpZGVyKGlkKTtcbiAgfTtcblxuICBfcmVuZGVyUm93ID0gKHJvd01ldGFkYXRhOiBSb3dSZW5kZXJlclBhcmFtcyk6IFJlYWN0LkVsZW1lbnQ8YW55PiA9PiB7XG4gICAgY29uc3Qge2luZGV4LCBzdHlsZX0gPSByb3dNZXRhZGF0YTtcbiAgICBjb25zdCByZWNvcmQgPSB0aGlzLnByb3BzLnJlY29yZHNbaW5kZXhdO1xuICAgIGNvbnN0IGtleSA9XG4gICAgICByZWNvcmQubWVzc2FnZUlkICE9IG51bGxcbiAgICAgICAgPyBgbWVzc2FnZUlkOiR7cmVjb3JkLm1lc3NhZ2VJZH1gXG4gICAgICAgIDogYHJlY29yZEhhc2g6JHt0aGlzLl9oYXNoZXIuZ2V0SGFzaChyZWNvcmQpfWA7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBrZXk9e2tleX0gY2xhc3NOYW1lPVwiY29uc29sZS10YWJsZS1yb3ctd3JhcHBlclwiIHN0eWxlPXtzdHlsZX0+XG4gICAgICAgIDxSZWNvcmRWaWV3XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG51Y2xpZGUtaW50ZXJuYWwvanN4LXNpbXBsZS1jYWxsYmFjay1yZWZzXG4gICAgICAgICAgcmVmPXsodmlldzogP1JlY29yZFZpZXcpID0+IHtcbiAgICAgICAgICAgIGlmICh2aWV3ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZWRSZWNvcmRzLnNldChyZWNvcmQsIHZpZXcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZWRSZWNvcmRzLmRlbGV0ZShyZWNvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH19XG4gICAgICAgICAgZ2V0RXhlY3V0b3I9e3RoaXMuX2dldEV4ZWN1dG9yfVxuICAgICAgICAgIGdldFByb3ZpZGVyPXt0aGlzLl9nZXRQcm92aWRlcn1cbiAgICAgICAgICByZWNvcmQ9e3JlY29yZH1cbiAgICAgICAgICBleHBhbnNpb25TdGF0ZUlkPXt0aGlzLl9leHBhbnNpb25TdGF0ZUlkcy5nZXQocmVjb3JkKX1cbiAgICAgICAgICBzaG93U291cmNlTGFiZWw9e3RoaXMucHJvcHMuc2hvd1NvdXJjZUxhYmVsc31cbiAgICAgICAgICBvbkhlaWdodENoYW5nZT17dGhpcy5faGFuZGxlUmVjb3JkSGVpZ2h0Q2hhbmdlfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfTtcblxuICBfY29udGFpbmVyUmVuZGVyZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUud2lkdGggIT09IDAgJiYgdGhpcy5zdGF0ZS5oZWlnaHQgIT09IDA7XG4gIH1cblxuICBfZ2V0Um93SGVpZ2h0ID0gKHtpbmRleH06IFJvd0hlaWdodFBhcmFtcyk6IG51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuX2hlaWdodHMuZ2V0KHRoaXMucHJvcHMucmVjb3Jkc1tpbmRleF0pO1xuICB9O1xuXG4gIF9oYW5kbGVUYWJsZVdyYXBwZXIgPSAodGFibGVXcmFwcGVyOiBIVE1MRWxlbWVudCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuX3dyYXBwZXIgPSB0YWJsZVdyYXBwZXI7XG4gIH07XG5cbiAgX2hhbmRsZUxpc3RSZWYgPSAobGlzdFJlZjogUmVhY3QuRWxlbWVudDxhbnk+KTogdm9pZCA9PiB7XG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IHRoaXMuX2xpc3Q7XG4gICAgdGhpcy5fbGlzdCA9IGxpc3RSZWY7XG5cbiAgICAvLyBUaGUgY2hpbGQgcm93cyByZW5kZXIgYmVmb3JlIHRoaXMgcmVmIGdldHMgc2V0LiBTbywgaWYgd2UgYXJlIGNvbWluZyBmcm9tXG4gICAgLy8gYSBzdGF0ZSB3aGVyZSB0aGUgcmVmIHdhcyBudWxsLCB3ZSBzaG91bGQgZW5zdXJlIHdlIG5vdGlmeVxuICAgIC8vIHJlYWN0LXZpcnR1YWxpemVkIHRoYXQgd2UgaGF2ZSBtZWFzdXJlbWVudHMuXG4gICAgaWYgKHByZXZpb3VzVmFsdWUgPT0gbnVsbCAmJiB0aGlzLl9saXN0ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2hlaWdodENoYW5nZXMubmV4dChudWxsKTtcbiAgICB9XG4gIH07XG5cbiAgX2hhbmRsZVJlc2l6ZSA9IChoZWlnaHQ6IG51bWJlciwgd2lkdGg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIGlmIChoZWlnaHQgPT09IHRoaXMuc3RhdGUuaGVpZ2h0ICYmIHdpZHRoID09PSB0aGlzLnN0YXRlLndpZHRoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgfSk7XG5cbiAgICAvLyBXaGVuIHRoaXMgY29tcG9uZW50IHJlc2l6ZXMsIHRoZSBpbm5lciByZWNvcmRzIHdpbGxcbiAgICAvLyBhbHNvIHJlc2l6ZSBhbmQgcG90ZW50aWFsbHkgaGF2ZSB0aGVpciBoZWlnaHRzIGNoYW5nZVxuICAgIC8vIFNvIHdlIG1lYXN1cmUgYWxsIG9mIHRoZWlyIGhlaWdodHMgYWdhaW4gaGVyZVxuICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5mb3JFYWNoKHJlY29yZFZpZXcgPT5cbiAgICAgIHJlY29yZFZpZXcubWVhc3VyZUFuZE5vdGlmeUhlaWdodCgpLFxuICAgICk7XG4gIH07XG5cbiAgX2hhbmRsZVJlY29yZEhlaWdodENoYW5nZSA9IChyZWNvcmQ6IFJlY29yZCwgbmV3SGVpZ2h0OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBjb25zdCBvbGRIZWlnaHQgPSB0aGlzLl9oZWlnaHRzLmdldChyZWNvcmQpO1xuICAgIGlmIChvbGRIZWlnaHQgIT09IG5ld0hlaWdodCkge1xuICAgICAgdGhpcy5faGVpZ2h0cy5zZXQocmVjb3JkLCBuZXdIZWlnaHQpO1xuICAgICAgdGhpcy5faGVpZ2h0Q2hhbmdlcy5uZXh0KG51bGwpO1xuICAgIH1cbiAgfTtcblxuICBfb25TY3JvbGwgPSAoe1xuICAgIGNsaWVudEhlaWdodCxcbiAgICBzY3JvbGxIZWlnaHQsXG4gICAgc2Nyb2xsVG9wLFxuICB9OiBPblNjcm9sbFBhcmFtcyk6IHZvaWQgPT4ge1xuICAgIHRoaXMucHJvcHMub25TY3JvbGwoY2xpZW50SGVpZ2h0LCBzY3JvbGxIZWlnaHQsIHNjcm9sbFRvcCk7XG4gIH07XG59XG4iXX0=