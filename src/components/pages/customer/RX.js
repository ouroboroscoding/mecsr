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
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

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

	let dates = null;

	// If the order has been cancelled
	if(props.cancelled) {

		// If it was somehow shipped anyway
		if(props.shipped) {
			dates = [
				<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>,
				<Grid item xs={12} md={4}><strong>Cancelled: </strong><span>{props.cancelled.split(' ')[0]}</span></Grid>,
				<Grid item xs={12} md={4}><strong>Shipped: </strong><span>{props.shipped.split(' ')[0]}</span></Grid>
			];
		} else {
			dates = [
				<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>,
				<Grid item xs={12} md={8}><strong>Cancelled: </strong><span>{props.cancelled.split(' ')[0]}</span></Grid>
			];
		}
	} else if(props.shipped) {
		dates = [
			<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>,
			<Grid item xs={12} md={4}><strong>Opened: </strong><span>{props.opened ? props.opened.split(' ')[0] : ''}</span></Grid>,
			<Grid item xs={12} md={4}><strong>Shipped: </strong><span>{props.shipped.split(' ')[0]}</span></Grid>
		]
	} else if(props.opened) {
		dates = [
			<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>,
			<Grid item xs={12} md={4}><strong>Opened: </strong><span>{props.opened.split(' ')[0]}</span></Grid>,
			<Grid item xs={12} md={4}><strong>Opened Stage: </strong><span>{props.opened_state}</span></Grid>
		]
	} else {
		dates = <Grid item xs={12} md={12}><strong>Triggered: </strong><span>{Utils.date(props.triggered, '-')}</span></Grid>
	}

	return (
		<Paper className="padded">
			<Grid container spacing={2}>
				<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{props.crm_order}</span></Grid>
				<Grid item xs={12} md={4}><strong>DoseSpot ID: </strong><span>{props.rx_id}</span></Grid>
				<Grid item xs={12} md={4}><strong>Medication: </strong><span>{props.medication}</span></Grid>

				{dates}
				<Grid item xs={12} md={4}><strong>Eligible Since: </strong><span>{props.elig_since ? props.elig_since.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12} md={8}><strong>Eligible Through: </strong><span>{props.elig_thru ? props.elig_thru.split(' ')[0] : ''}</span></Grid>
				<Grid item xs={12}><strong>Raw: </strong><span>{props.raw}</span></Grid>
				{(props.outbound_queue || props.outbound_reason) &&
					<React.Fragment>
						<Grid item xs={12}><strong>Outbound: </strong><span>{props.outbound_queue} ({props.outbound_reason})</span></Grid>
					</React.Fragment>
				}
				{props.never_started &&
					<Grid item xs={12}><strong>Never Started: </strong><span>{props.never_started}</span></Grid>
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
	let fillOrder = useRef();

	// Find valid orders for manual fill if the user has rights and we're not
	//	in read-only mode
	let lManualOrders = [];
	if(Utils.hasRight(props.user, 'pharmacy_fill', 'create') && !props.readOnly) {

		// If we have orders, pharmacy fill, and triggers
		if(props.orders && props.pharmacyFill && props.triggers) {

			// Go through the orders
			for(let o of props.orders) {

				// If the order exists in manual fills
				if( props.pharmacyFill &&
					props.pharmacyFill['fills'].length > 0 &&
					Tools.afindi(props.pharmacyFill['fills'], 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If the order exists in fill errors
				if( props.pharmacyFill &&
					props.pharmacyFill['errors'].length > 0 &&
					Tools.afindi(props.pharmacyFill['errors'], 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If the order exists in triggers
				if( props.triggers &&
					props.triggers.length > 0 &&
					Tools.afindi(props.triggers, 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If we didn't find it yet, add it to the list
				lManualOrders.push(o.orderId);
			}
		}
	}

	function fillAdd() {

		// Let the parent know
		props.onPharmacyFill(fillOrder.current.value);
	}

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
	let pharmacyFill = null;
	if(props.pharmacyFill === null) {
		pharmacyFill = <p>Loading...</p>
	} else {

		// If we have fill and can create
		let fill = null;
		if(props.pharmacyFill['fills'].length > 0 || lManualOrders.length > 0) {
			fill = (
				<React.Fragment key="fills">
					<div className="title">Manual Pharmacy Fill</div>
					{props.pharmacyFill['fills'].map(o =>
						<Paper key={o._id} className="padded">
							<Grid container spacing={2}>
								<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{o.crm_order}</span></Grid>
								<Grid item xs={12} md={4}><strong>Agent: </strong><span>{o.user_name}</span></Grid>
								<Grid item xs={12} md={4}><strong>Created: </strong><span>{Utils.date(o._created, '-')}</span></Grid>
							</Grid>
						</Paper>
					)}
					{lManualOrders.length > 0 &&
						<Paper className="padded">
							<strong>Add Order: </strong>
							<Select
								inputRef={fillOrder}
								native
							>
								{lManualOrders.map(s =>
									<option key={s}>{s}</option>
								)}
							</Select>
							<Button variant="contained" color="primary" onClick={fillAdd} style={{height: '32px', marginLeft: '10px'}}>Add Manual Fill</Button>
						</Paper>
					}
				</React.Fragment>
			);
		}

		let errors = null;
		if(props.pharmacyFill['errors'].length > 0) {
			errors = (
				<React.Fragment>
					<div className="title">Pharmacy Fill Errors</div>
					{props.pharmacyFill['errors'].map(o =>
						<Paper key={o._id} className="padded">
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
			);
		}

		pharmacyFill = [fill, errors];
	}

	// Trigger
	let triggers = null;
	if(props.triggers === null) {
		triggers = <p>Loading...</p>
	}
	else if(props.triggers.length === 0) {
		triggers = null;
	}
	else {
		triggers = (
			<React.Fragment key="triggers">
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
	else if(props.prescriptions === 0) {
		prescriptions = (
			<p>
				<span style={{verticalAlign: 'middle'}}>No DoseSpot account for this patient</span>
				{Utils.hasRight(props.user, 'prescriptions', 'create') &&
					<Tooltip title="Create Account">
						<IconButton onClick={props.onDsCreate}>
							<AddIcon />
						</IconButton>
					</Tooltip>
				}
			</p>
		);
	}
	else if(props.prescriptions.length === 0) {
		prescriptions = <p>No prescriptions found for this customer</p>
	}
	else {
		prescriptions = (
			<React.Fragment key="rx">
				{props.prescriptions.map(o =>
					<Paper key={o.PrescriptionId} className="padded">
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

	// HRTLabs
	let hrtLabs = null;
	if (props.hrtLabs === null) {
		hrtLabs = <p>Loading...</p>;
	} else if (props.hrtLabs === 0 || props.hrtLabs.length === 0) {
		hrtLabs = <p>No HRT Lab Results found for this customer</p>;
	} else {
		hrtLabs = (
			<React.Fragment key="hrt">
				{props.hrtLabs.map((o) => (
					<Paper key={o.id} className='padded'>
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}>
								<strong>Sample Collection Date: </strong>
								<span>{new Date(o.sampleCollection).toLocaleString()}</span>
							</Grid>
							<Grid item xs={12} md={4}>
								<strong>Name: </strong>
								<span>{o.name}</span>
							</Grid>
							<Grid item xs={12} md={4}>
								<strong>Code: </strong>
								<span>{o.code}</span>
							</Grid>
							<Grid item xs={12} md={4}>
								<strong>Result: </strong>
								<span>{o.result} {o.unitOfMeasure}</span>
							</Grid>
							<Grid item xs={12} md={4}>
								<strong>Range: </strong>
								<span>{o.range}</span>
							</Grid>
							<Grid item xs={12} md={4}>
								<strong>Result Level: </strong>
								<span>{o.resultLevel}</span>
							</Grid>
						</Grid>
					</Paper>
				))}
			</React.Fragment>
		);
	}

	// DoseSpot SSO
	let bSSO = (props.patientId && (props.user.dsClinicianId !== '') && !props.readOnly) ? true : false;

	// Render
	return (
		<React.Fragment>
			{pharmacyFill}
			{triggers}
			<div className="pageHeader">
				<div ref={rxTitle} className="title">Prescriptions
					{bSSO &&
						<Tooltip title="Refresh Prescriptions">
							<IconButton onClick={props.onRefresh}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					}
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
			<hr/>
			<div className="pageHeader">
				<div className="title">HRT Lab Results</div>
			</div>
			{hrtLabs}
		</React.Fragment>
	);
}
