/**
 * Claim
 *
 * Handles the claim dialog so Agents can pick the appropriate items associated
 * with the ticket
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-26
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Switch from '@material-ui/core/Switch';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

// Composite components
import JustCallItem from 'components/composites/JustCallItem';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

/**
 * Calls
 *
 * Shows a list of the previous Call logs
 *
 * @name Calls
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Calls(props) {

	// State
	let [results, resultsSet] = useState(false);
	let [value, valueSet] = useState([]);

	// Load effect
	useEffect(() => {
		fetchCalls();
	// eslint-disable-next-line
	}, []);

	// If a value is checked/unchecked
	function change(id, checked) {

		// Clone the value
		let lValue = clone(value);

		// If it's turned on
		if(checked) {
			if(!lValue.includes(id)) {
				lValue.push(id);
			}
		} else {
			let i = lValue.indexOf(id);
			if(i > -1) {
				lValue.splice(i, 1);
			}
		}

		// Set the new value state
		valueSet(lValue);

		// Notify parent
		props.onChange(lValue);
	}

	// Fetch calls
	function fetchCalls(start, count) {

		// Make the REST request
		Rest.read('justcall', 'logs', {
			phone: props.customerPhone,
			types: ['3', '4']
		}).done(res => {

			// If there was an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If we got data
			if(res.data) {
				resultsSet(res.data);
			}
		});
	}

	// If we haven't gotten the results yet
	if(results === false) {
		return <Typography>Loading...</Typography>
	}

	// If we have no results
	if(results.length === 0) {
		return <Typography>No calls found, please choose another Ticket type or cancel.</Typography>
	}

	// Render the calls
	return (
		<Box className="flexGrow">
			<Table>
				<TableBody className="messages">
					{results.map(o =>
						<TableRow key={o.id}>
							<TableCell>
								<Switch
									checked={value.includes(o.id)}
									color="primary"
									onChange={ev => change(o.id, ev.currentTarget.checked)}
								/>
							</TableCell>
							<TableCell>
								<JustCallItem {...o} />
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</Box>
	);
}


// Valid props
Calls.propTypes = {
	customerPhone: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired
}
