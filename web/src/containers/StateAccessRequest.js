import PropTypes from 'prop-types';
import React, { useReducer, Fragment, useState, useEffect } from 'react';

import { Autocomplete, Badge, TextField } from '@cmsgov/design-system';
import AuthenticationForm from '../components/AuthenticationForm';

import { STATES } from '../util/states';

import axios from '../util/api';

const statesWithFederal = [...STATES, { id: 'fd', name: 'Federal' }];

const StateAccessRequest = ({ 
  saveAction, 
  cancelAction,
  errorMessage, 
  fetching,
  secondaryButtonText,
}) => {

  const [existingAffiliations, setExistingAffiliations] = useState([])

  useEffect( ()=>{
    const fetchData = async () => {
      const affiliations = await axios.get('/affiliations/me')
      const results = affiliations.data.map(affiliation =>{
        const stateDetails = statesWithFederal.find(item => item.id === affiliation.stateId)
        return { id: affiliation.stateId, name: stateDetails.name, status: affiliation.status }
      })
      setExistingAffiliations(results)
      return null
    }
    fetchData()
  }, [])

  /**
  const existingAffiliations = Object.keys(currentAffiliations).map(stateId => {
    const stateDetails = statesWithFederal.find(item => item.id === stateId)
    return { id: stateId, name: stateDetails.name, status: currentAffiliations[stateId] }
  });
  */
  const availableStates = statesWithFederal.filter( item => {
    return !existingAffiliations.find(affiliation => {
      return affiliation.id === item.id;
    });
  });

  const pendingAffiliations = existingAffiliations.filter(element => element.status === 'requested');
  const inactiveAffiliations = existingAffiliations.filter(element => element.status === 'revoked' || element.status === 'denied');
  const activeAffiliations = existingAffiliations.filter(element => element.status === 'approved');

  const autocompleteLabel = existingAffiliations.length > 0 ? "Request a new State Affiliation" : "Select your State Affiliation";

  const initialState = {
    fullStateList: availableStates,
    filteredStates: availableStates,
    selectedStates: [],
    inputValue: ''
  };

  function reducer(state, action) {
    switch (action.type) {
      case 'filter':
        return {
          ...state,
          filteredStates: state.fullStateList.filter(el =>
            el.name.toLowerCase().startsWith(action.payload.toLowerCase())
          ),
          inputValue: action.payload
        };
      case 'addSelectedState':
        return {
          selectedStates: [...state.selectedStates, action.payload],
          fullStateList: state.fullStateList.filter(
            item => item.id !== action.payload.id
          ),
          filteredStates: state.fullStateList.filter(
            item => item.id !== action.payload.id
          ),
          inputValue: ''
        };
      case 'removeSelectedState':
        return {
          ...state,
          fullStateList: [
            ...state.fullStateList,
            statesWithFederal.find(item => item.id === action.payload)
          ].sort((a, b) => a.name.localeCompare(b.name)),
          selectedStates: state.selectedStates.filter(
            item => item.id !== action.payload
          ),
          inputValue: ''
        };
      default:
        throw new Error("Unrecognized action provided to StateAccessRequest reducer hook");
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  const handleOnChange = selection => {
    // onChange can be triggered by hitting escape which will
    // pass a null value and make the subsequent actions fail
    if (selection === null) {
      return;
    }
    dispatch({ type: 'addSelectedState', payload: selection });
  };

  const handleRemoveItem = element => {
    dispatch({
      type: 'removeSelectedState',
      payload: element.target.dataset.id
    });
  };

  const handleInputChange = query => {
    dispatch({ type: 'filter', payload: query });
  };

  const handleSubmit = e => {
    e.preventDefault();
    saveAction(state.selectedStates);
  };

  const cardTitle = existingAffiliations.length > 0 ? "Manage Account" : "Verify Your Identity"

  const UserExistingAffiliations = () => {
    return (
      <Fragment>
        <h2 className="ds-h4 ds-u-margin-y--1">Existing Affiliations</h2>
        <p className="ds-u-margin-top--0 ds-u-font-size--small">Below are your current, pending and/or revoked state affiliations. Contact the State Administrator for the state you wish to be have removed from your state affiliation list.</p>
        <div className="ds-u-border--1 ds-u-padding--2">
          <h3 className="ds-h5">Active</h3>
          {activeAffiliations.length === 0 && "No active affiliations"}
          {activeAffiliations.map(el => {
            return (
              <Badge className="ds-u-margin-bottom--1" key={el.id}>
                {el.name}
              </Badge>     
            )
          })}
          <h3 className="ds-h5 ds-u-padding-top--2 ds-u-margin-top--1 ds-u-border-top--1">Pending</h3>
          {pendingAffiliations.length === 0 && "No pending affiliations"}
          {pendingAffiliations.map(el => {
            return (
              <Badge className="ds-u-margin-bottom--1" key={el.id}>
                {el.name}
              </Badge>     
            )
          })}
          <h3 className="ds-h5 ds-u-padding-top--2 ds-u-margin-top--1 ds-u-border-top--1">Revoked</h3>
          {inactiveAffiliations.length === 0 && "No revoked affiliations"}
          {inactiveAffiliations.map(el => {
            return (
              <Badge className="ds-u-margin-bottom--1" key={el.id}>
                {el.name}
              </Badge>     
            )
          })}
        </div>
      </Fragment>
    )
  };
    
  const handleCancel = e => {
    e.preventDefault();
    if (cancelAction) cancelAction();
  };

  return (
    <div id="start-main-content">
      <AuthenticationForm
        id="state-access-request-form"
        title={cardTitle}
        legend={cardTitle}
        cancelable
        className="ds-u-margin-top--7"
        canSubmit={state.selectedStates.length > 0}
        error={errorMessage}
        success={null}
        working={fetching}
        primaryButtonText={['Submit', 'Submitting']}
        secondaryButtonText={secondaryButtonText}
        onSave={handleSubmit}
        onCancel={handleCancel}
      >
        <div className="ds-u-margin-bottom--4">
          <h2 className="ds-h4 ds-u-margin-top--2">
            {autocompleteLabel}
          </h2>

          <Autocomplete
            items={state.filteredStates}
            onChange={handleOnChange}
            onInputValueChange={handleInputChange}
            clearSearchButton={false}
            inputValue={state.inputValue}
            id="state-selection"
          >
            {state.selectedStates.map(el => {
              return (
                <Badge
                  className="ds-u-margin-bottom--1"
                  key={el.id}
                  variation="info"
                >
                  {el.name}{' '}
                  <button
                    className="eapd-badge-remove"
                    type="button"
                    data-id={el.id}
                    onClick={handleRemoveItem}
                  >
                    <span className="ds-u-visibility--screen-reader">
                      Remove {el.name}
                    </span>
                  </button>
                </Badge>
              );
            })}
            <TextField
              label={autocompleteLabel}
              placeholder="Search state here"
              className="ds-u-margin-top--2"
              labelClassName="ds-u-visibility--screen-reader"
              name="select-states-field"
            />
            <img
              className="eapd-autocomplete__search-icon"
              src="/static/icons/search.svg"
              alt="Search icon"
            />
          </Autocomplete>

          {existingAffiliations.length > 0 && (
            <UserExistingAffiliations />
          )}
        </div>
      </AuthenticationForm>
    </div>
  );
};

StateAccessRequest.propTypes = {
  saveAction: PropTypes.func.isRequired,
  errorMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  fetching: PropTypes.bool.isRequired,
  cancelAction: PropTypes.func.isRequired,
  secondaryButtonText: PropTypes.string.isRequired
};

StateAccessRequest.defaultProps = {
  errorMessage: false,

};


export default StateAccessRequest;

export { StateAccessRequest as plain };