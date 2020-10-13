import invariant from "assert"
import * as React from "react"
import electron from "electron"
const { remote } = electron
// remote.Menu type

invariant(remote != null)

type PromptOption = {
  id: string,
  label: string,
}

type Props = {
  value: string,
  onChange: (value: string) => void,
  children: ?any,
  options: Array<PromptOption>,
}

export default class PromptButton extends React.Component<Props> {
  _menu: ?Menu

  componentWillUnmount() {
    if (this._menu != null) {
      this._menu.closePopup()
    }
  }

  render(): React.Node {
    return (
      <span className="console-prompt-wrapper" onClick={this._handleClick}>
        <span className="console-prompt-label">{this.props.children}</span>
        <span className="icon icon-chevron-right" />
      </span>
    )
  }

  _handleClick = (event: SyntheticMouseEvent<>): void => {
    const menu = new remote.Menu()
    // TODO: Sort alphabetically by label
    this.props.options.forEach((option) => {
      menu.append(
        new remote.MenuItem({
          type: "checkbox",
          checked: this.props.value === option.id,
          label: option.label,
          click: () => this.props.onChange(option.id),
        })
      )
    })
    menu.popup({ x: event.clientX, y: event.clientY, async: true })
    this._menu = menu
  }
}
