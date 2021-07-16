import React from 'react'
import { renderWithConnection, waitFor, screen, fireEvent, act } from 'apd-testing-library';

import SelectAffiliation from './SelectAffiliation';
import MockAdapter from 'axios-mock-adapter';
import axios from '../util/api';

const defaultProps = {
  currentStateId: 'md',
  availableAffiliations: ['md', 'ak']
};

const fetchMock = new MockAdapter(axios);
const setup = (props = {}) => {
  return renderWithConnection(
    <SelectAffiliation {...defaultProps} {...props} />,
    {
      initialState: { 
        user: {
          data: {
            state: { name: 'Maryland', id: 'md' }
          }
        } 
      }
    }
  );
};
describe('Switch Affiliation component', () => {
  beforeEach(() => {
    fetchMock.reset();
 });

  test('renders correct title', async () => {
    setup();  
    expect(screen.getByRole('heading')).toHaveTextContent('State Affiliation');
  });
  test('renders correct legend', async () => {
    setup();  
    expect(screen.queryByText('Please select your state affiliation')).toBeTruthy();
  });
  test('renders correct set of radio options', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [{stateId:'md'}, {stateId: 'ak'}])
    setup();
    await act(() => {
      waitFor(() => {
        expect(screen.getByLabelText('Maryland')).toBeTruthy();
        expect(screen.getByLabelText('Alaska')).toBeTruthy();
      })
    });
  })
  test('renders submit button', async () => {
    setup();
    expect(screen.getByRole('button', {name: 'Submit'})).toBeTruthy();
  })
  test('renders cancel button', async () => {
    setup();
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeTruthy();
  })
  test('renders current state as default selected', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [{stateId:'md'}, {stateId: 'ak'}])
    setup();
    await act(() =>{
      waitFor(() => {
        expect(screen.getByLabelText('Maryland')).toBeChecked();
        expect(screen.getByLabelText('Alaska')).not.toBeChecked();
      })
    })
  })
  test('allows different states to be selected', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [{stateId:'md'}, {stateId: 'ak'}])
    setup();
    await act(() => {
      waitFor(() => {
        expect(screen.getByLabelText('Maryland')).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Alaska'));
        expect(screen.getByLabelText('Alaska')).toBeChecked();
        expect(screen.getByLabelText('Maryland')).not.toBeChecked();
      })
    });

  })
});