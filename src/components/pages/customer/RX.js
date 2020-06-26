/**
 * RX
 *
 * Shows a specific customer's prescriptions
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-10
 */

// NPM modules
import React from 'react';

// Material UI
import Paper from '@material-ui/core/Paper';

// RX component
export default function RX(props) {

	// Trigger
	let trigger = null;
	if(props.trigger === null) {
		trigger = <p>Loading...</p>
	}
	else if(props.trigger === 0) {
		trigger = null;
	}
	else {
		trigger = [
			<div className="title">Latest WellDyne Trigger</div>,
			<Paper className="trigger">
				<p><strong>Triggered: </strong><span>{props.trigger.triggered.split(' ')[0]}</span></p>
				<p><strong>Opened: </strong><span>{props.trigger.opened ? props.trigger.opened.split(' ')[0] : ''}</span></p>
				<p><strong>Shipped: </strong><span>{props.trigger.shipped ? props.trigger.shipped.split(' ')[0] : ''}</span></p>
				<p><strong>Eligible Since: </strong><span>{props.trigger.eligSince ? props.trigger.eligSince.split(' ')[0] : ''}</span></p>
				<p><strong>Eligible Through: </strong><span>{props.trigger.eligThru ? props.trigger.eligThru.split(' ')[0] : ''}</span></p>
				{(props.trigger.outreachQueue || props.trigger.outreachReason) &&
					<React.Fragment>
						<p><strong>Outreach Queue: </strong><span>{props.trigger.outreachQueue}</span></p>
						<p><strong>Outreach Reason: </strong><span>{props.trigger.outreachReason}</span></p>
					</React.Fragment>
				}
			</Paper>
		];
	}

	// Prescriptions
	let prescriptions = null;
	if(props.prescriptions === null) {
		prescriptions = <p>Loading...</p>
	}
	else if(props.prescriptions === 0 || props.prescriptions.length === 0) {
		prescriptions = <p>No Prescriptions found for this customer</p>
	}
	else {
		prescriptions = (
			<React.Fragment>
				<div className="title">Prescriptions</div>
				{props.prescriptions.map((o, i) =>
					<Paper key={i} className="rx">
						<p><strong>Pharmacy: </strong><span>{o.PharmacyName}</span></p>
						<p><strong>Prescriber: </strong><span>{o.PrescriberName}</span></p>
						<p><strong>Product: </strong><span>{o.DisplayName} ({o.Quantity})</span></p>
						<p><strong>Written: </strong><span>{o.WrittenDate.substring(0, 10)}</span></p>
						{o.EffectiveDate &&
							<p><strong>Effective: </strong><span>{o.EffectiveDate.substring(0, 10)}</span></p>
						}
						<p><strong>Refills: </strong><span>{o.Refills}</span></p>
						<p><strong>Directions: </strong><span>{o.Directions}</span></p>
					</Paper>
				)}
			</React.Fragment>
		);
	}

	// Render
	return (
		<React.Fragment>
			{trigger}
			{prescriptions}
		</React.Fragment>
	);
}
