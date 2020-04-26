/**
 * Header
 *
 * Handles app bar and drawer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import React from 'react';
import { Link } from 'react-router-dom';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import MenuIcon from '@material-ui/icons/Menu';
import GroupIcon from '@material-ui/icons/Group';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Loader from '../../loader';
import Utils from '../../utils';

// app
class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			"menu": false,
			"user": props.user || false
		}

		// Bind methods to this instance
		this.menuClose = this.menuClose.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
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

	menuClose() {
		// Close the state of the menu
		this.setState({
			"menu": false
		})
	}

	menuToggle() {
		// Toggle the state of the menu
		this.setState({
			"menu": !this.state.menu
		});
	}

	render() {
		return (
			<div id="header">
				<AppBar position="fixed">
					<Toolbar>
						<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
							<MenuIcon />
						</IconButton>
						<Typography variant="h6" className="title">
							<Link to="/">
								MeCSR
							</Link>
						</Typography>
						{this.state.user &&
							<React.Fragment>
								<Button color="inherit" onClick={this.account}>My Account</Button>
								<Button color="inherit" onClick={this.signout}>Sign Out</Button>
							</React.Fragment>
						}
					</Toolbar>
				</AppBar>
				<Drawer
					anchor="left"
					open={this.state.menu}
					onClose={this.menuToggle}
				>
					<List>
						<Link to="/users" onClick={this.menuClose}>
							<ListItem button key="Users">
								<ListItemIcon><GroupIcon /></ListItemIcon>
								<ListItemText primary="Users" />
							</ListItem>
						</Link>
					</List>
				</Drawer>
			</div>
		);
	}

	signedIn(user) {

		// Hide any modals and set the user
		this.setState({
			"user": user,
		});
	}

	signout(ev) {

		// Show loader
		Loader.show();

		// Call the signout
		Rest.create('auth', 'signout', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.serviceError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Reset the session
				Rest.session(null);

				// Trigger the signedOut event
				Events.trigger('signedOut');
			}
		}).always(() => {
			// Hide loader
			Loader.hide();
		});
	}

	signedOut() {

		// Hide and modals and set the user to false
		this.setState({
			"user": false
		});
	}
}

export default Header;
