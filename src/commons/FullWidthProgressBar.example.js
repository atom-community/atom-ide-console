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

import * as React from 'react';
import {Block} from './Block';
import FullWidthProgressBar from './FullWidthProgressBar';

const Wrapper = ({children}: {children: React.Element<any>}) => (
  <div style={{position: 'relative', paddingBottom: 5}}>{children}</div>
);

const FullWidthProgressBarExample = (): React.Element<any> => (
  <div>
    0%:
    <Block>
      <Wrapper>
        <FullWidthProgressBar progress={0} visible={true} />
      </Wrapper>
    </Block>
    50%:
    <Block>
      <Wrapper>
        <FullWidthProgressBar progress={0.5} visible={true} />
      </Wrapper>
    </Block>
    100%:
    <Block>
      <Wrapper>
        <FullWidthProgressBar progress={1} visible={true} />
      </Wrapper>
    </Block>
    Indeterminate (progress=null):
    <Block>
      <Wrapper>
        <FullWidthProgressBar progress={null} visible={true} />
      </Wrapper>
    </Block>
  </div>
);

export const FullWidthProgressBarExamples = {
  sectionName: 'FullWidthProgressBar',
  description:
    'A subtle progress indicator that stretches across an entire pane or panel, indicating general progress.',
  examples: [
    {
      title: 'FullWidthProgressBar',
      component: FullWidthProgressBarExample,
    },
  ],
};
