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
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AllInboxIcon from '@material-ui/icons/AllInbox';
import CancelIcon from '@material-ui/icons/Cancel';
import MenuIcon from '@material-ui/icons/Menu';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import PhoneIcon from '@material-ui/icons/Phone';
import SearchIcon from '@material-ui/icons/Search';

// Local components
import Loader from './Loader';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Header component
class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			"claimed": [],
			"mobile": document.documentElement.clientWidth < 600,
			"menu": false,
			"path": window.location.pathname,
			"user": props.user || false
		}

		// Bind methods to this instance
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.resize = this.resize.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);

		// Capture resizes
		window.addEventListener("resize", this.resize);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);

		// Stop capturing resizes
		window.removeEventListener("resize", this.resize);

		// Stop checking for new messages
		clearInterval(this.iNewMessages);
	}

	claimedAdd(number, name) {

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
					newMsgs: false,
					customerName: name,
					customerPhone: number
				});

				// Set the new state
				this.setState({
					claimed: lClaimed,
					path: '/customer/' + number
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

				// Add the newMsg flag to each item
				for(let i in res.data) {
					res.data[i].newMsgs = false;
				}

				// Set the state
				this.setState({
					claimed: res.data
				});
			}
		});
	}

	claimedRemove(event) {

		// Stop all propogation of the event
		event.stopPropagation();
		event.preventDefault();

		// Store the number
		let sNumber = event.currentTarget.dataset.number;

		// Send the removal to the server
		Rest.delete('monolith', 'customer/claim', {
			phoneNumber: sNumber
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
				let iIndex = Tools.afindi(lClaimed, 'customerPhone', sNumber);

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

	menuClose() {
		this.setState({menu: false});
	}

	menuItem(event) {

		// New state
		let state = {
			path: event.currentTarget.pathname
		};

		// If we're in mobile, hide the menu
		if(this.state.mobile) {
			state.menu = false;
		}

		// If we clicked on a phone number
		if(event.currentTarget.dataset.number) {

			// Clone the claimed state
			let lClaimed = Tools.clone(this.state.claimed);

			// Find the index of the clear customer
			let iIndex = Tools.afindi(lClaimed, 'customerPhone', event.currentTarget.dataset.number);

			// Reset the flag
			lClaimed[iIndex].newMsgs = false;

			// Updated the claimed state
			state.claimed = lClaimed;
		}

		// Set the new state
		this.setState(state);
	}

	menuToggle() {

		// Toggle the state of the menu
		this.setState({
			menu: !this.state.menu
		});
	}

	newMessages() {

		// Send the removal to the server
		Rest.read('monolith', 'msgs/claimed/new', {
			numbers: this.state.claimed.map(o => o.customerPhone)
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
			if('data' in res) {
				console.log('New Messages: ', res.data);

				// If there's any
				if(!Tools.empty(res.data)) {

					// Do we set the state?
					let bSetState = false;

					// Clone the current claimed
					let lClaimed = Tools.clone(this.state.claimed);

					// Go through each one
					for(let i in lClaimed) {

						// If it's the result
						if(lClaimed[i].customerPhone in res.data) {

							// If this is the number we're on, pass along the
							//	message
							if(this.state.path === '/customer/' + lClaimed[i].customerPhone) {
								Events.trigger('newMessage');
							}

							// Else, mark the menu item as having new messages
							else {
								bSetState = true;
								lClaimed[i].newMsgs = true;
							}
						}
					}

					// If something changed
					if(bSetState) {

						// Set the new state
						this.setState({
							claimed: lClaimed
						});

						// Notify
						Events.trigger('success', 'New messages!');
					}
				}
			}
		});
	}

	render() {

		let drawer = (
			<List style={{padding: 0}}>
				<Link to="/unclaimed" onClick={this.menuItem}>
					<ListItem button selected={this.state.path === "/unclaimed"}>
						<ListItemIcon><AllInboxIcon /></ListItemIcon>
						<ListItemText primary="Unclaimed" />
					</ListItem>
				</Link>
				<Link to="/search" onClick={this.menuItem}>
					<ListItem button selected={this.state.path === "/search"}>
						<ListItemIcon><SearchIcon /></ListItemIcon>
						<ListItemText primary="Search" />
					</ListItem>
				</Link>
				<Divider />
				{this.state.claimed.map(o =>
					<Link key={o.customerPhone} data-number={o.customerPhone} to={"/customer/" + o.customerPhone} onClick={this.menuItem}>
						<ListItem button selected={this.state.path === "/customer/" + o.customerPhone}>
							<ListItemAvatar>
								{o.newMsgs ?
									<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
									<Avatar><PhoneIcon /></Avatar>
								}
							</ListItemAvatar>
							<ListItemText
								primary={o.customerName}
								secondary={o.customerPhone}
							/>
							{(this.state.path !== "/customer/" + o.customerPhone) &&
								<CancelIcon
									className="close"
									data-number={o.customerPhone}
									onClick={this.claimedRemove}
								/>
							}
						</ListItem>
					</Link>
				)}
			</List>
		);

		return (
			<div id="header">
				<AppBar position="relative">
					<Toolbar>
						{this.state.mobile &&
							<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
								<MenuIcon />
							</IconButton>
						}
						<Typography variant="h6" className="title">
							<Link to="/">
								MeCSR
							</Link>
						</Typography>
						<div id="loaderWrapper">
							<Loader />
						</div>
						{this.state.user &&
							<Button color="inherit" onClick={this.signout}>Sign Out</Button>
						}
					</Toolbar>
				</AppBar>
				{this.state.mobile ?
					<Drawer
						anchor="left"
						id="menu"
						open={this.state.menu}
						onClose={this.menuClose}
						variant="temporary"
					>
						{drawer}
					</Drawer>
				:
					<Drawer
						anchor="left"
						id="menu"
						open
						variant="permanent"
					>
						{drawer}
					</Drawer>
				}
			</div>
		);
	}

	resize() {

		// If the size is less than 600px
		if(document.documentElement.clientWidth < 600) {
			this.setState({"mobile": true});
		} else {
			this.setState({"mobile": false});
		}
	}

	signedIn(user) {

		// Hide any modals and set the user
		this.setState({
			"user": user,
		}, () => {

			// Fetch the claimed conversations
			this.claimedFetch();

			// Start checking for new messages
			this.iNewMessages = setInterval(this.newMessages.bind(this), 30000);
		});
	}

	signout(ev) {

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
		});
	}

	signedOut() {

		// Hide and modals and set the user to false
		this.setState({
			"claimed": [],
			"user": false
		});

		// Stop checking for new messages
		clearInterval(this.iNewMessages);
	}

	set path(path) {
		this.setState({
			path: path
		});
	}
}

export default Header;
