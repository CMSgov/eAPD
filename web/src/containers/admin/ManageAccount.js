import PropTypes from 'prop-types';
import React, { useState, Fragment, useEffect } from 'react';
import { connect } from 'react-redux';

import { useHistory } from 'react-router-dom';

import {
  createAccessRequest as actualCreateAccessRequest,
  completeAccessRequest as actualCompleteAccessRequest,
} from '../../actions/auth';

import StateAccessRequest from '../StateAccessRequest';
import StateAccessRequestConfirmation from '../StateAccessRequestConfirmation';
import { getIsFedAdmin } from '../../reducers/user.selector';
import { goToDashboard } from '../../actions/app';
import axios from '../../util/api';

const ManageAccount = ({
  createAccessRequest,
  completeAccessRequest,
  error,
  isAdmin,
  currentUser,
  dashboard
}) => {

  const history = useHistory();

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [currentAffiliations, setCurrentAffiliations] = useState([])

  useEffect( ()=>{
    const fetchData = async () => {
      const affiliations = await axios.get('/affiliations/me')
      setCurrentAffiliations(affiliations.data)
      return null
    }

    fetchData()
  }, [])
  const handleCreateAccessRequest = async states => {
    const response = await createAccessRequest(states);
    if (response) { setShowConfirmation(true) }
  };

  const handleCompleteAccessRequest = async () => {
    await completeAccessRequest();
    history.push('/');
  };

  if(error) {
    setShowConfirmation(false);
  }

  const secondaryButtonText = isAdmin
    ? 'Admin Dashboard'
    : `${
      currentUser.state && currentUser.state.id
        ? `${currentUser.state.id.toUpperCase()} `
        : ''
    }APD Home`
  
  return (
    <Fragment>
      {showConfirmation ? 
        <StateAccessRequestConfirmation action={handleCompleteAccessRequest} />
        : <StateAccessRequest
            saveAction={handleCreateAccessRequest}
            fetching={false}
            errorMessage={error}
            currentAffiliations={currentAffiliations}
            secondaryButtonText={secondaryButtonText}
            cancelAction={dashboard}
          />
      }
    </Fragment>
  );
};

ManageAccount.defaultProps = {
  error: null,
  currentUser: null,
};

ManageAccount.propTypes = {
  createAccessRequest: PropTypes.func.isRequired,
  completeAccessRequest: PropTypes.func.isRequired,
  error: PropTypes.string,
  isAdmin: PropTypes.bool.isRequired,
  currentUser: PropTypes.object,
  dashboard: PropTypes.func.isRequired
};

const mapDispatchToProps = {
  dashboard: goToDashboard,
  createAccessRequest: actualCreateAccessRequest,
  completeAccessRequest: actualCompleteAccessRequest
};

const mapStateToProps = state => ({
  error: state.auth.error,
  isAdmin: getIsFedAdmin(state),
  currentUser: state.user,

});

export default connect(mapStateToProps, mapDispatchToProps)(ManageAccount);

export { ManageAccount as plain, mapStateToProps, mapDispatchToProps };