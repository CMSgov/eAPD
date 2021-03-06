import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import ExecutiveSummaryBudget from './ExecutiveSummaryBudget';
import Waypoint from './ConnectedWaypoint';
import Dollars from '../components/Dollars';
import Review from '../components/Review';
import { Section, Subsection } from '../components/Section';

import { selectApdYears } from '../reducers/apd.selectors';
import {
  selectBudgetExecutiveSummary,
  selectBudgetGrandTotal
} from '../reducers/budget.selectors';

const ExecutiveSummary = ({ data, total, years }) => {
  const apdId = +useParams().apdId;
  return (
    <React.Fragment>
      <Waypoint />
      <Section resource="executiveSummary">
        <Waypoint id="executive-summary-summary" />
        <Subsection
          id="executive-summary-summary"
          resource="executiveSummary.summary"
        >
          {data.map((activity, i) => (
            <Review
              key={activity.key}
              heading={
                <Fragment>
                  Activity {i + 1}: {activity.name}
                </Fragment>
              }
              headingLevel="4"
              editHref={`/apd/${apdId}/activity/${i}/overview`}
              className={i === data.length - 1 ? 'ds-u-border-bottom--0' : ''}
            >
              {activity.summary && <p>{activity.summary}</p>}
              <ul className="ds-c-list--bare">
                <li>
                  <strong>Start date - End date:</strong> {activity.dateRange}
                </li>
                <li>
                  <strong>Total cost of activity:</strong>{' '}
                  <Dollars>{activity.combined}</Dollars>
                </li>
                <li>
                  <strong>Total Computable Medicaid Cost:</strong>{' '}
                  <Dollars>{activity.medicaid}</Dollars> (
                  <Dollars>{activity.federal}</Dollars> Federal share)
                </li>
                {Object.entries(activity.ffys).map(
                  ([ffy, { medicaidShare, federal, total: ffyTotal }], j) => (
                    <li
                      key={ffy}
                      className={j === 0 ? 'ds-u-margin-top--2' : ''}
                    >
                      <strong>FFY {ffy}:</strong> <Dollars>{ffyTotal}</Dollars>{' '}
                      | <strong>Total Computable Medicaid Cost:</strong>{' '}
                      <Dollars>{medicaidShare}</Dollars> (
                      <Dollars>{federal}</Dollars> Federal share)
                    </li>
                  )
                )}
              </ul>
            </Review>
          ))}

          <hr className="ds-u-border--dark ds-u-margin--0" />
          <Review
            heading="Total cost"
            headingLevel="4"
            className="ds-u-border--0"
          >
            <p>
              Verify that this information is correct. Edit activities above to
              make changes.
            </p>
            <ul className="ds-c-list--bare">
              <li>
                <strong>Federal Fiscal Years requested:</strong> FFY{' '}
                {years.join(', ')}
              </li>
              <li>
                <strong>Total Computable Medicaid Cost:</strong>{' '}
                <Dollars>{total.medicaid}</Dollars> (
                <Dollars>{total.federal}</Dollars> Federal share)
              </li>
              <li>
                <strong>Total funding request:</strong>{' '}
                <Dollars>{total.combined}</Dollars>
              </li>
              {Object.entries(total.ffys).map(
                ([ffy, { medicaid, federal, total: ffyTotal }], i) => (
                  <li key={ffy} className={i === 0 ? 'ds-u-margin-top--2' : ''}>
                    <strong>FFY {ffy}:</strong> <Dollars>{ffyTotal}</Dollars> |{' '}
                    <Dollars>{medicaid}</Dollars> Total Computable Medicaid Cost
                    | <Dollars>{federal}</Dollars> Federal share
                  </li>
                )
              )}
            </ul>
          </Review>
        </Subsection>

        <Waypoint id="executive-summary-budget-table" />
        <Subsection
          id="executive-summary-budget-table"
          resource="executiveSummary.budgetTable"
        >
          <ExecutiveSummaryBudget />
        </Subsection>
      </Section>
    </React.Fragment>
  );
};

ExecutiveSummary.propTypes = {
  data: PropTypes.array.isRequired,
  total: PropTypes.object.isRequired,
  years: PropTypes.array.isRequired
};

const mapStateToProps = state => ({
  data: selectBudgetExecutiveSummary(state),
  total: selectBudgetGrandTotal(state),
  years: selectApdYears(state)
});

export default connect(mapStateToProps)(ExecutiveSummary);

export { ExecutiveSummary as plain, mapStateToProps };
