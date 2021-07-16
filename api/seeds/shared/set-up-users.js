const { addDays, format, subDays } = require('date-fns');
const logger = require('../../logger')('user seeder');
const { states } = require('../../util/states');

const PostgresDateFormat = 'yyyy-MM-dd HH:mm:ss';

const formatOktaUser = oktaResult =>{
  const {email, displayName, secondEmail, primaryPhone, mobilePhone, login} = oktaResult.profile
  return {
    user_id:oktaResult.id,
    email,
    // metadata: JSON.stringify(oktaResult.profile),
    displayName,
    secondEmail,
    primaryPhone,
    mobilePhone,
    login,
  }
}

const createUsersToAdd = async (knex, oktaClient) => {
  await knex('auth_affiliations').del();
  await knex('state_admin_certifications').del();
  await knex('state_admin_certifications_audit').del();
  await knex('okta_users').del();
  logger.info('Retrieving user ids from Okta');
  const regularUser = (await oktaClient.getUser('em@il.com')) || {};
  const sysAdmin  = (await oktaClient.getUser('sysadmin')) || {};
  const fedAdmin = (await oktaClient.getUser('fedadmin')) || {};
  const stateAdmin = (await oktaClient.getUser('stateadmin')) || {};
  const stateStaff = (await oktaClient.getUser('statestaff')) || {};
  const stateContractor = (await oktaClient.getUser('statecontractor')) || {};
  const requestedRole = (await oktaClient.getUser('requestedrole')) || {};
  const deniedRole = (await oktaClient.getUser('deniedrole')) || {};
  const revokedRole = (await oktaClient.getUser('revokedrole')) || {};

  logger.info('Retrieving role ids from database');
  const sysAdminRoleId = await knex('auth_roles')
    .where({ name: 'eAPD System Admin' })
    .first()
    .then(role => role.id);
  const fedAdminRoleId = await knex('auth_roles')
    .where({ name: 'eAPD Federal Admin' })
    .first()
    .then(role => role.id);
  const stateAdminRoleId = await knex('auth_roles')
    .where({ name: 'eAPD State Admin' })
    .first()
    .then(role => role.id);
  const stateStaffRoleId = await knex('auth_roles')
    .where({ name: 'eAPD State Staff' })
    .first()
    .then(role => role.id);
  const stateContractorRoleId = await knex('auth_roles')
    .where({ name: 'eAPD State Contractor' })
    .first()
    .then(role => role.id);

  logger.info('Setting up affiliations and certifications to add');
  const oktaAffiliations = [];
  const stateCertifications = [];
  const oktaUsers = [];

  if (sysAdmin) {
    states.forEach(state => {
      oktaAffiliations.push({
        user_id: sysAdmin.id,
        state_id: state.id,
        role_id: sysAdminRoleId,
        status: 'approved',
        updated_by: 'seeds',
        username: 'sysadmin'
      });
    });
    oktaUsers.push(formatOktaUser(sysAdmin))
  }
  if (regularUser) {
    oktaAffiliations.push({
      user_id: regularUser.id,
      state_id: 'ak',
      role_id: stateAdminRoleId,
      status: 'approved',
      updated_by: 'seeds',
      username: 'em@il.com'
    });
    // Add an expired certification and this user will be downgraded to "regular user"
    stateCertifications.push({
      username: regularUser.id,
      state: 'ak',
      certificationDate: format(subDays(new Date(), 400), PostgresDateFormat),
      certificationExpiration: format(
        subDays(new Date(), 35),
        PostgresDateFormat
      ),
      certifiedBy: 'seeds'
    })
    oktaUsers.push(formatOktaUser(regularUser))
  }
  if (fedAdmin) {
    oktaAffiliations.push({
      user_id: fedAdmin.id,
      state_id: 'fd',
      role_id: fedAdminRoleId,
      status: 'approved',
      updated_by: 'seeds'
    });
    oktaUsers.push(formatOktaUser(fedAdmin))
  }
  if (stateAdmin) {
    oktaAffiliations.push({
      user_id: stateAdmin.id,
      state_id: 'ak',
      role_id: stateAdminRoleId,
      status: 'approved',
      updated_by: 'seeds'
    });
    // Let them be a staffer in Maryland too
    oktaAffiliations.push({
      user_id: stateAdmin.id,
      state_id: 'md',
      role_id: stateStaffRoleId,
      status: 'approved',
      updated_by: 'seeds'
    });
    // Add a valid certification and this user will remain an admin
    stateCertifications.push({
      username: stateAdmin.id,
      state: 'ak',
      certificationDate: format(subDays(new Date(), 40), PostgresDateFormat),
      certificationExpiration: format(
        addDays(new Date(), 325),
        PostgresDateFormat
      ),
      certifiedBy: 'seeds'
    })

    oktaUsers.push(formatOktaUser(stateAdmin))
  }

  if (stateStaff) {
    oktaAffiliations.push({
      user_id: stateStaff.id,
      state_id: 'ak',
      role_id: stateStaffRoleId,
      status: 'approved',
      updated_by: 'seeds'
    });
    // Add an invalid certification and this user will remain an staff member
    stateCertifications.push({
      username: stateStaff.id,
      state: 'ak',
      certificationDate: format(subDays(new Date(), 400), PostgresDateFormat),
      certificationExpiration: format(
        subDays(new Date(), 35),
        PostgresDateFormat
      ),
      certifiedBy: 'seeds'
    })
    oktaUsers.push(formatOktaUser(stateStaff))
  }
  if (stateContractor) {
    oktaAffiliations.push({
      user_id: stateContractor.id,
      state_id: 'ak',
      role_id: stateContractorRoleId,
      status: 'approved',
      updated_by: 'seeds'
    });
    oktaUsers.push(formatOktaUser(stateContractor))

  }

  if (requestedRole) {
    oktaAffiliations.push({
      user_id: requestedRole.id,
      state_id: 'ak',
      status: 'requested'
    });

    oktaUsers.push(formatOktaUser(requestedRole))
  }
  if (deniedRole) {
    oktaAffiliations.push({
      user_id: deniedRole.id,
      state_id: 'ak',
      status: 'denied'
    });
    oktaUsers.push(formatOktaUser(deniedRole))
  }
  if (revokedRole) {
    oktaAffiliations.push({
      user_id: revokedRole.id,
      state_id: 'ak',
      status: 'revoked'
    });

    oktaUsers.push(formatOktaUser(revokedRole))
  }
  return {oktaAffiliations, stateCertifications, oktaUsers};
};


module.exports = {
  createUsersToAdd
};
