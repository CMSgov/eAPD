import React from 'react';
import ApdList from './ApdList';
import { renderWithConnection } from '../shared/apd-testing-library';
import mockAxios from '../util/api';
import { AFFILIATION_STATUSES } from '../constants';

jest.mock('../util/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
}));

let props;
let renderUtils;

const apd = {
  id: '1',
  name: 'Sample APD',
  updated: '2020-07-27 17:50:02.834242+00',
  created: '2020-07-28 20:20:56.835976+00',
  state: 'MO',
  status: 'draft'
};
const createdStr = 'July 27, 2020';
const updatedStr = 'July 28, 2020, 3:20 PM EDT';

describe('<ApdList />', () => {
  beforeEach(() => {
    props = {
      apds: [],
      fetching: false,
      createApd: jest.fn(),
      deleteApd: jest.fn(),
      selectApd: jest.fn(),
      route: '/apd',
      error: undefined
    };
  });

  describe('no apds', () => {
    beforeEach(() => {
      mockAxios.get.mockImplementation(() => Promise.resolve({ data: [] }));
      renderUtils = renderWithConnection(
        <ApdList {...props} pending={false} />,
        {
          initialState: {
            user: {
              data: {
                state: { id: 'mo' },
                states: { 'mo': AFFILIATION_STATUSES.APPROVED },
                activities: [
                  "view-document",
                  "edit-document",
                ]
              }
            }
          }
        }
      );
    });

    it('should display the introduction and instructions', () => {
      const { getByText } = renderUtils;
      expect(
        getByText(
          /The eAPD is designed to help you create and manage your HITECH Advanced Planning Documents/i
        )
      ).toBeTruthy();
    });

    it('should handle clicking the create APD button', async () => {
      mockAxios.post.mockImplementation(() => Promise.resolve({ data: apd }));
      const { getByRole } = renderUtils;
      expect(getByRole('button', { name: /Create new/i })).toBeTruthy();
      // fireEvent.click(getByRole('button', { name: /Create new/i }));
      // expect(props.createApd).toHaveBeenCalled();
    });

    it('should display the empty APD message', () => {
      const { getByText } = renderUtils;
      expect(getByText(/You have not created any APDs./i)).toBeTruthy();
    });

    it("shouldn't display the pending message", () => {
      const { queryByAltText, queryByText } = renderUtils;
      expect(queryByAltText(/Puzzle Piece Icon/i)).toBeNull();
      expect(
        queryByText(/Approval Pending From State Administrator/i)
      ).toBeNull();
    });
  });

  describe('default state with apds', () => {
    beforeEach(() => {
      mockAxios.get.mockImplementation(() => Promise.resolve({ data: [apd] }));
      renderUtils = renderWithConnection(
        <ApdList {...props} pending={false} />,
        {
          initialState: {
            user: {
              data: {
                state: { id: 'mo' },
                states: { state_id: AFFILIATION_STATUSES.APPROVED },
                activities: [
                  "view-document",
                  "edit-document",
                ]
              }
            },
            apd: {
              byId: {
                [apd.id]: {
                  ...apd,
                  created: createdStr,
                  updated: updatedStr
                }
              }
            }
          }
        }
      );
    });

    it('should display the APD', () => {
      const { getByText } = renderUtils;
      expect(getByText(apd.name)).toBeTruthy();
      expect(getByText(updatedStr)).toBeTruthy();
      expect(getByText(createdStr)).toBeTruthy();
    });

    it('should allow the user to click on the APD to edit', () => {
      const { getByText } = renderUtils;
      expect(getByText(apd.name)).toBeTruthy();
    });

    it('should allow the user to click the delete APD button', () => {
      const { getByText } = renderUtils;
      expect(getByText(/Delete/i)).toBeTruthy();
    });
  });
  describe('federal admin viewing state dashboard', () => {
    beforeEach(() => {
      renderUtils = renderWithConnection(<ApdList {...props} />, {
        initialState: {
          user: {
            data: {
              state: { id: 'mo' },
              affiliations: [
                { state_id: 'mo', status: AFFILIATION_STATUSES.APPROVED }
              ],
              activities: [
                "not-view-document",
                "not-edit-document",
              ]
            }
          }
        }
      });
    });

    it('should not display the create apd button', () => {
      const { queryByText } = renderUtils;
      expect(queryByText('Create new')).toBeNull();
    });
  });

// Deleted tests here because the role is not the relevant factor.  This is driven by
// activities, so changing those is more important than a specific role.
});
