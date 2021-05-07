/**
 * Provider Transfer
 *
 * Handles transfering a customer to a provider
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-25
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

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { omap } from 'shared/generic/tools';

/**
 * Provider Transfer
 *
 * Displays a dialog with eligible providers based on the customer's shipping
 * state
 *
 * @name ProviderTransfer
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function ProviderTransfer(props) {

	// State
	let [note, noteSet] = useState('');
	let [provider, providerSet] = useState('');
	let [providers, providersSet] = useState(null);
	let [reminder, reminderSet] = useState(null);

	// Refs
	let listRef = useRef();
	let reminderRef = useRef();

	// Load effect
	useEffect(() => {
		if(props.user) {
			providersFetch();
		} else {
			providersSet(null);
		}
	// eslint-disable-next-line
	}, [props.user, props.customerId]);

	// Fetch providers that are eligible to handle the customer
	function providersFetch() {

		// Make the request of the server
		Rest.read('monolith', 'customer/providers', {
			customerId: props.customerId,
			type: props.type
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {
				providersSet(res.data);
			}
		});
	}

	// Make the transfer
	function submit() {

		// If we need a reminder, create it
		if(reminder) {
			reminderRef.current.run();
		}

		// Send the transfer request to the server
		Rest.update('monolith', 'customer/provider/transfer', {
			note: note,
			phoneNumber: props.customerPhone,
			user_id: provider
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {

				// If there's a ticket
				if(props.ticket) {

					// Add the note
					Tickets.item('note', res.data, props.ticket);

					// Add the action
					Tickets.action('Transferred', 'Provider Required', props.ticket);
				}

				// Notify the parent
				props.onSubmit(provider);
			}
		});
	}

	// Render
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
			<DialogTitle id="confirmation-dialog-title">Transfer to Provider</DialogTitle>
			{providers ?
				<React.Fragment>
					<DialogContent dividers>
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
								<InputLabel htmlFor="provider-transfer">Transfer To</InputLabel>
								<Select
									inputProps={{
										id: 'provider-transfer'
									}}
									label="Transfer To"
									native
									onChange={ev => providerSet(ev.target.value)}
									value={provider}
								>
									<option aria-label="None" value="" />
									{omap(providers, (o,k) =>
										<option key={k} value={k}>{o.firstName + ' ' + o.lastName}</option>
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
						{(note.trim() !== '' && provider !== '') &&
							<Button variant="contained" color="primary" onClick={submit}>
								Transfer to Provider
							</Button>
						}
					</DialogActions>
				</React.Fragment>
			:
				<DialogContent dividers>
					<Typography>Loading eligible providers</Typography>
				</DialogContent>
			}
		</Dialog>
	);
}

// Valid props
ProviderTransfer.propTypes = {
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	type: PropTypes.oneOf(['ed', 'hrt'])
}

// Default props
ProviderTransfer.defaultProps = {
	type: 'ed'
}
