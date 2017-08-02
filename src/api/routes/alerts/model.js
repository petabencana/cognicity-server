/**
 * CogniCity Server /reports data model
 * @module src/api/reports/model
 **/
 import Promise from 'bluebird';

 const _upsertAlertUser = (config, db, logger, body) => new Promise((resolve, reject) => {
   // First check if user exists
   let query = `SELECT pkey FROM ${config.TABLE_ALERT_USERS}
   WHERE username = $1 AND network = $2`;

   // Params
   let values = [ body.username, body.network, body.language ];

   // Log
   logger.debug(query, values);

   // Execute
   db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
     .then((data) => {
       if ( data && data.pkey !== null ){
         resolve({userkey: data.pkey})
       }
       else {
         let query = `INSERT INTO ${config.TABLE_ALERT_USERS}
           (username, network, language, subscribed)
           VALUES ($1, $2, $3, TRUE) RETURNING pkey;`

         // Get params
         let values = [ body.username, body.network, body.language ];

         // log
         logger.debug(query, values)

         // execute
         db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
           .then((data) => {
             resolve({userkey: data.pkey})
           })
           .catch((err) => {
             reject(err);
           })
         }
       })
       .catch((err) => {
         reject(err);
       })
     })

/**
 * Methods to get current flood reports from database
 * @alias module:src/api/reports/model
 * @param {Object} config Server configuration
 * @param {Object} db PG Promise database instance
 * @param {Object} logger Configured Winston logger instance
 * @return {Object} Query methods
 */
export default (config, db, logger) => ({

	// Return specific report by id
	byUser: (username, network) => new Promise((resolve, reject) => {
		// Setup query
    let query = `SELECT u.username, u.network, u.subscribed, u.language, locations.* FROM
      ${config.TABLE_ALERT_USERS} u, (SELECT a.pkey as location_key, a.userkey, a.the_geom,
        array_to_json(array_agg(b.*)) as alert_log FROM
          ${config.TABLE_ALERT_LOCATIONS} a
          LEFT JOIN ${config.TABLE_ALERT_LOGS} b ON a.pkey = b.location_key
          GROUP BY a.pkey) as locations
        WHERE u.pkey = locations.userkey
        AND u.username = $1
        AND u.network = $2`;

		// Setup values
		let values = [username, network];

		// Execute
		logger.debug(query, values);
		db.any(query, values).timeout(config.PGTIMEOUT)
			.then((data) => resolve(data))
			/* istanbul ignore next */
			.catch((err) => {
				/* istanbul ignore next */
				reject(err);
			});
	}),

  // Create an alert object
  create: (body) => new Promise ((resolve, reject) => {

      _upsertAlertUser(config, db, logger, body)
        .then((data) => {

          let userkey = data.userkey

          // Now register alert location against user
          let query = `INSERT INTO ${config.TABLE_ALERT_LOCATIONS}
          (userkey, the_geom) VALUES ($1, ST_SetSRID(ST_Point($2, $3),4326)) RETURNING pkey`;

          // params
          let values = [ userkey, body.location.lng, body.location.lat ];

          // log
          logger.debug(query, values);

          // execute
          db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
          .then((data) => {
            let location_key = data.pkey
            resolve({userkey, location_key});
          })
          /* istanbul ignore next */
          .catch((err) => {
            /* istanbul ignore next */
            reject(err);
          });
        })
        .catch((err) => {
          reject(err);
        });
    }),
});