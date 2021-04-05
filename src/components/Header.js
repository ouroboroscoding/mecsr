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
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddAlertIcon from '@material-ui/icons/AddAlert';
import AddIcon from '@material-ui/icons/Add';
import AllInboxIcon from '@material-ui/icons/AllInbox';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import AssessmentIcon from '@material-ui/icons/Assessment';
import CancelIcon from '@material-ui/icons/Cancel';
import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from '@material-ui/icons/Check';
import CommentIcon from '@material-ui/icons/Comment';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ForumIcon from '@material-ui/icons/Forum';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import MenuIcon from '@material-ui/icons/Menu';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import SearchIcon from '@material-ui/icons/Search';
import ViewListIcon from '@material-ui/icons/ViewList';

// Composite components
import Account from './composites/Account';
import CancelContinuous from './composites/CancelContinuous';
import Decline from './composites/Decline';
import ProviderReturn from './composites/ProviderReturn';
import ProviderTransfer from './composites/ProviderTransfer';
import { ReminderDialog } from './composites/Reminder';
import Resolve from './composites/Resolve';
import Transfer from './composites/Transfer';
import { CustomListsDialog } from './composites/CustomLists';

// Composite components
import Loader from './Loader';

// Data modules
import claimed from 'data/claimed';
import reminders from 'data/reminders';

// Shared communications modules
import Rest from 'shared/communication/rest';
import TwoWay from 'shared/communication/twoway';

