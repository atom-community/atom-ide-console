"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _assert = _interopRequireDefault(require("assert"));

var React = _interopRequireWildcard(require("react"));

var _electron = _interopRequireDefault(require("electron"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  remote
} = _electron.default; // remote.Menu type

(0, _assert.default)(remote != null);

class PromptButton extends React.Component {
  constructor(...args) {
    super(...args);
    this._menu = void 0;

    this._handleClick = event => {
      const menu = new remote.Menu(); // TODO: Sort alphabetically by label

      this.props.options.forEach(option => {
        menu.append(new remote.MenuItem({
          type: "checkbox",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlByb21wdEJ1dHRvbi5qcyJdLCJuYW1lcyI6WyJyZW1vdGUiLCJlbGVjdHJvbiIsIlByb21wdEJ1dHRvbiIsIlJlYWN0IiwiQ29tcG9uZW50IiwiX21lbnUiLCJfaGFuZGxlQ2xpY2siLCJldmVudCIsIm1lbnUiLCJNZW51IiwicHJvcHMiLCJvcHRpb25zIiwiZm9yRWFjaCIsIm9wdGlvbiIsImFwcGVuZCIsIk1lbnVJdGVtIiwidHlwZSIsImNoZWNrZWQiLCJ2YWx1ZSIsImlkIiwibGFiZWwiLCJjbGljayIsIm9uQ2hhbmdlIiwicG9wdXAiLCJ4IiwiY2xpZW50WCIsInkiLCJjbGllbnRZIiwiYXN5bmMiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsb3NlUG9wdXAiLCJyZW5kZXIiLCJjaGlsZHJlbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7Ozs7OztBQUNBLE1BQU07QUFBRUEsRUFBQUE7QUFBRixJQUFhQyxpQkFBbkIsQyxDQUNBOztBQUVBLHFCQUFVRCxNQUFNLElBQUksSUFBcEI7O0FBY2UsTUFBTUUsWUFBTixTQUEyQkMsS0FBSyxDQUFDQyxTQUFqQyxDQUFrRDtBQUFBO0FBQUE7QUFBQSxTQUMvREMsS0FEK0Q7O0FBQUEsU0FrQi9EQyxZQWxCK0QsR0FrQi9DQyxLQUFELElBQXdDO0FBQ3JELFlBQU1DLElBQUksR0FBRyxJQUFJUixNQUFNLENBQUNTLElBQVgsRUFBYixDQURxRCxDQUVyRDs7QUFDQSxXQUFLQyxLQUFMLENBQVdDLE9BQVgsQ0FBbUJDLE9BQW5CLENBQTRCQyxNQUFELElBQVk7QUFDckNMLFFBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUNFLElBQUlkLE1BQU0sQ0FBQ2UsUUFBWCxDQUFvQjtBQUNsQkMsVUFBQUEsSUFBSSxFQUFFLFVBRFk7QUFFbEJDLFVBQUFBLE9BQU8sRUFBRSxLQUFLUCxLQUFMLENBQVdRLEtBQVgsS0FBcUJMLE1BQU0sQ0FBQ00sRUFGbkI7QUFHbEJDLFVBQUFBLEtBQUssRUFBRVAsTUFBTSxDQUFDTyxLQUhJO0FBSWxCQyxVQUFBQSxLQUFLLEVBQUUsTUFBTSxLQUFLWCxLQUFMLENBQVdZLFFBQVgsQ0FBb0JULE1BQU0sQ0FBQ00sRUFBM0I7QUFKSyxTQUFwQixDQURGO0FBUUQsT0FURDtBQVVBWCxNQUFBQSxJQUFJLENBQUNlLEtBQUwsQ0FBVztBQUFFQyxRQUFBQSxDQUFDLEVBQUVqQixLQUFLLENBQUNrQixPQUFYO0FBQW9CQyxRQUFBQSxDQUFDLEVBQUVuQixLQUFLLENBQUNvQixPQUE3QjtBQUFzQ0MsUUFBQUEsS0FBSyxFQUFFO0FBQTdDLE9BQVg7QUFDQSxXQUFLdkIsS0FBTCxHQUFhRyxJQUFiO0FBQ0QsS0FqQzhEO0FBQUE7O0FBRy9EcUIsRUFBQUEsb0JBQW9CLEdBQUc7QUFDckIsUUFBSSxLQUFLeEIsS0FBTCxJQUFjLElBQWxCLEVBQXdCO0FBQ3RCLFdBQUtBLEtBQUwsQ0FBV3lCLFVBQVg7QUFDRDtBQUNGOztBQUVEQyxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsd0JBQ0U7QUFBTSxNQUFBLFNBQVMsRUFBQyx3QkFBaEI7QUFBeUMsTUFBQSxPQUFPLEVBQUUsS0FBS3pCO0FBQXZELG9CQUNFO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsT0FBd0MsS0FBS0ksS0FBTCxDQUFXc0IsUUFBbkQsQ0FERixlQUVFO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsTUFGRixDQURGO0FBTUQ7O0FBaEI4RCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbnZhcmlhbnQgZnJvbSBcImFzc2VydFwiXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IGVsZWN0cm9uIGZyb20gXCJlbGVjdHJvblwiXG5jb25zdCB7IHJlbW90ZSB9ID0gZWxlY3Ryb25cbi8vIHJlbW90ZS5NZW51IHR5cGVcblxuaW52YXJpYW50KHJlbW90ZSAhPSBudWxsKVxuXG50eXBlIFByb21wdE9wdGlvbiA9IHtcbiAgaWQ6IHN0cmluZyxcbiAgbGFiZWw6IHN0cmluZyxcbn1cblxudHlwZSBQcm9wcyA9IHtcbiAgdmFsdWU6IHN0cmluZyxcbiAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxuICBjaGlsZHJlbjogP2FueSxcbiAgb3B0aW9uczogQXJyYXk8UHJvbXB0T3B0aW9uPixcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvbXB0QnV0dG9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzPiB7XG4gIF9tZW51OiA/TWVudVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIGlmICh0aGlzLl9tZW51ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX21lbnUuY2xvc2VQb3B1cCgpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25zb2xlLXByb21wdC13cmFwcGVyXCIgb25DbGljaz17dGhpcy5faGFuZGxlQ2xpY2t9PlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJjb25zb2xlLXByb21wdC1sYWJlbFwiPnt0aGlzLnByb3BzLmNoaWxkcmVufTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLWNoZXZyb24tcmlnaHRcIiAvPlxuICAgICAgPC9zcGFuPlxuICAgIClcbiAgfVxuXG4gIF9oYW5kbGVDbGljayA9IChldmVudDogU3ludGhldGljTW91c2VFdmVudDw+KTogdm9pZCA9PiB7XG4gICAgY29uc3QgbWVudSA9IG5ldyByZW1vdGUuTWVudSgpXG4gICAgLy8gVE9ETzogU29ydCBhbHBoYWJldGljYWxseSBieSBsYWJlbFxuICAgIHRoaXMucHJvcHMub3B0aW9ucy5mb3JFYWNoKChvcHRpb24pID0+IHtcbiAgICAgIG1lbnUuYXBwZW5kKFxuICAgICAgICBuZXcgcmVtb3RlLk1lbnVJdGVtKHtcbiAgICAgICAgICB0eXBlOiBcImNoZWNrYm94XCIsXG4gICAgICAgICAgY2hlY2tlZDogdGhpcy5wcm9wcy52YWx1ZSA9PT0gb3B0aW9uLmlkLFxuICAgICAgICAgIGxhYmVsOiBvcHRpb24ubGFiZWwsXG4gICAgICAgICAgY2xpY2s6ICgpID0+IHRoaXMucHJvcHMub25DaGFuZ2Uob3B0aW9uLmlkKSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9KVxuICAgIG1lbnUucG9wdXAoeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCBhc3luYzogdHJ1ZSB9KVxuICAgIHRoaXMuX21lbnUgPSBtZW51XG4gIH1cbn1cbiJdfQ==