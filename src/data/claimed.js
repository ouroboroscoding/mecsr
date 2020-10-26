/**
 * Claimed
 *
 * Functions to add or remove claims
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-26
 */

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';

// Local modules
import Utils from '../utils';

/**
 * Add
 *
 * Sends a request to add a claim to a conversation
 *
 * @name add
 * @public
 * @param String number The conversation phone number
 * @param String order The orderId associated
 * @param Number provider The ID of the provider associated
 * @return Promise
 */
export function add(number, order=null, provider=null) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the claim  to the server
		Rest.create('monolith', 'customer/claim', {
			phoneNumber: number,
			orderId: order,
			provider: provider
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				// If we're at max claims
				if(res.error.code === 1504) {
					Events.trigger('error', 'You\'ve reached the maximum number of claims. Please resolve, transfer, or unclaim previous claims.');
				} else {
					reject(res.error);
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Fetch
 *
 * Sends a request to get all conversations claimed by the user
 *
 * @name fetch
 * @public
 * @return Promise
 */
export function fetch(number) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Fetch the claimed
		Rest.read('monolith', 'msgs/claimed', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Remove
 *
 * Sends a request to remove a claim to a conversation
 *
 * @name remove
 * @public
 * @param String number The conversation phone number
 * @return Promise
 */
export function remove(number) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the removal to the server
		Rest.delete('monolith', 'customer/claim', {
			phoneNumber: number
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Transfer
 *
 * Sends a request to transfer a claim to another agent
 *
 * @name transfer
 * @public
 * @param String number The conversation phone number
 * @param int user_id The agent to transfer to
 * @return Promise
 */
export function transfer(number, user_id) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the removal to the server
		Rest.update('monolith', 'customer/claim', {
			phoneNumber: number,
			user_id: user_id
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				resolve(res.data);
			}
		});
	});
}

// Export all
export default {
	add: add,
	fetch: fetch,
	remove: remove,
	transfer: transfer
}
