"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var React = _interopRequireWildcard(require("react"));

var _electron = _interopRequireDefault(require("electron"));

var _electronRemote = require("@atom-ide-community/nuclide-commons/electron-remote");

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
const {
  remote
} = _electron.default;
(0, _assert.default)(remote != null);

class PromptButton extends React.Component {
  constructor(...args) {
    super(...args);
    this._menu = void 0;

    this._handleClick = event => {
      const menu = new remote.Menu(); // TODO: Sort alphabetically by label

      this.props.options.forEach(option => {
        menu.append(new remote.MenuItem({
          type: 'checkbox',
          checked: this.props.value === option.id,
          label: option.label,
          click: () => this.props.onChange(option.id)
        }));
      });
      menu.popup({
        x: event.clientX,
        y: event.clientY,
        async: true
      });
      this._menu = menu;
    };
  }

  componentWillUnmount() {
    if (this._menu != null) {
      this._menu.closePopup();
    }
  }

  render() {
    return /*#__PURE__*/React.createElement("span", {
      className: "console-prompt-wrapper",
      onClick: this._handleClick
    }, /*#__PURE__*/React.createElement("span", {
      className: "console-prompt-label"
    }, this.props.children), /*#__PURE__*/React.createElement("span", {
      className: "icon icon-chevron-right"
    }));
  }

}

