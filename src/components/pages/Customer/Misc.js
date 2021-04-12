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
import Tree from 'format-oc/Tree'
import React, { useEffect, useRef, useState } from 'react';

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
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';

// Shared Format Components
import { Form } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import {
	clone,
	datetime,
	nicePhone
} from 'shared/generic/tools';

// Agent Definition
import SetupDef from 'definitions/patient/account_setup';
SetupDef['__react__'] = {
	update: ['email', 'lname', 'dob']
}

// Generate the agent Tree
const SetupTree = new Tree(clone(SetupDef));

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

/**
 * Calendly
 *
 * Displays calendly appointments
 *
 * @name Calendly
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Calendly(props) {

	// State
	let [results, resultsSet] = useState(null);

	// User effect
	useEffect(() => {
		if(props.user) {
			if(Rights.has('calendly', 'read')) {
				fetch();
			} else {
				resultsSet(-1);
			}
		} else {
			resultsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]);

	// Fetch calendly appointments
	function fetch() {

		// Request the appointments
		Rest.read('monolith', 'customer/calendly', {
			customerId: props.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				resultsSet(res.data);
			}
		});
	}

	// If we're still loading
	let inner = null
	if(results === null) {
		inner = <span>Loading...</span>
	} else if(results === -1) {
		inner = <span>No rights to view appointments</span>
	} else if(results.length === 0) {
		inner = <span>No appointments found</span>
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
					{results.map(o =>
						<TableRow key={o.id}>
							<TableCell>{datetime(o.start, '-')}</TableCell>
							<TableCell>{datetime(o.end, '-')}</TableCell>
							<TableCell>{o.prov_name}</TableCell>
							<TableCell>{o.prov_emailAddress}</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		)
	}

	// Render
	return (
		<Box className="calendly">
			<Box className="section_header">
				<Typography className="title">Calendly Appointments</Typography>
			</Box>
			<Paper className="padded">
				{inner}
			</Paper>
		</Box>
	);
}

/**
 * EVerify
 *
 * Displays E-Verifications info and photos
 *
 * @name EVerify
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function EVerify(props) {

	// State
	let [results, resultsSet] = useState(null);
	let [ssn, ssnSet] = useState(false);

	// User effect
	useEffect(() => {
		if(props.user) {
			if(Rights.has('everify', 'read')) {
				fetch();
			} else {
				resultsSet(-1);
			}
		} else {
			resultsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user])

	// Fetch the e-verification data
	function fetch() {

		// Request the data from the server
		Rest.read('monolith', 'customer/everify', {
			customerId: props.customerId.toString()
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	// Show SSN then hide it again in 5 seconds
	function ssnShow() {
		ssnSet(true);
		setTimeout(() => ssnSet(false), 5000);
	}

	// If we're still loading
	let inner = null
	if(results === null) {
		inner = <span>Loading...</span>
	} else if(results === -1) {
		inner = <span>No rights to view e-verification</span>
	} else if(results === false) {
		inner = <span>No information found</span>
	} else {
		inner = (
			<React.Fragment>
				<Grid container spacing={2}>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Outcome</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>{results.identiFloOutcome}</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6} style={{color: 'red'}}>{results.identiFloErrorMessage}</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Last Check</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>{results.lastIdentiFloAt}</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6}>&nbsp;</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Address</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>
							{results.prefix} {results.firstName} {results.middleName} {results.lastName} {results.suffix}<br />
							{results.address1} {results.address2 && ', ' + results.address2}<br />
							{results.city}, {results.state}, {results.country}<br />
							{results.zipCode}
						</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6}>
						<Typography>{results.idfResultAddress}</Typography>
					</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Phone Number</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>{nicePhone(results.primaryPhone)}</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6}>
						<Typography>{results.idfResultPhone}</Typography>
					</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Date Of Birth</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>{nicePhone(results.dateOfBirth)}</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6}>
						<Typography>{results.idfResultDateOfBirth}</Typography>
					</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>SSN</strong></Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={5}>
						<Typography>
							{results.ssn &&
								<React.Fragment>
									{ssn ?
										results.ssn
									:
										<Button size="small" onClick={ssnShow}>Show SSN</Button>
									}
								</React.Fragment>
							}
						</Typography>
					</Grid>
					<Grid item sm={12} md={5} lg={6}>
						<Typography>{results.idfResultSocialSecurity}</Typography>
					</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>Selfie</strong></Typography>
					</Grid>
					<Grid item sm={12} md={10} lg={11}>
						{results.images.selfie &&
							<img alt="selfie" src={results.images.selfie} style={{width: '100%'}} />
						}
					</Grid>
					<Grid item sm={12} md={2} lg={1}>
						<Typography><strong>ID</strong></Typography>
					</Grid>
					<Grid item sm={12} md={10} lg={11}>
						{results.images.idScan &&
							<img alt="idScan" src={results.images.idScan} style={{width: '100%'}} />
						}
					</Grid>
				</Grid>
			</React.Fragment>
		);
	}

	// Render
	return (
		<Box className="everify">
			<Box className="section_header">
				<Typography className="title">E-Verification</Typography>
			</Box>
			<Paper className="padded">
				{inner}
			</Paper>
		</Box>
	);
}

/**
 * Patient
 *
 * Displays patient portal access
 *
 * @name Patient
 * @acces private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Patient(props) {

	// State
	let [attempts, attemptsSet] = useState([]);
	let [emailUpdate, emailUpdateSet] = useState(false);
	let [patient, patientSet] = useState(null);
	let [patientUpdate, patientUpdateSet] = useState(false);

	// Refs
	let emailRef = useRef();

	// User effect
	useEffect(() => {
		if(props.user) {
			if(Rights.has('patient_account', 'read')) {
				patientFetch();
			} else {
				patientSet(-1);
			}
		} else {
			patientSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]);

	// Fetch the failed attempts to setup the account
	function attemptsFetch(key) {

		// Clear the current attempts
		attemptsSet([]);

		// Request the attempts
		Rest.read('patient', 'setup/attempts', {
			key: key
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
	function create() {

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
			if(res.error && !res._handled) {
				if(res.error.code === 1910) {
					Events.trigger('error', 'Customer\'s DOB is invalid. Please verify DOB in MIP and if necessary, contact customer to get valid DOB.');
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				patientSet(res.data);

				// If there are failed attempts
				if(res.data && res.data.attempts !== null) {
					attemptsFetch(res.data._id);
				}
			}
		});
	}

	// Reset the failed attempts count
	function reset(key) {

		// Request the attempts
		Rest.update('patient', 'setup/reset', {
			key: key
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	// Called after setup is updated successfully
	function setupUpdated(values) {

		// Clone the data
		let oPatient = clone(patient);

		// For each changed value
		for(let k in values) {
			oPatient[k] = values[k];
		}

		// Store the new state and hide the edit form
		patientSet(oPatient);
		patientUpdateSet(false);
	}

	// Update email address
	function updateEmail() {

		// Get the email
		let sEmail = emailRef.current.value.trim();

		// If it's empty
		if(sEmail === '') {
			Events.trigger('error', 'Email must have some value');
			return;
		}

		// Tell the server
		Rest.update('patient', 'account/email', {
			_id: patient._id,
			email: sEmail,
			url: 'https://' + process.env.REACT_APP_MEPP_DOMAIN + '/verify#key='
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1900) {
					Events.trigger('error', 'E-mail address already in use');
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if(res.data) {
				patientSet(patient => {
					patient.email = sEmail;
					return clone(patient);
				})
				emailUpdateSet(false);
			}
		});
	}

	// If we're still loading
	let inner = null
	if(patient === null) {
		inner = <span>Loading...</span>
	} else if(patient === -1) {
		inner = <span>No rights to view patient portal access.</span>
	} else if(patient === false) {
		inner = (
			<span>
				Customer has no patient portal access.
				{(!props.readOnly && Rights.has('patient_account', 'create')) &&
					<span> <Button color="primary" onClick={create} variant="contained">Send Setup Email</Button></span>
				}
			</span>
		);
	} else {
		inner = (
			<React.Fragment>
				{patientUpdate ?
					<Form
						beforeSubmit={values => {
							values.url = 'https://' + process.env.REACT_APP_MEPP_DOMAIN + '/#key=s';
							return values;
						}}
						cancel={() => patientUpdateSet(false)}
						errors={{
							1900: "E-mail address already in use"
						}}
						noun="setup/update"
						service="patient"
						success={setupUpdated}
						title={false}
						tree={SetupTree}
						type="update"
						value={patient}
					/>
				:
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
									<IconButton onClick={() => reset(patient._id)}>
										<RotateLeftIcon />
									</IconButton>
								</Tooltip>
							}
						</Grid>
						<Grid item xs={12} md={6}>
							{emailUpdate ?
								<React.Fragment>
									<TextField
										defaultValue={patient.email}
										inputRef={emailRef}
										label="E-mail Address"
										placeholder="E-mail Address"
										variant="outlined"
									/>
									<Button color="primary" onClick={updateEmail} variant="contained">Submit</Button>
								</React.Fragment>
							:
								<React.Fragment>
									<strong>Email: </strong><span>{patient.email}</span>
									{patient.activated &&
										<Tooltip title="Edit e-mail address">
											<IconButton onClick={() => emailUpdateSet(true)} style={{padding: '0', marginLeft: '10px'}}>
												<EditIcon />
											</IconButton>
										</Tooltip>
									}
								</React.Fragment>
							}
						</Grid>
						{!patient.activated &&
							<React.Fragment>
								<Grid item xs={12} md={6}><strong>Last Name: </strong><span>{patient.lname}</span></Grid>
								<Grid item xs={12} md={6}><strong>DOB: </strong><span>{patient.dob}</span></Grid>
								<Grid item xs={12}><strong>Setup Link: </strong><span>{'https://' + process.env.REACT_APP_MEPP_DOMAIN + '/#key=s' + patient._id}</span></Grid>
							</React.Fragment>
						}
						{patient.attempts !== null &&
							<React.Fragment>
								<Grid item xs={12}>
									<strong style={{verticalAlign: 'middle'}}>Failed Attempts: </strong>
									<Tooltip title="Refresh Attempts List">
										<IconButton className="nopadding" onClick={() => attempts(patient._id)}>
											<RefreshIcon />
										</IconButton>
									</Tooltip>
								</Grid>
								{attempts.map(o =>
									<React.Fragment>
										<Grid item xs={12} md={4}><strong>Date:</strong> {datetime(o._created, '-')}</Grid>
										<Grid item xs={12} md={4}><strong>DOB:</strong> "{o.dob}"</Grid>
										<Grid item xs={12} md={4}><strong>Last Name:</strong> "{o.lname}"</Grid>
									</React.Fragment>
								)}
							</React.Fragment>
						}
					</Grid>
				}
			</React.Fragment>
		);
	}

	// Render
	return (
		<Box key="patient" className="patient">
			<Box className="section_header">
				<Typography className="title">Patient Portal&nbsp;</Typography>
				{patient && !patient.activated && Rights.has('patient_account', 'update') &&
					<Tooltip title="Edit Setup Values">
						<IconButton className="edit" onClick={() => patientUpdateSet(b => !b)}>
							<EditIcon />
						</IconButton>
					</Tooltip>
				}
			</Box>
			<Paper className="padded">
				{inner}
			</Paper>
		</Box>
	)
}

/**
 * Stops
 *
 * Displays STOP flags for the given phone number
 *
 * @name Stops
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Stops(props) {

	// State
	let [flags, flagsSet] = useState(null);

	// User effect
	useEffect(() => {
		if(props.user) {
			fetch();
		} else {
			flagsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]);

	function change(event, service) {

		// If the user has the right to change the stop
		if(Rights.has('csr_messaging', 'create')) {

			// Clone the flags
			let oFlags = clone(flags);

			// If we are adding the stop flag to the service
			if(event.target.checked) {

				// Send the request to the server
				Rest.create('monolith', 'customer/stop', {
					phoneNumber: props.phoneNumber,
					service: service
				}).done(res => {

					// If there's an error or warning
					if(res.error && !res._handled) {
						Events.trigger('error', Rest.errorMessage(res.error));
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}

					// If there's data, set the state
					if(res.data) {

						// Add the flag
						oFlags[service] = props.user.id;

						// Set the new state
						flagsSet(oFlags);
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
					if(res.error && !res._handled) {
						if(res.error.code === 1509) {
							Events.trigger('error', "Can't remove STOP set by customer");
						} else {
							Events.trigger('error', Rest.errorMessage(res.error));
						}
					}
					if(res.warning) {
						Events.trigger('warning', JSON.stringify(res.warning));
					}

					// If there's data, set the state
					if(res.data) {

						// Remove the flag
						delete oFlags[service];

						// Set the new state
						flagsSet(oFlags);
					}
				});
			}
		}
	}

	function fetch() {

		// Request the account
		Rest.read('monolith', 'customer/stops', {
			phoneNumber: props.phoneNumber
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the state
			if('data' in res) {
				flagsSet(res.data);
			}
		});
	}

	// If we're still loading
	let inner = null
	if(flags === null) {
		inner = <span>Loading...</span>
	} else {
		inner = (
			<Grid container spacing={2}>
				{_STOP_FLAGS.map(o =>
					<Grid key={o.flag} item xs={12} sm={6} md={3}>
						<Switch
							checked={o.flag in flags}
							disabled={flags[o.flag] === null}
							color="secondary"
							onChange={ev => change(ev, o.flag)}
						/>
						{o.title}
					</Grid>
				)}
			</Grid>
		);
	}

	// Render
	return (
		<Box className="smsStops">
			<Box className="section_header">
				<Typography className="title">SMS Stop flags (Twilio)</Typography>
			</Box>
			<Paper className="padded">
				{inner}
			</Paper>
		</Box>
	);
}

/**
 * Misc
 *
 * Displays the different sections that don't fit anywhere else in the customer
 * tabs
 *
 * @name Misc
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Misc(props) {

	// CRM ID
	let crm_id = props.crm_id || false;

	// Render
	return (
		<Box className="misc">
			{crm_id &&
				<Calendly
					customerId={crm_id}
					user={props.user}
				/>
			}
			<Stops
				phoneNumber={props.phoneNumber}
				user={props.user}
			/>
			{crm_id &&
				<Patient
					crm_id={crm_id}
					user={props.user}
				/>
			}
			{crm_id &&
				<EVerify
					customerId={crm_id}
					user={props.user}
				/>
			}
		</Box>
	);
}
