const dataStoreHandler = require("../../DataStoreHandler");
const Helper = require("../../Helper");
const Config = require("../../Config");

const EMAIL_VALIDATOR = Config["EMAIL_VALIDATOR"];

// private methods for tokens handler
_tokens = {
    // Tokens - post
    // Require data: email, password
    // Optional data: none
    "post" : async data => {
        const email = typeof (data.payload["email"]) === "string" && data.payload["email"].trim().length > 0 && data.payload["email"].match(EMAIL_VALIDATOR) ? data.payload["email"].trim() : false;
        const password = typeof (data.payload["password"]) === "string" && data.payload["password"].trim().length > 0 ? data.payload["password"].trim() : false;
        if (email && password) {
            // Lookup the user who matches that email
            try {
                const userData = await dataStoreHandler.read("users", email);
                // Hash the sent password, and compare it to the password stored in the user object
                const hashedPassword = Helper.hash(password);
                if (hashedPassword === userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set expiry time 1 hour in the future
                    const tokenId = Helper.createRandomString(20);
                    if (!tokenId) return {
                        statusCode : 500,
                        payload : {
                            "Error" : "Could not generate the new token id"
                        }
                    };
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        email,
                        "id" : tokenId,
                        expires
                    };
                    // Store the token
                    try {
                        await dataStoreHandler.create("tokens", tokenId, tokenObject);
                        return {
                            statusCode : 200,
                            payload : tokenObject
                        }
                    } catch (e) {
                        return {
                            statusCode : 500,
                            payload : {
                                "Error" : "Could not create the new token"
                            }
                        }
                    }
                } else {
                    return {
                        statusCode : 400,
                        payload : {
                            "Error" : "Password did not match the specified user\'s stored password"
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
                payload : {
                    "Error" : "Missing required field(s)"
                }
            }
        }
    },
    // Tokens - get
    // Required data : id
    // Optional data : none
    "get" : async data => {
        // Check that the id is valid
        const id = typeof (data.queryStringObject.id) ==="string" && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
        if (id) {
            // Lookup the token
            try {
                const tokenData = await dataStoreHandler.read("tokens", id);
                return {
                    statusCode : 200,
                    payload : tokenData
                }
            } catch (e) {
                return {
                    statusCode : 404,
                    payload : {
                        "Error" : "Token not found"
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
    // Tokens - put
    // Required data : id, extend
    // Optional data : none
    "put" : async data => {
        const id = typeof (data.payload.id) === "string" && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
        const extend = typeof (data.payload.extend) === "boolean" && data.payload.extend === true;
        if (id && extend) {
            // Lookup the token
            try {
                const tokenData = await dataStoreHandler.read("tokens", id);
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    try {
                        await dataStoreHandler.update("tokens", id, tokenData);
                        return {
                            statusCode : 200,
                            payload : tokenData
                        }
                    } catch (e) {
                        return {
                            statusCode : 500,
                            payload : {
                                "Error" : "Could not update the token's expiration"
                            }
                        }
                    }
                } else {
                    return {
                        statusCode : 400,
                        payload : {
                            "Error" : "The token has already expired and cannot be extended"
                        }
                    }
                }
            } catch (e) {
                return {
                    statusCode : 400,
                    payload : {
                        "Error" : "Specified token does not exist"
                    }
                }
            }
        } else {
            return {
                statusCode : 400,
                payload : {
                    "Error" : "Missing required field(s) or field(s) are invalid"
                }
            }
        }
    },
    // Tokens - delete
    // Required data : id
    // Optional data : none
    "delete" : async data => {
        // Check if the id is valid
        const id = typeof (data.queryStringObject.id) ==="string" && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
        if (id) {
            // Lookup the token
            try {
                const data = await dataStoreHandler.read("tokens", id);
                // Erase the token's json from the disk
                try {
                    await dataStoreHandler.delete("tokens", id);
                    return {
                        statusCode : 200,
                        payload : data
                    }
                } catch (e) {
                    return {
                        statusCode : 500,
                        payload : {
                            "Error" : "Could not delete the specified token"
                        }
                    }
                }
            } catch (e) {
                return {
                    statusCode : 400,
                    payload : {
                        "Error" : "Could not find the specified token"
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

module.exports = _tokens;