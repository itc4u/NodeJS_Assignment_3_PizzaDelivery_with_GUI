const dataStoreHandler = require("../../DataStoreHandler");
const logger = require("../../Worker");
const Helper = require("../../Helper");
const Config = require("../../Config");

const EMAIL_VALIDATOR = Config["EMAIL_VALIDATOR"];

// private subroutines for orders
_orders = {
    // Required data : email, items
    // Optional data : none
    "post" : async data => {
        const email = typeof (data.payload["email"]) === "string" && data.payload["email"].trim().length > 0 && data.payload["email"].match(EMAIL_VALIDATOR) ? data.payload["email"].trim() : false;
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
                const userCart = await dataStoreHandler.read("carts", userData.cart);
                const items = Object.entries(data.payload["items"]);
                const isItemsLengthValid = items.length > 0;
                const cartItemNames = Object.keys(userCart);
                const noBadItems = items.filter(value => !cartItemNames.includes(value[0]) || typeof (value[0]) !== "string" || typeof (value[1]) !== "number" || value[1] % 1 !== 0 || value[1] < 1 || value[1] > userCart[value[0]]).length === 0;
                if (!isItemsLengthValid || !noBadItems) {
                    return {
                        statusCode : 400,
                        payload: {
                            "Error" : "Some of the items supplied are invalid or undefined"
                        }
                    }
                }
                const menu = await dataStoreHandler.read("menus", "dominos");
                const receipt = {
                    amount : 0,
                    items_ordered : data.payload["items"]
                };
                items.forEach(v => {
                    const key = v[0];
                    const value = v[1];
                    userCart[key] -= value;
                    if (userCart[key] <= 0) {
                        delete userCart[key]
                    }
                    receipt.amount += menu[key] * value
                });
                console.log("Internal Receipt: ", receipt);
                const orderId = Helper.createRandomString(20);
                const transaction = await Helper.sendStripePayment(Number(String(receipt.amount.toFixed(2)).replace(".", "")), "nzd", `Items Ordered : [ ${Object.entries(receipt.items_ordered).map(value => (`{"${value[0]}":"${value[1]}"} `))}]`, Config["stripe"]["test_token"]);
                const emailNotification = await Helper.sendMailGunMsg(`${userData.username} <${email}>`, "Thank you for ordering at Dominos Pizza Online", `Your order has been successfully placed and will be ready to pick-up in 15 minutes. Your Order Detail:\nOrder Number: ${orderId}\nTotal Cost: ${receipt.amount}\nItems Ordered: \n[${Object.entries(receipt.items_ordered).map(value => (`\n{Name:"${value[0]}", Quantity:"${value[1]}"}\n`))}]\n`);
                userData.orders = typeof (userData.orders) === "object" && userData.orders instanceof Array ? userData.orders : [];
                await dataStoreHandler.create("orders", orderId, {
                    "owner" : email,
                    orderId,
                    receipt,
                    transaction,
                    emailNotification
                });
                userData.orders.push(orderId);
                await dataStoreHandler.update("carts", userData.cart, userCart);
                await dataStoreHandler.update("users", email, userData);
                await logger.log({
                    orderId,
                    receipt,
                    transaction,
                    emailNotification
                }, email);
                return {
                    statusCode : 201,
                    payload: {
                        orderId,
                        receipt,
                        transaction,
                        emailNotification
                    }
                }
            } catch (e) {
                return {
                    statusCode : 500,
                    payload: {
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
    // Required data : email, orderId
    "get" : async data => {
        const email = typeof (data.queryStringObject["email"]) === "string" && data.queryStringObject["email"].trim().length > 0 && data.queryStringObject["email"].match(EMAIL_VALIDATOR) ? data.queryStringObject["email"].trim() : false;
        const orderId = typeof (data.queryStringObject["orderId"]) === "string" && data.queryStringObject["orderId"].trim().length === 20 ? data.queryStringObject["orderId"].trim() : false;
        if (email && orderId) {
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
                if (!userData.orders.includes(orderId)) {
                    return {
                        statusCode : 400,
                        payload: {
                            "Error" : "Invalid Order ID"
                        }
                    }
                }
                const orderData = await dataStoreHandler.read("orders", orderId);
                return {
                    statusCode : 200,
                    payload : orderData
                }
            } catch (e) {
                return {
                    statusCode : 500,
                    payload: {
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

module.exports = _orders;