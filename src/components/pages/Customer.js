/**
 * Customer
 *
 * Shows a specific customer's details
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-31
 */

// NPM modules
import React from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

// Customer components
import Konnektive from './customer/Konnektive';
import Messages from './customer/Messages';
import MIP from './customer/MIP';

// Customer component
export default class Customer extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			tab: 0
		}

		// Bind methods
		this.tabChange = this.tabChange.bind(this);
	}

	render() {
		return (
			<div id="customer">
				<AppBar position="static" color="default">
					<Tabs
						onChange={this.tabChange}
						value={this.state.tab}
						variant="fullWidth"
					>
						<Tab label="Messaging" />
						<Tab label="Konnektive" />
						<Tab label="MIP" />
						<Tab label="Rx" />
					</Tabs>
				</AppBar>
				<div className="messaging" style={{display: this.state.tab === 0 ? 'flex' : 'none'}}>
					<Messages
						phoneNumber={this.props.phoneNumber}
						user={this.props.user}
					/>
				</div>
				<div className="konnektive" style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
					<Konnektive
						phoneNumber={this.props.phoneNumber}
					/>
				</div>
				<div className="mip" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					<MIP
						phoneNumber={this.props.phoneNumber}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 3 ? 'block' : 'none'}}>
					Prescriptions
				</div>
			</div>
		);
	}

	tabChange(event, tab) {
		this.setState({"tab": tab});
	}
}
