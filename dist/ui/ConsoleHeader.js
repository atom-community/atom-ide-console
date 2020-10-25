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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnNvbGVIZWFkZXIuanMiXSwibmFtZXMiOlsiQ29uc29sZUhlYWRlciIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX2ZpbHRlckNvbXBvbmVudCIsImZvY3VzRmlsdGVyIiwiZm9jdXMiLCJfaGFuZGxlQ2xlYXJCdXR0b25DbGljayIsImV2ZW50IiwicHJvcHMiLCJjbGVhciIsIl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrIiwiY3JlYXRlUGFzdGUiLCJfaGFuZGxlRmlsdGVyQ2hhbmdlIiwidmFsdWUiLCJvbkZpbHRlckNoYW5nZSIsIl9yZW5kZXJPcHRpb24iLCJvcHRpb25Qcm9wcyIsIm9wdGlvbiIsInNvdXJjZSIsInNvdXJjZXMiLCJmaW5kIiwicyIsImlkIiwic3RhcnRpbmdTcGlubmVyIiwic3RhdHVzIiwibGFiZWwiLCJfcmVuZGVyUHJvY2Vzc0NvbnRyb2xCdXR0b24iLCJhY3Rpb24iLCJpY29uIiwic3RvcCIsInN0YXJ0IiwiY2xpY2tIYW5kbGVyIiwic3RvcFByb3BhZ2F0aW9uIiwicmVuZGVyIiwib3B0aW9ucyIsInNsaWNlIiwic29ydCIsImEiLCJiIiwic29ydEFscGhhIiwibmFtZSIsIm1hcCIsInNvdXJjZUJ1dHRvbiIsImxlbmd0aCIsIk11bHRpU2VsZWN0TGFiZWwiLCJCdXR0b25TaXplcyIsIlNNQUxMIiwic2VsZWN0ZWRTb3VyY2VJZHMiLCJvblNlbGVjdGVkU291cmNlc0NoYW5nZSIsInBhc3RlQnV0dG9uIiwidGl0bGUiLCJzZWxlY3RlZFNldmVyaXRpZXMiLCJ0b2dnbGVTZXZlcml0eSIsImNvbXBvbmVudCIsInRleHQiLCJmaWx0ZXJUZXh0IiwiaXNSZWdFeHAiLCJlbmFibGVSZWdFeHBGaWx0ZXIiLCJpbnZhbGlkIiwiaW52YWxpZEZpbHRlcklucHV0IiwiYUxvd2VyIiwidG9Mb3dlckNhc2UiLCJiTG93ZXIiLCJzZWxlY3RlZE9wdGlvbnMiLCJGaWx0ZXJCdXR0b24iLCJzZXZlcml0eSIsInNlbGVjdGVkIiwiaGFz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QUssU0FBTDtBQUNFd0MsTUFBQUEsWUFBWSxJQUFJLFVBQWhCO0FBQ0F4QyxNQUFBQSxJQUFJLEdBQUcsa0JBQVA7QUFDQTs7QUFDRixTQUFLLE1BQUw7QUFDRXdDLE1BQUFBLFlBQVksSUFBSSxNQUFoQjtBQUNBeEMsTUFBQUEsSUFBSSxHQUFHLE1BQVA7QUFDQTs7QUFDRjtBQUNFO0FBQUVxQyxNQUFBQSxRQUFEO0FBQ0QsWUFBTSxJQUFJSSxLQUFKLENBQVcscUJBQW9CSixRQUFTLEVBQXhDLENBQU47QUFmSjs7QUFrQkEsc0JBQ0Usb0JBQUMsY0FBRDtBQUNFLElBQUEsSUFBSSxFQUFFckMsSUFEUjtBQUVFLElBQUEsSUFBSSxFQUFFaUIsb0JBQVlDLEtBRnBCO0FBR0UsSUFBQSxRQUFRLEVBQUV0QyxLQUFLLENBQUMyQyxrQkFBTixDQUF5QmdCLEdBQXpCLENBQTZCRixRQUE3QixDQUhaO0FBSUUsSUFBQSxPQUFPLEVBQUUsTUFBTTtBQUNiekQsTUFBQUEsS0FBSyxDQUFDNEMsY0FBTixDQUFxQmEsUUFBckI7QUFDRCxLQU5IO0FBT0UsSUFBQSxPQUFPLEVBQUU7QUFBRWYsTUFBQUEsS0FBSyxFQUFFa0I7QUFBVDtBQVBYLElBREY7QUFXRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU291cmNlLCBTZXZlcml0eSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgdHlwZSB7IFJlZ0V4cEZpbHRlckNoYW5nZSB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9SZWdFeHBGaWx0ZXJcIlxuXG5pbXBvcnQgeyBCdXR0b25Hcm91cCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9CdXR0b25Hcm91cFwiXG5pbXBvcnQgeyBMb2FkaW5nU3Bpbm5lciB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Mb2FkaW5nU3Bpbm5lclwiXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IHsgTW9kYWxNdWx0aVNlbGVjdCB9IGZyb20gXCJAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Nb2RhbE11bHRpU2VsZWN0XCJcbmltcG9ydCBSZWdFeHBGaWx0ZXIgZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1JlZ0V4cEZpbHRlclwiXG5pbXBvcnQgeyBUb29sYmFyIH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1Rvb2xiYXJcIlxuaW1wb3J0IHsgVG9vbGJhckxlZnQgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVG9vbGJhckxlZnRcIlxuaW1wb3J0IHsgVG9vbGJhclJpZ2h0IH0gZnJvbSBcIkBhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1Rvb2xiYXJSaWdodFwiXG5pbXBvcnQgYWRkVG9vbHRpcCBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvYWRkVG9vbHRpcFwiXG5cbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uU2l6ZXMgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQnV0dG9uXCJcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSBcImFzc2VydFwiXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGNsZWFyOiAoKSA9PiB2b2lkLFxuICBjcmVhdGVQYXN0ZTogPygpID0+IFByb21pc2U8dm9pZD4sXG4gIGludmFsaWRGaWx0ZXJJbnB1dDogYm9vbGVhbixcbiAgZW5hYmxlUmVnRXhwRmlsdGVyOiBib29sZWFuLFxuICBvbkZpbHRlckNoYW5nZTogKGNoYW5nZTogUmVnRXhwRmlsdGVyQ2hhbmdlKSA9PiB2b2lkLFxuICBzZWxlY3RlZFNvdXJjZUlkczogQXJyYXk8c3RyaW5nPixcbiAgc291cmNlczogQXJyYXk8U291cmNlPixcbiAgb25TZWxlY3RlZFNvdXJjZXNDaGFuZ2U6IChzb3VyY2VJZHM6IEFycmF5PHN0cmluZz4pID0+IHZvaWQsXG4gIGZpbHRlclRleHQ6IHN0cmluZyxcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxuICB0b2dnbGVTZXZlcml0eTogKHNldmVyaXR5OiBTZXZlcml0eSkgPT4gdm9pZCxcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uc29sZUhlYWRlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBfZmlsdGVyQ29tcG9uZW50OiA/UmVnRXhwRmlsdGVyXG5cbiAgZm9jdXNGaWx0ZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKHRoaXMuX2ZpbHRlckNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9maWx0ZXJDb21wb25lbnQuZm9jdXMoKVxuICAgIH1cbiAgfVxuXG4gIF9oYW5kbGVDbGVhckJ1dHRvbkNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcbiAgICB0aGlzLnByb3BzLmNsZWFyKClcbiAgfVxuXG4gIF9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5wcm9wcy5jcmVhdGVQYXN0ZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlKClcbiAgICB9XG4gIH1cblxuICBfaGFuZGxlRmlsdGVyQ2hhbmdlID0gKHZhbHVlOiBSZWdFeHBGaWx0ZXJDaGFuZ2UpOiB2b2lkID0+IHtcbiAgICB0aGlzLnByb3BzLm9uRmlsdGVyQ2hhbmdlKHZhbHVlKVxuICB9XG5cbiAgX3JlbmRlclByb2Nlc3NDb250cm9sQnV0dG9uKHNvdXJjZTogU291cmNlKTogP1JlYWN0LkVsZW1lbnQ8YW55PiB7XG4gICAgbGV0IGFjdGlvblxuICAgIGxldCBsYWJlbFxuICAgIGxldCBpY29uXG4gICAgc3dpdGNoIChzb3VyY2Uuc3RhdHVzKSB7XG4gICAgICBjYXNlIFwic3RhcnRpbmdcIjpcbiAgICAgIGNhc2UgXCJydW5uaW5nXCI6IHtcbiAgICAgICAgYWN0aW9uID0gc291cmNlLnN0b3BcbiAgICAgICAgbGFiZWwgPSBcIlN0b3AgUHJvY2Vzc1wiXG4gICAgICAgIGljb24gPSBcInByaW1pdGl2ZS1zcXVhcmVcIlxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSBcInN0b3BwZWRcIjoge1xuICAgICAgICBhY3Rpb24gPSBzb3VyY2Uuc3RhcnRcbiAgICAgICAgbGFiZWwgPSBcIlN0YXJ0IFByb2Nlc3NcIlxuICAgICAgICBpY29uID0gXCJ0cmlhbmdsZS1yaWdodFwiXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhY3Rpb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGNsaWNrSGFuZGxlciA9IChldmVudCkgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIGludmFyaWFudChhY3Rpb24gIT0gbnVsbClcbiAgICAgIGFjdGlvbigpXG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8QnV0dG9uIGNsYXNzTmFtZT1cInB1bGwtcmlnaHQgY29uc29sZS1wcm9jZXNzLWNvbnRyb2wtYnV0dG9uXCIgaWNvbj17aWNvbn0gb25DbGljaz17Y2xpY2tIYW5kbGVyfT5cbiAgICAgICAge2xhYmVsfVxuICAgICAgPC9CdXR0b24+XG4gICAgKVxuICB9XG5cbiAgX3JlbmRlck9wdGlvbiA9IChvcHRpb25Qcm9wczogeyBvcHRpb246IHsgbGFiZWw6IHN0cmluZywgdmFsdWU6IHN0cmluZyB9IH0pOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xuICAgIGNvbnN0IHsgb3B0aW9uIH0gPSBvcHRpb25Qcm9wc1xuICAgIGNvbnN0IHNvdXJjZSA9IHRoaXMucHJvcHMuc291cmNlcy5maW5kKChzKSA9PiBzLmlkID09PSBvcHRpb24udmFsdWUpXG4gICAgaW52YXJpYW50KHNvdXJjZSAhPSBudWxsKVxuICAgIGNvbnN0IHN0YXJ0aW5nU3Bpbm5lciA9XG4gICAgICBzb3VyY2Uuc3RhdHVzICE9PSBcInN0YXJ0aW5nXCIgPyBudWxsIDogKFxuICAgICAgICA8TG9hZGluZ1NwaW5uZXIgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrIGNvbnNvbGUtcHJvY2Vzcy1zdGFydGluZy1zcGlubmVyXCIgc2l6ZT1cIkVYVFJBX1NNQUxMXCIgLz5cbiAgICAgIClcbiAgICByZXR1cm4gKFxuICAgICAgPHNwYW4+XG4gICAgICAgIHtvcHRpb24ubGFiZWx9XG4gICAgICAgIHtzdGFydGluZ1NwaW5uZXJ9XG4gICAgICAgIHt0aGlzLl9yZW5kZXJQcm9jZXNzQ29udHJvbEJ1dHRvbihzb3VyY2UpfVxuICAgICAgPC9zcGFuPlxuICAgIClcbiAgfVxuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wcm9wcy5zb3VyY2VzXG4gICAgICAuc2xpY2UoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IHNvcnRBbHBoYShhLm5hbWUsIGIubmFtZSkpXG4gICAgICAubWFwKChzb3VyY2UpID0+ICh7XG4gICAgICAgIGxhYmVsOiBzb3VyY2UubmFtZSxcbiAgICAgICAgdmFsdWU6IHNvdXJjZS5pZCxcbiAgICAgIH0pKVxuXG4gICAgY29uc3Qgc291cmNlQnV0dG9uID1cbiAgICAgIG9wdGlvbnMubGVuZ3RoID09PSAwID8gbnVsbCA6IChcbiAgICAgICAgPE1vZGFsTXVsdGlTZWxlY3RcbiAgICAgICAgICBsYWJlbENvbXBvbmVudD17TXVsdGlTZWxlY3RMYWJlbH1cbiAgICAgICAgICBvcHRpb25Db21wb25lbnQ9e3RoaXMuX3JlbmRlck9wdGlvbn1cbiAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIHZhbHVlPXt0aGlzLnByb3BzLnNlbGVjdGVkU291cmNlSWRzfVxuICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLnByb3BzLm9uU2VsZWN0ZWRTb3VyY2VzQ2hhbmdlfVxuICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1ibG9ja1wiXG4gICAgICAgIC8+XG4gICAgICApXG5cbiAgICBjb25zdCBwYXN0ZUJ1dHRvbiA9XG4gICAgICB0aGlzLnByb3BzLmNyZWF0ZVBhc3RlID09IG51bGwgPyBudWxsIDogKFxuICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrXCJcbiAgICAgICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDcmVhdGVQYXN0ZUJ1dHRvbkNsaWNrfVxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBudWNsaWRlLWludGVybmFsL2pzeC1zaW1wbGUtY2FsbGJhY2stcmVmc1xuICAgICAgICAgIHJlZj17YWRkVG9vbHRpcCh7XG4gICAgICAgICAgICB0aXRsZTogXCJDcmVhdGVzIGEgUGFzdGUgZnJvbSB0aGUgY3VycmVudCBjb250ZW50cyBvZiB0aGUgY29uc29sZVwiLFxuICAgICAgICAgIH0pfVxuICAgICAgICA+XG4gICAgICAgICAgQ3JlYXRlIFBhc3RlXG4gICAgICAgIDwvQnV0dG9uPlxuICAgICAgKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxUb29sYmFyIGxvY2F0aW9uPVwidG9wXCI+XG4gICAgICAgIDxUb29sYmFyTGVmdD5cbiAgICAgICAgICB7c291cmNlQnV0dG9ufVxuICAgICAgICAgIDxCdXR0b25Hcm91cCBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2tcIj5cbiAgICAgICAgICAgIDxGaWx0ZXJCdXR0b25cbiAgICAgICAgICAgICAgc2V2ZXJpdHk9XCJlcnJvclwiXG4gICAgICAgICAgICAgIHNlbGVjdGVkU2V2ZXJpdGllcz17dGhpcy5wcm9wcy5zZWxlY3RlZFNldmVyaXRpZXN9XG4gICAgICAgICAgICAgIHRvZ2dsZVNldmVyaXR5PXt0aGlzLnByb3BzLnRvZ2dsZVNldmVyaXR5fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxGaWx0ZXJCdXR0b25cbiAgICAgICAgICAgICAgc2V2ZXJpdHk9XCJ3YXJuaW5nXCJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRTZXZlcml0aWVzPXt0aGlzLnByb3BzLnNlbGVjdGVkU2V2ZXJpdGllc31cbiAgICAgICAgICAgICAgdG9nZ2xlU2V2ZXJpdHk9e3RoaXMucHJvcHMudG9nZ2xlU2V2ZXJpdHl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPEZpbHRlckJ1dHRvblxuICAgICAgICAgICAgICBzZXZlcml0eT1cImluZm9cIlxuICAgICAgICAgICAgICBzZWxlY3RlZFNldmVyaXRpZXM9e3RoaXMucHJvcHMuc2VsZWN0ZWRTZXZlcml0aWVzfVxuICAgICAgICAgICAgICB0b2dnbGVTZXZlcml0eT17dGhpcy5wcm9wcy50b2dnbGVTZXZlcml0eX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9CdXR0b25Hcm91cD5cbiAgICAgICAgICA8UmVnRXhwRmlsdGVyXG4gICAgICAgICAgICByZWY9eyhjb21wb25lbnQpID0+ICh0aGlzLl9maWx0ZXJDb21wb25lbnQgPSBjb21wb25lbnQpfVxuICAgICAgICAgICAgdmFsdWU9e3tcbiAgICAgICAgICAgICAgdGV4dDogdGhpcy5wcm9wcy5maWx0ZXJUZXh0LFxuICAgICAgICAgICAgICBpc1JlZ0V4cDogdGhpcy5wcm9wcy5lbmFibGVSZWdFeHBGaWx0ZXIsXG4gICAgICAgICAgICAgIGludmFsaWQ6IHRoaXMucHJvcHMuaW52YWxpZEZpbHRlcklucHV0LFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLl9oYW5kbGVGaWx0ZXJDaGFuZ2V9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Ub29sYmFyTGVmdD5cbiAgICAgICAgPFRvb2xiYXJSaWdodD5cbiAgICAgICAgICB7cGFzdGVCdXR0b259XG4gICAgICAgICAgPEJ1dHRvbiBzaXplPXtCdXR0b25TaXplcy5TTUFMTH0gb25DbGljaz17dGhpcy5faGFuZGxlQ2xlYXJCdXR0b25DbGlja30+XG4gICAgICAgICAgICBDbGVhclxuICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICA8L1Rvb2xiYXJSaWdodD5cbiAgICAgIDwvVG9vbGJhcj5cbiAgICApXG4gIH1cbn1cblxuZnVuY3Rpb24gc29ydEFscGhhKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgYUxvd2VyID0gYS50b0xvd2VyQ2FzZSgpXG4gIGNvbnN0IGJMb3dlciA9IGIudG9Mb3dlckNhc2UoKVxuICBpZiAoYUxvd2VyIDwgYkxvd2VyKSB7XG4gICAgcmV0dXJuIC0xXG4gIH0gZWxzZSBpZiAoYUxvd2VyID4gYkxvd2VyKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuICByZXR1cm4gMFxufVxuXG50eXBlIExhYmVsUHJvcHMgPSB7XG4gIHNlbGVjdGVkT3B0aW9uczogQXJyYXk8eyB2YWx1ZTogc3RyaW5nLCBsYWJlbDogc3RyaW5nIH0+LFxufVxuXG5mdW5jdGlvbiBNdWx0aVNlbGVjdExhYmVsKHByb3BzOiBMYWJlbFByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgY29uc3QgeyBzZWxlY3RlZE9wdGlvbnMgfSA9IHByb3BzXG4gIGNvbnN0IGxhYmVsID0gc2VsZWN0ZWRPcHRpb25zLmxlbmd0aCA9PT0gMSA/IHNlbGVjdGVkT3B0aW9uc1swXS5sYWJlbCA6IGAke3NlbGVjdGVkT3B0aW9ucy5sZW5ndGh9IFNvdXJjZXNgXG4gIHJldHVybiA8c3Bhbj5TaG93aW5nOiB7bGFiZWx9PC9zcGFuPlxufVxuXG50eXBlIEZpbHRlckJ1dHRvblByb3BzID0ge1xuICBzZXZlcml0eTogXCJlcnJvclwiIHwgXCJ3YXJuaW5nXCIgfCBcImluZm9cIixcbiAgc2VsZWN0ZWRTZXZlcml0aWVzOiBTZXQ8U2V2ZXJpdHk+LFxuICB0b2dnbGVTZXZlcml0eTogKFNldmVyaXR5KSA9PiB2b2lkLFxufVxuXG5mdW5jdGlvbiBGaWx0ZXJCdXR0b24ocHJvcHM6IEZpbHRlckJ1dHRvblByb3BzKTogUmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgY29uc3QgeyBzZXZlcml0eSB9ID0gcHJvcHNcbiAgY29uc3Qgc2VsZWN0ZWQgPSBwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHByb3BzLnNldmVyaXR5KVxuICBsZXQgdG9vbHRpcFRpdGxlID0gc2VsZWN0ZWQgPyBcIkhpZGUgXCIgOiBcIlNob3cgXCJcbiAgbGV0IGljb25cbiAgc3dpdGNoIChzZXZlcml0eSkge1xuICAgIGNhc2UgXCJlcnJvclwiOlxuICAgICAgdG9vbHRpcFRpdGxlICs9IFwiRXJyb3JzXCJcbiAgICAgIGljb24gPSBcIm51Y2xpY29uLWVycm9yXCJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBcIndhcm5pbmdcIjpcbiAgICAgIHRvb2x0aXBUaXRsZSArPSBcIldhcm5pbmdzXCJcbiAgICAgIGljb24gPSBcIm51Y2xpY29uLXdhcm5pbmdcIlxuICAgICAgYnJlYWtcbiAgICBjYXNlIFwiaW5mb1wiOlxuICAgICAgdG9vbHRpcFRpdGxlICs9IFwiSW5mb1wiXG4gICAgICBpY29uID0gXCJpbmZvXCJcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIDsoc2V2ZXJpdHk6IGVtcHR5KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNldmVyaXR5OiAke3NldmVyaXR5fWApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCdXR0b25cbiAgICAgIGljb249e2ljb259XG4gICAgICBzaXplPXtCdXR0b25TaXplcy5TTUFMTH1cbiAgICAgIHNlbGVjdGVkPXtwcm9wcy5zZWxlY3RlZFNldmVyaXRpZXMuaGFzKHNldmVyaXR5KX1cbiAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgcHJvcHMudG9nZ2xlU2V2ZXJpdHkoc2V2ZXJpdHkpXG4gICAgICB9fVxuICAgICAgdG9vbHRpcD17eyB0aXRsZTogdG9vbHRpcFRpdGxlIH19XG4gICAgLz5cbiAgKVxufVxuIl19