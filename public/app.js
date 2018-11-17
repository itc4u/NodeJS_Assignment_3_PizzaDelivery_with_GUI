/**
 * This is the frontend logic for the application
 *
 */

const menusTableFiller = (parsedResponse, tableId) => {
    // Show each food item as a new row in the table
    Object.keys(parsedResponse).forEach(async foodname => {
        // Make the menu data into a table row
        const table = document.getElementById(tableId);
        const tr = table.insertRow(-1);
        tr.classList.add('itemRow');
        const td0 = tr.insertCell(0);
        const td1 = tr.insertCell(1);
        const td2 = tr.insertCell(2);
        const td3 = tr.insertCell(3);
        const td4 = tr.insertCell(4);
        td0.innerHTML = "<img src='https://source.unsplash.com/125x125/?food,pizza' title=\"The lazy dev can't be bothered making a proper pic:)\" alt=\"The lazy dev can't be bothered making a proper pic:)\" />";
        td1.innerHTML = foodname;
        td2.innerHTML = "Eam stabilem appellas. Si stante, hoc natura videlicet vult, salvam esse se, quod concedimus; Quo modo autem optimum, si bonum praeterea nullum est? Incommoda autem et commoda-ita enim estmata et dustmata appello-communia esse voluerunt, paria noluerunt. Pauca mutat vel plura sane;";
        td3.innerHTML = "$" + parsedResponse[foodname];
        td4.innerHTML = "Idem adhuc;\n" +
            "Sed tamen omne, quod de re bona dilucide dicitur, mihi praeclare dici videtur.\n" +
            "Nihil sane.\n" +
            "Sed erat aequius Triarium aliquid de dissensione nostra iudicare.\n" +
            "Haeret in salebra.\n" +
            "Quae cum dixisset paulumque institisset, Quid est?\n" +
            "Nulla erit controversia.\n" +
            "Polemoni et iam ante Aristoteli ea prima visa sunt, quae paulo ante dixi.";
        if (tableId === "loggedInMenu") {
            tr.insertCell(5).innerHTML =
                "<button class='addToCart' type='button' name='"+foodname+"'>" +
                "<img src='public/cart.png'/>" +
                "</button>";
        }
    })
};

// Container for the frontend application
let app = {};

// Config
app.config ={
    "sessionToken" : false
};

// AJAX Client for the restful API
app.client = {};

/**
 * Interface for making API calls
 * @param headers - HTTP header object
 * @param path - the URL relative to the hostname
 * @param method - the HTTP method in capital
 * @param queryStringObject - the query string k/v pairs in Object format
 * @param payload - the HTTP request payload
 * @param watchResponse - boolean, true if this function should return an response object (it will attempt to parse the response body into Object via JSON.parse and throw errors if any); otherwise the HTTP response will be omitted from the client
 * @return {Promise<Object | void>}
 */
app.client.request = async (headers, path, method, queryStringObject, payload, watchResponse) => {
    headers = typeof (headers) === "object" && headers !== null ? headers : {};
    path = typeof (path) === "string" ? path : "/";
    method = typeof (method) === "string" && ["POST", "GET", "PUT", "DELETE"].includes(method) ? method.toUpperCase() : "GET";
    queryStringObject = typeof (queryStringObject) === "object" && queryStringObject !== null ? queryStringObject : {};
    payload = typeof (payload) === "object" && payload !== null ? payload : {};
    watchResponse = typeof (watchResponse) === "boolean" ? watchResponse : false;
    // For each query string parameter sent, add it to the path
    let requestUrl = path + "?";
    Object.keys(queryStringObject).forEach(key => {
        requestUrl += `${key}=${queryStringObject[key]}&`;
    });
    requestUrl = requestUrl.substr(0, requestUrl.length - 1);
    // Form the HTTP request as a JSON type
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // For each header sent, add it to the request
    Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
    });
    // If there is a current session token, add that as a header as well
    if (app.config.sessionToken) xhr.setRequestHeader("token", app.config.sessionToken.id);
    // When the request comes back, handle the response
    const response = new Promise(resolve => {
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                const statusCode = xhr.status;
                const responseReturned = xhr.responseText;
                // resolve with the parsed response if the response is watched, otherwise resolve into nothing
                if (watchResponse) {
                    try {
                        const parsedResponse = JSON.parse(responseReturned);
                        resolve({
                            statusCode,
                            parsedResponse
                        })
                    } catch (e) {
                        resolve({
                            statusCode,
                            "parsedResponse" : false
                        })
                    }
                } else {
                    resolve()
                }
            }
        };
    });
    // Send the payload as JSON
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
    return await response;
};

