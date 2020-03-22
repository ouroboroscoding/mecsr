/**
 * Services
 *
 * Handles connecting to and retrieving data from services
 *
 * @author Chris Nasr
 * @copyright OuroborosCoding
 * @created 2018-11-24
 */

// External modules
import $ from '../3rd/jquery.ajax';

// Generic modules
import Cookies from './cookies.js';

// Services domain
let domain = '';

// Default error function
let _error = function() {}

/**
 * Clear
 *
 * Clears the session from local storage and cookies
 *
 * @name clear
 * access private
 * @return void
 */
function clear() {

	// Delete from localStorage
	delete localStorage['_session'];

	// Delete the cookie
	Cookies.remove('_session', '.' + window.location.hostname, '/');
}

/**
 * Request
 *
 * Handles actual requests
 *
 * @name request
 * @access private
 * @param string method			The method used to send the request
 * @param string url			The full URL to the service/noun
 * @param object data			The data to send to the service
 * @param string auth			Optional Authorization token
 * @return xhr
 */
function request(method, url, data) {

	// Generate the ajax config
	let oConfig = {

		// Check requests before sending
		"beforeSend": function(xhr, settings) {

			// Add the URL to the request so that on error what failed
			xhr._url = url;

			// If we have a session, add the authorization token
			if('_session' in localStorage) {
				xhr.setRequestHeader('Authorization', localStorage['_session']);
			}
		},

		// Looking for JSON responses
		"contentType": "application/json; charset=utf-8",

		// On error
		"error": function(xhr, status, error) {

			// If we got an Authorization error
			if(xhr.status === 401) {

				// Clear the current token
				clear();
			}

			// Put the error in the console
			console.error(method + ' ' + xhr._url + ' returned: ' + error);

			// Return the xhr to the error callback
			_error(xhr);
		},

		// Set the method
		"method": method,

		// Set the requested URL
		"url": url
	}

	// If it's a get request
	if(method === 'get') {

		// And data was passed, add it as a param
		if(typeof data !== 'undefined') {
			oConfig['data'] = "d=" + encodeURIComponent(JSON.stringify(data));
		}
	}

	// Else it's any other method, stringify the data
	else {
		oConfig.data = JSON.stringify(data);
	}

	// Make the request and return the xhr
	return $.ajax(oConfig);
}

/**
 * Store
 *
 * Stores the session token in local storage and cookies
 *
 * @name store
 * @access private
 * @param string token
 * @return void
 */
function store(token) {

	// Set the session in localStorage
	localStorage['_session'] = token

	// Set the session in a cookie
	Cookies.set('_session', token, 86400, '.' + window.location.hostname, '/');
}

/**
 * Init
 *
 * Initialises the Services modules
 *
 * @name init
 * @access public
 * @param string subdomain		The sub-domain services can be reached through
 * @return void
 */
function init(subdomain, error) {

	// Store the full domain name for service calls
	domain = '//' + subdomain +
				'.' + window.location.hostname +
				'/';

	// Do we have a session in storage
	if('_session' in localStorage && localStorage['_session']) {
		this.session(localStorage['_session'])
	}

	// Else do we have one in a cookie
	else {
		let cookie = Cookies.get('_session');
		if(cookie) {
			this.session(cookie);
		}
	}

	// If an error was passed
	if(typeof error !== 'undefined') {
		_error = error;
	}
}

/**
 * Create
 *
 * Calls the create action on a specific service noune
 *
 * @name create
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @return xhr
 */
function create(service, noun, data) {
	return request('post', domain + service + '/' + noun, data);
}

/**
 * Delete
 *
 * Calls the delete action on a specific service noune
 *
 * @name delete_
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @return xhr
 */
function delete_(service, noun, data) {
	return request('delete', domain + service + '/' + noun, data);
}

/**
 * Read
 *
 * Calls the read action on a specific service noune
 *
 * @name read
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @return xhr
 */
function read(service, noun, data) {
	return request('get', domain + service + '/' + noun, data);
}

/**
 * Session
 *
 * Set or get the session token
 *
 * @name session
 * @access public
 * @param string token			The token to store
 * @return void|str
 */
function session(token) {

	// If we are setting the session
	if(typeof token !== 'undefined') {

		// If null was passed, delete the session
		if(token == null) {
			clear();
		}

		// Else, set the session
		else {
			store(token);
		}
	}

	// Else we are returning the session
	else {
		return ('_session' in localStorage) ?
			localStorage['_session'] :
			'';
	}
}

/**
 * Update
 *
 * Calls the update action on a specific service noune
 *
 * @name update
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @return xhr
 */
function update(service, noun, data) {
	return request('put', domain + service + '/' + noun, data);
}

// export module
export default {
	init: init,
	create: create,
	delete: delete_,
	read: read,
	session: session,
	update: update
}
