/**
 * Resolve
 *
 * Handles resolve dialog
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-06-23
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';

// Composite components
import { ReminderForm } from './Reminder';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Resolve
export default function Resolve(props) {

	// State
	let [reminder, reminderSet] = useState(null);

	// Refs
	let noteRef = useRef();
	let reminderRef = useRef();

	// Submite notes / resolve conversation
	function submit() {

		// If we need a reminder, create it
		if(reminder) {
			reminderRef.current.run();
		}

		// Check for notes
		let content = noteRef.current.value.trim();

		// If we got text
		if(content !== '') {

			// Send the message to the server
			Rest.create('monolith', 'customer/note', {
				action: 'CSR Note - ' + props.title + ' Resolved',
				content: content,
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
					props.onSubmit();
				}
			});
		}

		// Else, let the parent handle removing the claim
		else {
			props.onSubmit();
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
			<DialogTitle id="confirmation-dialog-title">Resolve {props.title}</DialogTitle>
			<DialogContent dividers>
				<TextField
					label="Add Note"
					multiline
					inputRef={noteRef}
					rows="4"
					variant="outlined"
				/>
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
					Resolve
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Resolve.propTypes = {
	customerId: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	title: PropTypes.string,
}

// Default props
Resolve.defaultProps = {
	title: 'Claim',
}
