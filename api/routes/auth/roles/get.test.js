const tap = require('tap');
const sinon = require('sinon');

const can = require('../../../middleware').can;
const getEndpoint = require('./get');

const mockExpress = require('../../../util/mockExpress');
const mockResponse = require('../../../util/mockResponse');

let app;
let res;
let next;
let getActiveAuthRoles;
let changeState;

tap.test('auth roles GET endpoint', async endpointTest => {
  endpointTest.beforeEach(async () => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
    getActiveAuthRoles = sinon.stub();
    changeState = sinon.stub();
  });

  endpointTest.test('setup', async setupTest => {
    getEndpoint(app);

    setupTest.ok(
      app.get.calledWith('/auth/roles', can('view-roles'), sinon.match.func),
      'roles GET endpoint is registered'
    );
    setupTest.ok(
      app.get.calledWith('/auth/state/:stateId', sinon.match.func),
      'change state GET endpoint is registered'
    );
  });

  endpointTest.test('get roles handler', async handlerTest => {
    let handler;
    handlerTest.beforeEach(() => {
      getEndpoint(app, { getActiveAuthRoles });
      handler = app.get.args.find(args => args[0] === '/auth/roles')[2];
    });

    handlerTest.test('database error', async invalidTest => {
      const err = { error: 'err0r' };
      getActiveAuthRoles.rejects(err);

      await handler({}, res, next);

      invalidTest.ok(next.called, 'next is called');
      invalidTest.ok(next.calledWith(err), 'pass error to middleware');
    });

    handlerTest.test('sends back a list of roles', async validTest => {
      const roles = [{ name: 'one' }, { name: 'two' }, { name: 'three' }];

      getActiveAuthRoles.resolves(roles);

      await handler({}, res);

      validTest.ok(res.status.notCalled, 'HTTP status is not explicitly set');
      validTest.ok(res.send.calledWith(roles), 'body is a list of roles roles');
    });
  });

  endpointTest.test('get state Change handler', async handlerTest => {
    let handler;
    handlerTest.beforeEach(() => {
      getEndpoint(app, { changeState });
      handler = app.get.args.find(args => args[0] === '/auth/state/:stateId')[1];
    });


    handlerTest.test('denies if user does not have state to switch to', async validTest => {

      await handler({
          user: {
            states:['md']
          },
          params:{
            stateId:'ak'
          }
        }, res);

      validTest.ok(res.status.calledWith(403), 'HTTP status is explicitly set');
      validTest.ok(res.send.calledWith(), 'Body is empty');
    });

    handlerTest.test('calls ChangeState if the user has the state to switch to', async validTest => {
      const user = {
        states:{'ak': 'approved', 'md': 'approved'}
      }

      changeState.withArgs(user, 'ak').resolves('JWT for AK')
      await handler({
        user,
        params:{
          stateId:'ak'
        }
      }, res);

      validTest.ok(res.status.notCalled, 'HTTP status is not explicitly set');
      validTest.ok(res.send.calledWith({jwt:'JWT for AK'}), 'body is the result of changeState');

    });
  });
});
