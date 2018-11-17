const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Config = require("../Config");
const https = require("https");
const querystring = require("querystring");
const promisify = require("util").promisify;

const fsReadFile = promisify(fs.readFile);

/**
 * Utility class with static functions
 */
class Helper {

    /**
     * Takes a string and return its hash value
     * @param pwd - string
     * @return string | boolean - return false upon failure; otherwise return the hashed string
     */
    static hash(pwd) {
        if (typeof (pwd) === "string" && pwd.length > 0) {
            return crypto.createHmac("sha256", Config["hashingSecret"]).update(pwd).digest("hex");
        } else {
            return false;
        }
    }

    /**
     * Parse a JSON string to an object in all cases, without throwing
     * @param requestPayload - string
     */
    static parseJsonToObject(requestPayload) {
        try {
            return JSON.parse(requestPayload);
        } catch (e) {
            return {}
        }
    }

    /**
     * Create a string of random alphanumeric characters, of a given length
     * @param strLength
     * @return {string | boolean} - return false upon failure; otherwise return the randomized string
     */
    static createRandomString(strLength) {
        strLength = typeof (strLength) === "number" && strLength > 0 ? strLength : false;
        if (strLength) {
            // Define all the possible characters that could go into a string
            const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
            // Start the final string
            let str = "";
            for (let i = 1; i <= strLength; i++) {
                // Get a random char from the possible characters string and then append this char to the final string
                str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            }
            return str;
        } else {
            return false;
        }
    }

