import '@okta/okta-auth-js/polyfill';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { createBrowserHistory } from 'history';
import React from 'react';
import { render } from 'react-dom';
import { routerMiddleware } from 'connected-react-router';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger'; // eslint-disable-line import/no-extraneous-dependencies
import thunk from 'redux-thunk';

import saveMiddleware from './saveMiddleware';
import { initI18n } from './i18n';
import reducer from './reducers';
import Root from './components/Root';
import { browserIsRed } from './util/browser';
import { html as browserHtml } from './components/UpgradeBrowser';
import cookieHtml from './components/EnableCookies';

import './styles/index.scss';

if (browserIsRed) {
  // For browsers we don't support at all, use native DOM APIs to add the
  // warning box since we can't be certain that React will work.
  document.getElementById('app').innerHTML = `
  <div style="margin: 30px;">
    <div class="ds-col-4 ds-c-alert ds-c-alert--error">${browserHtml}</div>
  </div>`;
} else if (!navigator.cookieEnabled) {
  document.getElementById('app').innerHTML = `
  <div style="margin: 30px;">
    <div class="ds-col-4 ds-c-alert ds-c-alert--error">${cookieHtml}</div>
  </div>`;
} else {
  // Set locale based on browser language
  // if it matches one of our SUPPORTED_LOCALES
  // otherwise, set to DEFAULT_LOCALE ("en")
  initI18n();

  const history = createBrowserHistory();

  const middleware = [thunk, routerMiddleware(history), saveMiddleware];
  if (process.env.NODE_ENV !== 'production') {
    middleware.push(createLogger());
  }

  const store = createStore(reducer(history), applyMiddleware(...middleware));

  render(
    <Root history={history} store={store} />,
    document.getElementById('app')
  );
}
