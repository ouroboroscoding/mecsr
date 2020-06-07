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

	// If we're still loading
	if(props.prescriptions === null) {
		return <p>Loading...</p>
	}

	// If there's no rx associated
	else if(props.prescriptions === 0 || props.prescriptions.length === 0) {
		return <p>No Prescriptions found for this customer</p>
	}

	// Else, show the rx
	else {
		return (
			<React.Fragment>
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
}
