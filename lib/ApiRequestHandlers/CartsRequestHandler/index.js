const dataStoreHandler = require("../../DataStoreHandler");
const Helper = require("../../Helper");
const Config = require("../../Config");

const EMAIL_VALIDATOR = Config["EMAIL_VALIDATOR"];

const addItemsToCart = async (cartId, items) => {
    const cart = await dataStoreHandler.read("carts", cartId);
    items.forEach(v => {
        const key = v[0];
        const value = v[1];
        if (Object.keys(cart).includes(key)) {
            cart[key] += value;
        } else {
            cart[key] = value
        }
    });
    await dataStoreHandler.update("carts", cartId, cart);
    return cart
};

const removeItemsFromCart = async (cartId, items) => {
    const cart = await dataStoreHandler.read("carts", cartId);
    items.forEach(v => {
        const key = v[0];
        const value = v[1];
        if (Object.keys(cart).includes(key)) {
            cart[key] -= value;
            if (cart[key] < 1) {
                delete cart[key]
            }
        }
    });
    await dataStoreHandler.update("carts", cartId, cart);
    return cart
};

const overwriteCartContents = async (cartId, items) => {
    const newCart = {};
    items.forEach(v => {
        // add new key/value pairs
        newCart[v[0]] = v[1];
    });
    await dataStoreHandler.update("carts", cartId, newCart);
    return newCart;
};

// Private subroutines for carts
_carts = {
    // Required data: email, items (a nested object with food names and quantities as key/value pairs)
    // Optional data: action (either "add" or "remove", default to "overwrite" if not specified)
    "put" : async data => {
        const email = typeof (data.payload["email"]) === "string" && data.payload["email"].trim().length > 0 && data.payload["email"].match(EMAIL_VALIDATOR) ? data.payload["email"].trim() : false;
        const items = Object.entries(typeof (data.payload["items"]) === "object" ? data.payload["items"] : {});
        const isItemsLengthValid = items.length > 0;
        try {
            const menuItems = await dataStoreHandler.read("menus", "dominos");
            const menuItemNames = Object.keys(menuItems);
            const noBadItems = items.filter(value => !menuItemNames.includes(value[0]) || typeof (value[0]) !== "string" || typeof (value[1]) !== "number" || value[1] % 1 !== 0 || value[1] < 1).length === 0;
            if (email && isItemsLengthValid && noBadItems) {
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
                const userData = await dataStoreHandler.read("users", email);
                if (!userData["cart"]) {
                    const cartId = Helper.createRandomString(20);
                    await dataStoreHandler.create("carts", cartId, {});
                    userData.cart = cartId;
                    await dataStoreHandler.update("users", userData.email, userData);
                }
                let newCart = {};
                const action = typeof (data.payload.action) === "string" && ["add", "remove"].includes(data.payload.action.trim().toLowerCase()) ? data.payload.action.trim().toLowerCase() : "overwrite";
                switch (action) {
                    case "add":
                        newCart = await addItemsToCart(userData.cart, items);
                        break;
                    case "remove":
                        newCart = await removeItemsFromCart(userData.cart, items);
                        break;
                    default:
                        newCart = await overwriteCartContents(userData.cart, items);
                }
                return {
                    statusCode : 200,
                    payload: newCart
                }
            } else {
                return {
                    statusCode : 400,
                    payload: {
                        "Error" : "Missing required fields, or request containing one or several invalid fields"
                    }
                }
            }
        } catch (e) {
            return {
                statusCode : 500,
                payload : {
                    "Error" : "Internal Server Error. Stacktrace: " + e
                }
            }
        }
    },
    // Required data: email
    // Optional data: none
    "get" : async data => {
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
            try {
                const userData = await dataStoreHandler.read("users", email);
                if (!userData.hasOwnProperty("cart")) return { // The user has not created his/her cart yet (e.g., new users)
                    statusCode : 200,
                    payload : {}
                };
                const cart = await dataStoreHandler.read("carts", userData.cart);
                return {
                    statusCode : 200,
                    payload : cart
                }
            } catch (e) {
                return {
                    statusCode : 500,
                    payload : {
                        "Error" : "Internal Server Error. Stacktrace: " + e
                    }
                }
            }
        } else {
            return {
                statusCode : 400,
                payload: {
                    "Error" : "Missing required fields, or request containing one or several invalid fields"
                }
            }
        }
    },
    // Required data: email
    // Optional data: none
    "delete" : async data => {
        const email = typeof (data.queryStringObject["email"]) === "string" && data.queryStringObject["email"].trim().length > 0 && data.queryStringObject["email"].match(EMAIL_VALIDATOR) ? data.queryStringObject["email"].trim() : false;
        if (email) {
            // Get the token from the headers
            const token = typeof (data.headers["token"]) === "string" ? data.headers["token"] : false;
            // Verify that the given token is valid for the email
            const result = await dataStoreHandler.verifyToken(token, email);
            if (!result) {
                return {
                    statusCode: 403,
                    payload: {
                        "Error": "Missing required token in header, or token is invalid (e.g., expired)"
                    }
                }
            }
            try {
                const userData = await dataStoreHandler.read("users", email);
                const cart = await dataStoreHandler.read("carts", userData.cart);
                await dataStoreHandler.update("carts", userData.cart, {});
                return {
                    statusCode : 200,
                    payload : {
                        "deleted_items" : cart
                    }
                }
            } catch (e) {
                return {
                    statusCode : 500,
                    payload : {
                        "Error" : "Internal Server Error. Stacktrace: " + e
                    }
                }
            }
        } else {
            return {
                statusCode : 400,
                payload: {
                    "Error" : "Missing required fields, or request containing one or several invalid fields"
                }
            }
        }
    }
};

module.exports = _carts;