/**
 * Pharmacy
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

// Pharmacy components
import AdHoc from './AdHoc';
import FillError from './FillError';
import NeverStarted from './NeverStarted';
import Outbound from './Outbound';

/**
 * Pharmacy
 *
 * Page for pharmacy related info, errors, outbound, adhoc
 *
 * @name Pharmacy
 * @extends React.Component
 */
export default function Pharmacy(props) {

	// State
	let [tab, tabSet] = useState(0);

	// When selected tab changes
	function tabChange(event, tab) {
		tabSet(tab);
	}

	// Return the rendered component
	return (
		<div id="pharmacy" className="page">
			<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="Fill Errors" />
					<Tab label="WDRx AdHoc" />
					<Tab label="WDRx Never Started" />
					<Tab label="WDRx Outbound Failures" />
				</Tabs>
			</AppBar>
			<div className="fillError" style={{display: tab === 0 ? 'block' : 'none'}}>
				<FillError user={props.user} />
			</div>
			<div className="adhoc" style={{display: tab === 1 ? 'block' : 'none'}}>
				<AdHoc user={props.user} />
			</div>
			<div className="adhoc" style={{display: tab === 2 ? 'block' : 'none'}}>
				<NeverStarted user={props.user} />
			</div>
			<div className="outbound" style={{display: tab === 3 ? 'block' : 'none'}}>
				<Outbound user={props.user} />
			</div>
		</div>
	);
}
