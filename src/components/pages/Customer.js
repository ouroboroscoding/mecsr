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
import PropTypes from 'prop-types';
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
import Tools from '../../generic/tools';

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
			fill_errors: null,
			mips: null,
			orders: [],
			patient_id: null,
			prescriptions: null,
			shipping: [],
			sms_tpls: [],
			triggers: null,
			tab: 0
		}

		// Mounted?
		this.mounted = false;

		// Refs
		this.smsRef = null;

		// Bind methods
		this.adhocAdd = this.adhocAdd.bind(this);
		this.knkCustomerRefresh = this.knkCustomerRefresh.bind(this);
		this.knkOrdersRefresh = this.knkOrdersRefresh.bind(this);
		this.newMessage = this.newMessage.bind(this);
		this.rxRefresh = this.rxRefresh.bind(this);
		this.tabChange = this.tabChange.bind(this);
	}

	componentDidMount() {

		// Mark instance as mounted
		this.mounted = true;

		// Track any new message
		Events.add('newMessage', this.newMessage);

		// If we have a user logged in
		if(this.props.user) {

			// If we have a customer ID
			if(this.props.customerId) {
				this.fetchFillErrors();
				this.fetchKnkCustomer();
				this.fetchMips();
				this.fetchPatientId();
				this.fetchShipping();
				this.fetchTriggers();
			} else {
				this.setState({
					customer: 0,
					mips: 0,
					prescriptions: 0,
					triggers: 0
				});
			}

			// Fetch templates if needed
			if(!this.props.readOnly) {
				this.fetchSMSTemplates();
			}
		}
	}

	componentWillUnmount() {

		// Mark instance as no longer mounted
		this.mounted = false;

		// Stop tracking any new message events
		Events.remove('newMessage', this.newMessage);
	}

	adhocAdd(type, order) {

		// If read-only mode
		if(this.props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Send the request
		Rest.create('welldyne', 'adhoc', {
			crm_type: 'knk',
			crm_id: this.state.customer.id,
			crm_order: order,
			type: type
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Clone the current triggers
				let triggers = Tools.clone(this.state.triggers);

				// Find the correct order
				let iIndex = Tools.afindi(triggers, 'crm_order', order);

				// If we found an index
				if(iIndex > -1) {

					// Update the adhocType
					triggers[iIndex].adhocType = type;

					// Update the state
					this.setState({"triggers": triggers});
				}
			}
		});
	}

	fetchFillErrors() {

		// Request the fill errors
		Rest.read('prescriptions', 'pharmacy/fill/errors', {
			"crm_type": 'knk',
			"crm_id": this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the state
				this.setState({
					fill_errors: res.data
				});
			}
		});
	}

	fetchKnkCustomer() {

		// Find the customer ID
		Rest.read('konnektive', 'customer', {
			id: this.props.customerId
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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
			customerId: this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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
			customerId: this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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
			customerId: this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

	fetchTriggers() {

		// Fetch them from the server
		Rest.read('welldyne', 'trigger/info', {
			crm_type: 'knk',
			crm_id: this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the state
				this.setState({
					triggers: res.data
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
						readOnly={this.props.readOnly}
						templates={this.state.sms_tpls}
						user={this.props.user}
					/>
				</div>
				<div className="konnektive" style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
					<KNK
						customer={this.state.customer}
						orders={this.state.orders}
						readOnly={this.props.readOnly}
						refreshCustomer={this.knkCustomerRefresh}
						refreshOrders={this.knkOrdersRefresh}
						tracking={this.state.shipping}
					/>
				</div>
				<div className="mip" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					<MIP
						customer={this.state.customer}
						mips={this.state.mips}
						readOnly={this.props.readOnly}
						user={this.props.user}
					/>
				</div>
				<div className="notes" style={{display: this.state.tab === 3 ? 'flex' : 'none'}}>
					<Notes
						customerId={this.props.customerId}
						readOnly={this.props.readOnly}
						user={this.props.user}
						visible={this.state.tab === 3}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 4 ? 'block' : 'none'}}>
					<RX
						fillErrors={this.state.fill_errors}
						onAdhocAdd={this.adhocAdd}
						onRefresh={this.rxRefresh}
						orders={this.state.orders}
						patientId={this.state.patient_id}
						prescriptions={this.state.prescriptions}
						readOnly={this.props.readOnly}
						triggers={this.state.triggers}
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

// Valid props
Customer.propTypes = {
	"customerId": PropTypes.number,
	"phoneNumber": PropTypes.string,
	"readyOnly": PropTypes.bool,
	"user": PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.object
	])
}

// Default props
Customer.defaultProps = {
	"readOnly": false,
	"user": false
}
