/**
 * Manual AdHoc
 *
 * Used to update raw data on triggers needed for adhoc
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-13
 */

// NPM modules
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

/**
 * Line
 *
 * A single manual adhoc record
 *
 * @name Line
 * @extends React.Component
 */
function Line(props) {

	// Refs
	let rawRef = useRef()

	function move() {

		// Send the request to the server
		Rest.delete('welldyne', 'adhoc/manual', {
			_id: props._id,
			raw: rawRef.current.value,
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

				// Remove the record
				props.onMove(props._id);
			}
		});
	}

	return (
		<TableRow>
			<TableCell>{props.crm_id}</TableCell>
			<TableCell>{props.crm_order}</TableCell>
			<TableCell>
				<TextField
					label="Raw"
					inputRef={rawRef}
					variant="outlined"
				/>
				<Button variant="contained" color="secondary" onClick={move}>
					Move
				</Button>
			</TableCell>
		</TableRow>
	)
}

/**
 * ManualAdHoc
 *
 * Page for pharmacy related info, errors, outreach, adhoc
 *
 * @name ManualAdHoc
 * @extends React.Component
 */
export default function ManualAdHoc(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Fetch records effect
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'manual_adhoc', 'read')) {
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
		Rest.read('welldyne', 'adhoc/manual', {}).done(res => {

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
		results = <div>You lack the rights to view Manual AdHoc records.</div>
	} else {
		results = (
			<Table stickyHeader aria-label="sticky table">
				<TableHead>
					<TableRow>
						<TableCell>ID</TableCell>
						<TableCell>Order</TableCell>
						<TableCell> </TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{records.map(o =>
						<Line
							key={o._id}
							onMove={removeRecord}
							{...o}
						/>
					)}
				</TableBody>
			</Table>
		);
	}

	// Return the rendered component
	return (
		<div id="manual_adhoc">
			<Box className="pageHeader">
				<div className="title">Manual AdHoc Records</div>
			</Box>
			{results}
		</div>
	);
}
