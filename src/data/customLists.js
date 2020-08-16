/**
 * Custom Lists
 *
 * Functions to fetch, add, or remove custom lists and items
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-16
 */

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';
import Tools from '../generic/tools';

// Local modules
import Utils from '../utils';

// Module data
let __callbacks = [];
let __lists = [];

// Track Sign In
Events.add('signedIn', user => {

	// Request the lists from the server
	Rest.read('csr', 'lists', {}).done(res => {

		// If there's an error or warning
		if(res.error && !Utils.restError(res.error)) {
			Events.trigger('error', JSON.stringify(res.error));
		}
		if(res.warning) {
			Events.trigger('warning', JSON.stringify(res.warning));
		}

		// If we got data
		if(res.data) {

			// Store it
			__lists = res.data;

			// Notify
			notify();
		}
	});
});

// Track Sign Out
Events.add('signedOut', () => {

	// Clear the data
	__lists = [];

	// Notify
	notify();
});

/**
 * Create Item
 *
 * Create an item, adds it to a list, and notifies anyone tracking changes
 *
 * @name createItem
 * @access public
 * @param String list The list to add the item to
 * @param Object item The item to add
 * @param Function success Called if the list is created
 * @return void
 */
export function createItem(list, item, success) {

	// Send the data to the server
	Rest.create('csr', 'list/item', {
		"list": list,
		...item
	}).done(res => {

		// If there's an error or warning
		if(res.error && !Utils.restError(res.error)) {
			if(res.error.code === 1101) {
				Events.trigger('error', 'This conversation is already part of the given list');
			} else {
				Events.trigger('error', JSON.stringify(res.error));
			}
		}
		if(res.warning) {
			Events.trigger('warning', JSON.stringify(res.warning));
		}

		// If there's data
		if(res.data) {

			// Look for the list
			let i = Tools.afindi(__lists, '_id', list);

			// If we found it
			if(i > -1) {

				// Push the new item onto it
				__lists[i]['items'].push(item);

				// Notify
				notify()

				// If we have a callback
				if(success) {
					success(res.data);
				}
			}
		}
	});
}

/**
 * Create List
 *
 * Create a list, add it to the data, and notifies anyone tracking changes
 *
 * @name createList
 * @access public
 * @param String title The title of the new list to create
 * @param Function success Called if the list is created
 * @return void
 */
export function createList(title, success=null) {

	// Send the data to the server
	Rest.create('csr', 'list', {
		"title": title
	}).done(res => {

		// If there's an error or warning
		if(res.error && !Utils.restError(res.error)) {
			Events.trigger('error', JSON.stringify(res.error));
		}
		if(res.warning) {
			Events.trigger('warning', JSON.stringify(res.warning));
		}

		// If there's data
		if(res.data) {

			// Add the new list to the data
			__lists.push({
				"_id": res.data,
				"title": title,
				"items": []
			})

			// Resort the data
			__lists.sort(Tools.sortByKey('title'));

			// Notify
			notify()

			// If we have a callback
			if(success) {
				success(res.data);
			}
		}
	});
}

/**
 * Delete Item
 *
 * Delete an item, remove it from the data, and notifies anyone who cares
 *
 * @name deleteItem
 * @access public
 * @param String list The unique ID of the list the item is in
 * @param String _id The unique ID of the item to delete
 * @return void
 */
export function deleteItem(list, _id) {

	// Send the data to the server
	Rest.delete('csr', 'list/item', {
		"_id": _id
	}).done(res => {

		// If there's an error or warning
		if(res.error && !Utils.restError(res.error)) {
			Events.trigger('error', JSON.stringify(res.error));
		}
		if(res.warning) {
			Events.trigger('warning', JSON.stringify(res.warning));
		}

		// If there's data
		if(res.data) {

			// Find the list
			let iList = Tools.afindi(__lists, '_id', list);

			// If we found it
			if(iList > -1) {

				// Find the item
				let iItem = Tools.afindi(__lists[iList].items, '_id', _id);

				// If we found it
				if(iItem > -1) {

					// Delete it
					__lists[iList].items.splice(iItem, 1);

					// Notify
					notify();
				}
			}
		}
	});
}

/**
 * Delete List
 *
 * Delete a list, remove it from the data, and notifies anyone who cares
 *
 * @name deleteList
 * @access public
 * @param String _id The unique ID of the list to delete
 * @return void
 */
export function deleteList(_id) {

	// Send the request to the server
	Rest.delete('csr', 'list', {
		"_id": _id
	}).done(res => {

		// If there's an error or warning
		if(res.error && !Utils.restError(res.error)) {
			Events.trigger('error', JSON.stringify(res.error));
		}
		if(res.warning) {
			Events.trigger('warning', JSON.stringify(res.warning));
		}

		// If we got data
		if(res.data) {

			// Find the index of the deleted list
			let i = Tools.afindi(__lists, '_id', _id);

			// If we found it
			if(i > -1) {

				// Remove the list
				__lists.splice(i, 1);

				// Notify
				notify()
			}
		}
	});
}

/**
 * Fetch
 *
 * Returns the current lists data
 *
 * @name fetch
 * @access public
 * @return Array
 */
export function fetch() {
	return Tools.clone(__lists);
}

/**
 * Track
 *
 * Stores a callback function to be called whenever the custom lists data
 * changes
 *
 * @name track
 * @access public
 * @param Function callback The function to call when data changes
 * @param bool remove Set to false to remove the callback
 * @return void
 */
export function track(callback, remove=false) {
	if(remove) {
		let i = __callbacks.indexOf(callback);
		if(i > -1) {
			__callbacks.splice(i, 1);
		}
	} else {
		__callbacks.push(callback);
	}
}

/**
 * Notify
 *
 * Lets everyone tracking data changes know something changed
 *
 * @name notify
 * @access private
 * @return void
 */
function notify() {

	// Clone the current data
	let lLists = Tools.clone(__lists);

	// Pass the clone to everyone tracking
	for(let f of __callbacks) {
		f(lLists);
	}
}

// Export public functions
export default {
	createList: createList,
	createItem: createItem,
	deleteList: deleteList,
	deleteItem: deleteItem,
	fetch: fetch,
	track: track
}
