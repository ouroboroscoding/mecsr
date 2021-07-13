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
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddIcon from '@material-ui/icons/Add';

// Local modules
import LabResultAdd from './HRT_LabResultAdd';

// Shared components
import HormoneSymptoms from 'shared/components/monolith/HormoneSymptoms';
import LabResults from 'shared/components/monolith/LabResults';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, empty } from 'shared/generic/tools';

// Constants
const _ACTIVATE_PATIENT = {
	Onboarding: ['Purchased Lab Kit', 'Watched Video', 'Ordered Lab Kit', 'Shipped Lab Kit', 'Delivered Lab Kit', 'Received Lab Results', 'Sent H2 Questions and Calendly', 'Received H2', 'Received Calendly', 'Created $0 Pending', 'Missed Calendly', 'PSA Retest Sent', 'PSA Retest Received', 'Hold'],
	Optimizing: ['Provider Approval', 'PSA Retest Sent']
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
	let [mode, modeSet] = useState(false);
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

	// Called when activate button clicked
	function activateShow() {

		// Get the first stage
		let sStage = Object.keys(_ACTIVATE_PATIENT)[0];

		// Set to activate form
		modeSet({
			type: 'form',
			which: 'activate',
			stage: sStage,
			status: _ACTIVATE_PATIENT[sStage][0]
		});
	}

	// Called when either of the activating drop downs are changed
	function activateChange(which, value) {

		// Make sure we have the latest state
		modeSet(mode => {

			// If the stage changed
			if(which === 'stage') {
				mode.stage = value;
				mode.status = _ACTIVATE_PATIENT[value][0];
			}

			// Else, if the status changed
			else {
				mode.status = value;
			}

			// Return a clone
			return clone(mode);
		});
	}

	// Called when activate stage/status submitted
	function activateSubmit(ev) {

		// Send the request to the server
		Rest.update('monolith', 'customer/hrt', {
			customerId: props.customerId.toString(),
			stage: mode.stage,
			processStatus: mode.status,
			dropped_reason: null
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1001) {
					Events.trigger('error', 'There is an error processing the HRT table, this error is most likely due to changes in Memo that were not passed on to the CS team. Please contact Charlotte devs to resolve this issue.')
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// If we were successful
				if(res.data) {
					Events.trigger('success', 'Successfully activate the patient for HRT');
					patientFetch();
				} else {
					Events.trigger('error', 'There was an error saving the data');
				}
			}
		})

	}

	// Called when dropped button clicked
	function dropShow(ev) {

		// Set drop to true to show loading
		modeSet({
			type: 'form',
			which: 'drop',
			list: false
		});

		// Fetch the dropped reasons from the server
		Rest.read('monolith', 'hrt/dropped/reasons', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				modeSet({
					type: 'form',
					which: 'drop',
					list: res.data
				});
			}
		});
	}

	// Called when dropped reason is submitted
	function dropSubmit(ev) {

		// Get the dropped reason
		let iReason = refReason.current.value;

		// Send the request to the server
		Rest.update('monolith', 'customer/hrt', {
			customerId: props.customerId.toString(),
			stage: 'Dropped',
			processStatus: 'Dropped',
			dropped_reason: iReason
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1001) {
					Events.trigger('error', 'There is an error processing the HRT table, this error is most likely due to changes in Memo that were not passed on to the CS team. Please contact Charlotte devs to resolve this issue.')
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
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
				} else {
					Events.trigger('error', 'There was an error saving the data');
				}
			}
		});
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
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the mode to button
				modeSet({
					type: 'button',
					which: res.data.stage === 'Dropped' ? 'activate' : 'drop'
				});

				// Set the patient data
				patientSet(res.data);
			}
		});
	}

	// Figure out the drop/undrop section
	let oMode = null;
	if(mode !== false) {

		// If we need to show a button
		if(mode.type === 'button') {
			if(mode.which === 'drop') {
				oMode = <Button onClick={dropShow} variant="contained">Mark as Dropped</Button>
			} else {
				oMode = <Button onClick={activateShow} variant="contained">Mark as Active</Button>
			}
		}

		// Else if we need to show a form
		else {
			if(mode.which === 'drop') {
				if(mode.list === false) {
					oMode = <Typography>Loading reasons...</Typography>
				} else {
					oMode = (
						<React.Fragment>
							<Select inputRef={refReason} native variant="outlined">
								{mode.list.map(o =>
									<option key={o.id} value={o.id}>{o.name}</option>
								)}
							</Select>&nbsp;
							<Button color="primary" onClick={dropSubmit} variant="contained">Drop</Button>
						</React.Fragment>
					);
				}
			} else {
				oMode = (
					<React.Fragment>
						<Select native onChange={ev => activateChange('stage', ev.target.value)} value={mode.stage} variant="outlined">
							{Object.keys(_ACTIVATE_PATIENT).map(s => <option key={s}>{s}</option>)}
						</Select>&nbsp;
						<Select native onChange={ev => activateChange('status', ev.target.value)} value={mode.status} variant="outlined">
							{_ACTIVATE_PATIENT[mode.stage].map(s => <option key={s}>{s}</option>)}
						</Select>&nbsp;
						<Button color="primary" onClick={activateSubmit} variant="contained">Activate</Button>
					</React.Fragment>
				);
			}
		}
	}

	// Render
	return (
		<Box className="patient">
			<Box className="section_header">
				<Typography className="title">Status</Typography>
			</Box>
			<Paper className="padded">
				{patient === 0 ?
					<Typography>Loading...</Typography>
				:
					<React.Fragment>
						{empty(patient) ?
							<Typography>No record found for this customer.</Typography>
						:
							<Grid container spacing={2}>
								<Grid item xs={12} md={6} lg={3}><strong>Joined Date: </strong>{patient.joinDate ? patient.joinDate.split(' ')[0] : ''}</Grid>
								<Grid item xs={12} md={6} lg={3}><strong>Stage: </strong>{patient.stage}</Grid>
								<Grid item xs={12} md={6} lg={3}><strong>Status: </strong>{patient.processStatus}</Grid>
								{patient.labSentAt &&
									<Grid item xs={12} md={6} lg={3}><strong>First Lab Sent: </strong>{patient.labSentAt.split(' ')[0]}</Grid>
								}
								{patient.treatment_cycle &&
									<Grid item xs={12} md={6} lg={3}><strong>CHRT Due: </strong>{patient.treatment_cycle.split(' ')[0]}</Grid>
								}
								{patient.stage === 'Dropped' &&
									<Grid item xs={12} md={6} lg={3}><strong>Dropped Reason: </strong>{patient.reason}</Grid>
								}
								<Grid item xs={12}>{oMode}</Grid>
							</Grid>
						}
					</React.Fragment>
				}
			</Paper>
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

	// State
	let [labCreate, labCreateSet] = useState(false);

	// Render
	return (
		<Box className="hrtTab">
			<Patient
				customerId={props.customerId}
				user={props.user}
			/>
			<Box className="section_header">
				<Typography className="title">Lab Results</Typography>
				<Box className="actions">
					<Tooltip title="Add Lab Results">
						<IconButton onClick={ev => labCreateSet(val => !val)}>
							<AddIcon />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>
			{labCreate ?
				<LabResultAdd
					cancel={ev => labCreateSet(false)}
					customerId={props.customerId}
					success={() => labCreateSet(false)}
				/>
			:
				<LabResults
					className="hrtLabResults"
					customerId={props.customerId.toString()}
				/>
			}
			<Box className="section_header">
				<Typography className="title">Assessment Levels</Typography>
			</Box>
			<HormoneSymptoms
				className="hrtAssessmentLevels"
				customerId={props.customerId.toString()}
			/>
		</Box>
	);
}
