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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared data modules
import DoseSpotData from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, date, datetime, nicePhone } from 'shared/generic/tools';

/**
 * Continuous
 *
 * Shows continuous records if there are any
 *
 * @name Continuous
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Continuous(props) {

	// State
	let [records, recordsSet] = useState(false);

	// Load effect
	useEffect(() => {

		// If we have a user
		if(props.user) {

			// Fetch all the records
			Rest.read('monolith', 'customer/continuous', {
				customerId: parseInt(props.customerId, 0)
			}).done(res => {
				if(res.error && !res._handled) {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
				if(res.data && res.data.length) {
					recordsSet(res.data);
				}
			});
		}

	}, [props.customerId, props.user])

	// If there's no records
	if(!records) {
		return null;
	}

	// Render
	return (
		<Box>
			<Box className="section_header">
				<Typography className="title">Continuous ED</Typography>
			</Box>
			{records.map(o => {

				// Generate the order / purchase string
				let sPurchase = `for order ${o.orderId}, purchase ${o.purchaseId}. `;

				// Init the string
				let sText = 'Customer has ';
				let sURL = false;

				// If it's active
				if(o.active) {
					sText += 'a completed C-ED MIP ';
					if(o.medsNotWorking) {
						sText += '(MEDS NOT WORKING) ';
					}
					sText += ` created on ${date(o.createdAt)} ${sPurchase}`

					// If it's approved
					if(o.status === 'COMPLETE') {
						sText += `It has been approved by ${o.providerName} on ${date(o.updatedAt)}.`;
					} else {
						sText += 'It has not yet been approved.';
					}
				}

				// Else, if it's incomplete
				else {
					sText += ` an incomplete C-ED MIP created on ${date(o.createdAt)} ${sPurchase}`
					sURL = `https://www.maleexcelmip.com/mip/cont/ced?formId=MIP-CED&ktCustomerId=${props.customerId}`;
				}

				return (
					<Paper key={o.purchaseId} className="padded">
						<Typography>{sText}</Typography>
						{sURL &&
							<Typography>{sURL}</Typography>
						}
					</Paper>
				);
			})}
		</Box>
	);
}

/**
 * Dose Spot
 *
 * @name DoseSpot
 * @access private
 * @param Object props Parameters passed to the component
 * @return React.Component
 */
