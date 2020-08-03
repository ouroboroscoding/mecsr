/**
 * WellDyne AdHoc
 *
 * Create, edit, and delete adhoc records
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
import AdHocDef from '../../../definitions/welldyne/adhoc';
AdHocDef['__react__'] = {
	"primary": "id",
	"create": ["crm_type", "crm_id", "crm_order", "type"],
	"results": ["crm_type", "crm_id", "customer_name", "crm_order", "type", "user_name"]
}
AdHocDef['customer_name'] = {"__type__": "string", "__react__": {"title": "Name"}}
AdHocDef['user_name'] = {"__type__": "string", "__react__": {"title": "Agent"}}

// Generate the Tree
const AdHocTree = new Tree(AdHocDef);

/**
 * AdHoc
 *
 * Wraps common code that both tabs use
 *
 * @name GenericWellDyne
 * @extends React.Component
 */
export default function AdHoc(props) {

	// State
	let [records, recordsSet] = useState(null);
	let [create, createSet] = useState(false);

	// Fetch records effect
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'welldyne_adhoc', 'read')) {
				fetchRecords();
			} else {
				recordsSet(-1);
			}
		} else {
			recordsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Track triggers effect
	useEffect(() => {
		Events.add('adhocCreated', createSuccess);
		return () => {Events.remove('adhocCreated', createSuccess)}
	}, []);

	function createSuccess(record) {
		recordsSet(records => {
			let ret = Tools.clone(records);
			ret.unshift(record);
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
		Rest.read('welldyne', 'adhocs', {}).done(res => {

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
		results = <div>You lack the rights to view AdHoc records.</div>
	} else {
		results = <ResultsComponent
					data={records}
					noun="adhoc"
					orderBy="title"
					remove={Utils.hasRight(props.user, 'welldyne_adhoc', 'delete') ? removeRecord : false}
					service="welldyne"
					tree={AdHocTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="pageHeader">
				<div className="title">AdHoc Records</div>
				{Utils.hasRight(props.user, 'welldyne_adhoc', 'create') &&
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
						noun="adhoc"
						service="welldyne"
						success={createSuccess}
						title="Create New"
						tree={AdHocTree}
						type="create"
					/>
				</Paper>
			}
			{results}
		</React.Fragment>
	);
}
