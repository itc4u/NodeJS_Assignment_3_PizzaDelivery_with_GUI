const Helper = require("../Helper");

const unifiedGuiHandler = async (requestData, templateData, templateName) => {
    if (requestData.method === "get") {
        try {
            // Get the outbound payload
            const payload = await Helper.addUniversalTemplate(await Helper.getTemplate(templateName, templateData), templateData);
            return {
                statusCode : 200,
                payload,
                contentType : "text/html"
            }
        } catch (e) {
            return {
                statusCode : 500,
                payload : {
                    "Error" : "Internal Server Error. Could not load the template for index page. Stacktrace: " + e
                }
            }
        }
    } else {
        return {
            statusCode : 405,
            contentType : "text/html"
        }
    }
};

class Handlers {

    /**
     * Index handler
     * @param data - the inbound payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async index(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Buy Pizza Online - Made Simple',
            'head.description' : 'Get awesome pizza deals at Buy Pizza Online!.',
            'body.class' : 'index'
        }, "index");
    }

    /**
     * Sign Up page handler
     * @param data - parsed request payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async accountCreate(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Create an account',
            'head.description' : 'Sign up is easy and only takes a few seconds',
            'body.class' : 'accountCreate'
        }, "accountCreate");
    }

    /**
     * Account Setting page handler
     * @param data - parsed request payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async accountEdit(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Account Settings',
            'body.class' : 'accountEdit'
        }, "accountEdit");
    }

    /**
     * Account Deleted page handler
     * @param data - parsed request payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async accountDeleted(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Account Deleted',
            'head.description' : 'Your account has been deleted',
            'body.class' : 'accountDeleted'
        }, "accountDeleted");
    }

    /**
     * Login page handler - create a new session
     * @param data - parsed request payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async sessionCreate(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Login to your account',
            'head.description' : 'Please enter your phone number and password to access your account',
            'body.class' : 'sessionCreate'
        }, "sessionCreate");
    }

    /**
     * Logout page handler - delete a session
     * @param data - parsed request payload
     * @return {Promise<string | object>} - the outbound payload, either the html string upon success or error message in JSON format
     */
    static async sessionDeleted(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Logged Out',
            'head.description' : 'Your have been logged out of your account.',
            'body.class' : 'sessionDeleted'
        }, "sessionDeleted");
    }

    // Get all menu items for non-authenticated visitor
    static async menusList(data) {
        return await unifiedGuiHandler(data, {
            'head.title' : 'Gourmet Menu | Chief\'s Recommendation',
            'head.description' : 'Awesome Menus, Awesome Pizzas',
            'body.class' : 'menusList'
        }, "menusList");
    }

    static async favicon(data) {
        if (data.method === "get") {
            // Read in the favicon's data
            try {
                const data = await Helper.getStaticAsset("favicon.ico");
                return {
                    statusCode : 200,
                    payload : data,
                    contentType : "image/x-icon"
                }
            } catch (e) {
                return {
                    statusCode : 500,
                    payload : {
                        "Error" : "Internal Server Error. Could not load the favicon. Stacktrace: " + e
                    }
                }
            }
        } else {
            return {statusCode : 405}
        }
    }

    static async public(data) {
        if (data.method === "get") {
            // Get the filename being requested
            const trimmedAssetName = data.trimmedPath.replace("public/", "").trim();
            if (trimmedAssetName.length > 0) {
                try {
                    // Read in the asset data
                    const data = await Helper.getStaticAsset(trimmedAssetName);
                    // Determine the content type (default to plain text)
                    let contentType;
                    const strExploded = trimmedAssetName.split(".");
                    switch (strExploded[1]) {
                        case "css":
                            contentType = "text/css";
                            break;
                        case "png":
                            contentType = "image/png";
                            break;
                        case "jpg":
                            contentType = "image/jpeg";
                            break;
                        case "ico":
                            contentType = "image/x-icon";
                            break;
                        case "js":
                            contentType = "application/javascript";
                            break;
                        default:
                            contentType = "text/plain";
                            break
                    }
                    return {
                        statusCode : 200,
                        payload : data,
                        contentType
                    }
                } catch (e) {
                    return {
                        statusCode : 500,
                        payload : {
                            "Error" : "Internal Server Error. Could not load the static asset. Stacktrace: " + e
                        }
                    }
                }
            } else {
                return {statusCode : 404}
            }
        } else {
            return {statusCode : 405}
        }
    }

}

module.exports = Handlers;