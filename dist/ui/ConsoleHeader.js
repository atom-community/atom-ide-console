"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ButtonGroup = require("@atom-ide-community/nuclide-commons-ui/ButtonGroup");

var _LoadingSpinner = require("@atom-ide-community/nuclide-commons-ui/LoadingSpinner");

var React = _interopRequireWildcard(require("react"));

var _ModalMultiSelect = require("@atom-ide-community/nuclide-commons-ui/ModalMultiSelect");

var _RegExpFilter = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/RegExpFilter"));

var _Toolbar = require("@atom-ide-community/nuclide-commons-ui/Toolbar");

var _ToolbarLeft = require("@atom-ide-community/nuclide-commons-ui/ToolbarLeft");

var _ToolbarRight = require("@atom-ide-community/nuclide-commons-ui/ToolbarRight");

var _addTooltip = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/addTooltip"));

var _Button = require("@atom-ide-community/nuclide-commons-ui/Button");

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
class ConsoleHeader extends React.Component {
  constructor(...args) {
    super(...args);
    this._filterComponent = void 0;

    this.focusFilter = () => {
      if (this._filterComponent != null) {
        this._filterComponent.focus();
      }
    };

    this._handleClearButtonClick = event => {
      this.props.clear();
    };

    this._handleCreatePasteButtonClick = event => {
      if (this.props.createPaste != null) {
        this.props.createPaste();
      }
    };

    this._handleFilterChange = value => {
      this.props.onFilterChange(value);
    };

    this._renderOption = optionProps => {
      const {
        option
      } = optionProps;
      const source = this.props.sources.find(s => s.id === option.value);
      (0, _assert.default)(source != null);
      const startingSpinner = source.status !== 'starting' ? null : /*#__PURE__*/React.createElement(_LoadingSpinner.LoadingSpinner, {
        className: "inline-block console-process-starting-spinner",
        size: "EXTRA_SMALL"
      });
      return /*#__PURE__*/React.createElement("span", null, option.label, startingSpinner, this._renderProcessControlButton(source));
    };
  }

  _renderProcessControlButton(source) {
    let action;
    let label;
    let icon;

    switch (source.status) {
      case 'starting':
      case 'running':
        {
          action = source.stop;
          label = 'Stop Process';
          icon = 'primitive-square';
          break;
        }

      case 'stopped':
        {
          action = source.start;
          label = 'Start Process';
          icon = 'triangle-right';
          break;
        }
    }

    if (action == null) {
      return;
    }

    const clickHandler = event => {
      event.stopPropagation();
      (0, _assert.default)(action != null);
      action();
    };

    return /*#__PURE__*/React.createElement(_Button.Button, {
      className: "pull-right console-process-control-button",
      icon: icon,
      onClick: clickHandler
    }, label);
  }

