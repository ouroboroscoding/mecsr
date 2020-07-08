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
import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AllInboxIcon from '@material-ui/icons/AllInbox';
import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from '@material-ui/icons/Check';
import CommentIcon from '@material-ui/icons/Comment';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MenuIcon from '@material-ui/icons/Menu';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import PeopleIcon from '@material-ui/icons/People';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import PhoneIcon from '@material-ui/icons/Phone';
import SearchIcon from '@material-ui/icons/Search';

// Local components
import Account from './Account';
import Escalate from './Escalate';
import Loader from './Loader';
import Resolve from './Resolve';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Customer Item component
function CustomerItem(props) {

	// State
	let [escalate, escalateSet] = useState(false);
	let [resolve, resolveSet] = useState(false);

	// Hooks
	let history = useHistory();

	// Click event
	function click(event) {
		props.onClick(
			Utils.customerPath(props.phone, props.id),
			props.phone
		)
	}

	// X click
	function remove(event) {

		// Stop all propogation of the event
		if(event) {
			event.stopPropagation();
			event.preventDefault();
		}

		// If we resolved
		if(resolve) {
			resolveSet(false);
		}

		// If we're currently selected, change the page
		if(props.selected) {
			history.push('/unclaimed');
		}

		// Trigger the claimed being removed
		Events.trigger('claimedRemove', props.phone);
	}

	function escalateSubmit(agent) {

		// Tell the service to swith the claim
		Rest.update('monolith', 'customer/claim', {
			phoneNumber: props.phone,
			user_id: agent
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

				// Remove escalate dialog
				escalateSet(false);

				// If we're currently selected, change the page
				if(props.selected) {
					history.push('/unclaimed');
				}

				// Trigger the claimed being removed
				Events.trigger('claimedRemove', props.phone, false);
			}
		});
	}

	// Return the component
	return (
		<React.Fragment>
			<Link to={"/customer/" + props.phone + '/' + props.id} onClick={click}>
				<ListItem button selected={props.selected}>
					<ListItemAvatar>
						{props.newMsgs ?
							<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
							<Avatar><PhoneIcon /></Avatar>
						}
					</ListItemAvatar>
					<ListItemText
						primary={props.name}
						secondary={
							<React.Fragment>
								<span>
									ID: {props.id}<br/>
									#: {Utils.nicePhone(props.phone)}
								</span>
								<span className="customerActions">
									<span className="tooltip">
										<Tooltip title="Remove Claim">
											<IconButton className="close" onClick={remove}>
												<CloseIcon />
											</IconButton>
										</Tooltip>
									</span>
									<span className="tooltip">
										<Tooltip title="Escalate">
											<IconButton className="escalate" onClick={e => escalateSet(true)}>
												<MergeTypeIcon />
											</IconButton>
										</Tooltip>
									</span>
									<span className="tooltip">
										<Tooltip title="Resolve">
											<IconButton className="resolve" onClick={e => resolveSet(true)}>
												<CheckIcon />
											</IconButton>
										</Tooltip>
									</span>
								</span>
							</React.Fragment>
						}
					/>
				</ListItem>
			</Link>
			{escalate &&
				<Escalate
					customerId={props.id}
					onClose={e => escalateSet(false)}
					onSubmit={escalateSubmit}
				/>
			}
			{resolve &&
				<Resolve
					customerId={props.id}
					onClose={e => resolveSet(false)}
					onSubmit={remove}
				/>
			}
		</React.Fragment>
	);
}

