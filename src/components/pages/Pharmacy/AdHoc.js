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
import Typography from '@material-ui/core/Typography';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Definitions
import AdHocDef from 'definitions/welldyne/adhoc';
AdHocDef['__react__'] = {
	"results": ["crm_id", "customer_name", "crm_order", "type", "user_name"]
}
AdHocDef['crm_id'] = {"__type__": "string", "__react__": {"title": "ID"}}
AdHocDef['customer_name'] = {"__type__": "string", "__react__": {"title": "Name"}}
AdHocDef['crm_order'] = {"__type__": "string", "__react__": {"title": "Order"}}
AdHocDef['user_name'] = {"__type__": "string", "__react__": {"title": "Agent"}}

// Generate the Tree
const AdHocTree = new Tree(AdHocDef);

/**
 * AdHoc
 *
 * Wraps common code that both tabs use
 *
 * @name AdHoc
 * @extends React.Component
 */
export default function AdHoc(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Fetch records effect
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Rights.has('welldyne_adhoc', 'read')) {
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
			let ret = clone(records);
			ret.unshift(record);
			return ret;
		});
	}

	// Fetch all the records from the server
	function fetchRecords() {

		// Fetch all records
		Rest.read('welldyne', 'adhocs', {}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
	function removeRecord(_id) {

		// Use the current records to set the new records
		recordsSet(records => {

			// Clone the records
			let ret = clone(records);

			// Find the index
			let iIndex = afindi(ret, '_id', _id);

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
		results = <Results
					data={records}
					noun="adhoc"
					orderBy="title"
					remove={Rights.has('welldyne_adhoc', 'delete') ? removeRecord : false}
					service="welldyne"
					tree={AdHocTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="page_header">
				<Typography className="title">AdHoc Records</Typography>
			</Box>
			{results}
		</React.Fragment>
	);
}
