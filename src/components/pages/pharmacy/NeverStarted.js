/**
 * WellDyne Never Started
 *
 * Created, edit, and delete never/started records
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-09
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';

// Format Components
import ResultsComponent from '../../format/Results';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Definitions
import NeverStartedDef from '../../../definitions/welldyne/never_started';
NeverStartedDef['__react__'] = {
	"results": ["crm_id", "customer_name", "crm_order", "triggered", "medication", "reason", "ready"]
}
NeverStartedDef['crm_id'] = {"__type__": "string", "__react__": {"title": "ID"}}
NeverStartedDef['customer_name'] = {"__type__": "string", "__react__": {"title": "Name"}}
NeverStartedDef['crm_order'] = {"__type__": "string", "__react__": {"title": "Order"}}
NeverStartedDef['triggered'] = {"__type__": "date"}
NeverStartedDef['medication'] = {"__type__": "string"}

// Generate the Tree
const NeverStartedTree = new Tree(NeverStartedDef);

/**
 * NeverStarted
 *
 * Wraps common code that both tabs use
 *
 * @name Outreach
 * @extends React.Component
 */
export default function NeverStarted(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Refs
	let pollRef = useRef();

	// Effects
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'welldyne_never_started', 'read')) {
				fetchRecords();
			} else {
				recordsSet(-1);
			}
		} else {
			recordsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Fetch all the records from the server
	function fetchRecords() {

		// Fetch all records
		Rest.read('welldyne', 'never/starteds', {}).done(res => {

			// If there's an error or a warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
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

	function getFlatDate() {
		let oDate = new Date();
		var Y = ('' + oDate.getFullYear()).substr(2,2);
		var M = '' + (oDate.getMonth() + 1);
		if(M.length === 1) M = '0' + M;
		var D = '' + oDate.getDate();
		if(D.length === 1) D = '0' + D;
		return M + D + Y;
	}

	// Update the records on the server from the FTP
	function pollRecords() {

		Rest.update('welldyne', 'never/started/poll', {
			date: pollRef.current.value
		}).done(res => {

			// If there's an error or a warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1803) {
					Events.trigger('error', "Can't find the file " + res.error.msg + ' on the FTP server');
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Re-fetch the records
				fetchRecords();
			}
		})
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
		Rest.update("welldyne", "never/started/ready", {
			"_id": sID,
			"ready": bReady
		}).done(res => {

			// If there's an error or a warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

	// Remove a record
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
		results = <div>You lack the rights to view Never Started records.</div>
	} else {
		results = <ResultsComponent
					custom={{"ready": readyRender}}
					data={records}
					noun="never/started"
					orderBy="triggered"
					remove={Utils.hasRight(props.user, 'welldyne_never_started', 'delete') ? removeRecord : false}
					service="welldyne"
					tree={NeverStartedTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="pageHeader">
				<div className="title">Never Started Claims</div>
				{Utils.hasRight(props.user, 'welldyne_never_started', 'update') &&
					<React.Fragment>
						<TextField
							inputRef={pollRef}
							label="File date"
							defaultValue={getFlatDate()}
						/>
						<Tooltip title="Update from FTP">
							<IconButton onClick={pollRecords}>
								<CloudDownloadIcon />
							</IconButton>
						</Tooltip>
					</React.Fragment>
				}
			</Box>
			{results}
		</React.Fragment>
	);
}
