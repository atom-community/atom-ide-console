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
    super(props); // The MeasuredComponent can call this many times in quick succession as the
    // child components render, so we debounce it since we only want to know about
    // the height change once everything has settled down

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

    if (record.kind === 'request') {
      // TODO: We really want to use a text editor to render this so that we can get syntax
      // highlighting, but they're just too expensive. Figure out a less-expensive way to get syntax
      // highlighting.
      return /*#__PURE__*/React.createElement("pre", null, record.text || ' ');
    } else if (record.expressions != null) {
      return this._renderNestedValueComponent();
    } else {
      // If there's not text, use a space to make sure the row doesn't collapse.
      const text = record.text || ' ';

      if (record.format === 'ansi') {
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
    const classNames = (0, _classnames.default)('console-record', `level-${level || 'log'}`, {
      request: kind === 'request',
      response: kind === 'response',
      // Allow native keybindings for text-only nodes. The ExpressionTreeComponent
      // will handle keybindings for expression nodes.
      'native-key-bindings': record.expressions == null || record.expressions.length === 0
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
    case 'info':
      return 'highlight-info';

    case 'success':
      return 'highlight-success';

    case 'warning':
      return 'highlight-warning';

    case 'error':
      return 'highlight-error';

    default:
      return 'highlight';
  }
}

function getIconName(record) {
  switch (record.kind) {
    case 'request':
      return 'chevron-right';

    case 'response':
      return 'arrow-small-left';
  }

  switch (record.level) {
    case 'info':
      return 'info';

    case 'success':
      return 'check';

    case 'warning':
      return 'alert';

    case 'error':
      return 'stop';
  }
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlY29yZFZpZXcuanMiXSwibmFtZXMiOlsiQW5zaVJlbmRlclNlZ21lbnQiLCJrZXkiLCJzdHlsZSIsImNvbnRlbnQiLCJPTkVfREFZIiwiUmVjb3JkVmlldyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl93cmFwcGVyIiwiX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQiLCJtZWFzdXJlQW5kTm90aWZ5SGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0Iiwib25IZWlnaHRDaGFuZ2UiLCJyZWNvcmQiLCJfaGFuZGxlUmVjb3JkV3JhcHBlciIsIndyYXBwZXIiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiZGlzcG9zZSIsIl9yZW5kZXJDb250ZW50Iiwia2luZCIsInRleHQiLCJleHByZXNzaW9ucyIsIl9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCIsImZvcm1hdCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5leHRQcm9wcyIsImV4cGFuc2lvblN0YXRlSWQiLCJjaGlsZHJlbiIsImV4cHJlc3Npb24iLCJoYXNDaGlsZHJlbiIsInB1c2giLCJsZW5ndGgiLCJyZW5kZXIiLCJsZXZlbCIsInRpbWVzdGFtcCIsInNvdXJjZUlkIiwic291cmNlTmFtZSIsImNsYXNzTmFtZXMiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJpY29uTmFtZSIsImdldEljb25OYW1lIiwiaWNvbiIsInNvdXJjZUxhYmVsIiwic2hvd1NvdXJjZUxhYmVsIiwiZ2V0SGlnaGxpZ2h0Q2xhc3NOYW1lIiwicmVuZGVyZWRUaW1lc3RhbXAiLCJ0aW1lc3RhbXBMYWJlbCIsIkRhdGUiLCJub3ciLCJ0b0xvY2FsZVN0cmluZyIsInRvTG9jYWxlVGltZVN0cmluZyIsInJlcGVhdENvdW50IiwiaW5jb21wbGV0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWVBOztB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aHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXHJcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxyXG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cclxuICpcclxuICogQGZsb3dcclxuICogQGZvcm1hdFxyXG4gKi9cclxuXHJcbmltcG9ydCB0eXBlIHtMZXZlbCwgUmVjb3JkfSBmcm9tICcuLi90eXBlcyc7XHJcbmltcG9ydCB0eXBlIHtSZW5kZXJTZWdtZW50UHJvcHN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0Fuc2knO1xyXG5cclxuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XHJcbmltcG9ydCB7TWVhc3VyZWRDb21wb25lbnR9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL01lYXN1cmVkQ29tcG9uZW50JztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuLy8gVE9ETzogRml4IGxpbnQgcnVsZSwgdGhpcyBpcyBpbiB0aGUgc2FtZSBwYWNrYWdlIVxyXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbnVjbGlkZS1pbnRlcm5hbC9tb2R1bGVzLWRlcGVuZGVuY2llc1xyXG5pbXBvcnQge0V4cHJlc3Npb25UcmVlQ29tcG9uZW50fSBmcm9tICcuLi9jb21tb25zL0V4cHJlc3Npb25UcmVlQ29tcG9uZW50JztcclxuaW1wb3J0IFNpbXBsZVZhbHVlQ29tcG9uZW50IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1NpbXBsZVZhbHVlQ29tcG9uZW50JztcclxuaW1wb3J0IEZ1bGxXaWR0aFByb2dyZXNzQmFyIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0Z1bGxXaWR0aFByb2dyZXNzQmFyJztcclxuaW1wb3J0IHNoYWxsb3dFcXVhbCBmcm9tICdzaGFsbG93ZXF1YWwnO1xyXG5pbXBvcnQgQW5zaSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9BbnNpJztcclxuaW1wb3J0IGRlYm91bmNlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2RlYm91bmNlJztcclxuaW1wb3J0IHBhcnNlVGV4dCBmcm9tICcuLi9wYXJzZVRleHQnO1xyXG5pbXBvcnQgbnVsbHRocm93cyBmcm9tICdudWxsdGhyb3dzJztcclxuXHJcbnR5cGUgUHJvcHMgPSB7XHJcbiAgcmVjb3JkOiBSZWNvcmQsXHJcbiAgc2hvd1NvdXJjZUxhYmVsOiBib29sZWFuLFxyXG4gIG9uSGVpZ2h0Q2hhbmdlOiAocmVjb3JkOiBSZWNvcmQsIG5ld0hlaWdodDogbnVtYmVyKSA9PiB2b2lkLFxyXG4gIGV4cGFuc2lvblN0YXRlSWQ6IE9iamVjdCxcclxufTtcclxuXHJcbmNvbnN0IEFuc2lSZW5kZXJTZWdtZW50ID0gKHtrZXksIHN0eWxlLCBjb250ZW50fTogUmVuZGVyU2VnbWVudFByb3BzKSA9PiAoXHJcbiAgPHNwYW4ga2V5PXtrZXl9IHN0eWxlPXtzdHlsZX0gY2xhc3NOYW1lPVwibnVjbGlkZS1jb25zb2xlLWRlZmF1bHQtdGV4dC1jb2xvcnNcIj5cclxuICAgIHtwYXJzZVRleHQoY29udGVudCl9XHJcbiAgPC9zcGFuPlxyXG4pO1xyXG5cclxuY29uc3QgT05FX0RBWSA9IDEwMDAgKiA2MCAqIDYwICogMjQ7XHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY29yZFZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcclxuICBfd3JhcHBlcjogP0hUTUxFbGVtZW50O1xyXG4gIF9kZWJvdW5jZWRNZWFzdXJlQW5kTm90aWZ5SGVpZ2h0OiAoKSA9PiB2b2lkO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuXHJcbiAgICAvLyBUaGUgTWVhc3VyZWRDb21wb25lbnQgY2FuIGNhbGwgdGhpcyBtYW55IHRpbWVzIGluIHF1aWNrIHN1Y2Nlc3Npb24gYXMgdGhlXHJcbiAgICAvLyBjaGlsZCBjb21wb25lbnRzIHJlbmRlciwgc28gd2UgZGVib3VuY2UgaXQgc2luY2Ugd2Ugb25seSB3YW50IHRvIGtub3cgYWJvdXRcclxuICAgIC8vIHRoZSBoZWlnaHQgY2hhbmdlIG9uY2UgZXZlcnl0aGluZyBoYXMgc2V0dGxlZCBkb3duXHJcbiAgICAodGhpczogYW55KS5fZGVib3VuY2VkTWVhc3VyZUFuZE5vdGlmeUhlaWdodCA9IGRlYm91bmNlKFxyXG4gICAgICB0aGlzLm1lYXN1cmVBbmROb3RpZnlIZWlnaHQsXHJcbiAgICAgIDEwLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xyXG4gICAgLy8gV2UgaW5pdGlhbGx5IGFzc3VtZSBhIGhlaWdodCBmb3IgdGhlIHJlY29yZC4gQWZ0ZXIgaXQgaXMgYWN0dWFsbHlcclxuICAgIC8vIHJlbmRlcmVkIHdlIG5lZWQgaXQgdG8gbWVhc3VyZSBpdHMgYWN0dWFsIGhlaWdodCBhbmQgcmVwb3J0IGl0XHJcbiAgICB0aGlzLm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKTtcclxuICB9XHJcblxyXG4gIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IFByb3BzKSB7XHJcbiAgICAvLyBSZWNvcmQgaXMgYW4gaW1tdXRhYmxlIG9iamVjdCwgc28gYW55IGNoYW5nZSB0aGF0IHdvdWxkIGFmZmVjdCBhIGhlaWdodFxyXG4gICAgLy8gY2hhbmdlIHNob3VsZCByZXN1bHQgaW4gdXMgZ2V0dGluZyBhIG5ldyBvYmplY3QuXHJcbiAgICBpZiAodGhpcy5wcm9wcy5yZWNvcmQgIT09IHByZXZQcm9wcy5yZWNvcmQpIHtcclxuICAgICAgdGhpcy5tZWFzdXJlQW5kTm90aWZ5SGVpZ2h0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcclxuICAgIHRoaXMuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgX3JlbmRlckNvbnRlbnQoKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcclxuICAgIGNvbnN0IHtyZWNvcmR9ID0gdGhpcy5wcm9wcztcclxuICAgIGlmIChyZWNvcmQua2luZCA9PT0gJ3JlcXVlc3QnKSB7XHJcbiAgICAgIC8vIFRPRE86IFdlIHJlYWxseSB3YW50IHRvIHVzZSBhIHRleHQgZWRpdG9yIHRvIHJlbmRlciB0aGlzIHNvIHRoYXQgd2UgY2FuIGdldCBzeW50YXhcclxuICAgICAgLy8gaGlnaGxpZ2h0aW5nLCBidXQgdGhleSdyZSBqdXN0IHRvbyBleHBlbnNpdmUuIEZpZ3VyZSBvdXQgYSBsZXNzLWV4cGVuc2l2ZSB3YXkgdG8gZ2V0IHN5bnRheFxyXG4gICAgICAvLyBoaWdobGlnaHRpbmcuXHJcbiAgICAgIHJldHVybiA8cHJlPntyZWNvcmQudGV4dCB8fCAnICd9PC9wcmU+O1xyXG4gICAgfSBlbHNlIGlmIChyZWNvcmQuZXhwcmVzc2lvbnMgIT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyTmVzdGVkVmFsdWVDb21wb25lbnQoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIElmIHRoZXJlJ3Mgbm90IHRleHQsIHVzZSBhIHNwYWNlIHRvIG1ha2Ugc3VyZSB0aGUgcm93IGRvZXNuJ3QgY29sbGFwc2UuXHJcbiAgICAgIGNvbnN0IHRleHQgPSByZWNvcmQudGV4dCB8fCAnICc7XHJcblxyXG4gICAgICBpZiAocmVjb3JkLmZvcm1hdCA9PT0gJ2Fuc2knKSB7XHJcbiAgICAgICAgcmV0dXJuIDxBbnNpIHJlbmRlclNlZ21lbnQ9e0Fuc2lSZW5kZXJTZWdtZW50fT57dGV4dH08L0Fuc2k+O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiA8cHJlPntwYXJzZVRleHQodGV4dCl9PC9wcmU+O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wczogUHJvcHMpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAhc2hhbGxvd0VxdWFsKHRoaXMucHJvcHMsIG5leHRQcm9wcyk7XHJcbiAgfVxyXG5cclxuICBfcmVuZGVyTmVzdGVkVmFsdWVDb21wb25lbnQoKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcclxuICAgIGNvbnN0IHtyZWNvcmQsIGV4cGFuc2lvblN0YXRlSWR9ID0gdGhpcy5wcm9wcztcclxuICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbnVsbHRocm93cyhyZWNvcmQuZXhwcmVzc2lvbnMpO1xyXG5cclxuICAgIC8vIFJlbmRlciBtdWx0aXBsZSBvYmplY3RzLlxyXG4gICAgY29uc3QgY2hpbGRyZW4gPSBbXTtcclxuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiBleHByZXNzaW9ucykge1xyXG4gICAgICBpZiAoIWV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKSkge1xyXG4gICAgICAgIGNoaWxkcmVuLnB1c2goXHJcbiAgICAgICAgICA8U2ltcGxlVmFsdWVDb21wb25lbnRcclxuICAgICAgICAgICAgaGlkZUV4cHJlc3Npb25OYW1lPXt0cnVlfVxyXG4gICAgICAgICAgICBleHByZXNzaW9uPXtleHByZXNzaW9ufVxyXG4gICAgICAgICAgLz4sXHJcbiAgICAgICAgKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjaGlsZHJlbi5wdXNoKFxyXG4gICAgICAgICAgPEV4cHJlc3Npb25UcmVlQ29tcG9uZW50XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImNvbnNvbGUtZXhwcmVzc2lvbi10cmVlLXZhbHVlXCJcclxuICAgICAgICAgICAgZXhwcmVzc2lvbj17ZXhwcmVzc2lvbn1cclxuICAgICAgICAgICAgY29udGFpbmVyQ29udGV4dD17ZXhwYW5zaW9uU3RhdGVJZH1cclxuICAgICAgICAgICAgaGlkZUV4cHJlc3Npb25OYW1lPXt0cnVlfVxyXG4gICAgICAgICAgLz4sXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoaWxkcmVuLmxlbmd0aCA8PSAxID8gKFxyXG4gICAgICBjaGlsZHJlblswXVxyXG4gICAgKSA6IChcclxuICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29uc29sZS1tdWx0aXBsZS1vYmplY3RzXCI+e2NoaWxkcmVufTwvc3Bhbj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XHJcbiAgICBjb25zdCB7cmVjb3JkfSA9IHRoaXMucHJvcHM7XHJcbiAgICBjb25zdCB7bGV2ZWwsIGtpbmQsIHRpbWVzdGFtcCwgc291cmNlSWQsIHNvdXJjZU5hbWV9ID0gcmVjb3JkO1xyXG5cclxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc25hbWVzKCdjb25zb2xlLXJlY29yZCcsIGBsZXZlbC0ke2xldmVsIHx8ICdsb2cnfWAsIHtcclxuICAgICAgcmVxdWVzdDoga2luZCA9PT0gJ3JlcXVlc3QnLFxyXG4gICAgICByZXNwb25zZToga2luZCA9PT0gJ3Jlc3BvbnNlJyxcclxuICAgICAgLy8gQWxsb3cgbmF0aXZlIGtleWJpbmRpbmdzIGZvciB0ZXh0LW9ubHkgbm9kZXMuIFRoZSBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFxyXG4gICAgICAvLyB3aWxsIGhhbmRsZSBrZXliaW5kaW5ncyBmb3IgZXhwcmVzc2lvbiBub2Rlcy5cclxuICAgICAgJ25hdGl2ZS1rZXktYmluZGluZ3MnOlxyXG4gICAgICAgIHJlY29yZC5leHByZXNzaW9ucyA9PSBudWxsIHx8IHJlY29yZC5leHByZXNzaW9ucy5sZW5ndGggPT09IDAsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBpY29uTmFtZSA9IGdldEljb25OYW1lKHJlY29yZCk7XHJcbiAgICAvLyBmbG93bGludC1uZXh0LWxpbmUgc2tldGNoeS1udWxsLXN0cmluZzpvZmZcclxuICAgIGNvbnN0IGljb24gPSBpY29uTmFtZSA/IDxzcGFuIGNsYXNzTmFtZT17YGljb24gaWNvbi0ke2ljb25OYW1lfWB9IC8+IDogbnVsbDtcclxuICAgIGNvbnN0IHNvdXJjZUxhYmVsID0gdGhpcy5wcm9wcy5zaG93U291cmNlTGFiZWwgPyAoXHJcbiAgICAgIDxzcGFuXHJcbiAgICAgICAgY2xhc3NOYW1lPXtgY29uc29sZS1yZWNvcmQtc291cmNlLWxhYmVsICR7Z2V0SGlnaGxpZ2h0Q2xhc3NOYW1lKFxyXG4gICAgICAgICAgbGV2ZWwsXHJcbiAgICAgICAgKX1gfT5cclxuICAgICAgICB7c291cmNlTmFtZSA/PyBzb3VyY2VJZH1cclxuICAgICAgPC9zcGFuPlxyXG4gICAgKSA6IG51bGw7XHJcbiAgICBsZXQgcmVuZGVyZWRUaW1lc3RhbXA7XHJcbiAgICBpZiAodGltZXN0YW1wICE9IG51bGwpIHtcclxuICAgICAgY29uc3QgdGltZXN0YW1wTGFiZWwgPVxyXG4gICAgICAgIERhdGUubm93KCkgLSB0aW1lc3RhbXAgPiBPTkVfREFZXHJcbiAgICAgICAgICA/IHRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygpXHJcbiAgICAgICAgICA6IHRpbWVzdGFtcC50b0xvY2FsZVRpbWVTdHJpbmcoKTtcclxuICAgICAgcmVuZGVyZWRUaW1lc3RhbXAgPSAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXJlY29yZC10aW1lc3RhbXBcIj57dGltZXN0YW1wTGFiZWx9PC9kaXY+XHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8TWVhc3VyZWRDb21wb25lbnRcclxuICAgICAgICBvbk1lYXN1cmVtZW50c0NoYW5nZWQ9e3RoaXMuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHR9PlxyXG4gICAgICAgIHsvKiAkRmxvd0ZpeE1lKD49MC41My4wKSBGbG93IHN1cHByZXNzICovfVxyXG4gICAgICAgIDxkaXZcclxuICAgICAgICAgIHJlZj17dGhpcy5faGFuZGxlUmVjb3JkV3JhcHBlcn1cclxuICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lc31cclxuICAgICAgICAgIHRhYkluZGV4PVwiMFwiPlxyXG4gICAgICAgICAge2ljb259XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLWNvbnRlbnQtd3JhcHBlclwiPlxyXG4gICAgICAgICAgICB7cmVjb3JkLnJlcGVhdENvdW50ID4gMSAmJiAoXHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXJlY29yZC1kdXBsaWNhdGUtbnVtYmVyXCI+XHJcbiAgICAgICAgICAgICAgICB7cmVjb3JkLnJlcGVhdENvdW50fVxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICB7dGhpcy5fcmVuZGVyQ29udGVudCgpfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAge3NvdXJjZUxhYmVsfVxyXG4gICAgICAgICAge3JlbmRlcmVkVGltZXN0YW1wfVxyXG4gICAgICAgICAgezxGdWxsV2lkdGhQcm9ncmVzc0JhciBwcm9ncmVzcz17bnVsbH0gdmlzaWJsZT17cmVjb3JkLmluY29tcGxldGV9IC8+fVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L01lYXN1cmVkQ29tcG9uZW50PlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIG1lYXN1cmVBbmROb3RpZnlIZWlnaHQgPSAoKSA9PiB7XHJcbiAgICBpZiAodGhpcy5fd3JhcHBlciA9PSBudWxsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IHtvZmZzZXRIZWlnaHR9ID0gdGhpcy5fd3JhcHBlcjtcclxuICAgIHRoaXMucHJvcHMub25IZWlnaHRDaGFuZ2UodGhpcy5wcm9wcy5yZWNvcmQsIG9mZnNldEhlaWdodCk7XHJcbiAgfTtcclxuXHJcbiAgX2hhbmRsZVJlY29yZFdyYXBwZXIgPSAod3JhcHBlcjogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgIHRoaXMuX3dyYXBwZXIgPSB3cmFwcGVyO1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodENsYXNzTmFtZShsZXZlbDogTGV2ZWwpOiBzdHJpbmcge1xyXG4gIHN3aXRjaCAobGV2ZWwpIHtcclxuICAgIGNhc2UgJ2luZm8nOlxyXG4gICAgICByZXR1cm4gJ2hpZ2hsaWdodC1pbmZvJztcclxuICAgIGNhc2UgJ3N1Y2Nlc3MnOlxyXG4gICAgICByZXR1cm4gJ2hpZ2hsaWdodC1zdWNjZXNzJztcclxuICAgIGNhc2UgJ3dhcm5pbmcnOlxyXG4gICAgICByZXR1cm4gJ2hpZ2hsaWdodC13YXJuaW5nJztcclxuICAgIGNhc2UgJ2Vycm9yJzpcclxuICAgICAgcmV0dXJuICdoaWdobGlnaHQtZXJyb3InO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuICdoaWdobGlnaHQnO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0SWNvbk5hbWUocmVjb3JkOiBSZWNvcmQpOiA/c3RyaW5nIHtcclxuICBzd2l0Y2ggKHJlY29yZC5raW5kKSB7XHJcbiAgICBjYXNlICdyZXF1ZXN0JzpcclxuICAgICAgcmV0dXJuICdjaGV2cm9uLXJpZ2h0JztcclxuICAgIGNhc2UgJ3Jlc3BvbnNlJzpcclxuICAgICAgcmV0dXJuICdhcnJvdy1zbWFsbC1sZWZ0JztcclxuICB9XHJcbiAgc3dpdGNoIChyZWNvcmQubGV2ZWwpIHtcclxuICAgIGNhc2UgJ2luZm8nOlxyXG4gICAgICByZXR1cm4gJ2luZm8nO1xyXG4gICAgY2FzZSAnc3VjY2Vzcyc6XHJcbiAgICAgIHJldHVybiAnY2hlY2snO1xyXG4gICAgY2FzZSAnd2FybmluZyc6XHJcbiAgICAgIHJldHVybiAnYWxlcnQnO1xyXG4gICAgY2FzZSAnZXJyb3InOlxyXG4gICAgICByZXR1cm4gJ3N0b3AnO1xyXG4gIH1cclxufVxyXG4iXX0=