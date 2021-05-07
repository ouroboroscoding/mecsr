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

// Shared data modules
import Tickets from 'shared/data/tickets';

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
	let [dialog, dialogSet] = useState(false);
	let [more, moreSet] = useState(null);
	let [transferMore, transferMoreSet] = useState(null);

	// Hooks
	let history = useHistory();

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

	// Called to close a dialog
	function dialogClose(ev) {

		// Cancel any events if there is one
		if(ev) {
			ev.stopPropagation();
			ev.preventDefault();
		}

		// Hide the dialog
		dialogSet(false);

		// If we're currently selected, change the page
		if(props.selected) {
			history.push('/');
		}
	}

	// Called to open a dialog
	function dialogOpen(ev, which) {

		// Cancel the events
		ev.stopPropagation();
		ev.preventDefault();

		// Set the dialog to open
		dialogSet(which);

		// If any sub-menus are open, close them
		if(more) moreSet(null);
		if(transferMore) transferMoreSet(null);
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
														<IconButton className="close" onClick={ev => dialogOpen(ev, 'cancel')}>
															<CancelIcon />
														</IconButton>
													</Tooltip>
												:
													<Tooltip title="Decline Order">
														<IconButton className="close" onClick={ev => dialogOpen(ev, 'decline')}>
															<CancelIcon />
														</IconButton>
													</Tooltip>
												}
											</span>
											<span className="tooltip">
												<Tooltip title="Transfer">
													<IconButton className="transfer" onClick={ev => dialogOpen(ev, 'transfer')}>
														<MergeTypeIcon />
													</IconButton>
												</Tooltip>
											</span>
											<span className="tooltip">
												<Tooltip title="Send to Provider">
													<IconButton className="provider" onClick={ev => dialogOpen(ev, 'provider')}>
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
														<MenuItem onClick={ev => dialogOpen(ev, 'transfer')}>
															<ListItemIcon>
																<HeadsetMicIcon />
															</ListItemIcon>
															<ListItemText primary="Transfer to Agent" />
														</MenuItem>
														<MenuItem onClick={ev => dialogOpen(ev, 'providerTransfer')}>
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
														<IconButton className="transfer" onClick={ev => dialogOpen(ev, 'transfer')}>
															<MergeTypeIcon />
														</IconButton>
													</Tooltip>
												</span>
											}
											<span className="tooltip">
												<Tooltip title="Resolve">
													<IconButton className="resolve" onClick={ev => dialogOpen(ev, 'resolve')}>
														<CheckIcon />
													</IconButton>
												</Tooltip>
											</span>
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
											<MenuItem onClick={ev => dialogOpen(ev, 'list')}>
												<ListItemIcon>
													<ViewListIcon />
												</ListItemIcon>
												<ListItemText primary="Add to List" />
											</MenuItem>
											<MenuItem onClick={ev => dialogOpen(ev, 'reminder')}>
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
			{dialog === 'transfer' &&
				<Transfer
					ignore={props.user.id}
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
					{...props}
				/>
			}
			{dialog === 'list' &&
				<CustomListsDialog
					onClose={() => dialogSet(false)}
					{...props}
				/>
			}
			{dialog === 'reminder' &&
				<ReminderDialog
					onClose={e => dialogSet(false)}
					{...props}
				/>
			}
			{dialog === 'resolve' &&
				<Resolve
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
					{...props}
				/>
			}
			{dialog === 'providerReturn' &&
				<ProviderReturn
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
					{...props}
				/>
			}
			{dialog === 'providerTransfer' &&
				<ProviderTransfer
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
					{...props}
				/>
			}
			{dialog === 'cancel' &&
				<CancelContinuous
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
					{...props}
				/>
			}
			{dialog === 'decline' &&
				<Decline
					onClose={e => dialogSet(false)}
					onSubmit={dialogClose}
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
