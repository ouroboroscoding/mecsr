/**
 * Stats WellDyne
 *
 * Stats associated with WellDyne
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-16
 */

// NPM modules
import React, { useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

/**
 * WellDyne
 *
 * Shows stats associated with WellDyne
 *
 * @name WellDyne
 * @extends React.Component
 */
export default function WellDyne(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Fetch records effect
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Utils.hasRight(props.user, 'csr_stats', 'read')) {
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
		Rest.read('welldyne', 'stats', {}).done(res => {

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

	// Figure out results
	let results = ''
	if(records === null) {
		results = <div>Loading...</div>
	} else if(records === -1) {
		results = <div>You lack the rights to view WellDyne stats.</div>
	} else {
		results = (
			<React.Fragment>
				<p><strong>Latest triggered by customer vs how of those have been shipped: </strong></p>
				<p>{records.vs[0]} / {records.vs[1]}</p>
			</React.Fragment>
		);
	}

	return (
		<React.Fragment>
			<Box className="pageHeader">
				<div className="title">WellDyne Stats</div>
			</Box>
			{results}
		</React.Fragment>
	);
}
