/**
 * CogniCity Server /reports/timeseries data model
 * @module src/api/reports/timeseries/model
 **/
 import Promise from 'bluebird';

 /**
 * Methods to interact with report layer in database
  * @alias module:src/api/reports/timeseries/model
  * @param {Object} config Server configuration
  * @param {Object} db PG Promise database instance
  * @param {Object} logger Configured Winston logger instance
  * @return {Object} Query methods
  */
export default (config, db, logger) => ({

  // Get all flood reports for a given admin boundary
  count: (start, end, admin) => new Promise((resolve, reject) => {
    // Setup query
    let query = `SELECT ts, count(r.pkey)
    FROM generate_series(date_trunc('hour', $1::timestamp with time zone),
    date_trunc('hour', $2::timestamp with time zone), '1 hour') ts
    LEFT JOIN cognicity.all_reports r
    ON date_trunc('hour', r.created_at) = ts
    AND ($3 IS NULL OR tags->>'instance_region_code'=$3)
    GROUP BY ts ORDER BY ts`;

    // Setup values
    let values = [start, end, admin];

    // Execute
    logger.debug(query, values);
    db.any(query, values).timeout(config.PGTIMEOUT)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        /* istanbul ignore next */
        reject(err);
      });
  }),
});
