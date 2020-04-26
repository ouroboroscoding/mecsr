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
import { SnackbarProvider, withSnackbar } from 'notistack';

// Material UI
import Container from '@material-ui/core/Container';

// Generic modules
import Events from '../generic/events';
import Hash from '../generic/hash';
import Rest from '../generic/rest';

// Component modules
import Header from './composites/Header';
import Signin from './composites/Signin';

// Local modules
import Loader from '../loader';

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
	Rest.read('memo', 'session', {}).done(res => {
		Rest.read('memo', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	});
}

// Hide the loader
Loader.hide();

// Make Events available from console
window.Events = Events;

class LibraryWritersAreOftenIdiots extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Bind methods to this instance
		this.error = this.error.bind(this);
		this.popup = this.popup.bind(this);
		this.warning = this.warning.bind(this);
	}

	componentDidMount() {

		// Track any popup events
		Events.add('error', this.error);
		Events.add('popup', this.popup);
		Events.add('success', this.popup);
		Events.add('warning', this.warning);
	}

	componentWillUnmount() {

		// Stop tracking any popup events
		Events.remove('error', this.error);
		Events.remove('popup', this.popup);
		Events.remove('success', this.popup);
		Events.remove('warning', this.warning);
	}

	error(msg) {
		this.popup(msg, 'error');
	}

	popup(text, type='success') {

		// Add the popup
		this.props.enqueueSnackbar(text, {variant: type});
	}

	render() {
		return <div />
	}

	warning(msg) {
		this.popup(msg, 'warning');
	}
}

let TotalIdiots = withSnackbar(LibraryWritersAreOftenIdiots);

// Site
class Site extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Init the hash module
		Hash.init();

		// Initialise the state
		this.state = {
			"user": false
		};

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
				<TotalIdiots />
				<BrowserRouter>
					<div className="site">
						{this.state.user === false &&
							<Signin />
						}
						<Header user={this.state.user} />
						<Container id="content">
							<Switch>
							</Switch>
						</Container>
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