    /**
     * Charge payment via Stripe
     * @param amount
     * @param currency
     * @param description
     * @param source
     * @return {Promise<Object | string>} - return a simplified result object if no error; otherwise return the error string
     */
    static async sendStripePayment(amount, currency, description, source) {
        // Validate parameters
        amount = typeof (amount) === "number" && amount > 0 ? amount : false;
        currency = typeof (currency) === "string" && currency.trim().length > 0 ? currency.trim() : false;
        description = typeof (description) === "string" && description.trim().length > 0 ? description.trim() : false;
        source = typeof (source) === "string" && source.trim().length > 0 ? source.trim() : false;
        if (amount && currency && description && source) {
            // Configure the request payload
            const payload = {
                amount,
                currency,
                description,
                source
            };
            // Stringify the payload
            const stringPayload = querystring.stringify(payload);
            // Configure the request details
            const requestDetails = {
                "protocol" : "https:",
                "hostname" : "api.stripe.com",
                "method" : "POST",
                "path" : `/v1/charges`,
                "auth" : `${Config["stripe"].test_secret}:`,
                "headers" : {
                    "Content-Type" : "application/x-www-form-urlencoded",
                    "Content-Length" : Buffer.byteLength(stringPayload)
                }
            };
            // Send the request object and get the result
            return await new Promise((resolve, reject) => {
                // Instantiate the request object
                const req = https.request(requestDetails, res => {
                    let chunks = [];
                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });
                    res.on("end", function () {
                        const body = Helper.parseJsonToObject(Buffer.concat(chunks));
                        console.log("Stripe response ", body);
                        // Grab the status of the sent request
                        if (body.status === "succeeded" && body["paid"] === true) {
                            resolve({
                                "status" : body.status,
                                "paid" : body["paid"],
                                "source_id" : body.source.id,
                                "balance_transaction" : body.balance_transaction,
                                "amount" : body.amount,
                                "description" : body.description
                            })
                        } else {
                            reject(`Failed to charge payment. Response from Stripe: ${JSON.stringify(body)}`)
                        }
                    });
                });
                // Bind to the error event so it does not get thrown
                req.on("error", e => {
                    reject(e)
                });
                // Add the stringified payload
                req.write(stringPayload);
                // End the request. Ending a request is the same as sending it off
                req.end();
            })
        } else {
            return "Given parameters were missing or invalid"
        }
    }

    /**
     * Send email via Mailgun
     * @param to
     * @param subject
     * @param text
     * @return {Promise<Object | string>} - return a simplified result object if no error; otherwise return the error string
     */
    static async sendMailGunMsg(to, subject, text) {
        // Validate parameters
        to = typeof (to) === "string" && to.trim().length > 0 ? to.trim() : false;
        subject = typeof (subject) === "string" && subject.trim().length > 0 ? subject.trim() : false;
        text = typeof (text) === "string" && text.trim().length > 0 ? text.trim() : false;
        if (to && subject && text) {
            // Configure the request payload
            const payload = {
                "from" : Config["mailgun"]["from"],
                to,
                subject,
                text
            };
            // const formData = new FormData();
            // Object.keys(payload).forEach(key => formData.append(key, payload[key]));
            // Configure the request details
            const boundaryStr = Helper.createRandomString(33);
            const requestDetails = {
                "protocol" : "https:",
                "hostname" : "api.mailgun.net",
                "method" : "POST",
                "path" : `/v3/${Config["mailgun"]["domain"]}/messages`,
                "auth" : `api:${Config["mailgun"]["apiKey"]}`,
                "headers" : {
                    "Content-Type" : `multipart/form-data; boundary=----${boundaryStr}`
                }
            };
            // Send the request object and get the result
            return await new Promise((resolve, reject) => {
                // Instantiate the request object
                const req = https.request(requestDetails, res => {
                    let chunks = [];
                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });
                    res.on("end", function () {
                        const body = Helper.parseJsonToObject(Buffer.concat(chunks));
                        console.log("Mailgun response ", body.id, body.message);
                        // Grab the status of the sent request
                        if (body.id && body.message === "Queued. Thank you.") {
                            resolve(body)
                        } else {
                            console.error(body);
                            reject(`Failed to send email via Mailgun ${JSON.stringify(body)}`)
                        }
                    });
                });
                // Bind to the error event so it does not get thrown
                req.on("error", e => {
                    reject(e)
                });
                // Add the payload
                req.write(`------${boundaryStr}\r\nContent-Disposition: form-data; name="from"\r\n\r\n${payload.from}\r\n------${boundaryStr}\r\nContent-Disposition: form-data; name="to"\r\n\r\n${payload.to}\r\n------${boundaryStr}\r\nContent-Disposition: form-data; name="subject"\r\n\r\n${payload.subject}\r\n------${boundaryStr}\r\nContent-Disposition: form-data; name="text"\r\n\r\n${payload.text}\r\n------${boundaryStr}--`);
                // End the request. Ending a request is the same as sending it off
                req.end();
            })
        } else {
            return "Given parameters were missing or invalid"
        }
    }

    /**
     * Get the string content of a template under the 'templates' dir
     * @param templateName
     * @param data
     * @return {Promise<string>} - error will be thrown if any; otherwise the string content gets returned
     */
    static async getTemplate(templateName, data) {
        templateName = typeof (templateName) === "string" && templateName.length > 0 ? templateName : false;
        data = typeof (data) === "object" && data !== null ? data : {};
        if (templateName) {
            const templateDir = path.join(__dirname, "/../../templates/");
            try {
                return Helper.interpolate(await fsReadFile(`${templateDir}${templateName}.html`, "utf8"), data)
            } catch (e) {
                throw `No template could be found for the template name: [${ templateName }] under the [${ templateDir }] directory. Stacktrace: ` + e
            }
        } else {
            throw "A valid template name was not specified. Template Name Requested: " + templateName
        }
    }

    // Add the universal header and footer to a string and pass provided data object to the header and footer for interpolation
    static async addUniversalTemplate(str, data) {
        str = typeof (str) === "string" && str.length > 0 ? str : "";
        data = typeof (data) === "object" && data !== null ? data : {};
        try {
            // Get the header
            const headerStr = await Helper.getTemplate("_header", data);
            // Get the footer
            const footerStr = await Helper.getTemplate("_footer", data);
            return `${headerStr}${str}${footerStr}`
        } catch (e) {
            throw "Could not find the template. Stacktrace: " + e
        }
    }

    /**
     * Take a given string and a data object and find/replace all the keys within it
     * @param str
     * @param data
     * @return {string}
     */
    static interpolate(str, data) {
        str = typeof (str) === "string" && str.length > 0 ? str : "";
        data = typeof (data) === "object" && data !== null ? data : {};
        // Add the template globals to the data object, prepending their key name with "global"
        Object.keys(Config["templateGlobals"]).forEach(key => {
            data[`global.${key}`] = Config["templateGlobals"][key]
        });
        // For each key in the data object, insert its value into the string at the corresponding place holder
        Object.keys(data).forEach(key => {
            if (typeof (data[key]) === "string") {
                str = str.replace(`{${key}}`, data[key])
            }
        });
        return str
    }

    // Get the content of a static (public) asset
    static async getStaticAsset(filename) {
        filename = typeof (filename) === "string" && filename.length > 0 ? filename : false;
        if (filename) {
            const publicDir = path.join(__dirname, "/../../public/");
            return await fsReadFile(`${publicDir}${filename}`);
        } else {
            throw "A valid file name was not specified"
        }
    }

}

module.exports = Helper;