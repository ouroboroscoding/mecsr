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

// Shared data modules
import DoseSpot from 'shared/data/dosespot';
import Tickets from 'shared/data/tickets';

// Shared hooks
import { useSignedIn, useSignedOut } from 'hooks/user';
import { useResize } from 'shared/hooks/resize';

// Composite component modules
import Alerts from './Alerts';
import Footer from './Footer';
import Header from './Header';
import Signin from './Signin';

// Page component modules
import Customer from './pages/Customer';
import HRT from './pages/HRT';
import ManualAdHoc from './pages/ManualAdHoc';
import Pending from './pages/Pending';
import Pharmacy from './pages/Pharmacy';
import Reminders from './pages/Reminders';
import Search from './pages/Search';
import Stats from './pages/Stats';
import TicketsPage from './pages/Tickets';
import Templates from './pages/Templates';
import Unclaimed from './pages/Unclaimed';
import VersionHistory from './pages/VersionHistory';

// Rest
import 'rest_init';

// SASS CSS
import 'sass/site.scss';

// Init tickets module
Tickets.init();

/**
 * Site
 *
 * The primary component for the entire application
 *
 * @name Site
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Site(props) {

	// State
	let [mobile, mobileSet] = useState(document.documentElement.clientWidth < 600 ? true : false);
	let [user, userSet] = useState(false);

	// Hooks
	let history = useHistory();

	// Sign in/out event hooks
	useSignedIn(value => {
		userSet(value);
		DoseSpot.init(value.dsClinicianId);
		Tickets.agent(value.id);
	});
	useSignedOut(() => {
		userSet(false);
		DoseSpot.init(0)
		Tickets.agent(null);
	});

	// Resize hooks
	useResize(() => mobileSet(document.documentElement.clientWidth < 600 ? true : false));

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
					mobile={mobile}
					path={window.location.pathname}
					user={user}
				/>
				<div id="content">
					<Switch>
						<Route
							path="/customer/:phoneNumber/:customerId"
							component={({match: {params:{phoneNumber, customerId}}}) => (
								<Customer
									key={phoneNumber}
									customerId={parseInt(customerId)}
									mobile={mobile}
									phoneNumber={phoneNumber}
									readOnly={false}
									user={user}
								/>
							)}
						/>
						<Route exact path="/hrt">
							<HRT user={user} />
						</Route>
						<Route exact path="/manualad">
							<ManualAdHoc user={user} />
						</Route>
						<Route exact path="/pending">
							<Pending user={user} />
						</Route>
						<Route exact path="/pharmacy">
							<Pharmacy user={user} />
						</Route>
						<Route exact path="/reminders">
							<Reminders user={user} />
						</Route>
						<Route exact path="/search">
							<Search user={user} />
						</Route>
						<Route exact path="/stats">
							<Stats user={user} />
						</Route>
						<Route exact path="/tickets">
							<TicketsPage user={user} />
						</Route>
						<Route exact path="/templates">
							<Templates user={user} />
						</Route>
						<Route exact path="/unclaimed">
							<Unclaimed user={user} />
						</Route>
						<Route
							path="/view/:phoneNumber/:customerId"
							component={({match: {params:{phoneNumber, customerId}}}) => (
								<Customer
									key={phoneNumber}
									customerId={parseInt(customerId)}
									mobile={mobile}
									phoneNumber={phoneNumber}
									readOnly={true}
									user={user}
								/>
							)}
						/>
						<Route exact path="/">
							<VersionHistory />
						</Route>
					</Switch>
				</div>
				<Footer
					history={history}
					user={user}
				/>
			</div>
		</SnackbarProvider>
	);
}