exports.default = PromptButton;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlByb21wdEJ1dHRvbi5qcyJdLCJuYW1lcyI6WyJyZW1vdGUiLCJlbGVjdHJvbiIsIlByb21wdEJ1dHRvbiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX21lbnUiLCJfaGFuZGxlQ2xpY2siLCJldmVudCIsIm1lbnUiLCJNZW51IiwicHJvcHMiLCJvcHRpb25zIiwiZm9yRWFjaCIsIm9wdGlvbiIsImFwcGVuZCIsIk1lbnVJdGVtIiwidHlwZSIsImNoZWNrZWQiLCJ2YWx1ZSIsImlkIiwibGFiZWwiLCJjbGljayIsIm9uQ2hhbmdlIiwicG9wdXAiLCJ4IiwiY2xpZW50WCIsInkiLCJjbGllbnRZIiwiYXN5bmMiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsb3NlUG9wdXAiLCJyZW5kZXIiLCJjaGlsZHJlbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVlBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQWZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFPQSxNQUFNO0FBQUNBLEVBQUFBO0FBQUQsSUFBV0MsaUJBQWpCO0FBQ0EscUJBQVVELE1BQU0sSUFBSSxJQUFwQjs7QUFjZSxNQUFNRSxZQUFOLFNBQTJCQyxLQUFLLENBQUNDLFNBQWpDLENBQWtEO0FBQUE7QUFBQTtBQUFBLFNBQy9EQyxLQUQrRDs7QUFBQSxTQWtCL0RDLFlBbEIrRCxHQWtCL0NDLEtBQUQsSUFBd0M7QUFDckQsWUFBTUMsSUFBSSxHQUFHLElBQUlSLE1BQU0sQ0FBQ1MsSUFBWCxFQUFiLENBRHFELENBRXJEOztBQUNBLFdBQUtDLEtBQUwsQ0FBV0MsT0FBWCxDQUFtQkMsT0FBbkIsQ0FBMkJDLE1BQU0sSUFBSTtBQUNuQ0wsUUFBQUEsSUFBSSxDQUFDTSxNQUFMLENBQ0UsSUFBSWQsTUFBTSxDQUFDZSxRQUFYLENBQW9CO0FBQ2xCQyxVQUFBQSxJQUFJLEVBQUUsVUFEWTtBQUVsQkMsVUFBQUEsT0FBTyxFQUFFLEtBQUtQLEtBQUwsQ0FBV1EsS0FBWCxLQUFxQkwsTUFBTSxDQUFDTSxFQUZuQjtBQUdsQkMsVUFBQUEsS0FBSyxFQUFFUCxNQUFNLENBQUNPLEtBSEk7QUFJbEJDLFVBQUFBLEtBQUssRUFBRSxNQUFNLEtBQUtYLEtBQUwsQ0FBV1ksUUFBWCxDQUFvQlQsTUFBTSxDQUFDTSxFQUEzQjtBQUpLLFNBQXBCLENBREY7QUFRRCxPQVREO0FBVUFYLE1BQUFBLElBQUksQ0FBQ2UsS0FBTCxDQUFXO0FBQUNDLFFBQUFBLENBQUMsRUFBRWpCLEtBQUssQ0FBQ2tCLE9BQVY7QUFBbUJDLFFBQUFBLENBQUMsRUFBRW5CLEtBQUssQ0FBQ29CLE9BQTVCO0FBQXFDQyxRQUFBQSxLQUFLLEVBQUU7QUFBNUMsT0FBWDtBQUNBLFdBQUt2QixLQUFMLEdBQWFHLElBQWI7QUFDRCxLQWpDOEQ7QUFBQTs7QUFHL0RxQixFQUFBQSxvQkFBb0IsR0FBRztBQUNyQixRQUFJLEtBQUt4QixLQUFMLElBQWMsSUFBbEIsRUFBd0I7QUFDdEIsV0FBS0EsS0FBTCxDQUFXeUIsVUFBWDtBQUNEO0FBQ0Y7O0FBRURDLEVBQUFBLE1BQU0sR0FBZTtBQUNuQix3QkFDRTtBQUFNLE1BQUEsU0FBUyxFQUFDLHdCQUFoQjtBQUF5QyxNQUFBLE9BQU8sRUFBRSxLQUFLekI7QUFBdkQsb0JBQ0U7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUF3QyxLQUFLSSxLQUFMLENBQVdzQixRQUFuRCxDQURGLGVBRUU7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixNQUZGLENBREY7QUFNRDs7QUFoQjhEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxyXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKlxyXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcclxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XHJcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxyXG4gKlxyXG4gKiBAZmxvd1xyXG4gKiBAZm9ybWF0XHJcbiAqL1xyXG5cclxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBlbGVjdHJvbiBmcm9tICdlbGVjdHJvbic7XHJcbmltcG9ydCB7TWVudX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZWxlY3Ryb24tcmVtb3RlJztcclxuXHJcbmNvbnN0IHtyZW1vdGV9ID0gZWxlY3Ryb247XHJcbmludmFyaWFudChyZW1vdGUgIT0gbnVsbCk7XHJcblxyXG50eXBlIFByb21wdE9wdGlvbiA9IHtcclxuICBpZDogc3RyaW5nLFxyXG4gIGxhYmVsOiBzdHJpbmcsXHJcbn07XHJcblxyXG50eXBlIFByb3BzID0ge1xyXG4gIHZhbHVlOiBzdHJpbmcsXHJcbiAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxyXG4gIGNoaWxkcmVuOiA/YW55LFxyXG4gIG9wdGlvbnM6IEFycmF5PFByb21wdE9wdGlvbj4sXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9tcHRCdXR0b24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcclxuICBfbWVudTogP01lbnU7XHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xyXG4gICAgaWYgKHRoaXMuX21lbnUgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLl9tZW51LmNsb3NlUG9wdXAoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNvbnNvbGUtcHJvbXB0LXdyYXBwZXJcIiBvbkNsaWNrPXt0aGlzLl9oYW5kbGVDbGlja30+XHJcbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29uc29sZS1wcm9tcHQtbGFiZWxcIj57dGhpcy5wcm9wcy5jaGlsZHJlbn08L3NwYW4+XHJcbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLWNoZXZyb24tcmlnaHRcIiAvPlxyXG4gICAgICA8L3NwYW4+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgX2hhbmRsZUNsaWNrID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IG1lbnUgPSBuZXcgcmVtb3RlLk1lbnUoKTtcclxuICAgIC8vIFRPRE86IFNvcnQgYWxwaGFiZXRpY2FsbHkgYnkgbGFiZWxcclxuICAgIHRoaXMucHJvcHMub3B0aW9ucy5mb3JFYWNoKG9wdGlvbiA9PiB7XHJcbiAgICAgIG1lbnUuYXBwZW5kKFxyXG4gICAgICAgIG5ldyByZW1vdGUuTWVudUl0ZW0oe1xyXG4gICAgICAgICAgdHlwZTogJ2NoZWNrYm94JyxcclxuICAgICAgICAgIGNoZWNrZWQ6IHRoaXMucHJvcHMudmFsdWUgPT09IG9wdGlvbi5pZCxcclxuICAgICAgICAgIGxhYmVsOiBvcHRpb24ubGFiZWwsXHJcbiAgICAgICAgICBjbGljazogKCkgPT4gdGhpcy5wcm9wcy5vbkNoYW5nZShvcHRpb24uaWQpLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgICBtZW51LnBvcHVwKHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCBhc3luYzogdHJ1ZX0pO1xyXG4gICAgdGhpcy5fbWVudSA9IG1lbnU7XHJcbiAgfTtcclxufVxyXG4iXX0=