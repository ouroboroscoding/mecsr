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
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddAlertIcon from '@material-ui/icons/AddAlert';
import AllInboxIcon from '@material-ui/icons/AllInbox';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CommentIcon from '@material-ui/icons/Comment';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import MenuIcon from '@material-ui/icons/Menu';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import SearchIcon from '@material-ui/icons/Search';

// Dialogs components
import Account from 'components/dialogs/Account';

// Site components
import Loader from 'components/Loader';

// Header components
import Customer from './Customer'
import View from './View'

// Data modules
import claimed from 'data/claimed';
import reminders from 'data/reminders';

// Shared communications modules
import Rest from 'shared/communication/rest';
import TwoWay from 'shared/communication/twoway';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import PageVisibility from 'shared/generic/pageVisibility';
import { afindi, clone, empty, safeLocalStorageJSON } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Header component
export default class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			account: false,
			claimed: [],
			claimed_open: true,
			menu: false,
			newMsgs: safeLocalStorageJSON('newMsgs', {}),
			overwrite: props.user ? Utils.hasRight(props.user, 'csr_overwrite', 'create') : false,
			pending: 0,
			providerTransfer: props.user ? Utils.hasRight(props.user, 'csr_claims_provider', 'create') : false,
			reminders: 0,
			unclaimed: 0,
			user: props.user || false,
			viewed: [],
			viewed_open: true
		}

		// Timers
		this.iUpdates = null;
		this.iUnclaimed = null;

		// Bind methods to this instance
		this.accountToggle = this.accountToggle.bind(this);
		this.claimedAdd = this.claimedAdd.bind(this);
		this.claimedRemove = this.claimedRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuClick = this.menuClick.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.newMessages = this.newMessages.bind(this);
		this.reminderCount = this.reminderCount.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
		this.unclaimedCount = this.unclaimedCount.bind(this);
		this.viewedAdd = this.viewedAdd.bind(this);
		this.viewedDuplicate = this.viewedDuplicate.bind(this);
		this.viewedRemove = this.viewedRemove.bind(this);
		this.visibilityChange = this.visibilityChange.bind(this);
		this.wsMessage = this.wsMessage.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('claimedAdd', this.claimedAdd);
		Events.add('claimedRemove', this.claimedRemove);
		Events.add('viewedAdd', this.viewedAdd);
		Events.add('viewedDuplicate', this.viewedDuplicate);
		Events.add('viewedRemove', this.viewedRemove);

		// Track document visibility
		PageVisibility.add(this.visibilityChange);

		// Track reminder count
		reminders.subscribe(this.reminderCount);

		// Check for a direct view
		let lPath = Utils.parsePath(this.props.history.location.pathname);
		if(lPath[0] === 'view' && !this.state.viewed.length) {
			this.viewedAdd(lPath[1], '');
		}
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('claimedAdd', this.claimedAdd);
		Events.remove('claimedRemove', this.claimedRemove);
		Events.remove('viewedAdd', this.viewedAdd);
		Events.remove('viewedDuplicate', this.viewedDuplicate);
		Events.remove('viewedRemove', this.viewedRemove);

		// Stop tracking document visibility
		PageVisibility.remove(this.visibilityChange);

		// Stop tracking reminder count
		reminders.unsubscribe(this.reminderCount);

		// Stop checking for new messages and unclaimed counts
		if(this.iUpdates) {
			clearInterval(this.iUpdates);
			this.iUpdates = null;
		}
		if(this.iUnclaimed) {
			clearInterval(this.iUnclaimed);
			this.iUnclaimed = null;
		}
	}

	accountToggle() {
		this.setState({"account": !this.state.account});
	}

	claimedAdd(ticket, number, name, customer_id, order_id=null, continuous=null, provider=null) {

		// Clone the claimed state
		let lClaimed = clone(this.state.claimed);

		// Add the record to the end
		lClaimed.push({
			ticket: ticket,
			customerId: customer_id,
			customerName: name,
			customerPhone: number,
			orderId: order_id,
			continuous: continuous,
			provider: provider,
			viewed: 1
		});

		// Generate the path
		let sPath = Utils.customerPath(number, customer_id);

		// Create the new state
		let oState = {claimed: lClaimed}

		// Does the new claim exist in the viewed?
		let iIndex = afindi(this.state.viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone the viewed state
			let lViewed = clone(this.state.viewed);

			// Remove the element
			lViewed.splice(iIndex, 1);

			// Add it to the state
			oState.viewed = lViewed;
		}

		// Set the new state
		this.setState(oState);

		// Push the history
		this.props.history.push(sPath);
	}

	claimedFetch() {

		claimed.fetch().then(data => {

			// Init new state
			let oState = {claimed: data};

			// If we're on a customer
			let lPath = Utils.parsePath(this.props.history.location.pathname);
			if(lPath[0] === 'customer') {

				// Look for the index of the claim
				let i = afindi(data, 'customerPhone', lPath[1]);

				// If we can't find the customer we're on
				if(i === -1) {

					// Switch to view
					Events.trigger('viewedAdd', lPath[1], lPath[2]);
					Events.trigger('error', 'This customer is not claimed, switching to view only.');
				}

				// Else, set the ticket
				else {
					Tickets.current(data[i].ticket);
				}
			}

			// Set the new path
			this.setState(oState);

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	claimedRemove(number) {

		// Find the index of the remove customer
		let iClaimed = afindi(this.state.claimed, 'customerPhone', number);

		// If we found one
		if(iClaimed > -1) {

			// Clone the claimed state
			let lClaimed = clone(this.state.claimed);

			// Store the claim
			let oClaim = this.state.claimed[iClaimed];

			// Remove the element
			lClaimed.splice(iClaimed, 1);

			// Create new instance of state
			let oState = {claimed: lClaimed}

			// If it's in the new messages
			if(number in this.state.newMsgs) {
				let dNewMsgs = clone(this.state.newMsgs);
				delete dNewMsgs[number];
				localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs))
				oState.newMsgs = dNewMsgs;
			}

			// Set the new state
			this.setState(oState);

			// Trigger the event that a customer was unclaimed
			if(oClaim.provider !== null) {
				Events.trigger('Pending', oClaim.customerId);
			} else {
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
		let state = {};

		// If we're in mobile, hide the menu
		if(this.props.mobile) {
			state.menu = false;
		}

		// If we clicked on a claimed phone number
		if(pathname.indexOf('customer/'+number+'/') > -1) {

			// Do we have a new messages flag for this number?
			if(number in this.state.newMsgs) {

				// Clone the new messages
				let dNewMsgs = clone(this.state.newMsgs);

				// Remove the corresponding key
				delete dNewMsgs[number];

				// Update the state
				state.newMsgs = dNewMsgs;

				// Store the new messages in local storage
				localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs))
			}

			// Look for it in claimed
			let iIndex = afindi(this.state.claimed, 'customerPhone', number);

			// If we have it, and it's a transfer
			if(iIndex > -1 && !this.state.claimed[iIndex].viewed) {

				// Clone the claims
				let lClaimed = clone(this.state.claimed);

				// Set the viewed flag
				lClaimed[iIndex].viewed = 1;

				// Update the state
				state.claimed = lClaimed;

				// Tell the server
				Rest.update('monolith', 'customer/claim/view', {
					phoneNumber: number
				}).done(res => {
					// If there's an error or warning
					if(res.error && !res._handled) {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}
				});
			}
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

		// Generate the list of numbers
		let lNumbers = [].concat(
			this.state.claimed.map(o => o.customerPhone),
			this.state.viewed.map(o => o.customerPhone)
		);

		// If there's none
		if(lNumbers.length === 0) {
			return;
		}

		// Send the removal to the server
		Rest.read('monolith', 'msgs/claimed/new', {
			numbers: lNumbers
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// If there's any
				if(!empty(res.data)) {

					// Do we set the state?
					let bSetState = false;

					// Clone the current messages
					let dNewMsgs = clone(this.state.newMsgs);

					// Go through each one sent
					for(let sNumber in res.data) {

						// If we're on the customer's page
						if(this.props.history.location.pathname.indexOf('/'+sNumber+'/') > -1) {
							Events.trigger('newMessage');
						}

						// Else, if we don't already have this in newMsgs
						else if(!(sNumber in dNewMsgs)) {
							bSetState = true;
							dNewMsgs[sNumber] = true;
						}
					}

					// If something changed
					if(bSetState) {

						// Store the new messages
						localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs));

						// Set the new state
						this.setState({newMsgs: dNewMsgs});
					}

					// Notify
					Events.trigger('info', 'New messages!');
				}
			}
		});
	}

	reminderCount(count) {
		this.setState({reminders: count});
	}

	render() {

		// Create the drawer items
		let drawer = (
			<React.Fragment>
				<List className="pages">
					{Utils.hasRight(this.state.user, 'csr_stats', 'read') &&
						<React.Fragment>
							<Link to="/stats" onClick={this.menuClick}>
								<ListItem button selected={this.props.history.location.pathname === "/stats"}>
									<ListItemIcon><AssessmentIcon /></ListItemIcon>
									<ListItemText primary="Stats" />
								</ListItem>
							</Link>
							<Divider />
						</React.Fragment>
					}
					{Utils.hasRight(this.state.user, 'csr_templates', 'read') &&
						<React.Fragment>
							<Link to="/templates" onClick={this.menuClick}>
								<ListItem button selected={this.props.history.location.pathname === "/templates"}>
									<ListItemIcon><CommentIcon /></ListItemIcon>
									<ListItemText primary="Templates" />
								</ListItem>
							</Link>
							<Divider />
						</React.Fragment>
					}
					{(Utils.hasRight(this.state.user, 'pharmacy_fill', 'update') ||
						Utils.hasRight(this.state.user, 'welldyne_adhoc', 'read') ||
						Utils.hasRight(this.state.user, 'welldyne_outbound', 'read')) &&
						<React.Fragment>
							<Link to="/pharmacy" onClick={this.menuClick}>
								<ListItem button selected={this.props.history.location.pathname === "/pharmacy"}>
									<ListItemIcon><LocalPharmacyIcon /></ListItemIcon>
									<ListItemText primary="Pharmacy" />
								</ListItem>
							</Link>
							<Divider />
						</React.Fragment>
					}
					<Link to="/reminders" onClick={this.menuClick}>
						<ListItem button selected={this.props.history.location.pathname === "/reminders"}>
							<ListItemIcon><AddAlertIcon /></ListItemIcon>
							<ListItemText primary={'Reminders (' + this.state.reminders + ')'} />
						</ListItem>
					</Link>
					<Divider />
					<Link to="/hrt" onClick={this.menuClick}>
						<ListItem button selected={this.props.history.location.pathname === "/hrt"}>
							<ListItemIcon><AssessmentIcon /></ListItemIcon>
							<ListItemText primary="HRT Patients" />
						</ListItem>
					</Link>
					<Divider />
					<React.Fragment>
						<Link to="/pending" onClick={this.menuClick}>
							<ListItem button selected={this.props.history.location.pathname === "/pending"}>
								<ListItemIcon><AllInboxIcon /></ListItemIcon>
								<ListItemText primary={'Pending Orders (' + this.state.pending + ')'} />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
					<Link to="/unclaimed" onClick={this.menuClick}>
						<ListItem button selected={this.props.history.location.pathname === "/unclaimed"}>
							<ListItemIcon><AllInboxIcon /></ListItemIcon>
							<ListItemText primary={'Incoming SMS (' + this.state.unclaimed + ')'} />
						</ListItem>
					</Link>
					<Divider />
					<Link to="/search" onClick={this.menuClick}>
						<ListItem button selected={this.props.history.location.pathname === "/search"}>
							<ListItemIcon><SearchIcon /></ListItemIcon>
							<ListItemText primary="Search" />
						</ListItem>
					</Link>
				</List>
				<List className="claims">
					{this.state.claimed.length > 0 &&
						<Box className="type">
							<Divider />
							<ListItem className="menuHeader" onClick={() => this.toggleClaims('claimed')}>
								<Typography>Claimed ({this.state.claimed.length})</Typography>
								{this.state.claimed_open ?
									<ArrowDropDownIcon />
								:
									<ArrowDropUpIcon />
								}
							</ListItem>
							{this.state.claimed_open &&
								<Box className="items">
									{this.state.claimed.map((o,i) =>
										<Customer
											key={i}
											newMsgs={o.customerPhone in this.state.newMsgs}
											onClick={this.menuItem}
											providerTransfer={this.state.providerTransfer}
											selected={this.props.history.location.pathname === Utils.customerPath(o.customerPhone, o.customerId)}
											user={this.state.user}
											{...o}
										/>
									)}
								</Box>
							}
						</Box>
					}
					{this.state.viewed.length > 0 &&
						<Box className="type">
							<Divider />
							<ListItem className="menuHeader" onClick={() => this.toggleClaims('viewed')}>
								<Typography>Viewing ({this.state.viewed.length})</Typography>
								{this.state.viewed_open ?
									<ArrowDropDownIcon />
								:
									<ArrowDropUpIcon />
								}
							</ListItem>
							{this.state.viewed_open &&
								<Box className="items">
									{this.state.viewed.map((o,i) =>
										<View
											key={i}
											newMsgs={o.customerPhone in this.state.newMsgs}
											onClick={this.menuItem}
											overwrite={this.state.overwrite}
											selected={this.props.history.location.pathname === Utils.viewedPath(o.customerPhone, o.customerId)}
											user={this.state.user}
											{...o}
										/>
									)}
								</Box>
							}
						</Box>
					}
				</List>
			</React.Fragment>
		);

		return (
			<div id="header">
				<div className="bar">
					{this.props.mobile &&
						<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
							<MenuIcon />
						</IconButton>
					}
					<div><Typography className="title">
						<Link to="/" onClick={this.menuClick}>{this.props.mobile ? 'ME CS' : 'ME Customer Service'}</Link>
					</Typography></div>
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
				</div>
				{this.props.mobile ?
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
				{this.state.account &&
					<Account
						onCancel={this.accountToggle}
						user={this.state.user}
					/>
				}
			</div>
		);
	}

	signedIn(user) {

		// Hide any modals and set the user
		this.setState({
			overwrite: Utils.hasRight(user, 'csr_overwrite', 'create'),
			providerTransfer: Utils.hasRight(user, 'csr_claims_provider', 'create'),
			user: user
		}, () => {

			// Track user websocket messages
			TwoWay.track('monolith', 'user-' + user.id, this.wsMessage);

			// Fetch the claimed conversations
			this.claimedFetch();

			// Fetch the unclaimed counts
			this.unclaimedCount();

			// Start checking for new messages
			this.iUpdates = setInterval(this.update.bind(this), 30000);

			// Start checking for unclaimed counts
			this.iUnclaimed = setInterval(this.unclaimedCount.bind(this), 300000);
		});
	}

	signout(ev) {

		// Call the signout
		Rest.create('csr', 'signout', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
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

	// Called when the user signs out
	signedOut() {

		// Stop tracking user websocket messages
		TwoWay.untrack('monolith', 'user-' + this.state.user.id, this.wsMessage);

		// Hide and modals and set the user to false
		this.setState({
			claimed: [],
			overwrite: false,
			providerTransfer: false,
			user: false
		});

		// Stop checking for new messages and unclaimed counts
		if(this.iUpdates) {
			clearInterval(this.iUpdates);
			this.iUpdates = null;
		}
		if(this.iUnclaimed) {
			clearInterval(this.iUnclaimed);
			this.iUnclaimed = null;
		}
	}

	toggleClaims(type) {
		let state = type + '_open';
		this.setState({[state]: !this.state[state]});
	}

	// Gets the number of unclaimed messages
	unclaimedCount() {

		// Fetch the unclaimed conversations count from the service
		Rest.read('monolith', 'msgs/unclaimed/count', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				this.setState({unclaimed: res.data});
			}
		});

		// Fetch the unclaimed pending count from the service
		Rest.read('monolith', 'orders/pending/csr/count', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				this.setState({pending: res.data});
			}
		});
	}

	update() {
		this.newMessages();
	}

	// A viewed conversation was added
	viewedAdd(number, name, customer) {

		// Does it already exist in the claimed?
		let iClaimed = afindi(this.state.claimed, 'customerPhone', number);

		// If it does
		if(iClaimed > -1) {

			// Generate the path
			let sPath = Utils.customerPath(number, this.state.claimed[iClaimed].customerId);

			// Push the history
			this.props.history.push(sPath);
		}

		// Else, add it to the viewed
		else {

			// Find the index of the customer
			let iViewed = afindi(this.state.viewed, 'customerPhone', number);

			// If we found one
			if(iViewed > -1) {

				// Generate the path
				let sPath = Utils.viewedPath(number, this.state.viewed[iViewed].customerId);

				// Push the history
				this.props.history.push(sPath);
			}

			// Else, add it
			else {

				// Send the claim  to the server
				Rest.read('monolith', 'customer/id/byPhone', {
					phoneNumber: number
				}).done(res => {

					// If there's an error or warning
					if(res.error && !res._handled) {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}

					// If there's data
					if('data' in res) {

						// Clone the viewed state
						let lView = clone(this.state.viewed);

						// If we got no data
						if(res.data === 0) {
							res.data = {
								customerId: 0,
								customerName: 'N/A',
								claimedUser: null
							}
						}

						// Add the record to the end
						lView.push({
							customerId: res.data.customerId,
							customerName: res.data.customerName,
							customerPhone: number,
							claimedUser: res.data.claimedUser
						});

						// Generate the path
						let sPath = Utils.viewedPath(number, res.data.customerId);

						// Set the new state
						this.setState({viewed: lView});

						// Push the history
						this.props.history.push(sPath);
					}
				});
			}
		}
	}

	// A viewed conversation matches a claimed conversation
	viewedDuplicate(number, user_id) {

		// Find the index of the viewed
		let iIndex = afindi(this.state.viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone the viewed state
			let lView = clone(this.state.viewed);

			// Update the viewed
			lView[iIndex].claimedUser = user_id;

			// Set the new state
			this.setState({viewed: lView});
		}
	}

	// A viewed conversation was removed
	viewedRemove(number) {

		// Find the index of the remove viewed
		let iIndex = afindi(this.state.viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone the viewed state
			let lView = clone(this.state.viewed);

			// Remove the element
			lView.splice(iIndex, 1);

			// Set the new state
			let oState = {viewed: lView}
			this.setState(oState);
		}
	}

	// Current tab changed state from hidden/visible
	visibilityChange(property, state) {

		// If we've become visible
		if(state === 'visible') {

			// If we have a user
			if(this.state.user) {

				// Update
				this.update();
				this.unclaimedCount();

				// Start checking for new messages
				this.iUpdates = setInterval(this.update.bind(this), 30000);

				// Start checking for unclaimed counts
				this.iUnclaimed = setInterval(this.unclaimedCount.bind(this), 300000);
			}
		}

		// Else if we're hidden
		else if(state === 'hidden') {

			// Stop checking for new messages and unclaimed counts
			if(this.iUpdates) {
				clearInterval(this.iUpdates);
				this.iUpdates = null;
			}
			if(this.iUnclaimed) {
				clearInterval(this.iUnclaimed);
				this.iUnclaimed = null;
			}
		}
	}

	// WebSocket message
	wsMessage(data) {

		// Move forward based on the type
		switch(data.type) {

			// If a claim was removed
			case 'claim_removed': {

				// Look for the claim
				let iIndex = afindi(this.state.claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone the claims
					let lClaimed = clone(this.state.claimed);

					// Delete the claim
					lClaimed.splice(iIndex, 1);

					// Set the new state
					this.setState({
						claimed: lClaimed
					});

					// If we're on a customer
					let lPath = Utils.parsePath(this.props.history.location.pathname);
					if(lPath[0] === 'customer') {

						// If it's the one removed
						if(lPath[1] === data.phoneNumber) {

							// Switch to view
							Events.trigger('viewedAdd', lPath[1], lPath[2]);
							Events.trigger('error', 'This customer is not claimed, switching to view only.');
						}
					}
				}
				break;
			}

			// If someone transferred a claim to us
			case 'claim_transfered': {

				// Get the ID and name from the phone number
				Rest.read('monolith', 'customer/id/byPhone', {
					phoneNumber: data.claim.phoneNumber
				}).done(res => {

					// If there's an error or warning
					if(res.error && !res._handled) {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}

					// If there's data
					if('data' in res) {

						// Clone the claims
						let lClaimed = clone(this.state.claimed);

						// If there's no actual data
						if(res.data === 0) {
							res.data = {
								customerId: 0,
								customerName: 'N/A',
								claimedUser: this.state.user.id
							}
						}

						// Add the number and transferred by to the data
						res.data['ticket'] = data.claim.ticket;
						res.data['customerPhone'] = data.claim.phoneNumber;
						res.data['transferredBy'] = data.claim.transferredBy;
						res.data['transferredByName'] = data.claim.transferredByName;
						res.data['viewed'] = data.claim.viewed;
						res.data['orderId'] = data.claim.orderId;
						res.data['provider'] = data.claim.provider;
						res.data['providerName'] = data.claim.providerName;
						res.data['continuous'] = data.claim.continuous;

						// Push the transfer to the top
						lClaimed.unshift(res.data);

						// Save the state
						this.setState({
							claimed: lClaimed
						});

						// Notify the agent
						Events.trigger('info', 'A conversation claim has been transferred to you');
					}
				})
				break;
			}

			// If a claim we already has got new data
			case 'claim_updated': {

				// Look for the claim
				let iIndex = afindi(this.state.claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone the claims
					let lClaimed = clone(this.state.claimed);

					// Update the claim
					lClaimed[iIndex] = data.claim;

					// Save the state
					this.setState({
						claimed: lClaimed
					});

					// Notify the agent
					Events.trigger('info', 'A conversation claim has been updated with new info, please check notes');
				}
				break;
			}

			// If a claim had it's number swapped
			case 'claim_swapped': {

				// Look for the claim
				let iIndex = afindi(this.state.claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone the claims
					let lClaimed = clone(this.state.claimed);

					// Change the phone number
					lClaimed[iIndex]['customerPhone'] = data['newNumber'];

					// Init the state
					let oState = {
						claimed: lClaimed
					}

					// If we're on a customer
					let lPath = Utils.parsePath(this.props.history.location.pathname);
					if(lPath[0] === 'customer') {

						// If it's the one swapped
						if(lPath[1] === data.phoneNumber) {

							// Change the page we're on
							this.props.history.replace(
								Utils.customerPath(data.newNumber, lPath[2])
							);
						}
					}

					// Set the new state
					this.setState(oState);
				}

				break;
			}

			// Unknown type
			default:
				console.error('Unknown websocket message:', data);
				break;
		}
	}
}