// Bind the logout button
app.bindLogoutButton = () => {
    document.getElementById("logoutButton").addEventListener("click", async e => {
        // Stop it from redirecting anywhere
        e.preventDefault();
        // Log the user out
        await app.logUserOut();
    });
};

// Log the user out then redirect them
app.logUserOut = async () => {
    // Get the current token id
    const tokenId = typeof(app.config.sessionToken.id) === 'string' ? app.config.sessionToken.id : false;
    // Send the current token to the tokens endpoint to delete it
    const queryStringObject = { 'id': tokenId };
    const {statusCode, parsedResponse} = await app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, true);
    if (statusCode === 200) {
        // Set the app.config token as false
        app.setSessionToken(false);
        // Send the user to the logged out page
        window.location = '/session/deleted';
    } else {
        alert(`Fail to delete your session due to error code ${statusCode}. Error: ${parsedResponse.Error}`);
    }
};

// Bind the forms
app.bindForms = function() {
    if (!document.querySelector("form")) return;
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", async function(e) {
            // Stop it from submitting
            e.preventDefault();
            const formId = this.id;
            const path = this.action;
            let method = this.method.toUpperCase();
            // Hide the error message (if it's currently shown due to a previous error)
            if(document.querySelector("#"+formId+" .formError")) document.querySelector("#"+formId+" .formError").style.display = 'none';
            // Hide the success message (if it's currently shown due to a previous success)
            if(document.querySelector("#"+formId+" .formSuccess")) document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
            // Turn the inputs into a payload
            const payload = {};
            const elements = this.elements;
            for(let i = 0; i < elements.length; i++){
                if(elements[i].type !== 'submit'){
                    // Determine class of element and set value accordingly
                    const classOfElement = typeof(elements[i].classList["value"]) === 'string' && elements[i].classList["value"].length > 0 ? elements[i].classList["value"] : '';
                    const valueOfElement = elements[i].type === 'checkbox' && classOfElement.indexOf('multiselect') === -1 ? elements[i].checked : classOfElement.indexOf('intval') === -1 ? elements[i].value : parseInt(elements[i].value);
                    const elementIsChecked = elements[i].checked;
                    // Override the method of the form if the input's name is _method
                    let nameOfElement = elements[i].name;
                    if(nameOfElement === '_method'){
                        method = valueOfElement;
                    } else {
                        // Create an payload field named "method" if the elements name is actually httpmethod
                        if(nameOfElement === 'httpmethod') nameOfElement = 'method';
                        // Create an payload field named "id" if the elements name is actually uid
                        if(nameOfElement === 'uid') nameOfElement = 'id';
                        // If the element has the class "multiselect" add its value(s) as array elements
                        if(classOfElement.indexOf('multiselect') > -1){
                            if(elementIsChecked){
                                payload[nameOfElement] = typeof(payload[nameOfElement]) === 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                                payload[nameOfElement].push(valueOfElement);
                            }
                        } else {
                            payload[nameOfElement] = valueOfElement;
                        }
                    }
                }
            }
            // If the method is DELETE, the payload should be a queryStringObject instead
            const queryStringObject = method === 'DELETE' ? payload : {};
            // Call the API
            const response = await app.client.request(undefined, path, method, queryStringObject, payload, true);
            // Display an error on the form if needed
            if(response.statusCode !== 200){
                // Try to get the error from the api, or set a default error message and then set the formError field with the error text
                document.querySelector("#"+formId+" .formError").innerHTML = typeof(response.parsedResponse.Error) === 'string' ? response.parsedResponse.Error : 'An error has occurred, please try again';
                // Show (unhide) the form error field on the form
                document.querySelector("#"+formId+" .formError").style.display = 'block';
            } else {
                // If successful, send to form response processor
                await app.formResponseProcessor(formId,payload,response.parsedResponse);
            }
        })
    })
};