// Shared generic modules
import Events from 'shared/generic/events';
import PageVisibility from 'shared/generic/pageVisibility';
import { afindi, clone, empty, safeLocalStorageJSON } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Customer Item component
function CustomerItem(props) {

	// State
	let [cancel, cancelSet] = useState(false);
	let [decline, declineSet] = useState(false);
	let [list, listSet] = useState(false);
	let [more, moreSet] = useState(null);
	let [providerReturn, providerReturnSet] = useState(false);
	let [providerTransfer, providerTransferSet] = useState(false);
	let [reminder, reminderSet] = useState(false);
	let [resolve, resolveSet] = useState(false);
	let [transfer, transferSet] = useState(false);
	let [transferMore, transferMoreSet] = useState(false);

	// Hooks
	let history = useHistory();

	// Add the claimed customer to a list
	function addToList(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		listSet(true);
		moreSet(null);
	}

	// Add the claimed customer to a reminder
	function addToReminders(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		reminderSet(true);
		moreSet(null);
	}

	// Cancel click
	function cancelClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		cancelSet(true);
	}

	// Cancel submit
	function cancelSubmit(swap) {

		// Hide the dialog
		declineSet(false);

		// Delete the claim
		claimed.remove(props.customerPhone).then(res => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});

		// If we're swapping
		if(swap) {

			// Get the claimed add promise
			claimed.add(props.customerPhone).then(res => {
				Events.trigger('claimedAdd', props.customerPhone, props.customerName, props.customerId);
			}, error => {
				// If we got a duplicate
				if(error.code === 1101) {
					Events.trigger('error', 'Customer has already been claimed.');
				} else {
					Events.trigger('error', Rest.errorMessage(error));
				}
			});
		}

		// Else, switch page
		else {

			// If we're currently selected, change the page
			if(props.selected) {
				history.push(props.provider !== null ? '/pending' : '/unclaimed');
			}
		}
	}

	// Click event
	function click(ev) {
		props.onClick(
			Utils.customerPath(props.customerPhone, props.customerId),
			props.customerPhone
		)
	}

	// Decline click
	function declineClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		declineSet(true);
	}

	// Decline submit
	function declineSubmit() {

		// Hide the dialog
		declineSet(false);

		// Delete the claim
		claimed.remove(props.customerPhone).then(res => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});

		// If we're currently selected, change the page
		if(props.selected) {
			history.push(props.provider !== null ? '/pending' : '/unclaimed');
		}
	}

	// More icon click
	function moreClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		moreSet(ev.currentTarget);
	}

	// More menu close
	function moreClose(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		moreSet(null);
	}

	// Provider click
	function providerClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		providerReturnSet(props.user.id);
	}

	// Transfer to provider
	function providerReturnSubmit() {

		// Hide the dialog
		providerReturnSet(false);

		// Delete the claim
		claimed.remove(props.customerPhone).then(res => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});

		// If we're currently selected, change the page
		if(props.selected) {
			history.push(props.provider !== null ? '/pending' : '/unclaimed');
		}
	}

	// Provider Transfer click
	function providerTransferClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		providerTransferSet(props.user.id);
		transferMoreSet(null);
	}

	// X click
	function remove(ev) {

		// Stop all propogation of the event
		if(ev) {
			ev.stopPropagation();
			ev.preventDefault();
		}

		// If we resolved
		if(resolve) {

			// Hide the dialog
			resolveSet(false);

			// Mark the conversation as hidden on the server side
			Rest.update('monolith', 'customer/hide', {
				customerPhone: props.customerPhone
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

		// If we're currently selected, change the page
		if(props.selected) {
			history.push(props.provider !== null ? '/pending' : '/unclaimed');
		}

		// Send the request to the server
		claimed.remove(props.customerPhone).then(() => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Resolve click
	function resolveClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		resolveSet(true);
	}

	// Transfer click
	function transferClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferSet(props.user.id);
		transferMoreSet(null);
	}

	// Transfer More icon click
	function transferMoreClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferMoreSet(ev.currentTarget);
	}

	// Transfer More menu close
	function trasnferMoreClose(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferMoreSet(null);
	}

	// Transfer dialog submit
	function transferSubmit(agent) {

		// Call the request
		claimed.transfer(props.customerPhone, agent).then(res => {

			// Remove transfer dialog
			transferSet(false);

			// If we're currently selected, change the page
			if(props.selected) {
				history.push(props.provider !== null ? '/pending' : '/unclaimed');
			}

			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);

		}, error => {
			if(error.code === 1104) {
				Events.trigger('error', 'Claim no longer exists, can not transfer.');
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// Render
	return (
		<React.Fragment>
			<Link to={Utils.customerPath(props.customerPhone, props.customerId)} onClick={click}>
				<ListItem button selected={props.selected} className={!props.viewed ? 'transferred' : ''}>
					<ListItemAvatar>
						{props.newMsgs ?
							<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
							<Avatar><ForumIcon /></Avatar>
						}
					</ListItemAvatar>
					<ListItemText
						primary={props.customerName}
						secondary={
							<React.Fragment>
								<span className="customerDetails">
									<p>#: {Utils.nicePhone(props.customerPhone)}</p>
									<p>ID: {props.customerId}</p>
									{props.orderId &&
										<p>Order: {props.orderId}</p>
									}
									{props.provider &&
										<p>Provider: {props.providerName}</p>
									}
									{props.transferredBy &&
										<p>Transferrer: {props.transferredByName}</p>
									}
								</span>
								<span className="customerActions">
									{props.provider !== null ?
										<React.Fragment>
											<span className="tooltip">
												{props.continuous ?
													<Tooltip title="Cancel Recurring">
														<IconButton className="close" onClick={cancelClick}>
															<CancelIcon />
														</IconButton>
													</Tooltip>
												:
													<Tooltip title="Decline Order">
														<IconButton className="close" onClick={declineClick}>
															<CancelIcon />
														</IconButton>
													</Tooltip>
												}
											</span>
											<span className="tooltip">
												<Tooltip title="Transfer">
													<IconButton className="transfer" onClick={transferClick}>
														<MergeTypeIcon />
													</IconButton>
												</Tooltip>
											</span>
											<span className="tooltip">
												<Tooltip title="Send to Provider">
													<IconButton className="provider" onClick={providerClick}>
														<LocalHospitalIcon />
													</IconButton>
												</Tooltip>
											</span>
										</React.Fragment>
									:
										<React.Fragment>
											<span className="tooltip">
												<Tooltip title="Remove Claim">
													<IconButton className="close" onClick={remove}>
														<CloseIcon />
													</IconButton>
												</Tooltip>
											</span>
											{props.providerTransfer ?
												<span className="tooltip">
													<Tooltip title="Transfer">
														<IconButton onClick={transferMoreClick}>
															<MergeTypeIcon />
														</IconButton>
													</Tooltip>
													<Menu
														anchorEl={transferMore}
														open={Boolean(transferMore)}
														onClose={trasnferMoreClose}
													>
														<MenuItem onClick={transferClick}>
															<ListItemIcon>
																<EmojiPeopleIcon />
															</ListItemIcon>
															<ListItemText primary="Transfer to Agent" />
														</MenuItem>
														<MenuItem onClick={providerTransferClick}>
															<ListItemIcon>
																<LocalHospitalIcon />
															</ListItemIcon>
															<ListItemText primary="Transfer to Provider" />
														</MenuItem>
													</Menu>
												</span>
											:
												<span className="tooltip">
													<Tooltip title="Transfer">
														<IconButton className="transfer" onClick={transferClick}>
															<MergeTypeIcon />
														</IconButton>
													</Tooltip>
												</span>
											}
											<Tooltip title="Resolve">
												<IconButton className="resolve" onClick={resolveClick}>
													<CheckIcon />
												</IconButton>
											</Tooltip>
										</React.Fragment>
									}
									<span className="tooltip">
										<Tooltip title="More">
											<IconButton onClick={moreClick}>
												<MoreVertIcon />
											</IconButton>
										</Tooltip>
										<Menu
											anchorEl={more}
											open={Boolean(more)}
											onClose={moreClose}
										>
											<MenuItem onClick={addToList}>
												<ListItemIcon>
													<ViewListIcon />
												</ListItemIcon>
												<ListItemText primary="Add to List" />
											</MenuItem>
											<MenuItem onClick={addToReminders}>
												<ListItemIcon>
													<AddAlertIcon />
												</ListItemIcon>
												<ListItemText primary="Add to Reminders" />
											</MenuItem>
										</Menu>
									</span>
								</span>
							</React.Fragment>
						}
					/>
				</ListItem>
			</Link>
			{transfer !== false &&
				<Transfer
					customerId={props.customerId}
					ignore={transfer}
					name={props.customerName}
					number={props.customerPhone}
					onClose={e => transferSet(false)}
					onSubmit={transferSubmit}
				/>
			}
			{list &&
				<CustomListsDialog
					customer={props.customerId}
					name={props.customerName}
					number={props.customerPhone}
					onClose={() => listSet(false)}
				/>
			}
			{reminder &&
				<ReminderDialog
					customerId={props.customerId.toString()}
					name={props.customerName}
					number={props.customerPhone}
					onClose={e => reminderSet(false)}
				/>
			}
			{resolve &&
				<Resolve
					customerId={props.customerId}
					onClose={e => resolveSet(false)}
					onSubmit={remove}
				/>
			}
			{providerReturn &&
				<ProviderReturn
					onClose={e => providerReturnSet(false)}
					onTransfer={providerReturnSubmit}
					{...props}
				/>
			}
			{providerTransfer &&
				<ProviderTransfer
					onClose={e => providerTransferSet(false)}
					onTransfer={providerReturnSubmit}
					{...props}
				/>
			}
			{cancel &&
				<CancelContinuous
					customerId={props.customerId}
					orderId={props.orderId}
					onClose={e => cancelSet(false)}
					onSubmit={cancelSubmit}
				/>
			}
			{decline &&
				<Decline
					orderId={props.orderId}
					onClose={e => declineSet(false)}
					onSubmit={declineSubmit}
				/>
			}
		</React.Fragment>
	);
}

// View Item component
function ViewItem(props) {

	// State
	let [list, listSet] = useState(false);
	let [more, moreSet] = useState(null);
	let [reminder, reminderSet] = useState(false);
	let [transfer, transferSet] = useState(false);

	// Hooks
	let history = useHistory();

	// Add the claimed customer to a list
	function addToList(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		listSet(true);
		moreSet(null);
	}

	// Add the claimed customer to a reminder
	function addToReminders(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		reminderSet(true);
		moreSet(null);
	}

	// Claim
	function claim(ev) {
		ev.stopPropagation();
		ev.preventDefault();

		// Attempt to claim the conversation
		claimed.add(props.phone).then(res => {
			Events.trigger('claimedAdd', props.phone, props.name, props.id);
			Events.trigger('viewedRemove', props.phone, false);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Customer has already been claimed.');
				Events.trigger('viewedDuplicate', props.phone, error.msg);
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// Click event
	function click(ev) {
		props.onClick(
			Utils.viewedPath(props.phone, props.id),
			props.phone
		)
	}

	// More icon click
	function moreClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		moreSet(ev.currentTarget);
	}

	// More menu close
	function moreClose(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		moreSet(null);
	}

	// X click
	function remove(ev) {

		// Stop all propogation of the event
		if(ev) {
			ev.stopPropagation();
			ev.preventDefault();
		}

		// If we're currently selected, change the page
		if(props.selected) {
			history.push('/unclaimed');
		}

		// Trigger the viewed being removed
		Events.trigger('viewedRemove', props.phone, props.selected);
	}

	// Transfer click
	function transferClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferSet(props.claimed);
	}

	// Transfer dialog submit
	function transferSubmit(agent) {

		// Call the request
		claimed.transfer(props.phone, agent).then(res => {

			// Remove transfer dialog
			transferSet(false);

			// Trigger the claimed being removed
			Events.trigger('viewedRemove', props.phone, false);

			// If we're adding it to ourselves
			if(agent === props.user.id) {
				Events.trigger('claimedAdd', props.phone, props.name, props.id);
			}

			// Else if it's selected
			else if(props.selected) {
				history.push(props.provider !== null ? '/pending' : '/unclaimed');
			}

		}, error => {
			if(error.code === 1104) {
				Events.trigger('error', 'Claim no longer exists, can not transfer.');
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// Render
	return (
		<React.Fragment>
			<Link to={Utils.viewedPath(props.phone, props.id)} onClick={click}>
				<ListItem button selected={props.selected}>
					<ListItemAvatar>
						{props.newMsgs ?
							<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
							<Avatar><ForumIcon /></Avatar>
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
										<Tooltip title="Remove">
											<IconButton className="close" onClick={remove}>
												<CloseIcon />
											</IconButton>
										</Tooltip>
									</span>
									<span className="tooltip">
										{(props.claimed && props.overwrite) &&
											<Tooltip title="Transfer">
												<IconButton className="transfer" onClick={transferClick}>
													<MergeTypeIcon />
												</IconButton>
											</Tooltip>
										}
										{!props.claimed &&
											<Tooltip title="Claim">
												<IconButton className="claim" onClick={claim}>
													<AddIcon />
												</IconButton>
											</Tooltip>
										}
									</span>
									<span className="tooltip">
										<Tooltip title="More">
											<IconButton onClick={moreClick}>
												<MoreVertIcon />
											</IconButton>
										</Tooltip>
										<Menu
											anchorEl={more}
											open={Boolean(more)}
											onClose={moreClose}
										>
											<MenuItem onClick={addToList}>
												<ListItemIcon>
													<ViewListIcon />
												</ListItemIcon>
												<ListItemText primary="Add to List" />
											</MenuItem>
											<MenuItem onClick={addToReminders}>
												<ListItemIcon>
													<AddAlertIcon />
												</ListItemIcon>
												<ListItemText primary="Add to Reminders" />
											</MenuItem>
										</Menu>
									</span>
								</span>
							</React.Fragment>
						}
					/>
				</ListItem>
			</Link>
			{transfer !== false &&
				<Transfer
					customerId={props.id}
					name={props.name}
					number={props.phone}
					onClose={e => transferSet(false)}
					onSubmit={transferSubmit}
				/>
			}
			{list &&
				<CustomListsDialog
					customer={props.id}
					name={props.name}
					number={props.phone}
					onClose={() => listSet(false)}
				/>
			}
			{reminder &&
				<ReminderDialog
					customerId={props.id.toString()}
					name={props.name}
					number={props.phone}
					onClose={e => reminderSet(false)}
				/>
			}

		</React.Fragment>
	);
}

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
			path: window.location.pathname,
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
		let lPath = Utils.parsePath(this.state.path);
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

	claimedAdd(number, name, customer_id, order_id=null, continuous=null, provider=null) {

		// Clone the claimed state
		let lClaimed = clone(this.state.claimed);

		// Add the record to the end
		lClaimed.push({
			customerId: customer_id,
			customerName: name,
			customerPhone: number,
			orderId: order_id,
			continuous: continuous,
			provider: provider,
			viewed: true
		});

		// Generate the path
		let sPath = Utils.customerPath(number, customer_id);

		// Create the new state
		let oState = {
			claimed: lClaimed,
			path: sPath
		}

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
			let lPath = Utils.parsePath(this.state.path);
			if(lPath[0] === 'customer') {

				// If we can't find the customer we're on
				if(afindi(data, 'customerPhone', lPath[1]) === -1) {

					// Switch to view
					Events.trigger('viewedAdd', lPath[1], lPath[2]);
					Events.trigger('error', 'This customer is not claimed, switching to view only.');
				}
			}

			// Set the new path
			this.setState(oState);

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	claimedRemove(number, switch_path) {

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

			// If the path has switch
			if(switch_path) {
				oState.path = oClaim.provider !== null ?
					'/pending' :
					'/unclaimed';
			}

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
		let state = {
			path: pathname
		};

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
				lClaimed[iIndex].viewed = true;

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
						if(this.state.path.indexOf('/'+sNumber+'/') > -1) {
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
								<ListItem button selected={this.state.path === "/stats"}>
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
								<ListItem button selected={this.state.path === "/templates"}>
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
								<ListItem button selected={this.state.path === "/pharmacy"}>
									<ListItemIcon><LocalPharmacyIcon /></ListItemIcon>
									<ListItemText primary="Pharmacy" />
								</ListItem>
							</Link>
							<Divider />
						</React.Fragment>
					}
					<Link to="/reminders" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/reminders"}>
							<ListItemIcon><AddAlertIcon /></ListItemIcon>
							<ListItemText primary={'Reminders (' + this.state.reminders + ')'} />
						</ListItem>
					</Link>
					<Divider />
					<Link to="/hrt" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/hrt"}>
							<ListItemIcon><AssessmentIcon /></ListItemIcon>
							<ListItemText primary="HRT Patients" />
						</ListItem>
					</Link>
					<Divider />
					<React.Fragment>
						<Link to="/pending" onClick={this.menuClick}>
							<ListItem button selected={this.state.path === "/pending"}>
								<ListItemIcon><AllInboxIcon /></ListItemIcon>
								<ListItemText primary={'Pending Orders (' + this.state.pending + ')'} />
							</ListItem>
						</Link>
						<Divider />
					</React.Fragment>
					<Link to="/unclaimed" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/unclaimed"}>
							<ListItemIcon><AllInboxIcon /></ListItemIcon>
							<ListItemText primary={'Incoming SMS (' + this.state.unclaimed + ')'} />
						</ListItem>
					</Link>
					<Divider />
					<Link to="/search" onClick={this.menuClick}>
						<ListItem button selected={this.state.path === "/search"}>
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
										<CustomerItem
											key={i}
											newMsgs={o.customerPhone in this.state.newMsgs}
											onClick={this.menuItem}
											providerTransfer={this.state.providerTransfer}
											selected={this.state.path === Utils.customerPath(o.customerPhone, o.customerId)}
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
										<ViewItem
											claimed={o.claimedUser}
											key={i}
											id={o.customerId}
											name={o.customerName}
											newMsgs={o.customerPhone in this.state.newMsgs}
											onClick={this.menuItem}
											overwrite={this.state.overwrite}
											phone={o.customerPhone}
											selected={this.state.path === Utils.viewedPath(o.customerPhone, o.customerId)}
											user={this.state.user}
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

			// Set the new state
			this.setState({
				path: sPath
			});

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

				// Set the new state
				this.setState({path: sPath});

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
						this.setState({
							viewed: lView,
							path: sPath
						});

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
	viewedRemove(number, switch_path) {

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
			if(switch_path) {
				oState.path = '/unclaimed';
			}
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
					let lPath = Utils.parsePath(this.state.path);
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
					let lPath = Utils.parsePath(this.state.path);
					if(lPath[0] === 'customer') {

						// If it's the one swapped
						if(lPath[1] === data.phoneNumber) {

							// Set the new path
							oState.path = Utils.customerPath(data.newNumber, lPath[2])

							// Change the page we're on
							this.props.history.replace(oState.path);
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
