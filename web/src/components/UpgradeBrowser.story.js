import React from 'react';
import UpgradeBrowser from './UpgradeBrowser';

export default {
  title: 'UpgradeBrowser',
  component: UpgradeBrowser,
  parameters: {
    jest: ['UpgradeBrowser.test.js']
  }
};

export const Basic = args => <UpgradeBrowser {...args} />;
