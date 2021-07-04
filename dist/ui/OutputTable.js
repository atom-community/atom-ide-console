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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk91dHB1dFRhYmxlLmpzIl0sIm5hbWVzIjpbIk9WRVJTQ0FOX0NPVU5UIiwiSU5JVElBTF9SRUNPUkRfSEVJR0hUIiwiT3V0cHV0VGFibGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfZGlzcG9zYWJsZSIsIl9oYXNoZXIiLCJfbGlzdCIsIl93cmFwcGVyIiwiX3JlbmRlcmVkUmVjb3JkcyIsIk1hcCIsIl9zdGFydEluZGV4IiwiX3N0b3BJbmRleCIsIl9yZWZzIiwiX2hlaWdodHMiLCJEZWZhdWx0V2Vha01hcCIsIl9leHBhbnNpb25TdGF0ZUlkcyIsIl9oZWlnaHRDaGFuZ2VzIiwiU3ViamVjdCIsIl9oYW5kbGVSZWYiLCJub2RlIiwibmV4dCIsIl9yZWNvbXB1dGVSb3dIZWlnaHRzIiwicmVjb21wdXRlUm93SGVpZ2h0cyIsInNob3VsZFNjcm9sbFRvQm90dG9tIiwic2Nyb2xsVG9Cb3R0b20iLCJfaGFuZGxlTGlzdFJlbmRlciIsIm9wdHMiLCJzdGFydEluZGV4Iiwic3RvcEluZGV4IiwiX2dldEV4ZWN1dG9yIiwiaWQiLCJnZXRFeGVjdXRvciIsIl9nZXRQcm92aWRlciIsImdldFByb3ZpZGVyIiwiX3JlbmRlclJvdyIsInJvd01ldGFkYXRhIiwiaW5kZXgiLCJzdHlsZSIsInJlY29yZCIsInJlY29yZHMiLCJrZXkiLCJtZXNzYWdlSWQiLCJnZXRIYXNoIiwidmlldyIsInNldCIsImRlbGV0ZSIsImdldCIsInNob3dTb3VyY2VMYWJlbHMiLCJfaGFuZGxlUmVjb3JkSGVpZ2h0Q2hhbmdlIiwiX2dldFJvd0hlaWdodCIsIl9oYW5kbGVUYWJsZVdyYXBwZXIiLCJ0YWJsZVdyYXBwZXIiLCJfaGFuZGxlTGlzdFJlZiIsImxpc3RSZWYiLCJwcmV2aW91c1ZhbHVlIiwiX2hhbmRsZVJlc2l6ZSIsImhlaWdodCIsIndpZHRoIiwic3RhdGUiLCJzZXRTdGF0ZSIsImZvckVhY2giLCJyZWNvcmRWaWV3IiwibWVhc3VyZUFuZE5vdGlmeUhlaWdodCIsIm5ld0hlaWdodCIsIm9sZEhlaWdodCIsIl9vblNjcm9sbCIsImNsaWVudEhlaWdodCIsInNjcm9sbEhlaWdodCIsInNjcm9sbFRvcCIsIm9uU2Nyb2xsIiwiVW5pdmVyc2FsRGlzcG9zYWJsZSIsIkhhc2hlciIsImFkZCIsInN1YnNjcmliZSIsImZpbHRlciIsIkJvb2xlYW4iLCJzd2l0Y2hNYXAiLCJSZXNpemVPYnNlcnZhYmxlIiwibWFwVG8iLCJvZmZzZXRIZWlnaHQiLCJvZmZzZXRXaWR0aCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInByZXZTdGF0ZSIsImZvbnRTaXplIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwicmVuZGVyIiwiX2NvbnRhaW5lclJlbmRlcmVkIiwibGVuZ3RoIiwic2Nyb2xsVG9Sb3ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFjQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUF2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFxREE7QUFFQTtBQUNBLE1BQU1BLGNBQWMsR0FBRyxDQUF2QjtBQUNBLE1BQU1DLHFCQUFxQixHQUFHLEVBQTlCOztBQUVlLE1BQU1DLFdBQU4sU0FBMEJDLEtBQUssQ0FBQ0MsU0FBaEMsQ0FBd0Q7QUFHckU7QUFLQTtBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBTUFDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFlO0FBQ3hCLFVBQU1BLEtBQU47QUFEd0IsU0F2QjFCQyxXQXVCMEI7QUFBQSxTQXRCMUJDLE9Bc0IwQjtBQUFBLFNBcEIxQkMsS0FvQjBCO0FBQUEsU0FuQjFCQyxRQW1CMEI7QUFBQSxTQWxCMUJDLGdCQWtCMEIsR0FsQmtCLElBQUlDLEdBQUosRUFrQmxCO0FBQUEsU0FmMUJDLFdBZTBCO0FBQUEsU0FkMUJDLFVBYzBCO0FBQUEsU0FiMUJDLEtBYTBC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QVcsRUFBRSxLQUFLZixVQVBwQjtBQVFFLE1BQUEsZ0JBQWdCLEVBQUVyQyxjQVJwQjtBQVNFLE1BQUEsUUFBUSxFQUFFLEtBQUtvRSxTQVRqQjtBQVVFLE1BQUEsY0FBYyxFQUFFLEtBQUt4QztBQVZ2QixNQURELEdBYUcsSUFkTixDQURGO0FBa0JEOztBQTRCREQsRUFBQUEsY0FBYyxHQUFTO0FBQ3JCLFFBQUksS0FBS2xCLEtBQUwsSUFBYyxJQUFsQixFQUF3QjtBQUN0QjtBQUNBLFdBQUtBLEtBQUwsQ0FBV29GLFdBQVgsQ0FBdUIsS0FBS3ZGLEtBQUwsQ0FBV29DLE9BQVgsQ0FBbUJrRCxNQUFuQixHQUE0QixDQUFuRDtBQUNEO0FBQ0Y7O0FBd0NERCxFQUFBQSxrQkFBa0IsR0FBWTtBQUM1QixXQUFPLEtBQUs5QixLQUFMLENBQVdELEtBQVgsS0FBcUIsQ0FBckIsSUFBMEIsS0FBS0MsS0FBTCxDQUFXRixNQUFYLEtBQXNCLENBQXZEO0FBQ0Q7O0FBektvRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCB0eXBlIHtFeGVjdXRvciwgUmVjb3JkLCBTb3VyY2VJbmZvfSBmcm9tICcuLi90eXBlcyc7XG5cbmltcG9ydCB7RGVmYXVsdFdlYWtNYXB9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2NvbGxlY3Rpb24nO1xuaW1wb3J0IFVuaXZlcnNhbERpc3Bvc2FibGUgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZSc7XG5pbXBvcnQgbnVsbFRocm93cyBmcm9tICdudWxsdGhyb3dzJztcbmltcG9ydCB7UmVzaXplT2JzZXJ2YWJsZX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvb2JzZXJ2YWJsZS1kb20nO1xuaW1wb3J0IEhhc2hlciBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9IYXNoZXInO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IExpc3QgZnJvbSAncmVhY3QtdmlydHVhbGl6ZWQvZGlzdC9jb21tb25qcy9MaXN0JztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcy1jb21wYXQvYnVuZGxlcy9yeGpzLWNvbXBhdC51bWQubWluLmpzJztcbmltcG9ydCBSZWNvcmRWaWV3IGZyb20gJy4vUmVjb3JkVmlldyc7XG5pbXBvcnQgcmVjb3Jkc0NoYW5nZWQgZnJvbSAnLi4vcmVjb3Jkc0NoYW5nZWQnO1xuXG50eXBlIFByb3BzID0ge3xcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcbiAgc2hvd1NvdXJjZUxhYmVsczogYm9vbGVhbixcbiAgZm9udFNpemU6IG51bWJlcixcbiAgZ2V0RXhlY3V0b3I6IChpZDogc3RyaW5nKSA9PiA/RXhlY3V0b3IsXG4gIGdldFByb3ZpZGVyOiAoaWQ6IHN0cmluZykgPT4gP1NvdXJjZUluZm8sXG4gIG9uU2Nyb2xsOiAoXG4gICAgb2Zmc2V0SGVpZ2h0OiBudW1iZXIsXG4gICAgc2Nyb2xsSGVpZ2h0OiBudW1iZXIsXG4gICAgc2Nyb2xsVG9wOiBudW1iZXIsXG4gICkgPT4gdm9pZCxcbiAgc2hvdWxkU2Nyb2xsVG9Cb3R0b206ICgpID0+IGJvb2xlYW4sXG58fTtcblxudHlwZSBTdGF0ZSA9IHt8XG4gIHdpZHRoOiBudW1iZXIsXG4gIGhlaWdodDogbnVtYmVyLFxufH07XG5cbnR5cGUgUm93UmVuZGVyZXJQYXJhbXMgPSB7fFxuICBpbmRleDogbnVtYmVyLFxuICBrZXk6IHN0cmluZyxcbiAgc3R5bGU6IE9iamVjdCxcbiAgaXNTY3JvbGxpbmc6IGJvb2xlYW4sXG58fTtcblxudHlwZSBSb3dIZWlnaHRQYXJhbXMgPSB7fFxuICAvLyBUaGVzZSBhcmUgbm90IHByb3BzIHRvIGEgY29tcG9uZW50XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC9uby11bnVzZWQtcHJvcC10eXBlc1xuICBpbmRleDogbnVtYmVyLFxufH07XG5cbi8qIGVzbGludC1kaXNhYmxlIHJlYWN0L25vLXVudXNlZC1wcm9wLXR5cGVzICovXG50eXBlIE9uU2Nyb2xsUGFyYW1zID0ge3xcbiAgY2xpZW50SGVpZ2h0OiBudW1iZXIsXG4gIHNjcm9sbEhlaWdodDogbnVtYmVyLFxuICBzY3JvbGxUb3A6IG51bWJlcixcbnx9O1xuLyogZXNsaW50LWVuYWJsZSByZWFjdC9uby11bnVzZWQtcHJvcC10eXBlcyAqL1xuXG4vLyBUaGUgbnVtYmVyIG9mIGV4dHJhIHJvd3MgdG8gcmVuZGVyIGJleW9uZCB3aGF0IGlzIHZpc2libGVcbmNvbnN0IE9WRVJTQ0FOX0NPVU5UID0gNTtcbmNvbnN0IElOSVRJQUxfUkVDT1JEX0hFSUdIVCA9IDIxO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPdXRwdXRUYWJsZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcbiAgX2Rpc3Bvc2FibGU6IFVuaXZlcnNhbERpc3Bvc2FibGU7XG4gIF9oYXNoZXI6IEhhc2hlcjxSZWNvcmQ+O1xuICAvLyBUaGlzIGlzIGEgPExpc3Q+IGZyb20gcmVhY3QtdmlydHVhbGl6ZWQgKHVudHlwZWQgbGlicmFyeSlcbiAgX2xpc3Q6ID9SZWFjdC5FbGVtZW50PGFueT47XG4gIF93cmFwcGVyOiA/SFRNTEVsZW1lbnQ7XG4gIF9yZW5kZXJlZFJlY29yZHM6IE1hcDxSZWNvcmQsIFJlY29yZFZpZXc+ID0gbmV3IE1hcCgpO1xuXG4gIC8vIFRoZSBjdXJyZW50bHkgcmVuZGVyZWQgcmFuZ2UuXG4gIF9zdGFydEluZGV4OiBudW1iZXI7XG4gIF9zdG9wSW5kZXg6IG51bWJlcjtcbiAgX3JlZnM6IFN1YmplY3Q8P0hUTUxFbGVtZW50PjtcbiAgX2hlaWdodHM6IERlZmF1bHRXZWFrTWFwPFJlY29yZCwgbnVtYmVyPiA9IG5ldyBEZWZhdWx0V2Vha01hcChcbiAgICAoKSA9PiBJTklUSUFMX1JFQ09SRF9IRUlHSFQsXG4gICk7XG4gIC8vIEV4cHJlc3Npb25UcmVlQ29tcG9uZW50IGV4cGVjdHMgYW4gZXhwYW5zaW9uU3RhdGVJZCB3aGljaCBpcyBhIHN0YWJsZVxuICAvLyBvYmplY3QgaW5zdGFuY2UgYWNyb3NzIHJlbmRlcnMsIGJ1dCBpcyB1bmlxdWUgYWNyb3NzIGNvbnNvbGVzLiBXZVxuICAvLyB0ZWNobmljYWxseSBzdXBwb3J0IG11bHRpcGxlIGNvbnNvbGVzIGluIHRoZSBVSSwgc28gaGVyZSB3ZSBlbnN1cmUgdGhlc2VcbiAgLy8gcmVmZXJlbmNlcyBhcmUgbG9jYWwgdG8gdGhlIE91dHB1dFRhYmxlIGluc3RhbmNlLlxuICBfZXhwYW5zaW9uU3RhdGVJZHM6IERlZmF1bHRXZWFrTWFwPFJlY29yZCwgT2JqZWN0PiA9IG5ldyBEZWZhdWx0V2Vha01hcChcbiAgICAoKSA9PiAoe30pLFxuICApO1xuICBfaGVpZ2h0Q2hhbmdlczogU3ViamVjdDxudWxsPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuX2hhc2hlciA9IG5ldyBIYXNoZXIoKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgd2lkdGg6IDAsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgfTtcbiAgICB0aGlzLl9zdGFydEluZGV4ID0gMDtcbiAgICB0aGlzLl9zdG9wSW5kZXggPSAwO1xuICAgIHRoaXMuX3JlZnMgPSBuZXcgU3ViamVjdCgpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxuICAgICAgdGhpcy5faGVpZ2h0Q2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBUaGVvcmV0aWNhbGx5IHdlIHNob3VsZCBiZSBhYmxlIHRvICh0cmFpbGluZykgdGhyb3R0bGUgdGhpcyB0byBvbmNlXG4gICAgICAgIC8vIHBlciByZW5kZXIvcGFpbnQgdXNpbmcgbWljcm90YXNrLCBidXQgSSBoYXZlbid0IGJlZW4gYWJsZSB0byBnZXQgaXRcbiAgICAgICAgLy8gdG8gd29yayB3aXRob3V0IHNlZWluZyB2aXNpYmxlIGZsYXNoZXMgb2YgY29sbGFwc2VkIG91dHB1dC5cbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUm93SGVpZ2h0cygpO1xuICAgICAgfSksXG4gICAgICB0aGlzLl9yZWZzXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLnN3aXRjaE1hcChub2RlID0+IG5ldyBSZXNpemVPYnNlcnZhYmxlKG51bGxUaHJvd3Mobm9kZSkpLm1hcFRvKG5vZGUpKVxuICAgICAgICAuc3Vic2NyaWJlKG5vZGUgPT4ge1xuICAgICAgICAgIGNvbnN0IHtvZmZzZXRIZWlnaHQsIG9mZnNldFdpZHRofSA9IG51bGxUaHJvd3Mobm9kZSk7XG4gICAgICAgICAgdGhpcy5faGFuZGxlUmVzaXplKG9mZnNldEhlaWdodCwgb2Zmc2V0V2lkdGgpO1xuICAgICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogUHJvcHMsIHByZXZTdGF0ZTogU3RhdGUpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLl9saXN0ICE9IG51bGwgJiZcbiAgICAgIHJlY29yZHNDaGFuZ2VkKHByZXZQcm9wcy5yZWNvcmRzLCB0aGlzLnByb3BzLnJlY29yZHMpXG4gICAgKSB7XG4gICAgICAvLyAkRmxvd0lnbm9yZSBVbnR5cGVkIHJlYWN0LXZpcnR1YWxpemVkIExpc3QgbWV0aG9kXG4gICAgICB0aGlzLl9saXN0LnJlY29tcHV0ZVJvd0hlaWdodHMoKTtcbiAgICB9XG4gICAgaWYgKHByZXZQcm9wcy5mb250U2l6ZSAhPT0gdGhpcy5wcm9wcy5mb250U2l6ZSkge1xuICAgICAgdGhpcy5fcmVuZGVyZWRSZWNvcmRzLmZvckVhY2gocmVjb3JkVmlldyA9PlxuICAgICAgICByZWNvcmRWaWV3Lm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gIH1cblxuICBfaGFuZGxlUmVmID0gKG5vZGU6ID9IVE1MRWxlbWVudCkgPT4ge1xuICAgIHRoaXMuX3JlZnMubmV4dChub2RlKTtcbiAgfTtcblxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29uc29sZS10YWJsZS13cmFwcGVyXCIgcmVmPXt0aGlzLl9oYW5kbGVSZWZ9IHRhYkluZGV4PVwiMVwiPlxuICAgICAgICB7dGhpcy5fY29udGFpbmVyUmVuZGVyZWQoKSA/IChcbiAgICAgICAgICA8TGlzdFxuICAgICAgICAgICAgLy8gJEZsb3dGaXhNZSg+PTAuNTMuMCkgRmxvdyBzdXBwcmVzc1xuICAgICAgICAgICAgcmVmPXt0aGlzLl9oYW5kbGVMaXN0UmVmfVxuICAgICAgICAgICAgaGVpZ2h0PXt0aGlzLnN0YXRlLmhlaWdodH1cbiAgICAgICAgICAgIHdpZHRoPXt0aGlzLnN0YXRlLndpZHRofVxuICAgICAgICAgICAgcm93Q291bnQ9e3RoaXMucHJvcHMucmVjb3Jkcy5sZW5ndGh9XG4gICAgICAgICAgICByb3dIZWlnaHQ9e3RoaXMuX2dldFJvd0hlaWdodH1cbiAgICAgICAgICAgIHJvd1JlbmRlcmVyPXt0aGlzLl9yZW5kZXJSb3d9XG4gICAgICAgICAgICBvdmVyc2NhblJvd0NvdW50PXtPVkVSU0NBTl9DT1VOVH1cbiAgICAgICAgICAgIG9uU2Nyb2xsPXt0aGlzLl9vblNjcm9sbH1cbiAgICAgICAgICAgIG9uUm93c1JlbmRlcmVkPXt0aGlzLl9oYW5kbGVMaXN0UmVuZGVyfVxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIF9yZWNvbXB1dGVSb3dIZWlnaHRzID0gKCkgPT4ge1xuICAgIC8vIFRoZSByZWFjdC12aXJ0dWFsaXplZCBMaXN0IGNvbXBvbmVudCBpcyBwcm92aWRlZCB0aGUgcm93IGhlaWdodHNcbiAgICAvLyB0aHJvdWdoIGEgZnVuY3Rpb24sIHNvIGl0IGhhcyBubyB3YXkgb2Yga25vd2luZyB0aGF0IGEgcm93J3MgaGVpZ2h0XG4gICAgLy8gaGFzIGNoYW5nZWQgdW5sZXNzIHdlIGV4cGxpY2l0bHkgbm90aWZ5IGl0IHRvIHJlY29tcHV0ZSB0aGUgaGVpZ2h0cy5cbiAgICBpZiAodGhpcy5fbGlzdCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vICRGbG93SWdub3JlIFVudHlwZWQgcmVhY3QtdmlydHVhbGl6ZWQgTGlzdCBjb21wb25lbnQgbWV0aG9kXG4gICAgdGhpcy5fbGlzdC5yZWNvbXB1dGVSb3dIZWlnaHRzKCk7XG5cbiAgICAvLyBJZiB3ZSBhcmUgYWxyZWFkeSBzY3JvbGxlZCB0byB0aGUgYm90dG9tLCBzY3JvbGwgdG8gZW5zdXJlIHRoYXQgdGhlIHNjcm9sbGJhciByZW1haW5zIGF0XG4gICAgLy8gdGhlIGJvdHRvbS4gVGhpcyBpcyBpbXBvcnRhbnQgbm90IGp1c3QgZm9yIGlmIHRoZSBsYXN0IHJlY29yZCBjaGFuZ2VzIGhlaWdodCB0aHJvdWdoIHVzZXJcbiAgICAvLyBpbnRlcmFjdGlvbiAoZS5nLiBleHBhbmRpbmcgYSBkZWJ1Z2dlciB2YXJpYWJsZSksIGJ1dCBhbHNvIGJlY2F1c2UgdGhpcyBpcyB0aGUgbWVjaGFuaXNtXG4gICAgLy8gdGhyb3VnaCB3aGljaCB0aGUgcmVjb3JkJ3MgdHJ1ZSBpbml0aWFsIGhlaWdodCBpcyByZXBvcnRlZC4gVGhlcmVmb3JlLCB3ZSBtYXkgaGF2ZSBzY3JvbGxlZFxuICAgIC8vIHRvIHRoZSBib3R0b20sIGFuZCBvbmx5IGFmdGVyd2FyZHMgcmVjZWl2ZWQgaXRzIHRydWUgaGVpZ2h0LiBJbiB0aGlzIGNhc2UsIGl0J3MgaW1wb3J0YW50XG4gICAgLy8gdGhhdCB3ZSB0aGVuIHNjcm9sbCB0byB0aGUgbmV3IGJvdHRvbS5cbiAgICBpZiAodGhpcy5wcm9wcy5zaG91bGRTY3JvbGxUb0JvdHRvbSgpKSB7XG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKCk7XG4gICAgfVxuICB9O1xuXG4gIF9oYW5kbGVMaXN0UmVuZGVyID0gKG9wdHM6IHtzdGFydEluZGV4OiBudW1iZXIsIHN0b3BJbmRleDogbnVtYmVyfSk6IHZvaWQgPT4ge1xuICAgIHRoaXMuX3N0YXJ0SW5kZXggPSBvcHRzLnN0YXJ0SW5kZXg7XG4gICAgdGhpcy5fc3RvcEluZGV4ID0gb3B0cy5zdG9wSW5kZXg7XG4gIH07XG5cbiAgc2Nyb2xsVG9Cb3R0b20oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2xpc3QgIT0gbnVsbCkge1xuICAgICAgLy8gJEZsb3dJZ25vcmUgVW50eXBlZCByZWFjdC12aXJ0dWFsaXplZCBMaXN0IG1ldGhvZFxuICAgICAgdGhpcy5fbGlzdC5zY3JvbGxUb1Jvdyh0aGlzLnByb3BzLnJlY29yZHMubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgX2dldEV4ZWN1dG9yID0gKGlkOiBzdHJpbmcpOiA/RXhlY3V0b3IgPT4ge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmdldEV4ZWN1dG9yKGlkKTtcbiAgfTtcblxuICBfZ2V0UHJvdmlkZXIgPSAoaWQ6IHN0cmluZyk6ID9Tb3VyY2VJbmZvID0+IHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5nZXRQcm92aWRlcihpZCk7XG4gIH07XG5cbiAgX3JlbmRlclJvdyA9IChyb3dNZXRhZGF0YTogUm93UmVuZGVyZXJQYXJhbXMpOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xuICAgIGNvbnN0IHtpbmRleCwgc3R5bGV9ID0gcm93TWV0YWRhdGE7XG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5wcm9wcy5yZWNvcmRzW2luZGV4XTtcbiAgICBjb25zdCBrZXkgPVxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCAhPSBudWxsXG4gICAgICAgID8gYG1lc3NhZ2VJZDoke3JlY29yZC5tZXNzYWdlSWR9YFxuICAgICAgICA6IGByZWNvcmRIYXNoOiR7dGhpcy5faGFzaGVyLmdldEhhc2gocmVjb3JkKX1gO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYga2V5PXtrZXl9IGNsYXNzTmFtZT1cImNvbnNvbGUtdGFibGUtcm93LXdyYXBwZXJcIiBzdHlsZT17c3R5bGV9PlxuICAgICAgICA8UmVjb3JkVmlld1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2pzeC1zaW1wbGUtY2FsbGJhY2stcmVmc1xuICAgICAgICAgIHJlZj17KHZpZXc6ID9SZWNvcmRWaWV3KSA9PiB7XG4gICAgICAgICAgICBpZiAodmlldyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5zZXQocmVjb3JkLCB2aWV3KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5kZWxldGUocmVjb3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9fVxuICAgICAgICAgIGdldEV4ZWN1dG9yPXt0aGlzLl9nZXRFeGVjdXRvcn1cbiAgICAgICAgICBnZXRQcm92aWRlcj17dGhpcy5fZ2V0UHJvdmlkZXJ9XG4gICAgICAgICAgcmVjb3JkPXtyZWNvcmR9XG4gICAgICAgICAgZXhwYW5zaW9uU3RhdGVJZD17dGhpcy5fZXhwYW5zaW9uU3RhdGVJZHMuZ2V0KHJlY29yZCl9XG4gICAgICAgICAgc2hvd1NvdXJjZUxhYmVsPXt0aGlzLnByb3BzLnNob3dTb3VyY2VMYWJlbHN9XG4gICAgICAgICAgb25IZWlnaHRDaGFuZ2U9e3RoaXMuX2hhbmRsZVJlY29yZEhlaWdodENoYW5nZX1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH07XG5cbiAgX2NvbnRhaW5lclJlbmRlcmVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLndpZHRoICE9PSAwICYmIHRoaXMuc3RhdGUuaGVpZ2h0ICE9PSAwO1xuICB9XG5cbiAgX2dldFJvd0hlaWdodCA9ICh7aW5kZXh9OiBSb3dIZWlnaHRQYXJhbXMpOiBudW1iZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLl9oZWlnaHRzLmdldCh0aGlzLnByb3BzLnJlY29yZHNbaW5kZXhdKTtcbiAgfTtcblxuICBfaGFuZGxlVGFibGVXcmFwcGVyID0gKHRhYmxlV3JhcHBlcjogSFRNTEVsZW1lbnQpOiB2b2lkID0+IHtcbiAgICB0aGlzLl93cmFwcGVyID0gdGFibGVXcmFwcGVyO1xuICB9O1xuXG4gIF9oYW5kbGVMaXN0UmVmID0gKGxpc3RSZWY6IFJlYWN0LkVsZW1lbnQ8YW55Pik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSB0aGlzLl9saXN0O1xuICAgIHRoaXMuX2xpc3QgPSBsaXN0UmVmO1xuXG4gICAgLy8gVGhlIGNoaWxkIHJvd3MgcmVuZGVyIGJlZm9yZSB0aGlzIHJlZiBnZXRzIHNldC4gU28sIGlmIHdlIGFyZSBjb21pbmcgZnJvbVxuICAgIC8vIGEgc3RhdGUgd2hlcmUgdGhlIHJlZiB3YXMgbnVsbCwgd2Ugc2hvdWxkIGVuc3VyZSB3ZSBub3RpZnlcbiAgICAvLyByZWFjdC12aXJ0dWFsaXplZCB0aGF0IHdlIGhhdmUgbWVhc3VyZW1lbnRzLlxuICAgIGlmIChwcmV2aW91c1ZhbHVlID09IG51bGwgJiYgdGhpcy5fbGlzdCAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9oZWlnaHRDaGFuZ2VzLm5leHQobnVsbCk7XG4gICAgfVxuICB9O1xuXG4gIF9oYW5kbGVSZXNpemUgPSAoaGVpZ2h0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICBpZiAoaGVpZ2h0ID09PSB0aGlzLnN0YXRlLmhlaWdodCAmJiB3aWR0aCA9PT0gdGhpcy5zdGF0ZS53aWR0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgIH0pO1xuXG4gICAgLy8gV2hlbiB0aGlzIGNvbXBvbmVudCByZXNpemVzLCB0aGUgaW5uZXIgcmVjb3JkcyB3aWxsXG4gICAgLy8gYWxzbyByZXNpemUgYW5kIHBvdGVudGlhbGx5IGhhdmUgdGhlaXIgaGVpZ2h0cyBjaGFuZ2VcbiAgICAvLyBTbyB3ZSBtZWFzdXJlIGFsbCBvZiB0aGVpciBoZWlnaHRzIGFnYWluIGhlcmVcbiAgICB0aGlzLl9yZW5kZXJlZFJlY29yZHMuZm9yRWFjaChyZWNvcmRWaWV3ID0+XG4gICAgICByZWNvcmRWaWV3Lm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKSxcbiAgICApO1xuICB9O1xuXG4gIF9oYW5kbGVSZWNvcmRIZWlnaHRDaGFuZ2UgPSAocmVjb3JkOiBSZWNvcmQsIG5ld0hlaWdodDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgY29uc3Qgb2xkSGVpZ2h0ID0gdGhpcy5faGVpZ2h0cy5nZXQocmVjb3JkKTtcbiAgICBpZiAob2xkSGVpZ2h0ICE9PSBuZXdIZWlnaHQpIHtcbiAgICAgIHRoaXMuX2hlaWdodHMuc2V0KHJlY29yZCwgbmV3SGVpZ2h0KTtcbiAgICAgIHRoaXMuX2hlaWdodENoYW5nZXMubmV4dChudWxsKTtcbiAgICB9XG4gIH07XG5cbiAgX29uU2Nyb2xsID0gKHtcbiAgICBjbGllbnRIZWlnaHQsXG4gICAgc2Nyb2xsSGVpZ2h0LFxuICAgIHNjcm9sbFRvcCxcbiAgfTogT25TY3JvbGxQYXJhbXMpOiB2b2lkID0+IHtcbiAgICB0aGlzLnByb3BzLm9uU2Nyb2xsKGNsaWVudEhlaWdodCwgc2Nyb2xsSGVpZ2h0LCBzY3JvbGxUb3ApO1xuICB9O1xufVxuIl19