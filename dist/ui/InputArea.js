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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklucHV0QXJlYS5qcyJdLCJuYW1lcyI6WyJFTlRFUl9LRVlfQ09ERSIsIlVQX0tFWV9DT0RFIiwiRE9XTl9LRVlfQ09ERSIsIklucHV0QXJlYSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9rZXlTdWJzY3JpcHRpb24iLCJfdGV4dEVkaXRvck1vZGVsIiwiZm9jdXMiLCJnZXRFbGVtZW50IiwiX3N1Ym1pdCIsImVkaXRvciIsInRleHQiLCJnZXRUZXh0Iiwic2V0VGV4dCIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJoaXN0b3J5SW5kZXgiLCJfYXR0YWNoTGFiZWwiLCJ3YXRjaEVkaXRvciIsImRpc3Bvc2FibGUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYWRkIiwiX2hhbmRsZVRleHRFZGl0b3IiLCJjb21wb25lbnQiLCJ1bnN1YnNjcmliZSIsImdldE1vZGVsIiwiZWwiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiT2JzZXJ2YWJsZSIsImZyb21FdmVudCIsInN1YnNjcmliZSIsIl9oYW5kbGVLZXlEb3duIiwiZXZlbnQiLCJpc0F1dG9jb21wbGV0ZU9wZW4iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aGljaCIsInNldHRpbmciLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiIsIlN0cmluZyIsImluY2x1ZGVzIiwicHJldmVudERlZmF1bHQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJpbnNlcnROZXdsaW5lIiwiZ2V0TGluZUNvdW50IiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJyb3ciLCJoaXN0b3J5IiwibGVuZ3RoIiwiTWF0aCIsIm1pbiIsInN0YXRlIiwiZHJhZnQiLCJtYXgiLCJyZW5kZXIiLCJncmFtbWFyIiwic2NvcGVOYW1lIiwiZ3JhbW1hcnMiLCJncmFtbWFyRm9yU2NvcGVOYW1lIiwi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QUFYLENBQW1CLEtBQUtsRCxLQUFMLENBQVdrRCxPQUFYLENBQW1CQyxNQUFuQixHQUE0QnZDLFlBQTVCLEdBQTJDLENBQTlELENBREY7QUFHRDtBQUNGO0FBQ0YsS0E3SHlCOztBQUV4QixTQUFLMEMsS0FBTCxHQUFhO0FBQ1gxQyxNQUFBQSxZQUFZLEVBQUUsQ0FBQyxDQURKO0FBRVgyQyxNQUFBQSxLQUFLLEVBQUU7QUFGSSxLQUFiO0FBSUQ7O0FBeUhERSxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsT0FBTyxHQUNYLEtBQUsxRCxLQUFMLENBQVcyRCxTQUFYLElBQXdCLElBQXhCLEdBQ0ksSUFESixHQUVJeEIsSUFBSSxDQUFDeUIsUUFBTCxDQUFjQyxtQkFBZCxDQUFrQyxLQUFLN0QsS0FBTCxDQUFXMkQsU0FBN0MsQ0FITjtBQUlBLHdCQUNFO0FBQ0UsTUFBQSxTQUFTLEVBQUMsdUJBRFo7QUFFRSxNQUFBLEtBQUssRUFBRTtBQUFDRyxRQUFBQSxRQUFRLEVBQUcsR0FBRSxLQUFLOUQsS0FBTCxDQUFXOEQsUUFBUztBQUFsQztBQUZULG9CQUdFLG9CQUFDLDhCQUFEO0FBQ0UsTUFBQSxHQUFHLEVBQUUsS0FBSzVDLGlCQURaO0FBRUUsTUFBQSxPQUFPLEVBQUV3QyxPQUZYO0FBR0UsTUFBQSxZQUFZLE1BSGQ7QUFJRSxNQUFBLFFBQVEsTUFKVjtBQUtFLE1BQUEsdUJBQXVCLEVBQUUsS0FMM0I7QUFNRSxNQUFBLFNBQVMsRUFBRSxLQUFLckQsT0FObEI7QUFPRSxNQUFBLGFBQWEsRUFBRSxLQUFLUSxZQVB0QjtBQVFFLE1BQUEscUJBQXFCLEVBQUUsS0FBS2IsS0FBTCxDQUFXK0QscUJBUnBDO0FBU0UsTUFBQSxlQUFlLEVBQUUsS0FBSy9ELEtBQUwsQ0FBV2dFO0FBVDlCLE1BSEYsQ0FERjtBQWlCRDs7QUF6SmtFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTctcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBmbG93IHN0cmljdC1sb2NhbFxuICogQGZvcm1hdFxuICovXG5cbmltcG9ydCBVbml2ZXJzYWxEaXNwb3NhYmxlIGZyb20gJ0BhdG9tLWlkZS1jb21tdW5pdHkvbnVjbGlkZS1jb21tb25zL1VuaXZlcnNhbERpc3Bvc2FibGUnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQge0F0b21UZXh0RWRpdG9yfSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy11aS9BdG9tVGV4dEVkaXRvcic7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qcyc7XG5cbnR5cGUgUHJvcHMgPSB7fFxuICBmb250U2l6ZTogbnVtYmVyLFxuICBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IG1peGVkLFxuICBzY29wZU5hbWU6ID9zdHJpbmcsXG4gIGhpc3Rvcnk6IEFycmF5PHN0cmluZz4sXG4gIHdhdGNoRWRpdG9yOiA/YXRvbSRBdXRvY29tcGxldGVXYXRjaEVkaXRvcixcbiAgb25EaWRUZXh0QnVmZmVyQ2hhbmdlPzogKGV2ZW50OiBhdG9tJEFnZ3JlZ2F0ZWRUZXh0RWRpdEV2ZW50KSA9PiBtaXhlZCxcbiAgcGxhY2Vob2xkZXJUZXh0Pzogc3RyaW5nLFxufH07XG5cbnR5cGUgU3RhdGUgPSB7XG4gIGhpc3RvcnlJbmRleDogbnVtYmVyLFxuICBkcmFmdDogc3RyaW5nLFxufTtcblxuY29uc3QgRU5URVJfS0VZX0NPREUgPSAxMztcbmNvbnN0IFVQX0tFWV9DT0RFID0gMzg7XG5jb25zdCBET1dOX0tFWV9DT0RFID0gNDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElucHV0QXJlYSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcbiAgX2tleVN1YnNjcmlwdGlvbjogP3J4anMkSVN1YnNjcmlwdGlvbjtcbiAgX3RleHRFZGl0b3JNb2RlbDogP2F0b20kVGV4dEVkaXRvcjtcblxuICBjb25zdHJ1Y3Rvcihwcm9wczogUHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGhpc3RvcnlJbmRleDogLTEsXG4gICAgICBkcmFmdDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGZvY3VzID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICh0aGlzLl90ZXh0RWRpdG9yTW9kZWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvck1vZGVsLmdldEVsZW1lbnQoKS5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxuICBfc3VibWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgIC8vIENsZWFyIHRoZSB0ZXh0IGFuZCB0cmlnZ2VyIHRoZSBgb25TdWJtaXRgIGNhbGxiYWNrXG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5fdGV4dEVkaXRvck1vZGVsO1xuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIGlmICh0ZXh0ID09PSAnJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVkaXRvci5zZXRUZXh0KCcnKTsgLy8gQ2xlYXIgdGhlIHRleHQgZmllbGQuXG4gICAgdGhpcy5wcm9wcy5vblN1Ym1pdCh0ZXh0KTtcbiAgICB0aGlzLnNldFN0YXRlKHtoaXN0b3J5SW5kZXg6IC0xfSk7XG4gIH07XG5cbiAgX2F0dGFjaExhYmVsID0gKGVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKTogSURpc3Bvc2FibGUgPT4ge1xuICAgIGNvbnN0IHt3YXRjaEVkaXRvcn0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgVW5pdmVyc2FsRGlzcG9zYWJsZSgpO1xuICAgIGlmICh3YXRjaEVkaXRvcikge1xuICAgICAgZGlzcG9zYWJsZS5hZGQod2F0Y2hFZGl0b3IoZWRpdG9yLCBbJ251Y2xpZGUtY29uc29sZSddKSk7XG4gICAgfVxuICAgIHJldHVybiBkaXNwb3NhYmxlO1xuICB9O1xuXG4gIF9oYW5kbGVUZXh0RWRpdG9yID0gKGNvbXBvbmVudDogP0F0b21UZXh0RWRpdG9yKTogdm9pZCA9PiB7XG4gICAgaWYgKHRoaXMuX2tleVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvck1vZGVsID0gbnVsbDtcbiAgICAgIHRoaXMuX2tleVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yTW9kZWwgPSBjb21wb25lbnQuZ2V0TW9kZWwoKTtcbiAgICAgIGNvbnN0IGVsID0gUmVhY3RET00uZmluZERPTU5vZGUoY29tcG9uZW50KTtcbiAgICAgIHRoaXMuX2tleVN1YnNjcmlwdGlvbiA9IE9ic2VydmFibGUuZnJvbUV2ZW50KGVsLCAna2V5ZG93bicpLnN1YnNjcmliZShcbiAgICAgICAgdGhpcy5faGFuZGxlS2V5RG93bixcbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIF9oYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5fdGV4dEVkaXRvck1vZGVsO1xuICAgIC8vIERldGVjdCBBdXRvY29tcGxldGVQbHVzIG1lbnUgZWxlbWVudDogaHR0cHM6Ly9naXQuaW8vdmRkTGlcbiAgICBjb25zdCBpc0F1dG9jb21wbGV0ZU9wZW4gPVxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24tbGlzdCcpICE9IG51bGw7XG4gICAgaWYgKGVkaXRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC53aGljaCA9PT0gRU5URVJfS0VZX0NPREUpIHtcbiAgICAgIC8vIElmIHRoZSBjdXJyZW50IGF1dG8gY29tcGxldGUgc2V0dGluZ3MgYXJlIHN1Y2ggdGhhdCBwcmVzc2luZ1xuICAgICAgLy8gZW50ZXIgZG9lcyBOT1QgYWNjZXB0IGEgc3VnZ2VzdGlvbiwgYW5kIHRoZSBhdXRvIGNvbXBsZXRlIGJveFxuICAgICAgLy8gaXMgb3BlbiwgdHJlYXQgZW50ZXIgYXMgc3VibWl0LiBPdGhlcndpc2UsIGxldCB0aGUgZXZlbnRcbiAgICAgIC8vIHByb3BhZ2F0ZSBzbyB0aGF0IGF1dG9jb21wbGV0ZSBjYW4gaGFuZGxlIGl0LlxuICAgICAgY29uc3Qgc2V0dGluZyA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuY29uZmlybUNvbXBsZXRpb24nKTtcbiAgICAgIGNvbnN0IGVudGVyQWNjZXB0c1N1Z2dlc3Rpb24gPVxuICAgICAgICBzZXR0aW5nID09IG51bGwgfHwgU3RyaW5nKHNldHRpbmcpLmluY2x1ZGVzKCdlbnRlcicpO1xuICAgICAgaWYgKCFpc0F1dG9jb21wbGV0ZU9wZW4gfHwgIWVudGVyQWNjZXB0c1N1Z2dlc3Rpb24pIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgfHwgZXZlbnQuYWx0S2V5IHx8IGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgZWRpdG9yLmluc2VydE5ld2xpbmUoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdWJtaXQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgZXZlbnQud2hpY2ggPT09IFVQX0tFWV9DT0RFICYmXG4gICAgICAoZWRpdG9yLmdldExpbmVDb3VudCgpIDw9IDEgfHwgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ID09PSAwKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggPT09IDAgfHwgaXNBdXRvY29tcGxldGVPcGVuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGNvbnN0IGhpc3RvcnlJbmRleCA9IE1hdGgubWluKFxuICAgICAgICB0aGlzLnN0YXRlLmhpc3RvcnlJbmRleCArIDEsXG4gICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSAxLFxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLnN0YXRlLmhpc3RvcnlJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4LCBkcmFmdDogZWRpdG9yLmdldFRleHQoKX0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4fSk7XG4gICAgICB9XG4gICAgICBlZGl0b3Iuc2V0VGV4dChcbiAgICAgICAgdGhpcy5wcm9wcy5oaXN0b3J5W3RoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSBoaXN0b3J5SW5kZXggLSAxXSxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGV2ZW50LndoaWNoID09PSBET1dOX0tFWV9DT0RFICYmXG4gICAgICAoZWRpdG9yLmdldExpbmVDb3VudCgpIDw9IDEgfHxcbiAgICAgICAgZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ID09PSBlZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggPT09IDAgfHwgaXNBdXRvY29tcGxldGVPcGVuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIC8vIFRPRE86ICh3YmlubnNzbWl0aCkgVDMwNzcxNDM1IHRoaXMgc2V0U3RhdGUgZGVwZW5kcyBvbiBjdXJyZW50IHN0YXRlXG4gICAgICAvLyBhbmQgc2hvdWxkIHVzZSBhbiB1cGRhdGVyIGZ1bmN0aW9uIHJhdGhlciB0aGFuIGFuIG9iamVjdFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0L25vLWFjY2Vzcy1zdGF0ZS1pbi1zZXRzdGF0ZVxuICAgICAgY29uc3QgaGlzdG9yeUluZGV4ID0gTWF0aC5tYXgodGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggLSAxLCAtMSk7XG4gICAgICB0aGlzLnNldFN0YXRlKHtoaXN0b3J5SW5kZXh9KTtcbiAgICAgIGlmIChoaXN0b3J5SW5kZXggPT09IC0xKSB7XG4gICAgICAgIGVkaXRvci5zZXRUZXh0KHRoaXMuc3RhdGUuZHJhZnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWRpdG9yLnNldFRleHQoXG4gICAgICAgICAgdGhpcy5wcm9wcy5oaXN0b3J5W3RoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSBoaXN0b3J5SW5kZXggLSAxXSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIGNvbnN0IGdyYW1tYXIgPVxuICAgICAgdGhpcy5wcm9wcy5zY29wZU5hbWUgPT0gbnVsbFxuICAgICAgICA/IG51bGxcbiAgICAgICAgOiBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUodGhpcy5wcm9wcy5zY29wZU5hbWUpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzTmFtZT1cImNvbnNvbGUtaW5wdXQtd3JhcHBlclwiXG4gICAgICAgIHN0eWxlPXt7Zm9udFNpemU6IGAke3RoaXMucHJvcHMuZm9udFNpemV9cHhgfX0+XG4gICAgICAgIDxBdG9tVGV4dEVkaXRvclxuICAgICAgICAgIHJlZj17dGhpcy5faGFuZGxlVGV4dEVkaXRvcn1cbiAgICAgICAgICBncmFtbWFyPXtncmFtbWFyfVxuICAgICAgICAgIGd1dHRlckhpZGRlblxuICAgICAgICAgIGF1dG9Hcm93XG4gICAgICAgICAgbGluZU51bWJlckd1dHRlclZpc2libGU9e2ZhbHNlfVxuICAgICAgICAgIG9uQ29uZmlybT17dGhpcy5fc3VibWl0fVxuICAgICAgICAgIG9uSW5pdGlhbGl6ZWQ9e3RoaXMuX2F0dGFjaExhYmVsfVxuICAgICAgICAgIG9uRGlkVGV4dEJ1ZmZlckNoYW5nZT17dGhpcy5wcm9wcy5vbkRpZFRleHRCdWZmZXJDaGFuZ2V9XG4gICAgICAgICAgcGxhY2Vob2xkZXJUZXh0PXt0aGlzLnByb3BzLnBsYWNlaG9sZGVyVGV4dH1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cbiJdfQ==