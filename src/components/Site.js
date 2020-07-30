/**
 * Site
 *
 * Primary entry into React app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import React, { useState } from 'react';
import { Switch, Route, useHistory } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';

// Hooks
import { useSignedIn, useSignedOut } from '../hooks/user';

// Composite component modules
import Alerts from './composites/Alerts';
import Header from './composites/Header';
import Signin from './composites/Signin';
// Page component modules
import Agents from './pages/Agents';
import Customer from './pages/Customer';
import Search from './pages/Search';
import Stats from './pages/Stats';
import Templates from './pages/Templates';
import Unclaimed from './pages/Unclaimed';
import Pharmacy from './pages/Pharmacy';

// Local modules
import { LoaderHide, LoaderShow } from './composites/Loader';

// css
import '../sass/site.scss';

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, xhr => {

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
}, (method, url, data) => {
	LoaderShow();
}, (method, url, data) => {
	LoaderHide();
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('monolith', 'session', {}).done(res => {
		Rest.read('monolith', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Make Events available from console
window.Events = Events;

// Hide the loader
LoaderHide();

// Site
function Site(props) {

	// State
	let [user, setUser] = useState(false);

	// Hooks
	let history = useHistory();

	// User hooks
	useSignedIn(user => setUser(user));
	useSignedOut(() => setUser(false));

	// Return the Site
	return (
		<SnackbarProvider maxSnack={3}>
			<Alerts />
			<div id="site">
				{user === false &&
					<Signin />
				}
				<Header
					history={history}
					path={window.location.pathname}
					user={user}
				/>
				<div id="content">
					<Switch>
						<Route path="/agents">
							<Agents user={user} />
						</Route>
						<Route path="/unclaimed">
							<Unclaimed user={user} />
						</Route>
						<Route path="/search">
							<Search user={user} />
						</Route>
						<Route path="/stats">
							<Stats user={user} />
						</Route>
						<Route path="/templates">
							<Templates user={user} />
						</Route>
						<Route path="/pharmacy">
							<Pharmacy user={user} />
						</Route>
						<Route
							path="/customer/:phoneNumber/:customerId"
							component={({match: {params:{phoneNumber, customerId}}}) => (
								<Customer
									key={phoneNumber}
									customerId={parseInt(customerId)}
									phoneNumber={phoneNumber}
									readOnly={false}
									user={user}
								/>
							)}
						/>
						<Route
							path="/view/:phoneNumber/:customerId"
							component={({match: {params:{phoneNumber, customerId}}}) => (
								<Customer
									key={phoneNumber}
									customerId={parseInt(customerId)}
									phoneNumber={phoneNumber}
									readOnly={true}
									user={user}
								/>
							)}
						/>
					</Switch>
				</div>
			</div>
		</SnackbarProvider>
	);
}

// Export the app
export default Site;
