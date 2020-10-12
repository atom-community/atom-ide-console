/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import invariant from 'assert';
import classnames from 'classnames';
import * as React from 'react';

type Props = {
  progress: ?number /* 0..1 */,
  visible?: boolean,
};

export default class FullWidthProgressBar extends React.Component<Props> {
  render(): React.Node {
    const className = classnames('nuclide-ui-full-width-progress-bar');
    return (
      <div className={className} hidden={this.props.visible === false}>
        {this._renderBar()}
      </div>
    );
  }

  _isIndeterminate(): boolean {
    return this.props.progress == null;
  }

  _renderBar(): ?React.Element<any> {
    if (this._isIndeterminate()) {
      return <div className="indeterminate" />;
    }

    invariant(this.props.progress != null);
    return <Bar progress={this.props.progress} />;
  }
}

type BarProps = {
  progress: number,
};

class Bar extends React.Component<BarProps> {
  render(): React.Node {
    const pct = Math.max(0, Math.min(100, this.props.progress * 100));
    return (
      <div
        className="nuclide-ui-full-width-progress-bar-bar"
        style={{width: `${pct}%`}}
      />
    );
  }
}
