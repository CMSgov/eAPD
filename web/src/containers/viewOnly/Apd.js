import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@cmsgov/design-system';
import {
  useParams as actualUseParams,
  useHistory as actualUseHistory
} from 'react-router-dom';

import { selectApd } from '../../actions/app';
import { selectApdData } from '../../reducers/apd.selectors';
import { selectBudget } from '../../reducers/budget.selectors';
import { getAPDYearRange } from '../../reducers/apd';
import { getUserStateOrTerritory } from '../../reducers/user.selector';
import ApdStateProfile from './ApdStateProfile';
import ApdSummary from './ApdSummary';
import PreviousActivities from './PreviousActivities';
import Activities from './activities/All';
import ScheduleSummary from './ScheduleSummary';
import ProposedBudget from './ProposedBudget';
import AssuranceAndCompliance from './AssurancesAndCompliance';
import ExecutiveSummary from './ExecutiveSummary';
import ExportInstructions from './Export';
import Loading from '../../components/Loading';

const ApdViewOnly = ({
  apd,
  budget,
  place,
  year,
  goToApd,
  useParams,
  useHistory
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const apdId = apd.id || null;
  const paramApdId = +useParams().apdId;
  const history = useHistory();

  useEffect(() => {
    if (!paramApdId && !apdId) {
      history.push('/');
    } else if (apdId && !paramApdId) {
      history.push(`/print/${apdId}`);
    } else if (paramApdId && (!apdId || apdId !== paramApdId)) {
      setIsLoading(true);
      goToApd(paramApdId, `/print/${paramApdId}`);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apdId) {
      setIsLoading(false);
    }
  }, [apdId]);

  if (isLoading || !apdId) {
    return (
      <div id="start-main-content">
        <Loading>Loading your APD</Loading>
      </div>
    );
  }

  if (!Object.keys(apd).length || budget.years.length === 0) {
    return null;
  }

  // This check is to ensure the budget has been calculated. If it hasn't, we
  // can't display everything, so just bail. This can happen very briefly
  // between the time an APD is selected and before the budget is calculated,
  // but the resulting unhandled exceptions stop the app.
  const activityKeys = apd.activities.map(({ key }) => key);
  if (
    Object.keys(budget.activities).some(key => activityKeys.indexOf(key) < 0)
  ) {
    return null;
  }

  return (
    <main id="start-main-content" className="ds-l-container ds-u-padding--3">
      <div className="anchor" id="top-anchor">
        <Button
          className="visibility--screen"
          variation="transparent"
          onClick={() => history.push(`/apd/${paramApdId}`)}
        >
          {'< Back to APD'}
        </Button>
      </div>
      <ExportInstructions />
      <h1 className="ds-h1 ds-u-margin-top--2">
        <span className="ds-h6 ds-u-display--block">{apd.name}</span>
        {place.name} {year} APD
      </h1>
      <hr className="section-rule" />
      <ExecutiveSummary apdId={apd.id} />
      <hr className="section-rule" />
      <ApdSummary />
      <hr className="section-rule" />
      <ApdStateProfile
        stateProfile={apd.stateProfile}
        keyPersonnel={apd.keyPersonnel}
      />
      <hr className="section-rule" />
      <PreviousActivities />
      <hr className="section-rule" />
      <Activities apdId={apd.id} activities={apd.activities} />
      <hr className="ds-u-border--dark ds-u-margin--0 ds-u-margin-top--1 ds-u-margin-bottom--1" />
      <ScheduleSummary />
      <hr className="section-rule" />
      <ProposedBudget />
      <hr className="section-rule" />
      <AssuranceAndCompliance />
      <a href="#top-anchor" className="visibility--screen">
        ^ Return to the top of the page
      </a>
    </main>
  );
};

ApdViewOnly.propTypes = {
  apd: PropTypes.object.isRequired,
  budget: PropTypes.object.isRequired,
  place: PropTypes.string.isRequired,
  year: PropTypes.string.isRequired,
  goToApd: PropTypes.func.isRequired,
  useParams: PropTypes.func,
  useHistory: PropTypes.func
};

ApdViewOnly.defaultProps = {
  useParams: actualUseParams,
  useHistory: actualUseHistory
};

const mapStateToProps = state => ({
  apd: selectApdData(state),
  budget: selectBudget(state),
  place: getUserStateOrTerritory(state),
  year: getAPDYearRange(state)
});

const mapDispatchToProps = {
  goToApd: selectApd
};

export default connect(mapStateToProps, mapDispatchToProps)(ApdViewOnly);
