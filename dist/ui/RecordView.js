"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classnames = _interopRequireDefault(require("classnames"));

var _MeasuredComponent = require("@atom-ide-community/nuclide-commons-ui/MeasuredComponent");

var React = _interopRequireWildcard(require("react"));

var _ExpressionTreeComponent = require("../commons/ExpressionTreeComponent");

var _SimpleValueComponent = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/SimpleValueComponent"));

var _FullWidthProgressBar = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/FullWidthProgressBar"));

var _shallowequal = _interopRequireDefault(require("shallowequal"));

var _Ansi = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/Ansi"));

var _debounce = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/debounce"));

var _parseText = _interopRequireDefault(require("../parseText"));

var _nullthrows = _interopRequireDefault(require("nullthrows"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Fix lint rule, this is in the same package!
// eslint-disable-next-line nuclide-internal/modules-dependencies
const AnsiRenderSegment = ({
  key,
  style,
  content
}) => /*#__PURE__*/React.createElement("span", {
  key: key,
  style: style,
  className: "nuclide-console-default-text-colors"
}, (0, _parseText.default)(content));

const ONE_DAY = 1000 * 60 * 60 * 24;

class RecordView extends React.Component {
  constructor(props) {
    super(props) // The MeasuredComponent can call this many times in quick succession as the
    // child components render, so we debounce it since we only want to know about
    // the height change once everything has settled down
    ;
    this._wrapper = void 0;
    this._debouncedMeasureAndNotifyHeight = void 0;

    this.measureAndNotifyHeight = () => {
      if (this._wrapper == null) {
        return;
      }

      const {
        offsetHeight
      } = this._wrapper;
      this.props.onHeightChange(this.props.record, offsetHeight);
    };

    this._handleRecordWrapper = wrapper => {
      this._wrapper = wrapper;
    };

    this._debouncedMeasureAndNotifyHeight = (0, _debounce.default)(this.measureAndNotifyHeight, 10);
  }

  componentDidMount() {
    // We initially assume a height for the record. After it is actually
    // rendered we need it to measure its actual height and report it
    this.measureAndNotifyHeight();
  }

  componentDidUpdate(prevProps) {
    // Record is an immutable object, so any change that would affect a height
    // change should result in us getting a new object.
    if (this.props.record !== prevProps.record) {
      this.measureAndNotifyHeight();
    }
  }

  componentWillUnmount() {
    this._debouncedMeasureAndNotifyHeight.dispose();
  }

  _renderContent() {
    const {
      record
    } = this.props;

    if (record.kind === "request") {
      // TODO: We really want to use a text editor to render this so that we can get syntax
      // highlighting, but they're just too expensive. Figure out a less-expensive way to get syntax
      // highlighting.
      return /*#__PURE__*/React.createElement("pre", null, record.text || " ");
    } else if (record.expressions != null) {
      return this._renderNestedValueComponent();
    } else {
      // If there's not text, use a space to make sure the row doesn't collapse.
      const text = record.text || " ";

      if (record.format === "ansi") {
        return /*#__PURE__*/React.createElement(_Ansi.default, {
          renderSegment: AnsiRenderSegment
        }, text);
      }

      return /*#__PURE__*/React.createElement("pre", null, (0, _parseText.default)(text));
    }
  }

  shouldComponentUpdate(nextProps) {
    return !(0, _shallowequal.default)(this.props, nextProps);
  }

  _renderNestedValueComponent() {
    const {
      record,
      expansionStateId
    } = this.props;
    const expressions = (0, _nullthrows.default)(record.expressions); // Render multiple objects.

    const children = [];

    for (const expression of expressions) {
      if (!expression.hasChildren()) {
        children.push( /*#__PURE__*/React.createElement(_SimpleValueComponent.default, {
          hideExpressionName: true,
          expression: expression
        }));
      } else {
        children.push( /*#__PURE__*/React.createElement(_ExpressionTreeComponent.ExpressionTreeComponent, {
          className: "console-expression-tree-value",
          expression: expression,
          containerContext: expansionStateId,
          hideExpressionName: true
        }));
      }
    }

    return children.length <= 1 ? children[0] : /*#__PURE__*/React.createElement("span", {
      className: "console-multiple-objects"
    }, children);
  }

  render() {
    const {
      record
    } = this.props;
    const {
      level,
      kind,
      timestamp,
      sourceId,
      sourceName
    } = record;
    const classNames = (0, _classnames.default)("console-record", `level-${level || "log"}`, {
      request: kind === "request",
      response: kind === "response",
      // Allow native keybindings for text-only nodes. The ExpressionTreeComponent
      // will handle keybindings for expression nodes.
      "native-key-bindings": record.expressions == null || record.expressions.length === 0
    });
    const iconName = getIconName(record); // flowlint-next-line sketchy-null-string:off

    const icon = iconName ? /*#__PURE__*/React.createElement("span", {
      className: `icon icon-${iconName}`
    }) : null;
    const sourceLabel = this.props.showSourceLabel ? /*#__PURE__*/React.createElement("span", {
      className: `console-record-source-label ${getHighlightClassName(level)}`
    }, sourceName !== null && sourceName !== void 0 ? sourceName : sourceId) : null;
    let renderedTimestamp;

    if (timestamp != null) {
      const timestampLabel = Date.now() - timestamp > ONE_DAY ? timestamp.toLocaleString() : timestamp.toLocaleTimeString();
      renderedTimestamp = /*#__PURE__*/React.createElement("div", {
        className: "console-record-timestamp"
      }, timestampLabel);
    }

    return /*#__PURE__*/React.createElement(_MeasuredComponent.MeasuredComponent, {
      onMeasurementsChanged: this._debouncedMeasureAndNotifyHeight
    }, /*#__PURE__*/React.createElement("div", {
      ref: this._handleRecordWrapper,
      className: classNames,
      tabIndex: "0"
    }, icon, /*#__PURE__*/React.createElement("div", {
      className: "console-record-content-wrapper"
    }, record.repeatCount > 1 && /*#__PURE__*/React.createElement("div", {
      className: "console-record-duplicate-number"
    }, record.repeatCount), /*#__PURE__*/React.createElement("div", {
      className: "console-record-content"
    }, this._renderContent())), sourceLabel, renderedTimestamp, /*#__PURE__*/React.createElement(_FullWidthProgressBar.default, {
      progress: null,
      visible: record.incomplete
    })));
  }

}

exports.default = RecordView;

function getHighlightClassName(level) {
  switch (level) {
    case "info":
      return "highlight-info";

    case "success":
      return "highlight-success";

    case "warning":
      return "highlight-warning";

    case "error":
      return "highlight-error";

    default:
      return "highlight";
  }
}

function getIconName(record) {
  switch (record.kind) {
    case "request":
      return "chevron-right";

    case "response":
      return "arrow-small-left";
  }

  switch (record.level) {
    case "info":
      return "info";

    case "success":
      return "check";

    case "warning":
      return "alert";

    case "error":
      return "stop";
  }
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlY29yZFZpZXcuanMiXSwibmFtZXMiOlsiQW5zaVJlbmRlclNlZ21lbnQiLCJrZXkiLCJzdHlsZSIsImNvbnRlbnQiLCJPTkVfREFZIiwiUmVjb3JkVmlldyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl93cmFwcGVyIiwiX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQiLCJtZWFzdXJlQW5kTm90aWZ5SGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0Iiwib25IZWlnaHRDaGFuZ2UiLCJyZWNvcmQiLCJfaGFuZGxlUmVjb3JkV3JhcHBlciIsIndyYXBwZXIiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiZGlzcG9zZSIsIl9yZW5kZXJDb250ZW50Iiwia2luZCIsInRleHQiLCJleHByZXNzaW9ucyIsIl9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCIsImZvcm1hdCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5leHRQcm9wcyIsImV4cGFuc2lvblN0YXRlSWQiLCJjaGlsZHJlbiIsImV4cHJlc3Npb24iLCJoYXNDaGlsZHJlbiIsInB1c2giLCJsZW5ndGgiLCJyZW5kZXIiLCJsZXZlbCIsInRpbWVzdGFtcCIsInNvdXJjZUlkIiwic291cmNlTmFtZSIsImNsYXNzTmFtZXMiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJpY29uTmFtZSIsImdldEljb25OYW1lIiwiaWNvbiIsInNvdXJjZUxhYmVsIiwic2hvd1NvdXJjZUxhYmVsIiwiZ2V0SGlnaGxpZ2h0Q2xhc3NOYW1lIiwicmVuZGVyZWRUaW1lc3RhbXAiLCJ0aW1lc3RhbXBMYWJlbCIsIkRhdGUiLCJub3ciLCJ0b0xvY2FsZVN0cmluZyIsInRvTG9jYWxlVGltZVN0cmluZyIsInJlcGVhdENvdW50IiwiaW5jb21wbGV0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUdBOztB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QUFTLEVBQUM7QUFBZixPQUNHaEMsTUFBTSxDQUFDMEMsV0FBUCxHQUFxQixDQUFyQixpQkFBMEI7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQWtEMUMsTUFBTSxDQUFDMEMsV0FBekQsQ0FEN0IsZUFFRTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FBeUMsS0FBS2xDLGNBQUwsRUFBekMsQ0FGRixDQUZGLEVBTUd5QixXQU5ILEVBT0dHLGlCQVBILGVBUUcsb0JBQUMsNkJBQUQ7QUFBc0IsTUFBQSxRQUFRLEVBQUUsSUFBaEM7QUFBc0MsTUFBQSxPQUFPLEVBQUVwQyxNQUFNLENBQUMyQztBQUF0RCxNQVJILENBRkYsQ0FERjtBQWVEOztBQXJINEQ7Ozs7QUFvSS9ELFNBQVNSLHFCQUFULENBQStCWixLQUEvQixFQUFxRDtBQUNuRCxVQUFRQSxLQUFSO0FBQ0UsU0FBSyxNQUFMO0FBQ0UsYUFBTyxnQkFBUDs7QUFDRixTQUFLLFNBQUw7QUFDRSxhQUFPLG1CQUFQOztBQUNGLFNBQUssU0FBTDtBQUNFLGFBQU8sbUJBQVA7O0FBQ0YsU0FBSyxPQUFMO0FBQ0UsYUFBTyxpQkFBUDs7QUFDRjtBQUNFLGFBQU8sV0FBUDtBQVZKO0FBWUQ7O0FBRUQsU0FBU1EsV0FBVCxDQUFxQi9CLE1BQXJCLEVBQThDO0FBQzVDLFVBQVFBLE1BQU0sQ0FBQ1MsSUFBZjtBQUNFLFNBQUssU0FBTDtBQUNFLGFBQU8sZUFBUDs7QUFDRixTQUFLLFVBQUw7QUFDRSxhQUFPLGtCQUFQO0FBSko7O0FBTUEsVUFBUVQsTUFBTSxDQUFDdUIsS0FBZjtBQUNFLFNBQUssTUFBTDtBQUNFLGFBQU8sTUFBUDs7QUFDRixTQUFLLFNBQUw7QUFDRSxhQUFPLE9BQVA7O0FBQ0YsU0FBSyxTQUFMO0FBQ0UsYUFBTyxPQUFQOztBQUNGLFNBQUssT0FBTDtBQUNFLGFBQU8sTUFBUDtBQVJKO0FBVUQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IExldmVsLCBSZWNvcmQgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHR5cGUgeyBSZW5kZXJTZWdtZW50UHJvcHMgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQW5zaVwiXG5cbmltcG9ydCBjbGFzc25hbWVzIGZyb20gXCJjbGFzc25hbWVzXCJcbmltcG9ydCB7IE1lYXN1cmVkQ29tcG9uZW50IH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL01lYXN1cmVkQ29tcG9uZW50XCJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5cbi8vIFRPRE86IEZpeCBsaW50IHJ1bGUsIHRoaXMgaXMgaW4gdGhlIHNhbWUgcGFja2FnZSFcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL21vZHVsZXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgeyBFeHByZXNzaW9uVHJlZUNvbXBvbmVudCB9IGZyb20gXCIuLi9jb21tb25zL0V4cHJlc3Npb25UcmVlQ29tcG9uZW50XCJcbmltcG9ydCBTaW1wbGVWYWx1ZUNvbXBvbmVudCBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvU2ltcGxlVmFsdWVDb21wb25lbnRcIlxuaW1wb3J0IEZ1bGxXaWR0aFByb2dyZXNzQmFyIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9GdWxsV2lkdGhQcm9ncmVzc0JhclwiXG5pbXBvcnQgc2hhbGxvd0VxdWFsIGZyb20gXCJzaGFsbG93ZXF1YWxcIlxuaW1wb3J0IEFuc2kgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0Fuc2lcIlxuaW1wb3J0IGRlYm91bmNlIGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9kZWJvdW5jZVwiXG5pbXBvcnQgcGFyc2VUZXh0IGZyb20gXCIuLi9wYXJzZVRleHRcIlxuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSBcIm51bGx0aHJvd3NcIlxuXG50eXBlIFByb3BzID0ge1xuICByZWNvcmQ6IFJlY29yZCxcbiAgc2hvd1NvdXJjZUxhYmVsOiBib29sZWFuLFxuICBvbkhlaWdodENoYW5nZTogKHJlY29yZDogUmVjb3JkLCBuZXdIZWlnaHQ6IG51bWJlcikgPT4gdm9pZCxcbiAgZXhwYW5zaW9uU3RhdGVJZDogT2JqZWN0LFxufVxuXG5jb25zdCBBbnNpUmVuZGVyU2VnbWVudCA9ICh7IGtleSwgc3R5bGUsIGNvbnRlbnQgfTogUmVuZGVyU2VnbWVudFByb3BzKSA9PiAoXG4gIDxzcGFuIGtleT17a2V5fSBzdHlsZT17c3R5bGV9IGNsYXNzTmFtZT1cIm51Y2xpZGUtY29uc29sZS1kZWZhdWx0LXRleHQtY29sb3JzXCI+XG4gICAge3BhcnNlVGV4dChjb250ZW50KX1cbiAgPC9zcGFuPlxuKVxuXG5jb25zdCBPTkVfREFZID0gMTAwMCAqIDYwICogNjAgKiAyNFxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVjb3JkVmlldyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBfd3JhcHBlcjogP0hUTUxFbGVtZW50XG4gIF9kZWJvdW5jZWRNZWFzdXJlQW5kTm90aWZ5SGVpZ2h0OiAoKSA9PiB2b2lkXG5cbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG5cbiAgICAvLyBUaGUgTWVhc3VyZWRDb21wb25lbnQgY2FuIGNhbGwgdGhpcyBtYW55IHRpbWVzIGluIHF1aWNrIHN1Y2Nlc3Npb24gYXMgdGhlXG4gICAgLy8gY2hpbGQgY29tcG9uZW50cyByZW5kZXIsIHNvIHdlIGRlYm91bmNlIGl0IHNpbmNlIHdlIG9ubHkgd2FudCB0byBrbm93IGFib3V0XG4gICAgLy8gdGhlIGhlaWdodCBjaGFuZ2Ugb25jZSBldmVyeXRoaW5nIGhhcyBzZXR0bGVkIGRvd25cbiAgICA7KHRoaXM6IGFueSkuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQgPSBkZWJvdW5jZSh0aGlzLm1lYXN1cmVBbmROb3RpZnlIZWlnaHQsIDEwKVxuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgLy8gV2UgaW5pdGlhbGx5IGFzc3VtZSBhIGhlaWdodCBmb3IgdGhlIHJlY29yZC4gQWZ0ZXIgaXQgaXMgYWN0dWFsbHlcbiAgICAvLyByZW5kZXJlZCB3ZSBuZWVkIGl0IHRvIG1lYXN1cmUgaXRzIGFjdHVhbCBoZWlnaHQgYW5kIHJlcG9ydCBpdFxuICAgIHRoaXMubWVhc3VyZUFuZE5vdGlmeUhlaWdodCgpXG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBQcm9wcykge1xuICAgIC8vIFJlY29yZCBpcyBhbiBpbW11dGFibGUgb2JqZWN0LCBzbyBhbnkgY2hhbmdlIHRoYXQgd291bGQgYWZmZWN0IGEgaGVpZ2h0XG4gICAgLy8gY2hhbmdlIHNob3VsZCByZXN1bHQgaW4gdXMgZ2V0dGluZyBhIG5ldyBvYmplY3QuXG4gICAgaWYgKHRoaXMucHJvcHMucmVjb3JkICE9PSBwcmV2UHJvcHMucmVjb3JkKSB7XG4gICAgICB0aGlzLm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKVxuICAgIH1cbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQuZGlzcG9zZSgpXG4gIH1cblxuICBfcmVuZGVyQ29udGVudCgpOiBSZWFjdC5FbGVtZW50PGFueT4ge1xuICAgIGNvbnN0IHsgcmVjb3JkIH0gPSB0aGlzLnByb3BzXG4gICAgaWYgKHJlY29yZC5raW5kID09PSBcInJlcXVlc3RcIikge1xuICAgICAgLy8gVE9ETzogV2UgcmVhbGx5IHdhbnQgdG8gdXNlIGEgdGV4dCBlZGl0b3IgdG8gcmVuZGVyIHRoaXMgc28gdGhhdCB3ZSBjYW4gZ2V0IHN5bnRheFxuICAgICAgLy8gaGlnaGxpZ2h0aW5nLCBidXQgdGhleSdyZSBqdXN0IHRvbyBleHBlbnNpdmUuIEZpZ3VyZSBvdXQgYSBsZXNzLWV4cGVuc2l2ZSB3YXkgdG8gZ2V0IHN5bnRheFxuICAgICAgLy8gaGlnaGxpZ2h0aW5nLlxuICAgICAgcmV0dXJuIDxwcmU+e3JlY29yZC50ZXh0IHx8IFwiIFwifTwvcHJlPlxuICAgIH0gZWxzZSBpZiAocmVjb3JkLmV4cHJlc3Npb25zICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm90IHRleHQsIHVzZSBhIHNwYWNlIHRvIG1ha2Ugc3VyZSB0aGUgcm93IGRvZXNuJ3QgY29sbGFwc2UuXG4gICAgICBjb25zdCB0ZXh0ID0gcmVjb3JkLnRleHQgfHwgXCIgXCJcblxuICAgICAgaWYgKHJlY29yZC5mb3JtYXQgPT09IFwiYW5zaVwiKSB7XG4gICAgICAgIHJldHVybiA8QW5zaSByZW5kZXJTZWdtZW50PXtBbnNpUmVuZGVyU2VnbWVudH0+e3RleHR9PC9BbnNpPlxuICAgICAgfVxuICAgICAgcmV0dXJuIDxwcmU+e3BhcnNlVGV4dCh0ZXh0KX08L3ByZT5cbiAgICB9XG4gIH1cblxuICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzOiBQcm9wcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhc2hhbGxvd0VxdWFsKHRoaXMucHJvcHMsIG5leHRQcm9wcylcbiAgfVxuXG4gIF9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCgpOiBSZWFjdC5FbGVtZW50PGFueT4ge1xuICAgIGNvbnN0IHsgcmVjb3JkLCBleHBhbnNpb25TdGF0ZUlkIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSBudWxsdGhyb3dzKHJlY29yZC5leHByZXNzaW9ucylcblxuICAgIC8vIFJlbmRlciBtdWx0aXBsZSBvYmplY3RzLlxuICAgIGNvbnN0IGNoaWxkcmVuID0gW11cbiAgICBmb3IgKGNvbnN0IGV4cHJlc3Npb24gb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgIGlmICghZXhwcmVzc2lvbi5oYXNDaGlsZHJlbigpKSB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2goPFNpbXBsZVZhbHVlQ29tcG9uZW50IGhpZGVFeHByZXNzaW9uTmFtZT17dHJ1ZX0gZXhwcmVzc2lvbj17ZXhwcmVzc2lvbn0gLz4pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgIDxFeHByZXNzaW9uVHJlZUNvbXBvbmVudFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiY29uc29sZS1leHByZXNzaW9uLXRyZWUtdmFsdWVcIlxuICAgICAgICAgICAgZXhwcmVzc2lvbj17ZXhwcmVzc2lvbn1cbiAgICAgICAgICAgIGNvbnRhaW5lckNvbnRleHQ9e2V4cGFuc2lvblN0YXRlSWR9XG4gICAgICAgICAgICBoaWRlRXhwcmVzc2lvbk5hbWU9e3RydWV9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW4ubGVuZ3RoIDw9IDEgPyBjaGlsZHJlblswXSA6IDxzcGFuIGNsYXNzTmFtZT1cImNvbnNvbGUtbXVsdGlwbGUtb2JqZWN0c1wiPntjaGlsZHJlbn08L3NwYW4+XG4gIH1cblxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XG4gICAgY29uc3QgeyByZWNvcmQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGxldmVsLCBraW5kLCB0aW1lc3RhbXAsIHNvdXJjZUlkLCBzb3VyY2VOYW1lIH0gPSByZWNvcmRcblxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc25hbWVzKFwiY29uc29sZS1yZWNvcmRcIiwgYGxldmVsLSR7bGV2ZWwgfHwgXCJsb2dcIn1gLCB7XG4gICAgICByZXF1ZXN0OiBraW5kID09PSBcInJlcXVlc3RcIixcbiAgICAgIHJlc3BvbnNlOiBraW5kID09PSBcInJlc3BvbnNlXCIsXG4gICAgICAvLyBBbGxvdyBuYXRpdmUga2V5YmluZGluZ3MgZm9yIHRleHQtb25seSBub2Rlcy4gVGhlIEV4cHJlc3Npb25UcmVlQ29tcG9uZW50XG4gICAgICAvLyB3aWxsIGhhbmRsZSBrZXliaW5kaW5ncyBmb3IgZXhwcmVzc2lvbiBub2Rlcy5cbiAgICAgIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiOiByZWNvcmQuZXhwcmVzc2lvbnMgPT0gbnVsbCB8fCByZWNvcmQuZXhwcmVzc2lvbnMubGVuZ3RoID09PSAwLFxuICAgIH0pXG5cbiAgICBjb25zdCBpY29uTmFtZSA9IGdldEljb25OYW1lKHJlY29yZClcbiAgICAvLyBmbG93bGludC1uZXh0LWxpbmUgc2tldGNoeS1udWxsLXN0cmluZzpvZmZcbiAgICBjb25zdCBpY29uID0gaWNvbk5hbWUgPyA8c3BhbiBjbGFzc05hbWU9e2BpY29uIGljb24tJHtpY29uTmFtZX1gfSAvPiA6IG51bGxcbiAgICBjb25zdCBzb3VyY2VMYWJlbCA9IHRoaXMucHJvcHMuc2hvd1NvdXJjZUxhYmVsID8gKFxuICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgY29uc29sZS1yZWNvcmQtc291cmNlLWxhYmVsICR7Z2V0SGlnaGxpZ2h0Q2xhc3NOYW1lKGxldmVsKX1gfT57c291cmNlTmFtZSA/PyBzb3VyY2VJZH08L3NwYW4+XG4gICAgKSA6IG51bGxcbiAgICBsZXQgcmVuZGVyZWRUaW1lc3RhbXBcbiAgICBpZiAodGltZXN0YW1wICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcExhYmVsID1cbiAgICAgICAgRGF0ZS5ub3coKSAtIHRpbWVzdGFtcCA+IE9ORV9EQVkgPyB0aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoKSA6IHRpbWVzdGFtcC50b0xvY2FsZVRpbWVTdHJpbmcoKVxuICAgICAgcmVuZGVyZWRUaW1lc3RhbXAgPSA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLXRpbWVzdGFtcFwiPnt0aW1lc3RhbXBMYWJlbH08L2Rpdj5cbiAgICB9XG4gICAgcmV0dXJuIChcbiAgICAgIDxNZWFzdXJlZENvbXBvbmVudCBvbk1lYXN1cmVtZW50c0NoYW5nZWQ9e3RoaXMuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHR9PlxuICAgICAgICB7LyogJEZsb3dGaXhNZSg+PTAuNTMuMCkgRmxvdyBzdXBwcmVzcyAqL31cbiAgICAgICAgPGRpdiByZWY9e3RoaXMuX2hhbmRsZVJlY29yZFdyYXBwZXJ9IGNsYXNzTmFtZT17Y2xhc3NOYW1lc30gdGFiSW5kZXg9XCIwXCI+XG4gICAgICAgICAge2ljb259XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXJlY29yZC1jb250ZW50LXdyYXBwZXJcIj5cbiAgICAgICAgICAgIHtyZWNvcmQucmVwZWF0Q291bnQgPiAxICYmIDxkaXYgY2xhc3NOYW1lPVwiY29uc29sZS1yZWNvcmQtZHVwbGljYXRlLW51bWJlclwiPntyZWNvcmQucmVwZWF0Q291bnR9PC9kaXY+fVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXJlY29yZC1jb250ZW50XCI+e3RoaXMuX3JlbmRlckNvbnRlbnQoKX08L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7c291cmNlTGFiZWx9XG4gICAgICAgICAge3JlbmRlcmVkVGltZXN0YW1wfVxuICAgICAgICAgIHs8RnVsbFdpZHRoUHJvZ3Jlc3NCYXIgcHJvZ3Jlc3M9e251bGx9IHZpc2libGU9e3JlY29yZC5pbmNvbXBsZXRlfSAvPn1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L01lYXN1cmVkQ29tcG9uZW50PlxuICAgIClcbiAgfVxuXG4gIG1lYXN1cmVBbmROb3RpZnlIZWlnaHQgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuX3dyYXBwZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHsgb2Zmc2V0SGVpZ2h0IH0gPSB0aGlzLl93cmFwcGVyXG4gICAgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZSh0aGlzLnByb3BzLnJlY29yZCwgb2Zmc2V0SGVpZ2h0KVxuICB9XG5cbiAgX2hhbmRsZVJlY29yZFdyYXBwZXIgPSAod3JhcHBlcjogSFRNTEVsZW1lbnQpID0+IHtcbiAgICB0aGlzLl93cmFwcGVyID0gd3JhcHBlclxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEhpZ2hsaWdodENsYXNzTmFtZShsZXZlbDogTGV2ZWwpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgY2FzZSBcImluZm9cIjpcbiAgICAgIHJldHVybiBcImhpZ2hsaWdodC1pbmZvXCJcbiAgICBjYXNlIFwic3VjY2Vzc1wiOlxuICAgICAgcmV0dXJuIFwiaGlnaGxpZ2h0LXN1Y2Nlc3NcIlxuICAgIGNhc2UgXCJ3YXJuaW5nXCI6XG4gICAgICByZXR1cm4gXCJoaWdobGlnaHQtd2FybmluZ1wiXG4gICAgY2FzZSBcImVycm9yXCI6XG4gICAgICByZXR1cm4gXCJoaWdobGlnaHQtZXJyb3JcIlxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJoaWdobGlnaHRcIlxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEljb25OYW1lKHJlY29yZDogUmVjb3JkKTogP3N0cmluZyB7XG4gIHN3aXRjaCAocmVjb3JkLmtpbmQpIHtcbiAgICBjYXNlIFwicmVxdWVzdFwiOlxuICAgICAgcmV0dXJuIFwiY2hldnJvbi1yaWdodFwiXG4gICAgY2FzZSBcInJlc3BvbnNlXCI6XG4gICAgICByZXR1cm4gXCJhcnJvdy1zbWFsbC1sZWZ0XCJcbiAgfVxuICBzd2l0Y2ggKHJlY29yZC5sZXZlbCkge1xuICAgIGNhc2UgXCJpbmZvXCI6XG4gICAgICByZXR1cm4gXCJpbmZvXCJcbiAgICBjYXNlIFwic3VjY2Vzc1wiOlxuICAgICAgcmV0dXJuIFwiY2hlY2tcIlxuICAgIGNhc2UgXCJ3YXJuaW5nXCI6XG4gICAgICByZXR1cm4gXCJhbGVydFwiXG4gICAgY2FzZSBcImVycm9yXCI6XG4gICAgICByZXR1cm4gXCJzdG9wXCJcbiAgfVxufVxuIl19