function DoseSpot(props) {

	// State
	let [sso, ssoSet] = useState(false);

	// Refs
	let rxTitle = useRef();

	// Toggle the SSO iframe
	function ssoToggle() {

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
			DoseSpotData.sso(props.patientId).then(data => {

				// Set the SSO
				ssoSet(data);

				// Scroll to the iframe
				setTimeout(() => {
					rxTitle.current.scrollIntoView({ behavior: "smooth"});
				}, 200);

			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});
		}
	}

	// DoseSpot SSO
	let bSSO = (props.dsClinicianId !== '' && !props.readOnly) ? true : false;

	// Details
	let details = null;
	if(!sso) {
		if(props.details === null) {
			details = <Typography>Loading...</Typography>
		}
		else if(props.details === 0) {
			details = (
				<React.Fragment>
					<span style={{verticalAlign: 'middle'}}>No DoseSpot account for this patient</span>
					{props.create &&
						<Tooltip title="Create Account">
							<IconButton onClick={props.onDsCreate}>
								<AddIcon />
							</IconButton>
						</Tooltip>
					}
				</React.Fragment>
			);
		}
		else {
			details = (
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Typography style={{display: 'inline-block'}}><strong>{props.details.FirstName} {props.details.LastName}</strong></Typography>
						{props.create &&
							<Tooltip title="Sync with Konnektive Customer">
								<IconButton onClick={props.onDsUpdate}>
									<RotateLeftIcon />
								</IconButton>
							</Tooltip>
						}
					</Grid>
					<Grid item xs={12} md={6}>
						<Typography>{nicePhone(props.details.PrimaryPhone)}</Typography>
						<Typography>{props.details.Email}</Typography>
						<Typography>{props.details.DateOfBirth.substring(0, 10)}</Typography>
					</Grid>
					<Grid item xs={12} md={6}>
						<Typography>{props.details.Address1 + (props.details.Address2 ? ', ' + props.details.Address2 : '')}</Typography>
						<Typography>{props.details.City + ', ' + props.details.State}</Typography>
						<Typography>{props.details.ZipCode}</Typography>
					</Grid>
				</Grid>
			);
		}
	}

	// Prescriptions
	let prescriptions = null;
	if(!sso) {
		if(props.patientId) {
			if(props.prescriptions === null) {
				prescriptions = <Paper className="padded"><Typography>Loading...</Typography></Paper>
			}
			else if(props.prescriptions.length === 0) {
				prescriptions = <Paper className="padded"><Typography>No prescriptions found for this customer</Typography></Paper>
			}
			else {
				prescriptions = (
					<React.Fragment>
						{props.prescriptions.map(o =>
							<Paper key={o.PrescriptionId} className="padded">
								<Grid container spacing={2}>
									<Grid item xs={12} md={4}><strong>ID: </strong><span>{o.PrescriptionId}</span></Grid>
									<Grid item xs={12} md={4}><strong>Pharmacy: </strong><span>{o.PharmacyName}</span></Grid>
									<Grid item xs={12} md={4}><strong>Prescriber: </strong><span>{o.PrescriberName}</span></Grid>
									<Grid item xs={12} md={4}><strong>Product: </strong><span>{o.DisplayName} ({o.Quantity})</span></Grid>
									<Grid item xs={12} md={o.EffectiveDate ? 4 : 8}><strong>Written: </strong><span>{datetime(o.WrittenDate)}</span></Grid>
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
		}
	}

	// Render
	return (
		<Box>
			<Box className="section_header">
				<Typography className="title" ref={rxTitle}>DoseSpot</Typography>
				{bSSO &&
					<Box className="actions">
						{!sso &&
							<Tooltip title="Refresh">
								<IconButton onClick={props.onRefresh}>
									<RefreshIcon />
								</IconButton>
							</Tooltip>
						}
						{props.patientId !== 0 &&
							<Tooltip title="Toggle DoseSpot SSO">
								<IconButton onClick={ssoToggle}>
									{sso ? <CloseIcon /> : <EditIcon />}
								</IconButton>
							</Tooltip>
						}
					</Box>
				}
			</Box>
			{sso ?
				<iframe
					height={window.innerHeight - 190}
					src={sso}
					title="DoseSpot SSO"
					width="100%"
				/>
			:
				<React.Fragment>
					<Paper className="padded">
						{details}
					</Paper>
					{prescriptions}
				</React.Fragment>
			}
		</Box>
	);
}

/**
 * Pharmacy Fill
 *
 * @name PharmacyFill
 * @access private
 * @param Object props Parameters passed to the component
 * @return React.Component
 */
function PharmacyFill(props) {

	// Refs
	let fillOrder = useRef();

	// Handle pharmacy fill request
	function fillAdd() {
		props.onPharmacyFill(fillOrder.current.value);
	}

	// Find valid orders for manual fill if the user has rights and we're not
	//	in read-only mode
	let lManualOrders = [];
	if(props.create && !props.readOnly) {

		// If we have orders, pharmacy fill, and triggers
		if(props.orders && props.fills && props.errors && props.triggers) {

			// Go through the orders
			for(let o of props.orders) {

				// If the order exists in manual fills
				if( props.fills &&
					props.fills.length > 0 &&
					afindi(props.fills, 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If the order exists in fill errors
				if( props.errors &&
					props.errors.length > 0 &&
					afindi(props.errors, 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If the order exists in triggers
				if( props.triggers &&
					props.triggers.length > 0 &&
					afindi(props.triggers, 'crm_order', o.orderId) > -1) {
					continue;
				}

				// If we didn't find it yet, add it to the list
				lManualOrders.push(o.orderId);
			}
		}
	}

	// If we have fill and can create
	let fill = null;
	if(props.fills.length > 0 || lManualOrders.length > 0) {
		fill = (
			<React.Fragment key="fills">
				<Box className="section_header">
					<Typography className="title">Manual Pharmacy Fill</Typography>
				</Box>
				{props.fills.map(o =>
					<Paper key={o._id} className="padded">
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{o.crm_order}</span></Grid>
							<Grid item xs={12} md={4}><strong>Agent: </strong><span>{o.user_name}</span></Grid>
							<Grid item xs={12} md={4}><strong>Created: </strong><span>{date(o._created, '-')}</span></Grid>
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
	if(props.errors.length > 0) {
		errors = (
			<React.Fragment key="errors">
				<Box className="section_header">
					<Typography className="title">Pharmacy Fill Errors</Typography>
				</Box>
				{props.errors.map(o =>
					<Paper key={o._id} className="padded">
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}><strong>KNK Order: </strong><span>{o.crm_order}</span></Grid>
							<Grid item xs={12} md={4}><strong>Type: </strong><span>{o.list}</span></Grid>
							<Grid item xs={12} md={4}><strong>Reason: </strong><span>{o.reason}</span></Grid>
							<Grid item xs={12} md={4}><strong>Fail Count: </strong><span>{o.fail_count}</span></Grid>
							<Grid item xs={12} md={4}><strong>{o._created === o._updated ? 'Failed' : 'First Failure'}: </strong><span>{date(o._created, '-')}</span></Grid>
							{o._created !== o._updated &&
								<Grid item xs={12} md={4}><strong>Most Recent: </strong><span>{date(o._updated, '-')}</span></Grid>
							}
						</Grid>
					</Paper>
				)}
			</React.Fragment>
		);
	}

	// Render
	return [fill, errors];
}

/**
 * Trigger
 *
 * @name Trigger
 * @access private
 * @param Object props Parameters passed to the component
 * @return React.Component
 */
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
			dates = <React.Fragment>
				<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{date(props.triggered, '-')}</span></Grid>
				<Grid item xs={12} md={4}><strong>Cancelled: </strong><span>{props.cancelled.split(' ')[0]}</span></Grid>
				<Grid item xs={12} md={4}><strong>Shipped: </strong><span>{props.shipped.split(' ')[0]}</span></Grid>
			</React.Fragment>;
		} else {
			dates = <React.Fragment>
				<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{date(props.triggered, '-')}</span></Grid>
				<Grid item xs={12} md={8}><strong>Cancelled: </strong><span>{props.cancelled.split(' ')[0]}</span></Grid>
			</React.Fragment>;
		}
	} else if(props.shipped) {
		dates = <React.Fragment>
			<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{date(props.triggered, '-')}</span></Grid>
			<Grid item xs={12} md={4}><strong>Opened: </strong><span>{props.opened ? props.opened.split(' ')[0] : ''}</span></Grid>
			<Grid item xs={12} md={4}><strong>Shipped: </strong><span>{props.shipped.split(' ')[0]}</span></Grid>
		</React.Fragment>
	} else if(props.opened) {
		dates = <React.Fragment>
			<Grid item xs={12} md={4}><strong>Triggered: </strong><span>{date(props.triggered, '-')}</span></Grid>
			<Grid item xs={12} md={4}><strong>Opened: </strong><span>{props.opened.split(' ')[0]}</span></Grid>
			<Grid item xs={12} md={4}><strong>Opened Stage: </strong><span>{props.opened_state}</span></Grid>
		</React.Fragment>
	} else {
		dates = <Grid item xs={12} md={12}><strong>Triggered: </strong><span>{date(props.triggered, '-')}</span></Grid>
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
				{(props.adhoc_type === null && props.onAdhocAdd && !props.readOnly) &&
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

/**
 * Triggers
 *
 * @name Triggers
 * @access private
 * @param Object props Parameters passed to the component
 * @return React.Component
 */
function Triggers(props) {

	// Render
	return (
		<React.Fragment>
			<Box className="section_header">
				<Typography className="title">WellDyneRX Triggers</Typography>
			</Box>
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

/**
 * RX
 *
 * @name RX
 * @access public
 * @param Object props Parameters passed to the component
 * @return React.Component
 */
export default function RX(props) {

	// Render
	return (
		<Box>
			<Continuous
				customerId={props.customerId}
				readOnly={props.readOnly}
				user={props.user}
			/>
			{props.pharmacyFill &&
				<PharmacyFill
					create={Rights.has('pharmacy_fill', 'create')}
					errors={props.pharmacyFill['errors']}
					fills={props.pharmacyFill['fills']}
					onPharmacyFill={props.onPharmacyFill}
					orders={props.orders}
					triggers={props.triggers}
				/>
			}
			{props.triggers && props.triggers.length > 0 &&
				<Triggers
					onAdhocAdd={Rights.has('welldyne_adhoc', 'create') ? props.onAdhocAdd : false}
					triggers={props.triggers}
				/>
			}
			{props.patientId !== null &&
				<DoseSpot
					dsClinicianId={props.user.dsClinicianId}
					create={Rights.has('prescriptions', 'create')}
					details={props.details}
					onDsCreate={props.onDsCreate}
					onDsUpdate={props.onDsUpdate}
					onRefresh={props.onRefresh}
					patientId={props.patientId}
					prescriptions={props.prescriptions}
					readOnly={props.readOnly}
				/>
			}
		</Box>
	);
}
