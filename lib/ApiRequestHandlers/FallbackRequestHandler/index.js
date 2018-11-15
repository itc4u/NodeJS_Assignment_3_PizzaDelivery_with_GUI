const util = require("util");
const debug = util.debuglog("server-not-found");

class FallbackRequestHandler {

    static async notFound(data) {
        debug("\x1b[31m%s\x1b[0m", "404 Not Found with payload received ", data);
        return {statusCode : 404};
    }

}

module.exports = FallbackRequestHandler;