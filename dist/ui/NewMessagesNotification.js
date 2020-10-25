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
    const className = (0, _classnames.default)("console-new-messages-notification", "badge", "badge-info", {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uLmpzIl0sIm5hbWVzIjpbIk5ld01lc3NhZ2VzTm90aWZpY2F0aW9uIiwiUmVhY3QiLCJDb21wb25lbnQiLCJyZW5kZXIiLCJjbGFzc05hbWUiLCJ2aXNpYmxlIiwicHJvcHMiLCJvbkNsaWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7O0FBQ0E7Ozs7Ozs7O0FBYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVVlLE1BQU1BLHVCQUFOLFNBQXNDQyxLQUFLLENBQUNDLFNBQTVDLENBQTZEO0FBQzFFQyxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsU0FBUyxHQUFHLHlCQUFXLG1DQUFYLEVBQWdELE9BQWhELEVBQXlELFlBQXpELEVBQXVFO0FBQ3ZGQyxNQUFBQSxPQUFPLEVBQUUsS0FBS0MsS0FBTCxDQUFXRDtBQURtRSxLQUF2RSxDQUFsQjtBQUdBLHdCQUNFO0FBQUssTUFBQSxTQUFTLEVBQUVELFNBQWhCO0FBQTJCLE1BQUEsT0FBTyxFQUFFLEtBQUtFLEtBQUwsQ0FBV0M7QUFBL0Msb0JBQ0U7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixNQURGLGlCQURGO0FBTUQ7O0FBWHlFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93IHN0cmljdFxuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCBjbGFzc25hbWVzIGZyb20gXCJjbGFzc25hbWVzXCJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uQ2xpY2s6ICgpID0+IG1peGVkLFxuICB2aXNpYmxlOiBib29sZWFuLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOZXdNZXNzYWdlc05vdGlmaWNhdGlvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcz4ge1xuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NuYW1lcyhcImNvbnNvbGUtbmV3LW1lc3NhZ2VzLW5vdGlmaWNhdGlvblwiLCBcImJhZGdlXCIsIFwiYmFkZ2UtaW5mb1wiLCB7XG4gICAgICB2aXNpYmxlOiB0aGlzLnByb3BzLnZpc2libGUsXG4gICAgfSlcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gb25DbGljaz17dGhpcy5wcm9wcy5vbkNsaWNrfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY29uc29sZS1uZXctbWVzc2FnZXMtbm90aWZpY2F0aW9uLWljb24gaWNvbiBpY29uLW51Y2xpY29uLWFycm93LWRvd25cIiAvPlxuICAgICAgICBOZXcgTWVzc2FnZXNcbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuIl19