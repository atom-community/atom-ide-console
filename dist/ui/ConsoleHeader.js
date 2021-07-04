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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVIZWFkZXIuanMiXSwibmFtZXMiOlsiQ29uc29sZUhlYWRlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX2ZpbHRlckNvbXBvbmVudCIsImZvY3VzRmlsdGVyIiwiZm9jdXMiLCJfaGFuZGxlQ2xlYXJCdXR0b25DbGljayIsImV2ZW50IiwicHJvcHMiLCJjbGVhciIsIl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrIiwiY3JlYXRlUGFzdGUiLCJfaGFuZGxlRmlsdGVyQ2hhbmdlIiwidmFsdWUiLCJvbkZpbHRlckNoYW5nZSIsIl9yZW5kZXJPcHRpb24iLCJvcHRpb25Qcm9wcyIsIm9wdGlvbiIsInNvdXJjZSIsInNvdXJjZXMiLCJmaW5kIiwicyIsImlkIiwic3RhcnRpbmdTcGlubmVyIiwic3RhdHVzIiwibGFiZWwiLCJfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24iLCJhY3Rpb24iLCJpY29uIiwic3RvcCIsInN0YXJ0IiwiY2xpY2tIYW5kbGVyIiwic3RvcFByb3BhZ2F0aW9uIiwicmVuZGVyIiwib3B0aW9ucyIsInNsaWNlIiwic29ydCIsImEiLCJiIiwic29ydEFscGhhIiwibmFtZSIsIm1hcCIsInNvdXJjZUJ1dHRvbiIsImxlbmd0aCIsIk11bHRpU2VsZWN0TGFiZWwiLCJCdXR0b25TaXplcyIsIlNNQUxMIiwic2VsZWN0ZWRTb3VyY2VJZHMiLCJvblNlbGVjdGVkU291cmNlc0NoYW5nZSIsInBhc3RlQnV0dG9uIiwidGl0bGUiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJ0b2dnbGVTZXZlcml0eSIsImNvbXBvbmVudCIsInRleHQiLCJmaWx0ZXJUZXh0IiwiaXNSZWdFeHAiLCJlbmFibGVSZWdFeHBGaWx0ZXIiLCJpbnZhbGlkIiwiaW52YWxpZEZpbHRlcklucHV0IiwiYUxvd2VyIiwidG9Mb3dlckNhc2UiLCJiTG93ZXIiLCJzZWxlY3RlZE9wdGlvbnMiLCJGaWx0ZXJCdXR0b24iLCJzZXZlcml0eSIsInNlbGVjdGVkIiwiaGFz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QUssU0FBTDtBQUNFd0MsTUFBQUEsWUFBWSxJQUFJLFVBQWhCO0FBQ0F4QyxNQUFBQSxJQUFJLEdBQUcsa0JBQVA7QUFDQTs7QUFDRixTQUFLLE1BQUw7QUFDRXdDLE1BQUFBLFlBQVksSUFBSSxNQUFoQjtBQUNBeEMsTUFBQUEsSUFBSSxHQUFHLE1BQVA7QUFDQTs7QUFDRjtBQUNHcUMsTUFBQUEsUUFBRDtBQUNBLFlBQU0sSUFBSUksS0FBSixDQUFXLHFCQUFvQkosUUFBUyxFQUF4QyxDQUFOO0FBZko7O0FBa0JBLHNCQUNFLG9CQUFDLGNBQUQ7QUFDRSxJQUFBLElBQUksRUFBRXJDLElBRFI7QUFFRSxJQUFBLElBQUksRUFBRWlCLG9CQUFZQyxLQUZwQjtBQUdFLElBQUEsUUFBUSxFQUFFdEMsS0FBSyxDQUFDMkMsa0JBQU4sQ0FBeUJnQixHQUF6QixDQUE2QkYsUUFBN0IsQ0FIWjtBQUlFLElBQUEsT0FBTyxFQUFFLE1BQU07QUFDYnpELE1BQUFBLEtBQUssQ0FBQzRDLGNBQU4sQ0FBcUJhLFFBQXJCO0FBQ0QsS0FOSDtBQU9FLElBQUEsT0FBTyxFQUFFO0FBQUNmLE1BQUFBLEtBQUssRUFBRWtCO0FBQVI7QUFQWCxJQURGO0FBV0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQGZsb3dcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7U291cmNlLCBTZXZlcml0eX0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHR5cGUge1JlZ0V4cEZpbHRlckNoYW5nZX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyJztcblxuaW1wb3J0IHtCdXR0b25Hcm91cH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQnV0dG9uR3JvdXAnO1xuaW1wb3J0IHtMb2FkaW5nU3Bpbm5lcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTG9hZGluZ1NwaW5uZXInO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtNb2RhbE11bHRpU2VsZWN0fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Nb2RhbE11bHRpU2VsZWN0JztcbmltcG9ydCBSZWdFeHBGaWx0ZXIgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyJztcbmltcG9ydCB7VG9vbGJhcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhcic7XG5pbXBvcnQge1Rvb2xiYXJMZWZ0fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Ub29sYmFyTGVmdCc7XG5pbXBvcnQge1Rvb2xiYXJSaWdodH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhclJpZ2h0JztcbmltcG9ydCBhZGRUb29sdGlwIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2FkZFRvb2x0aXAnO1xuXG5pbXBvcnQge0J1dHRvbiwgQnV0dG9uU2l6ZXN9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0J1dHRvbic7XG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5cbnR5cGUgUHJvcHMgPSB7fFxuICBjbGVhcjogKCkgPT4gdm9pZCxcbiAgY3JlYXRlUGFzdGU6ID8oKSA9PiBQcm9taXNlPHZvaWQ+LFxuICBpbnZhbGlkRmlsdGVySW5wdXQ6IGJvb2xlYW4sXG4gIGVuYWJsZVJlZ0V4cEZpbHRlcjogYm9vbGVhbixcbiAgb25GaWx0ZXJDaGFuZ2U6IChjaGFuZ2U6IFJlZ0V4cEZpbHRlckNoYW5nZSkgPT4gdm9pZCxcbiAgc2VsZWN0ZWRTb3VyY2VJZHM6IEFycmF5PHN0cmluZz4sXG4gIHNvdXJjZXM6IEFycmF5PFNvdXJjZT4sXG4gIG9uU2VsZWN0ZWRTb3VyY2VzQ2hhbmdlOiAoc291cmNlSWRzOiBBcnJheTxzdHJpbmc+KSA9PiB2b2lkLFxuICBmaWx0ZXJUZXh0OiBzdHJpbmcsXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcbiAgdG9nZ2xlU2V2ZXJpdHk6IChzZXZlcml0eTogU2V2ZXJpdHkpID0+IHZvaWQsXG58fTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZUhlYWRlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBfZmlsdGVyQ29tcG9uZW50OiA/UmVnRXhwRmlsdGVyO1xuXG4gIGZvY3VzRmlsdGVyID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICh0aGlzLl9maWx0ZXJDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fZmlsdGVyQ29tcG9uZW50LmZvY3VzKCk7XG4gICAgfVxuICB9O1xuXG4gIF9oYW5kbGVDbGVhckJ1dHRvbkNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcbiAgICB0aGlzLnByb3BzLmNsZWFyKCk7XG4gIH07XG5cbiAgX2hhbmRsZUNyZWF0ZVBhc3RlQnV0dG9uQ2xpY2sgPSAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQ8Pik6IHZvaWQgPT4ge1xuICAgIGlmICh0aGlzLnByb3BzLmNyZWF0ZVBhc3RlICE9IG51bGwpIHtcbiAgICAgIHRoaXMucHJvcHMuY3JlYXRlUGFzdGUoKTtcbiAgICB9XG4gIH07XG5cbiAgX2hhbmRsZUZpbHRlckNoYW5nZSA9ICh2YWx1ZTogUmVnRXhwRmlsdGVyQ2hhbmdlKTogdm9pZCA9PiB7XG4gICAgdGhpcy5wcm9wcy5vbkZpbHRlckNoYW5nZSh2YWx1ZSk7XG4gIH07XG5cbiAgX3JlbmRlclByb2Nlc3NDb250cm9sQnV0dG9uKHNvdXJjZTogU291cmNlKTogP1JlYWN0LkVsZW1lbnQ8YW55PiB7XG4gICAgbGV0IGFjdGlvbjtcbiAgICBsZXQgbGFiZWw7XG4gICAgbGV0IGljb247XG4gICAgc3dpdGNoIChzb3VyY2Uuc3RhdHVzKSB7XG4gICAgICBjYXNlICdzdGFydGluZyc6XG4gICAgICBjYXNlICdydW5uaW5nJzoge1xuICAgICAgICBhY3Rpb24gPSBzb3VyY2Uuc3RvcDtcbiAgICAgICAgbGFiZWwgPSAnU3RvcCBQcm9jZXNzJztcbiAgICAgICAgaWNvbiA9ICdwcmltaXRpdmUtc3F1YXJlJztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdzdG9wcGVkJzoge1xuICAgICAgICBhY3Rpb24gPSBzb3VyY2Uuc3RhcnQ7XG4gICAgICAgIGxhYmVsID0gJ1N0YXJ0IFByb2Nlc3MnO1xuICAgICAgICBpY29uID0gJ3RyaWFuZ2xlLXJpZ2h0JztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhY3Rpb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjbGlja0hhbmRsZXIgPSBldmVudCA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGludmFyaWFudChhY3Rpb24gIT0gbnVsbCk7XG4gICAgICBhY3Rpb24oKTtcbiAgICB9O1xuICAgIHJldHVybiAoXG4gICAgICA8QnV0dG9uXG4gICAgICAgIGNsYXNzTmFtZT1cInB1bGwtcmlnaHQgY29uc29sZS1wcm9jZXNzLWNvbnRyb2wtYnV0dG9uXCJcbiAgICAgICAgaWNvbj17aWNvbn1cbiAgICAgICAgb25DbGljaz17Y2xpY2tIYW5kbGVyfT5cbiAgICAgICAge2xhYmVsfVxuICAgICAgPC9CdXR0b24+XG4gICAgKTtcbiAgfVxuXG4gIF9yZW5kZXJPcHRpb24gPSAob3B0aW9uUHJvcHM6IHtcbiAgICBvcHRpb246IHtsYWJlbDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfSxcbiAgfSk6IFJlYWN0LkVsZW1lbnQ8YW55PiA9PiB7XG4gICAgY29uc3Qge29wdGlvbn0gPSBvcHRpb25Qcm9wcztcbiAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnByb3BzLnNvdXJjZXMuZmluZChzID0+IHMuaWQgPT09IG9wdGlvbi52YWx1ZSk7XG4gICAgaW52YXJpYW50KHNvdXJjZSAhPSBudWxsKTtcbiAgICBjb25zdCBzdGFydGluZ1NwaW5uZXIgPVxuICAgICAgc291cmNlLnN0YXR1cyAhPT0gJ3N0YXJ0aW5nJyA/IG51bGwgOiAoXG4gICAgICAgIDxMb2FkaW5nU3Bpbm5lclxuICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1ibG9jayBjb25zb2xlLXByb2Nlc3Mtc3RhcnRpbmctc3Bpbm5lclwiXG4gICAgICAgICAgc2l6ZT1cIkVYVFJBX1NNQUxMXCJcbiAgICAgICAgLz5cbiAgICAgICk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxzcGFuPlxuICAgICAgICB7b3B0aW9uLmxhYmVsfVxuICAgICAgICB7c3RhcnRpbmdTcGlubmVyfVxuICAgICAgICB7dGhpcy5fcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24oc291cmNlKX1cbiAgICAgIDwvc3Bhbj5cbiAgICApO1xuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wcm9wcy5zb3VyY2VzXG4gICAgICAuc2xpY2UoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IHNvcnRBbHBoYShhLm5hbWUsIGIubmFtZSkpXG4gICAgICAubWFwKHNvdXJjZSA9PiAoe1xuICAgICAgICBsYWJlbDogc291cmNlLm5hbWUsXG4gICAgICAgIHZhbHVlOiBzb3VyY2UuaWQsXG4gICAgICB9KSk7XG5cbiAgICBjb25zdCBzb3VyY2VCdXR0b24gPVxuICAgICAgb3B0aW9ucy5sZW5ndGggPT09IDAgPyBudWxsIDogKFxuICAgICAgICA8TW9kYWxNdWx0aVNlbGVjdFxuICAgICAgICAgIGxhYmVsQ29tcG9uZW50PXtNdWx0aVNlbGVjdExhYmVsfVxuICAgICAgICAgIG9wdGlvbkNvbXBvbmVudD17dGhpcy5fcmVuZGVyT3B0aW9ufVxuICAgICAgICAgIHNpemU9e0J1dHRvblNpemVzLlNNQUxMfVxuICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgICAgdmFsdWU9e3RoaXMucHJvcHMuc2VsZWN0ZWRTb3VyY2VJZHN9XG4gICAgICAgICAgb25DaGFuZ2U9e3RoaXMucHJvcHMub25TZWxlY3RlZFNvdXJjZXNDaGFuZ2V9XG4gICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCJcbiAgICAgICAgLz5cbiAgICAgICk7XG5cbiAgICBjb25zdCBwYXN0ZUJ1dHRvbiA9XG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlID09IG51bGwgPyBudWxsIDogKFxuICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCJcbiAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrfVxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2pzeC1zaW1wbGUtY2FsbGJhY2stcmVmc1xuICAgICAgICAgIHJlZj17YWRkVG9vbHRpcCh7XG4gICAgICAgICAgICB0aXRsZTogJ0NyZWF0ZXMgYSBQYXN0ZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRlbnRzIG9mIHRoZSBjb25zb2xlJyxcbiAgICAgICAgICB9KX0+XG4gICAgICAgICAgQ3JlYXRlIFBhc3RlXG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgKTtcblxuICAgIHJldHVybiAoXG4gICAgICA8VG9vbGJhciBsb2NhdGlvbj1cInRvcFwiPlxuICAgICAgICA8VG9vbGJhckxlZnQ+XG4gICAgICAgICAge3NvdXJjZUJ1dHRvbn1cbiAgICAgICAgICA8QnV0dG9uR3JvdXAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCI+XG4gICAgICAgICAgICA8RmlsdGVyQnV0dG9uXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwiZXJyb3JcIlxuICAgICAgICAgICAgICBzZWxlY3RlZFNldmVyaXRpZXM9e3RoaXMucHJvcHMuc2VsZWN0ZWRTZXZlcml0aWVzfVxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8RmlsdGVyQnV0dG9uXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwid2FybmluZ1wiXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XG4gICAgICAgICAgICAgIHRvZ2dsZVNldmVyaXR5PXt0aGlzLnByb3BzLnRvZ2dsZVNldmVyaXR5fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxGaWx0ZXJCdXR0b25cbiAgICAgICAgICAgICAgc2V2ZXJpdHk9XCJpbmZvXCJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQnV0dG9uR3JvdXA+XG4gICAgICAgICAgPFJlZ0V4cEZpbHRlclxuICAgICAgICAgICAgcmVmPXtjb21wb25lbnQgPT4gKHRoaXMuX2ZpbHRlckNvbXBvbmVudCA9IGNvbXBvbmVudCl9XG4gICAgICAgICAgICB2YWx1ZT17e1xuICAgICAgICAgICAgICB0ZXh0OiB0aGlzLnByb3BzLmZpbHRlclRleHQsXG4gICAgICAgICAgICAgIGlzUmVnRXhwOiB0aGlzLnByb3BzLmVuYWJsZVJlZ0V4cEZpbHRlcixcbiAgICAgICAgICAgICAgaW52YWxpZDogdGhpcy5wcm9wcy5pbnZhbGlkRmlsdGVySW5wdXQsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX2hhbmRsZUZpbHRlckNoYW5nZX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1Rvb2xiYXJMZWZ0PlxuICAgICAgICA8VG9vbGJhclJpZ2h0PlxuICAgICAgICAgIHtwYXN0ZUJ1dHRvbn1cbiAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX2hhbmRsZUNsZWFyQnV0dG9uQ2xpY2t9PlxuICAgICAgICAgICAgQ2xlYXJcbiAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgPC9Ub29sYmFyUmlnaHQ+XG4gICAgICA8L1Rvb2xiYXI+XG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzb3J0QWxwaGEoYTogc3RyaW5nLCBiOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBhTG93ZXIgPSBhLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGJMb3dlciA9IGIudG9Mb3dlckNhc2UoKTtcbiAgaWYgKGFMb3dlciA8IGJMb3dlcikge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmIChhTG93ZXIgPiBiTG93ZXIpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxudHlwZSBMYWJlbFByb3BzID0ge1xuICBzZWxlY3RlZE9wdGlvbnM6IEFycmF5PHt2YWx1ZTogc3RyaW5nLCBsYWJlbDogc3RyaW5nfT4sXG59O1xuXG5mdW5jdGlvbiBNdWx0aVNlbGVjdExhYmVsKHByb3BzOiBMYWJlbFByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgY29uc3Qge3NlbGVjdGVkT3B0aW9uc30gPSBwcm9wcztcbiAgY29uc3QgbGFiZWwgPVxuICAgIHNlbGVjdGVkT3B0aW9ucy5sZW5ndGggPT09IDFcbiAgICAgID8gc2VsZWN0ZWRPcHRpb25zWzBdLmxhYmVsXG4gICAgICA6IGAke3NlbGVjdGVkT3B0aW9ucy5sZW5ndGh9IFNvdXJjZXNgO1xuICByZXR1cm4gPHNwYW4+U2hvd2luZzoge2xhYmVsfTwvc3Bhbj47XG59XG5cbnR5cGUgRmlsdGVyQnV0dG9uUHJvcHMgPSB7fFxuICBzZXZlcml0eTogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdpbmZvJyxcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxuICB0b2dnbGVTZXZlcml0eTogU2V2ZXJpdHkgPT4gdm9pZCxcbnx9O1xuXG5mdW5jdGlvbiBGaWx0ZXJCdXR0b24ocHJvcHM6IEZpbHRlckJ1dHRvblByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgY29uc3Qge3NldmVyaXR5fSA9IHByb3BzO1xuICBjb25zdCBzZWxlY3RlZCA9IHByb3BzLnNlbGVjdGVkU2V2ZXJpdGllcy5oYXMocHJvcHMuc2V2ZXJpdHkpO1xuICBsZXQgdG9vbHRpcFRpdGxlID0gc2VsZWN0ZWQgPyAnSGlkZSAnIDogJ1Nob3cgJztcbiAgbGV0IGljb247XG4gIHN3aXRjaCAoc2V2ZXJpdHkpIHtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICB0b29sdGlwVGl0bGUgKz0gJ0Vycm9ycyc7XG4gICAgICBpY29uID0gJ251Y2xpY29uLWVycm9yJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3dhcm5pbmcnOlxuICAgICAgdG9vbHRpcFRpdGxlICs9ICdXYXJuaW5ncyc7XG4gICAgICBpY29uID0gJ251Y2xpY29uLXdhcm5pbmcnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaW5mbyc6XG4gICAgICB0b29sdGlwVGl0bGUgKz0gJ0luZm8nO1xuICAgICAgaWNvbiA9ICdpbmZvJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAoc2V2ZXJpdHk6IGVtcHR5KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZXZlcml0eTogJHtzZXZlcml0eX1gKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJ1dHRvblxuICAgICAgaWNvbj17aWNvbn1cbiAgICAgIHNpemU9e0J1dHRvblNpemVzLlNNQUxMfVxuICAgICAgc2VsZWN0ZWQ9e3Byb3BzLnNlbGVjdGVkU2V2ZXJpdGllcy5oYXMoc2V2ZXJpdHkpfVxuICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICBwcm9wcy50b2dnbGVTZXZlcml0eShzZXZlcml0eSk7XG4gICAgICB9fVxuICAgICAgdG9vbHRpcD17e3RpdGxlOiB0b29sdGlwVGl0bGV9fVxuICAgIC8+XG4gICk7XG59XG4iXX0=