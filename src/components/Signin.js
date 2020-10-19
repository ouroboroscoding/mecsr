/**
 * Signin
 *
 * Handles sign in modal
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../generic/events';
import Hash from '../generic/hash';
import Rest from '../generic/rest';

// Local modules
import Utils from '../utils';

// Sign In
class Signin extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Check for a forgot key
		var key = Hash.get('forgot');

		// Initialise the state
		this.state = {
			"errors": {},
			"forgot": key ? key : false,
			"form": key ? 'forgot' : 'signin'
		};

		// Init refs
		this.fields = {};

		// Bind methods to this instance
		this.keyPressed = this.keyPressed.bind(this);
		this.signin = this.signin.bind(this);
	}

	fetchUser() {

		// Fetch the user data
		Rest.read('monolith', 'user', {}).done(res => {

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

				// Welcome user
				Events.trigger('success', 'Welcome ' + res.data.firstName);

				// Trigger the signedIn event
				Events.trigger('signedIn', res.data);
			}
		});
	}

	keyPressed(event) {
		if(event.key === 'Enter') {
			this.signin();
		}
	}

	render() {
		return (
			<Dialog
				disableBackdropClick
				disableEscapeKeyDown
				maxWidth="lg"
				open={true}
				aria-labelledby="confirmation-dialog-title"
			>
				<DialogTitle id="confirmation-dialog-title">Sign In</DialogTitle>
				{this.state.form === 'signin' &&
					<React.Fragment>
						<DialogContent dividers>
							<div><TextField
								error={this.state.errors.userName ? true : false}
								helperText={this.state.errors.userName || ''}
								inputRef={el => this.fields.userName = el}
								label="User"
								onKeyPress={this.keyPressed}
								type="text"
							/></div>
							<div><TextField
								error={this.state.errors.passwd ? true : false}
								helperText={this.state.errors.passwd || ''}
								inputRef={el => this.fields.passwd = el}
								label="Password"
								onKeyPress={this.keyPressed}
								type="password"
							/></div>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="primary" onClick={this.signin}>
								Sign In
							</Button>
						</DialogActions>
					</React.Fragment>
				}
				{this.state.form === 'forgot' &&
					<p>Forgot</p>
				}
			</Dialog>
		);
	}

	signin() {

		// Call the signin
		Rest.create('csr', 'signin', {
			"userName": this.fields.userName.value,
			"passwd": this.fields.passwd.value
		}, false).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				switch(res.error.code) {
					case 1001:
						// Go through each message and mark the error
						let errors = {};
						for(let i in res.error.msg) {
							errors[i] = res.error.msg[i];
						}
						this.setState({"errors": errors});
						break;
					case 1201:
						Events.trigger('error', 'User or password invalid');
						break;
					case 1503:
						Events.trigger('error', 'User marked as inactive');
						break;
					default:
						Events.trigger('error', JSON.stringify(res.error));
						break;
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the session with the service
				Rest.session(res.data.session);

				// Fetch the user info
				this.fetchUser();
			}

		});
	}
}

export default Signin;
