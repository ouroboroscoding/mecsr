/**
 * WellDyne
 *
 * Created, edit, and delete templates used in auto-generating SMS messages
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-17
 */

// NPM modules
import React, { useState } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

// WellDyne components
import AdHoc from './welldyne/AdHoc';
import Outreach from './welldyne/Outreach';

/**
 * WellDyne
 *
 * Wrapper for email and SMS templates
 *
 * @name WellDyne
 * @extends React.Component
 */
export default function WellDyne(props) {

	// State
	let [tab, tabSet] = useState(0);

	// When selected tab changes
	function tabChange(event, tab) {
		tabSet(tab);
	}

	// Return the rendered component
	return (
		<div id="welldyne">
			<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="AdHoc" />
					<Tab label="Outreach" />
				</Tabs>
			</AppBar>
			<div className="adhoc" style={{display: tab === 0 ? 'block' : 'none'}}>
				<AdHoc user={props.user} />
			</div>
			<div className="outreach" style={{display: tab === 1 ? 'block' : 'none'}}>
				<Outreach user={props.user} />
			</div>
		</div>
	);
}
