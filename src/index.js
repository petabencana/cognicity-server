// Import express, fs and http
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';

// Import express middlewares
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import responseTime from 'response-time';

// Import custom middlewares
import middleware from './middleware';

// Import config
import config from './config';

// Import DB initializer
import initializeDb from './db';

// Import the route api
import api from './api';

// Import logging libraries
import morgan from 'morgan'; // Express logging
import logger from 'winston'; // Application logging

// Create the server
let app = express();
app.server = http.createServer(app);

// If we are not in dev and console logging has not been requested then remove it
app.get('env') !== 'development' && !config.LOG_CONSOLE && logger.remove(logger.transports.Console);

// Check that log file directory can be written to
try {
	config.LOG_DIR !== '' && fs.lstatSync(config.LOG_DIR).isDirectory();
	logger.info(`Logging to ${config.LOG_DIR !== '' ? config.LOG_DIR : 'current working directory' }`);
} catch(e) {
	// TODO: Is this desired behaviour or should we exit?
	logger.info(`Cannot log to '${config.LOG_DIR}', logging to current working directory instead`);
	config.LOG_DIR = '';
}

// Configure the logger
logger.add(logger.transports.File, {
	filename: path.join(config.LOG_DIR, `${config.APP_NAME}.log`),
	json: config.LOG_JSON, // Log in json or plain text
	maxsize: config.LOG_MAX_FILE_SIZE, // Max size of each file
	maxFiles: config.LOG_MAX_FILES, // Max number of files
	level: config.LOG_LEVEL // Level of log messages
})

// Winston stream function we can plug in to express so we can capture its logs along with our own
const winstonStream = {
  write: function(message) {
		logger.info(message.slice(0, -1));
  }
};

// Setup express logger
app.use(morgan('combined', { stream : winstonStream }));

// Compress responses if required but only if caching is disabled
config.COMPRESS && !config.CACHE && app.use(compression());

// Provide CORS support (not required if behind API gateway)
config.CORS && app.use(cors({ exposedHeaders: config.CORS_HEADERS }));

// Provide response time header in response
config.RESPONSE_TIME && app.use(responseTime());

// Parse body messages into json
app.use(bodyParser.json({ limit : config.BODY_LIMIT }));

// Try and connect to the db
initializeDb(config, logger)
	.then((db) => {
		logger.info('Successfully connected to DB');

		// Apply custom middleware
		app.use(middleware({ config, db, logger }));

		// Mount the api
		app.use('/', api({ config, db, logger }));

		// Start listening for requests
		app.server.listen(config.PORT);
		logger.info(`Application started, listening on port ${app.server.address().port}`);
	})
	.catch((err) => {
		logger.error('DB Connection error: ' + err);
		logger.error('Fatal error: Application shutting down');
		exitWithStatus(1);
	})

// FIXME This is a workaround for https://github.com/flatiron/winston/issues/228
// If we exit immediately winston does not get a chance to write the last log message.
// So we wait a short time before exiting.
function exitWithStatus(exitStatus) {
	logger.info( 'Exiting with status ' + exitStatus );
	setTimeout( function() {
		process.exit(exitStatus);
	}, 500 );
}

// Catch kill and interrupt signals and log a clean exit status
process.on('SIGTERM', function() {
	logger.info('SIGTERM: Application shutting down');
	exitWithStatus(0);
});
process.on('SIGINT', function() {
	logger.info('SIGINT: Application shutting down');
	exitWithStatus(0);
});

// Catch unhandled exceptions, log, and exit with error status
// TODO: This seems dangerous!  Should we not instead return a 500?
process.on('uncaughtException', function (err) {
	logger.error('uncaughtException: ' + err.message + ', ' + err.stack);
	logger.error('Fatal error: Application shutting down');
	exitWithStatus(1);
});

export default app;
