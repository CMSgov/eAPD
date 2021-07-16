import React from 'react';
import { render, fireEvent, axe, screen, waitFor } from '../shared/apd-testing-library';
import StateAccessRequest from './StateAccessRequest';
import MockAdapter from 'axios-mock-adapter';
import axios from '../util/api';

const fetchMock = new MockAdapter(axios);
const defaultProps = {
  errorMessage: null,
  saveAction: jest.fn(),
  fetching: false,
  secondaryButtonText: 'Back to Login',
  cancelAction: () => {}

};


// https://testing-library.com/docs/example-input-event/
const setup = (props = {}) => render(<StateAccessRequest {...defaultProps} {...props} />);

describe('<StateAccessRequest />', () => {

  beforeEach(() => {
    fetchMock.reset();
  });


  it('should not fail any accessibility tests', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, []);
    const { container } = setup();

    await waitFor(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('renders correct title when no existing affiliations', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, []);
    setup();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeTruthy();
    })
  });

  it('renders correct title(s) with existing affiliations', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [

                {
                  stateId: 'mo',
                  status: 'requested'
                }
              ]);

    setup()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Manage Account' })).toBeTruthy();
      expect(screen.getByText('Existing Affiliations')).toBeTruthy();
    })
  });

  it('renders existing affiliations', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [
      {
        stateId: 'az',
        status: 'approved'
      },
      {
        stateId: 'md',
        status: 'revoked'
      },
      {
        stateId: 'ak',
        status: 'requested'
      }
    ]);
    setup()

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy();
      expect(screen.getByText('Arizona')).toBeTruthy();
      expect(screen.getByText('Revoked')).toBeTruthy();
      expect(screen.getByText('Maryland')).toBeTruthy();
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.getByText('Alaska')).toBeTruthy();
    });
  });

  it('renders message when no affiliations exist per status', async () => {
    fetchMock.onGet('/affiliations/me').reply(200, [
      {
        stateId: 'ar',
        status: 'requested'
      },
      {
        stateId: 'ak',
        status: 'revoked'
      }

    ]);
    setup();

    await waitFor(() => {
      expect(screen.getByText('No active affiliations')).toBeTruthy();
    });


  });

  it('renders label', () => {
    setup();
    expect(screen.getByLabelText('Select your State Affiliation')).toBeTruthy();
  });

  test('Secondary button renders the right text', () => {
    setup();
    expect(screen.getByText(/Back to Login/i)).toBeTruthy();
  });

  test('Back to Login button renders', () => {
    setup({ secondaryButtonText: 'This is a secondary button' });
    expect(screen.getByText(/This is a secondary button/i)).toBeTruthy();
  });

  it('renders the input when entered', () => {
    setup();
    const input = screen.getByLabelText('Select your State Affiliation');
    fireEvent.change(input, { target: { value: 'Al' } });
    expect(input.value).toBe('Al');
  });

  it('renders the selection badge when an item is picked', () => {
    setup();
    const input = screen.getByLabelText('Select your State Affiliation');
    fireEvent.change(input, { target: { value: 'Alabama' } });
    fireEvent.click(screen.getByText('Alabama'));
    expect(screen.getByText('Alabama')).toBeTruthy();
  });

  it('renders the no results on an invalid entry', () => {
    const { getByText, getByLabelText } = setup();
    const input = getByLabelText('Select your State Affiliation');
    fireEvent.change(input, { target: { value: 'invalid123999' } });
    expect(getByText('No results')).toBeTruthy();
  });

  it('properly removes a selection', () => {
    const { getByText, getByLabelText, getByRole, queryByText } = setup();
    const input = getByLabelText('Select your State Affiliation');
    fireEvent.change(input, { target: { value: 'Alabama' } });
    fireEvent.click(getByText('Alabama'));
    fireEvent.click(getByRole('button', { name: 'Remove Alabama' }));
    expect(queryByText('Alabama')).toBeNull();
  });

  it('renders the submit button as disabled until a selection is made', () => {
    const { getByText, getByLabelText } = setup();
    const input = getByLabelText('Select your State Affiliation');
    expect(getByText('Submit')).toHaveAttribute('disabled');
    fireEvent.change(input, { target: { value: 'Al' } });
    fireEvent.click(getByText('Alabama'));
    expect(getByText('Submit')).not.toHaveAttribute('disabled');
  });
});
