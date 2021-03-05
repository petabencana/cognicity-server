/**
 * CogniCity Server /cities endpoint
 * @module src/api/cities/index
 **/
import {Router} from 'express';

// Import our data model
import cities from './model';

// Import any required utility functions
import {cacheResponse, handleGeoResponse, checkIfPointInGeometry} from '../../../lib/util';

// Import validation dependencies
import Joi from 'joi';
import validate from 'celebrate';

/**
 * Endpoint specification for cities data
 * @alias module:src/api/cities/index
 * @param {Object} config Server configuration
 * @param {Object} db PG Promise database instance
 * @param {Object} logger Configured Winston logger instance
 * @return {Object} api Express router object for reports route
 */
export default ({config, db, logger}) => {
  let api = Router(); // eslint-disable-line new-cap

  // Get a list of infrastructure by type for a given administration boundary
  api.get('/', cacheResponse('1 day'),
    validate({
      query: {
        format: Joi.any().valid(config.FORMATS)
          .default(config.FORMAT_DEFAULT),
        geoformat: Joi.any().valid(config.GEO_FORMATS)
          .default(config.GEO_FORMAT_DEFAULT),
      },
    }),
    (req, res, next) => cities(config, db, logger).all()
      .then((data) => handleGeoResponse(data, req, res, next))
      .catch((err) => {
        /* istanbul ignore next */
        logger.error(err);
        /* istanbul ignore next */
        next(err);
      })
  );
  api.get('/bounds', cacheResponse('1 day'),
    validate({
      query: {
        admin: Joi.any().valid(config.REGION_CODES),
        lat: Joi.number().required(),
        long: Joi.number().required(),
        format: Joi.any().valid(config.FORMATS)
          .default(config.FORMAT_DEFAULT),
        geoformat: Joi.any().valid(config.GEO_FORMATS)
          .default(config.GEO_FORMAT_DEFAULT),
      },
    }),
    (req, res, next) => cities(config, db, logger).byID(req.query.admin)
      .then((data) => checkIfPointInGeometry(data, req, res, next))
      .catch((err) => {
        /* istanbul ignore next */
        logger.error(err);
        /* istanbul ignore next */
        next(err);
      })
  );

  return api;
};
