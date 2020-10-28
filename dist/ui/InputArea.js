"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _UniversalDisposable = _interopRequireDefault(require("@atom-ide-community/nuclide-commons/UniversalDisposable"));

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _AtomTextEditor = require("@atom-ide-community/nuclide-commons-ui/AtomTextEditor");

var _rxjsCompatUmdMin = require("rxjs-compat/bundles/rxjs-compat.umd.min.js");

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
const ENTER_KEY_CODE = 13;
const UP_KEY_CODE = 38;
const DOWN_KEY_CODE = 40;

class InputArea extends React.Component {
  constructor(props) {
    super(props);
    this._keySubscription = void 0;
    this._textEditorModel = void 0;

    this.focus = () => {
      if (this._textEditorModel != null) {
        this._textEditorModel.getElement().focus();
      }
    };

    this._submit = () => {
      // Clear the text and trigger the `onSubmit` callback
      const editor = this._textEditorModel;

      if (editor == null) {
        return;
      }

      const text = editor.getText();

      if (text === '') {
        return;
      }

      editor.setText(''); // Clear the text field.

      this.props.onSubmit(text);
      this.setState({
        historyIndex: -1
      });
    };

    this._attachLabel = editor => {
      const {
        watchEditor
      } = this.props;
      const disposable = new _UniversalDisposable.default();

      if (watchEditor) {
        disposable.add(watchEditor(editor, ['nuclide-console']));
      }

      return disposable;
    };

    this._handleTextEditor = component => {
      if (this._keySubscription) {
        this._textEditorModel = null;

        this._keySubscription.unsubscribe();
      }

      if (component) {
        this._textEditorModel = component.getModel();

        const el = _reactDom.default.findDOMNode(component);

        this._keySubscription = _rxjsCompatUmdMin.Observable.fromEvent(el, 'keydown').subscribe(this._handleKeyDown);
      }
    };

    this._handleKeyDown = event => {
      const editor = this._textEditorModel; // Detect AutocompletePlus menu element: https://git.io/vddLi

      const isAutocompleteOpen = document.querySelector('autocomplete-suggestion-list') != null;

      if (editor == null) {
        return;
      }

      if (event.which === ENTER_KEY_CODE) {
        // If the current auto complete settings are such that pressing
        // enter does NOT accept a suggestion, and the auto complete box
        // is open, treat enter as submit. Otherwise, let the event
        // propagate so that autocomplete can handle it.
        const setting = atom.config.get('autocomplete-plus.confirmCompletion');
        const enterAcceptsSuggestion = setting == null || String(setting).includes('enter');

        if (!isAutocompleteOpen || !enterAcceptsSuggestion) {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (event.ctrlKey || event.altKey || event.shiftKey) {
            editor.insertNewline();
            return;
          }

          this._submit();
        }
      } else if (event.which === UP_KEY_CODE && (editor.getLineCount() <= 1 || editor.getCursorBufferPosition().row === 0)) {
        if (this.props.history.length === 0 || isAutocompleteOpen) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        const historyIndex = Math.min(this.state.historyIndex + 1, this.props.history.length - 1);

        if (this.state.historyIndex === -1) {
          this.setState({
            historyIndex,
            draft: editor.getText()
          });
        } else {
          this.setState({
            historyIndex
          });
        }

        editor.setText(this.props.history[this.props.history.length - historyIndex - 1]);
      } else if (event.which === DOWN_KEY_CODE && (editor.getLineCount() <= 1 || editor.getCursorBufferPosition().row === editor.getLineCount() - 1)) {
        if (this.props.history.length === 0 || isAutocompleteOpen) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation(); // TODO: (wbinnssmith) T30771435 this setState depends on current state
        // and should use an updater function rather than an object
        // eslint-disable-next-line react/no-access-state-in-setstate

        const historyIndex = Math.max(this.state.historyIndex - 1, -1);
        this.setState({
          historyIndex
        });

        if (historyIndex === -1) {
          editor.setText(this.state.draft);
        } else {
          editor.setText(this.props.history[this.props.history.length - historyIndex - 1]);
        }
      }
    };

    this.state = {
      historyIndex: -1,
      draft: ''
    };
  }

  render() {
    const grammar = this.props.scopeName == null ? null : atom.grammars.grammarForScopeName(this.props.scopeName);
    return /*#__PURE__*/React.createElement("div", {
      className: "console-input-wrapper",
      style: {
        fontSize: `${this.props.fontSize}px`
      }
    }, /*#__PURE__*/React.createElement(_AtomTextEditor.AtomTextEditor, {
      ref: this._handleTextEditor,
      grammar: grammar,
      gutterHidden: true,
      autoGrow: true,
      lineNumberGutterVisible: false,
      onConfirm: this._submit,
      onInitialized: this._attachLabel,
      onDidTextBufferChange: this.props.onDidTextBufferChange,
      placeholderText: this.props.placeholderText
    }));
  }

}

