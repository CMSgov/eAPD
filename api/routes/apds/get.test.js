const tap = require('tap');
const sinon = require('sinon');

const can = require('../../middleware').can;
const getEndpoint = require('./get');

const mockExpress = require('../../util/mockExpress');
const mockResponse = require('../../util/mockResponse');

let app;
let res;
let next;
let getAllAPDsByState;

tap.test('GET /apds', async endpointTest => {
  endpointTest.beforeEach(() => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
    getAllAPDsByState = sinon.stub();
  });

  endpointTest.test('setup', async setupTest => {
    getEndpoint(app);

    setupTest.ok(
      app.get.calledWith('/apds', can('view-document'), sinon.match.func),
      'user-specific apds GET endpoint is registered'
    );
  });

  endpointTest.test('get all apds handler', async handlerTest => {
    let handler;
    handlerTest.beforeEach(() => {
      getEndpoint(app, { getAllAPDsByState });
      handler = app.get.args.find(args => args[0] === '/apds')[2];
    });

    handlerTest.test('database error', async invalidTest => {
      const err = { error: 'err0r' };
      getAllAPDsByState.rejects(err);

      await handler({ params: {}, user: { state: { id: 'va' } } }, res, next);

      invalidTest.ok(next.called, 'next is called');
      invalidTest.ok(next.calledWith(err), 'pass error to middleware');
    });

    handlerTest.test(
      'sends an unauthorized error code if the user does not have an associated state',
      async invalidTest => {
        await handler({ params: {}, user: { state: {} } }, res);

        invalidTest.ok(res.status.calledWith(403), 'HTTP status set to 401');
        invalidTest.ok(res.end.called, 'response is terminated');
      }
    );

    handlerTest.test('sends apds', async validTest => {
      getAllAPDsByState.resolves([
        {
          created_at: 'created a',
          document: {
            name: 'apd a',
            years: 'years a'
          },
          id: 'a',
          status: 'status a',
          updated_at: 'updated a',
          other: 'stuff'
        },
        {
          created_at: 'created b',
          document: {
            name: 'apd b',
            years: 'years b'
          },
          id: 'b',
          status: 'status b',
          updated_at: 'updated b',
          gets: 'removed'
        },
        {
          created_at: 'created c',
          document: {
            name: 'apd c',
            years: 'years c'
          },
          id: 'c',
          status: 'status c',
          updated_at: 'updated c',
          from: 'results'
        }
      ]);

      await handler({ params: {}, user: { state: { id: 'va' } } }, res);

      validTest.ok(res.status.notCalled, 'HTTP status not explicitly set');
      validTest.ok(
        res.send.calledWith([
          {
            id: 'a',
            created: 'created a',
            name: 'apd a',
            status: 'status a',
            updated: 'updated a',
            years: 'years a'
          },
          {
            id: 'b',
            created: 'created b',
            name: 'apd b',
            status: 'status b',
            updated: 'updated b',
            years: 'years b'
          },
          {
            id: 'c',
            created: 'created c',
            name: 'apd c',
            status: 'status c',
            updated: 'updated c',
            years: 'years c'
          }
        ]),
        'APD info is sent back'
      );
    });
  });
});

tap.test('apds/:id GET endpoint', async tests => {
  let getAPDByIDAndState;

  tests.beforeEach(() => {
    app = mockExpress();
    res = mockResponse();
    next = sinon.stub();
    getAPDByIDAndState = sinon.stub();
  });

  tests.test('setup', async test => {
    getEndpoint(app);

    test.ok(
      app.get.calledWith(
        '/apds/:id(\\d+)',
        can('view-document'),
        sinon.match.func
      ),
      'user-specific apds GET endpoint is registered'
    );
  });

  tests.test('get single apd handler', async handlerTest => {
    let handler;
    handlerTest.beforeEach(() => {
      getEndpoint(app, { getAPDByIDAndState });
      handler = app.get.args.find(args => args[0] === '/apds/:id(\\d+)')[2];
    });

    handlerTest.test('database error', async t => {
      const err = { error: 'err0r' };
      getAPDByIDAndState.rejects(err);

      await handler(
        { params: { id: '1' }, user: { state: { id: 'va' } } },
        res,
        next
      );

      t.ok(next.called, 'next is called');
      t.ok(next.calledWith(err), 'pass error to middleware');
    });

    handlerTest.test(
      'sends an unauthorized error code if the user does not have an associated state',
      async test => {
        await handler({ params: { id: '1' }, user: { state: {} } }, res);

        test.ok(res.status.calledWith(403), 'HTTP status set to 403');
        test.ok(res.end.called, 'response is terminated');
      }
    );

    handlerTest.test(
      'sends a not found error if there are no valid APDs',
      async test => {
        getAPDByIDAndState.returns(undefined);

        await handler(
          { params: { id: '1' }, user: { state: { id: 'va' } } },
          res,
          next
        );

        test.ok(res.status.calledWith(404), 'HTTP status set to 404');
        test.ok(res.end.called, 'response is terminated');
      }
    );

    handlerTest.test('sends apd', async test => {
      getAPDByIDAndState.returns({
        created_at: 'created at',
        document: {
          stuff: 'from',
          document: 'column',
          goes: 'here'
        },
        id: 'id',
        state_id: 'state',
        status: 'status',
        updated_at: 'updated at',
        other: 'stuff'
      });

      await handler(
        { params: { id: '1' }, user: { state: { id: 'va' } } },
        res
      );

      test.ok(res.status.notCalled, 'HTTP status not explicitly set');
      test.ok(
        res.send.calledWith({
          created: 'created at',
          id: 'id',
          stuff: 'from',
          document: 'column',
          goes: 'here',
          state: 'state',
          status: 'status',
          updated: 'updated at'
        }),
        'APD info is sent back'
      );
    });
  });
});
