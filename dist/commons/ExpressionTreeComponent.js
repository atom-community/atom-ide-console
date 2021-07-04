"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExpressionTreeComponent = exports.ExpressionTreeNode = void 0;

var _AtomInput = require("@atom-ide-community/nuclide-commons-ui/AtomInput");

var _Icon = require("@atom-ide-community/nuclide-commons-ui/Icon");

var _analytics = require("@atom-ide-community/nuclide-commons/analytics");

var React = _interopRequireWildcard(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

var _expected = require("@atom-ide-community/nuclide-commons/expected");

var _ignoreTextSelectionEvents = _interopRequireDefault(require("@atom-ide-community/nuclide-commons-ui/ignoreTextSelectionEvents"));

var _assert = _interopRequireDefault(require("assert"));

var _nullthrows = _interopRequireDefault(require("nullthrows"));

var _LoadingSpinner = require("@atom-ide-community/nuclide-commons-ui/LoadingSpinner");

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

var _SimpleValueComponent = _interopRequireWildcard(require("@atom-ide-community/nuclide-commons-ui/SimpleValueComponent"));

var _Tree = require("@atom-ide-community/nuclide-commons-ui/Tree");

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var _ValueComponentClassNames = require("@atom-ide-community/nuclide-commons-ui/ValueComponentClassNames");

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
const EDIT_VALUE_FROM_ICON = 'edit-value-from-icon';
const NOT_AVAILABLE_MESSAGE = '<not available>';
const SPINNER_DELAY = 200;
/* ms */
// This weak map tracks which node path(s) are expanded in a recursive expression
// value tree. These must be tracked outside of the React objects themselves, because
// expansion state is persisted even if the tree is destroyed and recreated (such as when
// stepping in a debugger). The root of each tree has a context, which is based on the
// component that contains the tree (such as a debugger pane, tooltip or console pane).
// When that component is destroyed, the WeakMap will remove the expansion state information
// for the entire tree.

const ExpansionStates = new WeakMap();

class ExpressionTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = void 0;
    this._toggleNodeExpanded = void 0;
    this._disposables = void 0;
    this._subscription = void 0;

    this._isExpandable = () => {
      if (this.props.pending) {
        return false;
      }

      return this.props.expression.hasChildren();
    };

    this._isExpanded = () => {
      if (!this._isExpandable()) {
        return false;
      }

      const {
        expansionCache,
        nodePath
      } = this.props;
      return Boolean(expansionCache.get(nodePath));
    };

    this._setExpanded = expanded => {
      const {
        expansionCache,
        nodePath
      } = this.props;
      expansionCache.set(nodePath, expanded);

      if (expanded) {
        this._fetchChildren();
      } else {
        this._stopFetchingChildren();
      }

      this.setState({
        expanded
      });
    };

    this._stopFetchingChildren = () => {
      if (this._subscription != null) {
        this._subscription.unsubscribe();

        this._subscription = null;
      }
    };

    this._fetchChildren = () => {
      this._stopFetchingChildren();

      if (this._isExpandable()) {
        this._subscription = _rxjsCompatUmdMin.Observable.fromPromise(this.props.expression.getChildren()).catch(error => _rxjsCompatUmdMin.Observable.of([])).map(children => _expected.Expect.value(children)).startWith(_expected.Expect.pending()).subscribe(children => {
          this.setState({
            children
          });
        });
      }
    };

    this._toggleExpand = event => {
      this._setExpanded(!this.state.expanded);

      event.stopPropagation();
    };

    this._renderValueLine = (expression, value) => {
      if (expression == null) {
        return /*#__PURE__*/React.createElement("div", {
          className: "nuclide-ui-expression-tree-value-container native-key-bindings"
        }, value);
      } else {
        return this.props.hideExpressionName ? /*#__PURE__*/React.createElement("div", {
          className: "nuclide-ui-lazy-nested-value-container native-key-bindings"
        }, value) : /*#__PURE__*/React.createElement("div", {
          className: "nuclide-ui-lazy-nested-value-container native-key-bindings"
        }, /*#__PURE__*/React.createElement("span", {
          className: _ValueComponentClassNames.ValueComponentClassNames.identifier
        }, expression), ": ", value);
      }
    };

    this._renderChild = child => {
      const nodePath = this.props.nodePath + '/' + child.name;
      return /*#__PURE__*/React.createElement(_Tree.TreeItem, {
        key: nodePath
      }, /*#__PURE__*/React.createElement(ExpressionTreeNode, {
        expression: child,
        expansionCache: this.props.expansionCache,
        nodePath: nodePath
      }));
    };

    this._isEditable = () => {
      const variable = this._getVariableExpression();

      return variable != null && variable.canSetVariable() && !this.props.readOnly;
    };

    this._updateValue = () => {
      const {
        pendingValue
      } = this.state;
      const variable = (0, _nullthrows.default)(this._getVariableExpression());
      const doEdit = pendingValue != null;

      this._cancelEdit(doEdit);

      if (doEdit) {
        (0, _assert.default)(pendingValue != null);

        const subscription = _rxjsCompatUmdMin.Observable.fromPromise(variable.setVariable(pendingValue)).catch(error => {
          if (error != null && error.message != null) {
            atom.notifications.addError(`Failed to set variable value: ${String(error.message)}`);
          }

          return _rxjsCompatUmdMin.Observable.of(null);
        }).subscribe(() => {
          this._disposables.remove(subscription);

          this.setState({
            pendingSave: false
          });
        });

        this._disposables.add(subscription);
      }
    };

    this._cancelEdit = (pendingSave = false) => {
      const newState = {
        isEditing: false,
        pendingValue: null
      };

      if (pendingSave != null) {
        newState.pendingSave = pendingSave;
      }

      this.setState(newState);
    };

    this._startEdit = () => {
      this.setState({
        isEditing: true,
        pendingValue: null,
        pendingSave: false
      });
    };

    this._getValueAsString = expression => {
      const value = expression.getValue();

      if (value != null && expression.type === 'string') {
        return _SimpleValueComponent.STRING_REGEX.test(value) ? value : `"${value}"`;
      }

      return value || '';
    };

    this._setEditorGrammar = editor => {
      if (editor == null) {
        return;
      }

      const variable = this._getVariableExpression();

      if (variable == null) {
        return;
      }

      if (variable.grammarName != null && variable.grammarName !== '') {
        const grammar = atom.grammars.grammarForScopeName(variable.grammarName);

        if (grammar == null) {
          return;
        }

        editor.getTextEditor().setGrammar(grammar);
      }
    };

    this._renderEditView = expression => {
      return /*#__PURE__*/React.createElement("div", {
        className: "expression-tree-line-control"
      }, /*#__PURE__*/React.createElement(_AtomInput.AtomInput, {
        className: "expression-tree-value-box inline-block",
        size: "sm",
        autofocus: true,
        startSelected: false,
        initialValue: this._getValueAsString(expression),
        onDidChange: pendingValue => {
          this.setState({
            pendingValue: pendingValue.trim()
          });
        },
        onConfirm: this._updateValue,
        onCancel: () => this._cancelEdit(),
        onBlur: () => this._cancelEdit(),
        ref: this._setEditorGrammar
      }), /*#__PURE__*/React.createElement(_Icon.Icon, {
        icon: "check",
        title: "Save changes",
        className: "expression-tree-edit-button-confirm",
        onClick: this._updateValue
      }), /*#__PURE__*/React.createElement(_Icon.Icon, {
        icon: "x",
        title: "Cancel changes",
        className: "expression-tree-edit-button-cancel",
        onClick: this._cancelEdit
      }));
    };

    this._subscription = null;
    this._disposables = new _UniversalDisposable.default();

    this._disposables.add(() => {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    });

    this._toggleNodeExpanded = (0, _ignoreTextSelectionEvents.default)(this._toggleExpand.bind(this));
    this.state = {
      expanded: this._isExpanded(),
      children: _expected.Expect.pending(),
      isEditing: false,
      pendingValue: null,
      pendingSave: false
    };
  }

  componentDidMount() {
    if (this.state.expanded) {
      this._fetchChildren();
    }
  }

  componentWillUnmount() {
    this._disposables.dispose();
  }

  _getVariableExpression() {
    const {
      expression
    } = this.props;
    return expression.canSetVariable == null || expression.setVariable == null ? null : expression;
  }

  _renderEditHoverControls() {
    if (!this._isEditable() || this.state.isEditing) {
      return null;
    }

    return /*#__PURE__*/React.createElement("div", {
      className: "debugger-scopes-view-controls"
    }, /*#__PURE__*/React.createElement(_Icon.Icon, {
      icon: "pencil",
      className: "debugger-scopes-view-edit-control",
      onClick: _ => {
        (0, _analytics.track)(EDIT_VALUE_FROM_ICON);

        this._startEdit();
      }
    }));
  }

  render() {
    const {
      pending,
      expression
    } = this.props;
    const {
      pendingSave
    } = this.state;

    if (pending || pendingSave) {
      // Value not available yet. Show a delayed loading spinner.
      return /*#__PURE__*/React.createElement(_Tree.TreeItem, {
        className: "nuclide-ui-expression-tree-value-spinner"
      }, /*#__PURE__*/React.createElement(_LoadingSpinner.LoadingSpinner, {
        size: "EXTRA_SMALL",
        delay: SPINNER_DELAY
      }));
    }

    const isEditable = this._isEditable();

    if (!this._isExpandable()) {
      // This is a simple value with no children.
      return /*#__PURE__*/React.createElement("div", {
        onDoubleClick: isEditable && !this.state.isEditing ? this._startEdit : () => {},
        className: "expression-tree-line-control"
      }, this.state.isEditing ? this._renderEditView(expression) : /*#__PURE__*/React.createElement("span", {
        className: "native-key-bindings expression-tree-value-box"
      }, /*#__PURE__*/React.createElement(_SimpleValueComponent.default, {
        expression: expression
      })), isEditable ? this._renderEditHoverControls() : null);
    } // A node with a delayed spinner to display if we're expanded, but waiting for
    // children to be fetched.


    const pendingChildrenNode = /*#__PURE__*/React.createElement(ExpressionTreeNode, {
      expression: this.props.expression,
      pending: true,
      expansionCache: this.props.expansionCache,
      nodePath: this.props.nodePath
    }); // If collapsed, render no children. Otherwise either render the pendingChildrenNode
    // if the fetch hasn't completed, or the children if we've got them.

    let children;

    if (!this.state.expanded) {
      children = null;
    } else if (this.state.children.isPending) {
      children = pendingChildrenNode;
    } else if (this.state.children.isError) {
      children = this._renderValueLine('Children', this.state.children.error != null ? this.state.children.error.toString() : NOT_AVAILABLE_MESSAGE);
    } else {
      children = this.state.children.value.map(child => this._renderChild(child));
    }

    return /*#__PURE__*/React.createElement(_Tree.TreeList, {
      showArrows: true,
      className: "nuclide-ui-expression-tree-value-treelist"
    }, /*#__PURE__*/React.createElement(_Tree.NestedTreeItem, {
      collapsed: !this.state.expanded,
      onConfirm: isEditable ? this._startEdit : () => {},
      onSelect: this.state.isEditing ? () => {} : this._toggleNodeExpanded,
      title: this.state.isEditing ? this._renderEditView(expression) : this._renderValueLine(expression.name, expression.getValue())
    }, children));
  }

}

