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
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
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

// Trigger component
function Trigger(props) {

	// Refs
	let adhocType = useRef();

	function adHocAdd() {

		// Let the parent know
		props.onAdhocAdd(
			adhocType.current.value,
			props._id
		);
	}

	return (
		<Paper className="paper">
			<Grid container spacing={2}>
				<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{props.crm_order}</span></Grid>
				<Grid item xs={12} md={4}><strong>DoseSpot ID: </strong><span>{props.rx_id}</span></Grid>
				<Grid item xs={12} md={4}><strong>Medication: </strong><span>{props.medication}</span></Grid>
				<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>
				<Grid item xs={12} md={4}><strong>Opened: </strong><span>{props.opened ? props.opened.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12} md={4}><strong>Shipped: </strong><span>{props.shipped ? props.shipped.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12} md={4}><strong>Eligible Since: </strong><span>{props.elig_since ? props.elig_since.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12} md={8}><strong>Eligible Through: </strong><span>{props.elig_thru ? props.elig_thru.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12}><strong>Raw: </strong><span>{props.raw}</span></Grid>
				{(props.outbound_queue || props.outbound_reason) &&
					<React.Fragment>
						<Grid item xs={12}><strong>Outbound: </strong><span>{props.outbound_queue} ({props.outbound_reason})</span></Grid>
					</React.Fragment>
				}
				{props.adhoc_type &&

					<Grid item xs={12}><strong>AdHoc: </strong><span>{props.adhoc_type}</span></Grid>
				}
				{(props.adhoc_type === null && Utils.hasRight(props.user, 'welldyne_adhoc', 'create') && !props.readOnly) &&
					<Grid item xs={12}><strong>AdHoc Type: </strong>
						<Select
							inputRef={adhocType}
							native
						>
							<option>Cancel Order</option>
							<option>Extend Eligibility</option>
							<option>Update Address</option>
						</Select>
						<Button variant="contained" color="primary" onClick={adHocAdd} style={{height: '32px', marginLeft: '10px'}}>Add</Button>
					</Grid>
		}
			</Grid>
		</Paper>
	);
}

// RX component
export default function RX(props) {

	// State
	let [sso, ssoSet] = useState(false);

	// Refs
	let rxTitle = useRef();

	// Toggle the SSO iframe
	function toggleSSO() {

		// If read-only mode
		if(props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

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


	// Pharmacy Fill
	let fill = null;
	if(props.fillErrors === null) {
		fill = <p>Loading...</p>
	} else if(props.fillErrors.length === 0) {
		fill = null;
	} else {
		fill = (
			<React.Fragment>
				<div className="title">Pharmacy Fill Errors</div>
				{props.fillErrors.map(o =>
					<Paper key={o._id} className="paper">
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{o.crm_order}</span></Grid>
							<Grid item xs={12} md={4}><strong>Type: </strong><span>{o.list}</span></Grid>
							<Grid item xs={12} md={4}><strong>Reason: </strong><span>{o.reason}</span></Grid>
							<Grid item xs={12} md={4}><strong>Fail Count: </strong><span>{o.fail_count}</span></Grid>
							<Grid item xs={12} md={4}><strong>{o._created === o._updated ? 'Failed' : 'First Failure'}: </strong><span>{Utils.date(o._created, '-')}</span></Grid>
							{o._created !== o._updated &&
								<Grid item xs={12} md={4}><strong>Most Recent: </strong><span>{Utils.date(o._updated, '-')}</span></Grid>
							}
						</Grid>
					</Paper>
				)}
			</React.Fragment>
		)
	}

	// Trigger
	let triggers = null;
	if(props.triggers === null) {
		triggers = <p>Loading...</p>
	}
	else if(props.triggers === 0) {
		triggers = null;
	}
	else {
		triggers = (
			<React.Fragment>
				<div className="title">WellDyneRX Triggers</div>
				{props.triggers.map(o =>
					<Trigger
						key={o._id}
						onAdhocAdd={props.onAdhocAdd}
						readOnly={props.readOnly}
						user={props.user}
						{...o}
					/>
				)}
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
				{props.prescriptions.map(o =>
					<Paper key={o.PrescriptionId} className="paper">
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}><strong>ID: </strong><span>{o.PrescriptionId}</span></Grid>
							<Grid item xs={12} md={4}><strong>Pharmacy: </strong><span>{o.PharmacyName}</span></Grid>
							<Grid item xs={12} md={4}><strong>Prescriber: </strong><span>{o.PrescriberName}</span></Grid>
							<Grid item xs={12} md={4}><strong>Product: </strong><span>{o.DisplayName} ({o.Quantity})</span></Grid>
							<Grid item xs={12} md={o.EffectiveDate ? 4 : 8}><strong>Written: </strong><span>{o.WrittenDate.substring(0, 10)}</span></Grid>
							{o.EffectiveDate &&
								<Grid item xs={12} md={4}><strong>Effective: </strong><span>{o.EffectiveDate.substring(0, 10)}</span></Grid>
							}
							<Grid item xs={12} md={4}><strong>Status: </strong><span>{o.StatusText}</span></Grid>
							<Grid item xs={12} md={4}><strong>Medication Status: </strong><span>{o.MedicationStatusText}</span></Grid>
							<Grid item xs={12} md={4}><strong>Refills: </strong><span>{o.Refills}</span></Grid>
							<Grid item xs={12}><strong>Directions: </strong><span>{o.Directions}</span></Grid>
						</Grid>
					</Paper>
				)}
			</React.Fragment>
		);
	}

	// DoseSpot SSO
	let bSSO = (props.patientId && (props.user.dsClinicianId !== '') && !props.readOnly) ? true : false;

	// Render
	return (
		<React.Fragment>
			{fill}
			{triggers}
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
