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
import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Sound from 'react-sound';

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
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import DateRangeIcon from '@material-ui/icons/DateRange';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import MenuIcon from '@material-ui/icons/Menu';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import SearchIcon from '@material-ui/icons/Search';
import TodayIcon from '@material-ui/icons/Today';

// Dialogs components
import Account from 'components/dialogs/Account';

// Site components
import Loader from 'components/Loader';

// Header components
import Customer from './Customer'
import View from './View'

// Data modules
import Claimed from 'data/claimed';
import Reminders from 'data/reminders';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';
import TwoWay from 'shared/communication/twoway';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared hook modules
import { useEvent } from 'shared/hooks/event';

// Shared generic modules
import Events from 'shared/generic/events';
import PageVisibility from 'shared/generic/pageVisibility';
import { afindi, clone, empty, safeLocalStorageJSON } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

/**
 * Header
 *
 * Handles the header for the site
 *
 * @name Header
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Header(props) {

	// State
	let [account, accountSet] = useState(false);
	let [claimed, claimedSet] = useState([]);
	let [claimedOpen, claimedOpenSet] = useState(true);
	let [menu, menuSet] = useState(false);
	let [newMsgs, newMsgsSet] = useState(safeLocalStorageJSON('newMsgs', {}));
	let [oneUp, oneUpSet] = useState(false);
	let [pending, pendingSet] = useState(0);
	let [reminders, remindersSet] = useState(0);
	let [rights, rightsSet] = useState({
		overwrite: false,
		providerTransfer: false
	});
	let [ticketStats, ticketStatsSet] = useState({});
	let [timeouts, timeoutsSet] = useState({
		messages: 0,
		unclaimed: 0
	});
	let [unclaimed, unclaimedSet] = useState(0);
	let [userId, userIdSet] = useState(0);
	let [viewed, viewedSet] = useState([]);
	let [viewedOpen, viewedOpenSet] = useState(true);

	// Hooks
	let history = useHistory();
	let location = useLocation();

	// Load effect
	useEffect(() => {

		// Track page visibility
		PageVisibility.add(visibilityChange);

		// Track reminders
		Reminders.subscribe(remindersSet);

		// Check for a direct view
		let lPath = Utils.parsePath(location.pathname);
		if(lPath[0] === 'view' && !viewed.length) {
			viewedAdd(lPath[1], '');
		}

		// Watch ticket resolved stats
		Tickets.watchStats(ticketStatsSet);

		// Watch for tickets being resolved
		Tickets.watchResolve(resolvedCallback);

		// Stop tracking/unsubscribing
		return () => {
			PageVisibility.remove(visibilityChange);
			Reminders.unsubscribe(remindersSet);

			// If we have any timers
			if(timeouts.messages) {
				clearInterval(timeouts.messages);
			}
			if(timeouts.unclaimed) {
				clearInterval(timeouts.unclaimed);
			}

			// Stop watching ticket resolved stats
			Tickets.watchStats(ticketStatsSet, true);

			// Stop watching resolves
			Tickets.watchResolve(resolvedCallback, true);
		}
	// eslint-disable-next-line
	}, []);

	// User effect
	useEffect(() => {

		// If we have a user
		if(props.user) {

			// Set the rights
			rightsSet({
				overwrite: Rights.has('csr_overwrite', 'create'),
				providerTransfer: Rights.has('csr_claims_provider', 'create')
			});

			// Track user websocket messages
			TwoWay.track('monolith', 'user-' + props.user.id, wsMessage);
			userIdSet(props.user.id);

			// Fetch the claimed conversations
			claimedFetch();

			// Fetch the unclaimed counts
			unclaimedCount();

			// Start checking for new messages
			timeoutsSet({
				messages: setInterval(newMessages, 30000),
				unclaimed: setInterval(unclaimedCount, 300000)
			});
		}

		// Else, we have no user
		else {

			// Stop checking for new messages and unclaimed counts
			if(timeouts.messages) {
				clearInterval(timeouts.messages);
			}
			if(timeouts.unclaimed) {
				clearInterval(timeouts.unclaimed);
			}
			timeoutsSet({
				messages: 0,
				unclaimed: 0
			});

			// Stop tracking user websocket messages
			TwoWay.untrack('monolith', 'user-' + userId, wsMessage);

			// Remove all claims and views
			claimedSet([]);
			viewedSet([]);

			// Remove rights
			rightsSet({
				overwrite: false,
				providerTransfer: false
			});
		}
	// eslint-disable-next-line
	}, [props.user]);

	// Event tracking
	useEvent('claimedAdd', claimedAdd);
	useEvent('claimedRemove', claimedRemove);
	useEvent('viewedAdd', viewedAdd);
	useEvent('viewedDuplicate', viewedDuplicate);
	useEvent('viewedRemove', viewedRemove);

	// Called when a new claim is added somewhere in the app
	function claimedAdd(ticket, number, name, customer_id, order_id=null, continuous=null, provider=null) {

		// Clone the claimed state
		let lClaimed = clone(claimed);

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

		// Set the new claimed
		claimedSet(lClaimed);

		// Does the new claim exist in the viewed?
		let iIndex = afindi(viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone the viewed state
			let lViewed = clone(viewed);

			// Remove the element
			lViewed.splice(iIndex, 1);

			// Update the viewed
			viewedSet(lViewed);
		}

		// Push the history
		history.push(
			Utils.customerPath(number, customer_id)
		);
	}

	// Called to fetch all existing claims by the user
	function claimedFetch() {

		Claimed.fetch().then(data => {

			// Init new state
			claimedSet(data);

			// If we're on a customer
			let lPath = Utils.parsePath(location.pathname);
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

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Called when an existing claim is removed somewhere in the app
	function claimedRemove(number) {

		// Find the index of the remove customer
		let iClaimed = afindi(claimed, 'customerPhone', number);

		// If we found one
		if(iClaimed > -1) {

			// Clone the state, remove, and update
			let lClaimed = clone(claimed);
			let oClaim = claimed[iClaimed];
			lClaimed.splice(iClaimed, 1);
			claimedSet(lClaimed);

			// If it's in the new messages
			if(number in newMsgs) {
				let dNewMsgs = clone(newMsgs);
				delete dNewMsgs[number];
				localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs))
				newMsgsSet(dNewMsgs);
			}

			// Trigger the event that a customer was unclaimed
			if(oClaim.provider !== null) {
				Events.trigger('Pending', oClaim.customerId);
			} else {
				Events.trigger('Unclaimed', number);
			}
		}
	}

	// Called when any menu item is clicked
	function menuClick(ev) {
		menuItem(
			ev.currentTarget.pathname,
			ev.currentTarget.dataset.number
		);
	}

	// Called when a customer or view is clicked
	function menuItem(pathname, number) {

		// If we're in mobile and the menu is open, hide it
		if(props.mobile && menu) {
			menuSet(false);
		}

		// If we clicked on a claimed phone number
		if(pathname.indexOf('customer/'+number+'/') > -1) {

			// Do we have a new messages flag for this number?
			if(number in newMsgs) {

				// Clone the new messages
				let dNewMsgs = clone(newMsgs);

				// Remove the corresponding key
				delete dNewMsgs[number];

				// Update the state
				newMsgsSet(dNewMsgs);

				// Store the new messages in local storage
				localStorage.setItem('newMsgs', JSON.stringify(dNewMsgs))
			}

			// Look for it in claimed
			let iIndex = afindi(claimed, 'customerPhone', number);

			// If we have it, and it's a transfer
			if(iIndex > -1 && !claimed[iIndex].viewed) {

				// Clone, set the viewed flag, and update
				let lClaimed = clone(claimed);
				lClaimed[iIndex].viewed = 1;
				claimedSet(lClaimed);

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
	}

	// Called to fetch new messages
	function newMessages() {

		// Generate the list of numbers
		let lNumbers = [].concat(
			claimed.map(o => o.customerPhone),
			viewed.map(o => o.customerPhone)
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
					let dNewMsgs = clone(newMsgs);

					// Go through each one sent
					for(let sNumber in res.data) {

						// If we're on the customer's page
						if(location.pathname.indexOf('/'+sNumber+'/') > -1) {
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
						newMsgsSet(dNewMsgs);
					}

					// Notify
					Events.trigger('info', 'New messages!');
				}
			}
		});
	}

	// Update one up on resolved
	function resolvedCallback() {
		oneUpSet(true);
	}

	// Called to sign out of the app
	function signout(ev) {

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

	// Gets the number of unclaimed messages
	function unclaimedCount() {

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
				unclaimedSet(res.data);
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
				pendingSet(res.data);
			}
		});
	}

	// A viewed conversation was added
	function viewedAdd(number, name, customer) {

		// Does it already exist in the claimed?
		let iClaimed = afindi(claimed, 'customerPhone', number);

		// If it does
		if(iClaimed > -1) {

			// Push the history
			history.push(
				Utils.customerPath(number, claimed[iClaimed].customerId)
			);
		}

		// Else, add it to the viewed
		else {

			// Find the index of the customer
			let iViewed = afindi(viewed, 'customerPhone', number);

			// If we found one
			if(iViewed > -1) {

				// Push the history
				history.push(
					Utils.viewedPath(number, viewed[iViewed].customerId)
				);
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
						let lView = clone(viewed);

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

						// Set the new state
						viewedSet(lView);

						// Push the history
						history.push(
							Utils.viewedPath(number, res.data.customerId)
						);
					}
				});
			}
		}
	}

	// A viewed conversation matches a claimed conversation
	function viewedDuplicate(number, user_id) {

		// Find the index of the viewed
		let iIndex = afindi(viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone, set the user, and update
			let lView = clone(viewed);
			lView[iIndex].claimedUser = user_id;
			viewedSet(lView);
		}
	}

	// A viewed conversation was removed
	function viewedRemove(number) {

		// Find the index of the remove viewed
		let iIndex = afindi(viewed, 'customerPhone', number);

		// If we found one
		if(iIndex > -1) {

			// Clone, remove the view, and update
			let lView = clone(viewed);
			lView.splice(iIndex, 1);
			viewedSet(lView);
		}
	}

	// Current tab changed state from hidden/visible
	function visibilityChange(property, state) {

		// If we've become visible
		if(state === 'visible') {

			// If we have a user
			if(props.user) {

				// Update
				newMessages();
				unclaimedCount();

				// Start checking for new messages
				timeoutsSet({
					messages: setInterval(newMessages, 30000),
					unclaimed: setInterval(unclaimedCount, 300000)
				});
			}
		}

		// Else if we're hidden
		else if(state === 'hidden') {

			// Stop checking for new messages and unclaimed counts
			if(timeouts.messages) {
				clearInterval(timeouts.messages);
			}
			if(timeouts.unclaimed) {
				clearInterval(timeouts.unclaimed);
			}
			timeoutsSet({
				messages: 0,
				unclaimed: 0
			});
		}
	}

	// WebSocket message
	function wsMessage(data) {

		// Move forward based on the type
		switch(data.type) {

			// If a claim was removed
			case 'claim_removed': {

				// Look for the claim
				let iIndex = afindi(claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone, remove the claim, and update
					let lClaimed = clone(claimed);
					lClaimed.splice(iIndex, 1);
					claimedSet(lClaimed);

					// If we're on a customer
					let lPath = Utils.parsePath(location.pathname);
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
						let lClaimed = clone(claimed);

						// If there's no actual data
						if(res.data === 0) {
							res.data = {
								customerId: 0,
								customerName: 'N/A',
								claimedUser: props.user.id
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
						claimedSet(lClaimed);

						// Notify the agent
						Events.trigger('info', 'A conversation claim has been transferred to you');
					}
				})
				break;
			}

			// If a claim we already has got new data
			case 'claim_updated': {

				// Look for the claim
				let iIndex = afindi(claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone, set the claim, and update
					let lClaimed = clone(claimed);
					lClaimed[iIndex] = data.claim;
					claimedSet(lClaimed);

					// Notify the agent
					Events.trigger('info', 'A conversation claim has been updated with new info, please check notes');
				}
				break;
			}

			// If a claim had it's number swapped
			case 'claim_swapped': {

				// Look for the claim
				let iIndex = afindi(claimed, 'customerPhone', data.phoneNumber);

				// If we found one
				if(iIndex > -1) {

					// Clone, change the number, and update
					let lClaimed = clone(claimed);
					lClaimed[iIndex]['customerPhone'] = data['newNumber'];
					claimedSet(lClaimed);

					// If we're on a customer
					let lPath = Utils.parsePath(location.pathname);
					if(lPath[0] === 'customer') {

						// If it's the one swapped
						if(lPath[1] === data.phoneNumber) {

							// Change the page we're on
							history.replace(
								Utils.customerPath(data.newNumber, lPath[2])
							);
						}
					}
				}
				break;
			}

			// Unknown type
			default:
				console.error('Unknown websocket message:', data);
				break;
		}
	}

	// Create the drawer items
	let drawer = (
		<React.Fragment>
			<List className="pages">
				{Rights.has('csr_stats', 'read') &&
					<React.Fragment>
						<Link to="/stats" onClick={menuClick}>
							<ListItem button selected={location.pathname === "/stats"}>
								<ListItemIcon><AssessmentIcon /></ListItemIcon>
								<ListItemText primary="Stats" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{Rights.has('csr_templates', 'read') &&
					<React.Fragment>
						<Link to="/templates" onClick={menuClick}>
							<ListItem button selected={location.pathname === "/templates"}>
								<ListItemIcon><CommentIcon /></ListItemIcon>
								<ListItemText primary="Templates" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				{(Rights.has('pharmacy_fill', 'update') ||
					Rights.has('welldyne_adhoc', 'read') ||
					Rights.has('welldyne_outbound', 'read')) &&
					<React.Fragment>
						<Link to="/pharmacy" onClick={menuClick}>
							<ListItem button selected={location.pathname === "/pharmacy"}>
								<ListItemIcon><LocalPharmacyIcon /></ListItemIcon>
								<ListItemText primary="Pharmacy" />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
				}
				<Link to="/reminders" onClick={menuClick}>
					<ListItem button selected={location.pathname === "/reminders"}>
						<ListItemIcon><AddAlertIcon /></ListItemIcon>
						<ListItemText primary={'Reminders (' + reminders + ')'} />
					</ListItem>
				</Link>
				<Divider />
				<Link to="/hrt" onClick={menuClick}>
					<ListItem button selected={location.pathname === "/hrt"}>
						<ListItemIcon><AssessmentIcon /></ListItemIcon>
						<ListItemText primary="HRT Patients" />
					</ListItem>
				</Link>
				<Divider />
				<React.Fragment>
					<Link to="/pending" onClick={menuClick}>
						<ListItem button selected={location.pathname === "/pending"}>
							<ListItemIcon><AllInboxIcon /></ListItemIcon>
							<ListItemText primary={'Pending Orders (' + pending + ')'} />
						</ListItem>
					</Link>
					<Divider />
				</React.Fragment>
				<Link to="/unclaimed" onClick={menuClick}>
					<ListItem button selected={location.pathname === "/unclaimed"}>
						<ListItemIcon><AllInboxIcon /></ListItemIcon>
						<ListItemText primary={'Incoming SMS (' + unclaimed + ')'} />
					</ListItem>
				</Link>
				<Divider />
				<Link to="/search" onClick={menuClick}>
					<ListItem button selected={location.pathname === "/search"}>
						<ListItemIcon><SearchIcon /></ListItemIcon>
						<ListItemText primary="Search" />
					</ListItem>
				</Link>
			</List>
			<List className="claims">
				{claimed.length > 0 &&
					<Box className="type">
						<Divider />
						<ListItem className="menuHeader" onClick={ev => claimedOpenSet(b => !b)}>
							<Typography>Claimed ({claimed.length})</Typography>
							{claimedOpen ?
								<ArrowDropDownIcon />
							:
								<ArrowDropUpIcon />
							}
						</ListItem>
						{claimedOpen &&
							<Box className="items">
								{claimed.map((o,i) =>
									<Customer
										key={i}
										newMsgs={o.customerPhone in newMsgs}
										onClick={menuItem}
										providerTransfer={rights.providerTransfer}
										selected={location.pathname === Utils.customerPath(o.customerPhone, o.customerId)}
										user={props.user}
										{...o}
									/>
								)}
							</Box>
						}
					</Box>
				}
				{viewed.length > 0 &&
					<Box className="type">
						<Divider />
						<ListItem className="menuHeader" onClick={ev => viewedOpenSet(b => !b)}>
							<Typography>Viewing ({viewed.length})</Typography>
							{viewedOpen ?
								<ArrowDropDownIcon />
							:
								<ArrowDropUpIcon />
							}
						</ListItem>
						{viewedOpen &&
							<Box className="items">
								{viewed.map((o,i) =>
									<View
										key={i}
										newMsgs={o.customerPhone in newMsgs}
										onClick={menuItem}
										overwrite={rights.overwrite}
										selected={location.pathname === Utils.viewedPath(o.customerPhone, o.customerId)}
										user={props.user}
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

	// Render
	return (
		<div id="header">
			<div className="bar">
				{props.mobile &&
					<IconButton edge="start" color="inherit" aria-label="menu" onClick={ev => menuSet(b => !b)}>
						<MenuIcon />
					</IconButton>
				}
				<div><Typography className="title">
					<Link to="/" onClick={menuClick}>{props.mobile ? 'ME CS' : 'ME Customer Service'}</Link>
				</Typography></div>
				<div id="loaderWrapper">
					<Loader />
				</div>
				{props.user &&
					<React.Fragment>
						<Box className="ticketStats">
							<Tooltip title="Week"><DateRangeIcon /></Tooltip>
							<span className="current"> {ticketStats.this_week || 0} </span>
							<span className="previous"> {ticketStats.last_week || 0} </span>
						</Box>
						<Box className="ticketStats">
							<Tooltip title="Day"><TodayIcon /></Tooltip>
							<span className="current"> {ticketStats.today || 0} </span>
							<span className="previous"> {ticketStats.yesterday || 0} </span>
						</Box>
						<Link to="/tickets" onClick={menuClick}>
							<Tooltip title="Tickets">
								<IconButton style={{paddingTop: '14px'}}>
									<ConfirmationNumberIcon />
								</IconButton>
							</Tooltip>
						</Link>
						<Tooltip title="Edit User">
							<IconButton onClick={ev => accountSet(b => !b)}>
								<PermIdentityIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title="Sign Out">
							<IconButton onClick={signout}>
								<ExitToAppIcon />
							</IconButton>
						</Tooltip>
					</React.Fragment>
				}
			</div>
			{props.mobile ?
				<Drawer
					anchor="left"
					id="menu"
					open={menu}
					onClose={ev => menuSet(false)}
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
			{account &&
				<Account
					onCancel={ev => accountSet(false)}
					user={props.user}
				/>
			}
			{oneUp &&
				<Sound
					url="/sounds/1Up.mp3"
					playStatus={Sound.status.PLAYING}
					onFinishedPlaying={ev => oneUpSet(false)}
				/>
			}
		</div>
	);
}
