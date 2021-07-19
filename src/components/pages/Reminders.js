/**
 * Reminders
 *
 * Shows unresolved reminders for the agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-23
 */

// NPM modules
import Tree from 'format-oc/Tree';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';

// Composite components
import ReviewSummary from 'components/composites/ReviewSummary';

// Dialog components
import Claim from 'components/dialogs/Claim';
import Resolve from 'components/dialogs/Resolve';

// Data modules
import reminders from 'data/reminders';

// Format Components
import { Form } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import {
	afindi,
	clone,
	empty,
	isToday,
	niceDate,
	omap
} from 'shared/generic/tools';

// Reminder definitions
import ReminderDef from 'definitions/csr/reminder';

// Reminder tree
const ReminderTree = new Tree(clone(ReminderDef));

/**
 * Reminder
 *
 * Displays a single reminder
 *
 * @name Reminder
 * @access private
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
function Reminder(props) {

	// State
	let [claim, claimSet] = useState(false);
	let [edit, editSet] = useState(false);
	let [resolve, resolveSet] = useState(false);

	// Catch a click on the resolve button
	/*function resolveClick() {

		// If we have a customer ID
		if(props.data.claimed) {
			resolveSet(true);
		}

		// Else, just resolve the reminder and remove it
		else {
			props.onResolve(props.data);
		}
	}*/

	// View the customer associated with the reminder
	function view() {
		Events.trigger(
			'viewedAdd',
			props.data.claimed.customerPhone,
			props.data.claimed.customerName,
			props.data.claimed.customerId
		);
	}

	// If we're the one who claimed it
	let sClaimedBy = '';
	if(props.data.claimed) {
		sClaimedBy = (props.data.claimed.userId === props.user.id) ? 'You' : props.data.claimed.claimedBy;
	}

	// Render
	return (
		<React.Fragment>
			<Grid container spacing={3} className="summary">
				<Grid item xs={6} md={2}>
					<Typography><strong>Actions:</strong></Typography>
					{/*<Button className="action" variant="contained" color="primary" size="large" onClick={resolveClick}>Resolve</Button>*/}
					{props.data.claimed &&
						<React.Fragment>
							{props.data.claimed.claimedAt ?
								<span>Claimed by {sClaimedBy}</span>
							:
								<Button className="action" variant="contained" color="primary" size="large" onClick={ev => claimSet(true)}>Claim</Button>
							}
							{sClaimedBy !== 'You' &&
								<Button className="action" variant="contained" color="primary" size="large" onClick={view}>View</Button>
							}
						</React.Fragment>
					}
				</Grid>
				<Grid item xs={6} md={2}>
					<Typography><strong>Customer:</strong></Typography>
					{props.data.claimed ?
						<React.Fragment>
							<Typography>{props.data.claimed.customerName}</Typography>
							<Typography>{props.data.claimed.customerPhone}</Typography>
							{props.data.claimed.reviews &&
								<Typography><ReviewSummary {...props.data.claimed.reviews} /></Typography>
							}
						</React.Fragment>
					:
						<Typography>No customer</Typography>
					}
				</Grid>
				<Grid item xs={11} md={7} className="messages">
					<Typography><strong>Note:</strong></Typography>
					{props.data.note.split('\n').map(s => <Typography>{s}</Typography>)}
				</Grid>
				<Grid item xs={1} className="actions">
					<Tooltip title="Edit">
						<IconButton onClick={(ev => editSet(b => !b))}>
							<EditIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Delete">
						<IconButton onClick={() => props.onRemove(props.data)}>
							<DeleteIcon />
						</IconButton>
					</Tooltip>
				</Grid>
				{edit &&
					<Grid item xs={12}>
						<Form
							beforeSubmit={data => {
								if('crm_id' in data && data['crm_id'].trim() !== '') {
									data['crm_type'] = 'knk';
								}
								return data;
							}}
							cancel={ev => editSet(b => !b)}
							noun="reminder"
							overrideSubmit={reminders.update}
							service="csr"
							success={data => {
								editSet(false);
								props.onUpdate(data, props.data.date);
							}}
							title="Update"
							tree={ReminderTree}
							type="update"
							value={props.data}
						/>
					</Grid>
				}
			</Grid>
			{claim &&
				<Claim
					defaultType="Follow Up"
					onClose={() => claimSet(false)}
					{...props.data.claimed}
				/>
			}
			{resolve &&
				<Resolve
					customerId={props.data.claimed.customerId}
					onClose={() => resolveSet(false)}
					onSubmit={ev => {
						resolveSet(false);
						props.onResolve(props.data);
					}}
					title="Reminder"
				/>
			}
		</React.Fragment>
	);
}

