const dataStoreHandler = require("../../DataStoreHandler");
const Config = require("../../Config");

const EMAIL_VALIDATOR = Config["EMAIL_VALIDATOR"];

// Private subroutines for menus
_menu = {
    // Menus - get
    // Required data: email
    // Optional data: none
    "get" : async data => {
        // Check that the email is valid
        const email = typeof (data.queryStringObject["email"]) === "string" && data.queryStringObject["email"].trim().length > 0 && data.queryStringObject["email"].match(EMAIL_VALIDATOR) ? data.queryStringObject["email"].trim() : false;
        if (email) {
            // Get the token from the headers
            const token = typeof (data.headers["token"]) === "string" ? data.headers["token"] : false;
            // Verify that the given token is valid for the phone number
            const result = await dataStoreHandler.verifyToken(token, email);
            if (!result) {
                return {
                    statusCode : 403,
                    payload : {
                        "Error" : "Missing required token in header, or token is invalid (e.g., expired)"
                    }
                }
            }
            // Get the menu and return it
            try {
                const data = await dataStoreHandler.read("menus", "dominos");
                return {
                    statusCode : 200,
                    payload : data
                }
            } catch (e) {
                return {
                    statusCode : 404,
                    payload : {
                        "Error" : "Menu not found"
                    }
                }
            }
        } else {
            return {
                statusCode : 400,
                payload: {
                    "Error" : "Missing required fields"
                }
            }
        }
    }
};

module.exports = _menu;