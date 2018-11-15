// Dependencies
const util = require("util");
const _users = require("./UsersRequestHandler");
const _tokens = require("./TokensRequestHandler");
const _menus = require("./MenusRequestHandler");
const _carts = require("./CartsRequestHandler");
const _orders = require("./OrdersRequestHandler");
const debug = util.debuglog("server-root");

// Define the request handlers
class Handlers {

    async users(data) {
        const acceptableMethods = ["post", "get", "put", "delete"];
        if (acceptableMethods.includes(data.method)) {
            return await _users[data.method].bind(this)(data);
        } else {
            return {statusCode : 405};
        }
    }

    async tokens(data) {
        const acceptableMethods = ["post", "get", "put", "delete"];
        if (acceptableMethods.includes(data.method)) {
            return await _tokens[data.method].bind(this)(data);
        } else {
            return {statusCode : 405};
        }
    }

    async menus(data) {
        const acceptableMethods = ["get"];
        if (acceptableMethods.includes(data.method)) {
            return await _menus[data.method].bind(this)();
        } else {
            return {statusCode : 405};
        }
    }

    async carts(data) {
        const acceptableMethods = ["get", "put", "delete"]; // get - get items in cart; put -  add or remove individual item(s); delete - empty the cart
        if (acceptableMethods.includes(data.method)) {
            return await _carts[data.method].bind(this)(data);
        } else {
            return {statusCode : 405};
        }
    }

    async orders(data) {
        const acceptableMethods = ["post", "get"];
        if (acceptableMethods.includes(data.method)) {
            return await _orders[data.method].bind(this)(data);
        } else {
            return {statusCode : 405};
        }
    }

}

module.exports = new Handlers();