/**
 * Tools
 *
 * Useful functions that belong to any specific module
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-11-25
 */

/**
 * Array Find Index
 *
 * Finds a specific object in an array based on key name and value and
 * returns its index
 *
 * @name afindi
 * @param array a				The value to look through
 * @param str k					The name of the key to check
 * @param mixed v				The value to check against
 * @return object
 */
export function afindi(a, k, v) {
	for(let i = 0; i < a.length; ++i) {
		if(a[i][k] === v) {
			return i;
		}
	}
	return -1;
}

/**
 * Array Find Object
 *
 * Finds a specific object in an array based on key name and value and
 * returns it
 *
 * @name afindo
 * @param array a				The value to look through
 * @param str k					The name of the key to check
 * @param mixed v				The value to check against
 * @return object
 */
export function afindo(a, k, v) {
	for(let i = 0; i < a.length; ++i) {
		if(a[i][k] === v) {
			return a[i];
		}
	}
	return null;
}

/**
 * Clone
 *
 * Deep clone any type of object, returning a new one
 *
 * @name clone
 * @param mixed o				The variable to clone
 * @return mixed
 */
export function clone(o) {
	// New var
	let n = null;

	// If it's an array
	if(Array.isArray(o)) {
		n = [];
		for(let i in o) {
			n.push(clone(o[i]));
		}
	}

	// Else if the value is an object
	else if(isObject(o)) {
		n = {}
		for(let k in o) {
			n[k] = clone(o[k]);
		}
	}

	// Else, copy as is
	else {
		n = o;
	}

	// Return the new var
	return n;
}

/**
 * Compare
 *
 * Compares two values of any type to see if they contain the same
 * data or not
 *
 * @name compare
 * @access public
 * @param mixed v1				The first value
 * @param mixed v2				The second value
 * @return bool
 */
export function compare(v1, v2) {

	// If they're both arrays
	if(Array.isArray(v1) && Array.isArray(v2)) {

		// If they don't have the same length
		if(v1.length !== v2.length) {
			return false;
		}

		// Compare the values
		for(let i = 0; i < v1.length; ++i) {
			if(!compare(v1[i], v2[i])) {
				return false;
			}
		}
	}

	// Else if they're both objects
	else if(isObject(v1) && isObject(v2)) {

		// If they don't have the same keys
		if(!compare(Object.keys(v1).sort(), Object.keys(v2).sort())) {
			return false;
		}

		// Compare each key
		for(let k in v1) {
			if(!compare(v1[k], v2[k])) {
				return false;
			}
		}
	}

	// Else, compare as is
	else {
		if(v1 !== v2) {
			return false;
		}
	}

	// Return equal
	return true;
}

/**
 * Empty
 *
 * Returns true if the value type is empty
 *
 * @name empty
 * @access public
 * @param mixed m				The value to check, can be object, array, string, etc
 * @return bool
 */
export function empty(m) {

	// If it's an object
	if(isObject(m)) {
		for(let p in m) {
			return false;
		}
		return true;
	}

	// Else if it's an array or a string
	else if(Array.isArray(m) || typeof m == 'string') {
		return m.length === 0;
	}

	// Else
	else {

		// If it's null or undefined
		if(typeof m == 'undefined' || m == null) {
			return true;
		}

		// Else return false
		return false;
	}
}

/**
 * Is Decimal
 *
 * Returns true if the variable is a number
 *
 * @name isDecimal
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isDecimal(m) {
	return typeof m == 'number';
}

/**
 * Is Integer
 *
 * Returns true if the variable is a true integer
 *
 * @name isInteger
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isInteger(m) {
	return m === +m && m === (m|0);
}

/**
 * Is Object
 *
 * Returns true if the variable is a true object
 *
 * @name isObject
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isObject(m) {
	if(m === null) return false;
	if(typeof m != 'object') return false;
	if(Array.isArray(m)) return false;
	return true;
}

/**
 * Object Map
 *
 * Works like map for arrays, but iterates over an object
 *
 * @name omap
 * @access public
 * @param Object o				The object to map
 * @param Function callback		The function to call each iteration
 * @return array
 */
export function omap(o, callback) {
	let ret = [];
	for(let k in o) {
		ret.push(callback(o[k], k));
	}
	return ret;
}

/**
 * UUID v4
 *
 * Returns a psuedo random string in UUID format (NOT ACTUALLY A UUID)
 *
 * @name uuidv4
 * @access public
 * @return str
 */
export function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues((new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
	)
}

// export module
export default {
	afindi: afindi,
	afindo: afindo,
	clone: clone,
	compare: compare,
	empty: empty,
	isDecimal: isDecimal,
	isInteger: isInteger,
	isObject: isObject,
	omap: omap,
	uuidv4: uuidv4
}
