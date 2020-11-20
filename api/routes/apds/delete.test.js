const tap = require('tap');
const sinon = require('sinon');

const { can, userCanEditAPD } = require('../../middleware');
const endpoint = require('./delete');

const mockExpress = require('../../util/mockExpress');
const mockResponse = require('../../util/mockResponse');

let app;
let req;
let res;
let next;

tap.test('apds/:id DELETE endpoint', async endpointTest => {
  req = {
    meta: {
      apd: {
        id: 'apd id'
      }
    }
  };

  endpointTest.beforeEach(async () => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
    deleteAPDByID = sinon.stub();
  });

  endpointTest.test('setup', async test => {
    endpoint(app);

    test.ok(
      app.delete.calledWith(
        '/apds/:id',
        can('view-document'),
        userCanEditAPD(),
        sinon.match.func
      ),
      'DELETE endpoint is registered'
    );
  });

  endpointTest.test('handles unexpected errors', async t => {
    endpoint(app, { deleteAPDByID });
    const handler = app.delete.args.find(args => args[0] === '/apds/:id').pop();
    const err = { error: 'err0r' };
    deleteAPDByID.rejects(err);

    await handler(req, res, next);

    t.ok(next.called, 'next is called');
    t.ok(next.calledWith(err), 'pass error to middleware');
  });

  endpointTest.test('updates the status and saves', async test => {
    endpoint(app, { deleteAPDByID });
    const handler = app.delete.args.find(args => args[0] === '/apds/:id').pop();

    deleteAPDByID.resolves();

    await handler(req, res);

    test.ok(deleteAPDByID.calledWith('apd id'), 'the right APD is deleted');
    test.ok(res.status.calledWith(204), 'HTTP status set to 204');
    test.ok(res.send.notCalled, 'no body is sent');
    test.ok(res.end.called, 'response is terminated');
  });
});
