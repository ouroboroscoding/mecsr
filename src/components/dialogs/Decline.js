/**
 * Decline
 *
 * Handles decline dialog
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-12
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';

// Data modules
import Claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared components
import RadioButtons from 'shared/components/RadioButtons';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Decline
 *
 * Handles a dialog for declining a QA order
 *
 * @name Decline
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Decline(props) {

	// State
	let [reason, reasonSet] = useState('');

	// Submit notes / resolve conversation
	function submitDecline() {

		// If the reason isn't Ran CC Successfully
		if(reason !== 'Ran CC Successfully') {

			// Decline the order
			Rest.update('monolith', 'order/decline', {
				orderId: props.orderId,
				reason: reason
			}).done(res => {

				// If there's an error or warning
				if(res.error && !res._handled) {
					if(res.error.code === 1103) {
						Events.trigger('error', 'Failed to update order status in Konnektive, please try again or contact support');
					} else {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
				}
				if(res.warning) {
					Events.trigger('warning', JSON.stringify(res.warning));
				}

				// If there's data
				if(res.data) {

					// Add the note to the ticket
					if(props.ticket) {
						Tickets.item('note', res.data, props.ticket);
					}

					// Start the resolution
					submitResolution()
				}
			});
		} else {

			// Start the resolution
			submitResolution();
		}
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

		// Resolve the ticket
		Tickets.resolve('QA Order Declined', props.ticket).then(data => {

			// Delete the claim
			Claimed.remove(props.customerPhone).then(res => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// Notify the parent
			props.onSubmit();

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		})
	}

	return (
		<Dialog
			id="decline"
			fullWidth={true}
			maxWidth="md"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">QA Order Decline</DialogTitle>
			<DialogContent dividers>
				<Box className="field">
					<RadioButtons
						buttonProps={{style: {width: '100%'}}}
						gridContainerProps={{spacing: 2}}
						gridItemProps={{xs: 12, md: 6, xl: 3}}
						label="Reason for decline"
						onChange={value => reasonSet(value, 10)}
						options={[
							{value: 'Ran CC Successfully'},
							{value: 'Duplicate Order*'},
							{value: 'Customer Request*'},
							{value: 'Contact Attempt*'}
						]}
						value={reason}
						variant="grid"
					/>
				</Box>
				<Typography>* Will cancel QA order in Konnektive</Typography>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{reason !== '' &&
					<Button variant="contained" color="primary" onClick={submitDecline}>
						Decline
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Decline.propTypes = {
	orderId: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired
}
