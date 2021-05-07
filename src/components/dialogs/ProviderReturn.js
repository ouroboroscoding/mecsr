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
import React, { useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';

// Data modules
import Claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

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

	// Constants
	const ISSUE_RESOLVED = Tickets.subtype_id('Issue Resolved');

	// State
	let [note, noteSet] = useState('');

	// Submite notes / resolve conversation
	function submitTransfer() {

		// Send the message to the server
		Rest.update('monolith', 'customer/provider/return', {
			phoneNumber: props.customerPhone,
			customerId: props.customerId,
			orderId: props.orderId,
			note: note,
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

				// Add it to the ticket
				if(props.ticket) {
					Tickets.item('note', res.data, props.ticket);
				}

				// Start the resolving
				submitResolution();
			}
		});
	}

	// Called to submit the resolution, close the ticket, and remove the claim
	function submitResolution() {

		// If there's no ticket (eventually we can remove this)
		if(!props.ticket) {

			// Remove the claim
			Claimed.remove(props.customerPhone).then(() => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// Notify the parent
			props.onSubmit();
			return;
		}

		// Close the ticket
		Tickets.resolve(ISSUE_RESOLVED).then(data => {

			// Remove the claim
			Claimed.remove(props.customerPhone).then(() => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// Notify the parent
			props.onSubmit();

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
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
					onChange={ev => noteSet(ev.currentTarget.value)}
					rows="4"
					value={note}
					variant="outlined"
				/>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{note !== '' &&
					<Button variant="contained" color="primary" onClick={submitTransfer}>
						Send to Provider
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}