// Form response processor
app.formResponseProcessor = async (formId,requestPayload,responsePayload) => {
    // If account creation was successful, try to immediately log the user in
    if(formId === 'accountCreate'){
        // Take the phone and password, and use it to log the user in
        const newPayload = {
            'email': requestPayload.email,
            'password': requestPayload.password
        };
        const {statusCode, parsedResponse} = await app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, true);
        // Display an error on the form if needed
        if(statusCode !== 200){
            // Set the formError field with the error text
            document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occurred. Please try again.';
            // Show (unhide) the form error field on the form
            document.querySelector("#"+formId+" .formError").style.display = 'block';
        } else {
            // If successful, set the token and redirect the user
            app.setSessionToken(parsedResponse);
            window.location = '/menus/logged-in';
        }
    }
    // If login was successful, set the token in local storage and redirect the user
    if(formId === 'sessionCreate'){
        app.setSessionToken(responsePayload);
        window.location = '/menus/logged-in';
    }
    // If account setting forms saved successfully and they have success messages, show them
    const formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'checksEdit1'];
    if(formsWithSuccessMessages.includes(formId)){
        document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
    }
    // If the user just deleted their account, redirect them to the account-delete page
    if(formId === 'accountEdit3'){
        await app.logUserOut();
        window.location = '/account/deleted';
    }
    // If the user just created a new check successfully, redirect back to the dashboard
    if(formId === 'checksCreate') window.location = '/checks/all';
    // If the user just deleted a check, redirect them to the dashboard
    if(formId === 'checksEdit2') window.location = '/checks/all'
};

