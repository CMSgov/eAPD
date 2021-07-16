const {
  getDB,
  setupDB,
  teardownDB,
  login,
  unauthenticatedTest
} = require('../../endpoint-tests/utils');

const url = '/me';

describe('/me endpoint | GET', () => {
  const db = getDB();
  beforeAll(() => setupDB(db));
  afterAll(() => teardownDB(db));

  unauthenticatedTest('get', url);

  it('when authenticated, with no permissions', async () => {
    const api = login('no-permissions');
    const response = await api.get(url);

    expect(response.status).toEqual(200);
    expect(response.data.states).toEqual({});
  });

  describe('user is authenticated, with all permissions', () => {
    let api;
    let response;
    let user;

    beforeEach(async () => {
      api = login('all-permissions');
      response = await api.get(url);
      user = response.data;
    });

    it('returns a 200 status', () => {
      expect(response.status).toEqual(200);
    });

    it('includes state, role, and activities details for the user', () => {
      expect(user.state).toBeTruthy();
      expect(user.role).toBeTruthy();
      expect(user.activities).toBeTruthy();
    });
  });
});
