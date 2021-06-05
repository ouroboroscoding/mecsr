/**
 * Logs
 *
 * Shows logs of calls and emails in 3rd party systems
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

// Local components
import Calls from './Calls';
import Emails from './Emails';
import Tickets from './Tickets';

/**
 * Logs
 *
 * Displays tabs to select which logs to view
 *
 * @name Logs
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Logs(props) {

	// State
	let [tab, tabSet] = useState(0);

	// Render
	return (
		<Box className="logsTab">
			<AppBar position="static" color="primary" className="logsTabs">
				<Tabs
					onChange={(ev,tab) => tabSet(tab)}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="JustCall" />
					<Tab label="HubSpot" />
					<Tab label="Tickets" />
				</Tabs>
			</AppBar>
			<Box className="logsContent">
				<Box className="calls" style={{display: tab === 0 ? 'block' : 'none'}}>
					<Calls
						phoneNumber={props.phoneNumber}
						readOnly={props.readOnly}
						user={props.user}
					/>
				</Box>
				<Box className="emails" style={{display: tab === 1 ? 'block' : 'none'}}>
					<Emails
						emailAddress={props.emailAddress}
						readOnly={props.readOnly}
						user={props.user}
					/>
				</Box>
				<Box className="tickets" style={{display: tab === 2 ? 'block' : 'none'}}>
					<Tickets
						customerId={props.customerId}
						phoneNumber={props.phoneNumber}
						readOnly={props.readOnly}
						user={props.user}
					/>
				</Box>
			</Box>
		</Box>
	);
}

// Valid types
Logs.propTypes = {
	customerId: PropTypes.number.isRequired,
	emailAddress: PropTypes.string.isRequired,
	phoneNumber: PropTypes.string.isRequired,
	readOnly: PropTypes.bool.isRequired
}
