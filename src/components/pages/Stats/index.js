/**
 * Stats
 *
 * Created, edit, and delete templates used in auto-generating SMS messages
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-13
 */

// NPM modules
import React, { useState } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

// Stats components
import Claimed from './Claimed';
import WellDyne from './WellDyne';

/**
 * Stats
 *
 * Wrapper for email and SMS templates
 *
 * @name Stats
 * @extends React.Component
 */
export default function Stats(props) {

	// State
	let [tab, tabSet] = useState(0);

	// When selected tab changes
	function tabChange(event, tab) {
		tabSet(tab);
	}

	// Return the rendered component
	return (
		<Box id="stats" className="page">
			<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="Claimed" />
					<Tab label="WellDyne" />
				</Tabs>
			</AppBar>
			<Box className="claimed" style={{display: tab === 0 ? 'block' : 'none'}}>
				<Claimed user={props.user} />
			</Box>
			<Box className="welldyne" style={{display: tab === 1 ? 'block' : 'none'}}>
				<WellDyne user={props.user} />
			</Box>
		</Box>
	);
}
