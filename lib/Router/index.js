const requestHandler = require("../RequestHandlers");

// Define a request router
const router = {
    "users" : requestHandler.users,
    "tokens" : requestHandler.tokens,
    "menus" : requestHandler.menus,
    "carts" : requestHandler.carts,
    "orders" : requestHandler.orders
};

module.exports = router;