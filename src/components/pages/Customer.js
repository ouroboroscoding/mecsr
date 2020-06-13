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
import KNK from './customer/KNK';
import MIP from './customer/MIP';
import Notes from './customer/Notes';
import RX from './customer/RX';
import SMS from './customer/SMS';

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
			customer: null,
			customer_id: null,
			mips: null,
			notes: null,
			orders: [],
			patient_id: null,
			prescriptions: null,
			shipping: [],
			sms_tpls: [],
			tab: 0
		}

		// Refs
		this.smsRef = null;

		// Bind methods
		this.newMessage = this.newMessage.bind(this);
		this.tabChange = this.tabChange.bind(this);
	}

	componentDidMount() {

		// Track any new message
		Events.add('newMessage', this.newMessage);

		// If we have a user logged in
		if(this.props.user) {

			// If we have don't have a customer id
			if(this.state.customer_id === null) {
				this.fetchCustomerId();
			}

			// Fetch templates
			this.fetchSMSTemplates();
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
					customer_id: res.data
				}, () => {
					if(res.data === 0) {
						this.setState({
							customer: 0,
							mips: 0,
							prescriptions: 0
						});
					} else {
						this.fetchKnkCustomer();
						this.fetchMips();
						this.fetchNotes();
						this.fetchPatientId();
						this.fetchShipping();
					}
				});
			}
		});
	}

	fetchKnkCustomer(id) {

		// Find the customer ID
		Rest.read('konnektive', 'customer', {
			id: this.state.customer_id
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
					customer: res.data
				}, () => {
					if(res.data.id) {
						this.fetchOrders();
					}
				});
			}
		});
	}

	fetchMips() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/mips', {
			customerId: this.state.customer_id
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

				// Set the MIP
				this.setState({
					mips: res.data
				});
			}
		});
	}

	fetchNotes() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/notes', {
			customerId: this.state.customer_id
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

				// Set the MIP
				this.setState({
					notes: res.data
				});
			}
		});
	}

	fetchOrders() {

		// Get the orders from the REST service
		Rest.read('konnektive', 'customer/orders', {
			id: this.state.customer.id,
			transactions: true
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
			if(res.data) {

				// Set the state
				this.setState({
					orders: res.data
				});
			}
		});
	}

	fetchPatientId() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/dsid', {
			customerId: this.state.customer_id
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

				// If there's an id
				if(res.data) {
					this.fetchPrescriptions(res.data, this.props.user.dsClinicianId);
				} else {
					this.setState({patient_id: 0});
				}
			}
		});
	}

	fetchPrescriptions(id, clinician) {

		// Find the MIP using the phone number
		Rest.read('prescriptions', 'patient/prescriptions', {
			patient_id: parseInt(id, 10)
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

				// Set the state
				this.setState({
					prescriptions: res.data
				});
			}
		});
	}

	fetchShipping() {

		// Fetch them from the server
		Rest.read('monolith', 'customer/shipping', {
			customerId: this.state.customer_id
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
			if(res.data) {

				// Set the state
				this.setState({
					shipping: res.data
				});
			}
		})
	}

	fetchSMSTemplates() {

		// Fetch them from the server
		Rest.read('csr', 'template/smss', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the state
				this.setState({
					sms_tpls: res.data
				});
			}
		});
	}

	newMessage() {
		this.smsRef.fetch("smooth");
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
						<Tab label="SMS" />
						<Tab label="KNK" />
						<Tab label="MIP" />
						<Tab label="Notes" />
						<Tab label="Rx" />
					</Tabs>
				</AppBar>
				<div className="messaging" style={{display: this.state.tab === 0 ? 'flex' : 'none'}}>
					<SMS
						ref={el => this.smsRef = el}
						customer={this.state.customer}
						phoneNumber={this.props.phoneNumber}
						templates={this.state.sms_tpls}
						user={this.props.user}
					/>
				</div>
				<div className="konnektive" style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
					<KNK
						customer={this.state.customer}
						orders={this.state.orders}
						tracking={this.state.shipping}
					/>
				</div>
				<div className="mip" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					<MIP
						customer={this.state.customer}
						mips={this.state.mips}
						user={this.props.user}
					/>
				</div>
				<div className="notes" style={{display: this.state.tab === 3 ? 'block' : 'none'}}>
					<Notes
						notes={this.state.notes}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 4 ? 'block' : 'none'}}>
					<RX
						prescriptions={this.state.prescriptions}
					/>
				</div>
			</div>
		);
	}

	tabChange(event, tab) {
		this.setState({"tab": tab});
	}
}
