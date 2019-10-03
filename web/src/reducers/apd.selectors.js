import { createSelector } from 'reselect';
import { INCENTIVE_ENTRIES } from '../util';

export const selectApds = ({ apd }) => apd;

export const selectApdData = ({ apd: { data } }) => data;

export const selectApdYears = ({
  apd: {
    data: { years }
  }
}) => years;

export const selectKeyPersonnel = createSelector(
  [selectApdData],
  ({ keyPersonnel }) => keyPersonnel
);

export const selectPreviousHITHIEActivities = createSelector(
  [selectApdData],
  ({ previousActivityExpenses }) =>
    Object.entries(previousActivityExpenses).reduce(
      (o, [year, expenses]) => ({
        ...o,
        [year]: {
          federalActual: expenses.hithie.federalActual,
          totalApproved: expenses.hithie.totalApproved
        }
      }),
      {}
    )
);

export const selectPreviousMMISActivities = createSelector(
  [selectApdData],
  ({ previousActivityExpenses }) =>
    Object.entries(previousActivityExpenses).reduce(
      (o, [year, expenses]) => ({
        ...o,
        [year]: expenses.mmis
      }),
      {}
    )
);

export const selectPreviousActivityExpensesTotals = createSelector(
  [selectApdData],
  ({ previousActivityExpenses }) =>
    Object.entries(previousActivityExpenses).reduce(
      (acc, [ffy, expenses]) => ({
        ...acc,
        [ffy]: {
          actual:
            expenses.hithie.federalActual +
            [90, 75, 50].reduce(
              (sum, ffp) => sum + expenses.mmis[ffp].federalActual,
              0
            ),
          approved:
            expenses.hithie.totalApproved * 0.9 +
            [90, 75, 50].reduce(
              (sum, ffp) =>
                sum + (expenses.mmis[ffp].totalApproved * ffp) / 100,
              0
            )
        }
      }),
      {}
    )
);

const addObjVals = obj => Object.values(obj).reduce((a, b) => +a + +b, 0);

export const selectIncentivePayments = ({
  apd: {
    data: { incentivePayments }
  }
}) => incentivePayments;

export const selectIncentivePaymentTotals = createSelector(
  [selectApdData],
  ({ incentivePayments, years }) => {
    const totals = INCENTIVE_ENTRIES.reduce((obj, entry) => {
      const datum = incentivePayments[entry.id];
      const byYear = years.reduce((obj2, yr) => {
        obj2[yr] = addObjVals(datum[yr]);
        return obj2;
      }, {});

      obj[entry.id] = { byYear, allYears: addObjVals(byYear) };
      return obj;
    }, {});

    return totals;
  }
);

export const selectApdDashboard = createSelector(
  [selectApds],
  ({ byId }) =>
    Object.values(byId).map(({ id, name, updated }) => ({ id, name, updated }))
);