// Header component
class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			"account": false,
			"claimed": [],
			"mobile": document.documentElement.clientWidth < 600,
			"menu": false,
			"path": window.location.pathname,
			"unclaimed": 0,
			"user": props.user || false
		}

		// Timers
		this.iNewMessages = null;
		this.iUnclaimed = null;

		// Bind methods to this instance
		this.accountToggle = this.accountToggle.bind(this);
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuClick = this.menuClick.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.resize = this.resize.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
		this.unclaimedCount = this.unclaimedCount.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);
		Events.add('claimedRemove', this.claimedRemove);

		// Capture resizes
		window.addEventListener("resize", this.resize);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);
		Events.remove('claimedRemove', this.claimedRemove);

		// Stop capturing resizes
		window.removeEventListener("resize", this.resize);

		// Stop checking for new messages and unclaimed counts
		if(this.iNewMessages) clearInterval(this.iNewMessages);
		if(this.iUnclaimed) clearInterval(this.iUnclaimed);
	}

	accountToggle() {
		this.setState({"account": !this.state.account});
	}

	claimedAdd(number, name) {

		// Send the claim  to the server
		Rest.create('monolith', 'customer/claim', {
			phoneNumber: number
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {

				// If we got a duplicate
				if(res.error.code === 1101) {
					Events.trigger('error', 'Customer has already been claimed. Refreshing list.');
					Events.trigger('Unclaimed');
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
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
					customerId: res.data.customerId,
					customerName: name,
					customerPhone: number
				});

				// Generate the path
				let sPath = Utils.customerPath(number, res.data.customerId);

				// Set the new state
				this.setState({
					claimed: lClaimed,
					path: sPath
				});

				// Push the history
				this.props.history.push(sPath);
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

	claimedRemove(number, call_delete = true) {

		if(call_delete) {

			// Send the removal to the server
			Rest.delete('monolith', 'customer/claim', {
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

					// Find the index of the remove customer
					let iIndex = Tools.afindi(lClaimed, 'customerPhone', number);

					// If we found one
					if(iIndex > -1) {

						// Remove the element
						lClaimed.splice(iIndex, 1);

						// Set the new state
						this.setState({
							claimed: lClaimed
						});

						// Trigger the event that a customer was unclaimed
						Events.trigger('Unclaimed', number);
					}
				}
			});
		} else {

			// Clone the claimed state
			let lClaimed = Tools.clone(this.state.claimed);

			// Find the index of the remove customer
			let iIndex = Tools.afindi(lClaimed, 'customerPhone', number);

			// If we found one
			if(iIndex > -1) {

				// Remove the element
				lClaimed.splice(iIndex, 1);

				// Set the new state
				this.setState({
					claimed: lClaimed
				});

				// Trigger the event that a customer was unclaimed
				Events.trigger('Unclaimed', number);
			}
		}
	}

	menuClose() {
		this.setState({menu: false});
	}

	menuClick(event) {
		this.menuItem(
			event.currentTarget.pathname,
			event.currentTarget.dataset.number
		);
	}

	menuItem(pathname, number) {

		// New state
		let state = {
			path: pathname
		};

		// If we're in mobile, hide the menu
		if(this.state.mobile) {
			state.menu = false;
		}

		// If we clicked on a phone number
		if(number) {

			// Clone the claimed state
			let lClaimed = Tools.clone(this.state.claimed);

			// Find the index of the clear customer
			let iIndex = Tools.afindi(lClaimed, 'customerPhone', number);

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
							if(this.state.path === Utils.customerPath(lClaimed[i].customerPhone, lClaimed[i].customerId)) {
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

		// Create the drawer items
		let drawer = (
			<List style={{padding: 0}}>
				{Utils.hasRight(this.state.user, 'csr_agents', 'read') &&
					<React.Fragment>
						<Link to="/agents" onClick={this.menuClick}>
							<ListItem button selected={this.state.path === "/agents"}>
								<ListItemIcon><PeopleIcon /></ListItemIcon>
								<ListItemText primary="Agents" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{Utils.hasRight(this.state.user, 'csr_templates', 'read') &&
					<React.Fragment>
						<Link to="/templates" onClick={this.menuClick}>
							<ListItem button selected={this.state.path === "/templates"}>
								<ListItemIcon><CommentIcon /></ListItemIcon>
								<ListItemText primary="Templates" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				<Link to="/unclaimed" onClick={this.menuClick}>
					<ListItem button selected={this.state.path === "/unclaimed"}>
						<ListItemIcon><AllInboxIcon /></ListItemIcon>
						<ListItemText primary={'Unclaimed (' + this.state.unclaimed + ')'} />
					</ListItem>
				</Link>
				<Link to="/search" onClick={this.menuClick}>
					<ListItem button selected={this.state.path === "/search"}>
						<ListItemIcon><SearchIcon /></ListItemIcon>
						<ListItemText primary="Search" />
					</ListItem>
				</Link>
				<Divider />
				{this.state.claimed.map((o,i) =>
					<CustomerItem
						key={i}
						id={o.customerId}
						name={o.customerName}
						newMsgs={o.newMsgs}
						onClick={this.menuItem}
						phone={o.customerPhone}
						selected={this.state.path === Utils.customerPath(o.customerPhone, o.customerId)}
					/>
				)}
			</List>
		);

		return (
			<div id="header">
				{this.state.account &&
					<Account
						onCancel={this.accountToggle}
						user={this.state.user}
					/>
				}
				<AppBar position="relative">
					<Toolbar>
						{this.state.mobile &&
							<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
								<MenuIcon />
							</IconButton>
						}
						<Typography variant="h6" className="title">
							<Link to="/" onClick={this.menuClick}>
								ME Customer Service
							</Link>
						</Typography>
						<div id="loaderWrapper">
							<Loader />
						</div>
						{this.state.user &&
							<React.Fragment>
								<Tooltip title="Edit User">
									<IconButton onClick={this.accountToggle}>
										<PermIdentityIcon />
									</IconButton>
								</Tooltip>
								<Tooltip title="Sign Out">
									<IconButton onClick={this.signout}>
										<ExitToAppIcon />
									</IconButton>
								</Tooltip>
							</React.Fragment>
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

			// Fetch the unclaimed count
			this.unclaimedCount();

			// Start checking for new messages
			this.iNewMessages = setInterval(this.newMessages.bind(this), 30000);

			// Start checking for unclaimed counts
			this.iUnclaimed = setInterval(this.unclaimedCount.bind(this), 300000);
		});
	}

	signout(ev) {

		// Call the signout
		Rest.create('auth', 'signout', {}).done(res => {

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

		// Stop checking for new messages and unclaimed counts
		if(this.iNewMessages) clearInterval(this.iNewMessages);
		if(this.iUnclaimed) clearInterval(this.iUnclaimed);
	}

	unclaimedCount() {

		// Fetch the unclaimed count from the service
		Rest.read('monolith', 'msgs/unclaimed/count', {}).done(res => {

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
				this.setState({"unclaimed": res.data});
			}
		});
	}

	set path(path) {
		this.setState({
			path: path
		});
	}
}

export default Header;
