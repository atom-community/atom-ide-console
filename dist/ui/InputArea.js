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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklucHV0QXJlYS5qcyJdLCJuYW1lcyI6WyJFTlRFUl9LRVlfQ09ERSIsIlVQX0tFWV9DT0RFIiwiRE9XTl9LRVlfQ09ERSIsIklucHV0QXJlYSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9rZXlTdWJzY3JpcHRpb24iLCJfdGV4dEVkaXRvck1vZGVsIiwiZm9jdXMiLCJnZXRFbGVtZW50IiwiX3N1Ym1pdCIsImVkaXRvciIsInRleHQiLCJnZXRUZXh0Iiwic2V0VGV4dCIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJoaXN0b3J5SW5kZXgiLCJfYXR0YWNoTGFiZWwiLCJ3YXRjaEVkaXRvciIsImRpc3Bvc2FibGUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYWRkIiwiX2hhbmRsZVRleHRFZGl0b3IiLCJjb21wb25lbnQiLCJ1bnN1YnNjcmliZSIsImdldE1vZGVsIiwiZWwiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiT2JzZXJ2YWJsZSIsImZyb21FdmVudCIsInN1YnNjcmliZSIsIl9oYW5kbGVLZXlEb3duIiwiZXZlbnQiLCJpc0F1dG9jb21wbGV0ZU9wZW4iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aGljaCIsInNldHRpbmciLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiIsIlN0cmluZyIsImluY2x1ZGVzIiwicHJldmVudERlZmF1bHQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJpbnNlcnROZXdsaW5lIiwiZ2V0TGluZUNvdW50IiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJyb3ciLCJoaXN0b3J5IiwibGVuZ3RoIiwiTWF0aCIsIm1pbiIsInN0YXRlIiwiZHJhZnQiLCJtYXgiLCJyZW5kZXIiLCJncmFtbWFyIiwic2NvcGVOYW1lIiwiZ3JhbW1hcnMiLCJncmFtbWFyRm9yU2NvcGVOYW1lIiwi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IEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAZmxvdyBzdHJpY3QtbG9jYWxcbiAqIEBmb3JtYXRcbiAqL1xuXG5pbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tICdAYXRvbS1pZGUtY29tbXVuaXR5L251Y2xpZGUtY29tbW9ucy9Vbml2ZXJzYWxEaXNwb3NhYmxlJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHtBdG9tVGV4dEVkaXRvcn0gZnJvbSAnQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQXRvbVRleHRFZGl0b3InO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanMnO1xuXG50eXBlIFByb3BzID0ge3xcbiAgZm9udFNpemU6IG51bWJlcixcbiAgb25TdWJtaXQ6ICh2YWx1ZTogc3RyaW5nKSA9PiBtaXhlZCxcbiAgc2NvcGVOYW1lOiA/c3RyaW5nLFxuICBoaXN0b3J5OiBBcnJheTxzdHJpbmc+LFxuICB3YXRjaEVkaXRvcjogP2F0b20kQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IsXG4gIG9uRGlkVGV4dEJ1ZmZlckNoYW5nZT86IChldmVudDogYXRvbSRBZ2dyZWdhdGVkVGV4dEVkaXRFdmVudCkgPT4gbWl4ZWQsXG4gIHBsYWNlaG9sZGVyVGV4dD86IHN0cmluZyxcbnx9O1xuXG50eXBlIFN0YXRlID0ge1xuICBoaXN0b3J5SW5kZXg6IG51bWJlcixcbiAgZHJhZnQ6IHN0cmluZyxcbn07XG5cbmNvbnN0IEVOVEVSX0tFWV9DT0RFID0gMTM7XG5jb25zdCBVUF9LRVlfQ09ERSA9IDM4O1xuY29uc3QgRE9XTl9LRVlfQ09ERSA9IDQwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnB1dEFyZWEgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8UHJvcHMsIFN0YXRlPiB7XG4gIF9rZXlTdWJzY3JpcHRpb246ID9yeGpzJElTdWJzY3JpcHRpb247XG4gIF90ZXh0RWRpdG9yTW9kZWw6ID9hdG9tJFRleHRFZGl0b3I7XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBoaXN0b3J5SW5kZXg6IC0xLFxuICAgICAgZHJhZnQ6ICcnLFxuICAgIH07XG4gIH1cblxuICBmb2N1cyA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5fdGV4dEVkaXRvck1vZGVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JNb2RlbC5nZXRFbGVtZW50KCkuZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgX3N1Ym1pdCA9ICgpOiB2b2lkID0+IHtcbiAgICAvLyBDbGVhciB0aGUgdGV4dCBhbmQgdHJpZ2dlciB0aGUgYG9uU3VibWl0YCBjYWxsYmFja1xuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX3RleHRFZGl0b3JNb2RlbDtcbiAgICBpZiAoZWRpdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gZWRpdG9yLmdldFRleHQoKTtcbiAgICBpZiAodGV4dCA9PT0gJycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlZGl0b3Iuc2V0VGV4dCgnJyk7IC8vIENsZWFyIHRoZSB0ZXh0IGZpZWxkLlxuICAgIHRoaXMucHJvcHMub25TdWJtaXQodGV4dCk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4OiAtMX0pO1xuICB9O1xuXG4gIF9hdHRhY2hMYWJlbCA9IChlZGl0b3I6IGF0b20kVGV4dEVkaXRvcik6IElEaXNwb3NhYmxlID0+IHtcbiAgICBjb25zdCB7d2F0Y2hFZGl0b3J9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKTtcbiAgICBpZiAod2F0Y2hFZGl0b3IpIHtcbiAgICAgIGRpc3Bvc2FibGUuYWRkKHdhdGNoRWRpdG9yKGVkaXRvciwgWydudWNsaWRlLWNvbnNvbGUnXSkpO1xuICAgIH1cbiAgICByZXR1cm4gZGlzcG9zYWJsZTtcbiAgfTtcblxuICBfaGFuZGxlVGV4dEVkaXRvciA9IChjb21wb25lbnQ6ID9BdG9tVGV4dEVkaXRvcik6IHZvaWQgPT4ge1xuICAgIGlmICh0aGlzLl9rZXlTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JNb2RlbCA9IG51bGw7XG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvck1vZGVsID0gY29tcG9uZW50LmdldE1vZGVsKCk7XG4gICAgICBjb25zdCBlbCA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKGNvbXBvbmVudCk7XG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24gPSBPYnNlcnZhYmxlLmZyb21FdmVudChlbCwgJ2tleWRvd24nKS5zdWJzY3JpYmUoXG4gICAgICAgIHRoaXMuX2hhbmRsZUtleURvd24sXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICBfaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX3RleHRFZGl0b3JNb2RlbDtcbiAgICAvLyBEZXRlY3QgQXV0b2NvbXBsZXRlUGx1cyBtZW51IGVsZW1lbnQ6IGh0dHBzOi8vZ2l0LmlvL3ZkZExpXG4gICAgY29uc3QgaXNBdXRvY29tcGxldGVPcGVuID1cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLWxpc3QnKSAhPSBudWxsO1xuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IEVOVEVSX0tFWV9DT0RFKSB7XG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBhdXRvIGNvbXBsZXRlIHNldHRpbmdzIGFyZSBzdWNoIHRoYXQgcHJlc3NpbmdcbiAgICAgIC8vIGVudGVyIGRvZXMgTk9UIGFjY2VwdCBhIHN1Z2dlc3Rpb24sIGFuZCB0aGUgYXV0byBjb21wbGV0ZSBib3hcbiAgICAgIC8vIGlzIG9wZW4sIHRyZWF0IGVudGVyIGFzIHN1Ym1pdC4gT3RoZXJ3aXNlLCBsZXQgdGhlIGV2ZW50XG4gICAgICAvLyBwcm9wYWdhdGUgc28gdGhhdCBhdXRvY29tcGxldGUgY2FuIGhhbmRsZSBpdC5cbiAgICAgIGNvbnN0IHNldHRpbmcgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLmNvbmZpcm1Db21wbGV0aW9uJyk7XG4gICAgICBjb25zdCBlbnRlckFjY2VwdHNTdWdnZXN0aW9uID1cbiAgICAgICAgc2V0dGluZyA9PSBudWxsIHx8IFN0cmluZyhzZXR0aW5nKS5pbmNsdWRlcygnZW50ZXInKTtcbiAgICAgIGlmICghaXNBdXRvY29tcGxldGVPcGVuIHx8ICFlbnRlckFjY2VwdHNTdWdnZXN0aW9uKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSB8fCBldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgIGVkaXRvci5pbnNlcnROZXdsaW5lKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3VibWl0KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGV2ZW50LndoaWNoID09PSBVUF9LRVlfQ09ERSAmJlxuICAgICAgKGVkaXRvci5nZXRMaW5lQ291bnQoKSA8PSAxIHx8IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyA9PT0gMClcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoID09PSAwIHx8IGlzQXV0b2NvbXBsZXRlT3Blbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICBjb25zdCBoaXN0b3J5SW5kZXggPSBNYXRoLm1pbihcbiAgICAgICAgdGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggKyAxLFxuICAgICAgICB0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gMSxcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggPT09IC0xKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hpc3RvcnlJbmRleCwgZHJhZnQ6IGVkaXRvci5nZXRUZXh0KCl9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2hpc3RvcnlJbmRleH0pO1xuICAgICAgfVxuICAgICAgZWRpdG9yLnNldFRleHQoXG4gICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeVt0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gaGlzdG9yeUluZGV4IC0gMV0sXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBldmVudC53aGljaCA9PT0gRE9XTl9LRVlfQ09ERSAmJlxuICAgICAgKGVkaXRvci5nZXRMaW5lQ291bnQoKSA8PSAxIHx8XG4gICAgICAgIGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyA9PT0gZWRpdG9yLmdldExpbmVDb3VudCgpIC0gMSlcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoID09PSAwIHx8IGlzQXV0b2NvbXBsZXRlT3Blbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAvLyBUT0RPOiAod2Jpbm5zc21pdGgpIFQzMDc3MTQzNSB0aGlzIHNldFN0YXRlIGRlcGVuZHMgb24gY3VycmVudCBzdGF0ZVxuICAgICAgLy8gYW5kIHNob3VsZCB1c2UgYW4gdXBkYXRlciBmdW5jdGlvbiByYXRoZXIgdGhhbiBhbiBvYmplY3RcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC9uby1hY2Nlc3Mtc3RhdGUtaW4tc2V0c3RhdGVcbiAgICAgIGNvbnN0IGhpc3RvcnlJbmRleCA9IE1hdGgubWF4KHRoaXMuc3RhdGUuaGlzdG9yeUluZGV4IC0gMSwgLTEpO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7aGlzdG9yeUluZGV4fSk7XG4gICAgICBpZiAoaGlzdG9yeUluZGV4ID09PSAtMSkge1xuICAgICAgICBlZGl0b3Iuc2V0VGV4dCh0aGlzLnN0YXRlLmRyYWZ0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVkaXRvci5zZXRUZXh0KFxuICAgICAgICAgIHRoaXMucHJvcHMuaGlzdG9yeVt0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gaGlzdG9yeUluZGV4IC0gMV0sXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJlbmRlcigpOiBSZWFjdC5Ob2RlIHtcbiAgICBjb25zdCBncmFtbWFyID1cbiAgICAgIHRoaXMucHJvcHMuc2NvcGVOYW1lID09IG51bGxcbiAgICAgICAgPyBudWxsXG4gICAgICAgIDogYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKHRoaXMucHJvcHMuc2NvcGVOYW1lKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdlxuICAgICAgICBjbGFzc05hbWU9XCJjb25zb2xlLWlucHV0LXdyYXBwZXJcIlxuICAgICAgICBzdHlsZT17e2ZvbnRTaXplOiBgJHt0aGlzLnByb3BzLmZvbnRTaXplfXB4YH19PlxuICAgICAgICA8QXRvbVRleHRFZGl0b3JcbiAgICAgICAgICByZWY9e3RoaXMuX2hhbmRsZVRleHRFZGl0b3J9XG4gICAgICAgICAgZ3JhbW1hcj17Z3JhbW1hcn1cbiAgICAgICAgICBndXR0ZXJIaWRkZW5cbiAgICAgICAgICBhdXRvR3Jvd1xuICAgICAgICAgIGxpbmVOdW1iZXJHdXR0ZXJWaXNpYmxlPXtmYWxzZX1cbiAgICAgICAgICBvbkNvbmZpcm09e3RoaXMuX3N1Ym1pdH1cbiAgICAgICAgICBvbkluaXRpYWxpemVkPXt0aGlzLl9hdHRhY2hMYWJlbH1cbiAgICAgICAgICBvbkRpZFRleHRCdWZmZXJDaGFuZ2U9e3RoaXMucHJvcHMub25EaWRUZXh0QnVmZmVyQ2hhbmdlfVxuICAgICAgICAgIHBsYWNlaG9sZGVyVGV4dD17dGhpcy5wcm9wcy5wbGFjZWhvbGRlclRleHR9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG4iXX0=