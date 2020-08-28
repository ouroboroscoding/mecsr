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
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

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

// Misc component
export default function Misc(props) {

	// State
	let [calendly, calendlySet] = useState(null);
	let [patient, patientSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			console.log(process.env);

			if(Utils.hasRight(props.user, 'patient_account', 'read')) {
				patientFetch();
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
			<React.Fragment>
				<div className="pageHeader">
					<div className="title">Calendly Appointments</div>
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
					{!props.readOnly &&
						<span> <Button color="primary" onClick={patientCreate} variant="contained">Send Setup Email</Button></span>
					}
				</p>
			);
		} else {
			inner = (
				<Paper className="padded">
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}><strong>Activated: </strong><span>{patient.active ? 'Yes' : 'No'}</span></Grid>
						<Grid item xs={12} md={6}><strong>Email: </strong><span>{patient.email}</span></Grid>
						<Grid item xs={12} md={6}><strong>CRM: </strong><span>{_CRM_TYPE[patient.crm_type]} / {patient.crm_id}</span></Grid>
						{patient.rx_type &&
							<Grid item xs={12} md={6}><strong>RX: </strong><span>{_RX_TYPE[patient.rx_type]} / {patient.rx_id}</span></Grid>
						}
					</Grid>
				</Paper>
			);
		}

		// Header + content
		patientElement = (
			<React.Fragment>
				<div className="pageHeader">
					<div className="title">Patient Portal</div>
				</div>
				{inner}
			</React.Fragment>
		)
	}

	// Render
	return (
		<React.Fragment>{[
			calendlyElement,
			patientElement
		]}
		</React.Fragment>
	);
}
