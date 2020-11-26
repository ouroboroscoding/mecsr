/**
 * Provider
 *
 * Handles provider dialog (resolve for orders)
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-25
 */

// NPM modules
import React, { useRef } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Provider
export default function Provider(props) {

	// Refs
	let noteRef = useRef();

	// Submite notes / resolve conversation
	function submit() {

		// Check for notes
		let content = noteRef.current.value.trim();

		// If we got text
		if(content.trim() === '') {
			Events.trigger('error', 'Please leave a note explaining the resolution.');
			return;
		}

		// Send the message to the server
		Rest.update('monolith', 'customer/transfer', {
			phoneNumber: props.customerPhone,
			customerId: props.customerId,
			orderId: props.orderId,
			note: content,
			provider: props.provider
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {
				props.onTransfer();
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
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Send to Provider</DialogTitle>
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
					Send to Provider
				</Button>
			</DialogActions>
		</Dialog>
	);
}
