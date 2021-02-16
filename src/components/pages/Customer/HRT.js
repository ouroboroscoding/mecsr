/**
 * HRT
 *
 * Shows data related to HRT
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-05
 */

// NPM modules
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { empty } from 'shared/generic/tools';

/**
 * Lab Results
 *
 * @name LabResults
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function LabResults(props) {

	// State
	let [results, resultsSet] = useState(0);

	// Mount effect
	useEffect(() => {
		if(props.user) {
			labResultsFetch();
		} else {
			resultsSet([]);
		}
	// eslint-disable-next-line
	}, [props.user])

	// Fetch Lab Results
	function labResultsFetch() {

		//Find the HRT Lab Test Resutls using the customerId
		Rest.read('monolith', 'customer/hrtLabs', {
			customerId: props.customerId.toString()
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				resultsSet(res.data);
			}
		});
	}

	// Render
	return (
		<Box className="labResults">
			<Box className="sectionHeader">
				<Box className="title">HRT Lab Results</Box>
			</Box>
			{results === 0 ?
				<Typography>Loading...</Typography>
			:
				<React.Fragment>
					{results.length === 0 ?
						<Typography>No results found for this customer</Typography>
					:
						<React.Fragment>
							{results.map(o =>
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
							)}
						</React.Fragment>
					}
				</React.Fragment>
			}
		</Box>
	);
}

/**
 * Patient
 *
 * Displays patient record
 *
 * @name Patient
 * @access private
 * @param Object props Attributes sent to component
 * @returns React.Component
 */
function Patient(props) {

	// State
	let [drop, dropSet] = useState(false);
	let [patient, patientSet] = useState(0);

	// Refs
	let refReason = useRef();

	// Mount effect
	useEffect(() => {
		if(props.user) {
			patientFetch();
		} else {
			patientSet({});
		}
	// eslint-disable-next-line
	}, [props.user])

	// Called when dropped button clicked
	function dropShow(ev) {

		// Set drop to true to show loading
		dropSet(true);

		// Fetch the dropped reasons from the server
		Rest.read('monolith', 'hrt/dropped/reasons', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				dropSet(res.data);
			}
		})
	}

	function dropSubmit(ev) {

		// Get the dropped reason
		let iReason = refReason.current.value;

		console.log('reason:', iReason);

		// Send the request to the server
		Rest.update('monolith', 'customer/hrt', {
			customerId: props.customerId.toString(),
			stage: 'Dropped',
			processStatus: 'Dropped',
			dropped_reason: iReason
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// If we were successful
				if(res.data) {
					Events.trigger('success', 'Successfully dropped the patient from HRT');
					patientFetch();
					dropSet(false);
				} else {
					Events.trigger('error', 'There was an error saving the data');
				}
			}
		})
	}

	// Fetch the patient record
	function patientFetch() {

		// Make the request to the server
		Rest.read('monolith', 'customer/hrt', {
			customerId: props.customerId.toString()
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1104) {
					patientSet({});
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				patientSet(res.data);

				// If dropped is set, but there's no reason
				if(res.data.stage === 'Dropped' && res.data.dropped_reason === null) {
					dropShow();
				}
			}
		});
	}

	// Render
	return (
		<Box className="patient">
			<Box className="sectionHeader">
				<Box className="title">HRT Patient</Box>
			</Box>
			{patient === 0 ?
				<Typography>Loading...</Typography>
			:
				<React.Fragment>
					{empty(patient) ?
						<Typography>No record found for this customer</Typography>
					:
						<Paper className="padded">
							<Grid container spacing={2}>
								<Grid item xs={12} md={6} lg={3}><strong>Joined Date: </strong>{patient.joinDate}</Grid>
								<Grid item xs={12} md={6} lg={3}><strong>Stage: </strong>{patient.stage}</Grid>
								<Grid item xs={12} md={6} lg={3}><strong>Status: </strong>{patient.processStatus}</Grid>
								<Grid item xs={12} md={6} lg={3}><strong>First Lab Sent: </strong>{patient.labSentAt}</Grid>
								{patient.treatment_cycle &&
									<Grid item xs={12} md={6} lg={3}><strong>Treatment Cycle: </strong>{patient.treatment_cycle}</Grid>
								}
								{patient.stage === 'Dropped' &&
									<Grid item xs={12} md={6} lg={3}><strong>Dropped Reason: </strong>{patient.reason}</Grid>
								}
								{patient.stage !== 'Dropped' && drop === false &&
									<Grid item xs={12}>
										<Button onClick={dropShow} variant="contained">Mark as Dropped</Button>
									</Grid>
								}
								{drop &&
									<Grid item xs={12}>
										{drop === true ?
											<Typography>Loading reasons...</Typography>
										:
											<React.Fragment>
												<Select
													native
													inputRef={refReason}
													variant="outlined"
												>
													{drop.map(o =>
														<option key={o.id} value={o.id}>{o.name}</option>
													)}
												</Select>
												<Button color="primary" onClick={dropSubmit} variant="contained">Drop</Button>
											</React.Fragment>
										}
									</Grid>
								}
							</Grid>
						</Paper>
					}
				</React.Fragment>
			}
		</Box>
	);
}

/**
 * HRT
 *
 * Return HRT related data
 *
 * @name HRT
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function HRT(props) {

	// Render
	return (
		<Box className="hrtTab">
			<Patient
				customerId={props.customerId}
				user={props.user}
			/>
			<LabResults
				customerId={props.customerId}
				user={props.user}
			/>
		</Box>
	);
}