// Get the session token from local storage and set it in the app.config object
app.getSessionToken = () => {
    const tokenString = localStorage.getItem('token');
    if(typeof(tokenString) === 'string'){
        try{
            const token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if(typeof(token) === 'object'){
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            }
        }catch(e){
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = add => {
    const target = document.querySelector("body");
    if(add){
        target.classList.add('loggedIn');
    } else {
        target.classList.remove('loggedIn');
    }
};

// Set the session token in the app.config object as well as local storage
app.setSessionToken = token => {
    app.config.sessionToken = token;
    const tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);
    if(typeof(token) === 'object'){
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    }
};

// Renew the token, return false if no error; true otherwise
app.renewToken = async () => {
    const currentToken = typeof(app.config.sessionToken) === 'object' ? app.config.sessionToken : false;
    if(currentToken){
        // Update the token with a new expiration
        const payload = {
            'id': currentToken.id,
            'extend': true,
        };
        const {statusCode, parsedResponse} = await app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, true);
        // Display an error on the form if needed
        if(statusCode === 200){
            // Get the new token details
            app.setSessionToken(parsedResponse);
            return false;
        } else {
            app.setSessionToken(false);
            return true;
        }
    } else {
        app.setSessionToken(false);
        return true;
    }
};

// Loop to renew token often
app.tokenRenewalLoop = () => {
    setInterval(async () => {
        const err = await app.renewToken();
        if(!err){
            console.log("Token renewed successfully @ "+Date.now());
        }
    },1000 * 60);
};

// Load data on the page
app.loadDataOnPage = () => {
    // Get the current page from the body class
    const bodyClasses = document.querySelector("body").classList;
    const primaryClass = typeof(bodyClasses[0]) === 'string' ? bodyClasses[0] : false;
    // Logic for account settings page
    if(primaryClass === 'accountEdit') (async () => await app.loadAccountEditPage())();
    // Logic for menu page
    if(primaryClass === 'menusList') (async () => await app.loadMenusListPage())();
    // Logic for menu cart page
    if(primaryClass === 'menusListAuthenticated') (async () => await app.loadMenusCartPage())()
};

// Load the account edit page specifically
app.loadAccountEditPage = async () => {
    // Get the email from the current token, or log the user out if none is there
    const email = typeof(app.config.sessionToken.email) === 'string' ? app.config.sessionToken.email : false;
    if(email){
        // Fetch the user data
        const queryStringObject = { email };
        const {statusCode, parsedResponse} = await app.client.request(undefined,'api/users','GET',queryStringObject,undefined,true);
        if(statusCode === 200){
            // Put the data into the forms as values where needed
            document.querySelector("#accountEdit1 .usernameInput").value = parsedResponse.username;
            document.querySelector("#accountEdit1 .addressInput").value = parsedResponse.address;
            document.querySelector("#accountEdit1 .displayEmailInput").value = parsedResponse.email;
            // Put the hidden phone field into both forms
            document.querySelectorAll("input.hiddenEmailInput").forEach(hiddenEmailInput => hiddenEmailInput.value = parsedResponse.email)
        } else {
            // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
            await app.logUserOut();
        }
    } else {
        await app.logUserOut();
    }
};

// Load the dashboard page specifically
app.loadMenusListPage = async () => {
    const {statusCode, parsedResponse} = await app.client.request(undefined, 'api/menus', 'GET', undefined, undefined, true);
    if(statusCode === 200){
        menusTableFiller(parsedResponse, "menusListTable");
        document.getElementById("loginCTA").style.display = 'block'
    } else {
        // If the request comes back as something other than 200, logged the user out if any; alert error; and then redirect to home
        await app.logUserOut();
        alert("Error encountered when loading our menu. Please try again later.");
        window.location = '/';
    }
};

app.loadMenusCartPage = async () => {
    // Get the email from the current token, or log the user out if none is there
    const email = typeof(app.config.sessionToken.email) === 'string' ? app.config.sessionToken.email : false;
    // Get the menu
    const {statusCode: menuStatusCode, parsedResponse: menu} = await app.client.request(undefined, 'api/menus', 'GET', undefined, undefined, true);
    // CALL THE API TO GET USER'S EXISTING CART ITEMS IF ANY
    const {statusCode: cartStatusCode, parsedResponse: cart} = await app.client.request(undefined, 'api/carts', 'GET', { email }, undefined, true);
    if(email && menuStatusCode === 200 && cartStatusCode === 200){
        // Initialize postponable request sender
        let postponableSender;
        // Load the menu data into table
        menusTableFiller(menu, "loggedInMenu");
        // The model for cart table
        class CartModel {
            constructor(obj) {
                if (typeof (obj) === "object") Object.keys(obj).forEach(key => this[key] = obj[key])
            }
        }
        // The observable object for cart table
        const CartView = new Proxy(CartModel, {
            // CartView::construct(target::CartView, [arg0::Object, arg1::Object]) => new CartView(CartViewPreloaderObject, MenusListObject)
            construct: (target, argumentsList) => {
                // instantiate cart model.
                const model = new target(argumentsList[0]); // === new CartModel(argumentsList[0])
                // get the menu
                const menu = argumentsList[1];
                console.log(menu, "debug 1"); // TODO - GET RID OF THIS
                // Preload the cart table if possible
                Object.keys(model).forEach(async foodname => {
                    const table = document.getElementById("cart");
                    const tr = table.insertRow(-1);
                    tr.classList.add('itemRow');
                    const td0 = tr.insertCell(0);
                    const td1 = tr.insertCell(1);
                    const td2 = tr.insertCell(2);
                    const td3 = tr.insertCell(3);
                    td0.innerHTML = foodname;
                    td1.innerHTML = "$" + menu[foodname];
                    td2.innerHTML = "<input type='number' id='item-"+foodname+"' />";
                    td3.innerHTML =
                        "<button class='add' type='button' name='"+foodname+"'>" +
                        "<img src='public/plus.png'/></button>" +
                        "<button class='remove' type='button' name='"+foodname+"'>" +
                        "<img src='public/minus.png'/></button>";
                    document.getElementById("item-"+foodname).value = model[foodname];
                });
                // return the observable
                return new Proxy(model, {
                    // TODO - ADD TRAP HANDLERS TO INSPECT ON MODEL OPTS AND UNDERTAKE DOM MANIPULATION BEHIND THE SCENE
                })
            }
        });
        const view = new CartView(cart, menu);
        // TODO - ADD LISTENER TO ALL "MENU-ADD-PIZZA" BUTTONS
    } else {
        // If the request comes back as something other than 200, logged the user out if any; alert error; and then redirect to home
        await app.logUserOut();
        alert("Error encountered when either loading our menu or loading your cart (make sure you are logged in to view your cart). Please try again later.");
        window.location = '/';
    }
};

// Init (bootstrapping)
app.init = () => {
    // Bind all form submissions
    app.bindForms();
    // Bind logout logout button
    app.bindLogoutButton();
    // Get the token from local storage
    app.getSessionToken();
    // Renew token
    app.tokenRenewalLoop();
    // Load data on page
    app.loadDataOnPage();
};

// Call the init processes after the window loads
window.onload = () => {
    app.init();
};