// Valid props
Reminder.propTypes = {
	data: PropTypes.object.isRequired,
	onRemove: PropTypes.func.isRequired,
	onResolve: PropTypes.func.isRequired,
	onUpdate: PropTypes.func.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Reminders
 *
 * List by day of unresolved reminders
 *
 * @name Reminders
 * @access public
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
export default function Reminders(props) {

	// State
	let [create, createSet] = useState(false);
	let [records, recordsSet] = useState([]);

	// User Effect
	useEffect(() => {
		if(props.user) {
			fetch();
		} else {
			recordsSet([]);
		}
	// eslint-disable-next-line
	}, [props.user]); // React to user changes

	// Called when new reminder is created
	function createSuccess(reminder) {

		// Hide the create
		createSet(false);

		// If we have the date
		if(reminder.date in records) {
			let dRecords = clone(records);
			dRecords[reminder.date].push(reminder);
			recordsSet(dRecords);
		}

		// Else, just re-fetch the data
		else {
			fetch();
		}
	}

	// Store by day
	function byDay(l) {

		// Results
		let dReturn = {};

		// Go through each appointment found
		for(let o of l) {

			// If the date doesn't exist
			if(!(o.date in dReturn)) {
				dReturn[o.date] = [];
			}

			// Add the item to the date's list
			dReturn[o.date].push(o);
		}

		// Return the new object of lists
		return dReturn;
	}

	// Fetch
	function fetch() {

		// Get the appointments from the server
		Rest.read('csr', 'reminders', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Sort into days, then store the appointments
				recordsSet(byDay(res.data));
			}
		});
	}

	// Remove the reminder from the results
	function remove(data) {

		// Delete the reminder
		reminders.remove(data._id).then(res => {
			resultRemove(data);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Called when a reminder is marked as resolved
	function resolve(data) {

		// Resolve the reminder
		reminders.resolve(data._id).then(res => {
			resultRemove(data);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Called to remove a reminder from the results
	function resultRemove(data) {

		// Look for the reminder
		if(data.date in records) {
			let i = afindi(records[data.date], '_id', data._id);

			// If it's foudn, remove it and update the state
			if(i > -1) {
				let dRecords = clone(records);
				if(dRecords[data.date].length === 1) {
					delete dRecords[data.date];
				} else {
					dRecords[data.date].splice(i, 1);
				}
				recordsSet(dRecords);
			}
		}
	}

	// Called when a reminder is updated
	function update(data) {
		fetch();
	}

	// Render
	return (
		<Box id="reminders" className="page">
			<Box className="page_header">
				<Typography className="title">Reminders</Typography>
				<Tooltip title="Create New Reminder">
					<IconButton onClick={ev => createSet(b => !b)}>
						<AddCircleIcon />
					</IconButton>
				</Tooltip>
			</Box>
			{create &&
				<Paper className="padded">
					<Form
						beforeSubmit={data => {
							if('crm_id' in data && data['crm_id'].trim() !== '') {
								data['crm_type'] = 'knk';
							}
							return data;
						}}
						cancel={ev => createSet(b => !b)}
						noun="reminder"
						overrideSubmit={reminders.add}
						service="csr"
						success={createSuccess}
						title="Create New"
						tree={ReminderTree}
						type="create"
					/>
				</Paper>
			}
			{!empty(records) && omap(records, (l,k) =>
				<Paper className="padded">
					<Box className="group_header">
						<Typography className="title">{isToday(k) ? 'Today' : niceDate(k)}</Typography>
					</Box>
					{l.map((o,i) =>
						<React.Fragment key={i}>
							{i !== 0 &&
								<hr />
							}
							<Reminder
								onResolve={resolve}
								onUpdate={update}
								onRemove={remove}
								user={props.user}
								data={o}
							/>
						</React.Fragment>
					)}
				</Paper>
			)}
			{empty(records) &&
				<Typography>No reminders found</Typography>
			}
		</Box>
	);
}
