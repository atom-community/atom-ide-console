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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlByb21wdEJ1dHRvbi5qcyJdLCJuYW1lcyI6WyJyZW1vdGUiLCJlbGVjdHJvbiIsIlByb21wdEJ1dHRvbiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX21lbnUiLCJfaGFuZGxlQ2xpY2siLCJldmVudCIsIm1lbnUiLCJNZW51IiwicHJvcHMiLCJvcHRpb25zIiwiZm9yRWFjaCIsIm9wdGlvbiIsImFwcGVuZCIsIk1lbnVJdGVtIiwidHlwZSIsImNoZWNrZWQiLCJ2YWx1ZSIsImlkIiwibGFiZWwiLCJjbGljayIsIm9uQ2hhbmdlIiwicG9wdXAiLCJ4IiwiY2xpZW50WCIsInkiLCJjbGllbnRZIiwiYXN5bmMiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsb3NlUG9wdXAiLCJyZW5kZXIiLCJjaGlsZHJlbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVlBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQWZBOzs7Ozs7Ozs7OztBQWlCQSxNQUFNO0FBQUNBLEVBQUFBO0FBQUQsSUFBV0MsaUJBQWpCO0FBQ0EscUJBQVVELE1BQU0sSUFBSSxJQUFwQjs7QUFjZSxNQUFNRSxZQUFOLFNBQTJCQyxLQUFLLENBQUNDLFNBQWpDLENBQWtEO0FBQUE7QUFBQTtBQUFBLFNBQy9EQyxLQUQrRDs7QUFBQSxTQWtCL0RDLFlBbEIrRCxHQWtCL0NDLEtBQUQsSUFBd0M7QUFDckQsWUFBTUMsSUFBSSxHQUFHLElBQUlSLE1BQU0sQ0FBQ1MsSUFBWCxFQUFiLENBRHFELENBRXJEOztBQUNBLFdBQUtDLEtBQUwsQ0FBV0MsT0FBWCxDQUFtQkMsT0FBbkIsQ0FBMkJDLE1BQU0sSUFBSTtBQUNuQ0wsUUFBQUEsSUFBSSxDQUFDTSxNQUFMLENBQ0UsSUFBSWQsTUFBTSxDQUFDZSxRQUFYLENBQW9CO0FBQ2xCQyxVQUFBQSxJQUFJLEVBQUUsVUFEWTtBQUVsQkMsVUFBQUEsT0FBTyxFQUFFLEtBQUtQLEtBQUwsQ0FBV1EsS0FBWCxLQUFxQkwsTUFBTSxDQUFDTSxFQUZuQjtBQUdsQkMsVUFBQUEsS0FBSyxFQUFFUCxNQUFNLENBQUNPLEtBSEk7QUFJbEJDLFVBQUFBLEtBQUssRUFBRSxNQUFNLEtBQUtYLEtBQUwsQ0FBV1ksUUFBWCxDQUFvQlQsTUFBTSxDQUFDTSxFQUEzQjtBQUpLLFNBQXBCLENBREY7QUFRRCxPQVREO0FBVUFYLE1BQUFBLElBQUksQ0FBQ2UsS0FBTCxDQUFXO0FBQUNDLFFBQUFBLENBQUMsRUFBRWpCLEtBQUssQ0FBQ2tCLE9BQVY7QUFBbUJDLFFBQUFBLENBQUMsRUFBRW5CLEtBQUssQ0FBQ29CLE9BQTVCO0FBQXFDQyxRQUFBQSxLQUFLLEVBQUU7QUFBNUMsT0FBWDtBQUNBLFdBQUt2QixLQUFMLEdBQWFHLElBQWI7QUFDRCxLQWpDOEQ7QUFBQTs7QUFHL0RxQixFQUFBQSxvQkFBb0IsR0FBRztBQUNyQixRQUFJLEtBQUt4QixLQUFMLElBQWMsSUFBbEIsRUFBd0I7QUFDdEIsV0FBS0EsS0FBTCxDQUFXeUIsVUFBWDtBQUNEO0FBQ0Y7O0FBRURDLEVBQUFBLE1BQU0sR0FBZTtBQUNuQix3QkFDRTtBQUFNLE1BQUEsU0FBUyxFQUFDLHdCQUFoQjtBQUF5QyxNQUFBLE9BQU8sRUFBRSxLQUFLekI7QUFBdkQsb0JBQ0U7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUF3QyxLQUFLSSxLQUFMLENBQVdzQixRQUFuRCxDQURGLGVBRUU7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixNQUZGLENBREY7QUFNRDs7QUFoQjhEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGVsZWN0cm9uIGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCB7TWVudX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZWxlY3Ryb24tcmVtb3RlJztcblxuY29uc3Qge3JlbW90ZX0gPSBlbGVjdHJvbjtcbmludmFyaWFudChyZW1vdGUgIT0gbnVsbCk7XG5cbnR5cGUgUHJvbXB0T3B0aW9uID0ge1xuICBpZDogc3RyaW5nLFxuICBsYWJlbDogc3RyaW5nLFxufTtcblxudHlwZSBQcm9wcyA9IHtcbiAgdmFsdWU6IHN0cmluZyxcbiAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjaGlsZHJlbjogP2FueSxcbiAgb3B0aW9uczogQXJyYXk8UHJvbXB0T3B0aW9uPixcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb21wdEJ1dHRvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICBfbWVudTogP01lbnU7XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgaWYgKHRoaXMuX21lbnUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fbWVudS5jbG9zZVBvcHVwKCk7XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25zb2xlLXByb21wdC13cmFwcGVyXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xpY2t9PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25zb2xlLXByb21wdC1sYWJlbFwiPnt0aGlzLnByb3BzLmNoaWxkcmVufTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLWNoZXZyb24tcmlnaHRcIiAvPlxuICAgICAgPC9zcGFuPlxuICAgICk7XG4gIH1cblxuICBfaGFuZGxlQ2xpY2sgPSAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQ8Pik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IG1lbnUgPSBuZXcgcmVtb3RlLk1lbnUoKTtcbiAgICAvLyBUT0RPOiBTb3J0IGFscGhhYmV0aWNhbGx5IGJ5IGxhYmVsXG4gICAgdGhpcy5wcm9wcy5vcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcbiAgICAgIG1lbnUuYXBwZW5kKFxuICAgICAgICBuZXcgcmVtb3RlLk1lbnVJdGVtKHtcbiAgICAgICAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgICAgICAgIGNoZWNrZWQ6IHRoaXMucHJvcHMudmFsdWUgPT09IG9wdGlvbi5pZCxcbiAgICAgICAgICBsYWJlbDogb3B0aW9uLmxhYmVsLFxuICAgICAgICAgIGNsaWNrOiAoKSA9PiB0aGlzLnByb3BzLm9uQ2hhbmdlKG9wdGlvbi5pZCksXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KTtcbiAgICBtZW51LnBvcHVwKHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCBhc3luYzogdHJ1ZX0pO1xuICAgIHRoaXMuX21lbnUgPSBtZW51O1xuICB9O1xufVxuIl19