  render() {
    const options = this.props.sources.slice().sort((a, b) => sortAlpha(a.name, b.name)).map(source => ({
      label: source.name,
      value: source.id
    }));
    const sourceButton = options.length === 0 ? null : /*#__PURE__*/React.createElement(_ModalMultiSelect.ModalMultiSelect, {
      labelComponent: MultiSelectLabel,
      optionComponent: this._renderOption,
      size: _Button.ButtonSizes.SMALL,
      options: options,
      value: this.props.selectedSourceIds,
      onChange: this.props.onSelectedSourcesChange,
      className: "inline-block"
    });
    const pasteButton = this.props.createPaste == null ? null : /*#__PURE__*/React.createElement(_Button.Button, {
      className: "inline-block",
      size: _Button.ButtonSizes.SMALL,
      onClick: this._handleCreatePasteButtonClick // eslint-disable-next-line nuclide-internal/jsx-simple-callback-refs
      ,
      ref: (0, _addTooltip.default)({
        title: 'Creates a Paste from the current contents of the console'
      })
    }, "Create Paste");
    return /*#__PURE__*/React.createElement(_Toolbar.Toolbar, {
      location: "top"
    }, /*#__PURE__*/React.createElement(_ToolbarLeft.ToolbarLeft, null, sourceButton, /*#__PURE__*/React.createElement(_ButtonGroup.ButtonGroup, {
      className: "inline-block"
    }, /*#__PURE__*/React.createElement(FilterButton, {
      severity: "error",
      selectedSeverities: this.props.selectedSeverities,
      toggleSeverity: this.props.toggleSeverity
    }), /*#__PURE__*/React.createElement(FilterButton, {
      severity: "warning",
      selectedSeverities: this.props.selectedSeverities,
      toggleSeverity: this.props.toggleSeverity
    }), /*#__PURE__*/React.createElement(FilterButton, {
      severity: "info",
      selectedSeverities: this.props.selectedSeverities,
      toggleSeverity: this.props.toggleSeverity
    })), /*#__PURE__*/React.createElement(_RegExpFilter.default, {
      ref: component => this._filterComponent = component,
      value: {
        text: this.props.filterText,
        isRegExp: this.props.enableRegExpFilter,
        invalid: this.props.invalidFilterInput
      },
      onChange: this._handleFilterChange
    })), /*#__PURE__*/React.createElement(_ToolbarRight.ToolbarRight, null, pasteButton, /*#__PURE__*/React.createElement(_Button.Button, {
      size: _Button.ButtonSizes.SMALL,
      onClick: this._handleClearButtonClick
    }, "Clear")));
  }

}

exports.default = ConsoleHeader;

function sortAlpha(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower < bLower) {
    return -1;
  } else if (aLower > bLower) {
    return 1;
  }

  return 0;
}

function MultiSelectLabel(props) {
  const {
    selectedOptions
  } = props;
  const label = selectedOptions.length === 1 ? selectedOptions[0].label : `${selectedOptions.length} Sources`;
  return /*#__PURE__*/React.createElement("span", null, "Showing: ", label);
}

