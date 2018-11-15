const dataStoreHandler = require("../../DataStoreHandler");
const Helper = require("../../Helper");
const Config = require("../../Config");
const util = require("util");
const debug = util.debuglog("server-users");

const EMAIL_VALIDATOR = Config["EMAIL_VALIDATOR"];

// Define private subroutines
_users = {
    // private methods for users handler
    // Required data: username, email, password, address
    // Optional data: none
    "post" : async data => {
        const username = typeof (data.payload["username"]) === "string" && data.payload["username"].trim().length > 0 ? data.payload["username"].trim() : false;
        const email = typeof (data.payload["email"]) === "string" && data.payload["email"].trim().length > 0 && data.payload["email"].match(EMAIL_VALIDATOR) ? data.payload["email"].trim() : false;
        const password = typeof (data.payload["password"]) === "string" && data.payload["password"].trim().length > 0 ? data.payload["password"].trim() : false;
        const address = typeof (data.payload["address"]) === "string" && data.payload["address"].trim().length > 0 ? data.payload["address"].trim() : false;
        if (username && email && password && address) {
            // Make sure that the user does not already exist
            try {
                await dataStoreHandler.read("users", email);
                // User already exists
                return {
                    statusCode : 400,
                    payload: {
                        "Error" : "A user with that email address already exists"
                    }
                }
            } catch (error) {
                // Cannot read file since the user does not exist yet then we are good to go create it now
                if (error.code === "ENOENT") {
                    // Hash the password
                    const hashedPassword = Helper.hash(password);
                    if (hashedPassword) {
                        // Create the user object
                        const userObject = {
                            username,
                            email,
                            hashedPassword,
                            address
                        };
                        // Persist the user to disk
                        try {
                            await dataStoreHandler.create("users", email, userObject);
                            return {statusCode : 200}
                        } catch (e) {
                            debug(e);
                            return {
                                statusCode : 500,
                                payload: {
                                    "Error" : "Could not create the new user"
                                }
                            }
                        }
                    } else {
                        return {
                            statusCode : 500,
                            payload: {
                                "Error" : "Could not hash the user\'s password"
                            }
                        }
                    }
                } else {
                    return {
                        statusCode : 500,
                        payload: {
                            "Error" : "Internal server error when reading local json"
                        }
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
    },
    // Users - get
    // Required data: email
    // Optional data: none
    "get" : async data => {
        // Check that the email is valid
        const email = typeof (data.queryStringObject["email"]) === "string" && data.queryStringObject["email"].trim().length > 0 && data.queryStringObject["email"].match(EMAIL_VALIDATOR) ? data.queryStringObject["email"].trim() : false;
        if (email) {
            // Get the token from the headers
            const token = typeof (data.headers["token"]) === "string" ? data.headers["token"] : false;
            // Verify that the given token is valid for the email
            const result = await dataStoreHandler.verifyToken(token, email);
            if (!result) {
                return {
                    statusCode : 403,
                    payload : {
                        "Error" : "Missing required token in header, or token is invalid (e.g., expired)"
                    }
                }
            }
            // Lookup the user
            try {
                const data = await dataStoreHandler.read("users", email);
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                return {
                    statusCode : 200,
                    payload : data
                }
            } catch (e) {
                return {
                    statusCode : 404,
                    payload : {
                        "Error" : "User not found"
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
    },
    // Users - put
    // Required data : email
    // Optional data : username, password, address (at least one must be specified)
    "put" : async data => {
        // Check for the required field
        const email = typeof (data.payload["email"]) === "string" && data.payload["email"].trim().length > 0 && data.payload["email"].match(EMAIL_VALIDATOR) ? data.payload["email"].trim() : false;
        // Check for the optional fields
        const username = typeof (data.payload["username"]) === "string" && data.payload["username"].trim().length > 0 ? data.payload["username"].trim() : false;
        const password = typeof (data.payload["password"]) === "string" && data.payload["password"].trim().length > 0 ? data.payload["password"].trim() : false;
        const address = typeof (data.payload["address"]) === "string" && data.payload["address"].trim().length > 0 ? data.payload["address"].trim() : false;
        if (email && (username || password || address)) {
            // Get the token from the headers
            const token = typeof (data.headers["token"]) === "string" ? data.headers["token"] : false;
            // Verify that the given token is valid for the email
            const result = await dataStoreHandler.verifyToken(token, email);
            if (!result) {
                return {
                    statusCode : 403,
                    payload : {
                        "Error" : "Missing required token in header, or token is invalid (e.g., expired)"
                    }
                }
            }
            // Lookup the user
            try {
                const userData = await dataStoreHandler.read("users", email);
                // Update the fields necessary
                if (username) userData.username = username;
                if (password) userData.hashedPassword = Helper.hash(password);
                if (address) userData.address = address;
                // Store the new updates
                try {
                    await dataStoreHandler.update("users", email, userData);
                    delete userData.hashedPassword;
                    return {
                        statusCode : 200,
                        payload : userData
                    }
                } catch (e) {
                    debug(e);
                    return {
                        statusCode : 500,
                        payload : {
                            "Error" : "Could not update the user"
                        }
                    }
                }
            } catch (e) {
                return {
                    statusCode : 400,
                    payload : {
                        "Error" : "The specified user does not exist"
                    }
                }
            }
        } else {
            return {
                statusCode : 400,
                payload : {
                    "Error" : "Missing required field (either the phone number is invalid or the fields to update are missing)"
                }
            }
        }
    },
    // Users - delete
    // Require field : email
    "delete" : async data => {
        // Check that the email is valid
        const email = typeof (data.queryStringObject["email"]) === "string" && data.queryStringObject["email"].trim().length > 0 && data.queryStringObject["email"].match(EMAIL_VALIDATOR) ? data.queryStringObject["email"].trim() : false;
        if (email) {
            // Get the token from the headers
            const token = typeof (data.headers["token"]) === "string" ? data.headers["token"] : false;
            // Verify that the given token is valid for the email
            const result = await dataStoreHandler.verifyToken(token, email);
            if (!result) {
                return {
                    statusCode : 403,
                    payload : {
                        "Error" : "Missing required token in header, or token is invalid (e.g., expired)"
                    }
                }
            }
            // Lookup the user
            try {
                const data = await dataStoreHandler.read("users", email);
                // Erase the user's json from the disk
                try {
                    await dataStoreHandler.delete("users", email);
                    delete data.hashedPassword;
                    // Delete the cart and each of the orders associated with the user
                    const userCartId = typeof (data["cart"]) === "string" && data["cart"].trim().length > 0 ? data["cart"].trim() : false;
                    if (userCartId) {
                        try {
                            await dataStoreHandler.delete("carts", userCartId)
                        } catch (e) {
                            return {
                                statusCode : 500,
                                payload : {
                                    "Error" : "Errors encountered while attempting to delete the user's cart. It may not have been deleted from the system successfully. Stacktrace " + e
                                }
                            }
                        }
                    }
                    const userOrders = typeof (data["orders"]) === "object" && data["orders"] instanceof Array ? data["orders"] : [];
                    if (userOrders.length > 0) {
                        try {
                            userOrders.forEach(async orderId => await dataStoreHandler.delete("orders", orderId))
                        } catch (e) {
                            return {
                                statusCode : 500,
                                payload : {
                                    "Error" : "Errors encountered while attempting to delete all of the user's orders. All orders may not have been deleted from the system successfully. Stacktrace " + e
                                }
                            }
                        }
                    }
                    return {
                        statusCode : 200,
                        payload : data
                    }
                } catch (e) {
                    return {
                        statusCode : 500,
                        payload : {
                            "Error" : "Could not delete the specified user"
                        }
                    }
                }
            } catch (e) {
                return {
                    statusCode : 400,
                    payload : {
                        "Error" : "Could not find the specified user"
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

module.exports = _users;