/**
 * Primary file for the API
 */

// Dependencies
const server = require("./lib/Server");
// const Helper = require("./lib/Helper");
// const Config = require("./lib/Config");
const worker = require("./lib/Worker");

// Declare the app
class App {

    // Init
    constructor() {
        // Start the server
        server.init();
        (async () => {
            try {
                // Start the log rotater
                await worker.init();
                // Send log to console in blue
                console.log("\x1b[36m%s\x1b[0m", "Logger status: running")
            } catch (e) {
                console.error(e);
                console.error("Logger status: terminated with error")
            }
        })();
    }

}

module.exports = new App();