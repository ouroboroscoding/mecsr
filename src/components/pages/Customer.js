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
			mips: null,
			orders: [],
			patient_id: null,
			prescriptions: null,
			shipping: [],
			sms_tpls: [],
			trigger: null,
			tab: 0
		}

		// Refs
		this.smsRef = null;

		// Bind methods
		this.knkCustomerRefresh = this.knkCustomerRefresh.bind(this);
		this.knkOrdersRefresh = this.knkOrdersRefresh.bind(this);
		this.newMessage = this.newMessage.bind(this);
		this.rxRefresh = this.rxRefresh.bind(this);
		this.tabChange = this.tabChange.bind(this);
	}

	componentDidMount() {

		// Track any new message
		Events.add('newMessage', this.newMessage);

		// If we have a user logged in
		if(this.props.user) {

			// If we have a customer ID
			if(this.props.customerId) {
				this.fetchKnkCustomer();
				this.fetchMips();
				this.fetchPatientId();
				this.fetchShipping();
				this.fetchTrigger();
			} else {
				this.setState({
					customer: 0,
					mips: 0,
					prescriptions: 0,
					trigger: 0
				});
			}

			// Fetch templates
			this.fetchSMSTemplates();
		}
	}

	componentWillUnmount() {

		// Stop tracking any new message events
		Events.remove('newMessage', this.newMessage);
	}

	fetchKnkCustomer() {

		// Find the customer ID
		Rest.read('konnektive', 'customer', {
			id: this.props.customerId
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
						this.fetchKnkOrders();
					}
				});
			}
		});
	}

	fetchKnkOrders() {

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

	fetchMips() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/mips', {
			customerId: this.props.customerId
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

	fetchPatientId() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/dsid', {
			customerId: this.props.customerId
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

				// New state
				let oState = {
					"patient_id": res.data
				}

				// If there's an id
				if(res.data) {
					this.fetchPrescriptions(res.data, this.props.user.dsClinicianId);
				} else {
					oState.prescriptions = 0;
				}

				// Set the state
				this.setState(oState);
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
			customerId: this.props.customerId
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
		});
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

	fetchTrigger() {

		// Fetch them from the server
		Rest.read('welldyne', 'trigger/info', {
			customerId: this.props.customerId
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
					trigger: res.data
				});
			}
		});
	}

	knkCustomerRefresh() {

		// Set the state to null
		this.setState({
			customer: null
		}, () => {
			this.fetchKnkCustomer();
		});
	}

	knkOrdersRefresh() {

		// Set the state to null
		this.setState({
			orders: null
		}, () => {
			this.fetchKnkOrders();
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
						refreshCustomer={this.knkCustomerRefresh}
						refreshOrders={this.knkOrdersRefresh}
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
				<div className="notes" style={{display: this.state.tab === 3 ? 'flex' : 'none'}}>
					<Notes
						customerId={this.props.customerId}
						user={this.props.user}
						visible={this.state.tab === 3}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 4 ? 'block' : 'none'}}>
					<RX
						patientId={this.state.patient_id}
						prescriptions={this.state.prescriptions}
						refresh={this.rxRefresh}
						trigger={this.state.trigger}
						user={this.props.user}
					/>
				</div>
			</div>
		);
	}

	rxRefresh() {

		// Set the state to null
		this.setState({
			patient_id: null,
			prescriptions: null
		}, () => {
			this.fetchPatientId();
		});
	}

	tabChange(event, tab) {
		this.setState({"tab": tab});
	}
}
