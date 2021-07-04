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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlY29yZFZpZXcuanMiXSwibmFtZXMiOlsiQW5zaVJlbmRlclNlZ21lbnQiLCJrZXkiLCJzdHlsZSIsImNvbnRlbnQiLCJPTkVfREFZIiwiUmVjb3JkVmlldyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl93cmFwcGVyIiwiX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQiLCJtZWFzdXJlQW5kTm90aWZ5SGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0Iiwib25IZWlnaHRDaGFuZ2UiLCJyZWNvcmQiLCJfaGFuZGxlUmVjb3JkV3JhcHBlciIsIndyYXBwZXIiLCJjb21wb25lbnREaWRNb3VudCIsImNvbXBvbmVudERpZFVwZGF0ZSIsInByZXZQcm9wcyIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiZGlzcG9zZSIsIl9yZW5kZXJDb250ZW50Iiwia2luZCIsInRleHQiLCJleHByZXNzaW9ucyIsIl9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCIsImZvcm1hdCIsInNob3VsZENvbXBvbmVudFVwZGF0ZSIsIm5leHRQcm9wcyIsImV4cGFuc2lvblN0YXRlSWQiLCJjaGlsZHJlbiIsImV4cHJlc3Npb24iLCJoYXNDaGlsZHJlbiIsInB1c2giLCJsZW5ndGgiLCJyZW5kZXIiLCJsZXZlbCIsInRpbWVzdGFtcCIsInNvdXJjZUlkIiwic291cmNlTmFtZSIsImNsYXNzTmFtZXMiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJpY29uTmFtZSIsImdldEljb25OYW1lIiwiaWNvbiIsInNvdXJjZUxhYmVsIiwic2hvd1NvdXJjZUxhYmVsIiwiZ2V0SGlnaGxpZ2h0Q2xhc3NOYW1lIiwicmVuZGVyZWRUaW1lc3RhbXAiLCJ0aW1lc3RhbXBMYWJlbCIsIkRhdGUiLCJub3ciLCJ0b0xvY2FsZVN0cmluZyIsInRvTG9jYWxlVGltZVN0cmluZyIsInJlcGVhdENvdW50IiwiaW5jb21wbGV0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWVBOztB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IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCB0eXBlIHtMZXZlbCwgUmVjb3JkfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7UmVuZGVyU2VnbWVudFByb3BzfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9BbnNpJztcblxuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQge01lYXN1cmVkQ29tcG9uZW50fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9NZWFzdXJlZENvbXBvbmVudCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbi8vIFRPRE86IEZpeCBsaW50IHJ1bGUsIHRoaXMgaXMgaW4gdGhlIHNhbWUgcGFja2FnZSFcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL21vZHVsZXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQge0V4cHJlc3Npb25UcmVlQ29tcG9uZW50fSBmcm9tICcuLi9jb21tb25zL0V4cHJlc3Npb25UcmVlQ29tcG9uZW50JztcbmltcG9ydCBTaW1wbGVWYWx1ZUNvbXBvbmVudCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9TaW1wbGVWYWx1ZUNvbXBvbmVudCc7XG5pbXBvcnQgRnVsbFdpZHRoUHJvZ3Jlc3NCYXIgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvRnVsbFdpZHRoUHJvZ3Jlc3NCYXInO1xuaW1wb3J0IHNoYWxsb3dFcXVhbCBmcm9tICdzaGFsbG93ZXF1YWwnO1xuaW1wb3J0IEFuc2kgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQW5zaSc7XG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZGVib3VuY2UnO1xuaW1wb3J0IHBhcnNlVGV4dCBmcm9tICcuLi9wYXJzZVRleHQnO1xuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSAnbnVsbHRocm93cyc7XG5cbnR5cGUgUHJvcHMgPSB7XG4gIHJlY29yZDogUmVjb3JkLFxuICBzaG93U291cmNlTGFiZWw6IGJvb2xlYW4sXG4gIG9uSGVpZ2h0Q2hhbmdlOiAocmVjb3JkOiBSZWNvcmQsIG5ld0hlaWdodDogbnVtYmVyKSA9PiB2b2lkLFxuICBleHBhbnNpb25TdGF0ZUlkOiBPYmplY3QsXG59O1xuXG5jb25zdCBBbnNpUmVuZGVyU2VnbWVudCA9ICh7a2V5LCBzdHlsZSwgY29udGVudH06IFJlbmRlclNlZ21lbnRQcm9wcykgPT4gKFxuICA8c3BhbiBrZXk9e2tleX0gc3R5bGU9e3N0eWxlfSBjbGFzc05hbWU9XCJudWNsaWRlLWNvbnNvbGUtZGVmYXVsdC10ZXh0LWNvbG9yc1wiPlxuICAgIHtwYXJzZVRleHQoY29udGVudCl9XG4gIDwvc3Bhbj5cbik7XG5cbmNvbnN0IE9ORV9EQVkgPSAxMDAwICogNjAgKiA2MCAqIDI0O1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVjb3JkVmlldyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBfd3JhcHBlcjogP0hUTUxFbGVtZW50O1xuICBfZGVib3VuY2VkTWVhc3VyZUFuZE5vdGlmeUhlaWdodDogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAvLyBUaGUgTWVhc3VyZWRDb21wb25lbnQgY2FuIGNhbGwgdGhpcyBtYW55IHRpbWVzIGluIHF1aWNrIHN1Y2Nlc3Npb24gYXMgdGhlXG4gICAgLy8gY2hpbGQgY29tcG9uZW50cyByZW5kZXIsIHNvIHdlIGRlYm91bmNlIGl0IHNpbmNlIHdlIG9ubHkgd2FudCB0byBrbm93IGFib3V0XG4gICAgLy8gdGhlIGhlaWdodCBjaGFuZ2Ugb25jZSBldmVyeXRoaW5nIGhhcyBzZXR0bGVkIGRvd25cbiAgICAodGhpczogYW55KS5fZGVib3VuY2VkTWVhc3VyZUFuZE5vdGlmeUhlaWdodCA9IGRlYm91bmNlKFxuICAgICAgdGhpcy5tZWFzdXJlQW5kTm90aWZ5SGVpZ2h0LFxuICAgICAgMTAsXG4gICAgKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIC8vIFdlIGluaXRpYWxseSBhc3N1bWUgYSBoZWlnaHQgZm9yIHRoZSByZWNvcmQuIEFmdGVyIGl0IGlzIGFjdHVhbGx5XG4gICAgLy8gcmVuZGVyZWQgd2UgbmVlZCBpdCB0byBtZWFzdXJlIGl0cyBhY3R1YWwgaGVpZ2h0IGFuZCByZXBvcnQgaXRcbiAgICB0aGlzLm1lYXN1cmVBbmROb3RpZnlIZWlnaHQoKTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IFByb3BzKSB7XG4gICAgLy8gUmVjb3JkIGlzIGFuIGltbXV0YWJsZSBvYmplY3QsIHNvIGFueSBjaGFuZ2UgdGhhdCB3b3VsZCBhZmZlY3QgYSBoZWlnaHRcbiAgICAvLyBjaGFuZ2Ugc2hvdWxkIHJlc3VsdCBpbiB1cyBnZXR0aW5nIGEgbmV3IG9iamVjdC5cbiAgICBpZiAodGhpcy5wcm9wcy5yZWNvcmQgIT09IHByZXZQcm9wcy5yZWNvcmQpIHtcbiAgICAgIHRoaXMubWVhc3VyZUFuZE5vdGlmeUhlaWdodCgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX2RlYm91bmNlZE1lYXN1cmVBbmROb3RpZnlIZWlnaHQuZGlzcG9zZSgpO1xuICB9XG5cbiAgX3JlbmRlckNvbnRlbnQoKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgICBjb25zdCB7cmVjb3JkfSA9IHRoaXMucHJvcHM7XG4gICAgaWYgKHJlY29yZC5raW5kID09PSAncmVxdWVzdCcpIHtcbiAgICAgIC8vIFRPRE86IFdlIHJlYWxseSB3YW50IHRvIHVzZSBhIHRleHQgZWRpdG9yIHRvIHJlbmRlciB0aGlzIHNvIHRoYXQgd2UgY2FuIGdldCBzeW50YXhcbiAgICAgIC8vIGhpZ2hsaWdodGluZywgYnV0IHRoZXkncmUganVzdCB0b28gZXhwZW5zaXZlLiBGaWd1cmUgb3V0IGEgbGVzcy1leHBlbnNpdmUgd2F5IHRvIGdldCBzeW50YXhcbiAgICAgIC8vIGhpZ2hsaWdodGluZy5cbiAgICAgIHJldHVybiA8cHJlPntyZWNvcmQudGV4dCB8fCAnICd9PC9wcmU+O1xuICAgIH0gZWxzZSBpZiAocmVjb3JkLmV4cHJlc3Npb25zICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJOZXN0ZWRWYWx1ZUNvbXBvbmVudCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGVyZSdzIG5vdCB0ZXh0LCB1c2UgYSBzcGFjZSB0byBtYWtlIHN1cmUgdGhlIHJvdyBkb2Vzbid0IGNvbGxhcHNlLlxuICAgICAgY29uc3QgdGV4dCA9IHJlY29yZC50ZXh0IHx8ICcgJztcblxuICAgICAgaWYgKHJlY29yZC5mb3JtYXQgPT09ICdhbnNpJykge1xuICAgICAgICByZXR1cm4gPEFuc2kgcmVuZGVyU2VnbWVudD17QW5zaVJlbmRlclNlZ21lbnR9Pnt0ZXh0fTwvQW5zaT47XG4gICAgICB9XG4gICAgICByZXR1cm4gPHByZT57cGFyc2VUZXh0KHRleHQpfTwvcHJlPjtcbiAgICB9XG4gIH1cblxuICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzOiBQcm9wcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhc2hhbGxvd0VxdWFsKHRoaXMucHJvcHMsIG5leHRQcm9wcyk7XG4gIH1cblxuICBfcmVuZGVyTmVzdGVkVmFsdWVDb21wb25lbnQoKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgICBjb25zdCB7cmVjb3JkLCBleHBhbnNpb25TdGF0ZUlkfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSBudWxsdGhyb3dzKHJlY29yZC5leHByZXNzaW9ucyk7XG5cbiAgICAvLyBSZW5kZXIgbXVsdGlwbGUgb2JqZWN0cy5cbiAgICBjb25zdCBjaGlsZHJlbiA9IFtdO1xuICAgIGZvciAoY29uc3QgZXhwcmVzc2lvbiBvZiBleHByZXNzaW9ucykge1xuICAgICAgaWYgKCFleHByZXNzaW9uLmhhc0NoaWxkcmVuKCkpIHtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChcbiAgICAgICAgICA8U2ltcGxlVmFsdWVDb21wb25lbnRcbiAgICAgICAgICAgIGhpZGVFeHByZXNzaW9uTmFtZT17dHJ1ZX1cbiAgICAgICAgICAgIGV4cHJlc3Npb249e2V4cHJlc3Npb259XG4gICAgICAgICAgLz4sXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKFxuICAgICAgICAgIDxFeHByZXNzaW9uVHJlZUNvbXBvbmVudFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiY29uc29sZS1leHByZXNzaW9uLXRyZWUtdmFsdWVcIlxuICAgICAgICAgICAgZXhwcmVzc2lvbj17ZXhwcmVzc2lvbn1cbiAgICAgICAgICAgIGNvbnRhaW5lckNvbnRleHQ9e2V4cGFuc2lvblN0YXRlSWR9XG4gICAgICAgICAgICBoaWRlRXhwcmVzc2lvbk5hbWU9e3RydWV9XG4gICAgICAgICAgLz4sXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbi5sZW5ndGggPD0gMSA/IChcbiAgICAgIGNoaWxkcmVuWzBdXG4gICAgKSA6IChcbiAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNvbnNvbGUtbXVsdGlwbGUtb2JqZWN0c1wiPntjaGlsZHJlbn08L3NwYW4+XG4gICAgKTtcbiAgfVxuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCB7cmVjb3JkfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge2xldmVsLCBraW5kLCB0aW1lc3RhbXAsIHNvdXJjZUlkLCBzb3VyY2VOYW1lfSA9IHJlY29yZDtcblxuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc25hbWVzKCdjb25zb2xlLXJlY29yZCcsIGBsZXZlbC0ke2xldmVsIHx8ICdsb2cnfWAsIHtcbiAgICAgIHJlcXVlc3Q6IGtpbmQgPT09ICdyZXF1ZXN0JyxcbiAgICAgIHJlc3BvbnNlOiBraW5kID09PSAncmVzcG9uc2UnLFxuICAgICAgLy8gQWxsb3cgbmF0aXZlIGtleWJpbmRpbmdzIGZvciB0ZXh0LW9ubHkgbm9kZXMuIFRoZSBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFxuICAgICAgLy8gd2lsbCBoYW5kbGUga2V5YmluZGluZ3MgZm9yIGV4cHJlc3Npb24gbm9kZXMuXG4gICAgICAnbmF0aXZlLWtleS1iaW5kaW5ncyc6XG4gICAgICAgIHJlY29yZC5leHByZXNzaW9ucyA9PSBudWxsIHx8IHJlY29yZC5leHByZXNzaW9ucy5sZW5ndGggPT09IDAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBpY29uTmFtZSA9IGdldEljb25OYW1lKHJlY29yZCk7XG4gICAgLy8gZmxvd2xpbnQtbmV4dC1saW5lIHNrZXRjaHktbnVsbC1zdHJpbmc6b2ZmXG4gICAgY29uc3QgaWNvbiA9IGljb25OYW1lID8gPHNwYW4gY2xhc3NOYW1lPXtgaWNvbiBpY29uLSR7aWNvbk5hbWV9YH0gLz4gOiBudWxsO1xuICAgIGNvbnN0IHNvdXJjZUxhYmVsID0gdGhpcy5wcm9wcy5zaG93U291cmNlTGFiZWwgPyAoXG4gICAgICA8c3BhblxuICAgICAgICBjbGFzc05hbWU9e2Bjb25zb2xlLXJlY29yZC1zb3VyY2UtbGFiZWwgJHtnZXRIaWdobGlnaHRDbGFzc05hbWUoXG4gICAgICAgICAgbGV2ZWwsXG4gICAgICAgICl9YH0+XG4gICAgICAgIHtzb3VyY2VOYW1lID8/IHNvdXJjZUlkfVxuICAgICAgPC9zcGFuPlxuICAgICkgOiBudWxsO1xuICAgIGxldCByZW5kZXJlZFRpbWVzdGFtcDtcbiAgICBpZiAodGltZXN0YW1wICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcExhYmVsID1cbiAgICAgICAgRGF0ZS5ub3coKSAtIHRpbWVzdGFtcCA+IE9ORV9EQVlcbiAgICAgICAgICA/IHRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygpXG4gICAgICAgICAgOiB0aW1lc3RhbXAudG9Mb2NhbGVUaW1lU3RyaW5nKCk7XG4gICAgICByZW5kZXJlZFRpbWVzdGFtcCA9IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLXJlY29yZC10aW1lc3RhbXBcIj57dGltZXN0YW1wTGFiZWx9PC9kaXY+XG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPE1lYXN1cmVkQ29tcG9uZW50XG4gICAgICAgIG9uTWVhc3VyZW1lbnRzQ2hhbmdlZD17dGhpcy5fZGVib3VuY2VkTWVhc3VyZUFuZE5vdGlmeUhlaWdodH0+XG4gICAgICAgIHsvKiAkRmxvd0ZpeE1lKD49MC41My4wKSBGbG93IHN1cHByZXNzICovfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgcmVmPXt0aGlzLl9oYW5kbGVSZWNvcmRXcmFwcGVyfVxuICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lc31cbiAgICAgICAgICB0YWJJbmRleD1cIjBcIj5cbiAgICAgICAgICB7aWNvbn1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLWNvbnRlbnQtd3JhcHBlclwiPlxuICAgICAgICAgICAge3JlY29yZC5yZXBlYXRDb3VudCA+IDEgJiYgKFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLWR1cGxpY2F0ZS1udW1iZXJcIj5cbiAgICAgICAgICAgICAgICB7cmVjb3JkLnJlcGVhdENvdW50fVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnNvbGUtcmVjb3JkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAge3RoaXMuX3JlbmRlckNvbnRlbnQoKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHtzb3VyY2VMYWJlbH1cbiAgICAgICAgICB7cmVuZGVyZWRUaW1lc3RhbXB9XG4gICAgICAgICAgezxGdWxsV2lkdGhQcm9ncmVzc0JhciBwcm9ncmVzcz17bnVsbH0gdmlzaWJsZT17cmVjb3JkLmluY29tcGxldGV9IC8+fVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvTWVhc3VyZWRDb21wb25lbnQ+XG4gICAgKTtcbiAgfVxuXG4gIG1lYXN1cmVBbmROb3RpZnlIZWlnaHQgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuX3dyYXBwZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB7b2Zmc2V0SGVpZ2h0fSA9IHRoaXMuX3dyYXBwZXI7XG4gICAgdGhpcy5wcm9wcy5vbkhlaWdodENoYW5nZSh0aGlzLnByb3BzLnJlY29yZCwgb2Zmc2V0SGVpZ2h0KTtcbiAgfTtcblxuICBfaGFuZGxlUmVjb3JkV3JhcHBlciA9ICh3cmFwcGVyOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgIHRoaXMuX3dyYXBwZXIgPSB3cmFwcGVyO1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRIaWdobGlnaHRDbGFzc05hbWUobGV2ZWw6IExldmVsKTogc3RyaW5nIHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgJ2luZm8nOlxuICAgICAgcmV0dXJuICdoaWdobGlnaHQtaW5mbyc7XG4gICAgY2FzZSAnc3VjY2Vzcyc6XG4gICAgICByZXR1cm4gJ2hpZ2hsaWdodC1zdWNjZXNzJztcbiAgICBjYXNlICd3YXJuaW5nJzpcbiAgICAgIHJldHVybiAnaGlnaGxpZ2h0LXdhcm5pbmcnO1xuICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIHJldHVybiAnaGlnaGxpZ2h0LWVycm9yJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdoaWdobGlnaHQnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEljb25OYW1lKHJlY29yZDogUmVjb3JkKTogP3N0cmluZyB7XG4gIHN3aXRjaCAocmVjb3JkLmtpbmQpIHtcbiAgICBjYXNlICdyZXF1ZXN0JzpcbiAgICAgIHJldHVybiAnY2hldnJvbi1yaWdodCc7XG4gICAgY2FzZSAncmVzcG9uc2UnOlxuICAgICAgcmV0dXJuICdhcnJvdy1zbWFsbC1sZWZ0JztcbiAgfVxuICBzd2l0Y2ggKHJlY29yZC5sZXZlbCkge1xuICAgIGNhc2UgJ2luZm8nOlxuICAgICAgcmV0dXJuICdpbmZvJztcbiAgICBjYXNlICdzdWNjZXNzJzpcbiAgICAgIHJldHVybiAnY2hlY2snO1xuICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgcmV0dXJuICdhbGVydCc7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgcmV0dXJuICdzdG9wJztcbiAgfVxufVxuIl19