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
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, isObject } from 'shared/generic/tools';

// Definitions
import OutboundDef from 'definitions/welldyne/outbound';
OutboundDef['__react__'] = {
	"results": ["crm_id", "customer_name", "crm_order", "triggered", "queue", "reason", "ready"]
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
 * @name Outreach
 * @extends React.Component
 */
export default function Outbound(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Rights.has('welldyne_outbound', 'read')) {
				fetchRecords();
			} else {
				recordsSet(-1);
			}
		} else {
			recordsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function adhocSwitch(adhoc) {

		// Send the request to the service
		Rest.update('welldyne', 'outbound/adhoc', {
			"_id": adhoc._id
		}).done(res => {

			// If there's an error or a warning
			if(res.error && !res._handled) {
				if(res.error.code === 1802) {
					Events.trigger('error', 'No associated trigger can be found for this error, you will need to manually inform WellDyneRx to remove this.');
				} else if(res.error.code === 1101) {
					Events.trigger('error', 'The trigger associated with this Outbound Failed Claim already has an AdHoc, a second can not be made until the first is processed.');
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				if(res.warning === 1801) {
					Events.trigger('warning', "Due to a lack of data this AdHoc can't be created automatically. You will be notifed as soon as it's created.");
				} else {
					Events.trigger('warning', JSON.stringify(res.warning));
				}
			}

			// If there's data
			if(res.data) {

				// Use the current records to set the new records
				recordsSet(records => {

					// Clone the records
					let ret = clone(records);

					// Find the index
					let iIndex = afindi(ret, '_id', adhoc._id);

					// If one is found, remove it
					if(iIndex > -1) {
						ret.splice(iIndex, 1);
					}

					// Return the new records
					return ret;
				});

				// If we got an object back
				if(isObject(res.data)) {

					// Tell the adhoc page there's a new record
					Events.trigger('adhocCreated', res.data);
				}
			}
		});
	}

	// Fetch all the records from the server
	function fetchRecords() {

		// Fetch all records
		Rest.read('welldyne', 'outbounds', {}).done(res => {

			// If there's an error or a warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
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

			// If there's an error or a warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Use the current records to set the new records
				recordsSet(records => {

					// Clone the records
					let ret = clone(records);

					// Find the index
					let iIndex = afindi(ret, '_id', sID);

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

	// Figure out results
	let results = ''
	if(records === null) {
		results = <div>Loading...</div>
	} else if(records === -1) {
		results = <div>You lack the rights to view Outbound records.</div>
	} else {
		// If the user has both outbound delete, and adhoc create, all for
		//	switching
		let lActions = Rights.has('welldyne_adhoc', 'create') ?
						[{"tooltip": "AdHoc (Remove Error)", "icon": ArrowBackIcon, "callback": adhocSwitch}] :
						[];

		results = <Results
					actions={lActions}
					custom={{"ready": readyRender}}
					data={records}
					noun="outbound"
					orderBy="triggered"
					remove={false}
					service="welldyne"
					tree={OutboundTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="page_header">
				<Typography className="title">Outbound Failed Claims</Typography>
			</Box>
			{results}
		</React.Fragment>
	);
}
