/**
 * CogniCity Server /floodgauges endpoint
 * @module src/api/floodgauges/index
 **/
 import {Router} from 'express';

// Import our data model
import floodgauges from './model';

// Import any required utility functions
import {cacheResponse, handleGeoResponse} from '../../../lib/util';

// Import validation dependencies
import Joi from 'joi';
import validate from 'celebrate';

/**
 * Endpoint specification for floodgauges data
 * @alias module:src/api/floodgauges/index
 * @param {Object} config Server configuration
 * @param {Object} db PG Promise database instance
 * @param {Object} logger Configured Winston logger instance
 * @return {Object} api Express router object for reports route
 */
export default ({config, db, logger}) => {
  let api = Router(); // eslint-disable-line new-cap

  // Get a list of all flood gauge reports
  api.get('/', cacheResponse('1 minute'),
    validate({
      query: {
        admin: Joi.any().valid(config.REGION_CODES),
        geoformat: Joi.any().valid(config.GEO_FORMATS)
          .default(config.GEO_FORMAT_DEFAULT),
      },
    }),
    (req, res, next) => floodgauges(config, db, logger).all(req.query.admin)
      .then((data) => handleGeoResponse(data, req, res, next))
      .catch((err) => {
        /* istanbul ignore next */
        logger.error(err);
        /* istanbul ignore next */
        next(err);
      })
  );

  // Get a single flood gauge report
  api.get('/:id', cacheResponse('1 minute'),
    validate({
      params: {id: Joi.number().integer().required()},
      query: {
        geoformat: Joi.any().valid(config.GEO_FORMATS)
          .default(config.GEO_FORMAT_DEFAULT),
      },
    }),
    (req, res, next) => floodgauges(config, db, logger).byId(req.params.id)
      .then((data) => handleGeoResponse(data, req, res, next))
      .catch((err) => {
        /* istanbul ignore next */
        logger.error(err);
        /* istanbul ignore next */
        next(err);
      })
  );

  return api;
};
