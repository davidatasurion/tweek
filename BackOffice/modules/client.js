import React from 'react'
import { render } from 'react-dom'
import { Router, browserHistory } from 'react-router'
import routes from '../modules/routes'
import { Provider } from 'react-redux'
import configureStore from './store/configureStore';

var store = configureStore(window.STORE_INITIAL_STATE);

import { syncHistoryWithStore } from 'react-router-redux'

const history = syncHistoryWithStore(browserHistory, store)

render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routes()}/>
  </Provider>,
  document.getElementById('app')
)
