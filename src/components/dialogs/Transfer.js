/**
 * Transfer
 *
 * Handles transfer dialog
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-06-24
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Composite components
import { CustomListsForm } from 'components/composites/CustomLists';
import { ReminderForm } from 'components/composites/Reminder';

// Data modules
import Claimed from 'data/claimed';

// Shared components
import RadioButtons from 'shared/components/RadioButtons';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, omap } from 'shared/generic/tools';

/**
 * Transfer
 *
 * Dialog for transferring a customer to another Agent
 *
 * @name Transfer
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Transfer(props) {

	// Constants
	let ESCALATE = Tickets.type_id('Escalated').toString();
	let TRANSFER = Tickets.type_id('Transferred').toString();
	let REQUESTED_AGENT = Tickets.subtype_id('Requested Specific Agent').toString();

	// State
	let [agents, agentsSet] = useState([]);
	let [agentsAll, agentsAllSet] = useState([]);
	let [agent, agentSet] = useState('');
	let [note, noteSet] = useState('');
	let [reminder, reminderSet] = useState(null);
	let [type, typeSet] = useState(TRANSFER);
	let [subtype, subtypeSet] = useState('');
	let [subtypes, subtypesSet] = useState([]);

	// Refs
	let listRef = useRef();
	let reminderRef = useRef();

	// Load effect
	useEffect(() => {
		agentsFetch();
	// eslint-disable-next-line
	}, []);

	// Type effect
	useEffect(() => {
		// Get and set new subtypes
		let oSubTypes = Tickets.subtype_ids(parseInt(type, 10));
		let lSubTypes = omap(oSubTypes, (name,id) => { return {value: id.toString(), text: name}});
		subtypesSet(lSubTypes);

		// Reset current subtype
		subtypeSet(lSubTypes[0].value.toString());
	// eslint-disable-next-line
	}, [type]);

	// Agents effect
	useEffect(() => {
		agentsFilter();
	// eslint-disable-next-line
	}, [agentsAll, type, subtype]);

	function agentChange(event) {
		agentSet(event.currentTarget.value);
	}

	// Fetch agents we can transfer to
	function agentsFetch() {

		// Make the request to the service
		Rest.read('csr', 'agent/names', {}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Remove the ignore user if we have one
				if(props.ignore) {
					let i = afindi(res.data, 'memo_id', props.ignore);
					if(i > -1) {
						res.data.splice(i, 1);
					}
				}

				// Save the agents
				agentsAllSet(res.data);
			}
		});
	}

	// Filter the list of agents based on the type/subtype requested
	function agentsFilter() {

		// Init the new list of agents
		let lAgents = [];

		// If the type is transfer
		if(type === TRANSFER) {

			// If we want all agents
			if(subtype === REQUESTED_AGENT) {
				agentsSet(clone(agentsAll));
				return;
			}

			// Else, look for PAs
			else {

				// Go through all agents
				for(let o of agentsAll) {
					if(o.type === 'pa') {
						lAgents.push(o);
					}
				}
			}
		}

		// Else, if we're escalating
		else {

			// Go through all agents
			for(let o of agentsAll) {

				// Regargless of subtype, we only want agents that can be
				//	escalated
				if(o.escalate) {
					lAgents.push(o);
				}
			}
		}

		// Set the new agents
		agentsSet(lAgents);
	}

	// Submit notes
	function submitNote() {

		// If no agent selected
		if(!agent) {
			Events.trigger('error', 'Please select an agent to transfer to');
			return;
		}

		// Add to the list
		listRef.current.run();

		// If we need a reminder, create it
		if(reminder) {
			reminderRef.current.run();
		}

		// Send the message to the server
		Rest.create('monolith', 'customer/note', {
			action: 'CSR Note - Transfered',
			content: note,
			customerId: props.customerId
		}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Add it to the ticket
				if(props.ticket) {
					Tickets.item('note', res.data, props.ticket);
				}

				// Start the transfer
				submitTransfer();
			}
		});
	}

	// Called to submit the actual transfer
	function submitTransfer() {

		// Call the request
		Claimed.transfer(props.customerPhone, agent).then(res => {

			// Add it to the ticket if we have one
			if(props.ticket) {
				Tickets.action(
					parseInt(type, 10),
					parseInt(subtype, 10),
					props.ticket
				);
			}

			// Trigger the claimed being removed
			Events.trigger('claimedRemove', props.customerPhone);

			// Call the parent
			props.onSubmit();

		}, error => {
			if(error.code === 1104) {
				Events.trigger('error', 'Claim no longer exists, can not transfer.');
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	return (
		<Dialog
			fullWidth={true}
			maxWidth="sm"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "transfer"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Transfer / Escalate</DialogTitle>
			<DialogContent dividers>
				<RadioButtons
					buttonProps={{style: {width: '100%'}}}
					gridContainerProps={{spacing: 2}}
					gridItemProps={{xs: 6}}
					onChange={value => typeSet(value)}
					options={[
						{value: TRANSFER, text: 'Transfer'},
						{value: ESCALATE, text: 'Escalate'}
					]}
					value={type}
					variant="grid"
				/>
				<RadioButtons
					buttonProps={{style: {width: '100%'}}}
					gridContainerProps={{spacing: 2}}
					gridItemProps={{xs: Math.floor(12 / subtypes.length)}}
					onChange={value => subtypeSet(value, 10)}
					options={subtypes}
					value={subtype}
					variant="grid"
				/>
				<br />
				<Box className="field">
					<TextField
						label="Add Note"
						multiline
						onChange={ev => noteSet(ev.currentTarget.value)}
						rows="4"
						value={note}
						variant="outlined"
					/>
				</Box>
				<Box className="field">
					<FormControl variant="outlined">
						<InputLabel htmlFor="transfer-agent">Transfer To</InputLabel>
						<Select
							inputProps={{
								id: 'transfer-agent'
							}}
							label="Transfer To"
							native
							onChange={agentChange}
							value={agent}
						>
							<option aria-label="None" value="" />
							{agents.map(o =>
								<option key={o.memo_id} value={o.memo_id}>{o.firstName + ' ' + o.lastName}</option>
							)}
						</Select>
					</FormControl>
				</Box>
				<br />
				<Typography><strong>Optional</strong></Typography>
				<Box className="field">
					<CustomListsForm
						optional={true}
						ref={listRef}
						{...props}
					/>
				</Box>
				<Box className="field">
					<FormControlLabel
						control={<Checkbox
							color="primary"
							checked={reminder}
							onChange={ev => reminderSet(ev.currentTarget.checked)}
						/>}
						label={<span>Add Reminder?</span>}
					/>
				</Box>
				{reminder &&
					<ReminderForm
						ref={reminderRef}
						{...props}
					/>
				}
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{(agent !== '' && note.trim() !== '') &&
					<Button variant="contained" color="primary" onClick={submitNote}>
						Transfer
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Transfer.propTypes = {
	customerId: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	ignore: PropTypes.number,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired
};

// Default props
Transfer.defaultProps = {
	ignore: 0
}