exports.default = InputArea;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklucHV0QXJlYS5qcyJdLCJuYW1lcyI6WyJFTlRFUl9LRVlfQ09ERSIsIlVQX0tFWV9DT0RFIiwiRE9XTl9LRVlfQ09ERSIsIklucHV0QXJlYSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9rZXlTdWJzY3JpcHRpb24iLCJfdGV4dEVkaXRvck1vZGVsIiwiZm9jdXMiLCJnZXRFbGVtZW50IiwiX3N1Ym1pdCIsImVkaXRvciIsInRleHQiLCJnZXRUZXh0Iiwic2V0VGV4dCIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJoaXN0b3J5SW5kZXgiLCJfYXR0YWNoTGFiZWwiLCJ3YXRjaEVkaXRvciIsImRpc3Bvc2FibGUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYWRkIiwiX2hhbmRsZVRleHRFZGl0b3IiLCJjb21wb25lbnQiLCJ1bnN1YnNjcmliZSIsImdldE1vZGVsIiwiZWwiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiT2JzZXJ2YWJsZSIsImZyb21FdmVudCIsInN1YnNjcmliZSIsIl9oYW5kbGVLZXlEb3duIiwiZXZlbnQiLCJpc0F1dG9jb21wbGV0ZU9wZW4iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aGljaCIsInNldHRpbmciLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiIsIlN0cmluZyIsImluY2x1ZGVzIiwicHJldmVudERlZmF1bHQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJpbnNlcnROZXdsaW5lIiwiZ2V0TGluZUNvdW50IiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJyb3ciLCJoaXN0b3J5IiwibGVuZ3RoIiwiTWF0aCIsIm1pbiIsInN0YXRlIiwiZHJhZnQiLCJtYXgiLCJyZW5kZXIiLCJncmFtbWFyIiwic2NvcGVOYW1lIiwiZ3JhbW1hcnMiLCJncmFtbWFyRm9yU2NvcGVOYW1lIiwi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dCwgRmFjZWJvb2ssIEluYy5cclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXHJcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxyXG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cclxuICpcclxuICogQGZsb3cgc3RyaWN0LWxvY2FsXHJcbiAqIEBmb3JtYXRcclxuICovXHJcblxyXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcclxuaW1wb3J0IHtBdG9tVGV4dEVkaXRvcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQXRvbVRleHRFZGl0b3InO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XHJcblxyXG50eXBlIFByb3BzID0ge3xcclxuICBmb250U2l6ZTogbnVtYmVyLFxyXG4gIG9uU3VibWl0OiAodmFsdWU6IHN0cmluZykgPT4gbWl4ZWQsXHJcbiAgc2NvcGVOYW1lOiA/c3RyaW5nLFxyXG4gIGhpc3Rvcnk6IEFycmF5PHN0cmluZz4sXHJcbiAgd2F0Y2hFZGl0b3I6ID9hdG9tJEF1dG9jb21wbGV0ZVdhdGNoRWRpdG9yLFxyXG4gIG9uRGlkVGV4dEJ1ZmZlckNoYW5nZT86IChldmVudDogYXRvbSRBZ2dyZWdhdGVkVGV4dEVkaXRFdmVudCkgPT4gbWl4ZWQsXHJcbiAgcGxhY2Vob2xkZXJUZXh0Pzogc3RyaW5nLFxyXG58fTtcclxuXHJcbnR5cGUgU3RhdGUgPSB7XHJcbiAgaGlzdG9yeUluZGV4OiBudW1iZXIsXHJcbiAgZHJhZnQ6IHN0cmluZyxcclxufTtcclxuXHJcbmNvbnN0IEVOVEVSX0tFWV9DT0RFID0gMTM7XHJcbmNvbnN0IFVQX0tFWV9DT0RFID0gMzg7XHJcbmNvbnN0IERPV05fS0VZX0NPREUgPSA0MDtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElucHV0QXJlYSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcclxuICBfa2V5U3Vic2NyaXB0aW9uOiA/cnhqcyRJU3Vic2NyaXB0aW9uO1xyXG4gIF90ZXh0RWRpdG9yTW9kZWw6ID9hdG9tJFRleHRFZGl0b3I7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpO1xyXG4gICAgdGhpcy5zdGF0ZSA9IHtcclxuICAgICAgaGlzdG9yeUluZGV4OiAtMSxcclxuICAgICAgZHJhZnQ6ICcnLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZvY3VzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JNb2RlbCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JNb2RlbC5nZXRFbGVtZW50KCkuZm9jdXMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBfc3VibWl0ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgLy8gQ2xlYXIgdGhlIHRleHQgYW5kIHRyaWdnZXIgdGhlIGBvblN1Ym1pdGAgY2FsbGJhY2tcclxuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX3RleHRFZGl0b3JNb2RlbDtcclxuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdGV4dCA9IGVkaXRvci5nZXRUZXh0KCk7XHJcbiAgICBpZiAodGV4dCA9PT0gJycpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGVkaXRvci5zZXRUZXh0KCcnKTsgLy8gQ2xlYXIgdGhlIHRleHQgZmllbGQuXHJcbiAgICB0aGlzLnByb3BzLm9uU3VibWl0KHRleHQpO1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4OiAtMX0pO1xyXG4gIH07XHJcblxyXG4gIF9hdHRhY2hMYWJlbCA9IChlZGl0b3I6IGF0b20kVGV4dEVkaXRvcik6IElEaXNwb3NhYmxlID0+IHtcclxuICAgIGNvbnN0IHt3YXRjaEVkaXRvcn0gPSB0aGlzLnByb3BzO1xyXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKCk7XHJcbiAgICBpZiAod2F0Y2hFZGl0b3IpIHtcclxuICAgICAgZGlzcG9zYWJsZS5hZGQod2F0Y2hFZGl0b3IoZWRpdG9yLCBbJ251Y2xpZGUtY29uc29sZSddKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcclxuICB9O1xyXG5cclxuICBfaGFuZGxlVGV4dEVkaXRvciA9IChjb21wb25lbnQ6ID9BdG9tVGV4dEVkaXRvcik6IHZvaWQgPT4ge1xyXG4gICAgaWYgKHRoaXMuX2tleVN1YnNjcmlwdGlvbikge1xyXG4gICAgICB0aGlzLl90ZXh0RWRpdG9yTW9kZWwgPSBudWxsO1xyXG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcclxuICAgIH1cclxuICAgIGlmIChjb21wb25lbnQpIHtcclxuICAgICAgdGhpcy5fdGV4dEVkaXRvck1vZGVsID0gY29tcG9uZW50LmdldE1vZGVsKCk7XHJcbiAgICAgIGNvbnN0IGVsID0gUmVhY3RET00uZmluZERPTU5vZGUoY29tcG9uZW50KTtcclxuICAgICAgdGhpcy5fa2V5U3Vic2NyaXB0aW9uID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoZWwsICdrZXlkb3duJykuc3Vic2NyaWJlKFxyXG4gICAgICAgIHRoaXMuX2hhbmRsZUtleURvd24sXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgX2hhbmRsZUtleURvd24gPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkID0+IHtcclxuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX3RleHRFZGl0b3JNb2RlbDtcclxuICAgIC8vIERldGVjdCBBdXRvY29tcGxldGVQbHVzIG1lbnUgZWxlbWVudDogaHR0cHM6Ly9naXQuaW8vdmRkTGlcclxuICAgIGNvbnN0IGlzQXV0b2NvbXBsZXRlT3BlbiA9XHJcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLWxpc3QnKSAhPSBudWxsO1xyXG4gICAgaWYgKGVkaXRvciA9PSBudWxsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChldmVudC53aGljaCA9PT0gRU5URVJfS0VZX0NPREUpIHtcclxuICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgYXV0byBjb21wbGV0ZSBzZXR0aW5ncyBhcmUgc3VjaCB0aGF0IHByZXNzaW5nXHJcbiAgICAgIC8vIGVudGVyIGRvZXMgTk9UIGFjY2VwdCBhIHN1Z2dlc3Rpb24sIGFuZCB0aGUgYXV0byBjb21wbGV0ZSBib3hcclxuICAgICAgLy8gaXMgb3BlbiwgdHJlYXQgZW50ZXIgYXMgc3VibWl0LiBPdGhlcndpc2UsIGxldCB0aGUgZXZlbnRcclxuICAgICAgLy8gcHJvcGFnYXRlIHNvIHRoYXQgYXV0b2NvbXBsZXRlIGNhbiBoYW5kbGUgaXQuXHJcbiAgICAgIGNvbnN0IHNldHRpbmcgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLmNvbmZpcm1Db21wbGV0aW9uJyk7XHJcbiAgICAgIGNvbnN0IGVudGVyQWNjZXB0c1N1Z2dlc3Rpb24gPVxyXG4gICAgICAgIHNldHRpbmcgPT0gbnVsbCB8fCBTdHJpbmcoc2V0dGluZykuaW5jbHVkZXMoJ2VudGVyJyk7XHJcbiAgICAgIGlmICghaXNBdXRvY29tcGxldGVPcGVuIHx8ICFlbnRlckFjY2VwdHNTdWdnZXN0aW9uKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgICBlZGl0b3IuaW5zZXJ0TmV3bGluZSgpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fc3VibWl0KCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgIGV2ZW50LndoaWNoID09PSBVUF9LRVlfQ09ERSAmJlxyXG4gICAgICAoZWRpdG9yLmdldExpbmVDb3VudCgpIDw9IDEgfHwgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ID09PSAwKVxyXG4gICAgKSB7XHJcbiAgICAgIGlmICh0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoID09PSAwIHx8IGlzQXV0b2NvbXBsZXRlT3Blbikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgY29uc3QgaGlzdG9yeUluZGV4ID0gTWF0aC5taW4oXHJcbiAgICAgICAgdGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggKyAxLFxyXG4gICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSAxLFxyXG4gICAgICApO1xyXG4gICAgICBpZiAodGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggPT09IC0xKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4LCBkcmFmdDogZWRpdG9yLmdldFRleHQoKX0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hpc3RvcnlJbmRleH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVkaXRvci5zZXRUZXh0KFxyXG4gICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeVt0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gaGlzdG9yeUluZGV4IC0gMV0sXHJcbiAgICAgICk7XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICBldmVudC53aGljaCA9PT0gRE9XTl9LRVlfQ09ERSAmJlxyXG4gICAgICAoZWRpdG9yLmdldExpbmVDb3VudCgpIDw9IDEgfHxcclxuICAgICAgICBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgPT09IGVkaXRvci5nZXRMaW5lQ291bnQoKSAtIDEpXHJcbiAgICApIHtcclxuICAgICAgaWYgKHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggPT09IDAgfHwgaXNBdXRvY29tcGxldGVPcGVuKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAvLyBUT0RPOiAod2Jpbm5zc21pdGgpIFQzMDc3MTQzNSB0aGlzIHNldFN0YXRlIGRlcGVuZHMgb24gY3VycmVudCBzdGF0ZVxyXG4gICAgICAvLyBhbmQgc2hvdWxkIHVzZSBhbiB1cGRhdGVyIGZ1bmN0aW9uIHJhdGhlciB0aGFuIGFuIG9iamVjdFxyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3Qvbm8tYWNjZXNzLXN0YXRlLWluLXNldHN0YXRlXHJcbiAgICAgIGNvbnN0IGhpc3RvcnlJbmRleCA9IE1hdGgubWF4KHRoaXMuc3RhdGUuaGlzdG9yeUluZGV4IC0gMSwgLTEpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHtoaXN0b3J5SW5kZXh9KTtcclxuICAgICAgaWYgKGhpc3RvcnlJbmRleCA9PT0gLTEpIHtcclxuICAgICAgICBlZGl0b3Iuc2V0VGV4dCh0aGlzLnN0YXRlLmRyYWZ0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBlZGl0b3Iuc2V0VGV4dChcclxuICAgICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeVt0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gaGlzdG9yeUluZGV4IC0gMV0sXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcclxuICAgIGNvbnN0IGdyYW1tYXIgPVxyXG4gICAgICB0aGlzLnByb3BzLnNjb3BlTmFtZSA9PSBudWxsXHJcbiAgICAgICAgPyBudWxsXHJcbiAgICAgICAgOiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUodGhpcy5wcm9wcy5zY29wZU5hbWUpO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPGRpdlxyXG4gICAgICAgIGNsYXNzTmFtZT1cImNvbnNvbGUtaW5wdXQtd3JhcHBlclwiXHJcbiAgICAgICAgc3R5bGU9e3tmb250U2l6ZTogYCR7dGhpcy5wcm9wcy5mb250U2l6ZX1weGB9fT5cclxuICAgICAgICA8QXRvbVRleHRFZGl0b3JcclxuICAgICAgICAgIHJlZj17dGhpcy5faGFuZGxlVGV4dEVkaXRvcn1cclxuICAgICAgICAgIGdyYW1tYXI9e2dyYW1tYXJ9XHJcbiAgICAgICAgICBndXR0ZXJIaWRkZW5cclxuICAgICAgICAgIGF1dG9Hcm93XHJcbiAgICAgICAgICBsaW5lTnVtYmVyR3V0dGVyVmlzaWJsZT17ZmFsc2V9XHJcbiAgICAgICAgICBvbkNvbmZpcm09e3RoaXMuX3N1Ym1pdH1cclxuICAgICAgICAgIG9uSW5pdGlhbGl6ZWQ9e3RoaXMuX2F0dGFjaExhYmVsfVxyXG4gICAgICAgICAgb25EaWRUZXh0QnVmZmVyQ2hhbmdlPXt0aGlzLnByb3BzLm9uRGlkVGV4dEJ1ZmZlckNoYW5nZX1cclxuICAgICAgICAgIHBsYWNlaG9sZGVyVGV4dD17dGhpcy5wcm9wcy5wbGFjZWhvbGRlclRleHR9XHJcbiAgICAgICAgLz5cclxuICAgICAgPC9kaXY+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG4iXX0=