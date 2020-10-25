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
      const startingSpinner = source.status !== "starting" ? null : /*#__PURE__*/React.createElement(_LoadingSpinner.LoadingSpinner, {
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
      case "starting":
      case "running":
        {
          action = source.stop;
          label = "Stop Process";
          icon = "primitive-square";
          break;
        }

      case "stopped":
        {
          action = source.start;
          label = "Start Process";
          icon = "triangle-right";
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
        title: "Creates a Paste from the current contents of the console"
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
  let tooltipTitle = selected ? "Hide " : "Show ";
  let icon;

  switch (severity) {
    case "error":
      tooltipTitle += "Errors";
      icon = "nuclicon-error";
      break;

    case "warning":
      tooltipTitle += "Warnings";
      icon = "nuclicon-warning";
      break;

    case "info":
      tooltipTitle += "Info";
      icon = "info";
      break;

    default:
      ;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVIZWFkZXIuanMiXSwibmFtZXMiOlsiQ29uc29sZUhlYWRlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX2ZpbHRlckNvbXBvbmVudCIsImZvY3VzRmlsdGVyIiwiZm9jdXMiLCJfaGFuZGxlQ2xlYXJCdXR0b25DbGljayIsImV2ZW50IiwicHJvcHMiLCJjbGVhciIsIl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrIiwiY3JlYXRlUGFzdGUiLCJfaGFuZGxlRmlsdGVyQ2hhbmdlIiwidmFsdWUiLCJvbkZpbHRlckNoYW5nZSIsIl9yZW5kZXJPcHRpb24iLCJvcHRpb25Qcm9wcyIsIm9wdGlvbiIsInNvdXJjZSIsInNvdXJjZXMiLCJmaW5kIiwicyIsImlkIiwic3RhcnRpbmdTcGlubmVyIiwic3RhdHVzIiwibGFiZWwiLCJfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24iLCJhY3Rpb24iLCJpY29uIiwic3RvcCIsInN0YXJ0IiwiY2xpY2tIYW5kbGVyIiwic3RvcFByb3BhZ2F0aW9uIiwicmVuZGVyIiwib3B0aW9ucyIsInNsaWNlIiwic29ydCIsImEiLCJiIiwic29ydEFscGhhIiwibmFtZSIsIm1hcCIsInNvdXJjZUJ1dHRvbiIsImxlbmd0aCIsIk11bHRpU2VsZWN0TGFiZWwiLCJCdXR0b25TaXplcyIsIlNNQUxMIiwic2VsZWN0ZWRTb3VyY2VJZHMiLCJvblNlbGVjdGVkU291cmNlc0NoYW5nZSIsInBhc3RlQnV0dG9uIiwidGl0bGUiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJ0b2dnbGVTZXZlcml0eSIsImNvbXBvbmVudCIsInRleHQiLCJmaWx0ZXJUZXh0IiwiaXNSZWdFeHAiLCJlbmFibGVSZWdFeHBGaWx0ZXIiLCJpbnZhbGlkIiwiaW52YWxpZEZpbHRlcklucHV0IiwiYUxvd2VyIiwidG9Mb3dlckNhc2UiLCJiTG93ZXIiLCJzZWxlY3RlZE9wdGlvbnMiLCJGaWx0ZXJCdXR0b24iLCJzZXZlcml0eSIsInNlbGVjdGVkIiwiaGFz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QUssU0FBTDtBQUNFd0MsTUFBQUEsWUFBWSxJQUFJLFVBQWhCO0FBQ0F4QyxNQUFBQSxJQUFJLEdBQUcsa0JBQVA7QUFDQTs7QUFDRixTQUFLLE1BQUw7QUFDRXdDLE1BQUFBLFlBQVksSUFBSSxNQUFoQjtBQUNBeEMsTUFBQUEsSUFBSSxHQUFHLE1BQVA7QUFDQTs7QUFDRjtBQUNFO0FBQUVxQyxNQUFBQSxRQUFEO0FBQ0QsWUFBTSxJQUFJSSxLQUFKLENBQVcscUJBQW9CSixRQUFTLEVBQXhDLENBQU47QUFmSjs7QUFrQkEsc0JBQ0Usb0JBQUMsY0FBRDtBQUNFLElBQUEsSUFBSSxFQUFFckMsSUFEUjtBQUVFLElBQUEsSUFBSSxFQUFFaUIsb0JBQVlDLEtBRnBCO0FBR0UsSUFBQSxRQUFRLEVBQUV0QyxLQUFLLENBQUMyQyxrQkFBTixDQUF5QmdCLEdBQXpCLENBQTZCRixRQUE3QixDQUhaO0FBSUUsSUFBQSxPQUFPLEVBQUUsTUFBTTtBQUNiekQsTUFBQUEsS0FBSyxDQUFDNEMsY0FBTixDQUFxQmEsUUFBckI7QUFDRCxLQU5IO0FBT0UsSUFBQSxPQUFPLEVBQUU7QUFBRWYsTUFBQUEsS0FBSyxFQUFFa0I7QUFBVDtBQVBYLElBREY7QUFXRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU291cmNlLCBTZXZlcml0eSB9IGZyb20gXCIuLi90eXBlc1wiXHJcbmltcG9ydCB0eXBlIHsgUmVnRXhwRmlsdGVyQ2hhbmdlIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlclwiXHJcblxyXG5pbXBvcnQgeyBCdXR0b25Hcm91cCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9CdXR0b25Hcm91cFwiXHJcbmltcG9ydCB7IExvYWRpbmdTcGlubmVyIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0xvYWRpbmdTcGlubmVyXCJcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCJcclxuaW1wb3J0IHsgTW9kYWxNdWx0aVNlbGVjdCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Nb2RhbE11bHRpU2VsZWN0XCJcclxuaW1wb3J0IFJlZ0V4cEZpbHRlciBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvUmVnRXhwRmlsdGVyXCJcclxuaW1wb3J0IHsgVG9vbGJhciB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Ub29sYmFyXCJcclxuaW1wb3J0IHsgVG9vbGJhckxlZnQgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhckxlZnRcIlxyXG5pbXBvcnQgeyBUb29sYmFyUmlnaHQgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhclJpZ2h0XCJcclxuaW1wb3J0IGFkZFRvb2x0aXAgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2FkZFRvb2x0aXBcIlxyXG5cclxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25TaXplcyB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9CdXR0b25cIlxyXG5pbXBvcnQgaW52YXJpYW50IGZyb20gXCJhc3NlcnRcIlxyXG5cclxudHlwZSBQcm9wcyA9IHtcclxuICBjbGVhcjogKCkgPT4gdm9pZCxcclxuICBjcmVhdGVQYXN0ZTogPygpID0+IFByb21pc2U8dm9pZD4sXHJcbiAgaW52YWxpZEZpbHRlcklucHV0OiBib29sZWFuLFxyXG4gIGVuYWJsZVJlZ0V4cEZpbHRlcjogYm9vbGVhbixcclxuICBvbkZpbHRlckNoYW5nZTogKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKSA9PiB2b2lkLFxyXG4gIHNlbGVjdGVkU291cmNlSWRzOiBBcnJheTxzdHJpbmc+LFxyXG4gIHNvdXJjZXM6IEFycmF5PFNvdXJjZT4sXHJcbiAgb25TZWxlY3RlZFNvdXJjZXNDaGFuZ2U6IChzb3VyY2VJZHM6IEFycmF5PHN0cmluZz4pID0+IHZvaWQsXHJcbiAgZmlsdGVyVGV4dDogc3RyaW5nLFxyXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcclxuICB0b2dnbGVTZXZlcml0eTogKHNldmVyaXR5OiBTZXZlcml0eSkgPT4gdm9pZCxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZUhlYWRlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xyXG4gIF9maWx0ZXJDb21wb25lbnQ6ID9SZWdFeHBGaWx0ZXJcclxuXHJcbiAgZm9jdXNGaWx0ZXIgPSAoKTogdm9pZCA9PiB7XHJcbiAgICBpZiAodGhpcy5fZmlsdGVyQ29tcG9uZW50ICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5fZmlsdGVyQ29tcG9uZW50LmZvY3VzKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVDbGVhckJ1dHRvbkNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcclxuICAgIHRoaXMucHJvcHMuY2xlYXIoKVxyXG4gIH1cclxuXHJcbiAgX2hhbmRsZUNyZWF0ZVBhc3RlQnV0dG9uQ2xpY2sgPSAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQ8Pik6IHZvaWQgPT4ge1xyXG4gICAgaWYgKHRoaXMucHJvcHMuY3JlYXRlUGFzdGUgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVGaWx0ZXJDaGFuZ2UgPSAodmFsdWU6IFJlZ0V4cEZpbHRlckNoYW5nZSk6IHZvaWQgPT4ge1xyXG4gICAgdGhpcy5wcm9wcy5vbkZpbHRlckNoYW5nZSh2YWx1ZSlcclxuICB9XHJcblxyXG4gIF9yZW5kZXJQcm9jZXNzQ29udHJvbEJ1dHRvbihzb3VyY2U6IFNvdXJjZSk6ID9SZWFjdC5FbGVtZW50PGFueT4ge1xyXG4gICAgbGV0IGFjdGlvblxyXG4gICAgbGV0IGxhYmVsXHJcbiAgICBsZXQgaWNvblxyXG4gICAgc3dpdGNoIChzb3VyY2Uuc3RhdHVzKSB7XHJcbiAgICAgIGNhc2UgXCJzdGFydGluZ1wiOlxyXG4gICAgICBjYXNlIFwicnVubmluZ1wiOiB7XHJcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0b3BcclxuICAgICAgICBsYWJlbCA9IFwiU3RvcCBQcm9jZXNzXCJcclxuICAgICAgICBpY29uID0gXCJwcmltaXRpdmUtc3F1YXJlXCJcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgXCJzdG9wcGVkXCI6IHtcclxuICAgICAgICBhY3Rpb24gPSBzb3VyY2Uuc3RhcnRcclxuICAgICAgICBsYWJlbCA9IFwiU3RhcnQgUHJvY2Vzc1wiXHJcbiAgICAgICAgaWNvbiA9IFwidHJpYW5nbGUtcmlnaHRcIlxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChhY3Rpb24gPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGNvbnN0IGNsaWNrSGFuZGxlciA9IChldmVudCkgPT4ge1xyXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICBpbnZhcmlhbnQoYWN0aW9uICE9IG51bGwpXHJcbiAgICAgIGFjdGlvbigpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8QnV0dG9uIGNsYXNzTmFtZT1cInB1bGwtcmlnaHQgY29uc29sZS1wcm9jZXNzLWNvbnRyb2wtYnV0dG9uXCIgaWNvbj17aWNvbn0gb25DbGljaz17Y2xpY2tIYW5kbGVyfT5cclxuICAgICAgICB7bGFiZWx9XHJcbiAgICAgIDwvQnV0dG9uPlxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgX3JlbmRlck9wdGlvbiA9IChvcHRpb25Qcm9wczogeyBvcHRpb246IHsgbGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9IH0pOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xyXG4gICAgY29uc3QgeyBvcHRpb24gfSA9IG9wdGlvblByb3BzXHJcbiAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnByb3BzLnNvdXJjZXMuZmluZCgocykgPT4gcy5pZCA9PT0gb3B0aW9uLnZhbHVlKVxyXG4gICAgaW52YXJpYW50KHNvdXJjZSAhPSBudWxsKVxyXG4gICAgY29uc3Qgc3RhcnRpbmdTcGlubmVyID1cclxuICAgICAgc291cmNlLnN0YXR1cyAhPT0gXCJzdGFydGluZ1wiID8gbnVsbCA6IChcclxuICAgICAgICA8TG9hZGluZ1NwaW5uZXIgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrIGNvbnNvbGUtcHJvY2Vzcy1zdGFydGluZy1zcGlubmVyXCIgc2l6ZT1cIkVYVFJBX1NNQUxMXCIgLz5cclxuICAgICAgKVxyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHNwYW4+XHJcbiAgICAgICAge29wdGlvbi5sYWJlbH1cclxuICAgICAgICB7c3RhcnRpbmdTcGlubmVyfVxyXG4gICAgICAgIHt0aGlzLl9yZW5kZXJQcm9jZXNzQ29udHJvbEJ1dHRvbihzb3VyY2UpfVxyXG4gICAgICA8L3NwYW4+XHJcbiAgICApXHJcbiAgfVxyXG5cclxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wcm9wcy5zb3VyY2VzXHJcbiAgICAgIC5zbGljZSgpXHJcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBzb3J0QWxwaGEoYS5uYW1lLCBiLm5hbWUpKVxyXG4gICAgICAubWFwKChzb3VyY2UpID0+ICh7XHJcbiAgICAgICAgbGFiZWw6IHNvdXJjZS5uYW1lLFxyXG4gICAgICAgIHZhbHVlOiBzb3VyY2UuaWQsXHJcbiAgICAgIH0pKVxyXG5cclxuICAgIGNvbnN0IHNvdXJjZUJ1dHRvbiA9XHJcbiAgICAgIG9wdGlvbnMubGVuZ3RoID09PSAwID8gbnVsbCA6IChcclxuICAgICAgICA8TW9kYWxNdWx0aVNlbGVjdFxyXG4gICAgICAgICAgbGFiZWxDb21wb25lbnQ9e011bHRpU2VsZWN0TGFiZWx9XHJcbiAgICAgICAgICBvcHRpb25Db21wb25lbnQ9e3RoaXMuX3JlbmRlck9wdGlvbn1cclxuICAgICAgICAgIHNpemU9e0J1dHRvblNpemVzLlNNQUxMfVxyXG4gICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cclxuICAgICAgICAgIHZhbHVlPXt0aGlzLnByb3BzLnNlbGVjdGVkU291cmNlSWRzfVxyXG4gICAgICAgICAgb25DaGFuZ2U9e3RoaXMucHJvcHMub25TZWxlY3RlZFNvdXJjZXNDaGFuZ2V9XHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2tcIlxyXG4gICAgICAgIC8+XHJcbiAgICAgIClcclxuXHJcbiAgICBjb25zdCBwYXN0ZUJ1dHRvbiA9XHJcbiAgICAgIHRoaXMucHJvcHMuY3JlYXRlUGFzdGUgPT0gbnVsbCA/IG51bGwgOiAoXHJcbiAgICAgICAgPEJ1dHRvblxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCJcclxuICAgICAgICAgIHNpemU9e0J1dHRvblNpemVzLlNNQUxMfVxyXG4gICAgICAgICAgb25DbGljaz17dGhpcy5faGFuZGxlQ3JlYXRlUGFzdGVCdXR0b25DbGlja31cclxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2pzeC1zaW1wbGUtY2FsbGJhY2stcmVmc1xyXG4gICAgICAgICAgcmVmPXthZGRUb29sdGlwKHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ3JlYXRlcyBhIFBhc3RlIGZyb20gdGhlIGN1cnJlbnQgY29udGVudHMgb2YgdGhlIGNvbnNvbGVcIixcclxuICAgICAgICAgIH0pfVxyXG4gICAgICAgID5cclxuICAgICAgICAgIENyZWF0ZSBQYXN0ZVxyXG4gICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICApXHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgPFRvb2xiYXIgbG9jYXRpb249XCJ0b3BcIj5cclxuICAgICAgICA8VG9vbGJhckxlZnQ+XHJcbiAgICAgICAgICB7c291cmNlQnV0dG9ufVxyXG4gICAgICAgICAgPEJ1dHRvbkdyb3VwIGNsYXNzTmFtZT1cImlubGluZS1ibG9ja1wiPlxyXG4gICAgICAgICAgICA8RmlsdGVyQnV0dG9uXHJcbiAgICAgICAgICAgICAgc2V2ZXJpdHk9XCJlcnJvclwiXHJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cclxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cclxuICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxyXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwid2FybmluZ1wiXHJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cclxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cclxuICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxyXG4gICAgICAgICAgICAgIHNldmVyaXR5PVwiaW5mb1wiXHJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cclxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cclxuICAgICAgICAgICAgLz5cclxuICAgICAgICAgIDwvQnV0dG9uR3JvdXA+XHJcbiAgICAgICAgICA8UmVnRXhwRmlsdGVyXHJcbiAgICAgICAgICAgIHJlZj17KGNvbXBvbmVudCkgPT4gKHRoaXMuX2ZpbHRlckNvbXBvbmVudCA9IGNvbXBvbmVudCl9XHJcbiAgICAgICAgICAgIHZhbHVlPXt7XHJcbiAgICAgICAgICAgICAgdGV4dDogdGhpcy5wcm9wcy5maWx0ZXJUZXh0LFxyXG4gICAgICAgICAgICAgIGlzUmVnRXhwOiB0aGlzLnByb3BzLmVuYWJsZVJlZ0V4cEZpbHRlcixcclxuICAgICAgICAgICAgICBpbnZhbGlkOiB0aGlzLnByb3BzLmludmFsaWRGaWx0ZXJJbnB1dCxcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX2hhbmRsZUZpbHRlckNoYW5nZX1cclxuICAgICAgICAgIC8+XHJcbiAgICAgICAgPC9Ub29sYmFyTGVmdD5cclxuICAgICAgICA8VG9vbGJhclJpZ2h0PlxyXG4gICAgICAgICAge3Bhc3RlQnV0dG9ufVxyXG4gICAgICAgICAgPEJ1dHRvbiBzaXplPXtCdXR0b25TaXplcy5TTUFMTH0gb25DbGljaz17dGhpcy5faGFuZGxlQ2xlYXJCdXR0b25DbGlja30+XHJcbiAgICAgICAgICAgIENsZWFyXHJcbiAgICAgICAgICA8L0J1dHRvbj5cclxuICAgICAgICA8L1Rvb2xiYXJSaWdodD5cclxuICAgICAgPC9Ub29sYmFyPlxyXG4gICAgKVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc29ydEFscGhhKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcclxuICBjb25zdCBhTG93ZXIgPSBhLnRvTG93ZXJDYXNlKClcclxuICBjb25zdCBiTG93ZXIgPSBiLnRvTG93ZXJDYXNlKClcclxuICBpZiAoYUxvd2VyIDwgYkxvd2VyKSB7XHJcbiAgICByZXR1cm4gLTFcclxuICB9IGVsc2UgaWYgKGFMb3dlciA+IGJMb3dlcikge1xyXG4gICAgcmV0dXJuIDFcclxuICB9XHJcbiAgcmV0dXJuIDBcclxufVxyXG5cclxudHlwZSBMYWJlbFByb3BzID0ge1xyXG4gIHNlbGVjdGVkT3B0aW9uczogQXJyYXk8eyB2YWx1ZTogc3RyaW5nLCBsYWJlbDogc3RyaW5nIH0+LFxyXG59XHJcblxyXG5mdW5jdGlvbiBNdWx0aVNlbGVjdExhYmVsKHByb3BzOiBMYWJlbFByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcclxuICBjb25zdCB7IHNlbGVjdGVkT3B0aW9ucyB9ID0gcHJvcHNcclxuICBjb25zdCBsYWJlbCA9IHNlbGVjdGVkT3B0aW9ucy5sZW5ndGggPT09IDEgPyBzZWxlY3RlZE9wdGlvbnNbMF0ubGFiZWwgOiBgJHtzZWxlY3RlZE9wdGlvbnMubGVuZ3RofSBTb3VyY2VzYFxyXG4gIHJldHVybiA8c3Bhbj5TaG93aW5nOiB7bGFiZWx9PC9zcGFuPlxyXG59XHJcblxyXG50eXBlIEZpbHRlckJ1dHRvblByb3BzID0ge1xyXG4gIHNldmVyaXR5OiBcImVycm9yXCIgfCBcIndhcm5pbmdcIiB8IFwiaW5mb1wiLFxyXG4gIHNlbGVjdGVkU2V2ZXJpdGllczogU2V0PFNldmVyaXR5PixcclxuICB0b2dnbGVTZXZlcml0eTogKFNldmVyaXR5KSA9PiB2b2lkLFxyXG59XHJcblxyXG5mdW5jdGlvbiBGaWx0ZXJCdXR0b24ocHJvcHM6IEZpbHRlckJ1dHRvblByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcclxuICBjb25zdCB7IHNldmVyaXR5IH0gPSBwcm9wc1xyXG4gIGNvbnN0IHNlbGVjdGVkID0gcHJvcHMuc2VsZWN0ZWRTZXZlcml0aWVzLmhhcyhwcm9wcy5zZXZlcml0eSlcclxuICBsZXQgdG9vbHRpcFRpdGxlID0gc2VsZWN0ZWQgPyBcIkhpZGUgXCIgOiBcIlNob3cgXCJcclxuICBsZXQgaWNvblxyXG4gIHN3aXRjaCAoc2V2ZXJpdHkpIHtcclxuICAgIGNhc2UgXCJlcnJvclwiOlxyXG4gICAgICB0b29sdGlwVGl0bGUgKz0gXCJFcnJvcnNcIlxyXG4gICAgICBpY29uID0gXCJudWNsaWNvbi1lcnJvclwiXHJcbiAgICAgIGJyZWFrXHJcbiAgICBjYXNlIFwid2FybmluZ1wiOlxyXG4gICAgICB0b29sdGlwVGl0bGUgKz0gXCJXYXJuaW5nc1wiXHJcbiAgICAgIGljb24gPSBcIm51Y2xpY29uLXdhcm5pbmdcIlxyXG4gICAgICBicmVha1xyXG4gICAgY2FzZSBcImluZm9cIjpcclxuICAgICAgdG9vbHRpcFRpdGxlICs9IFwiSW5mb1wiXHJcbiAgICAgIGljb24gPSBcImluZm9cIlxyXG4gICAgICBicmVha1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgOyhzZXZlcml0eTogZW1wdHkpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZXZlcml0eTogJHtzZXZlcml0eX1gKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxCdXR0b25cclxuICAgICAgaWNvbj17aWNvbn1cclxuICAgICAgc2l6ZT17QnV0dG9uU2l6ZXMuU01BTEx9XHJcbiAgICAgIHNlbGVjdGVkPXtwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KX1cclxuICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgIHByb3BzLnRvZ2dsZVNldmVyaXR5KHNldmVyaXR5KVxyXG4gICAgICB9fVxyXG4gICAgICB0b29sdGlwPXt7IHRpdGxlOiB0b29sdGlwVGl0bGUgfX1cclxuICAgIC8+XHJcbiAgKVxyXG59XHJcbiJdfQ==