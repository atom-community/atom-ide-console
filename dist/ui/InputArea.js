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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIklucHV0QXJlYS5qcyJdLCJuYW1lcyI6WyJFTlRFUl9LRVlfQ09ERSIsIlVQX0tFWV9DT0RFIiwiRE9XTl9LRVlfQ09ERSIsIklucHV0QXJlYSIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsIl9rZXlTdWJzY3JpcHRpb24iLCJfdGV4dEVkaXRvck1vZGVsIiwiZm9jdXMiLCJnZXRFbGVtZW50IiwiX3N1Ym1pdCIsImVkaXRvciIsInRleHQiLCJnZXRUZXh0Iiwic2V0VGV4dCIsIm9uU3VibWl0Iiwic2V0U3RhdGUiLCJoaXN0b3J5SW5kZXgiLCJfYXR0YWNoTGFiZWwiLCJ3YXRjaEVkaXRvciIsImRpc3Bvc2FibGUiLCJVbml2ZXJzYWxEaXNwb3NhYmxlIiwiYWRkIiwiX2hhbmRsZVRleHRFZGl0b3IiLCJjb21wb25lbnQiLCJ1bnN1YnNjcmliZSIsImdldE1vZGVsIiwiZWwiLCJSZWFjdERPTSIsImZpbmRET01Ob2RlIiwiT2JzZXJ2YWJsZSIsImZyb21FdmVudCIsInN1YnNjcmliZSIsIl9oYW5kbGVLZXlEb3duIiwiZXZlbnQiLCJpc0F1dG9jb21wbGV0ZU9wZW4iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aGljaCIsInNldHRpbmciLCJhdG9tIiwiY29uZmlnIiwiZ2V0IiwiZW50ZXJBY2NlcHRzU3VnZ2VzdGlvbiIsIlN0cmluZyIsImluY2x1ZGVzIiwicHJldmVudERlZmF1bHQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjdHJsS2V5IiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJpbnNlcnROZXdsaW5lIiwiZ2V0TGluZUNvdW50IiwiZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24iLCJyb3ciLCJoaXN0b3J5IiwibGVuZ3RoIiwiTWF0aCIsIm1pbiIsInN0YXRlIiwiZHJhZnQiLCJtYXgiLCJyZW5kZXIiLCJncmFtbWFyIiwic2NvcGVOYW1lIiwiZ3JhbW1hcnMiLCJncmFtbWFyRm9yU2NvcGVOYW1lIiwiZm9udFNpemUiLCJvbkRpZFRleHRCdWZmZXJDaGFuZ2UiLCJwbGFjZWhvbGRlclRleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFpQkEsTUFBTUEsY0FBYyxHQUFHLEVBQXZCO0FBQ0EsTUFBTUMsV0FBVyxHQUFHLEVBQXBCO0FBQ0EsTUFBTUMsYUFBYSxHQUFHLEVBQXRCOztBQUVlLE1BQU1DLFNBQU4sU0FBd0JDLEtBQUssQ0FBQ0MsU0FBOUIsQ0FBc0Q7QUFJbkVDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFlO0FBQ3hCLFVBQU1BLEtBQU47QUFEd0IsU0FIMUJDLGdCQUcwQjtBQUFBLFNBRjFCQyxnQkFFMEI7O0FBQUEsU0FRMUJDLEtBUjBCLEdBUWxCLE1BQVk7QUFDbEIsVUFBSSxLQUFLRCxnQkFBTCxJQUF5QixJQUE3QixFQUFtQztBQUNqQyxhQUFLQSxnQkFBTCxDQUFzQkUsVUFBdEIsR0FBbUNELEtBQW5DO0FBQ0Q7QUFDRixLQVp5Qjs7QUFBQSxTQWMxQkUsT0FkMEIsR0FjaEIsTUFBWTtBQUNwQjtBQUNBLFlBQU1DLE1BQU0sR0FBRyxLQUFLSixnQkFBcEI7O0FBQ0EsVUFBSUksTUFBTSxJQUFJLElBQWQsRUFBb0I7QUFDbEI7QUFDRDs7QUFFRCxZQUFNQyxJQUFJLEdBQUdELE1BQU0sQ0FBQ0UsT0FBUCxFQUFiOztBQUNBLFVBQUlELElBQUksS0FBSyxFQUFiLEVBQWlCO0FBQ2Y7QUFDRDs7QUFFREQsTUFBQUEsTUFBTSxDQUFDRyxPQUFQLENBQWUsRUFBZixFQVpvQixDQVlEOztBQUNuQixXQUFLVCxLQUFMLENBQVdVLFFBQVgsQ0FBb0JILElBQXBCO0FBQ0EsV0FBS0ksUUFBTCxDQUFjO0FBQUVDLFFBQUFBLFlBQVksRUFBRSxDQUFDO0FBQWpCLE9BQWQ7QUFDRCxLQTdCeUI7O0FBQUEsU0ErQjFCQyxZQS9CMEIsR0ErQlZQLE1BQUQsSUFBMEM7QUFDdkQsWUFBTTtBQUFFUSxRQUFBQTtBQUFGLFVBQWtCLEtBQUtkLEtBQTdCO0FBQ0EsWUFBTWUsVUFBVSxHQUFHLElBQUlDLDRCQUFKLEVBQW5COztBQUNBLFVBQUlGLFdBQUosRUFBaUI7QUFDZkMsUUFBQUEsVUFBVSxDQUFDRSxHQUFYLENBQWVILFdBQVcsQ0FBQ1IsTUFBRCxFQUFTLENBQUMsaUJBQUQsQ0FBVCxDQUExQjtBQUNEOztBQUNELGFBQU9TLFVBQVA7QUFDRCxLQXRDeUI7O0FBQUEsU0F3QzFCRyxpQkF4QzBCLEdBd0NMQyxTQUFELElBQXNDO0FBQ3hELFVBQUksS0FBS2xCLGdCQUFULEVBQTJCO0FBQ3pCLGFBQUtDLGdCQUFMLEdBQXdCLElBQXhCOztBQUNBLGFBQUtELGdCQUFMLENBQXNCbUIsV0FBdEI7QUFDRDs7QUFDRCxVQUFJRCxTQUFKLEVBQWU7QUFDYixhQUFLakIsZ0JBQUwsR0FBd0JpQixTQUFTLENBQUNFLFFBQVYsRUFBeEI7O0FBQ0EsY0FBTUMsRUFBRSxHQUFHQyxrQkFBU0MsV0FBVCxDQUFxQkwsU0FBckIsQ0FBWDs7QUFDQSxhQUFLbEIsZ0JBQUwsR0FBd0J3Qiw2QkFBV0MsU0FBWCxDQUFxQkosRUFBckIsRUFBeUIsU0FBekIsRUFBb0NLLFNBQXBDLENBQThDLEtBQUtDLGNBQW5ELENBQXhCO0FBQ0Q7QUFDRixLQWxEeUI7O0FBQUEsU0FvRDFCQSxjQXBEMEIsR0FvRFJDLEtBQUQsSUFBZ0M7QUFDL0MsWUFBTXZCLE1BQU0sR0FBRyxLQUFLSixnQkFBcEIsQ0FEK0MsQ0FFL0M7O0FBQ0EsWUFBTTRCLGtCQUFrQixHQUFHQyxRQUFRLENBQUNDLGFBQVQsQ0FBdUIsOEJBQXZCLEtBQTBELElBQXJGOztBQUNBLFVBQUkxQixNQUFNLElBQUksSUFBZCxFQUFvQjtBQUNsQjtBQUNEOztBQUNELFVBQUl1QixLQUFLLENBQUNJLEtBQU4sS0FBZ0J4QyxjQUFwQixFQUFvQztBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQU15QyxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsTUFBTCxDQUFZQyxHQUFaLENBQWdCLHFDQUFoQixDQUFoQjtBQUNBLGNBQU1DLHNCQUFzQixHQUFHSixPQUFPLElBQUksSUFBWCxJQUFtQkssTUFBTSxDQUFDTCxPQUFELENBQU4sQ0FBZ0JNLFFBQWhCLENBQXlCLE9BQXpCLENBQWxEOztBQUNBLFlBQUksQ0FBQ1Ysa0JBQUQsSUFBdUIsQ0FBQ1Esc0JBQTVCLEVBQW9EO0FBQ2xEVCxVQUFBQSxLQUFLLENBQUNZLGNBQU47QUFDQVosVUFBQUEsS0FBSyxDQUFDYSx3QkFBTjs7QUFFQSxjQUFJYixLQUFLLENBQUNjLE9BQU4sSUFBaUJkLEtBQUssQ0FBQ2UsTUFBdkIsSUFBaUNmLEtBQUssQ0FBQ2dCLFFBQTNDLEVBQXFEO0FBQ25EdkMsWUFBQUEsTUFBTSxDQUFDd0MsYUFBUDtBQUNBO0FBQ0Q7O0FBRUQsZUFBS3pDLE9BQUw7QUFDRDtBQUNGLE9BbEJELE1Ba0JPLElBQ0x3QixLQUFLLENBQUNJLEtBQU4sS0FBZ0J2QyxXQUFoQixLQUNDWSxNQUFNLENBQUN5QyxZQUFQLE1BQXlCLENBQXpCLElBQThCekMsTUFBTSxDQUFDMEMsdUJBQVAsR0FBaUNDLEdBQWpDLEtBQXlDLENBRHhFLENBREssRUFHTDtBQUNBLFlBQUksS0FBS2pELEtBQUwsQ0FBV2tELE9BQVgsQ0FBbUJDLE1BQW5CLEtBQThCLENBQTlCLElBQW1DckIsa0JBQXZDLEVBQTJEO0FBQ3pEO0FBQ0Q7O0FBQ0RELFFBQUFBLEtBQUssQ0FBQ1ksY0FBTjtBQUNBWixRQUFBQSxLQUFLLENBQUNhLHdCQUFOO0FBQ0EsY0FBTTlCLFlBQVksR0FBR3dDLElBQUksQ0FBQ0MsR0FBTCxDQUFTLEtBQUtDLEtBQUwsQ0FBVzFDLFlBQVgsR0FBMEIsQ0FBbkMsRUFBc0MsS0FBS1osS0FBTCxDQUFXa0QsT0FBWCxDQUFtQkMsTUFBbkIsR0FBNEIsQ0FBbEUsQ0FBckI7O0FBQ0EsWUFBSSxLQUFLRyxLQUFMLENBQVcxQyxZQUFYLEtBQTRCLENBQUMsQ0FBakMsRUFBb0M7QUFDbEMsZUFBS0QsUUFBTCxDQUFjO0FBQUVDLFlBQUFBLFlBQUY7QUFBZ0IyQyxZQUFBQSxLQUFLLEVBQUVqRCxNQUFNLENBQUNFLE9BQVA7QUFBdkIsV0FBZDtBQUNELFNBRkQsTUFFTztBQUNMLGVBQUtHLFFBQUwsQ0FBYztBQUFFQyxZQUFBQTtBQUFGLFdBQWQ7QUFDRDs7QUFDRE4sUUFBQUEsTUFBTSxDQUFDRyxPQUFQLENBQWUsS0FBS1QsS0FBTCxDQUFXa0QsT0FBWCxDQUFtQixLQUFLbEQsS0FBTCxDQUFXa0QsT0FBWCxDQUFtQkMsTUFBbkIsR0FBNEJ2QyxZQUE1QixHQUEyQyxDQUE5RCxDQUFmO0FBQ0QsT0FoQk0sTUFnQkEsSUFDTGlCLEtBQUssQ0FBQ0ksS0FBTixLQUFnQnRDLGFBQWhCLEtBQ0NXLE1BQU0sQ0FBQ3lDLFlBQVAsTUFBeUIsQ0FBekIsSUFBOEJ6QyxNQUFNLENBQUMwQyx1QkFBUCxHQUFpQ0MsR0FBakMsS0FBeUMzQyxNQUFNLENBQUN5QyxZQUFQLEtBQXdCLENBRGhHLENBREssRUFHTDtBQUNBLFlBQUksS0FBSy9DLEtBQUwsQ0FBV2tELE9BQVgsQ0FBbUJDLE1BQW5CLEtBQThCLENBQTlCLElBQW1DckIsa0JBQXZDLEVBQTJEO0FBQ3pEO0FBQ0Q7O0FBQ0RELFFBQUFBLEtBQUssQ0FBQ1ksY0FBTjtBQUNBWixRQUFBQSxLQUFLLENBQUNhLHdCQUFOLEdBTEEsQ0FNQTtBQUNBO0FBQ0E7O0FBQ0EsY0FBTTlCLFlBQVksR0FBR3dDLElBQUksQ0FBQ0ksR0FBTCxDQUFTLEtBQUtGLEtBQUwsQ0FBVzFDLFlBQVgsR0FBMEIsQ0FBbkMsRUFBc0MsQ0FBQyxDQUF2QyxDQUFyQjtBQUNBLGFBQUtELFFBQUwsQ0FBYztBQUFFQyxVQUFBQTtBQUFGLFNBQWQ7O0FBQ0EsWUFBSUEsWUFBWSxLQUFLLENBQUMsQ0FBdEIsRUFBeUI7QUFDdkJOLFVBQUFBLE1BQU0sQ0FBQ0csT0FBUCxDQUFlLEtBQUs2QyxLQUFMLENBQVdDLEtBQTFCO0FBQ0QsU0FGRCxNQUVPO0FBQ0xqRCxVQUFBQSxNQUFNLENBQUNHLE9BQVAsQ0FBZSxLQUFLVCxLQUFMLENBQVdrRCxPQUFYLENBQW1CLEtBQUtsRCxLQUFMLENBQVdrRCxPQUFYLENBQW1CQyxNQUFuQixHQUE0QnZDLFlBQTVCLEdBQTJDLENBQTlELENBQWY7QUFDRDtBQUNGO0FBQ0YsS0FqSHlCOztBQUV4QixTQUFLMEMsS0FBTCxHQUFhO0FBQ1gxQyxNQUFBQSxZQUFZLEVBQUUsQ0FBQyxDQURKO0FBRVgyQyxNQUFBQSxLQUFLLEVBQUU7QUFGSSxLQUFiO0FBSUQ7O0FBNkdERSxFQUFBQSxNQUFNLEdBQWU7QUFDbkIsVUFBTUMsT0FBTyxHQUFHLEtBQUsxRCxLQUFMLENBQVcyRCxTQUFYLElBQXdCLElBQXhCLEdBQStCLElBQS9CLEdBQXNDeEIsSUFBSSxDQUFDeUIsUUFBTCxDQUFjQyxtQkFBZCxDQUFrQyxLQUFLN0QsS0FBTCxDQUFXMkQsU0FBN0MsQ0FBdEQ7QUFDQSx3QkFDRTtBQUFLLE1BQUEsU0FBUyxFQUFDLHVCQUFmO0FBQXVDLE1BQUEsS0FBSyxFQUFFO0FBQUVHLFFBQUFBLFFBQVEsRUFBRyxHQUFFLEtBQUs5RCxLQUFMLENBQVc4RCxRQUFTO0FBQW5DO0FBQTlDLG9CQUNFLG9CQUFDLDhCQUFEO0FBQ0UsTUFBQSxHQUFHLEVBQUUsS0FBSzVDLGlCQURaO0FBRUUsTUFBQSxPQUFPLEVBQUV3QyxPQUZYO0FBR0UsTUFBQSxZQUFZLE1BSGQ7QUFJRSxNQUFBLFFBQVEsTUFKVjtBQUtFLE1BQUEsdUJBQXVCLEVBQUUsS0FMM0I7QUFNRSxNQUFBLFNBQVMsRUFBRSxLQUFLckQsT0FObEI7QUFPRSxNQUFBLGFBQWEsRUFBRSxLQUFLUSxZQVB0QjtBQVFFLE1BQUEscUJBQXFCLEVBQUUsS0FBS2IsS0FBTCxDQUFXK0QscUJBUnBDO0FBU0UsTUFBQSxlQUFlLEVBQUUsS0FBSy9ELEtBQUwsQ0FBV2dFO0FBVDlCLE1BREYsQ0FERjtBQWVEOztBQXhJa0UiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVW5pdmVyc2FsRGlzcG9zYWJsZSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMvVW5pdmVyc2FsRGlzcG9zYWJsZVwiXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiXHJcbmltcG9ydCBSZWFjdERPTSBmcm9tIFwicmVhY3QtZG9tXCJcclxuaW1wb3J0IHsgQXRvbVRleHRFZGl0b3IgfSBmcm9tIFwiQGF0b20taWRlLWNvbW11bml0eS9udWNsaWRlLWNvbW1vbnMtdWkvQXRvbVRleHRFZGl0b3JcIlxyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anMtY29tcGF0L2J1bmRsZXMvcnhqcy1jb21wYXQudW1kLm1pbi5qc1wiXHJcblxyXG50eXBlIFByb3BzID0ge1xyXG4gIGZvbnRTaXplOiBudW1iZXIsXHJcbiAgb25TdWJtaXQ6ICh2YWx1ZTogc3RyaW5nKSA9PiBtaXhlZCxcclxuICBzY29wZU5hbWU6ID9zdHJpbmcsXHJcbiAgaGlzdG9yeTogQXJyYXk8c3RyaW5nPixcclxuICB3YXRjaEVkaXRvcjogP2F0b20kQXV0b2NvbXBsZXRlV2F0Y2hFZGl0b3IsXHJcbiAgb25EaWRUZXh0QnVmZmVyQ2hhbmdlPzogKGV2ZW50OiBhdG9tJEFnZ3JlZ2F0ZWRUZXh0RWRpdEV2ZW50KSA9PiBtaXhlZCxcclxuICBwbGFjZWhvbGRlclRleHQ/OiBzdHJpbmcsXHJcbn1cclxuXHJcbnR5cGUgU3RhdGUgPSB7XHJcbiAgaGlzdG9yeUluZGV4OiBudW1iZXIsXHJcbiAgZHJhZnQ6IHN0cmluZyxcclxufVxyXG5cclxuY29uc3QgRU5URVJfS0VZX0NPREUgPSAxM1xyXG5jb25zdCBVUF9LRVlfQ09ERSA9IDM4XHJcbmNvbnN0IERPV05fS0VZX0NPREUgPSA0MFxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5wdXRBcmVhIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PFByb3BzLCBTdGF0ZT4ge1xyXG4gIF9rZXlTdWJzY3JpcHRpb246ID9yeGpzJElTdWJzY3JpcHRpb25cclxuICBfdGV4dEVkaXRvck1vZGVsOiA/YXRvbSRUZXh0RWRpdG9yXHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzOiBQcm9wcykge1xyXG4gICAgc3VwZXIocHJvcHMpXHJcbiAgICB0aGlzLnN0YXRlID0ge1xyXG4gICAgICBoaXN0b3J5SW5kZXg6IC0xLFxyXG4gICAgICBkcmFmdDogXCJcIixcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvY3VzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JNb2RlbCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JNb2RlbC5nZXRFbGVtZW50KCkuZm9jdXMoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX3N1Ym1pdCA9ICgpOiB2b2lkID0+IHtcclxuICAgIC8vIENsZWFyIHRoZSB0ZXh0IGFuZCB0cmlnZ2VyIHRoZSBgb25TdWJtaXRgIGNhbGxiYWNrXHJcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl90ZXh0RWRpdG9yTW9kZWxcclxuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0ZXh0ID0gZWRpdG9yLmdldFRleHQoKVxyXG4gICAgaWYgKHRleHQgPT09IFwiXCIpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgZWRpdG9yLnNldFRleHQoXCJcIikgLy8gQ2xlYXIgdGhlIHRleHQgZmllbGQuXHJcbiAgICB0aGlzLnByb3BzLm9uU3VibWl0KHRleHQpXHJcbiAgICB0aGlzLnNldFN0YXRlKHsgaGlzdG9yeUluZGV4OiAtMSB9KVxyXG4gIH1cclxuXHJcbiAgX2F0dGFjaExhYmVsID0gKGVkaXRvcjogYXRvbSRUZXh0RWRpdG9yKTogSURpc3Bvc2FibGUgPT4ge1xyXG4gICAgY29uc3QgeyB3YXRjaEVkaXRvciB9ID0gdGhpcy5wcm9wc1xyXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBVbml2ZXJzYWxEaXNwb3NhYmxlKClcclxuICAgIGlmICh3YXRjaEVkaXRvcikge1xyXG4gICAgICBkaXNwb3NhYmxlLmFkZCh3YXRjaEVkaXRvcihlZGl0b3IsIFtcIm51Y2xpZGUtY29uc29sZVwiXSkpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGlzcG9zYWJsZVxyXG4gIH1cclxuXHJcbiAgX2hhbmRsZVRleHRFZGl0b3IgPSAoY29tcG9uZW50OiA/QXRvbVRleHRFZGl0b3IpOiB2b2lkID0+IHtcclxuICAgIGlmICh0aGlzLl9rZXlTdWJzY3JpcHRpb24pIHtcclxuICAgICAgdGhpcy5fdGV4dEVkaXRvck1vZGVsID0gbnVsbFxyXG4gICAgICB0aGlzLl9rZXlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKVxyXG4gICAgfVxyXG4gICAgaWYgKGNvbXBvbmVudCkge1xyXG4gICAgICB0aGlzLl90ZXh0RWRpdG9yTW9kZWwgPSBjb21wb25lbnQuZ2V0TW9kZWwoKVxyXG4gICAgICBjb25zdCBlbCA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKGNvbXBvbmVudClcclxuICAgICAgdGhpcy5fa2V5U3Vic2NyaXB0aW9uID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoZWwsIFwia2V5ZG93blwiKS5zdWJzY3JpYmUodGhpcy5faGFuZGxlS2V5RG93bilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XHJcbiAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl90ZXh0RWRpdG9yTW9kZWxcclxuICAgIC8vIERldGVjdCBBdXRvY29tcGxldGVQbHVzIG1lbnUgZWxlbWVudDogaHR0cHM6Ly9naXQuaW8vdmRkTGlcclxuICAgIGNvbnN0IGlzQXV0b2NvbXBsZXRlT3BlbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0XCIpICE9IG51bGxcclxuICAgIGlmIChlZGl0b3IgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmIChldmVudC53aGljaCA9PT0gRU5URVJfS0VZX0NPREUpIHtcclxuICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgYXV0byBjb21wbGV0ZSBzZXR0aW5ncyBhcmUgc3VjaCB0aGF0IHByZXNzaW5nXHJcbiAgICAgIC8vIGVudGVyIGRvZXMgTk9UIGFjY2VwdCBhIHN1Z2dlc3Rpb24sIGFuZCB0aGUgYXV0byBjb21wbGV0ZSBib3hcclxuICAgICAgLy8gaXMgb3BlbiwgdHJlYXQgZW50ZXIgYXMgc3VibWl0LiBPdGhlcndpc2UsIGxldCB0aGUgZXZlbnRcclxuICAgICAgLy8gcHJvcGFnYXRlIHNvIHRoYXQgYXV0b2NvbXBsZXRlIGNhbiBoYW5kbGUgaXQuXHJcbiAgICAgIGNvbnN0IHNldHRpbmcgPSBhdG9tLmNvbmZpZy5nZXQoXCJhdXRvY29tcGxldGUtcGx1cy5jb25maXJtQ29tcGxldGlvblwiKVxyXG4gICAgICBjb25zdCBlbnRlckFjY2VwdHNTdWdnZXN0aW9uID0gc2V0dGluZyA9PSBudWxsIHx8IFN0cmluZyhzZXR0aW5nKS5pbmNsdWRlcyhcImVudGVyXCIpXHJcbiAgICAgIGlmICghaXNBdXRvY29tcGxldGVPcGVuIHx8ICFlbnRlckFjY2VwdHNTdWdnZXN0aW9uKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcblxyXG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSB8fCBldmVudC5zaGlmdEtleSkge1xyXG4gICAgICAgICAgZWRpdG9yLmluc2VydE5ld2xpbmUoKVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9zdWJtaXQoKVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICBldmVudC53aGljaCA9PT0gVVBfS0VZX0NPREUgJiZcclxuICAgICAgKGVkaXRvci5nZXRMaW5lQ291bnQoKSA8PSAxIHx8IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyA9PT0gMClcclxuICAgICkge1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5oaXN0b3J5Lmxlbmd0aCA9PT0gMCB8fCBpc0F1dG9jb21wbGV0ZU9wZW4pIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcbiAgICAgIGNvbnN0IGhpc3RvcnlJbmRleCA9IE1hdGgubWluKHRoaXMuc3RhdGUuaGlzdG9yeUluZGV4ICsgMSwgdGhpcy5wcm9wcy5oaXN0b3J5Lmxlbmd0aCAtIDEpXHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmhpc3RvcnlJbmRleCA9PT0gLTEpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgaGlzdG9yeUluZGV4LCBkcmFmdDogZWRpdG9yLmdldFRleHQoKSB9KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBoaXN0b3J5SW5kZXggfSlcclxuICAgICAgfVxyXG4gICAgICBlZGl0b3Iuc2V0VGV4dCh0aGlzLnByb3BzLmhpc3RvcnlbdGhpcy5wcm9wcy5oaXN0b3J5Lmxlbmd0aCAtIGhpc3RvcnlJbmRleCAtIDFdKVxyXG4gICAgfSBlbHNlIGlmIChcclxuICAgICAgZXZlbnQud2hpY2ggPT09IERPV05fS0VZX0NPREUgJiZcclxuICAgICAgKGVkaXRvci5nZXRMaW5lQ291bnQoKSA8PSAxIHx8IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyA9PT0gZWRpdG9yLmdldExpbmVDb3VudCgpIC0gMSlcclxuICAgICkge1xyXG4gICAgICBpZiAodGhpcy5wcm9wcy5oaXN0b3J5Lmxlbmd0aCA9PT0gMCB8fCBpc0F1dG9jb21wbGV0ZU9wZW4pIHtcclxuICAgICAgICByZXR1cm5cclxuICAgICAgfVxyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXHJcbiAgICAgIC8vIFRPRE86ICh3YmlubnNzbWl0aCkgVDMwNzcxNDM1IHRoaXMgc2V0U3RhdGUgZGVwZW5kcyBvbiBjdXJyZW50IHN0YXRlXHJcbiAgICAgIC8vIGFuZCBzaG91bGQgdXNlIGFuIHVwZGF0ZXIgZnVuY3Rpb24gcmF0aGVyIHRoYW4gYW4gb2JqZWN0XHJcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC9uby1hY2Nlc3Mtc3RhdGUtaW4tc2V0c3RhdGVcclxuICAgICAgY29uc3QgaGlzdG9yeUluZGV4ID0gTWF0aC5tYXgodGhpcy5zdGF0ZS5oaXN0b3J5SW5kZXggLSAxLCAtMSlcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGhpc3RvcnlJbmRleCB9KVxyXG4gICAgICBpZiAoaGlzdG9yeUluZGV4ID09PSAtMSkge1xyXG4gICAgICAgIGVkaXRvci5zZXRUZXh0KHRoaXMuc3RhdGUuZHJhZnQpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWRpdG9yLnNldFRleHQodGhpcy5wcm9wcy5oaXN0b3J5W3RoaXMucHJvcHMuaGlzdG9yeS5sZW5ndGggLSBoaXN0b3J5SW5kZXggLSAxXSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCk6IFJlYWN0Lk5vZGUge1xyXG4gICAgY29uc3QgZ3JhbW1hciA9IHRoaXMucHJvcHMuc2NvcGVOYW1lID09IG51bGwgPyBudWxsIDogYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKHRoaXMucHJvcHMuc2NvcGVOYW1lKVxyXG4gICAgcmV0dXJuIChcclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb25zb2xlLWlucHV0LXdyYXBwZXJcIiBzdHlsZT17eyBmb250U2l6ZTogYCR7dGhpcy5wcm9wcy5mb250U2l6ZX1weGAgfX0+XHJcbiAgICAgICAgPEF0b21UZXh0RWRpdG9yXHJcbiAgICAgICAgICByZWY9e3RoaXMuX2hhbmRsZVRleHRFZGl0b3J9XHJcbiAgICAgICAgICBncmFtbWFyPXtncmFtbWFyfVxyXG4gICAgICAgICAgZ3V0dGVySGlkZGVuXHJcbiAgICAgICAgICBhdXRvR3Jvd1xyXG4gICAgICAgICAgbGluZU51bWJlckd1dHRlclZpc2libGU9e2ZhbHNlfVxyXG4gICAgICAgICAgb25Db25maXJtPXt0aGlzLl9zdWJtaXR9XHJcbiAgICAgICAgICBvbkluaXRpYWxpemVkPXt0aGlzLl9hdHRhY2hMYWJlbH1cclxuICAgICAgICAgIG9uRGlkVGV4dEJ1ZmZlckNoYW5nZT17dGhpcy5wcm9wcy5vbkRpZFRleHRCdWZmZXJDaGFuZ2V9XHJcbiAgICAgICAgICBwbGFjZWhvbGRlclRleHQ9e3RoaXMucHJvcHMucGxhY2Vob2xkZXJUZXh0fVxyXG4gICAgICAgIC8+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgKVxyXG4gIH1cclxufVxyXG4iXX0=