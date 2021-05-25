/**
 * Claim: Messages
 *
 * Fetches and displays customer messages with the ability to select them for
 * tickets
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-28
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';

// Composite components
import SMSMessage from 'shared/components/Messages/SMS';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

/**
 * Messages
 *
 * Shows a list of the previous incoming SMS messages
 *
 * @name Messages
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Messages(props) {

	// Constants
	const MESSAGE_BLOCK = 3;

	// State
	let [next, nextSet] = useState(MESSAGE_BLOCK);
	let [results, resultsSet] = useState(false);
	let [value, valueSet] = useState([]);

	// Load effect
	useEffect(() => {
		fetchMessages(0, MESSAGE_BLOCK);
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

	// Fetch messages
	function fetchMessages(start, count) {

		// Make the REST request
		Rest.read('monolith', 'customer/messages/incoming', {
			customerPhone: props.customerPhone,
			start: start,
			count: count
		}).done(res => {

			// If there was an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If we got data
			if(res.data) {

				// If we currently have none
				if(start === 0) {

					// Reverse the data
					res.data.reverse();

					// Overwrite the results
					resultsSet(res.data);
				}

				// Else, we have existing data
				else {

					// Clone the current results
					let lResults = clone(results);

					// Go through each value returned and add it to the front
					// of the current results
					for(let o of res.data) {
						lResults.unshift(o);
					}

					// Set the new results
					resultsSet(lResults);
				}

				// If we got less than the expected amount
				if(res.data.length < MESSAGE_BLOCK) {
					nextSet(false);
				} else {
					nextSet(val => val + MESSAGE_BLOCK);
				}
			}
		});
	}

	// If we haven't gotten the results yet
	if(results === false) {
		return <Typography>Loading...</Typography>
	}

	// If we have no results
	if(results.length === 0) {
		return <Typography>No SMS messages found, please choose another Ticket type or cancel.</Typography>
	}

	// Render the messages
	return (
		<Box className="flexGrow">
			<Table className="Messages">
				<TableBody className="Messages_content">
					{next !== false &&
						<TableRow>
							<TableCell colSpan={2} style={{textAlign: 'center'}}>
								<Button size="small" variant="contained" onClick={ev => fetchMessages(next, MESSAGE_BLOCK)}>Load Previous</Button>
							</TableCell>
						</TableRow>
					}
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
								<SMSMessage {...o} />
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</Box>
	);
}

// Valid props
Messages.propTypes = {
	customerPhone: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired
}