function FilterButton(props) {
  const {
    severity
  } = props;
  const selected = props.selectedSeverities.has(props.severity);
  let tooltipTitle = selected ? 'Hide ' : 'Show ';
  let icon;

  switch (severity) {
    case 'error':
      tooltipTitle += 'Errors';
      icon = 'nuclicon-error';
      break;

    case 'warning':
      tooltipTitle += 'Warnings';
      icon = 'nuclicon-warning';
      break;

    case 'info':
      tooltipTitle += 'Info';
      icon = 'info';
      break;

    default:
      severity;
      throw new Error(`Invalid severity: ${severity}`);
  }

  return /*#__PURE__*/React.createElement(_Button.Button, {
    icon: icon,
    size: _Button.ButtonSizes.SMALL,
    selected: props.selectedSeverities.has(severity),
    onClick: () => {
      props.toggleSeverity(severity);
    },
    tooltip: {
      title: tooltipTitle
    }
  });
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVIZWFkZXIuanMiXSwibmFtZXMiOlsiQ29uc29sZUhlYWRlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX2ZpbHRlckNvbXBvbmVudCIsImZvY3VzRmlsdGVyIiwiZm9jdXMiLCJfaGFuZGxlQ2xlYXJCdXR0b25DbGljayIsImV2ZW50IiwicHJvcHMiLCJjbGVhciIsIl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrIiwiY3JlYXRlUGFzdGUiLCJfaGFuZGxlRmlsdGVyQ2hhbmdlIiwidmFsdWUiLCJvbkZpbHRlckNoYW5nZSIsIl9yZW5kZXJPcHRpb24iLCJvcHRpb25Qcm9wcyIsIm9wdGlvbiIsInNvdXJjZSIsInNvdXJjZXMiLCJmaW5kIiwicyIsImlkIiwic3RhcnRpbmdTcGlubmVyIiwic3RhdHVzIiwibGFiZWwiLCJfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24iLCJhY3Rpb24iLCJpY29uIiwic3RvcCIsInN0YXJ0IiwiY2xpY2tIYW5kbGVyIiwic3RvcFByb3BhZ2F0aW9uIiwicmVuZGVyIiwib3B0aW9ucyIsInNsaWNlIiwic29ydCIsImEiLCJiIiwic29ydEFscGhhIiwibmFtZSIsIm1hcCIsInNvdXJjZUJ1dHRvbiIsImxlbmd0aCIsIk11bHRpU2VsZWN0TGFiZWwiLCJCdXR0b25TaXplcyIsIlNNQUxMIiwic2VsZWN0ZWRTb3VyY2VJZHMiLCJvblNlbGVjdGVkU291cmNlc0NoYW5nZSIsInBhc3RlQnV0dG9uIiwidGl0bGUiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJ0b2dnbGVTZXZlcml0eSIsImNvbXBvbmVudCIsInRleHQiLCJmaWx0ZXJUZXh0IiwiaXNSZWdFeHAiLCJlbmFibGVSZWdFeHBGaWx0ZXIiLCJpbnZhbGlkIiwiaW52YWxpZEZpbHRlcklucHV0IiwiYUxvd2VyIiwidG9Mb3dlckNhc2UiLCJiTG93ZXIiLCJzZWxlY3RlZE9wdGlvbnMiLCJGaWx0ZXJCdXR0b24iLCJzZXZlcml0eSIsInNlbGVjdGVkIiwiaGFz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Q0F4QyxNQUFBQSxJQUFJLEdBQUcsZ0JBQVA7QUFDQTs7QUFDRixTQUFLLFNBQUw7QUFDRXdDLE1BQUFBLFlBQVksSUFBSSxVQUFoQjtBQUNBeEMsTUFBQUEsSUFBSSxHQUFHLGtCQUFQO0FBQ0E7O0FBQ0YsU0FBSyxNQUFMO0FBQ0V3QyxNQUFBQSxZQUFZLElBQUksTUFBaEI7QUFDQXhDLE1BQUFBLElBQUksR0FBRyxNQUFQO0FBQ0E7O0FBQ0Y7QUFDR3FDLE1BQUFBLFFBQUQ7QUFDQSxZQUFNLElBQUlJLEtBQUosQ0FBVyxxQkFBb0JKLFFBQVMsRUFBeEMsQ0FBTjtBQWZKOztBQWtCQSxzQkFDRSxvQkFBQyxjQUFEO0FBQ0UsSUFBQSxJQUFJLEVBQUVyQyxJQURSO0FBRUUsSUFBQSxJQUFJLEVBQUVpQixvQkFBWUMsS0FGcEI7QUFHRSxJQUFBLFFBQVEsRUFBRXRDLEtBQUssQ0FBQzJDLGtCQUFOLENBQXlCZ0IsR0FBekIsQ0FBNkJGLFFBQTdCLENBSFo7QUFJRSxJQUFBLE9BQU8sRUFBRSxNQUFNO0FBQ2J6RCxNQUFBQSxLQUFLLENBQUM0QyxjQUFOLENBQXFCYSxRQUFyQjtBQUNELEtBTkg7QUFPRSxJQUFBLE9BQU8sRUFBRTtBQUFDZixNQUFBQSxLQUFLLEVBQUVrQjtBQUFSO0FBUFgsSUFERjtBQVdEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IHR5cGUge1NvdXJjZSwgU2V2ZXJpdHl9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB0eXBlIHtSZWdFeHBGaWx0ZXJDaGFuZ2V9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XG5cbmltcG9ydCB7QnV0dG9uR3JvdXB9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0J1dHRvbkdyb3VwJztcbmltcG9ydCB7TG9hZGluZ1NwaW5uZXJ9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0xvYWRpbmdTcGlubmVyJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7TW9kYWxNdWx0aVNlbGVjdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTW9kYWxNdWx0aVNlbGVjdCc7XG5pbXBvcnQgUmVnRXhwRmlsdGVyIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlcic7XG5pbXBvcnQge1Rvb2xiYXJ9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1Rvb2xiYXInO1xuaW1wb3J0IHtUb29sYmFyTGVmdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhckxlZnQnO1xuaW1wb3J0IHtUb29sYmFyUmlnaHR9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1Rvb2xiYXJSaWdodCc7XG5pbXBvcnQgYWRkVG9vbHRpcCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9hZGRUb29sdGlwJztcblxuaW1wb3J0IHtCdXR0b24sIEJ1dHRvblNpemVzfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9CdXR0b24nO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuXG50eXBlIFByb3BzID0ge3xcbiAgY2xlYXI6ICgpID0+IHZvaWQsXG4gIGNyZWF0ZVBhc3RlOiA/KCkgPT4gUHJvbWlzZTx2b2lkPixcbiAgaW52YWxpZEZpbHRlcklucHV0OiBib29sZWFuLFxuICBlbmFibGVSZWdFeHBGaWx0ZXI6IGJvb2xlYW4sXG4gIG9uRmlsdGVyQ2hhbmdlOiAoY2hhbmdlOiBSZWdFeHBGaWx0ZXJDaGFuZ2UpID0+IHZvaWQsXG4gIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxuICBzb3VyY2VzOiBBcnJheTxTb3VyY2U+LFxuICBvblNlbGVjdGVkU291cmNlc0NoYW5nZTogKHNvdXJjZUlkczogQXJyYXk8c3RyaW5nPikgPT4gdm9pZCxcbiAgZmlsdGVyVGV4dDogc3RyaW5nLFxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXG4gIHRvZ2dsZVNldmVyaXR5OiAoc2V2ZXJpdHk6IFNldmVyaXR5KSA9PiB2b2lkLFxufH07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnNvbGVIZWFkZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcbiAgX2ZpbHRlckNvbXBvbmVudDogP1JlZ0V4cEZpbHRlcjtcblxuICBmb2N1c0ZpbHRlciA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5fZmlsdGVyQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2ZpbHRlckNvbXBvbmVudC5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICBfaGFuZGxlQ2xlYXJCdXR0b25DbGljayA9IChldmVudDogU3ludGhldGljTW91c2VFdmVudDw+KTogdm9pZCA9PiB7XG4gICAgdGhpcy5wcm9wcy5jbGVhcigpO1xuICB9O1xuXG4gIF9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5wcm9wcy5jcmVhdGVQYXN0ZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlKCk7XG4gICAgfVxuICB9O1xuXG4gIF9oYW5kbGVGaWx0ZXJDaGFuZ2UgPSAodmFsdWU6IFJlZ0V4cEZpbHRlckNoYW5nZSk6IHZvaWQgPT4ge1xuICAgIHRoaXMucHJvcHMub25GaWx0ZXJDaGFuZ2UodmFsdWUpO1xuICB9O1xuXG4gIF9yZW5kZXJQcm9jZXNzQ29udHJvbEJ1dHRvbihzb3VyY2U6IFNvdXJjZSk6ID9SZWFjdC5FbGVtZW50PGFueT4ge1xuICAgIGxldCBhY3Rpb247XG4gICAgbGV0IGxhYmVsO1xuICAgIGxldCBpY29uO1xuICAgIHN3aXRjaCAoc291cmNlLnN0YXR1cykge1xuICAgICAgY2FzZSAnc3RhcnRpbmcnOlxuICAgICAgY2FzZSAncnVubmluZyc6IHtcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0b3A7XG4gICAgICAgIGxhYmVsID0gJ1N0b3AgUHJvY2Vzcyc7XG4gICAgICAgIGljb24gPSAncHJpbWl0aXZlLXNxdWFyZSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnc3RvcHBlZCc6IHtcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0YXJ0O1xuICAgICAgICBsYWJlbCA9ICdTdGFydCBQcm9jZXNzJztcbiAgICAgICAgaWNvbiA9ICd0cmlhbmdsZS1yaWdodCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYWN0aW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2xpY2tIYW5kbGVyID0gZXZlbnQgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpbnZhcmlhbnQoYWN0aW9uICE9IG51bGwpO1xuICAgICAgYWN0aW9uKCk7XG4gICAgfTtcbiAgICByZXR1cm4gKFxuICAgICAgPEJ1dHRvblxuICAgICAgICBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0IGNvbnNvbGUtcHJvY2Vzcy1jb250cm9sLWJ1dHRvblwiXG4gICAgICAgIGljb249e2ljb259XG4gICAgICAgIG9uQ2xpY2s9e2NsaWNrSGFuZGxlcn0+XG4gICAgICAgIHtsYWJlbH1cbiAgICAgIDwvQnV0dG9uPlxuICAgICk7XG4gIH1cblxuICBfcmVuZGVyT3B0aW9uID0gKG9wdGlvblByb3BzOiB7XG4gICAgb3B0aW9uOiB7bGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZ30sXG4gIH0pOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xuICAgIGNvbnN0IHtvcHRpb259ID0gb3B0aW9uUHJvcHM7XG4gICAgY29uc3Qgc291cmNlID0gdGhpcy5wcm9wcy5zb3VyY2VzLmZpbmQocyA9PiBzLmlkID09PSBvcHRpb24udmFsdWUpO1xuICAgIGludmFyaWFudChzb3VyY2UgIT0gbnVsbCk7XG4gICAgY29uc3Qgc3RhcnRpbmdTcGlubmVyID1cbiAgICAgIHNvdXJjZS5zdGF0dXMgIT09ICdzdGFydGluZycgPyBudWxsIDogKFxuICAgICAgICA8TG9hZGluZ1NwaW5uZXJcbiAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgY29uc29sZS1wcm9jZXNzLXN0YXJ0aW5nLXNwaW5uZXJcIlxuICAgICAgICAgIHNpemU9XCJFWFRSQV9TTUFMTFwiXG4gICAgICAgIC8+XG4gICAgICApO1xuICAgIHJldHVybiAoXG4gICAgICA8c3Bhbj5cbiAgICAgICAge29wdGlvbi5sYWJlbH1cbiAgICAgICAge3N0YXJ0aW5nU3Bpbm5lcn1cbiAgICAgICAge3RoaXMuX3JlbmRlclByb2Nlc3NDb250cm9sQnV0dG9uKHNvdXJjZSl9XG4gICAgICA8L3NwYW4+XG4gICAgKTtcbiAgfTtcblxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMucHJvcHMuc291cmNlc1xuICAgICAgLnNsaWNlKClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBzb3J0QWxwaGEoYS5uYW1lLCBiLm5hbWUpKVxuICAgICAgLm1hcChzb3VyY2UgPT4gKHtcbiAgICAgICAgbGFiZWw6IHNvdXJjZS5uYW1lLFxuICAgICAgICB2YWx1ZTogc291cmNlLmlkLFxuICAgICAgfSkpO1xuXG4gICAgY29uc3Qgc291cmNlQnV0dG9uID1cbiAgICAgIG9wdGlvbnMubGVuZ3RoID09PSAwID8gbnVsbCA6IChcbiAgICAgICAgPE1vZGFsTXVsdGlTZWxlY3RcbiAgICAgICAgICBsYWJlbENvbXBvbmVudD17TXVsdGlTZWxlY3RMYWJlbH1cbiAgICAgICAgICBvcHRpb25Db21wb25lbnQ9e3RoaXMuX3JlbmRlck9wdGlvbn1cbiAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIHZhbHVlPXt0aGlzLnByb3BzLnNlbGVjdGVkU291cmNlSWRzfVxuICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLnByb3BzLm9uU2VsZWN0ZWRTb3VyY2VzQ2hhbmdlfVxuICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1ibG9ja1wiXG4gICAgICAgIC8+XG4gICAgICApO1xuXG4gICAgY29uc3QgcGFzdGVCdXR0b24gPVxuICAgICAgdGhpcy5wcm9wcy5jcmVhdGVQYXN0ZSA9PSBudWxsID8gbnVsbCA6IChcbiAgICAgICAgPEJ1dHRvblxuICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1ibG9ja1wiXG4gICAgICAgICAgc2l6ZT17QnV0dG9uU2l6ZXMuU01BTEx9XG4gICAgICAgICAgb25DbGljaz17dGhpcy5faGFuZGxlQ3JlYXRlUGFzdGVCdXR0b25DbGlja31cbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbnVjbGlkZS1pbnRlcm5hbC9qc3gtc2ltcGxlLWNhbGxiYWNrLXJlZnNcbiAgICAgICAgICByZWY9e2FkZFRvb2x0aXAoe1xuICAgICAgICAgICAgdGl0bGU6ICdDcmVhdGVzIGEgUGFzdGUgZnJvbSB0aGUgY3VycmVudCBjb250ZW50cyBvZiB0aGUgY29uc29sZScsXG4gICAgICAgICAgfSl9PlxuICAgICAgICAgIENyZWF0ZSBQYXN0ZVxuICAgICAgICA8L0J1dHRvbj5cbiAgICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPFRvb2xiYXIgbG9jYXRpb249XCJ0b3BcIj5cbiAgICAgICAgPFRvb2xiYXJMZWZ0PlxuICAgICAgICAgIHtzb3VyY2VCdXR0b259XG4gICAgICAgICAgPEJ1dHRvbkdyb3VwIGNsYXNzTmFtZT1cImlubGluZS1ibG9ja1wiPlxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxuICAgICAgICAgICAgICBzZXZlcml0eT1cImVycm9yXCJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxuICAgICAgICAgICAgICBzZXZlcml0eT1cIndhcm5pbmdcIlxuICAgICAgICAgICAgICBzZWxlY3RlZFNldmVyaXRpZXM9e3RoaXMucHJvcHMuc2VsZWN0ZWRTZXZlcml0aWVzfVxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8RmlsdGVyQnV0dG9uXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwiaW5mb1wiXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XG4gICAgICAgICAgICAgIHRvZ2dsZVNldmVyaXR5PXt0aGlzLnByb3BzLnRvZ2dsZVNldmVyaXR5fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0J1dHRvbkdyb3VwPlxuICAgICAgICAgIDxSZWdFeHBGaWx0ZXJcbiAgICAgICAgICAgIHJlZj17Y29tcG9uZW50ID0+ICh0aGlzLl9maWx0ZXJDb21wb25lbnQgPSBjb21wb25lbnQpfVxuICAgICAgICAgICAgdmFsdWU9e3tcbiAgICAgICAgICAgICAgdGV4dDogdGhpcy5wcm9wcy5maWx0ZXJUZXh0LFxuICAgICAgICAgICAgICBpc1JlZ0V4cDogdGhpcy5wcm9wcy5lbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgICAgICAgICAgIGludmFsaWQ6IHRoaXMucHJvcHMuaW52YWxpZEZpbHRlcklucHV0LFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9oYW5kbGVGaWx0ZXJDaGFuZ2V9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Ub29sYmFyTGVmdD5cbiAgICAgICAgPFRvb2xiYXJSaWdodD5cbiAgICAgICAgICB7cGFzdGVCdXR0b259XG4gICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgc2l6ZT17QnV0dG9uU2l6ZXMuU01BTEx9XG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbGVhckJ1dHRvbkNsaWNrfT5cbiAgICAgICAgICAgIENsZWFyXG4gICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgIDwvVG9vbGJhclJpZ2h0PlxuICAgICAgPC9Ub29sYmFyPlxuICAgICk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc29ydEFscGhhKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgYUxvd2VyID0gYS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBiTG93ZXIgPSBiLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChhTG93ZXIgPCBiTG93ZXIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoYUxvd2VyID4gYkxvd2VyKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbnR5cGUgTGFiZWxQcm9wcyA9IHtcbiAgc2VsZWN0ZWRPcHRpb25zOiBBcnJheTx7dmFsdWU6IHN0cmluZywgbGFiZWw6IHN0cmluZ30+LFxufTtcblxuZnVuY3Rpb24gTXVsdGlTZWxlY3RMYWJlbChwcm9wczogTGFiZWxQcm9wcyk6IFJlYWN0LkVsZW1lbnQ8YW55PiB7XG4gIGNvbnN0IHtzZWxlY3RlZE9wdGlvbnN9ID0gcHJvcHM7XG4gIGNvbnN0IGxhYmVsID1cbiAgICBzZWxlY3RlZE9wdGlvbnMubGVuZ3RoID09PSAxXG4gICAgICA/IHNlbGVjdGVkT3B0aW9uc1swXS5sYWJlbFxuICAgICAgOiBgJHtzZWxlY3RlZE9wdGlvbnMubGVuZ3RofSBTb3VyY2VzYDtcbiAgcmV0dXJuIDxzcGFuPlNob3dpbmc6IHtsYWJlbH08L3NwYW4+O1xufVxuXG50eXBlIEZpbHRlckJ1dHRvblByb3BzID0ge3xcbiAgc2V2ZXJpdHk6ICdlcnJvcicgfCAnd2FybmluZycgfCAnaW5mbycsXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcbiAgdG9nZ2xlU2V2ZXJpdHk6IFNldmVyaXR5ID0+IHZvaWQsXG58fTtcblxuZnVuY3Rpb24gRmlsdGVyQnV0dG9uKHByb3BzOiBGaWx0ZXJCdXR0b25Qcm9wcyk6IFJlYWN0LkVsZW1lbnQ8YW55PiB7XG4gIGNvbnN0IHtzZXZlcml0eX0gPSBwcm9wcztcbiAgY29uc3Qgc2VsZWN0ZWQgPSBwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHByb3BzLnNldmVyaXR5KTtcbiAgbGV0IHRvb2x0aXBUaXRsZSA9IHNlbGVjdGVkID8gJ0hpZGUgJyA6ICdTaG93ICc7XG4gIGxldCBpY29uO1xuICBzd2l0Y2ggKHNldmVyaXR5KSB7XG4gICAgY2FzZSAnZXJyb3InOlxuICAgICAgdG9vbHRpcFRpdGxlICs9ICdFcnJvcnMnO1xuICAgICAgaWNvbiA9ICdudWNsaWNvbi1lcnJvcic7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd3YXJuaW5nJzpcbiAgICAgIHRvb2x0aXBUaXRsZSArPSAnV2FybmluZ3MnO1xuICAgICAgaWNvbiA9ICdudWNsaWNvbi13YXJuaW5nJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2luZm8nOlxuICAgICAgdG9vbHRpcFRpdGxlICs9ICdJbmZvJztcbiAgICAgIGljb24gPSAnaW5mbyc7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgKHNldmVyaXR5OiBlbXB0eSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2V2ZXJpdHk6ICR7c2V2ZXJpdHl9YCk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgIGljb249e2ljb259XG4gICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgIHNlbGVjdGVkPXtwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KX1cbiAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgcHJvcHMudG9nZ2xlU2V2ZXJpdHkoc2V2ZXJpdHkpO1xuICAgICAgfX1cbiAgICAgIHRvb2x0aXA9e3t0aXRsZTogdG9vbHRpcFRpdGxlfX1cbiAgICAvPlxuICApO1xufVxuIl19