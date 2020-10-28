"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classnames = _interopRequireDefault(require("classnames"));

var React = _interopRequireWildcard(require("react"));

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
class NewMessagesNotification extends React.Component {
  render() {
    const className = (0, _classnames.default)('console-new-messages-notification', 'badge', 'badge-info', {
      visible: this.props.visible
    });
    return /*#__PURE__*/React.createElement("div", {
      className: className,
      onClick: this.props.onClick
    }, /*#__PURE__*/React.createElement("span", {
      className: "console-new-messages-notification-icon icon icon-nuclicon-arrow-down"
    }), "New Messages");
  }

}

exports.default = NewMessagesNotification;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uLmpzIl0sIm5hbWVzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uIiwiUmVhY3QiLCJDb21wb25lbnQiLCJyZW5kZXIiLCJjbGFzc05hbWUiLCJ2aXNpYmxlIiwicHJvcHMiLCJvbkNsaWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7Ozs7Ozs7O0FBYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVVlLE1BQU1BLHVCQUFOLFNBQXNDQyxLQUFLLENBQUNDLFNBQTVDLENBQTZEO0FBQzFFQyxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsU0FBUyxHQUFHLHlCQUNoQixtQ0FEZ0IsRUFFaEIsT0FGZ0IsRUFHaEIsWUFIZ0IsRUFJaEI7QUFDRUMsTUFBQUEsT0FBTyxFQUFFLEtBQUtDLEtBQUwsQ0FBV0Q7QUFEdEIsS0FKZ0IsQ0FBbEI7QUFRQSx3QkFDRTtBQUFLLE1BQUEsU0FBUyxFQUFFRCxTQUFoQjtBQUEyQixNQUFBLE9BQU8sRUFBRSxLQUFLRSxLQUFMLENBQVdDO0FBQS9DLG9CQUNFO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsTUFERixpQkFERjtBQU1EOztBQWhCeUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXHJcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxyXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcclxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXHJcbiAqXHJcbiAqIEBmbG93IHN0cmljdFxyXG4gKiBAZm9ybWF0XHJcbiAqL1xyXG5cclxuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbnR5cGUgUHJvcHMgPSB7XHJcbiAgb25DbGljazogKCkgPT4gbWl4ZWQsXHJcbiAgdmlzaWJsZTogYm9vbGVhbixcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE5ld01lc3NhZ2VzTm90aWZpY2F0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzPiB7XHJcbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xyXG4gICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NuYW1lcyhcclxuICAgICAgJ2NvbnNvbGUtbmV3LW1lc3NhZ2VzLW5vdGlmaWNhdGlvbicsXHJcbiAgICAgICdiYWRnZScsXHJcbiAgICAgICdiYWRnZS1pbmZvJyxcclxuICAgICAge1xyXG4gICAgICAgIHZpc2libGU6IHRoaXMucHJvcHMudmlzaWJsZSxcclxuICAgICAgfSxcclxuICAgICk7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lfSBvbkNsaWNrPXt0aGlzLnByb3BzLm9uQ2xpY2t9PlxyXG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNvbnNvbGUtbmV3LW1lc3NhZ2VzLW5vdGlmaWNhdGlvbi1pY29uIGljb24gaWNvbi1udWNsaWNvbi1hcnJvdy1kb3duXCIgLz5cclxuICAgICAgICBOZXcgTWVzc2FnZXNcclxuICAgICAgPC9kaXY+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG4iXX0=