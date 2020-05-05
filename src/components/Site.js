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
import Hash from '../generic/hash';
import Rest from '../generic/rest';
import Tools from '../generic/tools';

// Composite component modules
import Alerts from './composites/Alerts';
import Header from './composites/Header';
import Signin from './composites/Signin';
// Page component modules
import Customer from './pages/Customer';
import Search from './pages/Search';
import Unclaimed from './pages/Unclaimed';

// Local modules
import Loader from '../loader';
import Utils from '../utils';

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
	Loader.show();
}, (method, url, data) => {
	Loader.hide();
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('monolith', 'session', {}).done(res => {
		Rest.read('monolith', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Hide the loader
Loader.hide();

// Make Events available from console
window.Events = Events;

// Site
class Site extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Init the hash module
		Hash.init();

		// Initialise the state
		this.state = {
			"claimed": [],
			"user": false
		};

		// Refs
		this.header = null;

		// Binds methods to this instance
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);
		Events.add('claimedRemove', this.claimedRemove);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);
		Events.remove('claimedRemove', this.claimedRemove);
	}

	claimedAdd(number, name, callback) {

		// Send the claim  to the server
		Rest.create('monolith', 'customer/claim', {
			phoneNumber: number
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Clone the claimed state
				let lClaimed = Tools.clone(this.state.claimed);

				// Add the record to the end
				lClaimed.push({
					customerName: name,
					customerPhone: number
				});

				// Set the new state
				this.setState({
					claimed: lClaimed
				}, () => {
					this.header.path = '/customer/' + number;
				});
			}
		});
	}

	claimedFetch() {

		// Fetch the claimed
		Rest.read('monolith', 'msgs/claimed', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the state
				this.setState({
					claimed: res.data
				});
			}
		});
	}

	claimedRemove(claimed) {

		// Send the removal to the server
		Rest.delete('monolith', 'customer/claim', {
			phoneNumber: claimed
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Clone the claimed state
				let lClaimed = Tools.clone(this.state.claimed);

				// Find the index of the remove customer
				let iIndex = Tools.afindi(lClaimed, 'customerPhone', claimed);

				// If we found one
				if(iIndex > -1) {

					// Remove the element
					lClaimed.splice(iIndex, 1);

					// Set the new state
					this.setState({
						claimed: lClaimed
					});
				}
			}
		});
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
							claimed={this.state.claimed}
							path={window.location.pathname}
							ref={el => this.header = el}
							user={this.state.user}
						/>
						<div id="content">
							<Switch>
								<Route path="/unclaimed">
									<Unclaimed
										onClaim={this.claimedAdd}
										user={this.state.user}
									/>
								</Route>
								<Route path="/search">
									<Search
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
		this.setState({"user": user}, () => {
			this.claimedFetch();
		});
	}

	signedOut() {

		// Remove the user
		this.setState({
			"claimed": [],
			"user": false
		});
	}
}

// Export the app
export default Site;
