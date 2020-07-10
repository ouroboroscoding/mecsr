/**
 * WellDyne Outreach
 *
 * Created, edit, and delete outreach records
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-09
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';

// Format Components
import ResultsComponent from '../../format/Results';
import FormComponent from '../../format/Form';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Definitions
import OutreachDef from '../../../definitions/welldyne/outreach';
OutreachDef['__react__'] = {
	"primary": "id",
	"create": ["customerId", "queue", "reason", "ready"],
	"results": ["customerId", "customerName", "queue", "reason", "userName", "ready"]
}
OutreachDef['customerName'] = {"__type__": "string", "__react__": {"title": "Customer"}}
OutreachDef['userName'] = {"__type__": "string", "__react__": {"title": "User"}}

// Generate the Tree
const OutreachTree = new Tree(OutreachDef);

/**
 * Outreach
 *
 * Wraps common code that both tabs use
 *
 * @name GenericWellDyne
 * @extends React.Component
 */
export default function Outreach(props) {

	// State
	let [records, recordsSet] = useState(null);
	let [create, createSet] = useState(false);

	// Effects
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'welldyne_outreach', 'read')) {
				fetchRecords();
			} else {
				recordsSet(-1);
			}
		} else {
			recordsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function createSuccess(template) {
		console.log(template);
		recordsSet(records => {
			let ret = Tools.clone(records);
			ret.unshift(template);
			return ret;
		});
		createSet(false);
	}

	// Toggle the create form
	function createToggle() {
		createSet(b => !b);
	}

	// Fetch all the records from the server
	function fetchRecords() {

		// Fetch all records
		Rest.read('welldyne', 'outreachs', {}).done(res => {

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

				// Set the records
				recordsSet(res.data);
			}
		});
	}

	function readyRender(id, value) {
		return (
			<Checkbox
				color="primary"
				checked={value ? true : false}
				onChange={readyToggle}
				inputProps={{
					"data-id": id
				}}
			/>
		)
	}

	function readyToggle(event) {

		// Get the ID and ready flag
		let iID = parseInt(event.currentTarget.dataset.id);
		let bReady = event.currentTarget.checked

		// Send the request to the service
		Rest.update("welldyne", "outreach/ready", {
			"id": iID,
			"ready": bReady ? 1 : 0
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

				// Clone the records
				let lRecords = Tools.clone(records);

				// Find the index
				let iIndex = Tools.afindi(lRecords, 'id', iID);

				// If one is found, update the ready flag
				if(iIndex > -1) {
					lRecords[iIndex]['ready'] = bReady;
				}

				// Update the records
				recordsSet(lRecords);
			}
		})
	}

	// Remove a template
	function removeRecord(id) {

		// Use the current records to set the new records
		recordsSet(records => {

			// Clone the records
			let ret = Tools.clone(records);

			// Find the index
			let iIndex = Tools.afindi(ret, 'id', id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new records
			return ret;
		});
	}

	// Figure out results
	let results = ''
	if(records === null) {
		results = <div>Loading...</div>
	} else if(records === -1) {
		results = <div>You lack the rights to view Outreach records.</div>
	} else {
		results = <ResultsComponent
					custom={{"ready": readyRender}}
					data={records}
					noun="outreach"
					orderBy="title"
					remove={Utils.hasRight(props.user, 'welldyne_outreach', 'delete') ? removeRecord : false}
					service="welldyne"
					tree={OutreachTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="pageHeader">
				<div className="title">Outreach Records</div>
				{Utils.hasRight(props.user, 'welldyne_outreach', 'create') &&
					<Tooltip title="Create new template">
						<IconButton onClick={createToggle}>
							<AddCircleIcon />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Paper className="padded">
					<FormComponent
						cancel={createToggle}
						noun="outreach"
						service="welldyne"
						success={createSuccess}
						title="Create New"
						tree={OutreachTree}
						type="create"
					/>
				</Paper>
			}
			{results}
		</React.Fragment>
	);
}
