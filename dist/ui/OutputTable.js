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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk91dHB1dFRhYmxlLmpzIl0sIm5hbWVzIjpbIk9WRVJTQ0FOX0NPVU5UIiwiSU5JVElBTF9SRUNPUkRfSEVJR0hUIiwiT3V0cHV0VGFibGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfZGlzcG9zYWJsZSIsIl9oYXNoZXIiLCJfbGlzdCIsIl93cmFwcGVyIiwiX3JlbmRlcmVkUmVjb3JkcyIsIk1hcCIsIl9zdGFydEluZGV4IiwiX3N0b3BJbmRleCIsIl9yZWZzIiwiX2hlaWdodHMiLCJEZWZhdWx0V2Vha01hcCIsIl9leHBhbnNpb25TdGF0ZUlkcyIsIl9oZWlnaHRDaGFuZ2VzIiwiU3ViamVjdCIsIl9oYW5kbGVSZWYiLCJub2RlIiwibmV4dCIsIl9yZWNvbXB1dGVSb3dIZWlnaHRzIiwicmVjb21wdXRlUm93SGVpZ2h0cyIsInNob3VsZFNjcm9sbFRvQm90dG9tIiwic2Nyb2xsVG9Cb3R0b20iLCJfaGFuZGxlTGlzdFJlbmRlciIsIm9wdHMiLCJzdGFydEluZGV4Iiwic3RvcEluZGV4IiwiX2dldEV4ZWN1dG9yIiwiaWQiLCJnZXRFeGVjdXRvciIsIl9nZXRQcm92aWRlciIsImdldFByb3ZpZGVyIiwiX3JlbmRlclJvdyIsInJvd01ldGFkYXRhIiwiaW5kZXgiLCJzdHlsZSIsInJlY29yZCIsInJlY29yZHMiLCJrZXkiLCJtZXNzYWdlSWQiLCJnZXRIYXNoIiwidmlldyIsInNldCIsImRlbGV0ZSIsImdldCIsInNob3dTb3VyY2VMYWJlbHMiLCJfaGFuZGxlUmVjb3JkSGVpZ2h0Q2hhbmdlIiwiX2dldFJvd0hlaWdodCIsIl9oYW5kbGVUYWJsZVdyYXBwZXIiLCJ0YWJsZVdyYXBwZXIiLCJfaGFuZGxlTGlzdFJlZiIsImxpc3RSZWYiLCJwcmV2aW91c1ZhbHVlIiwiX2hhbmRsZVJlc2l6ZSIsImhlaWdodCIsIndpZHRoIiwic3RhdGUiLCJzZXRTdGF0ZSIsImZvckVhY2giLCJyZWNvcmRWaWV3IiwibWVhc3VyZUFuZE5vdGlmeUhlaWdodCIsIm5ld0hlaWdodCIsIm9sZEhlaWdodCIsIl9vblNjcm9sbCIsImNsaWVudEhlaWdodCIsInNjcm9sbEhlaWdodCIsInNjcm9sbFRvcCIsIm9uU2Nyb2xsIiwiVW5pdmVyc2FsRGlzcG9zYWJsZSIsIkhhc2hlciIsImFkZCIsInN1YnNjcmliZSIsImZpbHRlciIsIkJvb2xlYW4iLCJzd2l0Y2hNYXAiLCJSZXNpemVPYnNlcnZhYmxlIiwibWFwVG8iLCJvZmZzZXRIZWlnaHQiLCJvZmZzZXRXaWR0aCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsInByZXZTdGF0ZSIsImZvbnRTaXplIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwicmVuZGVyIiwiX2NvbnRhaW5lclJlbmRlcmVkIiwibGVuZ3RoIiwic2Nyb2xsVG9Sb3ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFvQ0E7QUFFQTtBQUNBLE1BQU1BLGNBQWMsR0FBRyxDQUF2QjtBQUNBLE1BQU1DLHFCQUFxQixHQUFHLEVBQTlCOztBQUVlLE1BQU1DLFdBQU4sU0FBMEJDLEtBQUssQ0FBQ0MsU0FBaEMsQ0FBd0Q7QUFHckU7QUFLQTtBQUtBO0FBQ0E7QUFDQTtBQUNBO0FBSUFDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFlO0FBQ3hCLFVBQU1BLEtBQU47QUFEd0IsU0FuQjFCQyxXQW1CMEI7QUFBQSxTQWxCMUJDLE9Ba0IwQjtBQUFBLFNBaEIxQkMsS0FnQjBCO0FBQUEsU0FmMUJDLFFBZTBCO0FBQUEsU0FkMUJDLGdCQWMwQixHQWRrQixJQUFJQyxHQUFKLEVBY2xCO0FBQUEsU0FYMUJDLFdBVzBCO0FBQUEsU0FWMUJDLFVBVTBCO0FBQUEsU0FUMUJDLEtBUzBCO0FBQUEsU0FSMUJDLFFBUTBCLEdBUmlCLElBQUlDLDBCQUFKLENBQW1CLE1BQU1oQixxQkFBekIsQ0FRakI7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O0FBU0UsTUFBQSxRQUFRLEVBQUUsS0FBS29FLFNBVGpCO0FBVUUsTUFBQSxjQUFjLEVBQUUsS0FBS3hDO0FBVnZCLE1BREQsR0FhRyxJQWROLENBREY7QUFrQkQ7O0FBNEJERCxFQUFBQSxjQUFjLEdBQVM7QUFDckIsUUFBSSxLQUFLbEIsS0FBTCxJQUFjLElBQWxCLEVBQXdCO0FBQ3RCO0FBQ0EsV0FBS0EsS0FBTCxDQUFXb0YsV0FBWCxDQUF1QixLQUFLdkYsS0FBTCxDQUFXb0MsT0FBWCxDQUFtQmtELE1BQW5CLEdBQTRCLENBQW5EO0FBQ0Q7QUFDRjs7QUFzQ0RELEVBQUFBLGtCQUFrQixHQUFZO0FBQzVCLFdBQU8sS0FBSzlCLEtBQUwsQ0FBV0QsS0FBWCxLQUFxQixDQUFyQixJQUEwQixLQUFLQyxLQUFMLENBQVdGLE1BQVgsS0FBc0IsQ0FBdkQ7QUFDRDs7QUE5Sm9FIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBFeGVjdXRvciwgUmVjb3JkLCBTb3VyY2VJbmZvIH0gZnJvbSBcIi4uL3R5cGVzXCJcclxuXHJcbmltcG9ydCB7IERlZmF1bHRXZWFrTWFwIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2NvbGxlY3Rpb25cIlxyXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZVwiXHJcbmltcG9ydCBudWxsVGhyb3dzIGZyb20gXCJudWxsdGhyb3dzXCJcclxuaW1wb3J0IHsgUmVzaXplT2JzZXJ2YWJsZSB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9vYnNlcnZhYmxlLWRvbVwiXHJcbmltcG9ydCBIYXNoZXIgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL0hhc2hlclwiXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXHJcbmltcG9ydCBMaXN0IGZyb20gXCJyZWFjdC12aXJ0dWFsaXplZC9kaXN0L2NvbW1vbmpzL0xpc3RcIlxyXG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qc1wiXHJcbmltcG9ydCBSZWNvcmRWaWV3IGZyb20gXCIuL1JlY29yZFZpZXdcIlxyXG5pbXBvcnQgcmVjb3Jkc0NoYW5nZWQgZnJvbSBcIi4uL3JlY29yZHNDaGFuZ2VkXCJcclxuXHJcbnR5cGUgUHJvcHMgPSB7XHJcbiAgcmVjb3JkczogQXJyYXk8UmVjb3JkPixcclxuICBzaG93U291cmNlTGFiZWxzOiBib29sZWFuLFxyXG4gIGZvbnRTaXplOiBudW1iZXIsXHJcbiAgZ2V0RXhlY3V0b3I6IChpZDogc3RyaW5nKSA9PiA/RXhlY3V0b3IsXHJcbiAgZ2V0UHJvdmlkZXI6IChpZDogc3RyaW5nKSA9PiA/U291cmNlSW5mbyxcclxuICBvblNjcm9sbDogKG9mZnNldEhlaWdodDogbnVtYmVyLCBzY3JvbGxIZWlnaHQ6IG51bWJlciwgc2Nyb2xsVG9wOiBudW1iZXIpID0+IHZvaWQsXHJcbiAgc2hvdWxkU2Nyb2xsVG9Cb3R0b206ICgpID0+IGJvb2xlYW4sXHJcbn1cclxuXHJcbnR5cGUgU3RhdGUgPSB7XHJcbiAgd2lkdGg6IG51bWJlcixcclxuICBoZWlnaHQ6IG51bWJlcixcclxufVxyXG5cclxudHlwZSBSb3dSZW5kZXJlclBhcmFtcyA9IHtcclxuICBpbmRleDogbnVtYmVyLFxyXG4gIGtleTogc3RyaW5nLFxyXG4gIHN0eWxlOiBPYmplY3QsXHJcbiAgaXNTY3JvbGxpbmc6IGJvb2xlYW4sXHJcbn1cclxuXHJcbnR5cGUgUm93SGVpZ2h0UGFyYW1zID0ge1xyXG4gIC8vIFRoZXNlIGFyZSBub3QgcHJvcHMgdG8gYSBjb21wb25lbnRcclxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3Qvbm8tdW51c2VkLXByb3AtdHlwZXNcclxuICBpbmRleDogbnVtYmVyLFxyXG59XHJcblxyXG4vKiBlc2xpbnQtZGlzYWJsZSByZWFjdC9uby11bnVzZWQtcHJvcC10eXBlcyAqL1xyXG50eXBlIE9uU2Nyb2xsUGFyYW1zID0ge1xyXG4gIGNsaWVudEhlaWdodDogbnVtYmVyLFxyXG4gIHNjcm9sbEhlaWdodDogbnVtYmVyLFxyXG4gIHNjcm9sbFRvcDogbnVtYmVyLFxyXG59XHJcbi8qIGVzbGludC1lbmFibGUgcmVhY3Qvbm8tdW51c2VkLXByb3AtdHlwZXMgKi9cclxuXHJcbi8vIFRoZSBudW1iZXIgb2YgZXh0cmEgcm93cyB0byByZW5kZXIgYmV5b25kIHdoYXQgaXMgdmlzaWJsZVxyXG5jb25zdCBPVkVSU0NBTl9DT1VOVCA9IDVcclxuY29uc3QgSU5JVElBTF9SRUNPUkRfSEVJR0hUID0gMjFcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dHB1dFRhYmxlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzLCBTdGF0ZT4ge1xyXG4gIF9kaXNwb3NhYmxlOiBVbml2ZXJzYWxEaXNwb3NhYmxlXHJcbiAgX2hhc2hlcjogSGFzaGVyPFJlY29yZD5cclxuICAvLyBUaGlzIGlzIGEgPExpc3Q+IGZyb20gcmVhY3QtdmlydHVhbGl6ZWQgKHVudHlwZWQgbGlicmFyeSlcclxuICBfbGlzdDogP1JlYWN0LkVsZW1lbnQ8YW55PlxyXG4gIF93cmFwcGVyOiA/SFRNTEVsZW1lbnRcclxuICBfcmVuZGVyZWRSZWNvcmRzOiBNYXA8UmVjb3JkLCBSZWNvcmRWaWV3PiA9IG5ldyBNYXAoKVxyXG5cclxuICAvLyBUaGUgY3VycmVudGx5IHJlbmRlcmVkIHJhbmdlLlxyXG4gIF9zdGFydEluZGV4OiBudW1iZXJcclxuICBfc3RvcEluZGV4OiBudW1iZXJcclxuICBfcmVmczogU3ViamVjdDw/SFRNTEVsZW1lbnQ+XHJcbiAgX2hlaWdodHM6IERlZmF1bHRXZWFrTWFwPFJlY29yZCwgbnVtYmVyPiA9IG5ldyBEZWZhdWx0V2Vha01hcCgoKSA9PiBJTklUSUFMX1JFQ09SRF9IRUlHSFQpXHJcbiAgLy8gRXhwcmVzc2lvblRyZWVDb21wb25lbnQgZXhwZWN0cyBhbiBleHBhbnNpb25TdGF0ZUlkIHdoaWNoIGlzIGEgc3RhYmxlXHJcbiAgLy8gb2JqZWN0IGluc3RhbmNlIGFjcm9zcyByZW5kZXJzLCBidXQgaXMgdW5pcXVlIGFjcm9zcyBjb25zb2xlcy4gV2VcclxuICAvLyB0ZWNobmljYWxseSBzdXBwb3J0IG11bHRpcGxlIGNvbnNvbGVzIGluIHRoZSBVSSwgc28gaGVyZSB3ZSBlbnN1cmUgdGhlc2VcclxuICAvLyByZWZlcmVuY2VzIGFyZSBsb2NhbCB0byB0aGUgT3V0cHV0VGFibGUgaW5zdGFuY2UuXHJcbiAgX2V4cGFuc2lvblN0YXRlSWRzOiBEZWZhdWx0V2Vha01hcDxSZWNvcmQsIE9iamVjdD4gPSBuZXcgRGVmYXVsdFdlYWtNYXAoKCkgPT4gKHt9KSlcclxuICBfaGVpZ2h0Q2hhbmdlczogU3ViamVjdDxudWxsPiA9IG5ldyBTdWJqZWN0KClcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XHJcbiAgICBzdXBlcihwcm9wcylcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgpXHJcbiAgICB0aGlzLl9oYXNoZXIgPSBuZXcgSGFzaGVyKClcclxuICAgIHRoaXMuc3RhdGUgPSB7XHJcbiAgICAgIHdpZHRoOiAwLFxyXG4gICAgICBoZWlnaHQ6IDAsXHJcbiAgICB9XHJcbiAgICB0aGlzLl9zdGFydEluZGV4ID0gMFxyXG4gICAgdGhpcy5fc3RvcEluZGV4ID0gMFxyXG4gICAgdGhpcy5fcmVmcyA9IG5ldyBTdWJqZWN0KClcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICB0aGlzLl9oZWlnaHRDaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgLy8gVGhlb3JldGljYWxseSB3ZSBzaG91bGQgYmUgYWJsZSB0byAodHJhaWxpbmcpIHRocm90dGxlIHRoaXMgdG8gb25jZVxyXG4gICAgICAgIC8vIHBlciByZW5kZXIvcGFpbnQgdXNpbmcgbWljcm90YXNrLCBidXQgSSBoYXZlbid0IGJlZW4gYWJsZSB0byBnZXQgaXRcclxuICAgICAgICAvLyB0byB3b3JrIHdpdGhvdXQgc2VlaW5nIHZpc2libGUgZmxhc2hlcyBvZiBjb2xsYXBzZWQgb3V0cHV0LlxyXG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJvd0hlaWdodHMoKVxyXG4gICAgICB9KSxcclxuICAgICAgdGhpcy5fcmVmc1xyXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgICAgICAuc3dpdGNoTWFwKChub2RlKSA9PiBuZXcgUmVzaXplT2JzZXJ2YWJsZShudWxsVGhyb3dzKG5vZGUpKS5tYXBUbyhub2RlKSlcclxuICAgICAgICAuc3Vic2NyaWJlKChub2RlKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB7IG9mZnNldEhlaWdodCwgb2Zmc2V0V2lkdGggfSA9IG51bGxUaHJvd3Mobm9kZSlcclxuICAgICAgICAgIHRoaXMuX2hhbmRsZVJlc2l6ZShvZmZzZXRIZWlnaHQsIG9mZnNldFdpZHRoKVxyXG4gICAgICAgIH0pXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBQcm9wcywgcHJldlN0YXRlOiBTdGF0ZSk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2xpc3QgIT0gbnVsbCAmJiByZWNvcmRzQ2hhbmdlZChwcmV2UHJvcHMucmVjb3JkcywgdGhpcy5wcm9wcy5yZWNvcmRzKSkge1xyXG4gICAgICAvLyAkRmxvd0lnbm9yZSBVbnR5cGVkIHJlYWN0LXZpcnR1YWxpemVkIExpc3QgbWV0aG9kXHJcbiAgICAgIHRoaXMuX2xpc3QucmVjb21wdXRlUm93SGVpZ2h0cygpXHJcbiAgICB9XHJcbiAgICBpZiAocHJldlByb3BzLmZvbnRTaXplICE9PSB0aGlzLnByb3BzLmZvbnRTaXplKSB7XHJcbiAgICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5mb3JFYWNoKChyZWNvcmRWaWV3KSA9PiByZWNvcmRWaWV3Lm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKClcclxuICB9XHJcblxyXG4gIF9oYW5kbGVSZWYgPSAobm9kZTogP0hUTUxFbGVtZW50KSA9PiB7XHJcbiAgICB0aGlzLl9yZWZzLm5leHQobm9kZSlcclxuICB9XHJcblxyXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29uc29sZS10YWJsZS13cmFwcGVyXCIgcmVmPXt0aGlzLl9oYW5kbGVSZWZ9IHRhYkluZGV4PVwiMVwiPlxyXG4gICAgICAgIHt0aGlzLl9jb250YWluZXJSZW5kZXJlZCgpID8gKFxyXG4gICAgICAgICAgPExpc3RcclxuICAgICAgICAgICAgLy8gJEZsb3dGaXhNZSg+PTAuNTMuMCkgRmxvdyBzdXBwcmVzc1xyXG4gICAgICAgICAgICByZWY9e3RoaXMuX2hhbmRsZUxpc3RSZWZ9XHJcbiAgICAgICAgICAgIGhlaWdodD17dGhpcy5zdGF0ZS5oZWlnaHR9XHJcbiAgICAgICAgICAgIHdpZHRoPXt0aGlzLnN0YXRlLndpZHRofVxyXG4gICAgICAgICAgICByb3dDb3VudD17dGhpcy5wcm9wcy5yZWNvcmRzLmxlbmd0aH1cclxuICAgICAgICAgICAgcm93SGVpZ2h0PXt0aGlzLl9nZXRSb3dIZWlnaHR9XHJcbiAgICAgICAgICAgIHJvd1JlbmRlcmVyPXt0aGlzLl9yZW5kZXJSb3d9XHJcbiAgICAgICAgICAgIG92ZXJzY2FuUm93Q291bnQ9e09WRVJTQ0FOX0NPVU5UfVxyXG4gICAgICAgICAgICBvblNjcm9sbD17dGhpcy5fb25TY3JvbGx9XHJcbiAgICAgICAgICAgIG9uUm93c1JlbmRlcmVkPXt0aGlzLl9oYW5kbGVMaXN0UmVuZGVyfVxyXG4gICAgICAgICAgLz5cclxuICAgICAgICApIDogbnVsbH1cclxuICAgICAgPC9kaXY+XHJcbiAgICApXHJcbiAgfVxyXG5cclxuICBfcmVjb21wdXRlUm93SGVpZ2h0cyA9ICgpID0+IHtcclxuICAgIC8vIFRoZSByZWFjdC12aXJ0dWFsaXplZCBMaXN0IGNvbXBvbmVudCBpcyBwcm92aWRlZCB0aGUgcm93IGhlaWdodHNcclxuICAgIC8vIHRocm91Z2ggYSBmdW5jdGlvbiwgc28gaXQgaGFzIG5vIHdheSBvZiBrbm93aW5nIHRoYXQgYSByb3cncyBoZWlnaHRcclxuICAgIC8vIGhhcyBjaGFuZ2VkIHVubGVzcyB3ZSBleHBsaWNpdGx5IG5vdGlmeSBpdCB0byByZWNvbXB1dGUgdGhlIGhlaWdodHMuXHJcbiAgICBpZiAodGhpcy5fbGlzdCA9PSBudWxsKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgLy8gJEZsb3dJZ25vcmUgVW50eXBlZCByZWFjdC12aXJ0dWFsaXplZCBMaXN0IGNvbXBvbmVudCBtZXRob2RcclxuICAgIHRoaXMuX2xpc3QucmVjb21wdXRlUm93SGVpZ2h0cygpXHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIGFscmVhZHkgc2Nyb2xsZWQgdG8gdGhlIGJvdHRvbSwgc2Nyb2xsIHRvIGVuc3VyZSB0aGF0IHRoZSBzY3JvbGxiYXIgcmVtYWlucyBhdFxyXG4gICAgLy8gdGhlIGJvdHRvbS4gVGhpcyBpcyBpbXBvcnRhbnQgbm90IGp1c3QgZm9yIGlmIHRoZSBsYXN0IHJlY29yZCBjaGFuZ2VzIGhlaWdodCB0aHJvdWdoIHVzZXJcclxuICAgIC8vIGludGVyYWN0aW9uIChlLmcuIGV4cGFuZGluZyBhIGRlYnVnZ2VyIHZhcmlhYmxlKSwgYnV0IGFsc28gYmVjYXVzZSB0aGlzIGlzIHRoZSBtZWNoYW5pc21cclxuICAgIC8vIHRocm91Z2ggd2hpY2ggdGhlIHJlY29yZCdzIHRydWUgaW5pdGlhbCBoZWlnaHQgaXMgcmVwb3J0ZWQuIFRoZXJlZm9yZSwgd2UgbWF5IGhhdmUgc2Nyb2xsZWRcclxuICAgIC8vIHRvIHRoZSBib3R0b20sIGFuZCBvbmx5IGFmdGVyd2FyZHMgcmVjZWl2ZWQgaXRzIHRydWUgaGVpZ2h0LiBJbiB0aGlzIGNhc2UsIGl0J3MgaW1wb3J0YW50XHJcbiAgICAvLyB0aGF0IHdlIHRoZW4gc2Nyb2xsIHRvIHRoZSBuZXcgYm90dG9tLlxyXG4gICAgaWYgKHRoaXMucHJvcHMuc2hvdWxkU2Nyb2xsVG9Cb3R0b20oKSkge1xyXG4gICAgICB0aGlzLnNjcm9sbFRvQm90dG9tKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVMaXN0UmVuZGVyID0gKG9wdHM6IHsgc3RhcnRJbmRleDogbnVtYmVyLCBzdG9wSW5kZXg6IG51bWJlciB9KTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLl9zdGFydEluZGV4ID0gb3B0cy5zdGFydEluZGV4XHJcbiAgICB0aGlzLl9zdG9wSW5kZXggPSBvcHRzLnN0b3BJbmRleFxyXG4gIH1cclxuXHJcbiAgc2Nyb2xsVG9Cb3R0b20oKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5fbGlzdCAhPSBudWxsKSB7XHJcbiAgICAgIC8vICRGbG93SWdub3JlIFVudHlwZWQgcmVhY3QtdmlydHVhbGl6ZWQgTGlzdCBtZXRob2RcclxuICAgICAgdGhpcy5fbGlzdC5zY3JvbGxUb1Jvdyh0aGlzLnByb3BzLnJlY29yZHMubGVuZ3RoIC0gMSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9nZXRFeGVjdXRvciA9IChpZDogc3RyaW5nKTogP0V4ZWN1dG9yID0+IHtcclxuICAgIHJldHVybiB0aGlzLnByb3BzLmdldEV4ZWN1dG9yKGlkKVxyXG4gIH1cclxuXHJcbiAgX2dldFByb3ZpZGVyID0gKGlkOiBzdHJpbmcpOiA/U291cmNlSW5mbyA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5nZXRQcm92aWRlcihpZClcclxuICB9XHJcblxyXG4gIF9yZW5kZXJSb3cgPSAocm93TWV0YWRhdGE6IFJvd1JlbmRlcmVyUGFyYW1zKTogUmVhY3QuRWxlbWVudDxhbnk+ID0+IHtcclxuICAgIGNvbnN0IHsgaW5kZXgsIHN0eWxlIH0gPSByb3dNZXRhZGF0YVxyXG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5wcm9wcy5yZWNvcmRzW2luZGV4XVxyXG4gICAgY29uc3Qga2V5ID1cclxuICAgICAgcmVjb3JkLm1lc3NhZ2VJZCAhPSBudWxsID8gYG1lc3NhZ2VJZDoke3JlY29yZC5tZXNzYWdlSWR9YCA6IGByZWNvcmRIYXNoOiR7dGhpcy5faGFzaGVyLmdldEhhc2gocmVjb3JkKX1gXHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgPGRpdiBrZXk9e2tleX0gY2xhc3NOYW1lPVwiY29uc29sZS10YWJsZS1yb3ctd3JhcHBlclwiIHN0eWxlPXtzdHlsZX0+XHJcbiAgICAgICAgPFJlY29yZFZpZXdcclxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2pzeC1zaW1wbGUtY2FsbGJhY2stcmVmc1xyXG4gICAgICAgICAgcmVmPXsodmlldzogP1JlY29yZFZpZXcpID0+IHtcclxuICAgICAgICAgICAgaWYgKHZpZXcgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5zZXQocmVjb3JkLCB2aWV3KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVkUmVjb3Jkcy5kZWxldGUocmVjb3JkKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9fVxyXG4gICAgICAgICAgZ2V0RXhlY3V0b3I9e3RoaXMuX2dldEV4ZWN1dG9yfVxyXG4gICAgICAgICAgZ2V0UHJvdmlkZXI9e3RoaXMuX2dldFByb3ZpZGVyfVxyXG4gICAgICAgICAgcmVjb3JkPXtyZWNvcmR9XHJcbiAgICAgICAgICBleHBhbnNpb25TdGF0ZUlkPXt0aGlzLl9leHBhbnNpb25TdGF0ZUlkcy5nZXQocmVjb3JkKX1cclxuICAgICAgICAgIHNob3dTb3VyY2VMYWJlbD17dGhpcy5wcm9wcy5zaG93U291cmNlTGFiZWxzfVxyXG4gICAgICAgICAgb25IZWlnaHRDaGFuZ2U9e3RoaXMuX2hhbmRsZVJlY29yZEhlaWdodENoYW5nZX1cclxuICAgICAgICAvPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIClcclxuICB9XHJcblxyXG4gIF9jb250YWluZXJSZW5kZXJlZCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXRlLndpZHRoICE9PSAwICYmIHRoaXMuc3RhdGUuaGVpZ2h0ICE9PSAwXHJcbiAgfVxyXG5cclxuICBfZ2V0Um93SGVpZ2h0ID0gKHsgaW5kZXggfTogUm93SGVpZ2h0UGFyYW1zKTogbnVtYmVyID0+IHtcclxuICAgIHJldHVybiB0aGlzLl9oZWlnaHRzLmdldCh0aGlzLnByb3BzLnJlY29yZHNbaW5kZXhdKVxyXG4gIH1cclxuXHJcbiAgX2hhbmRsZVRhYmxlV3JhcHBlciA9ICh0YWJsZVdyYXBwZXI6IEhUTUxFbGVtZW50KTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLl93cmFwcGVyID0gdGFibGVXcmFwcGVyXHJcbiAgfVxyXG5cclxuICBfaGFuZGxlTGlzdFJlZiA9IChsaXN0UmVmOiBSZWFjdC5FbGVtZW50PGFueT4pOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSB0aGlzLl9saXN0XHJcbiAgICB0aGlzLl9saXN0ID0gbGlzdFJlZlxyXG5cclxuICAgIC8vIFRoZSBjaGlsZCByb3dzIHJlbmRlciBiZWZvcmUgdGhpcyByZWYgZ2V0cyBzZXQuIFNvLCBpZiB3ZSBhcmUgY29taW5nIGZyb21cclxuICAgIC8vIGEgc3RhdGUgd2hlcmUgdGhlIHJlZiB3YXMgbnVsbCwgd2Ugc2hvdWxkIGVuc3VyZSB3ZSBub3RpZnlcclxuICAgIC8vIHJlYWN0LXZpcnR1YWxpemVkIHRoYXQgd2UgaGF2ZSBtZWFzdXJlbWVudHMuXHJcbiAgICBpZiAocHJldmlvdXNWYWx1ZSA9PSBudWxsICYmIHRoaXMuX2xpc3QgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLl9oZWlnaHRDaGFuZ2VzLm5leHQobnVsbClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVSZXNpemUgPSAoaGVpZ2h0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgIGlmIChoZWlnaHQgPT09IHRoaXMuc3RhdGUuaGVpZ2h0ICYmIHdpZHRoID09PSB0aGlzLnN0YXRlLndpZHRoKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgIHdpZHRoLFxyXG4gICAgICBoZWlnaHQsXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIFdoZW4gdGhpcyBjb21wb25lbnQgcmVzaXplcywgdGhlIGlubmVyIHJlY29yZHMgd2lsbFxyXG4gICAgLy8gYWxzbyByZXNpemUgYW5kIHBvdGVudGlhbGx5IGhhdmUgdGhlaXIgaGVpZ2h0cyBjaGFuZ2VcclxuICAgIC8vIFNvIHdlIG1lYXN1cmUgYWxsIG9mIHRoZWlyIGhlaWdodHMgYWdhaW4gaGVyZVxyXG4gICAgdGhpcy5fcmVuZGVyZWRSZWNvcmRzLmZvckVhY2goKHJlY29yZFZpZXcpID0+IHJlY29yZFZpZXcubWVhc3VyZUFuZE5vdGlmeUhlaWdodCgpKVxyXG4gIH1cclxuXHJcbiAgX2hhbmRsZVJlY29yZEhlaWdodENoYW5nZSA9IChyZWNvcmQ6IFJlY29yZCwgbmV3SGVpZ2h0OiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IG9sZEhlaWdodCA9IHRoaXMuX2hlaWdodHMuZ2V0KHJlY29yZClcclxuICAgIGlmIChvbGRIZWlnaHQgIT09IG5ld0hlaWdodCkge1xyXG4gICAgICB0aGlzLl9oZWlnaHRzLnNldChyZWNvcmQsIG5ld0hlaWdodClcclxuICAgICAgdGhpcy5faGVpZ2h0Q2hhbmdlcy5uZXh0KG51bGwpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBfb25TY3JvbGwgPSAoeyBjbGllbnRIZWlnaHQsIHNjcm9sbEhlaWdodCwgc2Nyb2xsVG9wIH06IE9uU2Nyb2xsUGFyYW1zKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLnByb3BzLm9uU2Nyb2xsKGNsaWVudEhlaWdodCwgc2Nyb2xsSGVpZ2h0LCBzY3JvbGxUb3ApXHJcbiAgfVxyXG59XHJcbiJdfQ==