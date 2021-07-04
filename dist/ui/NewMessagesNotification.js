"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classnames = _interopRequireDefault(require("classnames"));

var React = _interopRequireWildcard(require("react"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uLmpzIl0sIm5hbWVzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uIiwiUmVhY3QiLCJDb21wb25lbnQiLCJyZW5kZXIiLCJjbGFzc05hbWUiLCJ2aXNpYmxlIiwicHJvcHMiLCJvbkNsaWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7Ozs7Ozs7O0FBYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVVlLE1BQU1BLHVCQUFOLFNBQXNDQyxLQUFLLENBQUNDLFNBQTVDLENBQTZEO0FBQzFFQyxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsU0FBUyxHQUFHLHlCQUNoQixtQ0FEZ0IsRUFFaEIsT0FGZ0IsRUFHaEIsWUFIZ0IsRUFJaEI7QUFDRUMsTUFBQUEsT0FBTyxFQUFFLEtBQUtDLEtBQUwsQ0FBV0Q7QUFEdEIsS0FKZ0IsQ0FBbEI7QUFRQSx3QkFDRTtBQUFLLE1BQUEsU0FBUyxFQUFFRCxTQUFoQjtBQUEyQixNQUFBLE9BQU8sRUFBRSxLQUFLRSxLQUFMLENBQVdDO0FBQS9DLG9CQUNFO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsTUFERixpQkFERjtBQU1EOztBQWhCeUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQGZsb3cgc3RyaWN0XG4gKiBAZm9ybWF0XG4gKi9cblxuaW1wb3J0IGNsYXNzbmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uQ2xpY2s6ICgpID0+IG1peGVkLFxuICB2aXNpYmxlOiBib29sZWFuLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTmV3TWVzc2FnZXNOb3RpZmljYXRpb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHM+IHtcbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXMoXG4gICAgICAnY29uc29sZS1uZXctbWVzc2FnZXMtbm90aWZpY2F0aW9uJyxcbiAgICAgICdiYWRnZScsXG4gICAgICAnYmFkZ2UtaW5mbycsXG4gICAgICB7XG4gICAgICAgIHZpc2libGU6IHRoaXMucHJvcHMudmlzaWJsZSxcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5vbkNsaWNrfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29uc29sZS1uZXctbWVzc2FnZXMtbm90aWZpY2F0aW9uLWljb24gaWNvbiBpY29uLW51Y2xpY29uLWFycm93LWRvd25cIiAvPlxuICAgICAgICBOZXcgTWVzc2FnZXNcbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cbiJdfQ==