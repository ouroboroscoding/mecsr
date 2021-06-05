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

// Material UI Icons
import AccessibilityNewIcon from '@material-ui/icons/AccessibilityNew';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import NotesIcon from '@material-ui/icons/Notes';
import SmsIcon from '@material-ui/icons/Sms';
import ViewListIcon from '@material-ui/icons/ViewList';

// Customer components
import HRT from './HRT';
import KNK from './KNK';
import Logs from './Logs';
import MIP from './MIP';
import Misc from './Misc';
import Notes from './Notes';
import RX from './RX';
import SMS from './SMS';

// Shared data modules
import DoseSpot from 'shared/data/dosespot';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Customer component
export default class Customer extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			calendly: null,
			customer: null,
			mips: null,
			orders: null,
			patient_details: null,
			patient_id: null,
			pharmacy_fill: null,
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
		this.dsCreate = this.dsCreate.bind(this);
		this.dsUpdate = this.dsUpdate.bind(this);
		this.dsRefresh = this.dsRefresh.bind(this);
		this.knkCustomerRefresh = this.knkCustomerRefresh.bind(this);
		this.knkOrdersRefresh = this.knkOrdersRefresh.bind(this);
		this.newMessage = this.newMessage.bind(this);
		this.pharmacyFill = this.pharmacyFill.bind(this);
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
				this.fetchKnkCustomer();
				this.fetchMips();
				this.fetchShipping();
				this.fetchTriggers();
				if(Rights.has('prescriptions', 'read')) {
					this.dsId();
					this.fetchPharmacyFill();
				}
			} else {
				this.setState({
					customer: 0,
					mips: 0,
					pharmacy_fill: {fills: [], errors: []},
					prescriptions: 0,
					triggers: []
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

	adhocAdd(type, trigger_id) {

		// If read-only mode
		if(this.props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Send the request
		Rest.create('welldyne', 'adhoc', {
			trigger_id: trigger_id,
			type: type
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				if(res.warning === 1801) {
					Events.trigger('warning', "Due to a lack of data this AdHoc can't be created automatically. You will be notifed as soon as it's created.");
				} else {
					Events.trigger('warning', JSON.stringify(res.warning));
				}
			}

			// If there's data
			if(res.data) {

				// Clone the current triggers
				let triggers = clone(this.state.triggers);

				// Find the correct trigger
				let iIndex = afindi(triggers, '_id', trigger_id);

				// If we found an index
				if(iIndex > -1) {

					// Update the adhoc_type
					triggers[iIndex].adhoc_type = type;

					// Update the state
					this.setState({"triggers": triggers});
				}
			}
		});
	}

	dsCreate() {
		DoseSpot.create(this.props.customerId).then(data => {

			// New state
			let oState = {
				"patient_id": data
			}

			// If there's an id
			if(data) {
				oState.prescriptions = [];
				this.dsDetails(data);
			}

			// Set the state
			this.setState(oState);

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	dsDetails(id) {
		DoseSpot.details(id).then(data => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// Set the state
			this.setState({
				patient_details: data
			});

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	dsId() {

		DoseSpot.fetch(this.props.customerId.toString()).then(data => {

			// New state
			let oState = {"patient_id": data}

			// If there's an id
			if(data) {
				this.dsDetails(data);
				this.dsRx(data);
			} else {
				oState.patient_details = 0;
				oState.prescriptions = 0;
			}

			// Set the state
			this.setState(oState);

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	dsRx(id) {
		DoseSpot.prescriptions(id).then(data => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// Set the state
			this.setState({
				prescriptions: data
			});

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	dsRefresh() {
		this.setState({
			patient_details: null,
			patient_id: null,
			prescriptions: null
		}, () => {
			this.dsId();
		});
	}

	dsUpdate() {
		this.setState({patient_details: null});
		DoseSpot.update(this.props.customerId).then(data => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// Fetch details again
			this.dsDetails(this.state.patient_id);

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	fetchKnkCustomer() {

		// Find the customer ID
		Rest.read('konnektive', 'customer', {
			customerId: this.props.customerId,
			detailed: true
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1104) {
					this.setState({customer: 0});
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
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
					if(res.data.customerId) {
						this.fetchKnkOrders();
					}
				});
			}
		});
	}

	fetchKnkOrders() {

		// Get the orders from the REST service
		Rest.read('konnektive', 'customer/orders', {
			customerId: this.state.customer.customerId,
			transactions: true
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	fetchPharmacyFill() {

		// Request the fill errors
		Rest.read('prescriptions', 'pharmacy/fill/byCustomer', {
			"crm_type": 'knk',
			"crm_id": this.props.customerId.toString()
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the state
				this.setState({
					pharmacy_fill: res.data
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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	pharmacyFill(order_id) {

		// Send the request to the server
		Rest.create('prescriptions', 'pharmacy/fill', {
			crm_type: 'knk',
			crm_id: this.props.customerId.toString(),
			crm_order: order_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Clone the current pharmacy fill
				let oPharmacyFill = clone(this.state.pharmacy_fill);

				// Add the new record to the fills
				oPharmacyFill['fills'].push(res.data);

				// Set the new state
				this.setState({
					pharmacy_fill: oPharmacyFill
				});
			}
		});
	}

	render() {
		return (
			<div id="customer" className="page">
				<AppBar position="static" color="default">
					{this.props.mobile ?
						<Tabs
							onChange={this.tabChange}
							value={this.state.tab}
							variant="fullWidth"
						>
							<Tab icon={<SmsIcon />} />
							<Tab icon={<ViewListIcon />} />
							<Tab icon={<MonetizationOnIcon />} />
							<Tab icon={<LocalHospitalIcon />} />
							<Tab icon={<NotesIcon />} />
							<Tab icon={<LocalPharmacyIcon />} />
							<Tab icon={<AccessibilityNewIcon />} />
							<Tab icon={<CalendarTodayIcon />} />
						</Tabs>
					:
						<Tabs
							onChange={this.tabChange}
							value={this.state.tab}
							variant="fullWidth"
						>
							<Tab label="SMS" />
							<Tab label="Logs" />
							<Tab label="KNK" />
							<Tab label="MIP" />
							<Tab label="Notes" />
							<Tab label="Rx" />
							<Tab label="HRT" />
							<Tab label="Misc" />
						</Tabs>
					}
				</AppBar>
				<div className="messaging" style={{display: this.state.tab === 0 ? 'flex' : 'none'}}>
					<SMS
						ref={el => this.smsRef = el}
						customer={this.state.customer}
						mips={this.state.mips}
						mobile={this.props.mobile}
						orders={this.state.orders}
						phoneNumber={this.props.phoneNumber}
						readOnly={this.props.readOnly}
						templates={this.state.sms_tpls}
						user={this.props.user}
					/>
				</div>
				{this.state.tab === 1 &&
					<Logs
						customerId={this.props.customerId}
						emailAddress={this.state.customer ? this.state.customer.email : ''}
						phoneNumber={this.props.phoneNumber}
						readOnly={this.props.readOnly}
						user={this.props.user}
					/>
				}
				<div className="konnektive" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					<KNK
						customer={this.state.customer}
						orders={this.state.orders}
						readOnly={this.props.readOnly}
						refreshCustomer={this.knkCustomerRefresh}
						refreshOrders={this.knkOrdersRefresh}
						tracking={this.state.shipping}
					/>
				</div>
				<div className="mip" style={{display: this.state.tab === 3 ? 'block' : 'none'}}>
					<MIP
						customer={this.state.customer}
						mips={this.state.mips}
						readOnly={this.props.readOnly}
						user={this.props.user}
					/>
				</div>
				<div className="notes" style={{display: this.state.tab === 4 ? 'flex' : 'none'}}>
					<Notes
						customerId={this.props.customerId}
						readOnly={this.props.readOnly}
						user={this.props.user}
						visible={this.state.tab === 4}
					/>
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 5 ? 'block' : 'none'}}>
					<RX
						details={this.state.patient_details}
						hrtLabs={this.state.hrtLabs}
						onAdhocAdd={this.adhocAdd}
						onDsCreate={this.dsCreate}
						onDsUpdate={this.dsUpdate}
						onPharmacyFill={this.pharmacyFill}
						onRefresh={this.dsRefresh}
						orders={this.state.orders}
						patientId={this.state.patient_id}
						pharmacyFill={this.state.pharmacy_fill}
						prescriptions={this.state.prescriptions}
						readOnly={this.props.readOnly}
						triggers={this.state.triggers}
						user={this.props.user}
					/>
				</div>
				{this.state.tab === 6 &&
					<HRT
						customerId={this.props.customerId}
						readOnly={this.props.readOnly}
						user={this.props.user}
					/>
				}
				{this.state.tab === 7 &&
					<Misc
						crm_id={this.props.customerId}
						patient_id={this.props.patient_id}
						phoneNumber={this.props.phoneNumber}
						readOnly={this.props.readOnly}
						user={this.props.user}
					/>
				}
			</div>
		);
	}

	tabChange(event, tab) {
		this.setState({"tab": tab});
	}
}

// Valid props
Customer.propTypes = {
	customerId: PropTypes.number,
	phoneNumber: PropTypes.string,
	readyOnly: PropTypes.bool,
	user: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.object
	])
}

// Default props
Customer.defaultProps = {
	readOnly: false,
	user: false
}
