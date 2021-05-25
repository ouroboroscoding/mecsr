/**
 * Stats Claimed
 *
 * Stats for claimed customers
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-13
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import RefreshIcon from '@material-ui/icons/Refresh';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';

// Generate the Tree
const ClaimedTree = new Tree({
	"__name__": "Claimed_Stats",
	"name": "string",
	"count": "uint"
});

/**
 * Claimed
 *
 * Shows claimed customers by agent
 *
 * @name Claimed
 * @extends React.Component
 */
export default function Claimed(props) {

	// State
	let [records, recordsSet] = useState(null);

	// Fetch records effect
	useEffect(() => {

		// If we have a user with the correct rights
		if(props.user) {
			if(Rights.has('csr_stats', 'read')) {
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
		Rest.read('monolith', 'stats/claimed', {}).done(res => {

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

	// Figure out results
	let results = ''
	if(records === null) {
		results = <div>Loading...</div>
	} else if(records === -1) {
		results = <div>You lack the rights to view Claimed stats.</div>
	} else {
		results = <Results
					data={records}
					noun="stats/claims"
					orderBy="name"
					remove={false}
					service="monolith"
					tree={ClaimedTree}
					update={false}
				/>
	}

	return (
		<React.Fragment>
			<Box className="page_header">
				<Typography className="title">Claimed by Agent
					<Tooltip title="Refresh Prescriptions">
						<IconButton onClick={fetchRecords}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Typography>
			</Box>
			{results}
		</React.Fragment>
	);
}
