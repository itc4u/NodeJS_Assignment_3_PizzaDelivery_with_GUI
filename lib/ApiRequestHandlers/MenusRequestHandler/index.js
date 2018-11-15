const dataStoreHandler = require("../../DataStoreHandler");

// Private subroutines for menus
_menu = {
    // Menus - get
    // Required data: none
    // Optional data: none
    "get" : async () => {
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
    }
};

module.exports = _menu;