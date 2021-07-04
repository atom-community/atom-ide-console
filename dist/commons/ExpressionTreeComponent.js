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

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkV4cHJlc3Npb25UcmVlQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbIkVESVRfVkFMVUVfRlJPTV9JQ09OIiwiTk9UX0FWQUlMQUJMRV9NRVNTQUdFIiwiU1BJTk5FUl9ERUxBWSIsIkV4cGFuc2lvblN0YXRlcyIsIldlYWtNYXAiLCJFeHByZXNzaW9uVHJlZU5vZGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsIl90b2dnbGVOb2RlRXhwYW5kZWQiLCJfZGlzcG9zYWJsZXMiLCJfc3Vic2NyaXB0aW9uIiwiX2lzRXhwYW5kYWJsZSIsInBlbmRpbmciLCJleHByZXNzaW9uIiwiaGFzQ2hpbGRyZW4iLCJfaXNFeHBhbmRlZCIsImV4cGFuc2lvbkNhY2hlIiwibm9kZVBhdGgiLCJCb29sZWFuIiwiZ2V0IiwiX3NldEV4cGFuZGVkIiwiZXhwYW5kZWQiLCJzZXQiLCJfZmV0Y2hDaGlsZHJlbiIsIl9zdG9wRmV0Y2hpbmdDaGlsZHJlbiIsInNldFN0YXRlIiwidW5zdWJzY3JpYmUiLCJPYnNlcnZhYmxlIiwiZnJvbVByb21pc2UiLCJnZXRDaGlsZHJlbiIsImNhdGNoIiwiZXJyb3IiLCJvZiIsIm1hcCIsImNoaWxkcmVuIiwiRXhwZWN0IiwidmFsdWUiLCJzdGFydFdpdGgiLCJzdWJzY3JpYmUiLCJfdG9nZ2xlRXhwYW5kIiwiZXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJfcmVuZGVyVmFsdWVMaW5lIiwiaGlkZUV4cHJlc3Npb25OYW1lIiwiVmFsdWVDb21wb25lbnRDbGFzc05hbWVzIiwiaWRlbnRpZmllciIsIl9yZW5kZXJDaGlsZCIsImNoaWxkIiwibmFtZSIsIl9pc0VkaXRhYmxlIiwidmFyaWFibGUiLCJfZ2V0VmFyaWFibGVFeHByZXNzaW9uIiwiY2FuU2V0VmFyaWFibGUiLCJyZWFkT25seSIsIl91cGRhdGVWYWx1ZSIsInBlbmRpbmdWYWx1ZSIsImRvRWRpdCIsIl9jYW5jZWxFZGl0Iiwic3Vic2NyaXB0aW9uIiwic2V0VmFyaWFibGUiLCJtZXNzYWdlIiwiYXRvbSIsIm5vdGlmaWNhdGlvbnMiLCJhZGRFcnJvciIsIlN0cmluZyIsInJlbW92ZSIsInBlbmRpbmdTYXZlIiwiYWRkIiwibmV3U3RhdGUiLCJpc0VkaXRpbmciLCJfc3RhcnRFZGl0IiwiX2dldFZhbHVlQXNTdHJpbmciLCJnZXRWYWx1ZSIsInR5cGUiLCJTVFJJTkdfUkVHRVgiLCJ0ZXN0IiwiX3NldEVkaXRvckdyYW1tYXIiLCJlZGl0b3IiLCJncmFtbWFyTmFtZSIsImdyYW1tYXIiLCJncmFtbWFycyIsImdyYW1tYXJGb3JTY29wZU5hbWUiLCJnZXRUZXh0RWRpdG9yIiwic2V0R3JhbW1hciIsIl9yZW5kZXJFZGl0VmlldyIsInRyaW0iLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYmluZCIsImNvbXBvbmVudERpZE1vdW50IiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwiX3JlbmRlckVkaXRIb3ZlckNvbnRyb2xzIiwiXyIsInJlbmRlciIsImlzRWRpdGFibGUiLCJwZW5kaW5nQ2hpbGRyZW5Ob2RlIiwiaXNQZW5kaW5nIiwiaXNFcnJvciIsInRvU3RyaW5nIiwiRXhwcmVzc2lvblRyZWVDb21wb25lbnQiLCJfZ2V0RXhwYW5zaW9uQ2FjaGUiLCJjYWNoZSIsImNvbnRhaW5lckNvbnRleHQiLCJNYXAiLCJjbGFzc05hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFlQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUE5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXNCQSxNQUFNQSxvQkFBb0IsR0FBRyxzQkFBN0I7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxpQkFBOUI7QUFDQSxNQUFNQyxhQUFhLEdBQUcsR0FBdEI7QUFBMkI7QUFFM0I7QUFDQTtBQUNB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RSxDQUFDO0FBQXZDLG9CQUNFLG9CQUFDLGtCQUFEO0FBQ0UsTUFBQSxVQUFVLEVBQUUsS0FBS2xHLEtBQUwsQ0FBV08sVUFEekI7QUFFRSxNQUFBLE9BQU8sRUFBRSxLQUFLUCxLQUFMLENBQVdNLE9BRnRCO0FBR0UsTUFBQSxRQUFRLEVBQUMsTUFIWDtBQUlFLE1BQUEsY0FBYyxFQUFFLEtBQUt3RixrQkFBTCxFQUpsQjtBQUtFLE1BQUEsa0JBQWtCLEVBQUUsS0FBSzlGLEtBQUwsQ0FBV3FDLGtCQUxqQztBQU1FLE1BQUEsUUFBUSxFQUFFLEtBQUtyQyxLQUFMLENBQVcrQztBQU52QixNQURGLENBREY7QUFZRDs7QUE5QkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQGZsb3dcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7SUV4cHJlc3Npb24sIElWYXJpYWJsZX0gZnJvbSAnYXRvbS1pZGUtdWknO1xuaW1wb3J0IHR5cGUge0V4cGVjdGVkfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9leHBlY3RlZCc7XG5cbmltcG9ydCB7QXRvbUlucHV0fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9BdG9tSW5wdXQnO1xuaW1wb3J0IHtJY29ufSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9JY29uJztcbmltcG9ydCB7dHJhY2t9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2FuYWx5dGljcyc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY2xhc3NuYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCB7RXhwZWN0fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9leHBlY3RlZCc7XG5pbXBvcnQgaWdub3JlVGV4dFNlbGVjdGlvbkV2ZW50cyBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9pZ25vcmVUZXh0U2VsZWN0aW9uRXZlbnRzJztcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBudWxsdGhyb3dzIGZyb20gJ251bGx0aHJvd3MnO1xuaW1wb3J0IHtMb2FkaW5nU3Bpbm5lcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTG9hZGluZ1NwaW5uZXInO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuaW1wb3J0IFNpbXBsZVZhbHVlQ29tcG9uZW50IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1NpbXBsZVZhbHVlQ29tcG9uZW50JztcbmltcG9ydCB7U1RSSU5HX1JFR0VYfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9TaW1wbGVWYWx1ZUNvbXBvbmVudCc7XG5pbXBvcnQge1RyZWVMaXN0LCBUcmVlSXRlbSwgTmVzdGVkVHJlZUl0ZW19IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL1RyZWUnO1xuaW1wb3J0IFVuaXZlcnNhbERpc3Bvc2FibGUgZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZSc7XG5pbXBvcnQge1ZhbHVlQ29tcG9uZW50Q2xhc3NOYW1lc30gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVmFsdWVDb21wb25lbnRDbGFzc05hbWVzJztcblxuY29uc3QgRURJVF9WQUxVRV9GUk9NX0lDT04gPSAnZWRpdC12YWx1ZS1mcm9tLWljb24nO1xuY29uc3QgTk9UX0FWQUlMQUJMRV9NRVNTQUdFID0gJzxub3QgYXZhaWxhYmxlPic7XG5jb25zdCBTUElOTkVSX0RFTEFZID0gMjAwOyAvKiBtcyAqL1xuXG4vLyBUaGlzIHdlYWsgbWFwIHRyYWNrcyB3aGljaCBub2RlIHBhdGgocykgYXJlIGV4cGFuZGVkIGluIGEgcmVjdXJzaXZlIGV4cHJlc3Npb25cbi8vIHZhbHVlIHRyZWUuIFRoZXNlIG11c3QgYmUgdHJhY2tlZCBvdXRzaWRlIG9mIHRoZSBSZWFjdCBvYmplY3RzIHRoZW1zZWx2ZXMsIGJlY2F1c2Vcbi8vIGV4cGFuc2lvbiBzdGF0ZSBpcyBwZXJzaXN0ZWQgZXZlbiBpZiB0aGUgdHJlZSBpcyBkZXN0cm95ZWQgYW5kIHJlY3JlYXRlZCAoc3VjaCBhcyB3aGVuXG4vLyBzdGVwcGluZyBpbiBhIGRlYnVnZ2VyKS4gVGhlIHJvb3Qgb2YgZWFjaCB0cmVlIGhhcyBhIGNvbnRleHQsIHdoaWNoIGlzIGJhc2VkIG9uIHRoZVxuLy8gY29tcG9uZW50IHRoYXQgY29udGFpbnMgdGhlIHRyZWUgKHN1Y2ggYXMgYSBkZWJ1Z2dlciBwYW5lLCB0b29sdGlwIG9yIGNvbnNvbGUgcGFuZSkuXG4vLyBXaGVuIHRoYXQgY29tcG9uZW50IGlzIGRlc3Ryb3llZCwgdGhlIFdlYWtNYXAgd2lsbCByZW1vdmUgdGhlIGV4cGFuc2lvbiBzdGF0ZSBpbmZvcm1hdGlvblxuLy8gZm9yIHRoZSBlbnRpcmUgdHJlZS5cbmNvbnN0IEV4cGFuc2lvblN0YXRlczogV2Vha01hcDxPYmplY3QsIE1hcDxzdHJpbmcsIGJvb2xlYW4+PiA9IG5ldyBXZWFrTWFwKCk7XG5cbnR5cGUgRXhwcmVzc2lvblRyZWVOb2RlUHJvcHMgPSB7fFxuICBleHByZXNzaW9uOiBJRXhwcmVzc2lvbixcbiAgcGVuZGluZz86IGJvb2xlYW4sXG4gIGV4cGFuc2lvbkNhY2hlOiBNYXA8c3RyaW5nLCBib29sZWFuPixcbiAgbm9kZVBhdGg6IHN0cmluZyxcbiAgaGlkZUV4cHJlc3Npb25OYW1lPzogYm9vbGVhbixcbiAgcmVhZE9ubHk/OiBib29sZWFuLFxufH07XG5cbnR5cGUgRXhwcmVzc2lvblRyZWVOb2RlU3RhdGUgPSB7fFxuICBleHBhbmRlZDogYm9vbGVhbixcbiAgY2hpbGRyZW46IEV4cGVjdGVkPElFeHByZXNzaW9uW10+LFxuICBpc0VkaXRpbmc6IGJvb2xlYW4sXG4gIHBlbmRpbmdWYWx1ZTogP3N0cmluZyxcbiAgcGVuZGluZ1NhdmU6IGJvb2xlYW4sXG58fTtcblxuZXhwb3J0IGNsYXNzIEV4cHJlc3Npb25UcmVlTm9kZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxcbiAgRXhwcmVzc2lvblRyZWVOb2RlUHJvcHMsXG4gIEV4cHJlc3Npb25UcmVlTm9kZVN0YXRlLFxuPiB7XG4gIHN0YXRlOiBFeHByZXNzaW9uVHJlZU5vZGVTdGF0ZTtcbiAgX3RvZ2dsZU5vZGVFeHBhbmRlZDogKGU6IFN5bnRoZXRpY01vdXNlRXZlbnQ8PikgPT4gdm9pZDtcbiAgX2Rpc3Bvc2FibGVzOiBVbml2ZXJzYWxEaXNwb3NhYmxlO1xuICBfc3Vic2NyaXB0aW9uOiA/cnhqcyRJU3Vic2NyaXB0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBFeHByZXNzaW9uVHJlZU5vZGVQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX3RvZ2dsZU5vZGVFeHBhbmRlZCA9IGlnbm9yZVRleHRTZWxlY3Rpb25FdmVudHMoXG4gICAgICB0aGlzLl90b2dnbGVFeHBhbmQuYmluZCh0aGlzKSxcbiAgICApO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBleHBhbmRlZDogdGhpcy5faXNFeHBhbmRlZCgpLFxuICAgICAgY2hpbGRyZW46IEV4cGVjdC5wZW5kaW5nKCksXG4gICAgICBpc0VkaXRpbmc6IGZhbHNlLFxuICAgICAgcGVuZGluZ1ZhbHVlOiBudWxsLFxuICAgICAgcGVuZGluZ1NhdmU6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgdGhpcy5fZmV0Y2hDaGlsZHJlbigpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCk6IHZvaWQge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIF9pc0V4cGFuZGFibGUgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKHRoaXMucHJvcHMucGVuZGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5leHByZXNzaW9uLmhhc0NoaWxkcmVuKCk7XG4gIH07XG5cbiAgX2lzRXhwYW5kZWQgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgaWYgKCF0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB7ZXhwYW5zaW9uQ2FjaGUsIG5vZGVQYXRofSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIEJvb2xlYW4oZXhwYW5zaW9uQ2FjaGUuZ2V0KG5vZGVQYXRoKSk7XG4gIH07XG5cbiAgX3NldEV4cGFuZGVkID0gKGV4cGFuZGVkOiBib29sZWFuKSA9PiB7XG4gICAgY29uc3Qge2V4cGFuc2lvbkNhY2hlLCBub2RlUGF0aH0gPSB0aGlzLnByb3BzO1xuICAgIGV4cGFuc2lvbkNhY2hlLnNldChub2RlUGF0aCwgZXhwYW5kZWQpO1xuXG4gICAgaWYgKGV4cGFuZGVkKSB7XG4gICAgICB0aGlzLl9mZXRjaENoaWxkcmVuKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0b3BGZXRjaGluZ0NoaWxkcmVuKCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBleHBhbmRlZCxcbiAgICB9KTtcbiAgfTtcblxuICBfc3RvcEZldGNoaW5nQ2hpbGRyZW4gPSAoKTogdm9pZCA9PiB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIF9mZXRjaENoaWxkcmVuID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuX3N0b3BGZXRjaGluZ0NoaWxkcmVuKCk7XG5cbiAgICBpZiAodGhpcy5faXNFeHBhbmRhYmxlKCkpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IE9ic2VydmFibGUuZnJvbVByb21pc2UoXG4gICAgICAgIHRoaXMucHJvcHMuZXhwcmVzc2lvbi5nZXRDaGlsZHJlbigpLFxuICAgICAgKVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4gT2JzZXJ2YWJsZS5vZihbXSkpXG4gICAgICAgIC5tYXAoY2hpbGRyZW4gPT4gRXhwZWN0LnZhbHVlKCgoY2hpbGRyZW46IGFueSk6IElFeHByZXNzaW9uW10pKSlcbiAgICAgICAgLnN0YXJ0V2l0aChFeHBlY3QucGVuZGluZygpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgX3RvZ2dsZUV4cGFuZCA9IChldmVudDogU3ludGhldGljTW91c2VFdmVudDw+KTogdm9pZCA9PiB7XG4gICAgdGhpcy5fc2V0RXhwYW5kZWQoIXRoaXMuc3RhdGUuZXhwYW5kZWQpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9O1xuXG4gIF9yZW5kZXJWYWx1ZUxpbmUgPSAoXG4gICAgZXhwcmVzc2lvbjogUmVhY3QuRWxlbWVudDxhbnk+IHwgP3N0cmluZyxcbiAgICB2YWx1ZTogUmVhY3QuRWxlbWVudDxhbnk+IHwgc3RyaW5nLFxuICApOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xuICAgIGlmIChleHByZXNzaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cbiAgICAgICAgICB7dmFsdWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMuaGlkZUV4cHJlc3Npb25OYW1lID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtdWktbGF6eS1uZXN0ZWQtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cbiAgICAgICAgICB7dmFsdWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJudWNsaWRlLXVpLWxhenktbmVzdGVkLXZhbHVlLWNvbnRhaW5lciBuYXRpdmUta2V5LWJpbmRpbmdzXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtWYWx1ZUNvbXBvbmVudENsYXNzTmFtZXMuaWRlbnRpZmllcn0+XG4gICAgICAgICAgICB7ZXhwcmVzc2lvbn1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgOiB7dmFsdWV9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgX3JlbmRlckNoaWxkID0gKGNoaWxkOiBJRXhwcmVzc2lvbik6IFJlYWN0Lk5vZGUgPT4ge1xuICAgIGNvbnN0IG5vZGVQYXRoID0gdGhpcy5wcm9wcy5ub2RlUGF0aCArICcvJyArIGNoaWxkLm5hbWU7XG4gICAgcmV0dXJuIChcbiAgICAgIDxUcmVlSXRlbSBrZXk9e25vZGVQYXRofT5cbiAgICAgICAgPEV4cHJlc3Npb25UcmVlTm9kZVxuICAgICAgICAgIGV4cHJlc3Npb249e2NoaWxkfVxuICAgICAgICAgIGV4cGFuc2lvbkNhY2hlPXt0aGlzLnByb3BzLmV4cGFuc2lvbkNhY2hlfVxuICAgICAgICAgIG5vZGVQYXRoPXtub2RlUGF0aH1cbiAgICAgICAgLz5cbiAgICAgIDwvVHJlZUl0ZW0+XG4gICAgKTtcbiAgfTtcblxuICBfZ2V0VmFyaWFibGVFeHByZXNzaW9uKCk6ID9JVmFyaWFibGUge1xuICAgIGNvbnN0IHtleHByZXNzaW9ufSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChleHByZXNzaW9uOiBhbnkpLmNhblNldFZhcmlhYmxlID09IG51bGwgfHxcbiAgICAgIChleHByZXNzaW9uOiBhbnkpLnNldFZhcmlhYmxlID09IG51bGxcbiAgICAgID8gbnVsbFxuICAgICAgOiAoZXhwcmVzc2lvbjogYW55KTtcbiAgfVxuXG4gIF9pc0VkaXRhYmxlID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IHZhcmlhYmxlID0gdGhpcy5fZ2V0VmFyaWFibGVFeHByZXNzaW9uKCk7XG4gICAgcmV0dXJuIChcbiAgICAgIHZhcmlhYmxlICE9IG51bGwgJiYgdmFyaWFibGUuY2FuU2V0VmFyaWFibGUoKSAmJiAhdGhpcy5wcm9wcy5yZWFkT25seVxuICAgICk7XG4gIH07XG5cbiAgX3VwZGF0ZVZhbHVlID0gKCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHtwZW5kaW5nVmFsdWV9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB2YXJpYWJsZSA9IG51bGx0aHJvd3ModGhpcy5fZ2V0VmFyaWFibGVFeHByZXNzaW9uKCkpO1xuXG4gICAgY29uc3QgZG9FZGl0ID0gcGVuZGluZ1ZhbHVlICE9IG51bGw7XG4gICAgdGhpcy5fY2FuY2VsRWRpdChkb0VkaXQpO1xuXG4gICAgaWYgKGRvRWRpdCkge1xuICAgICAgaW52YXJpYW50KHBlbmRpbmdWYWx1ZSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IE9ic2VydmFibGUuZnJvbVByb21pc2UoXG4gICAgICAgIHZhcmlhYmxlLnNldFZhcmlhYmxlKHBlbmRpbmdWYWx1ZSksXG4gICAgICApXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yICE9IG51bGwgJiYgZXJyb3IubWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgIGBGYWlsZWQgdG8gc2V0IHZhcmlhYmxlIHZhbHVlOiAke1N0cmluZyhlcnJvci5tZXNzYWdlKX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobnVsbCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVzLnJlbW92ZShzdWJzY3JpcHRpb24pO1xuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGVuZGluZ1NhdmU6IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKHN1YnNjcmlwdGlvbik7XG4gICAgfVxuICB9O1xuXG4gIF9jYW5jZWxFZGl0ID0gKHBlbmRpbmdTYXZlOiA/Ym9vbGVhbiA9IGZhbHNlKTogdm9pZCA9PiB7XG4gICAgY29uc3QgbmV3U3RhdGU6IE9iamVjdCA9IHtcbiAgICAgIGlzRWRpdGluZzogZmFsc2UsXG4gICAgICBwZW5kaW5nVmFsdWU6IG51bGwsXG4gICAgfTtcbiAgICBpZiAocGVuZGluZ1NhdmUgIT0gbnVsbCkge1xuICAgICAgbmV3U3RhdGUucGVuZGluZ1NhdmUgPSBwZW5kaW5nU2F2ZTtcbiAgICB9XG4gICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gIH07XG5cbiAgX3N0YXJ0RWRpdCA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzRWRpdGluZzogdHJ1ZSxcbiAgICAgIHBlbmRpbmdWYWx1ZTogbnVsbCxcbiAgICAgIHBlbmRpbmdTYXZlOiBmYWxzZSxcbiAgICB9KTtcbiAgfTtcblxuICBfZ2V0VmFsdWVBc1N0cmluZyA9IChleHByZXNzaW9uOiBJRXhwcmVzc2lvbik6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBleHByZXNzaW9uLmdldFZhbHVlKCk7XG4gICAgaWYgKHZhbHVlICE9IG51bGwgJiYgZXhwcmVzc2lvbi50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIFNUUklOR19SRUdFWC50ZXN0KHZhbHVlKSA/IHZhbHVlIDogYFwiJHt2YWx1ZX1cImA7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSB8fCAnJztcbiAgfTtcblxuICBfc2V0RWRpdG9yR3JhbW1hciA9IChlZGl0b3I6ID9BdG9tSW5wdXQpOiB2b2lkID0+IHtcbiAgICBpZiAoZWRpdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YXJpYWJsZSA9IHRoaXMuX2dldFZhcmlhYmxlRXhwcmVzc2lvbigpO1xuICAgIGlmICh2YXJpYWJsZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhcmlhYmxlLmdyYW1tYXJOYW1lICE9IG51bGwgJiYgdmFyaWFibGUuZ3JhbW1hck5hbWUgIT09ICcnKSB7XG4gICAgICBjb25zdCBncmFtbWFyID0gYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKHZhcmlhYmxlLmdyYW1tYXJOYW1lKTtcbiAgICAgIGlmIChncmFtbWFyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZWRpdG9yLmdldFRleHRFZGl0b3IoKS5zZXRHcmFtbWFyKGdyYW1tYXIpO1xuICAgIH1cbiAgfTtcblxuICBfcmVuZGVyRWRpdFZpZXcgPSAoZXhwcmVzc2lvbjogSUV4cHJlc3Npb24pOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS1saW5lLWNvbnRyb2xcIj5cbiAgICAgICAgPEF0b21JbnB1dFxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS12YWx1ZS1ib3ggaW5saW5lLWJsb2NrXCJcbiAgICAgICAgICBzaXplPVwic21cIlxuICAgICAgICAgIGF1dG9mb2N1cz17dHJ1ZX1cbiAgICAgICAgICBzdGFydFNlbGVjdGVkPXtmYWxzZX1cbiAgICAgICAgICBpbml0aWFsVmFsdWU9e3RoaXMuX2dldFZhbHVlQXNTdHJpbmcoZXhwcmVzc2lvbil9XG4gICAgICAgICAgb25EaWRDaGFuZ2U9e3BlbmRpbmdWYWx1ZSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwZW5kaW5nVmFsdWU6IHBlbmRpbmdWYWx1ZS50cmltKCl9KTtcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uQ29uZmlybT17dGhpcy5fdXBkYXRlVmFsdWV9XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IHRoaXMuX2NhbmNlbEVkaXQoKX1cbiAgICAgICAgICBvbkJsdXI9eygpID0+IHRoaXMuX2NhbmNlbEVkaXQoKX1cbiAgICAgICAgICByZWY9e3RoaXMuX3NldEVkaXRvckdyYW1tYXJ9XG4gICAgICAgIC8+XG4gICAgICAgIDxJY29uXG4gICAgICAgICAgaWNvbj1cImNoZWNrXCJcbiAgICAgICAgICB0aXRsZT1cIlNhdmUgY2hhbmdlc1wiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiZXhwcmVzc2lvbi10cmVlLWVkaXQtYnV0dG9uLWNvbmZpcm1cIlxuICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX3VwZGF0ZVZhbHVlfVxuICAgICAgICAvPlxuICAgICAgICA8SWNvblxuICAgICAgICAgIGljb249XCJ4XCJcbiAgICAgICAgICB0aXRsZT1cIkNhbmNlbCBjaGFuZ2VzXCJcbiAgICAgICAgICBjbGFzc05hbWU9XCJleHByZXNzaW9uLXRyZWUtZWRpdC1idXR0b24tY2FuY2VsXCJcbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9jYW5jZWxFZGl0fVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfTtcblxuICBfcmVuZGVyRWRpdEhvdmVyQ29udHJvbHMoKTogP1JlYWN0LkVsZW1lbnQ8YW55PiB7XG4gICAgaWYgKCF0aGlzLl9pc0VkaXRhYmxlKCkgfHwgdGhpcy5zdGF0ZS5pc0VkaXRpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJkZWJ1Z2dlci1zY29wZXMtdmlldy1jb250cm9sc1wiPlxuICAgICAgICA8SWNvblxuICAgICAgICAgIGljb249XCJwZW5jaWxcIlxuICAgICAgICAgIGNsYXNzTmFtZT1cImRlYnVnZ2VyLXNjb3Blcy12aWV3LWVkaXQtY29udHJvbFwiXG4gICAgICAgICAgb25DbGljaz17XyA9PiB7XG4gICAgICAgICAgICB0cmFjayhFRElUX1ZBTFVFX0ZST01fSUNPTik7XG4gICAgICAgICAgICB0aGlzLl9zdGFydEVkaXQoKTtcbiAgICAgICAgICB9fVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCB7cGVuZGluZywgZXhwcmVzc2lvbn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtwZW5kaW5nU2F2ZX0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChwZW5kaW5nIHx8IHBlbmRpbmdTYXZlKSB7XG4gICAgICAvLyBWYWx1ZSBub3QgYXZhaWxhYmxlIHlldC4gU2hvdyBhIGRlbGF5ZWQgbG9hZGluZyBzcGlubmVyLlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFRyZWVJdGVtIGNsYXNzTmFtZT1cIm51Y2xpZGUtdWktZXhwcmVzc2lvbi10cmVlLXZhbHVlLXNwaW5uZXJcIj5cbiAgICAgICAgICA8TG9hZGluZ1NwaW5uZXIgc2l6ZT1cIkVYVFJBX1NNQUxMXCIgZGVsYXk9e1NQSU5ORVJfREVMQVl9IC8+XG4gICAgICAgIDwvVHJlZUl0ZW0+XG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGlzRWRpdGFibGUgPSB0aGlzLl9pc0VkaXRhYmxlKCk7XG4gICAgaWYgKCF0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIHNpbXBsZSB2YWx1ZSB3aXRoIG5vIGNoaWxkcmVuLlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdlxuICAgICAgICAgIG9uRG91YmxlQ2xpY2s9e1xuICAgICAgICAgICAgaXNFZGl0YWJsZSAmJiAhdGhpcy5zdGF0ZS5pc0VkaXRpbmcgPyB0aGlzLl9zdGFydEVkaXQgOiAoKSA9PiB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICBjbGFzc05hbWU9XCJleHByZXNzaW9uLXRyZWUtbGluZS1jb250cm9sXCI+XG4gICAgICAgICAge3RoaXMuc3RhdGUuaXNFZGl0aW5nID8gKFxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyRWRpdFZpZXcoZXhwcmVzc2lvbilcbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibmF0aXZlLWtleS1iaW5kaW5ncyBleHByZXNzaW9uLXRyZWUtdmFsdWUtYm94XCI+XG4gICAgICAgICAgICAgIDxTaW1wbGVWYWx1ZUNvbXBvbmVudCBleHByZXNzaW9uPXtleHByZXNzaW9ufSAvPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICl9XG4gICAgICAgICAge2lzRWRpdGFibGUgPyB0aGlzLl9yZW5kZXJFZGl0SG92ZXJDb250cm9scygpIDogbnVsbH1cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEEgbm9kZSB3aXRoIGEgZGVsYXllZCBzcGlubmVyIHRvIGRpc3BsYXkgaWYgd2UncmUgZXhwYW5kZWQsIGJ1dCB3YWl0aW5nIGZvclxuICAgIC8vIGNoaWxkcmVuIHRvIGJlIGZldGNoZWQuXG4gICAgY29uc3QgcGVuZGluZ0NoaWxkcmVuTm9kZSA9IChcbiAgICAgIDxFeHByZXNzaW9uVHJlZU5vZGVcbiAgICAgICAgZXhwcmVzc2lvbj17dGhpcy5wcm9wcy5leHByZXNzaW9ufVxuICAgICAgICBwZW5kaW5nPXt0cnVlfVxuICAgICAgICBleHBhbnNpb25DYWNoZT17dGhpcy5wcm9wcy5leHBhbnNpb25DYWNoZX1cbiAgICAgICAgbm9kZVBhdGg9e3RoaXMucHJvcHMubm9kZVBhdGh9XG4gICAgICAvPlxuICAgICk7XG5cbiAgICAvLyBJZiBjb2xsYXBzZWQsIHJlbmRlciBubyBjaGlsZHJlbi4gT3RoZXJ3aXNlIGVpdGhlciByZW5kZXIgdGhlIHBlbmRpbmdDaGlsZHJlbk5vZGVcbiAgICAvLyBpZiB0aGUgZmV0Y2ggaGFzbid0IGNvbXBsZXRlZCwgb3IgdGhlIGNoaWxkcmVuIGlmIHdlJ3ZlIGdvdCB0aGVtLlxuICAgIGxldCBjaGlsZHJlbjtcbiAgICBpZiAoIXRoaXMuc3RhdGUuZXhwYW5kZWQpIHtcbiAgICAgIGNoaWxkcmVuID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuY2hpbGRyZW4uaXNQZW5kaW5nKSB7XG4gICAgICBjaGlsZHJlbiA9IHBlbmRpbmdDaGlsZHJlbk5vZGU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmNoaWxkcmVuLmlzRXJyb3IpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5fcmVuZGVyVmFsdWVMaW5lKFxuICAgICAgICAnQ2hpbGRyZW4nLFxuICAgICAgICB0aGlzLnN0YXRlLmNoaWxkcmVuLmVycm9yICE9IG51bGxcbiAgICAgICAgICA/IHRoaXMuc3RhdGUuY2hpbGRyZW4uZXJyb3IudG9TdHJpbmcoKVxuICAgICAgICAgIDogTk9UX0FWQUlMQUJMRV9NRVNTQUdFLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLnN0YXRlLmNoaWxkcmVuLnZhbHVlLm1hcChjaGlsZCA9PlxuICAgICAgICB0aGlzLl9yZW5kZXJDaGlsZChjaGlsZCksXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8VHJlZUxpc3RcbiAgICAgICAgc2hvd0Fycm93cz17dHJ1ZX1cbiAgICAgICAgY2xhc3NOYW1lPVwibnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUtdHJlZWxpc3RcIj5cbiAgICAgICAgPE5lc3RlZFRyZWVJdGVtXG4gICAgICAgICAgY29sbGFwc2VkPXshdGhpcy5zdGF0ZS5leHBhbmRlZH1cbiAgICAgICAgICBvbkNvbmZpcm09e2lzRWRpdGFibGUgPyB0aGlzLl9zdGFydEVkaXQgOiAoKSA9PiB7fX1cbiAgICAgICAgICBvblNlbGVjdD17dGhpcy5zdGF0ZS5pc0VkaXRpbmcgPyAoKSA9PiB7fSA6IHRoaXMuX3RvZ2dsZU5vZGVFeHBhbmRlZH1cbiAgICAgICAgICB0aXRsZT17XG4gICAgICAgICAgICB0aGlzLnN0YXRlLmlzRWRpdGluZ1xuICAgICAgICAgICAgICA/IHRoaXMuX3JlbmRlckVkaXRWaWV3KGV4cHJlc3Npb24pXG4gICAgICAgICAgICAgIDogdGhpcy5fcmVuZGVyVmFsdWVMaW5lKGV4cHJlc3Npb24ubmFtZSwgZXhwcmVzc2lvbi5nZXRWYWx1ZSgpKVxuICAgICAgICAgIH0+XG4gICAgICAgICAge2NoaWxkcmVufVxuICAgICAgICA8L05lc3RlZFRyZWVJdGVtPlxuICAgICAgPC9UcmVlTGlzdD5cbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEV4cHJlc3Npb25UcmVlQ29tcG9uZW50UHJvcHMgPSB7fFxuICBleHByZXNzaW9uOiBJRXhwcmVzc2lvbixcbiAgY29udGFpbmVyQ29udGV4dDogT2JqZWN0LFxuICBwZW5kaW5nPzogYm9vbGVhbixcbiAgY2xhc3NOYW1lPzogc3RyaW5nLFxuICBoaWRlRXhwcmVzc2lvbk5hbWU/OiBib29sZWFuLFxuICByZWFkT25seT86IGJvb2xlYW4sXG58fTtcblxuZXhwb3J0IGNsYXNzIEV4cHJlc3Npb25UcmVlQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFxuICBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFByb3BzLFxuPiB7XG4gIGNvbnN0cnVjdG9yKHByb3BzOiBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICB9XG5cbiAgX2dldEV4cGFuc2lvbkNhY2hlID0gKCk6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0+IHtcbiAgICBsZXQgY2FjaGUgPSBFeHBhbnNpb25TdGF0ZXMuZ2V0KHRoaXMucHJvcHMuY29udGFpbmVyQ29udGV4dCk7XG4gICAgaWYgKGNhY2hlID09IG51bGwpIHtcbiAgICAgIGNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgRXhwYW5zaW9uU3RhdGVzLnNldCh0aGlzLnByb3BzLmNvbnRhaW5lckNvbnRleHQsIGNhY2hlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlO1xuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCBjbGFzc05hbWUgPSBjbGFzc25hbWVzKHRoaXMucHJvcHMuY2xhc3NOYW1lLCB7XG4gICAgICAnbnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUnOiB0aGlzLnByb3BzLmNsYXNzTmFtZSA9PSBudWxsLFxuICAgIH0pO1xuICAgIHJldHVybiAoXG4gICAgICA8c3BhbiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gdGFiSW5kZXg9ey0xfT5cbiAgICAgICAgPEV4cHJlc3Npb25UcmVlTm9kZVxuICAgICAgICAgIGV4cHJlc3Npb249e3RoaXMucHJvcHMuZXhwcmVzc2lvbn1cbiAgICAgICAgICBwZW5kaW5nPXt0aGlzLnByb3BzLnBlbmRpbmd9XG4gICAgICAgICAgbm9kZVBhdGg9XCJyb290XCJcbiAgICAgICAgICBleHBhbnNpb25DYWNoZT17dGhpcy5fZ2V0RXhwYW5zaW9uQ2FjaGUoKX1cbiAgICAgICAgICBoaWRlRXhwcmVzc2lvbk5hbWU9e3RoaXMucHJvcHMuaGlkZUV4cHJlc3Npb25OYW1lfVxuICAgICAgICAgIHJlYWRPbmx5PXt0aGlzLnByb3BzLnJlYWRPbmx5fVxuICAgICAgICAvPlxuICAgICAgPC9zcGFuPlxuICAgICk7XG4gIH1cbn1cbiJdfQ==