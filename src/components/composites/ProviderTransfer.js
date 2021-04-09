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
import { CustomListsForm } from './CustomLists';
import { ReminderForm } from './Reminder';

// Shared communications modules
import Rest from 'shared/communication/rest';

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
	let [providers, providersSet] = useState(null);
	let [reminder, reminderSet] = useState(null);

	// Refs
	let listRef = useRef();
	let noteRef = useRef();
	let providerRef = useRef();
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

		// Make sure we have a provider
		if(providerRef.current.value === '') {
			Events.trigger('error', 'Please select a provider to transfer to');
			return;
		}

		// Make sure we have a note
		let sNote = noteRef.current.value.trim();
		if(sNote === '') {
			Events.trigger('Must write a note when transferring')
			return;
		}

		// If we need a reminder, create it
		if(reminder) {
			reminderRef.current.run();
		}

		// Send the transfer request to the server
		Rest.update('monolith', 'customer/provider/transfer', {
			note: sNote,
			phoneNumber: props.customerPhone,
			user_id: providerRef.current.value
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
				props.onTransfer(providerRef.current.value);
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
						<p><TextField
							label="Add Note"
							multiline
							inputRef={noteRef}
							rows="4"
							variant="outlined"
						/></p>
						<p><FormControl variant="outlined">
							<InputLabel htmlFor="provider-transfer">Transfer To</InputLabel>
							<Select
								inputProps={{
									id: 'provider-transfer',
									ref: providerRef
								}}
								label="Transfer To"
								native
							>
								<option aria-label="None" value="" />
								{omap(providers, (o,k) =>
									<option key={k} value={k}>{o.firstName + ' ' + o.lastName}</option>
								)}
							</Select>
						</FormControl></p>
						<p><CustomListsForm
							optional={true}
							ref={listRef}
							{...props}
						/></p>
						<p><FormControlLabel
							control={<Checkbox
								color="primary"
								checked={reminder}
								onChange={ev => reminderSet(ev.currentTarget.checked)}
							/>}
							label={<span>Add Reminder?</span>}
						/></p>
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
						<Button variant="contained" color="primary" onClick={submit}>
							Transfer to Provider
						</Button>
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
	onTransfer: PropTypes.func.isRequired,
	type: PropTypes.oneOf(['ed', 'hrt'])
}

// Default props
ProviderTransfer.defaultProps = {
	type: 'ed'
}
