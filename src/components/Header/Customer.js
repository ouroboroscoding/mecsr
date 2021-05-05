/**
 * Header: Customer
 *
 * Handles customer menu items
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-05-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

// Material UI
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
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
import CancelIcon from '@material-ui/icons/Cancel';
import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from '@material-ui/icons/Check';
import ForumIcon from '@material-ui/icons/Forum';
import HeadsetMicIcon from '@material-ui/icons/HeadsetMic';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import ViewListIcon from '@material-ui/icons/ViewList';

// Dialogs components
import CancelContinuous from 'components/dialogs/CancelContinuous';
import Decline from 'components/dialogs/Decline';
import ProviderReturn from 'components/dialogs/ProviderReturn';
import ProviderTransfer from 'components/dialogs/ProviderTransfer';
import Resolve from 'components/dialogs/Resolve';
import Transfer from 'components/dialogs/Transfer';

// Composite components
import { ReminderDialog } from 'components/composites/Reminder';
import { CustomListsDialog } from 'components/composites/CustomLists';

// Data modules
import Claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';

// Local modules
import Utils from 'utils';

/**
 * Customer
 *
 * Handles claimed customer menu items
 *
 * @name Customer
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Customer(props) {

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
	let [transferMore, transferMoreSet] = useState(null);

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
		Claimed.remove(props.customerPhone).then(res => {
			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone, props.selected);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});

		// If we're swapping
		if(swap) {

			// Get the claimed add promise
			Claimed.add(props.customerPhone).then(res => {
				Events.trigger('claimedAdd', props.ticket, props.customerPhone, props.customerName, props.customerId);
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

		// Set the ticket
		Tickets.current(props.ticket);

		// Change the page
		props.onClick(
			Utils.customerPath(props.customerPhone, props.customerId),
			props.customerPhone
		);
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
		Claimed.remove(props.customerPhone).then(res => {
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
		Claimed.remove(props.customerPhone).then(res => {
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
		Claimed.remove(props.customerPhone).then(() => {
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
	function transferMoreClose(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferMoreSet(null);
	}

	// Transfer dialog submit
	function transferSubmit() {

		// Remove transfer dialog
		transferSet(false);

		// If we're currently selected, change the page
		if(props.selected) {
			history.push(props.provider !== null ? '/pending' : '/unclaimed');
		}
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
						disableTypography={true}
						primary={<Typography>{props.customerName}</Typography>}
						secondary={
							<React.Fragment>
								<span className="customerDetails MuiTypography-colorTextSecondary">
									<Typography>#: {Utils.nicePhone(props.customerPhone)}</Typography>
									<Typography>ID: {props.customerId}</Typography>
									{props.orderId &&
										<Typography>Order: {props.orderId}</Typography>
									}
									{props.provider &&
										<Typography>Provider: {props.providerName}</Typography>
									}
									{props.transferredBy &&
										<Typography>Transferrer: {props.transferredByName}</Typography>
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
														onClose={transferMoreClose}
													>
														<MenuItem onClick={transferClick}>
															<ListItemIcon>
																<HeadsetMicIcon />
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
					ignore={transfer}
					onClose={e => transferSet(false)}
					onSubmit={transferSubmit}
					{...props}
				/>
			}
			{list &&
				<CustomListsDialog
					onClose={() => listSet(false)}
					{...props}
				/>
			}
			{reminder &&
				<ReminderDialog
					onClose={e => reminderSet(false)}
					{...props}
				/>
			}
			{resolve &&
				<Resolve
					onClose={e => resolveSet(false)}
					onSubmit={remove}
					{...props}
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
					onClose={e => cancelSet(false)}
					onSubmit={cancelSubmit}
					{...props}
				/>
			}
			{decline &&
				<Decline
					onClose={e => declineSet(false)}
					onSubmit={declineSubmit}
					{...props}
				/>
			}
		</React.Fragment>
	);
}

// Valid props
Customer.propTypes = {
	continuous: PropTypes.oneOf([0, 1]),
	customerId: PropTypes.string.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	newMsgs: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
	orderId: PropTypes.string,
	provider: PropTypes.string,
	providerName: PropTypes.string,
	providerTransfer: PropTypes.bool.isRequired,
	selected: PropTypes.bool.isRequired,
	ticket: PropTypes.string.isRequired,
	transferredByName: PropTypes.string,
	user: PropTypes.object.isRequired,
	viewed: PropTypes.oneOf([0, 1]).isRequired
}
