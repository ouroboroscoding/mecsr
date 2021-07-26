/**
 * Rest Init
 *
 * Handles initialising Rest communication for the entire app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-01
 */

// Error codes/messages
import errors from 'definitions/errors';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, {

	// Called after a request returns, error or not
	after: (method, url, data, opts) => {
		Events.trigger('LoaderHide');
	},

	// Called before a request is sent out
	before: (method, url, data, opts) => {
		Events.trigger('LoaderShow');
	},

	cookie: process.env.REACT_APP_WS_DOMAIN,

	// Called after a request flat out fails
	error: xhr => {

		// If we got a 401, let everyone know we signed out
		if(xhr.status === 401) {
			Events.trigger('error', 'You have been signed out!');
			Events.trigger('signedOut');
		} else {
			Events.trigger('error',
				'Unable to connect to ' + process.env.REACT_APP_MEMS_DOMAIN +
				': ' + xhr.statusText +
				' (' + xhr.status + ')');
		}
	},

	// Error codes
	errors: errors,

	// Called after a request is successful from an HTTP standpoint
	success: res => {

		// Set the default value of the handled flag
		res._handled = false;

		// If we got an error
		if(res.error) {

			// What error is it?
			switch(res.error.code) {

				// No Session
				case 102:

					// Trigger signout
					Events.trigger("signout");
					res._handled = true;
					break;

				case 207:

					// Notify the user
					Events.trigger('error', 'Request to ' + res.error.msg + ' failed. An administrator has been notified. Please be patient while we fix the issue.');
					res._handled = true;
					break;

				// Insufficient rights
				case 1000:

					// Notify the user
					Events.trigger('error', 'You lack the necessary rights to do the requested action');
					res._handled = true;
					break;

				// Invalid fields
				case 1001:

					// Rebuild the error message
					res.error.msg = Rest.toTree(res.error.msg);
					break;

				// no default
			}
		}
	}
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('csr', 'session', {}).done(res => {
		Rest.read('csr', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Hide the loader
Events.trigger('LoaderHide');
