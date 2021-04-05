/**
 * Provider Return
 *
 * Handles provider dialog for returning claims to providers whether a specific
 * one is assigned or not
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

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Provider Return
 *
 * Displays a dialog to put a note
 *
 * @name ProviderReturn
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function ProviderReturn(props) {

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
		Rest.update('monolith', 'customer/provider/return', {
			phoneNumber: props.customerPhone,
			customerId: props.customerId,
			orderId: props.orderId,
			note: content,
			provider: props.provider
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
