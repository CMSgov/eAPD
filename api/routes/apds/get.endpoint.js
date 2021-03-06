const {
  getDB,
  setupDB,
  teardownDB,
  login,
  unauthenticatedTest,
  unauthorizedTest
} = require('../../endpoint-tests/utils');

describe('APD endpoint', () => {
  describe('List APDs endpoint | GET /apds', () => {
    const db = getDB();
    beforeAll(() => setupDB(db));
    afterAll(() => teardownDB(db));

    const url = '/apds';

    unauthenticatedTest('get', url);
    unauthorizedTest('get', url);

    describe('when authenticated', () => {
      it('as a user with all permissions', async () => {
        const api = login('all-permissions');
        const response = await api.get(url);
        expect(response.status).toEqual(200);
      });
    });
  });

  describe('Get specific APD | GET /apds/:id', () => {
    const db = getDB();
    beforeAll(() => setupDB(db));
    afterAll(() => teardownDB(db));

    const url = id => `/apds/${id}`;

    unauthenticatedTest('get', url(4000));
    unauthorizedTest('get', url(4000));

    describe('when authenticated', () => {
      it('as a user without a state', async () => {
        const api = login('all-permissions-no-state');
        const response = await api.get(url(4000));
        expect(response.status).toEqual(401);
      });

      describe('as a user with a state', () => {
        let api;
        beforeAll(async () => {
          api = login();
        });

        it('when requesting an APD that does not exist', async () => {
          const response = await api.get(url(9999));
          expect(response.status).toEqual(404);
        });

        it('when requesting an APD that belongs to another state', async () => {
          const response = await api.get(url(4000));
          expect(response.status).toEqual(404);
        });

        it('when requesting an APD that belongs to their state', async () => {
          const response = await api.get(url(4001));
          expect(response.status).toEqual(200);
        });
      });
    });
  });
});
