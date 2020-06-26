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
import React, { useRef } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Resolve
export default function Resolve(props) {

	// Refs
	let noteRef = useRef();

	// Submite notes / resolve conversation
	function submit() {

		// Check for notes
		let content = noteRef.current.value;

		// If we got text
		if(content.trim() !== '') {

			// Send the message to the server
			Rest.create('monolith', 'customer/note', {
				action: 'CSR Note - Resolved',
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
			<DialogTitle id="confirmation-dialog-title">Resolve</DialogTitle>
			<DialogContent dividers>
				<TextField
					label="Add Note"
					multiline
					inputRef={noteRef}
					rows="4"
					variant="outlined"
				/>
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
