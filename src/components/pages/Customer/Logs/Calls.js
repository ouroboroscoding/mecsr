/**
 * Calls
 *
 * Shows data related to Calls
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-05
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Composite components
import JustCallItem from 'components/composites/JustCallItem';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Calls
 *
 * Return calls logs
 *
 * @name Calls
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Calls(props) {

	// State
	let [logs, logsSet] = useState(null);

	// Refs
	let refScroll = useRef();

	// Load effect
	useEffect(() => {
		if(props.user) {
			logsFetch();
		} else {
			logsSet(null);
		}
	// eslint-disable-next-line
	}, [props.user, props.phoneNumber]);

	// Scroll effect
	useEffect(() => {
		if(logs) {
			refScroll.current.scrollIntoView({ behavior: 'auto' });
		}
	}, [logs])

	// Fetch all the logs associated with the customer
	function logsFetch() {

		// Make the request to the server
		Rest.read('justcall', 'logs', {
			phone: props.phoneNumber
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the logs
				logsSet(res.data);
			}
		});
	}

	// Render
	return (
		<React.Fragment>
			{logs === null ?
				<Typography>Loading...</Typography>
			:
				<React.Fragment>
					{logs.length === 0 &&
						<Typography>No logs found for this phone number</Typography>
					}
					{logs.length > 0 && logs.map(o =>
						<JustCallItem
							key={o.id}
							{...o}
						/>
					)}
					<Box className="scroll" ref={refScroll} />
				</React.Fragment>
			}
		</React.Fragment>
	);
}

// Valid types
Calls.propTypes = {
	phoneNumber: PropTypes.string.isRequired
}
