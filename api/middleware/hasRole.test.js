/* eslint-disable no-shadow */
const sinon = require('sinon');
const tap = require('tap');

const hasRole = require('./hasRole');
const mockResponse = require('../util/mockResponse');

let request;
let response;
let next;

const user = {
  roles: [
    { name: 'eAPD Federal Admin' }
  ]
}

tap.test('hasRole middleware', async t => {
  t.beforeEach(async () => {
    request = {
      id: 'unique id per request',
      user
    };
    response = mockResponse();
    next = sinon.stub();
  });

  t.test('when user has specified role', async t => {
    hasRole('eAPD Federal Admin')(request, response, next);
    t.ok(next.called, 'middleware allows the request');
  });

  t.test('when user does not have the specified role', async t => {
    hasRole('eAPD System Operator')(request, response, next);
    t.ok(response.status.calledWith(403), 'HTTP status set to 403 Verboden');
    t.ok(response.end.called, 'response is terminated');
    t.notOk(next.called, 'next is not called');
  });
});
