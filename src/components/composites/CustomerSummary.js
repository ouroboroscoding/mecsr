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
import React, { useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Dialog components
import Claim from 'components/dialogs/Claim';

// Shared generic modules
import { datetime } from 'shared/generic/tools';

// Encounter types
const _encounter = {
	A: 'Audio',
	AS: 'Asynchronous',
	NA: 'Not Available',
	V: 'Video'
}

// CustomerSummary component
export default function CustomerSummary(props) {

	// State
	let [claim, claimSet] = useState(false);

	// If we're the one who claimed it
	let sClaimedBy = (props.userId === props.user.id) ? 'You' : props.claimedBy;

	// Order label
	let lLabel = props.orderLabel.split(' - ');
	let sLabel = (props.attentionRole === 'Doctor' ? 'Provider' : props.attentionRole) +
				(lLabel.length === 2 ? ' - ' + lLabel[1] : '')

	// Render
	return (
		<React.Fragment>
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
						<p>{datetime(props.createdAt)}</p>
					</Grid>
				</Grid>
			</Paper>
			{claim &&
				<Claim
					continuous={props.continuous || 0}
					customerId={props.customerId.toString()}
					customerName={props.customerName}
					customerPhone={props.customerPhone}
					defaultType="Follow Up"
					onClose={() => claimSet(false)}
					orderId={props.orderId}
					provider={0}
				/>
			}
		</React.Fragment>
	);
}

// Force props
CustomerSummary.propTypes = {
	customerId: PropTypes.number.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	orderId: PropTypes.string.isRequired
}

// Default props
CustomerSummary.defaultTypes = {}
