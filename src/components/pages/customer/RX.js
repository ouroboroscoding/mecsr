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
import React, { useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

// RX component
export default function RX(props) {

	// State
	let [sso, ssoSet] = useState(false);

	// Refs
	let rxTitle = useRef();
	let adhocType = useRef();

	// Toggle the SSO iframe
	function toggleSSO() {

		// If we have an SSO, hide the iframe
		if(sso) {
			ssoSet(false);
		}

		// Else fetch the SSO from the service
		else {

			// Request it from the server
			Rest.read('prescriptions', 'patient/sso', {
				patient_id: parseInt(props.patientId, 10),
				clinician_id: parseInt(props.user.dsClinicianId, 10)
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
				if(res.data) {
					ssoSet(res.data);
					setTimeout(() => {
						rxTitle.current.scrollIntoView({ behavior: "smooth"});
					}, 200);
				}
			});
		}
	}

	function adHocAdd() {

		// Let the parent know
		props.onAdhocAdd(adhocType.current.value);
	}

	// Trigger
	let trigger = null;
	if(props.trigger === null) {
		trigger = <p>Loading...</p>
	}
	else if(props.trigger === 0) {
		trigger = null;
	}
	else {
		trigger = (
			<React.Fragment>
				<div className="title">Latest WellDyne Trigger</div>
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
					{props.trigger.adhocType &&
						<p><strong>AdHoc Type: </strong><span>{props.trigger.adhocType}</span></p>
					}
					{(props.trigger.adhocType === null && Utils.hasRight(props.user, 'welldyne_adhoc', 'create')) &&
						<p><strong>AdHoc Type: </strong>
							<Select
								inputRef={adhocType}
								native
							>
								<option>Cancel Order</option>
								<option>Update Address</option>
							</Select>
							<Button variant="contained" color="primary" onClick={adHocAdd} style={{height: '32px', marginLeft: '10px'}}>Add</Button>
						</p>
					}
				</Paper>
			</React.Fragment>
		);
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

	// DoseSpot SSO
	let bSSO = (props.patientId && (props.user.dsClinicianId !== '')) ? true : false;

	// Render
	return (
		<React.Fragment>
			{trigger}
			<div className="pageHeader">
				<div ref={rxTitle} className="title">Prescriptions
					<Tooltip title="Refresh Prescriptions">
						<IconButton onClick={props.onRefresh}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</div>
				{bSSO &&
					<Tooltip title="Toggle DoseSpot SSO">
						<IconButton onClick={toggleSSO}>
							{sso ? <CloseIcon /> : <EditIcon />}
						</IconButton>
					</Tooltip>
				}
			</div>
			{sso &&
				<iframe
					height={window.innerHeight - 170}
					src={sso}
					title="DoseSpot SSO"
					width="100%"
				/>
			}
			{prescriptions}
		</React.Fragment>
	);
}
