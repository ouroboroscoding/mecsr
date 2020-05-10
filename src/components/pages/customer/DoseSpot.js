/**
 * DoseSpot
 *
 * Shows a specific customer's prescriptions from DoseSpot
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-10
 */

// NPM modules
import React from 'react';

// Material UI
import Paper from '@material-ui/core/Paper';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

// DoseSpot component
export default class DoseSpot extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			rx: null
		}
	}

	fetch(id, clinician) {
		if(id) {
			this.fetchPatientId(id, clinician);
		} else {
			this.setState({rx: 0})
		}
	}

	fetchPatientId(id, clinician) {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/dsid', {
			customerId: id
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// If there's an id
				if(res.data) {
					this.fetchRx(res.data, clinician);
				} else {
					this.setState({rx: 0});
				}
			}
		});
	}

	fetchRx(id, clinician) {

		// Find the MIP using the phone number
		Rest.read('dosespot', 'patient/prescriptions', {
			patient_id: parseInt(id, 10),
			clinician_id: parseInt(clinician, 10)
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the state
				this.setState({
					rx: res.data
				});
			}
		});
	}

	render() {

		// If there's no rx associated
		if(this.state.rx === 0) {
			return <p>No Prescriptions found for this phone number</p>
		}

		// If we're still loading
		else if(this.state.rx === null) {
			return <p>Loading...</p>
		}

		// Else, show the rx
		else {
			return (
				<React.Fragment>
					{this.state.rx.map((o, i) =>
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
}
