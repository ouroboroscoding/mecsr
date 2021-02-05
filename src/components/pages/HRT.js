/**
 * HRT
 *
 * Show HRT Patient breakdowns
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-05
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useEffect, useState } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';

// Data modules
import claimed from 'data/claimed';

// Shared Components
import ResultsComponent from 'shared/components/format/Results';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, empty, omap } from 'shared/generic/tools';

const HrtTree = new Tree({
	__name__: "HrtTree",
	claim: {__type__: "string"},
	customerId: {__type__: "string", __react__: {title: 'Customer ID'}},
	phoneNumber: {__type__: "string", __react__: {title: 'Phone Number'}},
	firstName: {__type__: "string", __react__: {title: 'First'}},
	lastName: {__type__: "string", __react__: {title: 'Last'}},
	campaignName: {__type__: "string", __react__: {title: 'Campaign'}}
});

/**
 * Patients
 *
 * Shows list of patients associated with a process status
 *
 * @name Patients
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Patients(props) {

	// State
	let [customers, customersSet] = useState(false);

	// User change effect
	useEffect(() => {
		if(props.user) {
			customersFetch();
		} else {
			customersSet([]);
		}
	// eslint-disable-next-line
	}, [props.user]);

	// Claim the customer
	function claim(customer) {

		// Get the claimed add promise
		claimed.add(customer.phoneNumber).then(res => {
			Events.trigger(
				'claimedAdd',
				customer.phoneNumber,
				customer.firstName + ' ' + customer.lastName,
				customer.customerId
			);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Customer has already been claimed.');
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Render the claim button
	function claimRender(customer) {
		return (
			<Button
				color="primary"
				onClick={ev => claim(customer)}
				variant="contained"
			>Claim</Button>
		)
	}

	// Fetch the list of customers in the status
	function customersFetch() {

		// Make the request to the server
		Rest.read('monolith', 'hrt/patients', {
			stage: props.stage,
			processStatus: props.status
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				customersSet(res.data);
			}
		});
	}

	console.log(props);

	// If we're still fetching
	if(!customers) {
		return <Typography>Loading...</Typography>
	}

	// Render
	return (
		<ResultsComponent
			custom={{"claim": claimRender}}
			data={customers}
			noun=""
			orderBy="lastName"
			remove={false}
			service=""
			tree={HrtTree}
			update={false}
		/>
	);
}

/**
 * Stage
 *
 * Handles displaying all process status in the given stage
 *
 * @name Stage
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Stage(props) {

	// State
	let [patients, patientsSet] = useState({});

	// Effects
	useEffect(() => {
		patientsSet(
			props.statuses.reduce((ret, o) => Object.assign(ret, {[o.status]: false}), {})
		)
	}, [props.stage, props.statuses])

	// Show/Hide patients
	function patientsToggle(status) {
		let oPatients = clone(patients);
		oPatients[status] = !oPatients[status];
		patientsSet(oPatients);
	}

	// Render
	return (
		<Box className="stage">
			<Box className="page_header">
				<Typography className="title">{props.stage} ({props.count})</Typography>
			</Box>
			{props.statuses.map(o =>
				<Paper className="padded">
					<Grid container spacing={0}>
						<Grid item xs={8}>{o.status}</Grid>
						<Grid item xs={2} style={{textAlign: 'right'}}>{o.count}</Grid>
						<Grid item xs={2} style={{textAlign: 'right'}}>
							<Button color="primary" variant="contained" onClick={ev => patientsToggle(o.status)}>
								{patients[o.status] ? 'Hide' : 'Show'}
							</Button>
						</Grid>
						<Grid item xs={12}>
							{patients[o.status] &&
								<Patients
									stage={props.stage}
									status={o.status}
									user={props.user}
								/>
							}
						</Grid>
					</Grid>
				</Paper>
			)}
		</Box>
	);
}

/**
 * HRT
 *
 * Shows breakdown of patient stats
 *
 * @name HRT
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function HRT(props) {

	// State
	let [tab, tabSet] = useState(false);
	let [stats, statsSet] = useState([]);

	// User change effect
	useEffect(() => {
		if(props.user) {
			statsFetch();
		} else {
			statsSet([]);
		}
	// eslint-disable-next-line
	}, [props.user]);

	// Stats change effect
	useEffect(() => {
		if(!empty(stats)) {
			tabChange(null, 0);
		}
	// eslint-disable-next-line
	}, [stats]);

	// Fetch all HRT stats
	function statsFetch() {

		// Make the request to the server
		Rest.read('monolith', 'hrt/stats', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Turn the list into a tree
				let oStats = {}
				for(let o of res.data) {

					// If we don't have the stage
					if(!(o.stage in oStats)) {
						oStats[o.stage] = {
							count: 0,
							statuses: []
						};
					}

					// Increase the count and store the status
					oStats[o.stage].count += o.count;
					oStats[o.stage].statuses.push({
						status: o.processStatus,
						count: o.count
					});
				}

				// Store the tree
				statsSet(oStats);
			}
		})
	}

	// When selected tab changes
	function tabChange(event, tab) {
		tabSet({
			stage: Object.keys(stats)[tab],
			index: tab
		});
	}

	// Render
	return (
		<Box id="hrt" className="page">
			<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab.index}
					variant="fullWidth"
				>
				{omap(stats, (o, k) =>
					<Tab label={k + ' (' + o.count + ')'} />
				)}
				</Tabs>
			</AppBar>
			{tab &&
				<Stage
					stage={tab.stage}
					user={props.user}
					{...stats[tab.stage]}
				/>
			}
		</Box>
	);
}