exports.ExpressionTreeNode = ExpressionTreeNode;

class ExpressionTreeComponent extends React.Component {
  constructor(props) {
    super(props);

    this._getExpansionCache = () => {
      let cache = ExpansionStates.get(this.props.containerContext);

      if (cache == null) {
        cache = new Map();
        ExpansionStates.set(this.props.containerContext, cache);
      }

      return cache;
    };
  }

  render() {
    const className = (0, _classnames.default)(this.props.className, {
      'nuclide-ui-expression-tree-value': this.props.className == null
    });
    return /*#__PURE__*/React.createElement("span", {
      className: className,
      tabIndex: -1
    }, /*#__PURE__*/React.createElement(ExpressionTreeNode, {
      expression: this.props.expression,
      pending: this.props.pending,
      nodePath: "root",
      expansionCache: this._getExpansionCache(),
      hideExpressionName: this.props.hideExpressionName,
      readOnly: this.props.readOnly
    }));
  }

}

exports.ExpressionTreeComponent = ExpressionTreeComponent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkV4cHJlc3Npb25UcmVlQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbIkVESVRfVkFMVUVfRlJPTV9JQ09OIiwiTk9UX0FWQUlMQUJMRV9NRVNTQUdFIiwiU1BJTk5FUl9ERUxBWSIsIkV4cGFuc2lvblN0YXRlcyIsIldlYWtNYXAiLCJFeHByZXNzaW9uVHJlZU5vZGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsIl90b2dnbGVOb2RlRXhwYW5kZWQiLCJfZGlzcG9zYWJsZXMiLCJfc3Vic2NyaXB0aW9uIiwiX2lzRXhwYW5kYWJsZSIsInBlbmRpbmciLCJleHByZXNzaW9uIiwiaGFzQ2hpbGRyZW4iLCJfaXNFeHBhbmRlZCIsImV4cGFuc2lvbkNhY2hlIiwibm9kZVBhdGgiLCJCb29sZWFuIiwiZ2V0IiwiX3NldEV4cGFuZGVkIiwiZXhwYW5kZWQiLCJzZXQiLCJfZmV0Y2hDaGlsZHJlbiIsIl9zdG9wRmV0Y2hpbmdDaGlsZHJlbiIsInNldFN0YXRlIiwidW5zdWJzY3JpYmUiLCJPYnNlcnZhYmxlIiwiZnJvbVByb21pc2UiLCJnZXRDaGlsZHJlbiIsImNhdGNoIiwiZXJyb3IiLCJvZiIsIm1hcCIsImNoaWxkcmVuIiwiRXhwZWN0IiwidmFsdWUiLCJzdGFydFdpdGgiLCJzdWJzY3JpYmUiLCJfdG9nZ2xlRXhwYW5kIiwiZXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJfcmVuZGVyVmFsdWVMaW5lIiwiaGlkZUV4cHJlc3Npb25OYW1lIiwiVmFsdWVDb21wb25lbnRDbGFzc05hbWVzIiwiaWRlbnRpZmllciIsIl9yZW5kZXJDaGlsZCIsImNoaWxkIiwibmFtZSIsIl9pc0VkaXRhYmxlIiwidmFyaWFibGUiLCJfZ2V0VmFyaWFibGVFeHByZXNzaW9uIiwiY2FuU2V0VmFyaWFibGUiLCJyZWFkT25seSIsIl91cGRhdGVWYWx1ZSIsInBlbmRpbmdWYWx1ZSIsImRvRWRpdCIsIl9jYW5jZWxFZGl0Iiwic3Vic2NyaXB0aW9uIiwic2V0VmFyaWFibGUiLCJtZXNzYWdlIiwiYXRvbSIsIm5vdGlmaWNhdGlvbnMiLCJhZGRFcnJvciIsIlN0cmluZyIsInJlbW92ZSIsInBlbmRpbmdTYXZlIiwiYWRkIiwibmV3U3RhdGUiLCJpc0VkaXRpbmciLCJfc3RhcnRFZGl0IiwiX2dldFZhbHVlQXNTdHJpbmciLCJnZXRWYWx1ZSIsInR5cGUiLCJTVFJJTkdfUkVHRVgiLCJ0ZXN0IiwiX3NldEVkaXRvckdyYW1tYXIiLCJlZGl0b3IiLCJncmFtbWFyTmFtZSIsImdyYW1tYXIiLCJncmFtbWFycyIsImdyYW1tYXJGb3JTY29wZU5hbWUiLCJnZXRUZXh0RWRpdG9yIiwic2V0R3JhbW1hciIsIl9yZW5kZXJFZGl0VmlldyIsInRyaW0iLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYmluZCIsImNvbXBvbmVudERpZE1vdW50IiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwiX3JlbmRlckVkaXRIb3ZlckNvbnRyb2xzIiwiXyIsInJlbmRlciIsImlzRWRpdGFibGUiLCJwZW5kaW5nQ2hpbGRyZW5Ob2RlIiwiaXNQZW5kaW5nIiwiaXNFcnJvciIsInRvU3RyaW5nIiwiRXhwcmVzc2lvblRyZWVDb21wb25lbnQiLCJfZ2V0RXhwYW5zaW9uQ2FjaGUiLCJjYWNoZSIsImNvbnRhaW5lckNvbnRleHQiLCJNYXAiLCJjbGFzc05hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFlQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUE5QkE7Ozs7Ozs7Ozs7O0FBZ0NBLE1BQU1BLG9CQUFvQixHQUFHLHNCQUE3QjtBQUNBLE1BQU1DLHFCQUFxQixHQUFHLGlCQUE5QjtBQUNBLE1BQU1DLGFBQWEsR0FBRyxHQUF0QjtBQUEyQjtBQUUzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFNQyxlQUFzRCxHQUFHLElBQUlDLE9BQUosRUFBL0Q7O0FBbUJPLE1BQU1DLGtCQUFOLFNBQWlDQyxLQUFLLENBQUNDLFNBQXZDLENBR0w7QUFNQUMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQWlDO0FBQzFDLFVBQU1BLEtBQU47QUFEMEMsU0FMNUNDLEtBSzRDO0FBQUEsU0FKNUNDLG1CQUk0QztBQUFBLFNBSDVDQyxZQUc0QztBQUFBLFNBRjVDQyxhQUU0Qzs7QUFBQSxTQStCNUNDLGFBL0I0QyxHQStCNUIsTUFBZTtBQUM3QixVQUFJLEtBQUtMLEtBQUwsQ0FBV00sT0FBZixFQUF3QjtBQUN0QixlQUFPLEtBQVA7QUFDRDs7QUFDRCxhQUFPLEtBQUtOLEtBQUwsQ0FBV08sVUFBWCxDQUFzQkMsV0FBdEIsRUFBUDtBQUNELEtBcEMyQzs7QUFBQSxTQXNDNUNDLFdBdEM0QyxHQXNDOUIsTUFBZTtBQUMzQixVQUFJLENBQUMsS0FBS0osYUFBTCxFQUFMLEVBQTJCO0FBQ3pCLGVBQU8sS0FBUDtBQUNEOztBQUNELFlBQU07QUFBQ0ssUUFBQUEsY0FBRDtBQUFpQkMsUUFBQUE7QUFBakIsVUFBNkIsS0FBS1gsS0FBeEM7QUFDQSxhQUFPWSxPQUFPLENBQUNGLGNBQWMsQ0FBQ0csR0FBZixDQUFtQkYsUUFBbkIsQ0FBRCxDQUFkO0FBQ0QsS0E1QzJDOztBQUFBLFNBOEM1Q0csWUE5QzRDLEdBOEM1QkMsUUFBRCxJQUF1QjtBQUNwQyxZQUFNO0FBQUNMLFFBQUFBLGNBQUQ7QUFBaUJDLFFBQUFBO0FBQWpCLFVBQTZCLEtBQUtYLEtBQXhDO0FBQ0FVLE1BQUFBLGNBQWMsQ0FBQ00sR0FBZixDQUFtQkwsUUFBbkIsRUFBNkJJLFFBQTdCOztBQUVBLFVBQUlBLFFBQUosRUFBYztBQUNaLGFBQUtFLGNBQUw7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLQyxxQkFBTDtBQUNEOztBQUVELFdBQUtDLFFBQUwsQ0FBYztBQUNaSixRQUFBQTtBQURZLE9BQWQ7QUFHRCxLQTNEMkM7O0FBQUEsU0E2RDVDRyxxQkE3RDRDLEdBNkRwQixNQUFZO0FBQ2xDLFVBQUksS0FBS2QsYUFBTCxJQUFzQixJQUExQixFQUFnQztBQUM5QixhQUFLQSxhQUFMLENBQW1CZ0IsV0FBbkI7O0FBQ0EsYUFBS2hCLGFBQUwsR0FBcUIsSUFBckI7QUFDRDtBQUNGLEtBbEUyQzs7QUFBQSxTQW9FNUNhLGNBcEU0QyxHQW9FM0IsTUFBWTtBQUMzQixXQUFLQyxxQkFBTDs7QUFFQSxVQUFJLEtBQUtiLGFBQUwsRUFBSixFQUEwQjtBQUN4QixhQUFLRCxhQUFMLEdBQXFCaUIsNkJBQVdDLFdBQVgsQ0FDbkIsS0FBS3RCLEtBQUwsQ0FBV08sVUFBWCxDQUFzQmdCLFdBQXRCLEVBRG1CLEVBR2xCQyxLQUhrQixDQUdaQyxLQUFLLElBQUlKLDZCQUFXSyxFQUFYLENBQWMsRUFBZCxDQUhHLEVBSWxCQyxHQUprQixDQUlkQyxRQUFRLElBQUlDLGlCQUFPQyxLQUFQLENBQWVGLFFBQWYsQ0FKRSxFQUtsQkcsU0FMa0IsQ0FLUkYsaUJBQU92QixPQUFQLEVBTFEsRUFNbEIwQixTQU5rQixDQU1SSixRQUFRLElBQUk7QUFDckIsZUFBS1QsUUFBTCxDQUFjO0FBQ1pTLFlBQUFBO0FBRFksV0FBZDtBQUdELFNBVmtCLENBQXJCO0FBV0Q7QUFDRixLQXBGMkM7O0FBQUEsU0FzRjVDSyxhQXRGNEMsR0FzRjNCQyxLQUFELElBQXdDO0FBQ3RELFdBQUtwQixZQUFMLENBQWtCLENBQUMsS0FBS2IsS0FBTCxDQUFXYyxRQUE5Qjs7QUFDQW1CLE1BQUFBLEtBQUssQ0FBQ0MsZUFBTjtBQUNELEtBekYyQzs7QUFBQSxTQTJGNUNDLGdCQTNGNEMsR0EyRnpCLENBQ2pCN0IsVUFEaUIsRUFFakJ1QixLQUZpQixLQUdNO0FBQ3ZCLFVBQUl2QixVQUFVLElBQUksSUFBbEIsRUFBd0I7QUFDdEIsNEJBQ0U7QUFBSyxVQUFBLFNBQVMsRUFBQztBQUFmLFdBQ0d1QixLQURILENBREY7QUFLRCxPQU5ELE1BTU87QUFDTCxlQUFPLEtBQUs5QixLQUFMLENBQVdxQyxrQkFBWCxnQkFDTDtBQUFLLFVBQUEsU0FBUyxFQUFDO0FBQWYsV0FDR1AsS0FESCxDQURLLGdCQUtMO0FBQUssVUFBQSxTQUFTLEVBQUM7QUFBZix3QkFDRTtBQUFNLFVBQUEsU0FBUyxFQUFFUSxtREFBeUJDO0FBQTFDLFdBQ0doQyxVQURILENBREYsUUFJS3VCLEtBSkwsQ0FMRjtBQVlEO0FBQ0YsS0FuSDJDOztBQUFBLFNBcUg1Q1UsWUFySDRDLEdBcUg1QkMsS0FBRCxJQUFvQztBQUNqRCxZQUFNOUIsUUFBUSxHQUFHLEtBQUtYLEtBQUwsQ0FBV1csUUFBWCxHQUFzQixHQUF0QixHQUE0QjhCLEtBQUssQ0FBQ0MsSUFBbkQ7QUFDQSwwQkFDRSxvQkFBQyxjQUFEO0FBQVUsUUFBQSxHQUFHLEVBQUUvQjtBQUFmLHNCQUNFLG9CQUFDLGtCQUFEO0FBQ0UsUUFBQSxVQUFVLEVBQUU4QixLQURkO0FBRUUsUUFBQSxjQUFjLEVBQUUsS0FBS3pDLEtBQUwsQ0FBV1UsY0FGN0I7QUFHRSxRQUFBLFFBQVEsRUFBRUM7QUFIWixRQURGLENBREY7QUFTRCxLQWhJMkM7O0FBQUEsU0EwSTVDZ0MsV0ExSTRDLEdBMEk5QixNQUFlO0FBQzNCLFlBQU1DLFFBQVEsR0FBRyxLQUFLQyxzQkFBTCxFQUFqQjs7QUFDQSxhQUNFRCxRQUFRLElBQUksSUFBWixJQUFvQkEsUUFBUSxDQUFDRSxjQUFULEVBQXBCLElBQWlELENBQUMsS0FBSzlDLEtBQUwsQ0FBVytDLFFBRC9EO0FBR0QsS0EvSTJDOztBQUFBLFNBaUo1Q0MsWUFqSjRDLEdBaUo3QixNQUFZO0FBQ3pCLFlBQU07QUFBQ0MsUUFBQUE7QUFBRCxVQUFpQixLQUFLaEQsS0FBNUI7QUFDQSxZQUFNMkMsUUFBUSxHQUFHLHlCQUFXLEtBQUtDLHNCQUFMLEVBQVgsQ0FBakI7QUFFQSxZQUFNSyxNQUFNLEdBQUdELFlBQVksSUFBSSxJQUEvQjs7QUFDQSxXQUFLRSxXQUFMLENBQWlCRCxNQUFqQjs7QUFFQSxVQUFJQSxNQUFKLEVBQVk7QUFDViw2QkFBVUQsWUFBWSxJQUFJLElBQTFCOztBQUNBLGNBQU1HLFlBQVksR0FBRy9CLDZCQUFXQyxXQUFYLENBQ25Cc0IsUUFBUSxDQUFDUyxXQUFULENBQXFCSixZQUFyQixDQURtQixFQUdsQnpCLEtBSGtCLENBR1pDLEtBQUssSUFBSTtBQUNkLGNBQUlBLEtBQUssSUFBSSxJQUFULElBQWlCQSxLQUFLLENBQUM2QixPQUFOLElBQWlCLElBQXRDLEVBQTRDO0FBQzFDQyxZQUFBQSxJQUFJLENBQUNDLGFBQUwsQ0FBbUJDLFFBQW5CLENBQ0csaUNBQWdDQyxNQUFNLENBQUNqQyxLQUFLLENBQUM2QixPQUFQLENBQWdCLEVBRHpEO0FBR0Q7O0FBQ0QsaUJBQU9qQyw2QkFBV0ssRUFBWCxDQUFjLElBQWQsQ0FBUDtBQUNELFNBVmtCLEVBV2xCTSxTQVhrQixDQVdSLE1BQU07QUFDZixlQUFLN0IsWUFBTCxDQUFrQndELE1BQWxCLENBQXlCUCxZQUF6Qjs7QUFDQSxlQUFLakMsUUFBTCxDQUFjO0FBQ1p5QyxZQUFBQSxXQUFXLEVBQUU7QUFERCxXQUFkO0FBR0QsU0FoQmtCLENBQXJCOztBQWtCQSxhQUFLekQsWUFBTCxDQUFrQjBELEdBQWxCLENBQXNCVCxZQUF0QjtBQUNEO0FBQ0YsS0E5SzJDOztBQUFBLFNBZ0w1Q0QsV0FoTDRDLEdBZ0w5QixDQUFDUyxXQUFxQixHQUFHLEtBQXpCLEtBQXlDO0FBQ3JELFlBQU1FLFFBQWdCLEdBQUc7QUFDdkJDLFFBQUFBLFNBQVMsRUFBRSxLQURZO0FBRXZCZCxRQUFBQSxZQUFZLEVBQUU7QUFGUyxPQUF6Qjs7QUFJQSxVQUFJVyxXQUFXLElBQUksSUFBbkIsRUFBeUI7QUFDdkJFLFFBQUFBLFFBQVEsQ0FBQ0YsV0FBVCxHQUF1QkEsV0FBdkI7QUFDRDs7QUFDRCxXQUFLekMsUUFBTCxDQUFjMkMsUUFBZDtBQUNELEtBekwyQzs7QUFBQSxTQTJMNUNFLFVBM0w0QyxHQTJML0IsTUFBWTtBQUN2QixXQUFLN0MsUUFBTCxDQUFjO0FBQ1o0QyxRQUFBQSxTQUFTLEVBQUUsSUFEQztBQUVaZCxRQUFBQSxZQUFZLEVBQUUsSUFGRjtBQUdaVyxRQUFBQSxXQUFXLEVBQUU7QUFIRCxPQUFkO0FBS0QsS0FqTTJDOztBQUFBLFNBbU01Q0ssaUJBbk00QyxHQW1NdkIxRCxVQUFELElBQXFDO0FBQ3ZELFlBQU11QixLQUFLLEdBQUd2QixVQUFVLENBQUMyRCxRQUFYLEVBQWQ7O0FBQ0EsVUFBSXBDLEtBQUssSUFBSSxJQUFULElBQWlCdkIsVUFBVSxDQUFDNEQsSUFBWCxLQUFvQixRQUF6QyxFQUFtRDtBQUNqRCxlQUFPQyxtQ0FBYUMsSUFBYixDQUFrQnZDLEtBQWxCLElBQTJCQSxLQUEzQixHQUFvQyxJQUFHQSxLQUFNLEdBQXBEO0FBQ0Q7O0FBQ0QsYUFBT0EsS0FBSyxJQUFJLEVBQWhCO0FBQ0QsS0F6TTJDOztBQUFBLFNBMk01Q3dDLGlCQTNNNEMsR0EyTXZCQyxNQUFELElBQThCO0FBQ2hELFVBQUlBLE1BQU0sSUFBSSxJQUFkLEVBQW9CO0FBQ2xCO0FBQ0Q7O0FBRUQsWUFBTTNCLFFBQVEsR0FBRyxLQUFLQyxzQkFBTCxFQUFqQjs7QUFDQSxVQUFJRCxRQUFRLElBQUksSUFBaEIsRUFBc0I7QUFDcEI7QUFDRDs7QUFFRCxVQUFJQSxRQUFRLENBQUM0QixXQUFULElBQXdCLElBQXhCLElBQWdDNUIsUUFBUSxDQUFDNEIsV0FBVCxLQUF5QixFQUE3RCxFQUFpRTtBQUMvRCxjQUFNQyxPQUFPLEdBQUdsQixJQUFJLENBQUNtQixRQUFMLENBQWNDLG1CQUFkLENBQWtDL0IsUUFBUSxDQUFDNEIsV0FBM0MsQ0FBaEI7O0FBQ0EsWUFBSUMsT0FBTyxJQUFJLElBQWYsRUFBcUI7QUFDbkI7QUFDRDs7QUFDREYsUUFBQUEsTUFBTSxDQUFDSyxhQUFQLEdBQXVCQyxVQUF2QixDQUFrQ0osT0FBbEM7QUFDRDtBQUNGLEtBNU4yQzs7QUFBQSxTQThONUNLLGVBOU40QyxHQThOekJ2RSxVQUFELElBQWlEO0FBQ2pFLDBCQUNFO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixzQkFDRSxvQkFBQyxvQkFBRDtBQUNFLFFBQUEsU0FBUyxFQUFDLHdDQURaO0FBRUUsUUFBQSxJQUFJLEVBQUMsSUFGUDtBQUdFLFFBQUEsU0FBUyxFQUFFLElBSGI7QUFJRSxRQUFBLGFBQWEsRUFBRSxLQUpqQjtBQUtFLFFBQUEsWUFBWSxFQUFFLEtBQUswRCxpQkFBTCxDQUF1QjFELFVBQXZCLENBTGhCO0FBTUUsUUFBQSxXQUFXLEVBQUUwQyxZQUFZLElBQUk7QUFDM0IsZUFBSzlCLFFBQUwsQ0FBYztBQUFDOEIsWUFBQUEsWUFBWSxFQUFFQSxZQUFZLENBQUM4QixJQUFiO0FBQWYsV0FBZDtBQUNELFNBUkg7QUFTRSxRQUFBLFNBQVMsRUFBRSxLQUFLL0IsWUFUbEI7QUFVRSxRQUFBLFFBQVEsRUFBRSxNQUFNLEtBQUtHLFdBQUwsRUFWbEI7QUFXRSxRQUFBLE1BQU0sRUFBRSxNQUFNLEtBQUtBLFdBQUwsRUFYaEI7QUFZRSxRQUFBLEdBQUcsRUFBRSxLQUFLbUI7QUFaWixRQURGLGVBZUUsb0JBQUMsVUFBRDtBQUNFLFFBQUEsSUFBSSxFQUFDLE9BRFA7QUFFRSxRQUFBLEtBQUssRUFBQyxjQUZSO0FBR0UsUUFBQSxTQUFTLEVBQUMscUNBSFo7QUFJRSxRQUFBLE9BQU8sRUFBRSxLQUFLdEI7QUFKaEIsUUFmRixlQXFCRSxvQkFBQyxVQUFEO0FBQ0UsUUFBQSxJQUFJLEVBQUMsR0FEUDtBQUVFLFFBQUEsS0FBSyxFQUFDLGdCQUZSO0FBR0UsUUFBQSxTQUFTLEVBQUMsb0NBSFo7QUFJRSxRQUFBLE9BQU8sRUFBRSxLQUFLRztBQUpoQixRQXJCRixDQURGO0FBOEJELEtBN1AyQzs7QUFFMUMsU0FBSy9DLGFBQUwsR0FBcUIsSUFBckI7QUFDQSxTQUFLRCxZQUFMLEdBQW9CLElBQUk2RSw0QkFBSixFQUFwQjs7QUFDQSxTQUFLN0UsWUFBTCxDQUFrQjBELEdBQWxCLENBQXNCLE1BQU07QUFDMUIsVUFBSSxLQUFLekQsYUFBTCxJQUFzQixJQUExQixFQUFnQztBQUM5QixhQUFLQSxhQUFMLENBQW1CZ0IsV0FBbkI7QUFDRDtBQUNGLEtBSkQ7O0FBS0EsU0FBS2xCLG1CQUFMLEdBQTJCLHdDQUN6QixLQUFLK0IsYUFBTCxDQUFtQmdELElBQW5CLENBQXdCLElBQXhCLENBRHlCLENBQTNCO0FBR0EsU0FBS2hGLEtBQUwsR0FBYTtBQUNYYyxNQUFBQSxRQUFRLEVBQUUsS0FBS04sV0FBTCxFQURDO0FBRVhtQixNQUFBQSxRQUFRLEVBQUVDLGlCQUFPdkIsT0FBUCxFQUZDO0FBR1h5RCxNQUFBQSxTQUFTLEVBQUUsS0FIQTtBQUlYZCxNQUFBQSxZQUFZLEVBQUUsSUFKSDtBQUtYVyxNQUFBQSxXQUFXLEVBQUU7QUFMRixLQUFiO0FBT0Q7O0FBRURzQixFQUFBQSxpQkFBaUIsR0FBUztBQUN4QixRQUFJLEtBQUtqRixLQUFMLENBQVdjLFFBQWYsRUFBeUI7QUFDdkIsV0FBS0UsY0FBTDtBQUNEO0FBQ0Y7O0FBRURrRSxFQUFBQSxvQkFBb0IsR0FBUztBQUMzQixTQUFLaEYsWUFBTCxDQUFrQmlGLE9BQWxCO0FBQ0Q7O0FBcUdEdkMsRUFBQUEsc0JBQXNCLEdBQWU7QUFDbkMsVUFBTTtBQUFDdEMsTUFBQUE7QUFBRCxRQUFlLEtBQUtQLEtBQTFCO0FBQ0EsV0FBUU8sVUFBRCxDQUFrQnVDLGNBQWxCLElBQW9DLElBQXBDLElBQ0p2QyxVQUFELENBQWtCOEMsV0FBbEIsSUFBaUMsSUFENUIsR0FFSCxJQUZHLEdBR0Y5QyxVQUhMO0FBSUQ7O0FBdUhEOEUsRUFBQUEsd0JBQXdCLEdBQXdCO0FBQzlDLFFBQUksQ0FBQyxLQUFLMUMsV0FBTCxFQUFELElBQXVCLEtBQUsxQyxLQUFMLENBQVc4RCxTQUF0QyxFQUFpRDtBQUMvQyxhQUFPLElBQVA7QUFDRDs7QUFDRCx3QkFDRTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0Usb0JBQUMsVUFBRDtBQUNFLE1BQUEsSUFBSSxFQUFDLFFBRFA7QUFFRSxNQUFBLFNBQVMsRUFBQyxtQ0FGWjtBQUdFLE1BQUEsT0FBTyxFQUFFdUIsQ0FBQyxJQUFJO0FBQ1osOEJBQU0vRixvQkFBTjs7QUFDQSxhQUFLeUUsVUFBTDtBQUNEO0FBTkgsTUFERixDQURGO0FBWUQ7O0FBRUR1QixFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTTtBQUFDakYsTUFBQUEsT0FBRDtBQUFVQyxNQUFBQTtBQUFWLFFBQXdCLEtBQUtQLEtBQW5DO0FBQ0EsVUFBTTtBQUFDNEQsTUFBQUE7QUFBRCxRQUFnQixLQUFLM0QsS0FBM0I7O0FBQ0EsUUFBSUssT0FBTyxJQUFJc0QsV0FBZixFQUE0QjtBQUMxQjtBQUNBLDBCQUNFLG9CQUFDLGNBQUQ7QUFBVSxRQUFBLFNBQVMsRUFBQztBQUFwQixzQkFDRSxvQkFBQyw4QkFBRDtBQUFnQixRQUFBLElBQUksRUFBQyxhQUFyQjtBQUFtQyxRQUFBLEtBQUssRUFBRW5FO0FBQTFDLFFBREYsQ0FERjtBQUtEOztBQUVELFVBQU0rRixVQUFVLEdBQUcsS0FBSzdDLFdBQUwsRUFBbkI7O0FBQ0EsUUFBSSxDQUFDLEtBQUt0QyxhQUFMLEVBQUwsRUFBMkI7QUFDekI7QUFDQSwwQkFDRTtBQUNFLFFBQUEsYUFBYSxFQUNYbUYsVUFBVSxJQUFJLENBQUMsS0FBS3ZGLEtBQUwsQ0FBVzhELFNBQTFCLEdBQXNDLEtBQUtDLFVBQTNDLEdBQXdELE1BQU0sQ0FBRSxDQUZwRTtBQUlFLFFBQUEsU0FBUyxFQUFDO0FBSlosU0FLRyxLQUFLL0QsS0FBTCxDQUFXOEQsU0FBWCxHQUNDLEtBQUtlLGVBQUwsQ0FBcUJ2RSxVQUFyQixDQURELGdCQUdDO0FBQU0sUUFBQSxTQUFTLEVBQUM7QUFBaEIsc0JBQ0Usb0JBQUMsNkJBQUQ7QUFBc0IsUUFBQSxVQUFVLEVBQUVBO0FBQWxDLFFBREYsQ0FSSixFQVlHaUYsVUFBVSxHQUFHLEtBQUtILHdCQUFMLEVBQUgsR0FBcUMsSUFabEQsQ0FERjtBQWdCRCxLQS9Ca0IsQ0FpQ25CO0FBQ0E7OztBQUNBLFVBQU1JLG1CQUFtQixnQkFDdkIsb0JBQUMsa0JBQUQ7QUFDRSxNQUFBLFVBQVUsRUFBRSxLQUFLekYsS0FBTCxDQUFXTyxVQUR6QjtBQUVFLE1BQUEsT0FBTyxFQUFFLElBRlg7QUFHRSxNQUFBLGNBQWMsRUFBRSxLQUFLUCxLQUFMLENBQVdVLGNBSDdCO0FBSUUsTUFBQSxRQUFRLEVBQUUsS0FBS1YsS0FBTCxDQUFXVztBQUp2QixNQURGLENBbkNtQixDQTRDbkI7QUFDQTs7QUFDQSxRQUFJaUIsUUFBSjs7QUFDQSxRQUFJLENBQUMsS0FBSzNCLEtBQUwsQ0FBV2MsUUFBaEIsRUFBMEI7QUFDeEJhLE1BQUFBLFFBQVEsR0FBRyxJQUFYO0FBQ0QsS0FGRCxNQUVPLElBQUksS0FBSzNCLEtBQUwsQ0FBVzJCLFFBQVgsQ0FBb0I4RCxTQUF4QixFQUFtQztBQUN4QzlELE1BQUFBLFFBQVEsR0FBRzZELG1CQUFYO0FBQ0QsS0FGTSxNQUVBLElBQUksS0FBS3hGLEtBQUwsQ0FBVzJCLFFBQVgsQ0FBb0IrRCxPQUF4QixFQUFpQztBQUN0Qy9ELE1BQUFBLFFBQVEsR0FBRyxLQUFLUSxnQkFBTCxDQUNULFVBRFMsRUFFVCxLQUFLbkMsS0FBTCxDQUFXMkIsUUFBWCxDQUFvQkgsS0FBcEIsSUFBNkIsSUFBN0IsR0FDSSxLQUFLeEIsS0FBTCxDQUFXMkIsUUFBWCxDQUFvQkgsS0FBcEIsQ0FBMEJtRSxRQUExQixFQURKLEdBRUlwRyxxQkFKSyxDQUFYO0FBTUQsS0FQTSxNQU9BO0FBQ0xvQyxNQUFBQSxRQUFRLEdBQUcsS0FBSzNCLEtBQUwsQ0FBVzJCLFFBQVgsQ0FBb0JFLEtBQXBCLENBQTBCSCxHQUExQixDQUE4QmMsS0FBSyxJQUM1QyxLQUFLRCxZQUFMLENBQWtCQyxLQUFsQixDQURTLENBQVg7QUFHRDs7QUFFRCx3QkFDRSxvQkFBQyxjQUFEO0FBQ0UsTUFBQSxVQUFVLEVBQUUsSUFEZDtBQUVFLE1BQUEsU0FBUyxFQUFDO0FBRlosb0JBR0Usb0JBQUMsb0JBQUQ7QUFDRSxNQUFBLFNBQVMsRUFBRSxDQUFDLEtBQUt4QyxLQUFMLENBQVdjLFFBRHpCO0FBRUUsTUFBQSxTQUFTLEVBQUV5RSxVQUFVLEdBQUcsS0FBS3hCLFVBQVIsR0FBcUIsTUFBTSxDQUFFLENBRnBEO0FBR0UsTUFBQSxRQUFRLEVBQUUsS0FBSy9ELEtBQUwsQ0FBVzhELFNBQVgsR0FBdUIsTUFBTSxDQUFFLENBQS9CLEdBQWtDLEtBQUs3RCxtQkFIbkQ7QUFJRSxNQUFBLEtBQUssRUFDSCxLQUFLRCxLQUFMLENBQVc4RCxTQUFYLEdBQ0ksS0FBS2UsZUFBTCxDQUFxQnZFLFVBQXJCLENBREosR0FFSSxLQUFLNkIsZ0JBQUwsQ0FBc0I3QixVQUFVLENBQUNtQyxJQUFqQyxFQUF1Q25DLFVBQVUsQ0FBQzJELFFBQVgsRUFBdkM7QUFQUixPQVNHdEMsUUFUSCxDQUhGLENBREY7QUFpQkQ7O0FBeFdEOzs7O0FBb1hLLE1BQU1pRSx1QkFBTixTQUFzQ2hHLEtBQUssQ0FBQ0MsU0FBNUMsQ0FFTDtBQUNBQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBc0M7QUFDL0MsVUFBTUEsS0FBTjs7QUFEK0MsU0FJakQ4RixrQkFKaUQsR0FJNUIsTUFBNEI7QUFDL0MsVUFBSUMsS0FBSyxHQUFHckcsZUFBZSxDQUFDbUIsR0FBaEIsQ0FBb0IsS0FBS2IsS0FBTCxDQUFXZ0csZ0JBQS9CLENBQVo7O0FBQ0EsVUFBSUQsS0FBSyxJQUFJLElBQWIsRUFBbUI7QUFDakJBLFFBQUFBLEtBQUssR0FBRyxJQUFJRSxHQUFKLEVBQVI7QUFDQXZHLFFBQUFBLGVBQWUsQ0FBQ3NCLEdBQWhCLENBQW9CLEtBQUtoQixLQUFMLENBQVdnRyxnQkFBL0IsRUFBaURELEtBQWpEO0FBQ0Q7O0FBQ0QsYUFBT0EsS0FBUDtBQUNELEtBWGdEO0FBRWhEOztBQVdEUixFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTVcsU0FBUyxHQUFHLHlCQUFXLEtBQUtsRyxLQUFMLENBQVdrRyxTQUF0QixFQUFpQztBQUNqRCwwQ0FBb0MsS0FBS2xHLEtBQUwsQ0FBV2tHLFNBQVgsSUFBd0I7QUFEWCxLQUFqQyxDQUFsQjtBQUdBLHdCQUNFO0FBQU0sTUFBQSxTQUFTLEVBQUVBLFNBQWpCO0FBQTRCLE1BQUEsUUFBUSxFQUFFLENBQUM7QUFBdkMsb0JBQ0Usb0JBQUMsa0JBQUQ7QUFDRSxNQUFBLFVBQVUsRUFBRSxLQUFLbEcsS0FBTCxDQUFXTyxVQUR6QjtBQUVFLE1BQUEsT0FBTyxFQUFFLEtBQUtQLEtBQUwsQ0FBV00sT0FGdEI7QUFHRSxNQUFBLFFBQVEsRUFBQyxNQUhYO0FBSUUsTUFBQSxjQUFjLEVBQUUsS0FBS3dGLGtCQUFMLEVBSmxCO0FBS0UsTUFBQSxrQkFBa0IsRUFBRSxLQUFLOUYsS0FBTCxDQUFXcUMsa0JBTGpDO0FBTUUsTUFBQSxRQUFRLEVBQUUsS0FBS3JDLEtBQUwsQ0FBVytDO0FBTnZCLE1BREYsQ0FERjtBQVlEOztBQTlCRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvd1xuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCB0eXBlIHtJRXhwcmVzc2lvbiwgSVZhcmlhYmxlfSBmcm9tICdhdG9tLWlkZS11aSc7XG5pbXBvcnQgdHlwZSB7RXhwZWN0ZWR9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V4cGVjdGVkJztcblxuaW1wb3J0IHtBdG9tSW5wdXR9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0F0b21JbnB1dCc7XG5pbXBvcnQge0ljb259IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0ljb24nO1xuaW1wb3J0IHt0cmFja30gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvYW5hbHl0aWNzJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IHtFeHBlY3R9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V4cGVjdGVkJztcbmltcG9ydCBpZ25vcmVUZXh0U2VsZWN0aW9uRXZlbnRzIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL2lnbm9yZVRleHRTZWxlY3Rpb25FdmVudHMnO1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IG51bGx0aHJvd3MgZnJvbSAnbnVsbHRocm93cyc7XG5pbXBvcnQge0xvYWRpbmdTcGlubmVyfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9Mb2FkaW5nU3Bpbm5lcic7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5pbXBvcnQgU2ltcGxlVmFsdWVDb21wb25lbnQgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvU2ltcGxlVmFsdWVDb21wb25lbnQnO1xuaW1wb3J0IHtTVFJJTkdfUkVHRVh9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1NpbXBsZVZhbHVlQ29tcG9uZW50JztcbmltcG9ydCB7VHJlZUxpc3QsIFRyZWVJdGVtLCBOZXN0ZWRUcmVlSXRlbX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVHJlZSc7XG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcbmltcG9ydCB7VmFsdWVDb21wb25lbnRDbGFzc05hbWVzfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9WYWx1ZUNvbXBvbmVudENsYXNzTmFtZXMnO1xuXG5jb25zdCBFRElUX1ZBTFVFX0ZST01fSUNPTiA9ICdlZGl0LXZhbHVlLWZyb20taWNvbic7XG5jb25zdCBOT1RfQVZBSUxBQkxFX01FU1NBR0UgPSAnPG5vdCBhdmFpbGFibGU+JztcbmNvbnN0IFNQSU5ORVJfREVMQVkgPSAyMDA7IC8qIG1zICovXG5cbi8vIFRoaXMgd2VhayBtYXAgdHJhY2tzIHdoaWNoIG5vZGUgcGF0aChzKSBhcmUgZXhwYW5kZWQgaW4gYSByZWN1cnNpdmUgZXhwcmVzc2lvblxuLy8gdmFsdWUgdHJlZS4gVGhlc2UgbXVzdCBiZSB0cmFja2VkIG91dHNpZGUgb2YgdGhlIFJlYWN0IG9iamVjdHMgdGhlbXNlbHZlcywgYmVjYXVzZVxuLy8gZXhwYW5zaW9uIHN0YXRlIGlzIHBlcnNpc3RlZCBldmVuIGlmIHRoZSB0cmVlIGlzIGRlc3Ryb3llZCBhbmQgcmVjcmVhdGVkIChzdWNoIGFzIHdoZW5cbi8vIHN0ZXBwaW5nIGluIGEgZGVidWdnZXIpLiBUaGUgcm9vdCBvZiBlYWNoIHRyZWUgaGFzIGEgY29udGV4dCwgd2hpY2ggaXMgYmFzZWQgb24gdGhlXG4vLyBjb21wb25lbnQgdGhhdCBjb250YWlucyB0aGUgdHJlZSAoc3VjaCBhcyBhIGRlYnVnZ2VyIHBhbmUsIHRvb2x0aXAgb3IgY29uc29sZSBwYW5lKS5cbi8vIFdoZW4gdGhhdCBjb21wb25lbnQgaXMgZGVzdHJveWVkLCB0aGUgV2Vha01hcCB3aWxsIHJlbW92ZSB0aGUgZXhwYW5zaW9uIHN0YXRlIGluZm9ybWF0aW9uXG4vLyBmb3IgdGhlIGVudGlyZSB0cmVlLlxuY29uc3QgRXhwYW5zaW9uU3RhdGVzOiBXZWFrTWFwPE9iamVjdCwgTWFwPHN0cmluZywgYm9vbGVhbj4+ID0gbmV3IFdlYWtNYXAoKTtcblxudHlwZSBFeHByZXNzaW9uVHJlZU5vZGVQcm9wcyA9IHt8XG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxuICBwZW5kaW5nPzogYm9vbGVhbixcbiAgZXhwYW5zaW9uQ2FjaGU6IE1hcDxzdHJpbmcsIGJvb2xlYW4+LFxuICBub2RlUGF0aDogc3RyaW5nLFxuICBoaWRlRXhwcmVzc2lvbk5hbWU/OiBib29sZWFuLFxuICByZWFkT25seT86IGJvb2xlYW4sXG58fTtcblxudHlwZSBFeHByZXNzaW9uVHJlZU5vZGVTdGF0ZSA9IHt8XG4gIGV4cGFuZGVkOiBib29sZWFuLFxuICBjaGlsZHJlbjogRXhwZWN0ZWQ8SUV4cHJlc3Npb25bXT4sXG4gIGlzRWRpdGluZzogYm9vbGVhbixcbiAgcGVuZGluZ1ZhbHVlOiA/c3RyaW5nLFxuICBwZW5kaW5nU2F2ZTogYm9vbGVhbixcbnx9O1xuXG5leHBvcnQgY2xhc3MgRXhwcmVzc2lvblRyZWVOb2RlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFxuICBFeHByZXNzaW9uVHJlZU5vZGVQcm9wcyxcbiAgRXhwcmVzc2lvblRyZWVOb2RlU3RhdGUsXG4+IHtcbiAgc3RhdGU6IEV4cHJlc3Npb25UcmVlTm9kZVN0YXRlO1xuICBfdG9nZ2xlTm9kZUV4cGFuZGVkOiAoZTogU3ludGhldGljTW91c2VFdmVudDw+KSA9PiB2b2lkO1xuICBfZGlzcG9zYWJsZXM6IFVuaXZlcnNhbERpc3Bvc2FibGU7XG4gIF9zdWJzY3JpcHRpb246ID9yeGpzJElTdWJzY3JpcHRpb247XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IEV4cHJlc3Npb25UcmVlTm9kZVByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkID0gaWdub3JlVGV4dFNlbGVjdGlvbkV2ZW50cyhcbiAgICAgIHRoaXMuX3RvZ2dsZUV4cGFuZC5iaW5kKHRoaXMpLFxuICAgICk7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGV4cGFuZGVkOiB0aGlzLl9pc0V4cGFuZGVkKCksXG4gICAgICBjaGlsZHJlbjogRXhwZWN0LnBlbmRpbmcoKSxcbiAgICAgIGlzRWRpdGluZzogZmFsc2UsXG4gICAgICBwZW5kaW5nVmFsdWU6IG51bGwsXG4gICAgICBwZW5kaW5nU2F2ZTogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkKSB7XG4gICAgICB0aGlzLl9mZXRjaENoaWxkcmVuKCk7XG4gICAgfVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKTogdm9pZCB7XG4gICAgdGhpcy5fZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICB9XG5cbiAgX2lzRXhwYW5kYWJsZSA9ICgpOiBib29sZWFuID0+IHtcbiAgICBpZiAodGhpcy5wcm9wcy5wZW5kaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnByb3BzLmV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKTtcbiAgfTtcblxuICBfaXNFeHBhbmRlZCA9ICgpOiBib29sZWFuID0+IHtcbiAgICBpZiAoIXRoaXMuX2lzRXhwYW5kYWJsZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHtleHBhbnNpb25DYWNoZSwgbm9kZVBhdGh9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gQm9vbGVhbihleHBhbnNpb25DYWNoZS5nZXQobm9kZVBhdGgpKTtcbiAgfTtcblxuICBfc2V0RXhwYW5kZWQgPSAoZXhwYW5kZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBjb25zdCB7ZXhwYW5zaW9uQ2FjaGUsIG5vZGVQYXRofSA9IHRoaXMucHJvcHM7XG4gICAgZXhwYW5zaW9uQ2FjaGUuc2V0KG5vZGVQYXRoLCBleHBhbmRlZCk7XG5cbiAgICBpZiAoZXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuX2ZldGNoQ2hpbGRyZW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RvcEZldGNoaW5nQ2hpbGRyZW4oKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGV4cGFuZGVkLFxuICAgIH0pO1xuICB9O1xuXG4gIF9zdG9wRmV0Y2hpbmdDaGlsZHJlbiA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgX2ZldGNoQ2hpbGRyZW4gPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5fc3RvcEZldGNoaW5nQ2hpbGRyZW4oKTtcblxuICAgIGlmICh0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShcbiAgICAgICAgdGhpcy5wcm9wcy5leHByZXNzaW9uLmdldENoaWxkcmVuKCksXG4gICAgICApXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiBPYnNlcnZhYmxlLm9mKFtdKSlcbiAgICAgICAgLm1hcChjaGlsZHJlbiA9PiBFeHBlY3QudmFsdWUoKChjaGlsZHJlbjogYW55KTogSUV4cHJlc3Npb25bXSkpKVxuICAgICAgICAuc3RhcnRXaXRoKEV4cGVjdC5wZW5kaW5nKCkpXG4gICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBfdG9nZ2xlRXhwYW5kID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcbiAgICB0aGlzLl9zZXRFeHBhbmRlZCghdGhpcy5zdGF0ZS5leHBhbmRlZCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH07XG5cbiAgX3JlbmRlclZhbHVlTGluZSA9IChcbiAgICBleHByZXNzaW9uOiBSZWFjdC5FbGVtZW50PGFueT4gfCA/c3RyaW5nLFxuICAgIHZhbHVlOiBSZWFjdC5FbGVtZW50PGFueT4gfCBzdHJpbmcsXG4gICk6IFJlYWN0LkVsZW1lbnQ8YW55PiA9PiB7XG4gICAgaWYgKGV4cHJlc3Npb24gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJudWNsaWRlLXVpLWV4cHJlc3Npb24tdHJlZS12YWx1ZS1jb250YWluZXIgbmF0aXZlLWtleS1iaW5kaW5nc1wiPlxuICAgICAgICAgIHt2YWx1ZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9wcy5oaWRlRXhwcmVzc2lvbk5hbWUgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibnVjbGlkZS11aS1sYXp5LW5lc3RlZC12YWx1ZS1jb250YWluZXIgbmF0aXZlLWtleS1iaW5kaW5nc1wiPlxuICAgICAgICAgIHt2YWx1ZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtdWktbGF6eS1uZXN0ZWQtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e1ZhbHVlQ29tcG9uZW50Q2xhc3NOYW1lcy5pZGVudGlmaWVyfT5cbiAgICAgICAgICAgIHtleHByZXNzaW9ufVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA6IHt2YWx1ZX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICBfcmVuZGVyQ2hpbGQgPSAoY2hpbGQ6IElFeHByZXNzaW9uKTogUmVhY3QuTm9kZSA9PiB7XG4gICAgY29uc3Qgbm9kZVBhdGggPSB0aGlzLnByb3BzLm5vZGVQYXRoICsgJy8nICsgY2hpbGQubmFtZTtcbiAgICByZXR1cm4gKFxuICAgICAgPFRyZWVJdGVtIGtleT17bm9kZVBhdGh9PlxuICAgICAgICA8RXhwcmVzc2lvblRyZWVOb2RlXG4gICAgICAgICAgZXhwcmVzc2lvbj17Y2hpbGR9XG4gICAgICAgICAgZXhwYW5zaW9uQ2FjaGU9e3RoaXMucHJvcHMuZXhwYW5zaW9uQ2FjaGV9XG4gICAgICAgICAgbm9kZVBhdGg9e25vZGVQYXRofVxuICAgICAgICAvPlxuICAgICAgPC9UcmVlSXRlbT5cbiAgICApO1xuICB9O1xuXG4gIF9nZXRWYXJpYWJsZUV4cHJlc3Npb24oKTogP0lWYXJpYWJsZSB7XG4gICAgY29uc3Qge2V4cHJlc3Npb259ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKGV4cHJlc3Npb246IGFueSkuY2FuU2V0VmFyaWFibGUgPT0gbnVsbCB8fFxuICAgICAgKGV4cHJlc3Npb246IGFueSkuc2V0VmFyaWFibGUgPT0gbnVsbFxuICAgICAgPyBudWxsXG4gICAgICA6IChleHByZXNzaW9uOiBhbnkpO1xuICB9XG5cbiAgX2lzRWRpdGFibGUgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgY29uc3QgdmFyaWFibGUgPSB0aGlzLl9nZXRWYXJpYWJsZUV4cHJlc3Npb24oKTtcbiAgICByZXR1cm4gKFxuICAgICAgdmFyaWFibGUgIT0gbnVsbCAmJiB2YXJpYWJsZS5jYW5TZXRWYXJpYWJsZSgpICYmICF0aGlzLnByb3BzLnJlYWRPbmx5XG4gICAgKTtcbiAgfTtcblxuICBfdXBkYXRlVmFsdWUgPSAoKTogdm9pZCA9PiB7XG4gICAgY29uc3Qge3BlbmRpbmdWYWx1ZX0gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHZhcmlhYmxlID0gbnVsbHRocm93cyh0aGlzLl9nZXRWYXJpYWJsZUV4cHJlc3Npb24oKSk7XG5cbiAgICBjb25zdCBkb0VkaXQgPSBwZW5kaW5nVmFsdWUgIT0gbnVsbDtcbiAgICB0aGlzLl9jYW5jZWxFZGl0KGRvRWRpdCk7XG5cbiAgICBpZiAoZG9FZGl0KSB7XG4gICAgICBpbnZhcmlhbnQocGVuZGluZ1ZhbHVlICE9IG51bGwpO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShcbiAgICAgICAgdmFyaWFibGUuc2V0VmFyaWFibGUocGVuZGluZ1ZhbHVlKSxcbiAgICAgIClcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICBpZiAoZXJyb3IgIT0gbnVsbCAmJiBlcnJvci5tZXNzYWdlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgYEZhaWxlZCB0byBzZXQgdmFyaWFibGUgdmFsdWU6ICR7U3RyaW5nKGVycm9yLm1lc3NhZ2UpfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZXMucmVtb3ZlKHN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBwZW5kaW5nU2F2ZTogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoc3Vic2NyaXB0aW9uKTtcbiAgICB9XG4gIH07XG5cbiAgX2NhbmNlbEVkaXQgPSAocGVuZGluZ1NhdmU6ID9ib29sZWFuID0gZmFsc2UpOiB2b2lkID0+IHtcbiAgICBjb25zdCBuZXdTdGF0ZTogT2JqZWN0ID0ge1xuICAgICAgaXNFZGl0aW5nOiBmYWxzZSxcbiAgICAgIHBlbmRpbmdWYWx1ZTogbnVsbCxcbiAgICB9O1xuICAgIGlmIChwZW5kaW5nU2F2ZSAhPSBudWxsKSB7XG4gICAgICBuZXdTdGF0ZS5wZW5kaW5nU2F2ZSA9IHBlbmRpbmdTYXZlO1xuICAgIH1cbiAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcbiAgfTtcblxuICBfc3RhcnRFZGl0ID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNFZGl0aW5nOiB0cnVlLFxuICAgICAgcGVuZGluZ1ZhbHVlOiBudWxsLFxuICAgICAgcGVuZGluZ1NhdmU6IGZhbHNlLFxuICAgIH0pO1xuICB9O1xuXG4gIF9nZXRWYWx1ZUFzU3RyaW5nID0gKGV4cHJlc3Npb246IElFeHByZXNzaW9uKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGV4cHJlc3Npb24uZ2V0VmFsdWUoKTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiBleHByZXNzaW9uLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gU1RSSU5HX1JFR0VYLnRlc3QodmFsdWUpID8gdmFsdWUgOiBgXCIke3ZhbHVlfVwiYDtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlIHx8ICcnO1xuICB9O1xuXG4gIF9zZXRFZGl0b3JHcmFtbWFyID0gKGVkaXRvcjogP0F0b21JbnB1dCk6IHZvaWQgPT4ge1xuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZhcmlhYmxlID0gdGhpcy5fZ2V0VmFyaWFibGVFeHByZXNzaW9uKCk7XG4gICAgaWYgKHZhcmlhYmxlID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmFyaWFibGUuZ3JhbW1hck5hbWUgIT0gbnVsbCAmJiB2YXJpYWJsZS5ncmFtbWFyTmFtZSAhPT0gJycpIHtcbiAgICAgIGNvbnN0IGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUodmFyaWFibGUuZ3JhbW1hck5hbWUpO1xuICAgICAgaWYgKGdyYW1tYXIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlZGl0b3IuZ2V0VGV4dEVkaXRvcigpLnNldEdyYW1tYXIoZ3JhbW1hcik7XG4gICAgfVxuICB9O1xuXG4gIF9yZW5kZXJFZGl0VmlldyA9IChleHByZXNzaW9uOiBJRXhwcmVzc2lvbik6IFJlYWN0LkVsZW1lbnQ8YW55PiA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZXhwcmVzc2lvbi10cmVlLWxpbmUtY29udHJvbFwiPlxuICAgICAgICA8QXRvbUlucHV0XG4gICAgICAgICAgY2xhc3NOYW1lPVwiZXhwcmVzc2lvbi10cmVlLXZhbHVlLWJveCBpbmxpbmUtYmxvY2tcIlxuICAgICAgICAgIHNpemU9XCJzbVwiXG4gICAgICAgICAgYXV0b2ZvY3VzPXt0cnVlfVxuICAgICAgICAgIHN0YXJ0U2VsZWN0ZWQ9e2ZhbHNlfVxuICAgICAgICAgIGluaXRpYWxWYWx1ZT17dGhpcy5fZ2V0VmFsdWVBc1N0cmluZyhleHByZXNzaW9uKX1cbiAgICAgICAgICBvbkRpZENoYW5nZT17cGVuZGluZ1ZhbHVlID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3BlbmRpbmdWYWx1ZTogcGVuZGluZ1ZhbHVlLnRyaW0oKX0pO1xuICAgICAgICAgIH19XG4gICAgICAgICAgb25Db25maXJtPXt0aGlzLl91cGRhdGVWYWx1ZX1cbiAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gdGhpcy5fY2FuY2VsRWRpdCgpfVxuICAgICAgICAgIG9uQmx1cj17KCkgPT4gdGhpcy5fY2FuY2VsRWRpdCgpfVxuICAgICAgICAgIHJlZj17dGhpcy5fc2V0RWRpdG9yR3JhbW1hcn1cbiAgICAgICAgLz5cbiAgICAgICAgPEljb25cbiAgICAgICAgICBpY29uPVwiY2hlY2tcIlxuICAgICAgICAgIHRpdGxlPVwiU2F2ZSBjaGFuZ2VzXCJcbiAgICAgICAgICBjbGFzc05hbWU9XCJleHByZXNzaW9uLXRyZWUtZWRpdC1idXR0b24tY29uZmlybVwiXG4gICAgICAgICAgb25DbGljaz17dGhpcy5fdXBkYXRlVmFsdWV9XG4gICAgICAgIC8+XG4gICAgICAgIDxJY29uXG4gICAgICAgICAgaWNvbj1cInhcIlxuICAgICAgICAgIHRpdGxlPVwiQ2FuY2VsIGNoYW5nZXNcIlxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS1lZGl0LWJ1dHRvbi1jYW5jZWxcIlxuICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX2NhbmNlbEVkaXR9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9O1xuXG4gIF9yZW5kZXJFZGl0SG92ZXJDb250cm9scygpOiA/UmVhY3QuRWxlbWVudDxhbnk+IHtcbiAgICBpZiAoIXRoaXMuX2lzRWRpdGFibGUoKSB8fCB0aGlzLnN0YXRlLmlzRWRpdGluZykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRlYnVnZ2VyLXNjb3Blcy12aWV3LWNvbnRyb2xzXCI+XG4gICAgICAgIDxJY29uXG4gICAgICAgICAgaWNvbj1cInBlbmNpbFwiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiZGVidWdnZXItc2NvcGVzLXZpZXctZWRpdC1jb250cm9sXCJcbiAgICAgICAgICBvbkNsaWNrPXtfID0+IHtcbiAgICAgICAgICAgIHRyYWNrKEVESVRfVkFMVUVfRlJPTV9JQ09OKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0RWRpdCgpO1xuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIGNvbnN0IHtwZW5kaW5nLCBleHByZXNzaW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3BlbmRpbmdTYXZlfSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKHBlbmRpbmcgfHwgcGVuZGluZ1NhdmUpIHtcbiAgICAgIC8vIFZhbHVlIG5vdCBhdmFpbGFibGUgeWV0LiBTaG93IGEgZGVsYXllZCBsb2FkaW5nIHNwaW5uZXIuXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8VHJlZUl0ZW0gY2xhc3NOYW1lPVwibnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUtc3Bpbm5lclwiPlxuICAgICAgICAgIDxMb2FkaW5nU3Bpbm5lciBzaXplPVwiRVhUUkFfU01BTExcIiBkZWxheT17U1BJTk5FUl9ERUxBWX0gLz5cbiAgICAgICAgPC9UcmVlSXRlbT5cbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgaXNFZGl0YWJsZSA9IHRoaXMuX2lzRWRpdGFibGUoKTtcbiAgICBpZiAoIXRoaXMuX2lzRXhwYW5kYWJsZSgpKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgc2ltcGxlIHZhbHVlIHdpdGggbm8gY2hpbGRyZW4uXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgb25Eb3VibGVDbGljaz17XG4gICAgICAgICAgICBpc0VkaXRhYmxlICYmICF0aGlzLnN0YXRlLmlzRWRpdGluZyA/IHRoaXMuX3N0YXJ0RWRpdCA6ICgpID0+IHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS1saW5lLWNvbnRyb2xcIj5cbiAgICAgICAgICB7dGhpcy5zdGF0ZS5pc0VkaXRpbmcgPyAoXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJFZGl0VmlldyhleHByZXNzaW9uKVxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJuYXRpdmUta2V5LWJpbmRpbmdzIGV4cHJlc3Npb24tdHJlZS12YWx1ZS1ib3hcIj5cbiAgICAgICAgICAgICAgPFNpbXBsZVZhbHVlQ29tcG9uZW50IGV4cHJlc3Npb249e2V4cHJlc3Npb259IC8+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7aXNFZGl0YWJsZSA/IHRoaXMuX3JlbmRlckVkaXRIb3ZlckNvbnRyb2xzKCkgOiBudWxsfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQSBub2RlIHdpdGggYSBkZWxheWVkIHNwaW5uZXIgdG8gZGlzcGxheSBpZiB3ZSdyZSBleHBhbmRlZCwgYnV0IHdhaXRpbmcgZm9yXG4gICAgLy8gY2hpbGRyZW4gdG8gYmUgZmV0Y2hlZC5cbiAgICBjb25zdCBwZW5kaW5nQ2hpbGRyZW5Ob2RlID0gKFxuICAgICAgPEV4cHJlc3Npb25UcmVlTm9kZVxuICAgICAgICBleHByZXNzaW9uPXt0aGlzLnByb3BzLmV4cHJlc3Npb259XG4gICAgICAgIHBlbmRpbmc9e3RydWV9XG4gICAgICAgIGV4cGFuc2lvbkNhY2hlPXt0aGlzLnByb3BzLmV4cGFuc2lvbkNhY2hlfVxuICAgICAgICBub2RlUGF0aD17dGhpcy5wcm9wcy5ub2RlUGF0aH1cbiAgICAgIC8+XG4gICAgKTtcblxuICAgIC8vIElmIGNvbGxhcHNlZCwgcmVuZGVyIG5vIGNoaWxkcmVuLiBPdGhlcndpc2UgZWl0aGVyIHJlbmRlciB0aGUgcGVuZGluZ0NoaWxkcmVuTm9kZVxuICAgIC8vIGlmIHRoZSBmZXRjaCBoYXNuJ3QgY29tcGxldGVkLCBvciB0aGUgY2hpbGRyZW4gaWYgd2UndmUgZ290IHRoZW0uXG4gICAgbGV0IGNoaWxkcmVuO1xuICAgIGlmICghdGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgY2hpbGRyZW4gPSBudWxsO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5jaGlsZHJlbi5pc1BlbmRpbmcpIHtcbiAgICAgIGNoaWxkcmVuID0gcGVuZGluZ0NoaWxkcmVuTm9kZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuY2hpbGRyZW4uaXNFcnJvcikge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLl9yZW5kZXJWYWx1ZUxpbmUoXG4gICAgICAgICdDaGlsZHJlbicsXG4gICAgICAgIHRoaXMuc3RhdGUuY2hpbGRyZW4uZXJyb3IgIT0gbnVsbFxuICAgICAgICAgID8gdGhpcy5zdGF0ZS5jaGlsZHJlbi5lcnJvci50b1N0cmluZygpXG4gICAgICAgICAgOiBOT1RfQVZBSUxBQkxFX01FU1NBR0UsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMuc3RhdGUuY2hpbGRyZW4udmFsdWUubWFwKGNoaWxkID0+XG4gICAgICAgIHRoaXMuX3JlbmRlckNoaWxkKGNoaWxkKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxUcmVlTGlzdFxuICAgICAgICBzaG93QXJyb3dzPXt0cnVlfVxuICAgICAgICBjbGFzc05hbWU9XCJudWNsaWRlLXVpLWV4cHJlc3Npb24tdHJlZS12YWx1ZS10cmVlbGlzdFwiPlxuICAgICAgICA8TmVzdGVkVHJlZUl0ZW1cbiAgICAgICAgICBjb2xsYXBzZWQ9eyF0aGlzLnN0YXRlLmV4cGFuZGVkfVxuICAgICAgICAgIG9uQ29uZmlybT17aXNFZGl0YWJsZSA/IHRoaXMuX3N0YXJ0RWRpdCA6ICgpID0+IHt9fVxuICAgICAgICAgIG9uU2VsZWN0PXt0aGlzLnN0YXRlLmlzRWRpdGluZyA/ICgpID0+IHt9IDogdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkfVxuICAgICAgICAgIHRpdGxlPXtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuaXNFZGl0aW5nXG4gICAgICAgICAgICAgID8gdGhpcy5fcmVuZGVyRWRpdFZpZXcoZXhwcmVzc2lvbilcbiAgICAgICAgICAgICAgOiB0aGlzLl9yZW5kZXJWYWx1ZUxpbmUoZXhwcmVzc2lvbi5uYW1lLCBleHByZXNzaW9uLmdldFZhbHVlKCkpXG4gICAgICAgICAgfT5cbiAgICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgIDwvTmVzdGVkVHJlZUl0ZW0+XG4gICAgICA8L1RyZWVMaXN0PlxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRXhwcmVzc2lvblRyZWVDb21wb25lbnRQcm9wcyA9IHt8XG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxuICBjb250YWluZXJDb250ZXh0OiBPYmplY3QsXG4gIHBlbmRpbmc/OiBib29sZWFuLFxuICBjbGFzc05hbWU/OiBzdHJpbmcsXG4gIGhpZGVFeHByZXNzaW9uTmFtZT86IGJvb2xlYW4sXG4gIHJlYWRPbmx5PzogYm9vbGVhbixcbnx9O1xuXG5leHBvcnQgY2xhc3MgRXhwcmVzc2lvblRyZWVDb21wb25lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8XG4gIEV4cHJlc3Npb25UcmVlQ29tcG9uZW50UHJvcHMsXG4+IHtcbiAgY29uc3RydWN0b3IocHJvcHM6IEV4cHJlc3Npb25UcmVlQ29tcG9uZW50UHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gIH1cblxuICBfZ2V0RXhwYW5zaW9uQ2FjaGUgPSAoKTogTWFwPHN0cmluZywgYm9vbGVhbj4gPT4ge1xuICAgIGxldCBjYWNoZSA9IEV4cGFuc2lvblN0YXRlcy5nZXQodGhpcy5wcm9wcy5jb250YWluZXJDb250ZXh0KTtcbiAgICBpZiAoY2FjaGUgPT0gbnVsbCkge1xuICAgICAgY2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICBFeHBhbnNpb25TdGF0ZXMuc2V0KHRoaXMucHJvcHMuY29udGFpbmVyQ29udGV4dCwgY2FjaGUpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG4gIH07XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIHtcbiAgICAgICdudWNsaWRlLXVpLWV4cHJlc3Npb24tdHJlZS12YWx1ZSc6IHRoaXMucHJvcHMuY2xhc3NOYW1lID09IG51bGwsXG4gICAgfSk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxzcGFuIGNsYXNzTmFtZT17Y2xhc3NOYW1lfSB0YWJJbmRleD17LTF9PlxuICAgICAgICA8RXhwcmVzc2lvblRyZWVOb2RlXG4gICAgICAgICAgZXhwcmVzc2lvbj17dGhpcy5wcm9wcy5leHByZXNzaW9ufVxuICAgICAgICAgIHBlbmRpbmc9e3RoaXMucHJvcHMucGVuZGluZ31cbiAgICAgICAgICBub2RlUGF0aD1cInJvb3RcIlxuICAgICAgICAgIGV4cGFuc2lvbkNhY2hlPXt0aGlzLl9nZXRFeHBhbnNpb25DYWNoZSgpfVxuICAgICAgICAgIGhpZGVFeHByZXNzaW9uTmFtZT17dGhpcy5wcm9wcy5oaWRlRXhwcmVzc2lvbk5hbWV9XG4gICAgICAgICAgcmVhZE9ubHk9e3RoaXMucHJvcHMucmVhZE9ubHl9XG4gICAgICAgIC8+XG4gICAgICA8L3NwYW4+XG4gICAgKTtcbiAgfVxufVxuIl19