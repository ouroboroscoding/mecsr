/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// Generic modules
import Events from './generic/events';

/**
 * Utils
 */
export default {

	date: function(ts) {
		var d = new Date(ts*1000);
		var Y = '' + d.getFullYear();
		var M = '' + (d.getMonth() + 1);
		if(M.length === 1) M = '0' + M;
		var D = '' + d.getDate();
		if(D.length === 1) D = '0' + D;
		return Y + '/' + M + '/' + D;
	},

	datetime: function(ts) {
		var d = new Date(ts*1000);
		var t = ['', '', ''];
		t[0] += d.getHours();
		if(t[0].length === 1) t[0] = '0' + t[0];
		t[1] += d.getMinutes();
		if(t[1].length === 1) t[1] = '0' + t[1];
		t[2] += d.getSeconds();
		if(t[2].length === 1) t[2] = '0' + t[2];
		return this.date(ts) + ' ' + t.join(':')
	},

	errorTree: function(errors) {

		// Init the return
		var oRet = {}

		// Go through each error
		for(let i = 0; i < errors.length; ++i) {

			// If the error field has a period
			if(errors[i][0].includes('.')) {

				// Split it
				let lField = errors[i][0].split(/\.(.*)/)

				// If we don't have the field already
				if(!oRet[lField[0]]) {
					oRet[lField[0]] = []
				}

				// Add the rest
				oRet[lField[0]].push([lField[1], errors[i][1]]);
			}

			// Else it's a flat field
			else {
				oRet[errors[i][0]] = errors[i][1];
			}
		}

		// Go through all the errors we found
		for(let k in oRet) {

			// If we find an array
			if(Array.isArray(oRet[k])) {

				// Recurse
				oRet[k] = this.errorTree(oRet[k]);
			}
		}

		// Return the Tree
		return oRet;
	},

	restError: function(err) {

		// What error is it?
		switch(err.code) {

			// No Session
			case 102:

				// Trigger signout
				Events.trigger("signout");

				// Nothing else to do
				return true;

			// Invalid fields
			case 1001:

				// Rebuild the error message
				err.msg = this.errorTree(err.msg);

				// But allow the child to deal with the messages themselves
				return false;

			// Insufficient rights
			case 1002:

				// Notify the user
				Events.trigger('error', 'You lack the necessary rights to do the action requested');

				// Nothing else to do
				return true;

			// no default
		}

		// Failed to process error
		return false;
	}
}
