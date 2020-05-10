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
import DoseSpot from './customer/DoseSpot';
import Konnektive from './customer/Konnektive';
import Messages from './customer/Messages';
import MIP from './customer/MIP';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Customer component
export default class Customer extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			id: null,
			tab: 0
		}

		// Refs
		this.msgRef = null;
		this.knkRef = null;
		this.mipRef = null;
		this.dsRef = null;

		// Bind methods
		this.newMessage = this.newMessage.bind(this);
		this.tabChange = this.tabChange.bind(this);
	}

	componentDidMount() {

		// Track any new message
		Events.add('newMessage', this.newMessage);

		// If we have don't have an id, but do have a user
		if(this.state.id === null && this.props.user) {
			this.fetchCustomerId();
		}
	}

	componentWillUnmount() {

		// Stop tracking any new message events
		Events.remove('newMessage', this.newMessage);
	}

	fetchCustomerId() {

		// Try to get the customer ID by phone number
		Rest.read('monolith', 'customer/id/byPhone', {
			"phoneNumber": this.props.phoneNumber
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the customer ID
				this.setState({
					id: res.data
				}, () => {
					this.knkRef.fetch(res.data);
					this.mipRef.fetch(res.data);
					this.dsRef.fetch(res.data, this.props.user.dsClinicianId);
				});
			}
		});
	}

	newMessage() {
		this.msgRef.fetchMessages("smooth");
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
						ref={el => this.msgRef = el}
						phoneNumber={this.props.phoneNumber}
						user={this.props.user}
					/>
				</div>
				<div className="konnektive" style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
					<Konnektive
						ref={el => this.knkRef = el}
					/>
				</div>
				<div className="mip" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					<MIP
						ref={el => this.mipRef = el}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 3 ? 'block' : 'none'}}>
					<DoseSpot
						ref={el => this.dsRef = el}
					/>
				</div>
			</div>
		);
	}

	tabChange(event, tab) {
		this.setState({"tab": tab});
	}
}
