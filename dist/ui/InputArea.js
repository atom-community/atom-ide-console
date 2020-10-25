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

      if (text === "") {
        return;
      }

      editor.setText(""); // Clear the text field.

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
        disposable.add(watchEditor(editor, ["nuclide-console"]));
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

        this._keySubscription = _rxjsCompatUmdMin.Observable.fromEvent(el, "keydown").subscribe(this._handleKeyDown);
      }
    };

    this._handleKeyDown = event => {
      const editor = this._textEditorModel; // Detect AutocompletePlus menu element: https://git.io/vddLi

      const isAutocompleteOpen = document.querySelector("autocomplete-suggestion-list") != null;

      if (editor == null) {
        return;
      }

      if (event.which === ENTER_KEY_CODE) {
        // If the current auto complete settings are such that pressing
        // enter does NOT accept a suggestion, and the auto complete box
        // is open, treat enter as submit. Otherwise, let the event
        // propagate so that autocomplete can handle it.
        const setting = atom.config.get("autocomplete-plus.confirmCompletion");
        const enterAcceptsSuggestion = setting == null || String(setting).includes("enter");

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
      draft: ""
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklucHV0QXJlYS5qcyJdLCJuYW1lcyI6WyJFTlRFUl9LRVlfQ09ERSIsIlVQX0tFWV9DT0RFIiwiRE9XTl9LRVlfQ09ERSIsIklucHV0QXJlYSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9rZXlTdWJzY3JpcHRpb24iLCJfdGV4dEVkaXRvck1vZGVsIiwiZm9jdXMiLCJnZXRFbGVtZW50IiwiX3N1Ym1pdCIsImVkaXRvciIsInRleHQiLCJnZXRUZXh0Iiwic2V0VGV4dCIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJoaXN0b3J5SW5kZXgiLCJfYXR0YWNoTGFiZWwiLCJ3YXRjaEVkaXRvciIsImRpc3Bvc2FibGUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYWRkIiwiX2hhbmRsZVRleHRFZGl0b3IiLCJjb21wb25lbnQiLCJ1bnN1YnNjcmliZSIsImdldE1vZGVsIiwiZWwiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiT2JzZXJ2YWJsZSIsImZyb21FdmVudCIsInN1YnNjcmliZSIsIl9oYW5kbGVLZXlEb3duIiwiZXZlbnQiLCJpc0F1dG9jb21wbGV0ZU9wZW4iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aGljaCIsInNldHRpbmciLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiIsIlN0cmluZyIsImluY2x1ZGVzIiwicHJldmVudERlZmF1bHQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJpbnNlcnROZXdsaW5lIiwiZ2V0TGluZUNvdW50IiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJyb3ciLCJoaXN0b3J5IiwibGVuZ3RoIiwiTWF0aCIsIm1pbiIsInN0YXRlIiwiZHJhZnQiLCJtYXgiLCJyZW5kZXIiLCJncmFtbWFyIiwic2NvcGVOYW1lIiwiZ3JhbW1hcnMiLCJncmFtbWFyRm9yU2NvcGVOYW1lIiwi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RCxLQUFMLENBQVdrRCxPQUFYLENBQW1CQyxNQUFuQixHQUE0QnZDLFlBQTVCLEdBQTJDLENBQTlELENBQWY7QUFDRDtBQUNGO0FBQ0YsS0FqSHlCOztBQUV4QixTQUFLMEMsS0FBTCxHQUFhO0FBQ1gxQyxNQUFBQSxZQUFZLEVBQUUsQ0FBQyxDQURKO0FBRVgyQyxNQUFBQSxLQUFLLEVBQUU7QUFGSSxLQUFiO0FBSUQ7O0FBNkdERSxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsT0FBTyxHQUFHLEtBQUsxRCxLQUFMLENBQVcyRCxTQUFYLElBQXdCLElBQXhCLEdBQStCLElBQS9CLEdBQXNDeEIsSUFBSSxDQUFDeUIsUUFBTCxDQUFjQyxtQkFBZCxDQUFrQyxLQUFLN0QsS0FBTCxDQUFXMkQsU0FBN0MsQ0FBdEQ7QUFDQSx3QkFDRTtBQUFLLE1BQUEsU0FBUyxFQUFDLHVCQUFmO0FBQXVDLE1BQUEsS0FBSyxFQUFFO0FBQUVHLFFBQUFBLFFBQVEsRUFBRyxHQUFFLEtBQUs5RCxLQUFMLENBQVc4RCxRQUFTO0FBQW5DO0FBQTlDLG9CQUNFLG9CQUFDLDhCQUFEO0FBQ0UsTUFBQSxHQUFHLEVBQUUsS0FBSzVDLGlCQURaO0FBRUUsTUFBQSxPQUFPLEVBQUV3QyxPQUZYO0FBR0UsTUFBQSxZQUFZLE1BSGQ7QUFJRSxNQUFBLFFBQVEsTUFKVjtBQUtFLE1BQUEsdUJBQXVCLEVBQUUsS0FMM0I7QUFNRSxNQUFBLFNBQVMsRUFBRSxLQUFLckQsT0FObEI7QUFPRSxNQUFBLGFBQWEsRUFBRSxLQUFLUSxZQVB0QjtBQVFFLE1BQUEscUJBQXFCLEVBQUUsS0FBS2IsS0FBTCxDQUFXK0QscUJBUnBDO0FBU0UsTUFBQSxlQUFlLEVBQUUsS0FBSy9ELEtBQUwsQ0FBV2dFO0FBVDlCLE1BREYsQ0FERjtBQWVEOztBQXhJa0UiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZVwiXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IFJlYWN0RE9NIGZyb20gXCJyZWFjdC1kb21cIlxuaW1wb3J0IHsgQXRvbVRleHRFZGl0b3IgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQXRvbVRleHRFZGl0b3JcIlxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzLWNvbXBhdC9idW5kbGVzL3J4anMtY29tcGF0LnVtZC5taW4uanNcIlxuXG50eXBlIFByb3BzID0ge1xuICBmb250U2l6ZTogbnVtYmVyLFxuICBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IG1peGVkLFxuICBzY29wZU5hbWU6ID9zdHJpbmcsXG4gIGhpc3Rvcnk6IEFycmF5PHN0cmluZz4sXG4gIHdhdGNoRWRpdG9yOiA/YXRvbSRBdXRvY29tcGxldGVXYXRjaEVkaXRvcixcbiAgb25EaWRUZXh0QnVmZmVyQ2hhbmdlPzogKGV2ZW50OiBhdG9tJEFnZ3JlZ2F0ZWRUZXh0RWRpdEV2ZW50KSA9PiBtaXhlZCxcbiAgcGxhY2Vob2xkZXJUZXh0Pzogc3RyaW5nLFxufVxuXG50eXBlIFN0YXRlID0ge1xuICBoaXN0b3J5SW5kZXg6IG51bWJlcixcbiAgZHJhZnQ6IHN0cmluZyxcbn1cblxuY29uc3QgRU5URVJfS0VZX0NPREUgPSAxM1xuY29uc3QgVVBfS0VZX0NPREUgPSAzOFxuY29uc3QgRE9XTl9LRVlfQ09ERSA9IDQwXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElucHV0QXJlYSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudDxQcm9wcywgU3RhdGU+IHtcbiAgX2tleVN1YnNjcmlwdGlvbjogP3J4anMkSVN1YnNjcmlwdGlvblxuICBfdGV4dEVkaXRvck1vZGVsOiA/YXRvbSRUZXh0RWRpdG9yXG5cbiAgY29uc3RydWN0b3IocHJvcHM6IFByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGhpc3RvcnlJbmRleDogLTEsXG4gICAgICBkcmFmdDogXCJcIixcbiAgICB9XG4gIH1cblxuICBmb2N1cyA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5fdGV4dEVkaXRvck1vZGVsICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JNb2RlbC5nZXRFbGVtZW50KCkuZm9jdXMoKVxuICAgIH1cbiAgfVxuXG4gIF9zdWJtaXQgPSAoKTogdm9pZCA9PiB7XG4gICAgLy8gQ2xlYXIgdGhlIHRleHQgYW5kIHRyaWdnZXIgdGhlIGBvblN1Ym1pdGAgY2FsbGJhY2tcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl90ZXh0RWRpdG9yTW9kZWxcbiAgICBpZiAoZWRpdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpXG4gICAgaWYgKHRleHQgPT09IFwiXCIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGVkaXRvci5zZXRUZXh0KFwiXCIpIC8vIENsZWFyIHRoZSB0ZXh0IGZpZWxkLlxuICAgIHRoaXMucHJvcHMub25TdWJtaXQodGV4dClcbiAgICB0aGlzLnNldFN0YXRlKHsgaGlzdG9yeUluZGV4OiAtMSB9KVxuICB9XG5cbiAgX2F0dGFjaExhYmVsID0gKGVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKTogSURpc3Bvc2FibGUgPT4ge1xuICAgIGNvbnN0IHsgd2F0Y2hFZGl0b3IgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IFVuaXZlcnNhbERpc3Bvc2FibGUoKVxuICAgIGlmICh3YXRjaEVkaXRvcikge1xuICAgICAgZGlzcG9zYWJsZS5hZGQod2F0Y2hFZGl0b3IoZWRpdG9yLCBbXCJudWNsaWRlLWNvbnNvbGVcIl0pKVxuICAgIH1cbiAgICByZXR1cm4gZGlzcG9zYWJsZVxuICB9XG5cbiAgX2hhbmRsZVRleHRFZGl0b3IgPSAoY29tcG9uZW50OiA/QXRvbVRleHRFZGl0b3IpOiB2b2lkID0+IHtcbiAgICBpZiAodGhpcy5fa2V5U3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yTW9kZWwgPSBudWxsXG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKVxuICAgIH1cbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yTW9kZWwgPSBjb21wb25lbnQuZ2V0TW9kZWwoKVxuICAgICAgY29uc3QgZWwgPSBSZWFjdERPTS5maW5kRE9NTm9kZShjb21wb25lbnQpXG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24gPSBPYnNlcnZhYmxlLmZyb21FdmVudChlbCwgXCJrZXlkb3duXCIpLnN1YnNjcmliZSh0aGlzLl9oYW5kbGVLZXlEb3duKVxuICAgIH1cbiAgfVxuXG4gIF9oYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgY29uc3QgZWRpdG9yID0gdGhpcy5fdGV4dEVkaXRvck1vZGVsXG4gICAgLy8gRGV0ZWN0IEF1dG9jb21wbGV0ZVBsdXMgbWVudSBlbGVtZW50OiBodHRwczovL2dpdC5pby92ZGRMaVxuICAgIGNvbnN0IGlzQXV0b2NvbXBsZXRlT3BlbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0XCIpICE9IG51bGxcbiAgICBpZiAoZWRpdG9yID09IG51bGwpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZXZlbnQud2hpY2ggPT09IEVOVEVSX0tFWV9DT0RFKSB7XG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBhdXRvIGNvbXBsZXRlIHNldHRpbmdzIGFyZSBzdWNoIHRoYXQgcHJlc3NpbmdcbiAgICAgIC8vIGVudGVyIGRvZXMgTk9UIGFjY2VwdCBhIHN1Z2dlc3Rpb24sIGFuZCB0aGUgYXV0byBjb21wbGV0ZSBib3hcbiAgICAgIC8vIGlzIG9wZW4sIHRyZWF0IGVudGVyIGFzIHN1Ym1pdC4gT3RoZXJ3aXNlLCBsZXQgdGhlIGV2ZW50XG4gICAgICAvLyBwcm9wYWdhdGUgc28gdGhhdCBhdXRvY29tcGxldGUgY2FuIGhhbmRsZSBpdC5cbiAgICAgIGNvbnN0IHNldHRpbmcgPSBhdG9tLmNvbmZpZy5nZXQoXCJhdXRvY29tcGxldGUtcGx1cy5jb25maXJtQ29tcGxldGlvblwiKVxuICAgICAgY29uc3QgZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiA9IHNldHRpbmcgPT0gbnVsbCB8fCBTdHJpbmcoc2V0dGluZykuaW5jbHVkZXMoXCJlbnRlclwiKVxuICAgICAgaWYgKCFpc0F1dG9jb21wbGV0ZU9wZW4gfHwgIWVudGVyQWNjZXB0c1N1Z2dlc3Rpb24pIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuXG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSB8fCBldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgIGVkaXRvci5pbnNlcnROZXdsaW5lKClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N1Ym1pdCgpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGV2ZW50LndoaWNoID09PSBVUF9LRVlfQ09ERSAmJlxuICAgICAgKGVkaXRvci5nZXRMaW5lQ291bnQoKSA8PSAxIHx8IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyA9PT0gMClcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoID09PSAwIHx8IGlzQXV0b2NvbXBsZXRlT3Blbikge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICBjb25zdCBoaXN0b3J5SW5kZXggPSBNYXRoLm1pbih0aGlzLnN0YXRlLmhpc3RvcnlJbmRleCArIDEsIHRoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSAxKVxuICAgICAgaWYgKHRoaXMuc3RhdGUuaGlzdG9yeUluZGV4ID09PSAtMSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaGlzdG9yeUluZGV4LCBkcmFmdDogZWRpdG9yLmdldFRleHQoKSB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGhpc3RvcnlJbmRleCB9KVxuICAgICAgfVxuICAgICAgZWRpdG9yLnNldFRleHQodGhpcy5wcm9wcy5oaXN0b3J5W3RoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSBoaXN0b3J5SW5kZXggLSAxXSlcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgZXZlbnQud2hpY2ggPT09IERPV05fS0VZX0NPREUgJiZcbiAgICAgIChlZGl0b3IuZ2V0TGluZUNvdW50KCkgPD0gMSB8fCBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgPT09IGVkaXRvci5nZXRMaW5lQ291bnQoKSAtIDEpXG4gICAgKSB7XG4gICAgICBpZiAodGhpcy5wcm9wcy5oaXN0b3J5Lmxlbmd0aCA9PT0gMCB8fCBpc0F1dG9jb21wbGV0ZU9wZW4pIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgLy8gVE9ETzogKHdiaW5uc3NtaXRoKSBUMzA3NzE0MzUgdGhpcyBzZXRTdGF0ZSBkZXBlbmRzIG9uIGN1cnJlbnQgc3RhdGVcbiAgICAgIC8vIGFuZCBzaG91bGQgdXNlIGFuIHVwZGF0ZXIgZnVuY3Rpb24gcmF0aGVyIHRoYW4gYW4gb2JqZWN0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3Qvbm8tYWNjZXNzLXN0YXRlLWluLXNldHN0YXRlXG4gICAgICBjb25zdCBoaXN0b3J5SW5kZXggPSBNYXRoLm1heCh0aGlzLnN0YXRlLmhpc3RvcnlJbmRleCAtIDEsIC0xKVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGhpc3RvcnlJbmRleCB9KVxuICAgICAgaWYgKGhpc3RvcnlJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgZWRpdG9yLnNldFRleHQodGhpcy5zdGF0ZS5kcmFmdClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVkaXRvci5zZXRUZXh0KHRoaXMucHJvcHMuaGlzdG9yeVt0aGlzLnByb3BzLmhpc3RvcnkubGVuZ3RoIC0gaGlzdG9yeUluZGV4IC0gMV0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xuICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLnByb3BzLnNjb3BlTmFtZSA9PSBudWxsID8gbnVsbCA6IGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZSh0aGlzLnByb3BzLnNjb3BlTmFtZSlcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLWlucHV0LXdyYXBwZXJcIiBzdHlsZT17eyBmb250U2l6ZTogYCR7dGhpcy5wcm9wcy5mb250U2l6ZX1weGAgfX0+XG4gICAgICAgIDxBdG9tVGV4dEVkaXRvclxuICAgICAgICAgIHJlZj17dGhpcy5faGFuZGxlVGV4dEVkaXRvcn1cbiAgICAgICAgICBncmFtbWFyPXtncmFtbWFyfVxuICAgICAgICAgIGd1dHRlckhpZGRlblxuICAgICAgICAgIGF1dG9Hcm93XG4gICAgICAgICAgbGluZU51bWJlckd1dHRlclZpc2libGU9e2ZhbHNlfVxuICAgICAgICAgIG9uQ29uZmlybT17dGhpcy5fc3VibWl0fVxuICAgICAgICAgIG9uSW5pdGlhbGl6ZWQ9e3RoaXMuX2F0dGFjaExhYmVsfVxuICAgICAgICAgIG9uRGlkVGV4dEJ1ZmZlckNoYW5nZT17dGhpcy5wcm9wcy5vbkRpZFRleHRCdWZmZXJDaGFuZ2V9XG4gICAgICAgICAgcGxhY2Vob2xkZXJUZXh0PXt0aGlzLnByb3BzLnBsYWNlaG9sZGVyVGV4dH1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuIl19