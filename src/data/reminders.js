/**
 * Reminder
 *
 * Functions to add or remove claims
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-26
 */

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date } from 'shared/generic/tools';

// Global variables
let _callbacks = [];
let _count = null;
let _running = false;
let _timer = null;

// Track sign in/out
Events.add('signedIn', user => {
	fetchCount();
});
Events.add('signedOut', () => {
	_count = 0;
	notify();
});

/**
 * Add
 *
 * Add a new reminder to the system
 *
 * @name add
 * @access public
 * @param Object data The reminder data
 * @return Promise
 */
export function add(data) {

	// Create a new promise
	return new Promise((resolve, reject) => {

		// Tell the server
		Rest.create('csr', 'reminder', data).done(res => {
			if(res.error && !res._handled) {
				reject(res.error);
			} else if(res.data) {
				resolve(res.data);
				fetchCount();
			}
		});
	});
}

/**
 * Fetch Count
 *
 * Gets the count of unresolved
 *
 * @name fetchCount
 * @access private
 * @return void
 */
function fetchCount() {

	// If we're not already running
	if(!_running) {
		_running = true;

		// Get the current date
		let sDate = date(new Date(), '-');

		// Fetch the data from the server
		Rest.read('csr', 'reminders/count', {
			date: sDate
		}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's data
			if('data' in res) {

				// Store the data
				_count = res.data;

				// If we have a timer
				if(_timer) {
					clearTimeout(_timer);
				}

				// Set a new timeout in an hour
				_timer = setTimeout(fetchCount, 3600000);

				// Trigger all callbacks
				notify();
			}

			// Finish running
			_running = false;
		});
	}
}

/**
 * Remove
 *
 * Deletes an existing reminder from the system
 *
 * @name remove
 * @access public
 * @param String id The ID of the reminder
 * @return Promise
 */
export function remove(id) {

	// Create a new promise
	return new Promise((resolve, reject) => {

		// Tell the server
		Rest.delete('csr', 'reminder', {
			_id: id
		}).done(res => {
			if(res.error && !res._handled) {
				reject(res.error);
			} else if(res.data) {
				resolve(res.data);
				fetchCount();
			}
		});
	});
}

/**
 * Resolve
 *
 * Marks the reminder as resolved
 *
 * @name resolve
 * @access public
 * @param String id The ID of the reminder
 * @return Promise
 */
export function resolve(id) {

	// Create a new promise
	return new Promise((resolve, reject) => {

		// Tell the server
		Rest.update('csr', 'reminder/resolve', {
			_id: id
		}).done(res => {
			if(res.error && !res._handled) {
				reject(res.error);
			} else if(res.data) {
				resolve(res.data);
				fetchCount();
			}
		});
	});
}

/**
 * Notify
 *
 * Calls all the callbacks with the current data
 *
 * @name notify
 * @access private
 * @return void
 */
function notify() {

	// Pass the count to everyone tracking
	for(let f of _callbacks) {
		f(_count);
	}
}

/**
 * Update
 *
 * Updates an existing reminder
 *
 * @name update
 * @access public
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
export function update(data) {

	// Create a new promise
	return new Promise((resolve, reject) => {

		// Tell the server
		Rest.update('csr', 'reminder', data).done(res => {
			if(res.error && !res._handled) {
				reject(res.error);
			} else if(res.data) {
				resolve(res.data);
				fetchCount();
			}
		});
	});
}

/**
 * Subscribe
 *
 * Subscribes to locale changes and returns the current data
 *
 * @name subscribe
 * @access public
 * @param Function callback The callback to register for future updates
 * @return Array
 */
function subscribe(callback) {

	// Add the callback to the list
	_callbacks.push(callback);
}

/**
 * Ubsubscribe
 *
 * Removes a callback from the list of who gets notified on changes
 *
 * @name ubsubscribe
 * @access public
 * @param Function callback The callback to remove
 * @return void
 */
function unsubscribe(callback) {
	let i = _callbacks.indexOf(callback);
	if(i > -1) {
		_callbacks.splice(i, 1);
	}
}

// Default export
const locales = {
	add: add,
	remove: remove,
	resolve: resolve,
	subscribe: subscribe,
	unsubscribe: unsubscribe,
	update: update
}
export default locales;
