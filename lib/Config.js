/**
 * Create and export configuration variables
 */

// Gather the credentials from process.env if possible
const STRIPE_SECRET = typeof (process.env.STRIPE_SECRET) === "string" ? process.env.STRIPE_SECRET : "";
const STRIPE_TOKEN = typeof (process.env.STRIPE_TOKEN) === "string" ? process.env.STRIPE_TOKEN : "";
const MAILGUN_APIKEY = typeof (process.env.MAILGUN_APIKEY) === "string" ? process.env.MAILGUN_APIKEY : "";
const MAILGUN_DOMAIN = typeof (process.env.MAILGUN_DOMAIN) === "string" ? process.env.MAILGUN_DOMAIN : "";
const MAILGUN_FROM = typeof (process.env.MAILGUN_FROM) === "string" ? process.env.MAILGUN_FROM : "";
console.log("Server is configured with credentials: ", STRIPE_SECRET, STRIPE_TOKEN, MAILGUN_APIKEY, MAILGUN_DOMAIN, MAILGUN_FROM);

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'this is a secret',
    'EMAIL_VALIDATOR' : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    'stripe' : {
        'test_secret' : STRIPE_SECRET,
        'test_token' : STRIPE_TOKEN
    },
    'mailgun' : {
        'apiKey' : MAILGUN_APIKEY,
        'domain' : MAILGUN_DOMAIN,
        'from' : MAILGUN_FROM
    },
    'templateGlobals' : {
        'appName' : 'Pizza Delivery',
        'companyName' : 'NotARealCompany, Inc',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:3000/'
    }
};

// Production environment
environments.production = {
    'httpPort' : 80,
    'httpsPort' : 443,
    'envName' : 'production',
    'hashingSecret' : 'the red fox jumps over a lazy dog',
    'EMAIL_VALIDATOR' : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    'stripe' : {},
    'mailgun' : {},
    'templateGlobals' : {
        'appName' : 'Pizza Delivery',
        'companyName' : 'NotARealCompany, Inc',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:80/'
    }
};

// Determine which environment was passed as a command line argument
const currentEnvironment = typeof (process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : "";

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = Object.keys(environments).includes(currentEnvironment) ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;