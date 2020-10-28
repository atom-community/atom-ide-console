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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkV4cHJlc3Npb25UcmVlQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbIkVESVRfVkFMVUVfRlJPTV9JQ09OIiwiTk9UX0FWQUlMQUJMRV9NRVNTQUdFIiwiU1BJTk5FUl9ERUxBWSIsIkV4cGFuc2lvblN0YXRlcyIsIldlYWtNYXAiLCJFeHByZXNzaW9uVHJlZU5vZGUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJzdGF0ZSIsIl90b2dnbGVOb2RlRXhwYW5kZWQiLCJfZGlzcG9zYWJsZXMiLCJfc3Vic2NyaXB0aW9uIiwiX2lzRXhwYW5kYWJsZSIsInBlbmRpbmciLCJleHByZXNzaW9uIiwiaGFzQ2hpbGRyZW4iLCJfaXNFeHBhbmRlZCIsImV4cGFuc2lvbkNhY2hlIiwibm9kZVBhdGgiLCJCb29sZWFuIiwiZ2V0IiwiX3NldEV4cGFuZGVkIiwiZXhwYW5kZWQiLCJzZXQiLCJfZmV0Y2hDaGlsZHJlbiIsIl9zdG9wRmV0Y2hpbmdDaGlsZHJlbiIsInNldFN0YXRlIiwidW5zdWJzY3JpYmUiLCJPYnNlcnZhYmxlIiwiZnJvbVByb21pc2UiLCJnZXRDaGlsZHJlbiIsImNhdGNoIiwiZXJyb3IiLCJvZiIsIm1hcCIsImNoaWxkcmVuIiwiRXhwZWN0IiwidmFsdWUiLCJzdGFydFdpdGgiLCJzdWJzY3JpYmUiLCJfdG9nZ2xlRXhwYW5kIiwiZXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJfcmVuZGVyVmFsdWVMaW5lIiwiaGlkZUV4cHJlc3Npb25OYW1lIiwiVmFsdWVDb21wb25lbnRDbGFzc05hbWVzIiwiaWRlbnRpZmllciIsIl9yZW5kZXJDaGlsZCIsImNoaWxkIiwibmFtZSIsIl9pc0VkaXRhYmxlIiwidmFyaWFibGUiLCJfZ2V0VmFyaWFibGVFeHByZXNzaW9uIiwiY2FuU2V0VmFyaWFibGUiLCJyZWFkT25seSIsIl91cGRhdGVWYWx1ZSIsInBlbmRpbmdWYWx1ZSIsImRvRWRpdCIsIl9jYW5jZWxFZGl0Iiwic3Vic2NyaXB0aW9uIiwic2V0VmFyaWFibGUiLCJtZXNzYWdlIiwiYXRvbSIsIm5vdGlmaWNhdGlvbnMiLCJhZGRFcnJvciIsIlN0cmluZyIsInJlbW92ZSIsInBlbmRpbmdTYXZlIiwiYWRkIiwibmV3U3RhdGUiLCJpc0VkaXRpbmciLCJfc3RhcnRFZGl0IiwiX2dldFZhbHVlQXNTdHJpbmciLCJnZXRWYWx1ZSIsInR5cGUiLCJTVFJJTkdfUkVHRVgiLCJ0ZXN0IiwiX3NldEVkaXRvckdyYW1tYXIiLCJlZGl0b3IiLCJncmFtbWFyTmFtZSIsImdyYW1tYXIiLCJncmFtbWFycyIsImdyYW1tYXJGb3JTY29wZU5hbWUiLCJnZXRUZXh0RWRpdG9yIiwic2V0R3JhbW1hciIsIl9yZW5kZXJFZGl0VmlldyIsInRyaW0iLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYmluZCIsImNvbXBvbmVudERpZE1vdW50IiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJkaXNwb3NlIiwiX3JlbmRlckVkaXRIb3ZlckNvbnRyb2xzIiwiXyIsInJlbmRlciIsImlzRWRpdGFibGUiLCJwZW5kaW5nQ2hpbGRyZW5Ob2RlIiwiaXNQZW5kaW5nIiwiaXNFcnJvciIsInRvU3RyaW5nIiwiRXhwcmVzc2lvblRyZWVDb21wb25lbnQiLCJfZ2V0RXhwYW5zaW9uQ2FjaGUiLCJjYWNoZSIsImNvbnRhaW5lckNvbnRleHQiLCJNYXAiLCJjbGFzc05hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFlQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUE5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXNCQSxNQUFNQSxvQkFBb0IsR0FBRyxzQkFBN0I7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxpQkFBOUI7QUFDQSxNQUFNQyxhQUFhLEdBQUcsR0FBdEI7QUFBMkI7QUFFM0I7QUFDQTtBQUNB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RSxDQUFDO0FBQXZDLG9CQUNFLG9CQUFDLGtCQUFEO0FBQ0UsTUFBQSxVQUFVLEVBQUUsS0FBS2xHLEtBQUwsQ0FBV08sVUFEekI7QUFFRSxNQUFBLE9BQU8sRUFBRSxLQUFLUCxLQUFMLENBQVdNLE9BRnRCO0FBR0UsTUFBQSxRQUFRLEVBQUMsTUFIWDtBQUlFLE1BQUEsY0FBYyxFQUFFLEtBQUt3RixrQkFBTCxFQUpsQjtBQUtFLE1BQUEsa0JBQWtCLEVBQUUsS0FBSzlGLEtBQUwsQ0FBV3FDLGtCQUxqQztBQU1FLE1BQUEsUUFBUSxFQUFFLEtBQUtyQyxLQUFMLENBQVcrQztBQU52QixNQURGLENBREY7QUFZRDs7QUE5QkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IChjKSAyMDE3LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXHJcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqXHJcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxyXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcclxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXHJcbiAqXHJcbiAqIEBmbG93XHJcbiAqIEBmb3JtYXRcclxuICovXHJcblxyXG5pbXBvcnQgdHlwZSB7SUV4cHJlc3Npb24sIElWYXJpYWJsZX0gZnJvbSAnYXRvbS1pZGUtdWknO1xyXG5pbXBvcnQgdHlwZSB7RXhwZWN0ZWR9IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL2V4cGVjdGVkJztcclxuXHJcbmltcG9ydCB7QXRvbUlucHV0fSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9BdG9tSW5wdXQnO1xyXG5pbXBvcnQge0ljb259IGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zLXVpL0ljb24nO1xyXG5pbXBvcnQge3RyYWNrfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9hbmFseXRpY3MnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBjbGFzc25hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xyXG5pbXBvcnQge0V4cGVjdH0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvZXhwZWN0ZWQnO1xyXG5pbXBvcnQgaWdub3JlVGV4dFNlbGVjdGlvbkV2ZW50cyBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9pZ25vcmVUZXh0U2VsZWN0aW9uRXZlbnRzJztcclxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgbnVsbHRocm93cyBmcm9tICdudWxsdGhyb3dzJztcclxuaW1wb3J0IHtMb2FkaW5nU3Bpbm5lcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvTG9hZGluZ1NwaW5uZXInO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XHJcbmltcG9ydCBTaW1wbGVWYWx1ZUNvbXBvbmVudCBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9TaW1wbGVWYWx1ZUNvbXBvbmVudCc7XHJcbmltcG9ydCB7U1RSSU5HX1JFR0VYfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9TaW1wbGVWYWx1ZUNvbXBvbmVudCc7XHJcbmltcG9ydCB7VHJlZUxpc3QsIFRyZWVJdGVtLCBOZXN0ZWRUcmVlSXRlbX0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVHJlZSc7XHJcbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGUnO1xyXG5pbXBvcnQge1ZhbHVlQ29tcG9uZW50Q2xhc3NOYW1lc30gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvVmFsdWVDb21wb25lbnRDbGFzc05hbWVzJztcclxuXHJcbmNvbnN0IEVESVRfVkFMVUVfRlJPTV9JQ09OID0gJ2VkaXQtdmFsdWUtZnJvbS1pY29uJztcclxuY29uc3QgTk9UX0FWQUlMQUJMRV9NRVNTQUdFID0gJzxub3QgYXZhaWxhYmxlPic7XHJcbmNvbnN0IFNQSU5ORVJfREVMQVkgPSAyMDA7IC8qIG1zICovXHJcblxyXG4vLyBUaGlzIHdlYWsgbWFwIHRyYWNrcyB3aGljaCBub2RlIHBhdGgocykgYXJlIGV4cGFuZGVkIGluIGEgcmVjdXJzaXZlIGV4cHJlc3Npb25cclxuLy8gdmFsdWUgdHJlZS4gVGhlc2UgbXVzdCBiZSB0cmFja2VkIG91dHNpZGUgb2YgdGhlIFJlYWN0IG9iamVjdHMgdGhlbXNlbHZlcywgYmVjYXVzZVxyXG4vLyBleHBhbnNpb24gc3RhdGUgaXMgcGVyc2lzdGVkIGV2ZW4gaWYgdGhlIHRyZWUgaXMgZGVzdHJveWVkIGFuZCByZWNyZWF0ZWQgKHN1Y2ggYXMgd2hlblxyXG4vLyBzdGVwcGluZyBpbiBhIGRlYnVnZ2VyKS4gVGhlIHJvb3Qgb2YgZWFjaCB0cmVlIGhhcyBhIGNvbnRleHQsIHdoaWNoIGlzIGJhc2VkIG9uIHRoZVxyXG4vLyBjb21wb25lbnQgdGhhdCBjb250YWlucyB0aGUgdHJlZSAoc3VjaCBhcyBhIGRlYnVnZ2VyIHBhbmUsIHRvb2x0aXAgb3IgY29uc29sZSBwYW5lKS5cclxuLy8gV2hlbiB0aGF0IGNvbXBvbmVudCBpcyBkZXN0cm95ZWQsIHRoZSBXZWFrTWFwIHdpbGwgcmVtb3ZlIHRoZSBleHBhbnNpb24gc3RhdGUgaW5mb3JtYXRpb25cclxuLy8gZm9yIHRoZSBlbnRpcmUgdHJlZS5cclxuY29uc3QgRXhwYW5zaW9uU3RhdGVzOiBXZWFrTWFwPE9iamVjdCwgTWFwPHN0cmluZywgYm9vbGVhbj4+ID0gbmV3IFdlYWtNYXAoKTtcclxuXHJcbnR5cGUgRXhwcmVzc2lvblRyZWVOb2RlUHJvcHMgPSB7fFxyXG4gIGV4cHJlc3Npb246IElFeHByZXNzaW9uLFxyXG4gIHBlbmRpbmc/OiBib29sZWFuLFxyXG4gIGV4cGFuc2lvbkNhY2hlOiBNYXA8c3RyaW5nLCBib29sZWFuPixcclxuICBub2RlUGF0aDogc3RyaW5nLFxyXG4gIGhpZGVFeHByZXNzaW9uTmFtZT86IGJvb2xlYW4sXHJcbiAgcmVhZE9ubHk/OiBib29sZWFuLFxyXG58fTtcclxuXHJcbnR5cGUgRXhwcmVzc2lvblRyZWVOb2RlU3RhdGUgPSB7fFxyXG4gIGV4cGFuZGVkOiBib29sZWFuLFxyXG4gIGNoaWxkcmVuOiBFeHBlY3RlZDxJRXhwcmVzc2lvbltdPixcclxuICBpc0VkaXRpbmc6IGJvb2xlYW4sXHJcbiAgcGVuZGluZ1ZhbHVlOiA/c3RyaW5nLFxyXG4gIHBlbmRpbmdTYXZlOiBib29sZWFuLFxyXG58fTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFeHByZXNzaW9uVHJlZU5vZGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8XHJcbiAgRXhwcmVzc2lvblRyZWVOb2RlUHJvcHMsXHJcbiAgRXhwcmVzc2lvblRyZWVOb2RlU3RhdGUsXHJcbj4ge1xyXG4gIHN0YXRlOiBFeHByZXNzaW9uVHJlZU5vZGVTdGF0ZTtcclxuICBfdG9nZ2xlTm9kZUV4cGFuZGVkOiAoZTogU3ludGhldGljTW91c2VFdmVudDw+KSA9PiB2b2lkO1xyXG4gIF9kaXNwb3NhYmxlczogVW5pdmVyc2FsRGlzcG9zYWJsZTtcclxuICBfc3Vic2NyaXB0aW9uOiA/cnhqcyRJU3Vic2NyaXB0aW9uO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogRXhwcmVzc2lvblRyZWVOb2RlUHJvcHMpIHtcclxuICAgIHN1cGVyKHByb3BzKTtcclxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IG51bGw7XHJcbiAgICB0aGlzLl9kaXNwb3NhYmxlcyA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCk7XHJcbiAgICB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoKCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uICE9IG51bGwpIHtcclxuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl90b2dnbGVOb2RlRXhwYW5kZWQgPSBpZ25vcmVUZXh0U2VsZWN0aW9uRXZlbnRzKFxyXG4gICAgICB0aGlzLl90b2dnbGVFeHBhbmQuYmluZCh0aGlzKSxcclxuICAgICk7XHJcbiAgICB0aGlzLnN0YXRlID0ge1xyXG4gICAgICBleHBhbmRlZDogdGhpcy5faXNFeHBhbmRlZCgpLFxyXG4gICAgICBjaGlsZHJlbjogRXhwZWN0LnBlbmRpbmcoKSxcclxuICAgICAgaXNFZGl0aW5nOiBmYWxzZSxcclxuICAgICAgcGVuZGluZ1ZhbHVlOiBudWxsLFxyXG4gICAgICBwZW5kaW5nU2F2ZTogZmFsc2UsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29tcG9uZW50RGlkTW91bnQoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCkge1xyXG4gICAgICB0aGlzLl9mZXRjaENoaWxkcmVuKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIF9pc0V4cGFuZGFibGUgPSAoKTogYm9vbGVhbiA9PiB7XHJcbiAgICBpZiAodGhpcy5wcm9wcy5wZW5kaW5nKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnByb3BzLmV4cHJlc3Npb24uaGFzQ2hpbGRyZW4oKTtcclxuICB9O1xyXG5cclxuICBfaXNFeHBhbmRlZCA9ICgpOiBib29sZWFuID0+IHtcclxuICAgIGlmICghdGhpcy5faXNFeHBhbmRhYmxlKCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgY29uc3Qge2V4cGFuc2lvbkNhY2hlLCBub2RlUGF0aH0gPSB0aGlzLnByb3BzO1xyXG4gICAgcmV0dXJuIEJvb2xlYW4oZXhwYW5zaW9uQ2FjaGUuZ2V0KG5vZGVQYXRoKSk7XHJcbiAgfTtcclxuXHJcbiAgX3NldEV4cGFuZGVkID0gKGV4cGFuZGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICBjb25zdCB7ZXhwYW5zaW9uQ2FjaGUsIG5vZGVQYXRofSA9IHRoaXMucHJvcHM7XHJcbiAgICBleHBhbnNpb25DYWNoZS5zZXQobm9kZVBhdGgsIGV4cGFuZGVkKTtcclxuXHJcbiAgICBpZiAoZXhwYW5kZWQpIHtcclxuICAgICAgdGhpcy5fZmV0Y2hDaGlsZHJlbigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fc3RvcEZldGNoaW5nQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgZXhwYW5kZWQsXHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBfc3RvcEZldGNoaW5nQ2hpbGRyZW4gPSAoKTogdm9pZCA9PiB7XHJcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IG51bGw7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgX2ZldGNoQ2hpbGRyZW4gPSAoKTogdm9pZCA9PiB7XHJcbiAgICB0aGlzLl9zdG9wRmV0Y2hpbmdDaGlsZHJlbigpO1xyXG5cclxuICAgIGlmICh0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xyXG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb24gPSBPYnNlcnZhYmxlLmZyb21Qcm9taXNlKFxyXG4gICAgICAgIHRoaXMucHJvcHMuZXhwcmVzc2lvbi5nZXRDaGlsZHJlbigpLFxyXG4gICAgICApXHJcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IE9ic2VydmFibGUub2YoW10pKVxyXG4gICAgICAgIC5tYXAoY2hpbGRyZW4gPT4gRXhwZWN0LnZhbHVlKCgoY2hpbGRyZW46IGFueSk6IElFeHByZXNzaW9uW10pKSlcclxuICAgICAgICAuc3RhcnRXaXRoKEV4cGVjdC5wZW5kaW5nKCkpXHJcbiAgICAgICAgLnN1YnNjcmliZShjaGlsZHJlbiA9PiB7XHJcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgY2hpbGRyZW4sXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBfdG9nZ2xlRXhwYW5kID0gKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50PD4pOiB2b2lkID0+IHtcclxuICAgIHRoaXMuX3NldEV4cGFuZGVkKCF0aGlzLnN0YXRlLmV4cGFuZGVkKTtcclxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gIH07XHJcblxyXG4gIF9yZW5kZXJWYWx1ZUxpbmUgPSAoXHJcbiAgICBleHByZXNzaW9uOiBSZWFjdC5FbGVtZW50PGFueT4gfCA/c3RyaW5nLFxyXG4gICAgdmFsdWU6IFJlYWN0LkVsZW1lbnQ8YW55PiB8IHN0cmluZyxcclxuICApOiBSZWFjdC5FbGVtZW50PGFueT4gPT4ge1xyXG4gICAgaWYgKGV4cHJlc3Npb24gPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cclxuICAgICAgICAgIHt2YWx1ZX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnByb3BzLmhpZGVFeHByZXNzaW9uTmFtZSA/IChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtdWktbGF6eS1uZXN0ZWQtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cclxuICAgICAgICAgIHt2YWx1ZX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKSA6IChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtdWktbGF6eS1uZXN0ZWQtdmFsdWUtY29udGFpbmVyIG5hdGl2ZS1rZXktYmluZGluZ3NcIj5cclxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17VmFsdWVDb21wb25lbnRDbGFzc05hbWVzLmlkZW50aWZpZXJ9PlxyXG4gICAgICAgICAgICB7ZXhwcmVzc2lvbn1cclxuICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgIDoge3ZhbHVlfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIF9yZW5kZXJDaGlsZCA9IChjaGlsZDogSUV4cHJlc3Npb24pOiBSZWFjdC5Ob2RlID0+IHtcclxuICAgIGNvbnN0IG5vZGVQYXRoID0gdGhpcy5wcm9wcy5ub2RlUGF0aCArICcvJyArIGNoaWxkLm5hbWU7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8VHJlZUl0ZW0ga2V5PXtub2RlUGF0aH0+XHJcbiAgICAgICAgPEV4cHJlc3Npb25UcmVlTm9kZVxyXG4gICAgICAgICAgZXhwcmVzc2lvbj17Y2hpbGR9XHJcbiAgICAgICAgICBleHBhbnNpb25DYWNoZT17dGhpcy5wcm9wcy5leHBhbnNpb25DYWNoZX1cclxuICAgICAgICAgIG5vZGVQYXRoPXtub2RlUGF0aH1cclxuICAgICAgICAvPlxyXG4gICAgICA8L1RyZWVJdGVtPlxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICBfZ2V0VmFyaWFibGVFeHByZXNzaW9uKCk6ID9JVmFyaWFibGUge1xyXG4gICAgY29uc3Qge2V4cHJlc3Npb259ID0gdGhpcy5wcm9wcztcclxuICAgIHJldHVybiAoZXhwcmVzc2lvbjogYW55KS5jYW5TZXRWYXJpYWJsZSA9PSBudWxsIHx8XHJcbiAgICAgIChleHByZXNzaW9uOiBhbnkpLnNldFZhcmlhYmxlID09IG51bGxcclxuICAgICAgPyBudWxsXHJcbiAgICAgIDogKGV4cHJlc3Npb246IGFueSk7XHJcbiAgfVxyXG5cclxuICBfaXNFZGl0YWJsZSA9ICgpOiBib29sZWFuID0+IHtcclxuICAgIGNvbnN0IHZhcmlhYmxlID0gdGhpcy5fZ2V0VmFyaWFibGVFeHByZXNzaW9uKCk7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICB2YXJpYWJsZSAhPSBudWxsICYmIHZhcmlhYmxlLmNhblNldFZhcmlhYmxlKCkgJiYgIXRoaXMucHJvcHMucmVhZE9ubHlcclxuICAgICk7XHJcbiAgfTtcclxuXHJcbiAgX3VwZGF0ZVZhbHVlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgY29uc3Qge3BlbmRpbmdWYWx1ZX0gPSB0aGlzLnN0YXRlO1xyXG4gICAgY29uc3QgdmFyaWFibGUgPSBudWxsdGhyb3dzKHRoaXMuX2dldFZhcmlhYmxlRXhwcmVzc2lvbigpKTtcclxuXHJcbiAgICBjb25zdCBkb0VkaXQgPSBwZW5kaW5nVmFsdWUgIT0gbnVsbDtcclxuICAgIHRoaXMuX2NhbmNlbEVkaXQoZG9FZGl0KTtcclxuXHJcbiAgICBpZiAoZG9FZGl0KSB7XHJcbiAgICAgIGludmFyaWFudChwZW5kaW5nVmFsdWUgIT0gbnVsbCk7XHJcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IE9ic2VydmFibGUuZnJvbVByb21pc2UoXHJcbiAgICAgICAgdmFyaWFibGUuc2V0VmFyaWFibGUocGVuZGluZ1ZhbHVlKSxcclxuICAgICAgKVxyXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyb3IgIT0gbnVsbCAmJiBlcnJvci5tZXNzYWdlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxyXG4gICAgICAgICAgICAgIGBGYWlsZWQgdG8gc2V0IHZhcmlhYmxlIHZhbHVlOiAke1N0cmluZyhlcnJvci5tZXNzYWdlKX1gLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobnVsbCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVzLnJlbW92ZShzdWJzY3JpcHRpb24pO1xyXG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIHBlbmRpbmdTYXZlOiBmYWxzZSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZXMuYWRkKHN1YnNjcmlwdGlvbik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgX2NhbmNlbEVkaXQgPSAocGVuZGluZ1NhdmU6ID9ib29sZWFuID0gZmFsc2UpOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IG5ld1N0YXRlOiBPYmplY3QgPSB7XHJcbiAgICAgIGlzRWRpdGluZzogZmFsc2UsXHJcbiAgICAgIHBlbmRpbmdWYWx1ZTogbnVsbCxcclxuICAgIH07XHJcbiAgICBpZiAocGVuZGluZ1NhdmUgIT0gbnVsbCkge1xyXG4gICAgICBuZXdTdGF0ZS5wZW5kaW5nU2F2ZSA9IHBlbmRpbmdTYXZlO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XHJcbiAgfTtcclxuXHJcbiAgX3N0YXJ0RWRpdCA9ICgpOiB2b2lkID0+IHtcclxuICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICBpc0VkaXRpbmc6IHRydWUsXHJcbiAgICAgIHBlbmRpbmdWYWx1ZTogbnVsbCxcclxuICAgICAgcGVuZGluZ1NhdmU6IGZhbHNlLFxyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgX2dldFZhbHVlQXNTdHJpbmcgPSAoZXhwcmVzc2lvbjogSUV4cHJlc3Npb24pOiBzdHJpbmcgPT4ge1xyXG4gICAgY29uc3QgdmFsdWUgPSBleHByZXNzaW9uLmdldFZhbHVlKCk7XHJcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiBleHByZXNzaW9uLnR5cGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiBTVFJJTkdfUkVHRVgudGVzdCh2YWx1ZSkgPyB2YWx1ZSA6IGBcIiR7dmFsdWV9XCJgO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlIHx8ICcnO1xyXG4gIH07XHJcblxyXG4gIF9zZXRFZGl0b3JHcmFtbWFyID0gKGVkaXRvcjogP0F0b21JbnB1dCk6IHZvaWQgPT4ge1xyXG4gICAgaWYgKGVkaXRvciA9PSBudWxsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2YXJpYWJsZSA9IHRoaXMuX2dldFZhcmlhYmxlRXhwcmVzc2lvbigpO1xyXG4gICAgaWYgKHZhcmlhYmxlID09IG51bGwpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh2YXJpYWJsZS5ncmFtbWFyTmFtZSAhPSBudWxsICYmIHZhcmlhYmxlLmdyYW1tYXJOYW1lICE9PSAnJykge1xyXG4gICAgICBjb25zdCBncmFtbWFyID0gYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKHZhcmlhYmxlLmdyYW1tYXJOYW1lKTtcclxuICAgICAgaWYgKGdyYW1tYXIgPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBlZGl0b3IuZ2V0VGV4dEVkaXRvcigpLnNldEdyYW1tYXIoZ3JhbW1hcik7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgX3JlbmRlckVkaXRWaWV3ID0gKGV4cHJlc3Npb246IElFeHByZXNzaW9uKTogUmVhY3QuRWxlbWVudDxhbnk+ID0+IHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZXhwcmVzc2lvbi10cmVlLWxpbmUtY29udHJvbFwiPlxyXG4gICAgICAgIDxBdG9tSW5wdXRcclxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS12YWx1ZS1ib3ggaW5saW5lLWJsb2NrXCJcclxuICAgICAgICAgIHNpemU9XCJzbVwiXHJcbiAgICAgICAgICBhdXRvZm9jdXM9e3RydWV9XHJcbiAgICAgICAgICBzdGFydFNlbGVjdGVkPXtmYWxzZX1cclxuICAgICAgICAgIGluaXRpYWxWYWx1ZT17dGhpcy5fZ2V0VmFsdWVBc1N0cmluZyhleHByZXNzaW9uKX1cclxuICAgICAgICAgIG9uRGlkQ2hhbmdlPXtwZW5kaW5nVmFsdWUgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwZW5kaW5nVmFsdWU6IHBlbmRpbmdWYWx1ZS50cmltKCl9KTtcclxuICAgICAgICAgIH19XHJcbiAgICAgICAgICBvbkNvbmZpcm09e3RoaXMuX3VwZGF0ZVZhbHVlfVxyXG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IHRoaXMuX2NhbmNlbEVkaXQoKX1cclxuICAgICAgICAgIG9uQmx1cj17KCkgPT4gdGhpcy5fY2FuY2VsRWRpdCgpfVxyXG4gICAgICAgICAgcmVmPXt0aGlzLl9zZXRFZGl0b3JHcmFtbWFyfVxyXG4gICAgICAgIC8+XHJcbiAgICAgICAgPEljb25cclxuICAgICAgICAgIGljb249XCJjaGVja1wiXHJcbiAgICAgICAgICB0aXRsZT1cIlNhdmUgY2hhbmdlc1wiXHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJleHByZXNzaW9uLXRyZWUtZWRpdC1idXR0b24tY29uZmlybVwiXHJcbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLl91cGRhdGVWYWx1ZX1cclxuICAgICAgICAvPlxyXG4gICAgICAgIDxJY29uXHJcbiAgICAgICAgICBpY29uPVwieFwiXHJcbiAgICAgICAgICB0aXRsZT1cIkNhbmNlbCBjaGFuZ2VzXCJcclxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS1lZGl0LWJ1dHRvbi1jYW5jZWxcIlxyXG4gICAgICAgICAgb25DbGljaz17dGhpcy5fY2FuY2VsRWRpdH1cclxuICAgICAgICAvPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICk7XHJcbiAgfTtcclxuXHJcbiAgX3JlbmRlckVkaXRIb3ZlckNvbnRyb2xzKCk6ID9SZWFjdC5FbGVtZW50PGFueT4ge1xyXG4gICAgaWYgKCF0aGlzLl9pc0VkaXRhYmxlKCkgfHwgdGhpcy5zdGF0ZS5pc0VkaXRpbmcpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRlYnVnZ2VyLXNjb3Blcy12aWV3LWNvbnRyb2xzXCI+XHJcbiAgICAgICAgPEljb25cclxuICAgICAgICAgIGljb249XCJwZW5jaWxcIlxyXG4gICAgICAgICAgY2xhc3NOYW1lPVwiZGVidWdnZXItc2NvcGVzLXZpZXctZWRpdC1jb250cm9sXCJcclxuICAgICAgICAgIG9uQ2xpY2s9e18gPT4ge1xyXG4gICAgICAgICAgICB0cmFjayhFRElUX1ZBTFVFX0ZST01fSUNPTik7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0RWRpdCgpO1xyXG4gICAgICAgICAgfX1cclxuICAgICAgICAvPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKTogUmVhY3QuTm9kZSB7XHJcbiAgICBjb25zdCB7cGVuZGluZywgZXhwcmVzc2lvbn0gPSB0aGlzLnByb3BzO1xyXG4gICAgY29uc3Qge3BlbmRpbmdTYXZlfSA9IHRoaXMuc3RhdGU7XHJcbiAgICBpZiAocGVuZGluZyB8fCBwZW5kaW5nU2F2ZSkge1xyXG4gICAgICAvLyBWYWx1ZSBub3QgYXZhaWxhYmxlIHlldC4gU2hvdyBhIGRlbGF5ZWQgbG9hZGluZyBzcGlubmVyLlxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIDxUcmVlSXRlbSBjbGFzc05hbWU9XCJudWNsaWRlLXVpLWV4cHJlc3Npb24tdHJlZS12YWx1ZS1zcGlubmVyXCI+XHJcbiAgICAgICAgICA8TG9hZGluZ1NwaW5uZXIgc2l6ZT1cIkVYVFJBX1NNQUxMXCIgZGVsYXk9e1NQSU5ORVJfREVMQVl9IC8+XHJcbiAgICAgICAgPC9UcmVlSXRlbT5cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpc0VkaXRhYmxlID0gdGhpcy5faXNFZGl0YWJsZSgpO1xyXG4gICAgaWYgKCF0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xyXG4gICAgICAvLyBUaGlzIGlzIGEgc2ltcGxlIHZhbHVlIHdpdGggbm8gY2hpbGRyZW4uXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgPGRpdlxyXG4gICAgICAgICAgb25Eb3VibGVDbGljaz17XHJcbiAgICAgICAgICAgIGlzRWRpdGFibGUgJiYgIXRoaXMuc3RhdGUuaXNFZGl0aW5nID8gdGhpcy5fc3RhcnRFZGl0IDogKCkgPT4ge31cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNsYXNzTmFtZT1cImV4cHJlc3Npb24tdHJlZS1saW5lLWNvbnRyb2xcIj5cclxuICAgICAgICAgIHt0aGlzLnN0YXRlLmlzRWRpdGluZyA/IChcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyRWRpdFZpZXcoZXhwcmVzc2lvbilcclxuICAgICAgICAgICkgOiAoXHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm5hdGl2ZS1rZXktYmluZGluZ3MgZXhwcmVzc2lvbi10cmVlLXZhbHVlLWJveFwiPlxyXG4gICAgICAgICAgICAgIDxTaW1wbGVWYWx1ZUNvbXBvbmVudCBleHByZXNzaW9uPXtleHByZXNzaW9ufSAvPlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICApfVxyXG4gICAgICAgICAge2lzRWRpdGFibGUgPyB0aGlzLl9yZW5kZXJFZGl0SG92ZXJDb250cm9scygpIDogbnVsbH1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBIG5vZGUgd2l0aCBhIGRlbGF5ZWQgc3Bpbm5lciB0byBkaXNwbGF5IGlmIHdlJ3JlIGV4cGFuZGVkLCBidXQgd2FpdGluZyBmb3JcclxuICAgIC8vIGNoaWxkcmVuIHRvIGJlIGZldGNoZWQuXHJcbiAgICBjb25zdCBwZW5kaW5nQ2hpbGRyZW5Ob2RlID0gKFxyXG4gICAgICA8RXhwcmVzc2lvblRyZWVOb2RlXHJcbiAgICAgICAgZXhwcmVzc2lvbj17dGhpcy5wcm9wcy5leHByZXNzaW9ufVxyXG4gICAgICAgIHBlbmRpbmc9e3RydWV9XHJcbiAgICAgICAgZXhwYW5zaW9uQ2FjaGU9e3RoaXMucHJvcHMuZXhwYW5zaW9uQ2FjaGV9XHJcbiAgICAgICAgbm9kZVBhdGg9e3RoaXMucHJvcHMubm9kZVBhdGh9XHJcbiAgICAgIC8+XHJcbiAgICApO1xyXG5cclxuICAgIC8vIElmIGNvbGxhcHNlZCwgcmVuZGVyIG5vIGNoaWxkcmVuLiBPdGhlcndpc2UgZWl0aGVyIHJlbmRlciB0aGUgcGVuZGluZ0NoaWxkcmVuTm9kZVxyXG4gICAgLy8gaWYgdGhlIGZldGNoIGhhc24ndCBjb21wbGV0ZWQsIG9yIHRoZSBjaGlsZHJlbiBpZiB3ZSd2ZSBnb3QgdGhlbS5cclxuICAgIGxldCBjaGlsZHJlbjtcclxuICAgIGlmICghdGhpcy5zdGF0ZS5leHBhbmRlZCkge1xyXG4gICAgICBjaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuY2hpbGRyZW4uaXNQZW5kaW5nKSB7XHJcbiAgICAgIGNoaWxkcmVuID0gcGVuZGluZ0NoaWxkcmVuTm9kZTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5jaGlsZHJlbi5pc0Vycm9yKSB7XHJcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5fcmVuZGVyVmFsdWVMaW5lKFxyXG4gICAgICAgICdDaGlsZHJlbicsXHJcbiAgICAgICAgdGhpcy5zdGF0ZS5jaGlsZHJlbi5lcnJvciAhPSBudWxsXHJcbiAgICAgICAgICA/IHRoaXMuc3RhdGUuY2hpbGRyZW4uZXJyb3IudG9TdHJpbmcoKVxyXG4gICAgICAgICAgOiBOT1RfQVZBSUxBQkxFX01FU1NBR0UsXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjaGlsZHJlbiA9IHRoaXMuc3RhdGUuY2hpbGRyZW4udmFsdWUubWFwKGNoaWxkID0+XHJcbiAgICAgICAgdGhpcy5fcmVuZGVyQ2hpbGQoY2hpbGQpLFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAoXHJcbiAgICAgIDxUcmVlTGlzdFxyXG4gICAgICAgIHNob3dBcnJvd3M9e3RydWV9XHJcbiAgICAgICAgY2xhc3NOYW1lPVwibnVjbGlkZS11aS1leHByZXNzaW9uLXRyZWUtdmFsdWUtdHJlZWxpc3RcIj5cclxuICAgICAgICA8TmVzdGVkVHJlZUl0ZW1cclxuICAgICAgICAgIGNvbGxhcHNlZD17IXRoaXMuc3RhdGUuZXhwYW5kZWR9XHJcbiAgICAgICAgICBvbkNvbmZpcm09e2lzRWRpdGFibGUgPyB0aGlzLl9zdGFydEVkaXQgOiAoKSA9PiB7fX1cclxuICAgICAgICAgIG9uU2VsZWN0PXt0aGlzLnN0YXRlLmlzRWRpdGluZyA/ICgpID0+IHt9IDogdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkfVxyXG4gICAgICAgICAgdGl0bGU9e1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlLmlzRWRpdGluZ1xyXG4gICAgICAgICAgICAgID8gdGhpcy5fcmVuZGVyRWRpdFZpZXcoZXhwcmVzc2lvbilcclxuICAgICAgICAgICAgICA6IHRoaXMuX3JlbmRlclZhbHVlTGluZShleHByZXNzaW9uLm5hbWUsIGV4cHJlc3Npb24uZ2V0VmFsdWUoKSlcclxuICAgICAgICAgIH0+XHJcbiAgICAgICAgICB7Y2hpbGRyZW59XHJcbiAgICAgICAgPC9OZXN0ZWRUcmVlSXRlbT5cclxuICAgICAgPC9UcmVlTGlzdD5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFByb3BzID0ge3xcclxuICBleHByZXNzaW9uOiBJRXhwcmVzc2lvbixcclxuICBjb250YWluZXJDb250ZXh0OiBPYmplY3QsXHJcbiAgcGVuZGluZz86IGJvb2xlYW4sXHJcbiAgY2xhc3NOYW1lPzogc3RyaW5nLFxyXG4gIGhpZGVFeHByZXNzaW9uTmFtZT86IGJvb2xlYW4sXHJcbiAgcmVhZE9ubHk/OiBib29sZWFuLFxyXG58fTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFeHByZXNzaW9uVHJlZUNvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxcclxuICBFeHByZXNzaW9uVHJlZUNvbXBvbmVudFByb3BzLFxyXG4+IHtcclxuICBjb25zdHJ1Y3Rvcihwcm9wczogRXhwcmVzc2lvblRyZWVDb21wb25lbnRQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpO1xyXG4gIH1cclxuXHJcbiAgX2dldEV4cGFuc2lvbkNhY2hlID0gKCk6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0+IHtcclxuICAgIGxldCBjYWNoZSA9IEV4cGFuc2lvblN0YXRlcy5nZXQodGhpcy5wcm9wcy5jb250YWluZXJDb250ZXh0KTtcclxuICAgIGlmIChjYWNoZSA9PSBudWxsKSB7XHJcbiAgICAgIGNhY2hlID0gbmV3IE1hcCgpO1xyXG4gICAgICBFeHBhbnNpb25TdGF0ZXMuc2V0KHRoaXMucHJvcHMuY29udGFpbmVyQ29udGV4dCwgY2FjaGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNhY2hlO1xyXG4gIH07XHJcblxyXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcclxuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzbmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIHtcclxuICAgICAgJ251Y2xpZGUtdWktZXhwcmVzc2lvbi10cmVlLXZhbHVlJzogdGhpcy5wcm9wcy5jbGFzc05hbWUgPT0gbnVsbCxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHNwYW4gY2xhc3NOYW1lPXtjbGFzc05hbWV9IHRhYkluZGV4PXstMX0+XHJcbiAgICAgICAgPEV4cHJlc3Npb25UcmVlTm9kZVxyXG4gICAgICAgICAgZXhwcmVzc2lvbj17dGhpcy5wcm9wcy5leHByZXNzaW9ufVxyXG4gICAgICAgICAgcGVuZGluZz17dGhpcy5wcm9wcy5wZW5kaW5nfVxyXG4gICAgICAgICAgbm9kZVBhdGg9XCJyb290XCJcclxuICAgICAgICAgIGV4cGFuc2lvbkNhY2hlPXt0aGlzLl9nZXRFeHBhbnNpb25DYWNoZSgpfVxyXG4gICAgICAgICAgaGlkZUV4cHJlc3Npb25OYW1lPXt0aGlzLnByb3BzLmhpZGVFeHByZXNzaW9uTmFtZX1cclxuICAgICAgICAgIHJlYWRPbmx5PXt0aGlzLnByb3BzLnJlYWRPbmx5fVxyXG4gICAgICAgIC8+XHJcbiAgICAgIDwvc3Bhbj5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcbiJdfQ==