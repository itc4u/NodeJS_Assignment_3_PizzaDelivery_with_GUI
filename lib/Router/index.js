const apiRequestHandler = require("../ApiRequestHandlers");
const GuiRequestHandler = require("../GuiRequestHandlers");

// Define a request router
const router = {
    "favicon.ico" : GuiRequestHandler.favicon,
    "public" : GuiRequestHandler.public,
    "" : GuiRequestHandler.index,
    "account/create" : GuiRequestHandler.accountCreate,
    "account/edit" : GuiRequestHandler.accountEdit,
    "account/deleted" : GuiRequestHandler.accountDeleted,
    "session/create" : GuiRequestHandler.sessionCreate,
    "session/deleted" : GuiRequestHandler.sessionDeleted,
    "menus/all" : GuiRequestHandler.menusList,
    "menus/logged-in" : GuiRequestHandler.menusWithCart,
    "orders/all" : GuiRequestHandler.ordersList,
    "api/users" : apiRequestHandler.users,
    "api/tokens" : apiRequestHandler.tokens,
    "api/menus" : apiRequestHandler.menus,
    "api/carts" : apiRequestHandler.carts,
    "api/orders" : apiRequestHandler.orders
};

module.exports = router;