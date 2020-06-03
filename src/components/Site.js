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
import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';

// Composite component modules
import Alerts from './composites/Alerts';
import Header from './composites/Header';
import Signin from './composites/Signin';
// Page component modules
import Customer from './pages/Customer';
import Search from './pages/Search';
import Templates from './pages/Templates';
import Unclaimed from './pages/Unclaimed';

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
class Site extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			"user": false
		};

		// Class vars
		this.iNewMessages = 0;

		// Refs
		this.header = null;

		// Binds methods to this instance
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
	}

	render() {
		return (
			<SnackbarProvider maxSnack={3}>
				<Alerts />
				<BrowserRouter>
					<div id="site">
						{this.state.user === false &&
							<Signin />
						}
						<Header
							path={window.location.pathname}
							ref={el => this.header = el}
							user={this.state.user}
						/>
						<div id="content">
							<Switch>
								<Route path="/unclaimed">
									<Unclaimed
										user={this.state.user}
									/>
								</Route>
								<Route path="/search">
									<Search
										user={this.state.user}
									/>
								</Route>
								<Route path="/templates">
									<Templates
										user={this.state.user}
									/>
								</Route>
								<Route
									path="/customer/:phoneNumber"
									component={({match: {params:{phoneNumber}}}) => (
										<Customer key={phoneNumber} phoneNumber={phoneNumber} user={this.state.user} />
									)}
								/>
							</Switch>
						</div>
					</div>
				</BrowserRouter>
			</SnackbarProvider>
		);
	}

	signedIn(user) {

		// Set the user
		this.setState({"user": user});
	}

	signedOut() {

		// Remove the user
		this.setState({"user": false});
	}
}

// Export the app
export default Site;
