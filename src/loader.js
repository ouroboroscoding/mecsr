/**
 * Loader
 *
 * Shows a loading graphic during requests/startup
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-11-24
 */

// Keep track of the show/hide calls
//	assume the loader started on
let count = 1;

// Get the DOM element
let el = document.getElementById('loader');

// Hide the loader
function hide() {

	// Decrement the count
	count--;

	// If this is the last one
	if(count === 0) {
		el.style.display = 'none';
	}
}

// Show the loader
function show() {

	// Increment the count
	count++;

	// If this is the first one
	if(count === 1) {
		el.style.display = 'block';
	}
}

// export module
export default {
	hide: hide,
	show: show
}
