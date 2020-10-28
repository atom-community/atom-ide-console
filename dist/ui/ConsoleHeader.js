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

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVIZWFkZXIuanMiXSwibmFtZXMiOlsiQ29uc29sZUhlYWRlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX2ZpbHRlckNvbXBvbmVudCIsImZvY3VzRmlsdGVyIiwiZm9jdXMiLCJfaGFuZGxlQ2xlYXJCdXR0b25DbGljayIsImV2ZW50IiwicHJvcHMiLCJjbGVhciIsIl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrIiwiY3JlYXRlUGFzdGUiLCJfaGFuZGxlRmlsdGVyQ2hhbmdlIiwidmFsdWUiLCJvbkZpbHRlckNoYW5nZSIsIl9yZW5kZXJPcHRpb24iLCJvcHRpb25Qcm9wcyIsIm9wdGlvbiIsInNvdXJjZSIsInNvdXJjZXMiLCJmaW5kIiwicyIsImlkIiwic3RhcnRpbmdTcGlubmVyIiwic3RhdHVzIiwibGFiZWwiLCJfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24iLCJhY3Rpb24iLCJpY29uIiwic3RvcCIsInN0YXJ0IiwiY2xpY2tIYW5kbGVyIiwic3RvcFByb3BhZ2F0aW9uIiwicmVuZGVyIiwib3B0aW9ucyIsInNsaWNlIiwic29ydCIsImEiLCJiIiwic29ydEFscGhhIiwibmFtZSIsIm1hcCIsInNvdXJjZUJ1dHRvbiIsImxlbmd0aCIsIk11bHRpU2VsZWN0TGFiZWwiLCJCdXR0b25TaXplcyIsIlNNQUxMIiwic2VsZWN0ZWRTb3VyY2VJZHMiLCJvblNlbGVjdGVkU291cmNlc0NoYW5nZSIsInBhc3RlQnV0dG9uIiwidGl0bGUiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJ0b2dnbGVTZXZlcml0eSIsImNvbXBvbmVudCIsInRleHQiLCJmaWx0ZXJUZXh0IiwiaXNSZWdFeHAiLCJlbmFibGVSZWdFeHBGaWx0ZXIiLCJpbnZhbGlkIiwiaW52YWxpZEZpbHRlcklucHV0IiwiYUxvd2VyIiwidG9Mb3dlckNhc2UiLCJiTG93ZXIiLCJzZWxlY3RlZE9wdGlvbnMiLCJGaWx0ZXJCdXR0b24iLCJzZXZlcml0eSIsInNlbGVjdGVkIiwiaGFz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Q0F4QyxNQUFBQSxJQUFJLEdBQUcsZ0JBQVA7QUFDQTs7QUFDRixTQUFLLFNBQUw7QUFDRXdDLE1BQUFBLFlBQVksSUFBSSxVQUFoQjtBQUNBeEMsTUFBQUEsSUFBSSxHQUFHLGtCQUFQO0FBQ0E7O0FBQ0YsU0FBSyxNQUFMO0FBQ0V3QyxNQUFBQSxZQUFZLElBQUksTUFBaEI7QUFDQXhDLE1BQUFBLElBQUksR0FBRyxNQUFQO0FBQ0E7O0FBQ0Y7QUFDR3FDLE1BQUFBLFFBQUQ7QUFDQSxZQUFNLElBQUlJLEtBQUosQ0FBVyxxQkFBb0JKLFFBQVMsRUFBeEMsQ0FBTjtBQWZKOztBQWtCQSxzQkFDRSxvQkFBQyxjQUFEO0FBQ0UsSUFBQSxJQUFJLEVBQUVyQyxJQURSO0FBRUUsSUFBQSxJQUFJLEVBQUVpQixvQkFBWUMsS0FGcEI7QUFHRSxJQUFBLFFBQVEsRUFBRXRDLEtBQUssQ0FBQzJDLGtCQUFOLENBQXlCZ0IsR0FBekIsQ0FBNkJGLFFBQTdCLENBSFo7QUFJRSxJQUFBLE9BQU8sRUFBRSxNQUFNO0FBQ2J6RCxNQUFBQSxLQUFLLENBQUM0QyxjQUFOLENBQXFCYSxRQUFyQjtBQUNELEtBTkg7QUFPRSxJQUFBLE9BQU8sRUFBRTtBQUFDZixNQUFBQSxLQUFLLEVBQUVrQjtBQUFSO0FBUFgsSUFERjtBQVdEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxyXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKlxyXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcclxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XHJcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxyXG4gKlxyXG4gKiBAZmxvd1xyXG4gKiBAZm9ybWF0XHJcbiAqL1xyXG5cclxuaW1wb3J0IHR5cGUge1NvdXJjZSwgU2V2ZXJpdHl9IGZyb20gJy4uL3R5cGVzJztcclxuaW1wb3J0IHR5cGUge1JlZ0V4cEZpbHRlckNoYW5nZX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyJztcclxuXHJcbmltcG9ydCB7QnV0dG9uR3JvdXB9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0J1dHRvbkdyb3VwJztcclxuaW1wb3J0IHtMb2FkaW5nU3Bpbm5lcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTG9hZGluZ1NwaW5uZXInO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7TW9kYWxNdWx0aVNlbGVjdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTW9kYWxNdWx0aVNlbGVjdCc7XHJcbmltcG9ydCBSZWdFeHBGaWx0ZXIgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyJztcclxuaW1wb3J0IHtUb29sYmFyfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Ub29sYmFyJztcclxuaW1wb3J0IHtUb29sYmFyTGVmdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhckxlZnQnO1xyXG5pbXBvcnQge1Rvb2xiYXJSaWdodH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhclJpZ2h0JztcclxuaW1wb3J0IGFkZFRvb2x0aXAgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvYWRkVG9vbHRpcCc7XHJcblxyXG5pbXBvcnQge0J1dHRvbiwgQnV0dG9uU2l6ZXN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0J1dHRvbic7XHJcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcclxuXHJcbnR5cGUgUHJvcHMgPSB7fFxyXG4gIGNsZWFyOiAoKSA9PiB2b2lkLFxyXG4gIGNyZWF0ZVBhc3RlOiA/KCkgPT4gUHJvbWlzZTx2b2lkPixcclxuICBpbnZhbGlkRmlsdGVySW5wdXQ6IGJvb2xlYW4sXHJcbiAgZW5hYmxlUmVnRXhwRmlsdGVyOiBib29sZWFuLFxyXG4gIG9uRmlsdGVyQ2hhbmdlOiAoY2hhbmdlOiBSZWdFeHBGaWx0ZXJDaGFuZ2UpID0+IHZvaWQsXHJcbiAgc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXHJcbiAgc291cmNlczogQXJyYXk8U291cmNlPixcclxuICBvblNlbGVjdGVkU291cmNlc0NoYW5nZTogKHNvdXJjZUlkczogQXJyYXk8c3RyaW5nPikgPT4gdm9pZCxcclxuICBmaWx0ZXJUZXh0OiBzdHJpbmcsXHJcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxyXG4gIHRvZ2dsZVNldmVyaXR5OiAoc2V2ZXJpdHk6IFNldmVyaXR5KSA9PiB2b2lkLFxyXG58fTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbnNvbGVIZWFkZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcclxuICBfZmlsdGVyQ29tcG9uZW50OiA/UmVnRXhwRmlsdGVyO1xyXG5cclxuICBmb2N1c0ZpbHRlciA9ICgpOiB2b2lkID0+IHtcclxuICAgIGlmICh0aGlzLl9maWx0ZXJDb21wb25lbnQgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLl9maWx0ZXJDb21wb25lbnQuZm9jdXMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBfaGFuZGxlQ2xlYXJCdXR0b25DbGljayA9IChldmVudDogU3ludGhldGljTW91c2VFdmVudDw+KTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLnByb3BzLmNsZWFyKCk7XHJcbiAgfTtcclxuXHJcbiAgX2hhbmRsZUNyZWF0ZVBhc3RlQnV0dG9uQ2xpY2sgPSAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQ8Pik6IHZvaWQgPT4ge1xyXG4gICAgaWYgKHRoaXMucHJvcHMuY3JlYXRlUGFzdGUgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgX2hhbmRsZUZpbHRlckNoYW5nZSA9ICh2YWx1ZTogUmVnRXhwRmlsdGVyQ2hhbmdlKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLnByb3BzLm9uRmlsdGVyQ2hhbmdlKHZhbHVlKTtcclxuICB9O1xyXG5cclxuICBfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24oc291cmNlOiBTb3VyY2UpOiA/UmVhY3QuRWxlbWVudDxhbnk+IHtcclxuICAgIGxldCBhY3Rpb247XHJcbiAgICBsZXQgbGFiZWw7XHJcbiAgICBsZXQgaWNvbjtcclxuICAgIHN3aXRjaCAoc291cmNlLnN0YXR1cykge1xyXG4gICAgICBjYXNlICdzdGFydGluZyc6XHJcbiAgICAgIGNhc2UgJ3J1bm5pbmcnOiB7XHJcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0b3A7XHJcbiAgICAgICAgbGFiZWwgPSAnU3RvcCBQcm9jZXNzJztcclxuICAgICAgICBpY29uID0gJ3ByaW1pdGl2ZS1zcXVhcmUnO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ3N0b3BwZWQnOiB7XHJcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0YXJ0O1xyXG4gICAgICAgIGxhYmVsID0gJ1N0YXJ0IFByb2Nlc3MnO1xyXG4gICAgICAgIGljb24gPSAndHJpYW5nbGUtcmlnaHQnO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoYWN0aW9uID09IG51bGwpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgY2xpY2tIYW5kbGVyID0gZXZlbnQgPT4ge1xyXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgaW52YXJpYW50KGFjdGlvbiAhPSBudWxsKTtcclxuICAgICAgYWN0aW9uKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPEJ1dHRvblxyXG4gICAgICAgIGNsYXNzTmFtZT1cInB1bGwtcmlnaHQgY29uc29sZS1wcm9jZXNzLWNvbnRyb2wtYnV0dG9uXCJcclxuICAgICAgICBpY29uPXtpY29ufVxyXG4gICAgICAgIG9uQ2xpY2s9e2NsaWNrSGFuZGxlcn0+XHJcbiAgICAgICAge2xhYmVsfVxyXG4gICAgICA8L0J1dHRvbj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBfcmVuZGVyT3B0aW9uID0gKG9wdGlvblByb3BzOiB7XHJcbiAgICBvcHRpb246IHtsYWJlbDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfSxcclxuICB9KTogUmVhY3QuRWxlbWVudDxhbnk+ID0+IHtcclxuICAgIGNvbnN0IHtvcHRpb259ID0gb3B0aW9uUHJvcHM7XHJcbiAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnByb3BzLnNvdXJjZXMuZmluZChzID0+IHMuaWQgPT09IG9wdGlvbi52YWx1ZSk7XHJcbiAgICBpbnZhcmlhbnQoc291cmNlICE9IG51bGwpO1xyXG4gICAgY29uc3Qgc3RhcnRpbmdTcGlubmVyID1cclxuICAgICAgc291cmNlLnN0YXR1cyAhPT0gJ3N0YXJ0aW5nJyA/IG51bGwgOiAoXHJcbiAgICAgICAgPExvYWRpbmdTcGlubmVyXHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgY29uc29sZS1wcm9jZXNzLXN0YXJ0aW5nLXNwaW5uZXJcIlxyXG4gICAgICAgICAgc2l6ZT1cIkVYVFJBX1NNQUxMXCJcclxuICAgICAgICAvPlxyXG4gICAgICApO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHNwYW4+XHJcbiAgICAgICAge29wdGlvbi5sYWJlbH1cclxuICAgICAgICB7c3RhcnRpbmdTcGlubmVyfVxyXG4gICAgICAgIHt0aGlzLl9yZW5kZXJQcm9jZXNzQ29udHJvbEJ1dHRvbihzb3VyY2UpfVxyXG4gICAgICA8L3NwYW4+XHJcbiAgICApO1xyXG4gIH07XHJcblxyXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLnByb3BzLnNvdXJjZXNcclxuICAgICAgLnNsaWNlKClcclxuICAgICAgLnNvcnQoKGEsIGIpID0+IHNvcnRBbHBoYShhLm5hbWUsIGIubmFtZSkpXHJcbiAgICAgIC5tYXAoc291cmNlID0+ICh7XHJcbiAgICAgICAgbGFiZWw6IHNvdXJjZS5uYW1lLFxyXG4gICAgICAgIHZhbHVlOiBzb3VyY2UuaWQsXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICBjb25zdCBzb3VyY2VCdXR0b24gPVxyXG4gICAgICBvcHRpb25zLmxlbmd0aCA9PT0gMCA/IG51bGwgOiAoXHJcbiAgICAgICAgPE1vZGFsTXVsdGlTZWxlY3RcclxuICAgICAgICAgIGxhYmVsQ29tcG9uZW50PXtNdWx0aVNlbGVjdExhYmVsfVxyXG4gICAgICAgICAgb3B0aW9uQ29tcG9uZW50PXt0aGlzLl9yZW5kZXJPcHRpb259XHJcbiAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cclxuICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XHJcbiAgICAgICAgICB2YWx1ZT17dGhpcy5wcm9wcy5zZWxlY3RlZFNvdXJjZUlkc31cclxuICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLnByb3BzLm9uU2VsZWN0ZWRTb3VyY2VzQ2hhbmdlfVxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCJcclxuICAgICAgICAvPlxyXG4gICAgICApO1xyXG5cclxuICAgIGNvbnN0IHBhc3RlQnV0dG9uID1cclxuICAgICAgdGhpcy5wcm9wcy5jcmVhdGVQYXN0ZSA9PSBudWxsID8gbnVsbCA6IChcclxuICAgICAgICA8QnV0dG9uXHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2tcIlxyXG4gICAgICAgICAgc2l6ZT17QnV0dG9uU2l6ZXMuU01BTEx9XHJcbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrfVxyXG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG51Y2xpZGUtaW50ZXJuYWwvanN4LXNpbXBsZS1jYWxsYmFjay1yZWZzXHJcbiAgICAgICAgICByZWY9e2FkZFRvb2x0aXAoe1xyXG4gICAgICAgICAgICB0aXRsZTogJ0NyZWF0ZXMgYSBQYXN0ZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRlbnRzIG9mIHRoZSBjb25zb2xlJyxcclxuICAgICAgICAgIH0pfT5cclxuICAgICAgICAgIENyZWF0ZSBQYXN0ZVxyXG4gICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICApO1xyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxUb29sYmFyIGxvY2F0aW9uPVwidG9wXCI+XHJcbiAgICAgICAgPFRvb2xiYXJMZWZ0PlxyXG4gICAgICAgICAge3NvdXJjZUJ1dHRvbn1cclxuICAgICAgICAgIDxCdXR0b25Hcm91cCBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2tcIj5cclxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxyXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwiZXJyb3JcIlxyXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XHJcbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgIDxGaWx0ZXJCdXR0b25cclxuICAgICAgICAgICAgICBzZXZlcml0eT1cIndhcm5pbmdcIlxyXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XHJcbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgIDxGaWx0ZXJCdXR0b25cclxuICAgICAgICAgICAgICBzZXZlcml0eT1cImluZm9cIlxyXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XHJcbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICA8L0J1dHRvbkdyb3VwPlxyXG4gICAgICAgICAgPFJlZ0V4cEZpbHRlclxyXG4gICAgICAgICAgICByZWY9e2NvbXBvbmVudCA9PiAodGhpcy5fZmlsdGVyQ29tcG9uZW50ID0gY29tcG9uZW50KX1cclxuICAgICAgICAgICAgdmFsdWU9e3tcclxuICAgICAgICAgICAgICB0ZXh0OiB0aGlzLnByb3BzLmZpbHRlclRleHQsXHJcbiAgICAgICAgICAgICAgaXNSZWdFeHA6IHRoaXMucHJvcHMuZW5hYmxlUmVnRXhwRmlsdGVyLFxyXG4gICAgICAgICAgICAgIGludmFsaWQ6IHRoaXMucHJvcHMuaW52YWxpZEZpbHRlcklucHV0LFxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5faGFuZGxlRmlsdGVyQ2hhbmdlfVxyXG4gICAgICAgICAgLz5cclxuICAgICAgICA8L1Rvb2xiYXJMZWZ0PlxyXG4gICAgICAgIDxUb29sYmFyUmlnaHQ+XHJcbiAgICAgICAgICB7cGFzdGVCdXR0b259XHJcbiAgICAgICAgICA8QnV0dG9uXHJcbiAgICAgICAgICAgIHNpemU9e0J1dHRvblNpemVzLlNNQUxMfVxyXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbGVhckJ1dHRvbkNsaWNrfT5cclxuICAgICAgICAgICAgQ2xlYXJcclxuICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgIDwvVG9vbGJhclJpZ2h0PlxyXG4gICAgICA8L1Rvb2xiYXI+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc29ydEFscGhhKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcclxuICBjb25zdCBhTG93ZXIgPSBhLnRvTG93ZXJDYXNlKCk7XHJcbiAgY29uc3QgYkxvd2VyID0gYi50b0xvd2VyQ2FzZSgpO1xyXG4gIGlmIChhTG93ZXIgPCBiTG93ZXIpIHtcclxuICAgIHJldHVybiAtMTtcclxuICB9IGVsc2UgaWYgKGFMb3dlciA+IGJMb3dlcikge1xyXG4gICAgcmV0dXJuIDE7XHJcbiAgfVxyXG4gIHJldHVybiAwO1xyXG59XHJcblxyXG50eXBlIExhYmVsUHJvcHMgPSB7XHJcbiAgc2VsZWN0ZWRPcHRpb25zOiBBcnJheTx7dmFsdWU6IHN0cmluZywgbGFiZWw6IHN0cmluZ30+LFxyXG59O1xyXG5cclxuZnVuY3Rpb24gTXVsdGlTZWxlY3RMYWJlbChwcm9wczogTGFiZWxQcm9wcyk6IFJlYWN0LkVsZW1lbnQ8YW55PiB7XHJcbiAgY29uc3Qge3NlbGVjdGVkT3B0aW9uc30gPSBwcm9wcztcclxuICBjb25zdCBsYWJlbCA9XHJcbiAgICBzZWxlY3RlZE9wdGlvbnMubGVuZ3RoID09PSAxXHJcbiAgICAgID8gc2VsZWN0ZWRPcHRpb25zWzBdLmxhYmVsXHJcbiAgICAgIDogYCR7c2VsZWN0ZWRPcHRpb25zLmxlbmd0aH0gU291cmNlc2A7XHJcbiAgcmV0dXJuIDxzcGFuPlNob3dpbmc6IHtsYWJlbH08L3NwYW4+O1xyXG59XHJcblxyXG50eXBlIEZpbHRlckJ1dHRvblByb3BzID0ge3xcclxuICBzZXZlcml0eTogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdpbmZvJyxcclxuICBzZWxlY3RlZFNldmVyaXRpZXM6IFNldDxTZXZlcml0eT4sXHJcbiAgdG9nZ2xlU2V2ZXJpdHk6IFNldmVyaXR5ID0+IHZvaWQsXHJcbnx9O1xyXG5cclxuZnVuY3Rpb24gRmlsdGVyQnV0dG9uKHByb3BzOiBGaWx0ZXJCdXR0b25Qcm9wcyk6IFJlYWN0LkVsZW1lbnQ8YW55PiB7XHJcbiAgY29uc3Qge3NldmVyaXR5fSA9IHByb3BzO1xyXG4gIGNvbnN0IHNlbGVjdGVkID0gcHJvcHMuc2VsZWN0ZWRTZXZlcml0aWVzLmhhcyhwcm9wcy5zZXZlcml0eSk7XHJcbiAgbGV0IHRvb2x0aXBUaXRsZSA9IHNlbGVjdGVkID8gJ0hpZGUgJyA6ICdTaG93ICc7XHJcbiAgbGV0IGljb247XHJcbiAgc3dpdGNoIChzZXZlcml0eSkge1xyXG4gICAgY2FzZSAnZXJyb3InOlxyXG4gICAgICB0b29sdGlwVGl0bGUgKz0gJ0Vycm9ycyc7XHJcbiAgICAgIGljb24gPSAnbnVjbGljb24tZXJyb3InO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ3dhcm5pbmcnOlxyXG4gICAgICB0b29sdGlwVGl0bGUgKz0gJ1dhcm5pbmdzJztcclxuICAgICAgaWNvbiA9ICdudWNsaWNvbi13YXJuaW5nJztcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdpbmZvJzpcclxuICAgICAgdG9vbHRpcFRpdGxlICs9ICdJbmZvJztcclxuICAgICAgaWNvbiA9ICdpbmZvJztcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAoc2V2ZXJpdHk6IGVtcHR5KTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNldmVyaXR5OiAke3NldmVyaXR5fWApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxCdXR0b25cclxuICAgICAgaWNvbj17aWNvbn1cclxuICAgICAgc2l6ZT17QnV0dG9uU2l6ZXMuU01BTEx9XHJcbiAgICAgIHNlbGVjdGVkPXtwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KX1cclxuICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgIHByb3BzLnRvZ2dsZVNldmVyaXR5KHNldmVyaXR5KTtcclxuICAgICAgfX1cclxuICAgICAgdG9vbHRpcD17e3RpdGxlOiB0b29sdGlwVGl0bGV9fVxyXG4gICAgLz5cclxuICApO1xyXG59XHJcbiJdfQ==