/**
 * Logger-related tasks
 *
 */

// Dependencies
const LogsHandler = require("../LogsHandler");
const util = require("util");
const debug = util.debuglog("workers");

class Logger {

    constructor() {
        // Send to console, in yellow
        console.log("\x1b[33m%s\x1b[0m", "Logger status: on call")
    }

    // noinspection JSMethodCanBeStatic
    async log(logData, filename) {
        // Append the log string to the file
        await LogsHandler.append(filename, JSON.stringify(logData));
    }

    // Rotate (aka compress) the log files
    async rotateLogs() {
        // listing all the (non compressed) log files
        const logs = await LogsHandler.list(false);
        if (typeof (logs) === "object" && logs instanceof Array && logs.length > 0) {
            logs.forEach(async logName => {
                // Compress the data to a different file
                const logId = logName.replace(".log", "");
                const newFileId = `${logId}-${Date.now()}`;
                const err1 = await LogsHandler.compress(logId, newFileId);
                if (!err1) {
                    // Truncating the log
                    const err2 = await LogsHandler.truncate(logId);
                    if (!err2) {
                        debug(`Success truncating log file. Log ID : ${logId}`)
                    } else {
                        debug(`Error truncating log file. Log ID : ${logId}`, err2)
                    }
                } else {
                    debug(`Error compressing one of the log files. Log ID : ${logId}`, err1);
                }
            })
        } else {
            debug("There is no logs to rotate (compress)", logs);
        }
    }

    // Timer to execute the log-rotation process once per day
    logRotationLoop() {
        setInterval(async () => {
            try {
                await Logger.rotateLogs();
            } catch (e) {
                debug(e);
                throw e
            }
        }, 1000 * 60 * 60 * 24)
    }

    async init() {
        // Compress all the logs immediately
        await this.rotateLogs();
        // Call the compression loop so logs will be compressed later on
        this.logRotationLoop();
    }

}

// Export the module
module.exports = new Logger();