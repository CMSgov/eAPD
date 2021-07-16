import { Alert, Button } from '@cmsgov/design-system';
import PropType from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Icon, { File, faPlusCircle } from './Icons';
import Instruction from './Instruction';
import DeleteModal from './DeleteModal';
import { createApd, deleteApd, selectApd } from '../actions/app';
import { t } from '../i18n';
import { selectApdDashboard, selectApds } from '../reducers/apd.selectors';
import UpgradeBrowser from './UpgradeBrowser';
import Loading from './Loading';

const ApdList = ({
  apds,
  createApd: create,
  deleteApd: del,
  fetching,
  error,
  route,
  selectApd: select,
  state,
  activities
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const createNew = () => {
    setIsLoading(true);
    create();
  };

  const open = id => e => {
    setIsLoading(true);
    e.preventDefault();
    select(id, `${route}/${id}`);
  };

  const canCreateApd = activities.indexOf('edit-document') >=0

  const canDeleteApd = activities.indexOf('edit-document') >=0

  if (isLoading) {
    return (
      <div id="start-main-content">
        <Loading>Loading your APD</Loading>
      </div>
    );
  }

  return (
    <div className="site-body ds-l-container">
      <div className="ds-u-margin--0">
        <main id="start-main-content">
          <div className="ds-u-padding-top--2">
            <UpgradeBrowser />
            {error && (
              <Alert variation="error" role="alert">
                {error}
              </Alert>
            )}
            <div className="ds-l-row ds-u-margin-top--7">
              <div className="ds-l-col--8 ds-u-margin-x--auto">
                <div
                  className="ds-u-display--flex ds-u-justify-content--center"
                  data-testid="eAPDlogo"
                >
                  <img
                    src="/static/img/eAPDLogoSVG_ICO/SVG/eAPDColVarSVG.svg"
                    alt="eAPD Logo"
                  />
                </div>
                <Instruction source="stateDashboard.introduction" />
                <div className="ds-u-margin-top--5 ds-u-padding-bottom--1 ds-u-border-bottom--2">
                  <h2 className="ds-h2 ds-u-display--inline-block">
                    {state ? state.name : ''} APDs
                  </h2>
                  {canCreateApd && (
                    <Button
                      variation="primary"
                      className="ds-u-float--right"
                      onClick={createNew}
                    >
                      Create new{' '}
                      <span className="ds-u-visibility--screen-reader">
                        APD
                      </span>
                      &nbsp;&nbsp;
                      <Icon icon={faPlusCircle} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {fetching ? <Loading>Loading APDs</Loading> : null}
            {!fetching && apds.length === 0 ? (
              <div className="ds-l-row">
                <div className="ds-l-col--8 ds-u-margin-x--auto ds-u-padding-top--2 ds-u-padding-bottom--5 ds-u-color--muted">
                  {t('stateDashboard.none')}
                </div>
              </div>
            ) : null}
            {apds.map(apd => (
              <div key={apd.id} className="ds-l-row">
                <div className="ds-l-col--8 ds-u-margin-x--auto ds-u-padding-top--2">
                  <div className="ds-u-border-bottom--2 ds-u-padding-bottom--3">
                    <div className="ds-u-display--inline-block ds-u-float--left ds-u-fill--primary-alt-lightest ds-u-padding--2 ds-u-margin-right--2">
                      <File size="lg" color="#046b99" />
                    </div>
                    <div className="ds-u-display--inline-block">
                      <h3 className="ds-u-margin-y--0">
                        <a href={`${route}/${apd.id}`} onClick={open(apd.id)}>
                          <span className="ds-u-visibility--screen-reader">
                            Edit APD:{' '}
                          </span>
                          {apd.name}
                        </a>
                      </h3>
                      <ul className="ds-c-list--bare">
                        <li>
                          <strong>Last edited:</strong> {apd.updated}
                        </li>
                        <li>
                          <strong>Created:</strong> {apd.created}
                        </li>
                      </ul>
                    </div>
                    <div className="ds-u-display--inline-block ds-u-float--right ds-u-text-align--right">
                      {canDeleteApd && (
                        <Button
                          variation="transparent"
                          size="small"
                          onClick={() => setShowDeleteModal(apd.id)}
                        >
                          Delete{' '}
                          <span className="ds-u-visibility--screen-reader">
                            {' '}
                            this APD
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {showDeleteModal === apd.id && (
                  <DeleteModal
                    objType="APD"
                    onCancel={() => setShowDeleteModal(false)}
                    onDelete={() => del(apd.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

ApdList.propTypes = {
  apds: PropType.array.isRequired,
  fetching: PropType.bool.isRequired,
  error: PropType.string.isRequired,
  route: PropType.string,
  state: PropType.object.isRequired,
  createApd: PropType.func.isRequired,
  deleteApd: PropType.func.isRequired,
  selectApd: PropType.func.isRequired,
  activities: PropType.array.isRequired
};

ApdList.defaultProps = {
  route: '/apd'
};

const mapStateToProps = state => ({
  apds: selectApdDashboard(state),
  fetching: selectApds(state).fetching || false,
  error: selectApds(state).error || '',
  state: state.user.data.state || null,
  activities: state.user.data.activities
});

const mapDispatchToProps = {
  createApd,
  deleteApd,
  selectApd
};

export default connect(mapStateToProps, mapDispatchToProps)(ApdList);
