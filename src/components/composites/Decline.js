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
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Decline
export default function Decline(props) {

	// Submite notes / resolve conversation
	function submit(reason) {

		// Decline the order
		Rest.update('monolith', 'order/decline', {
			orderId: props.orderId,
			reason: reason
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to update order status in Konnektive, please try again or contact support');
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				props.onSubmit();
			}
		});
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
				<Typography>Choose the reason for the decline:</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} md={4}>
						<Button color="primary" onClick={e => submit('Duplicate Order')} variant="contained">Duplicate Order</Button>
					</Grid>
					<Grid item xs={12} md={4}>
						<Button color="primary" onClick={e => submit('Current Customer')} variant="contained">Customer Request</Button>
					</Grid>
					<Grid item xs={12} md={4}>
						<Button color="primary" onClick={e => submit('Contact Attempt')} variant="contained">Contact Attempt</Button>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Decline.propTypes = {
	orderId: PropTypes.string.isRequired,
	onCancel: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired
}
