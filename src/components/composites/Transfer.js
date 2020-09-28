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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

// Composite components
import { CustomListsForm } from './CustomLists';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Transfer
export default function Transfer(props) {

	// State
	let [agents, agentsSet] = useState({});
	let [agent, agentSet] = useState('');

	// Refs
	let noteRef = useRef();
	let listRef = useRef();

	// Effects
	useEffect(() => {
		// Fetch the agents we can transfer to
		agentsFetch();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // React to user changes

	function agentChange(event) {
		agentSet(event.currentTarget.value);
	}

	// Fetch agents we can transfer to
	function agentsFetch() {

		// Make the request to the service
		Rest.read('csr', 'agent/names', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Remove the ignore user
				if(props.ignore in res.data) {
					delete res.data[props.ignore]
				}

				// Save the agents
				agentsSet(res.data);
			}
		});
	}

	// Submite notes / resolve conversation
	function submit() {

		// If no agent selected
		if(!agent) {
			Events.trigger('error', 'Please select an agent to transfer to');
			return;
		}

		// Check for notes
		let content = noteRef.current.value;

		// Add to the list
		listRef.current.run();

		// If we got text
		if(content.trim() !== '') {

			// Send the message to the server
			Rest.create('monolith', 'customer/note', {
				action: 'CSR Note - Transfered',
				content: content,
				customer_id: props.customerId
			}).done(res => {

				// If there's an error
				if(res.error && !Utils.restError(res.error)) {
					Events.trigger('error', JSON.stringify(res.error));
				}

				// If there's a warning
				if(res.warning) {
					Events.trigger('warning', JSON.stringify(res.warning));
				}

				// If we're ok
				if(res.data) {
					props.onSubmit(agent);
				}
			});
		}

		// Else, let the parent handle removing the claim
		else {
			props.onSubmit(parseInt(agent));
		}
	}

	return (
		<Dialog
			fullWidth={true}
			maxWidth="sm"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Transfer</DialogTitle>
			<DialogContent dividers>
				<p><TextField
					label="Add Note"
					multiline
					inputRef={noteRef}
					rows="4"
					variant="outlined"
				/></p>
				<p><FormControl variant="outlined">
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
						{Tools.omap(agents, (o,k) =>
							<option key={k} value={k}>{o.firstName + ' ' + o.lastName}</option>
						)}
					</Select>
				</FormControl></p>
				<p><CustomListsForm
					customer={props.customerId}
					name={props.name}
					number={props.number}
					optional={true}
					ref={listRef}
				/></p>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				<Button variant="contained" color="primary" onClick={submit}>
					Transfer
				</Button>
			</DialogActions>
		</Dialog>
	);
}
