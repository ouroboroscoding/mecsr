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
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// CancelContinuous
export default function CancelContinuous(props) {

	// Submite notes / resolve conversation
	function submit(reason) {

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
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				props.onSubmit(reason === 'Medication Switch');
			}
		});
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
				<Grid container spacing={2}>
					<Grid item xs={12} md={6} xl={3}>
						<Button color="primary" onClick={e => submit('Current Customer')} variant="contained">Customer Request</Button>
					</Grid>
					<Grid item xs={12} md={6} xl={3}>
						<Button color="primary" onClick={e => submit('Contact Attempt')} variant="contained">Contact Attempt</Button>
					</Grid>
					<Grid item xs={12} md={6} xl={3}>
						<Button color="primary" onClick={e => submit('Medication Switch')} variant="contained">Medication Switch*</Button>
					</Grid>
					<Grid item xs={12}>
						<Typography>* This will switch the current order claim to a regular customer claim so you can continue with the customer and create the new order</Typography>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Do Not Cancel Purchase
				</Button>
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
