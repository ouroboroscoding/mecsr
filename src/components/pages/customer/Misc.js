/**
 * Misc
 *
 * Shows data that doesn't fit a specific tab
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-21
 */

// NPM modules
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import RefreshIcon from '@material-ui/icons/Refresh';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import { clone } from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// CRM and RX Types
const _CRM_TYPE = {
	knk: 'Konnektive',
	mems: 'MeMS'
}
const _RX_TYPE = {
	ds: 'DoseSpot',
	ana: 'Anazao'
}

// Stop flags
const _STOP_FLAGS = [
	{flag: 'sales', title: 'Sales'},
	{flag: 'support', title: 'Support'},
	{flag: 'batch', title: 'Batch Campaigns'},
	{flag: 'doctor', title: 'Provider'}
]

// Misc component
export default function Misc(props) {

	// State
	let [attempts, attemptsSet] = useState([]);
	let [calendly, calendlySet] = useState(null);
	let [patient, patientSet] = useState(null);
	let [stops, stopsSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			if(Utils.hasRight(props.user, 'patient_account', 'read')) {
				patientFetch();
			}
			if(Utils.hasRight(props.user, 'csr_messaging', 'create')) {
				stopsFetch();
			}
			if(Utils.hasRight(props.user, 'calendly', 'read')) {
				calendlyFetch();
			}
		} else {
			calendlySet([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Fetch any calendly appointments associated with the current customer
	function calendlyFetch() {

		// Request the appointments
		Rest.read('monolith', 'customer/calendly', {
			customerId: props.crm_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				calendlySet(res.data);
			}
		});
	}

	// Fetch the failed attempts to setup the account
	function patientAttempts(key) {

		// Clear the current attempts
		attemptsSet([]);

		// Request the attempts
		Rest.read('patient', 'setup/attempts', {
			key: key
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				attemptsSet(res.data);
			}
		});
	}

	// Send the customer the patient portal access setup email
	function patientCreate() {

		// Init the data to the request
		let oData = {
			crm_type: 'knk',
			crm_id: props.crm_id,
			url: 'https://' + process.env.REACT_APP_MEPP_DOMAIN + '/#key=s'
		}

		// If we have a patient ID
		if(props.patient_id) {
			oData['rx_type'] = 'ds';
			oData['rx_id'] = props.patient_id;
		}

		// Request the setup start
		Rest.create('csr', 'patient/account', oData).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1910) {
					Events.trigger('error', 'Customer\'s DOB is invalid. Please verify DOB in MIP and if necessary, contact customer to get valid DOB.');
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				Events.trigger('success', 'Customer should receive setup email momentarily.');
				patientFetch();
			}
		});
	}

	// Fetch the patient account if one exists for the current customer
	function patientFetch() {

		// Request the account
		Rest.read('patient', 'account/byCRM', {
			crm_type: 'knk',
			crm_id: props.crm_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				patientSet(res.data);

				// If there are failed attempts
				if(res.data && res.data.attempts !== null) {
					patientAttempts(res.data._id);
				}
			}
		});
	}

	// Reset the failed attempts count
	function patientReset(key) {

		// Request the attempts
		Rest.update('patient', 'setup/reset', {
			key: key
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if(res.data) {

				// Clone the current patient, reset the count, and set the
				//	state
				let oPatient = clone(patient);
				oPatient.attempts = 0;
				patientSet(oPatient);
			}
		});
	}

	function stopChange(event, service) {

		// Clone the stops
		let oStops = clone(stops);

		// If we are adding the stop flag to the service
		if(event.target.checked) {

			// Send the request to the server
			Rest.create('monolith', 'customer/stop', {
				phoneNumber: props.phoneNumber,
				service: service
			}).done(res => {

				// If there's an error or warning
				if(res.error && !Utils.restError(res.error)) {
					Events.trigger('error', JSON.stringify(res.error));
				}
				if(res.warning) {
					Events.trigger('warning', JSON.stringify(res.warning));
				}

				// If there's data, set the state
				if(res.data) {

					// Add the flag
					oStops[service] = props.user.id;

					// Set the new state
					stopsSet(oStops);
				}
			});
		}

		// Else, we are removing the stop flag from the service
		else {

			// Send the request to the server
			Rest.delete('monolith', 'customer/stop', {
				phoneNumber: props.phoneNumber,
				service: service
			}).done(res => {

				// If there's an error or warning
				if(res.error && !Utils.restError(res.error)) {
					if(res.error.code === 1509) {
						Events.trigger('error', "Can't remove STOP set by customer");
					} else {
						Events.trigger('error', JSON.stringify(res.error));
					}
				}
				if(res.warning) {
					Events.trigger('warning', JSON.stringify(res.warning));
				}

				// If there's data, set the state
				if(res.data) {

					// Remove the flag
					delete oStops[service];

					// Set the new state
					stopsSet(oStops);
				}
			});
		}
	}

	function stopsFetch() {

		// Request the account
		Rest.read('monolith', 'customer/stops', {
			phoneNumber: props.phoneNumber
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				stopsSet(res.data);
			}
		});
	}

	// Calendly elements
	let calendlyElement = null;

	// If the user has rights to view calendly
	if(Utils.hasRight(props.user, 'calendly', 'read')) {

		// If we're still loading
		let inner = null
		if(calendly === null) {
			inner = <p>Loading...</p>
		} else if(calendly.length === 0) {
			inner = <p>No appointments found</p>
		} else {
			inner = (
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							<TableCell>Starts at</TableCell>
							<TableCell>Ends at</TableCell>
							<TableCell>Provider Name</TableCell>
							<TableCell>Provider E-mail</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{calendly.map(o =>
							<TableRow key={o.id}>
								<TableCell>{o.start}</TableCell>
								<TableCell>{o.end}</TableCell>
								<TableCell>{o.prov_name}</TableCell>
								<TableCell>{o.prov_emailAddress}</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			)
		}

		// Header + content
		calendlyElement = (
			<React.Fragment key="calendly">
				<div className="pageHeader">
					<div className="title">Calendly Appointments</div>
				</div>
				{inner}
			</React.Fragment>
		)
	}

	// SMS Stop elements
	let stopsElement = null;

	// If the user has rights to view calendly
	if(Utils.hasRight(props.user, 'csr_messaging', 'create')) {

		// If we're still loading
		let inner = null
		if(stops === null) {
			inner = <p>Loading...</p>
		} else {
			inner = (
				<Grid container spacing={2}>
					{_STOP_FLAGS.map(o =>
						<Grid item xs={12} sm={6} md={3}>
							<Switch
								checked={o.flag in stops}
								disabled={stops[o.flag] === null}
								color="secondary"
								onChange={ev => stopChange(ev, o.flag)}
							/>
							{o.title}
						</Grid>
					)}
				</Grid>
			);
		}

		// Header + content
		stopsElement = (
			<React.Fragment key="stops">
				<div className="pageHeader">
					<div className="title">SMS Stop flags (Twilio)</div>
				</div>
				{inner}
			</React.Fragment>
		)

	}

	// Patient Portal elements
	let patientElement = null;

	// If the user has rights to view patient
	if(Utils.hasRight(props.user, 'patient_account', 'read')) {

		// If we're still loading
		let inner = null
		if(patient === null) {
			inner = <p>Loading...</p>
		} else if(patient === false) {
			inner = (
				<p>
					Customer has no patient portal access.
					{(!props.readOnly && Utils.hasRight(props.user, 'patient_account', 'create')) &&
						<span> <Button color="primary" onClick={patientCreate} variant="contained">Send Setup Email</Button></span>
					}
				</p>
			);
		} else {
			inner = (
				<Paper className="padded">
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}><strong>CRM: </strong><span>{_CRM_TYPE[patient.crm_type]} / {patient.crm_id}</span></Grid>
						<Grid item xs={12} md={6}><strong>RX: </strong>{patient.rx_type !== null && <span>{_RX_TYPE[patient.rx_type]} / {patient.rx_id}</span>}</Grid>
						<Grid item xs={12} md={6}>
							<span style={{verticalAlign: 'middle'}}>
								<strong>Activated: </strong>
								{patient.activated ? 'Yes' : 'No / ' + patient.attempts + ' attempts '}
							</span>
							{!patient.activated && patient.attempts > 0 &&
								<Tooltip title="Reset Attempts">
									<IconButton onClick={() => patientReset(patient._id)}>
										<RotateLeftIcon />
									</IconButton>
								</Tooltip>
							}
						</Grid>
						<Grid item xs={12} md={6}><strong>Email: </strong><span>{patient.email}</span></Grid>
						{patient.attempts !== null &&
							<React.Fragment>
								<Grid item xs={12}>
									<strong style={{verticalAlign: 'middle'}}>Failed Attempts: </strong>
									<Tooltip title="Refresh Attempts List">
										<IconButton onClick={() => patientAttempts(patient._id)}>
											<RefreshIcon />
										</IconButton>
									</Tooltip>
								</Grid>
								{attempts.map(o =>
									<React.Fragment>
										<Grid item xs={12} md={4}><strong>Date:</strong> {Utils.datetime(o._created)}</Grid>
										<Grid item xs={12} md={4}><strong>DOB:</strong> "{o.dob}"</Grid>
										<Grid item xs={12} md={4}><strong>Last Name:</strong> "{o.lname}"</Grid>
									</React.Fragment>
								)}
							</React.Fragment>
						}
					</Grid>
				</Paper>
			);
		}

		// Header + content
		patientElement = (
			<Box key="patient" className="patient">
				<div className="pageHeader">
					<div className="title">Patient Portal</div>
				</div>
				{inner}
			</Box>
		)
	}

	// Render
	return (
		<React.Fragment>{[
			calendlyElement,
			<hr />,
			stopsElement,
			<hr />,
			patientElement
		]}
		</React.Fragment>
	);
}
