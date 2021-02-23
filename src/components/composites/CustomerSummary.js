/**
 * Customer Summary
 *
 * Shows a pending Order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-24
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Encounter types
const _encounter = {
	A: 'Audio',
	AS: 'Asynchronous',
	NA: 'Not Available',
	V: 'Video'
}

// CustomerSummary component
export default function CustomerSummary(props) {

	function claim() {
		props.onClaim(props.customerId, props.orderId, props.continuous || 0, props.customerName, props.customerPhone);
	}

	// If we're the one who claimed it
	let sClaimedBy = (props.userId === props.user.id) ? 'You' : props.claimedBy;

	// Order label
	let lLabel = props.orderLabel.split(' - ');
	let sLabel = (props.attentionRole === 'Doctor' ? 'Provider' : props.attentionRole) +
				(lLabel.length === 2 ? ' - ' + lLabel[1] : '')

	// Render
	return (
		<Paper className="summary">
			<Grid container spacing={3}>
				<Grid item xs={12} sm={2}>
					{props.claimedAt ?
						<p>Claimed by {sClaimedBy}</p>
					:
						<p><Button variant="contained" color="primary" size="large" onClick={claim}>Claim</Button></p>
					}
				</Grid>
				<Grid item xs={12} sm={5}>
					<Typography variant="h6">Customer</Typography>
					<p>{props.customerId}</p>
					<p>{props.customerName}</p>
					<p>{props.shipCity + ', ' + props.shipState + (props.encounter === '' ? '' : ' / ' + _encounter[props.encounter])}</p>
				</Grid>
				<Grid item xs={12} sm={5} className="messages">
					<Typography variant="h6">Order</Typography>
					<p>{props.continuous && 'C-'}{props.type.toUpperCase()} - {props.orderId}</p>
					<p>{sLabel}</p>
					<p>{props.createdAt}</p>
				</Grid>
			</Grid>
		</Paper>
	);
}

// Force props
CustomerSummary.propTypes = {
	customerId: PropTypes.number.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	orderId: PropTypes.string.isRequired
}

// Default props
CustomerSummary.defaultTypes = {}
