/**
 * WellDyne Outbound
 *
 * Created, edit, and delete outbound records
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

// Material UI Icons
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

// Format Components
import ResultsComponent from '../../format/Results';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Definitions
import OutboundDef from '../../../definitions/welldyne/outbound';
OutboundDef['__react__'] = {
	"results": ["crm_type", "crm_id", "customer_name", "crm_order", "triggered", "queue", "reason", "ready"]
}
OutboundDef['customer_name'] = {"__type__": "string", "__react__": {"title": "Name"}}
OutboundDef['triggered'] = {"__type__": "date"}

// Generate the Tree
const OutboundTree = new Tree(OutboundDef);

/**
 * Outbound
 *
 * Wraps common code that both tabs use
 *
 * @name GenericWellDyne
 * @extends React.Component
 */
export default function Outbound(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'welldyne_outbound', 'read')) {
				fetchRecords();
			} else {
				recordsSet(-1);
			}
		} else {
			recordsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function adhocSwitch(_id) {

		// Send the request to the service
		Rest.update('welldyne', 'outbound/adhoc', {
			"_id": _id
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

				// Use the current records to set the new records
				recordsSet(records => {

					// Clone the records
					let ret = Tools.clone(records);

					// Find the index
					let iIndex = Tools.afindi(ret, '_id', _id);

					// If one is found, remove it
					if(iIndex > -1) {
						ret.splice(iIndex, 1);
					}

					// Return the new records
					return ret;
				});

				// Tell the adhoc page there's a new record
				Events.trigger('adhocCreated', res.data);
			}
		});
	}

	// Fetch all the records from the server
	function fetchRecords() {

		// Fetch all records
		Rest.read('welldyne', 'outbounds', {}).done(res => {

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

	function readyRender(record) {
		if(record.crm_order && record.crm_order !== '') {
			return (
				<Checkbox
					color="primary"
					checked={record.ready ? true : false}
					onChange={readyToggle}
					inputProps={{
						"data-id": record._id
					}}
				/>
			)
		} else {
			return '';
		}
	}

	function readyToggle(event) {

		// Get the ID and ready flag
		let sID = event.currentTarget.dataset.id;
		let bReady = event.currentTarget.checked

		// Send the request to the service
		Rest.update("welldyne", "outbound/ready", {
			"_id": sID,
			"ready": bReady
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

				// Use the current records to set the new records
				recordsSet(records => {

					// Clone the records
					let ret = Tools.clone(records);

					// Find the index
					let iIndex = Tools.afindi(ret, '_id', sID);

					// If one is found, update the ready flag
					if(iIndex > -1) {
						ret[iIndex]['ready'] = bReady;
					}

					// Update the records
					return ret;
				});
			}
		})
	}

	// Remove a template
	function removeRecord(_id) {

		// Use the current records to set the new records
		recordsSet(records => {

			// Clone the records
			let ret = Tools.clone(records);

			// Find the index
			let iIndex = Tools.afindi(ret, '_id', _id);

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
		results = <div>You lack the rights to view Outbound records.</div>
	} else {
		// If the user has both outbound delete, and adhoc create, all for
		//	switching
		let lActions = Utils.hasRight(props.user, 'welldyne_outbound', 'delete') &&
						Utils.hasRight(props.user, 'welldyne_adhoc', 'create') ?
						[{"tooltip": "AdHoc (Remove Error)", "icon": ArrowBackIcon, "callback": adhocSwitch}] :
						[];

		results = <ResultsComponent
					actions={lActions}
					custom={{"ready": readyRender}}
					data={records}
					noun="outbound"
					orderBy="title"
					remove={Utils.hasRight(props.user, 'welldyne_outbound', 'delete') ? removeRecord : false}
					service="welldyne"
					tree={OutboundTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="pageHeader">
				<div className="title">Outbound Failed Claims</div>
			</Box>
			{results}
		</React.Fragment>
	);
}
