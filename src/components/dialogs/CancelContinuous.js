/**
 * CancelContinuous
 *
 * Handles cancel dialog for continuous orders
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-23
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
 * Cancel Continuous
 *
 * Handles a dialog to cancel (stop recurring payment) a continuous order
 *
 * @name CancelContinuous
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function CancelContinuous(props) {

	// Constants
	const CANCEL_CONTINUOUS = Tickets.subtype_id('Recurring Purchase Canceled');

	// State
	let [reason, reasonSet] = useState('');

	// Submite notes / resolve conversation
	function submitCancel(reason) {

		// CancelContinuous the order
		Rest.update('monolith', 'order/continuous/cancel', {
			customerId: props.customerId,
			orderId: props.orderId,
			reason: reason
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to cancel purchase in Konnektive, please try again or contact support');
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
				submitResolution();
			}
		});
	}

	// Called to submit the resolution, close the ticket, and remove the claim
	function submitResolution() {

		// If there's no ticket (eventually we can remove this)
		if(!props.ticket) {

			// Delete the claim
			Claimed.remove(props.customerPhone).then(res => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// If it's a medication switch
			if(reason === 'Medication Switch') {

				// Get the claimed add promise
				Claimed.add(props.customerPhone).then(res => {
					Events.trigger('claimedAdd', props.ticket, props.customerPhone, props.customerName, props.customerId);
				}, error => {
					// If we got a duplicate
					if(error.code === 1101) {
						Events.trigger('error', 'Customer has already been claimed.');
					} else {
						Events.trigger('error', Rest.errorMessage(error));
					}
				});
			}

			// Notify the parent
			props.onSubmit();
			return;
		}

		// Resolve the ticket
		Tickets.resolve(CANCEL_CONTINUOUS, props.ticket).then(data => {

			// Delete the claim
			Claimed.remove(props.customerPhone).then(res => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// If it's a medication switch
			if(reason === 'Medication Switch') {

				// Get the claimed add promise
				Claimed.add(props.customerPhone).then(res => {
					Events.trigger('claimedAdd', props.ticket, props.customerPhone, props.customerName, props.customerId);
				}, error => {
					// If we got a duplicate
					if(error.code === 1101) {
						Events.trigger('error', 'Customer has already been claimed.');
					} else {
						Events.trigger('error', Rest.errorMessage(error));
					}
				});
			}

			// Notify the parent
			props.onSubmit();

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		})
	}

	return (
		<Dialog
			id="cancel"
			fullWidth={true}
			maxWidth="md"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Recurring Purchase Cancel</DialogTitle>
			<DialogContent dividers>
				<Typography>Choose the reason for the cancellation:</Typography>
				<Box className="field">
					<RadioButtons
						buttonProps={{style: {width: '100%'}}}
						gridContainerProps={{spacing: 2}}
						gridItemProps={{xs: 12, md: 6, xl: 4}}
						onChange={value => reasonSet(value, 10)}
						options={[
							{value: 'Current Customer', text: 'Customer Request'},
							{value: 'Contact Attempt', text: 'Contact Attempt'},
							{value: 'Medication Switch', text: 'Medication Switch'}
						]}
						value={reason}
						variant="grid"
					/>
				</Box>
				<Typography>* This will switch the current order claim to a regular customer claim so you can continue with the customer and create the new order</Typography>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Do Not Cancel Purchase
				</Button>
				{reason !== '' &&
					<Button variant="contained" color="primary" onClick={submitCancel}>
						Cancel Recurring
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
CancelContinuous.propTypes = {
	customerId: PropTypes.string.isRequired,
	orderId: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired
}
