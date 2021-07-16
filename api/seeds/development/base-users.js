const { format } = require('date-fns')
const fs = require('fs')
const logger = require('../../logger')('user seeder');
const { oktaClient } = require('../../auth/oktaAuth');
const { createUsersToAdd } = require('../shared/set-up-users');
const { issueTokens} = require('../shared/issueTokens')


exports.seed = async knex => {
  const {oktaAffiliations, stateCertifications, oktaUsers} = await createUsersToAdd(knex, oktaClient);
  await knex('auth_affiliations').insert(oktaAffiliations);
  logger.info('Completed adding affiliations');
  await knex('okta_users').insert(oktaUsers)
  logger.info('Completed adding okta_users');
  await knex('state_admin_certifications').insert(stateCertifications)
  const auditEntries = stateCertifications.map(certification =>{
    return {
      username:certification.uid,
      changeDate:format( new Date(), 'yyyy-MM-dd HH:mm:ss'),
      changedBy: 'seeds'
    }
  })

  await knex('state_admin_certifications_audit').insert(auditEntries)

  const testTokens = await issueTokens(oktaUsers)

  // save the tokens to a file
  try {
    fs.writeFileSync(`${__dirname  }/../test/tokens.json`, JSON.stringify(testTokens,null, 4))
  } catch (err) {
    // not much to do here but log it
    console.error(err)
  }

};
