/**
 * Header: View
 *
 * Handles view menu items
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

// Material UI Icons
import AddAlertIcon from '@material-ui/icons/AddAlert';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import ForumIcon from '@material-ui/icons/Forum';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import ViewListIcon from '@material-ui/icons/ViewList';

// Dialogs components
import Claim from 'components/dialogs/Claim';
import Transfer from 'components/dialogs/Transfer';

// Composite components
import { ReminderDialog } from 'components/composites/Reminder';
import { CustomListsDialog } from 'components/composites/CustomLists';

// Shared generic modules
import Events from 'shared/generic/events';
import { nicePhone } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

/**
 * View
 *
 * Handles viewed customer menu items
 *
 * @name View
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function View(props) {

	// State
	let [claim, claimSet] = useState(false);
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
	function claimClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		claimSet(true);
	}

	// Claim failure
	function claimFailure(error) {
		if(error.code === 1101) {
			Events.trigger('viewedDuplicate', props.customerPhone, error.msg);
		}
	}

	// Click event
	function click(ev) {
		props.onClick(
			Utils.viewedPath(props.customerPhone, props.customerId),
			props.customerPhone
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
			history.push('/');
		}

		// Trigger the viewed being removed
		Events.trigger('viewedRemove', props.customerPhone, props.selected);
	}

	// Transfer click
	function transferClick(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		transferSet(props.claimedUser);
	}

	// Transfer dialog submit
	function transferSubmit() {

		// Hide the dialog
		transferSet(false);

		// If we're currently selected, change the page
		if(props.selected) {
			history.push('/');
		}
	}

	// Render
	return (
		<React.Fragment>
			<Link to={Utils.viewedPath(props.customerPhone, props.customerId)} onClick={click}>
				<ListItem button selected={props.selected}>
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
								<span>
									ID: {props.customerId}<br/>
									#: {nicePhone(props.customerPhone)}
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
										{(props.claimedUser && props.overwrite) &&
											<Tooltip title="Transfer">
												<IconButton className="transfer" onClick={transferClick}>
													<MergeTypeIcon />
												</IconButton>
											</Tooltip>
										}
										{!props.claimedUser &&
											<Tooltip title="Claim">
												<IconButton className="claim" onClick={claimClick}>
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
			{claim &&
				<Claim
					customerId={props.customerId.toString()}
					customerName={props.customerName}
					customerPhone={props.customerPhone}
					defaultType="sms"
					onClose={() => claimSet(false)}
					onFailure={claimFailure}
				/>
			}
			{transfer !== false &&
				<Transfer
					onClose={e => transferSet(false)}
					onSubmit={transferSubmit}
					removeType="viewedRemove"
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
		</React.Fragment>
	);
}

// Valid props
View.propTypes = {
	customerId: PropTypes.string.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	newMsgs: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
	selected: PropTypes.bool.isRequired,
	user: PropTypes.object.isRequired
}
