/**
 * SMS
 *
 * Shows a specific customer's conversation
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-31
 */

// NPM modules
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
//import PhoneIcon from '@material-ui/icons/Phone';

// Shared components
import Messages from 'shared/components/Messages';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Clipboard from 'shared/generic/clipboard';
import Events from 'shared/generic/events';
import { afindi, clone, nicePhone, ucfirst } from 'shared/generic/tools';

// Regex
const regTplVar = /{([^]+?)}/g

// MIP paths
const _MIP_PATHS = [
	{path: '/mip/form/dailytada?formId=MIP-A2', name: 'ED - 5mg Tadalafil'},
	{path: '/mip/form/6via?formId=MIP-A2', name: 'ED - 100mg Sildenafil'},
	{path: '/mip/form/6cial?formId=MIP-A2', name: 'ED - 20mg Tadalafil'}
];

/**
 * SMS
 *
 * Handles the Customer SMS tab
 *
 * @name SMS
 * @access public
 * @extends React.Component
 */
export default class SMS extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			messages: [],
			needsStatus: [],
			phoneChange: false,
			stop: false,
			type: ''
		}

		// Mounted?
		this.mounted = false;

		// Refs
		this.refCalendly = null;
		this.refCedOrder = null;
		this.refCedPurchase = null;
		this.refMessagesBottom = null;
		this.refMipLink = null;
		this.refNewNumber = null;
		this.refText = null;

		// Timers
		this.iStatuses = null;

		// Bind methods
		this.calendlyTemplateCancel = this.calendlyTemplateCancel.bind(this);
		this.calendlyTemplateFinish = this.calendlyTemplateFinish.bind(this);
		this.calendlyTemplateStart = this.calendlyTemplateStart.bind(this);
		this.callPhone = this.callPhone.bind(this);
		this.cedTemplateCancel = this.cedTemplateCancel.bind(this);
		this.cedTemplateFinish = this.cedTemplateFinish.bind(this);
		this.cedTemplateStart = this.cedTemplateStart.bind(this);
		this.changePhoneNumber = this.changePhoneNumber.bind(this);
		this.copyPhone = this.copyPhone.bind(this);
		this.fetchStatus = this.fetchStatus.bind(this);
		this.mipTemplateCancel = this.mipTemplateCancel.bind(this);
		this.mipTemplateFinish = this.mipTemplateFinish.bind(this);
		this.mipTemplateStart = this.mipTemplateStart.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.send = this.send.bind(this);
		this.textPress = this.textPress.bind(this);
		this.useTemplate = this.useTemplate.bind(this);
	}

	componentDidMount() {

		// Mark instance as mounted
		this.mounted = true;

		// Fetch existing messages
		if(this.props.user) {
			this.fetch('auto');
		}
	}

	componentWillUnmount() {

		// Mark instance as no longer mounted
		this.mounted = false;

		// If we have a timer going for the statuses
		if(this.iStatuses) {
			clearTimeout(this.iStatuses);
			this.iStatuses = null;
		}
	}

	calendlyTemplateCancel() {
		this.setState({calendly: false});
		this.refText.value = '';
	}

	calendlyTemplateFinish() {

		// Generate the link
		Rest.create('providers', 'calendly/single', {
			crm_id: this.state.calendly.customerId,
			email: this.state.calendly.email,
			name: this.state.calendly.name,
			uri: this.refCalendly.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we were successful
			if(res.data) {

				// Get the current text value
				let sSMS = this.refText.value;

				// Set the new value
				this.refText.value = sSMS.replace(
					'{calendly_link}',
					'https://' + process.env.REACT_APP_MEPP_DOMAIN + '/appointment/' + res.data
				)

				// Hide the dialog
				this.setState({calendly: false});
			}
		});
	}

	calendlyTemplateStart(customerId, name, email, mips) {

		// Set the initial state
		this.setState({calendly: {
			customerId: customerId,
			name: name,
			email: email,
			events: false,
			mips: mips
		}});

		// Get the list of Calendly events
		Rest.read('monolith', 'calendly/events', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we were successful
			if(res.data) {

				// Clone the current calendly state and init the list
				let oCalendly = clone(this.state.calendly);
				oCalendly.events = [];

				// Go through each event
				for(let o of res.data) {
					if(mips[o.type]) {
						oCalendly.events.push(o);
					}
				}

				// Update the state
				this.setState({calendly: oCalendly});
			}
		});
	}

	callPhone(event) {
		alert('not implemented yet');
	}

	cedTemplateCancel() {
		this.setState({ced: false});
		this.refText.value = '';
	}

	cedTemplateFinish() {

		// Generate the continuous order
		Rest.create('monolith', 'order/continuous', {
			customerId: this.props.customer.customerId,
			orderId: this.refCedOrder.value,
			purchaseId: this.refCedPurchase.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1101) {
					Events.trigger('error', 'A C-ED already exists for this customer.');
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
				this.refText.value = '';
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we were successful
			if(res.data) {

				// Get the current text value
				let sSMS = this.refText.value;

				// Set the new value
				this.refText.value = sSMS.replace(
					'{ced_link}',
					`https://www.maleexcelmip.com/mip/cont/ced?formId=MIP-CED&ktCustomerId=${this.props.customer.customerId}`
				)

				// Hide the dialog
				this.setState({ced: false});
			}
		});
	}

	cedTemplateStart() {

		// Set an empty array so that the dialog pops up
		this.setState({ced: []});

		// Get the list of purchases
		Rest.read('konnektive', 'customer/purchases', {
			customerId: this.props.customer.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we were successful
			if(res.data) {

				// Store the list of purchases
				this.setState({ced: res.data});
			}
		});
	}

	changePhoneNumber(event) {

		// Init the data to send with the request
		let oData = {
			old: this.props.phoneNumber,
			new: this.refNewNumber.value
		}

		// If we have a customer ID
		if(this.props.customer && this.props.customer.customerId) {
			oData.customerId = this.props.customer.customerId.toString();
		}

		// Send the request to the server
		Rest.update('monolith', 'phone/change', oData).done(res => {

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

			// If we got success
			if(res.data) {
				Events.trigger('success', 'Phone number changed!');
			}
		});
	}

	copyPhone(event) {
		// Copy the primary key to the clipboard then notify the user
		Clipboard.copy(this.props.phoneNumber).then(b => {
			Events.trigger('success', 'Phone number copied to clipboard');
		});
	}

	fetch(type) {

		// If we have a timer going for the statuses
		if(this.iStatuses) {
			clearTimeout(this.iStatuses);
			this.iStatuses = null;
		}

		// Get the messages from the REST service
		Rest.read('monolith', 'customer/messages', {
			customerPhone: this.props.phoneNumber
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

				// Get the IDs of all the messages that need a status
				let lStatus = [];
				for(let o of res.data.messages) {
					if(o.type === 'Outgoing' && !o.status) {
						lStatus.push(o.id);
					}
				}

				// If we have any missing their status
				if(lStatus.length > 0) {
					this.iStatuses = setTimeout(this.fetchStatus, 30000);
				}

				// Set the state
				this.setState({
					messages: res.data.messages,
					needsStatus: lStatus,
					stop: res.data.stop,
					type: res.data.type
				}, () => {
					this.scrollToBottom(type);
				});
			}
		});
	}

	fetchStatus() {

		// Get the messages status from the REST service
		Rest.read('monolith', 'msgs/status', {
			ids: this.state.needsStatus
		}).done(res => {

			// If not mounted
			if(!this.mounted) {
				return;
			}

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// If we need it
				let lNewMsgs = null;
				let lStatus = [];

				// Go through each one (in reverse)
				for(let o of res.data) {

					// If we have a status
					if(o.status) {

						// If we haven't cloned the messages yet
						if(!lNewMsgs) {
							lNewMsgs = clone(this.state.messages);
						}

						// Find the corresponding message
						let iIndex = afindi(lNewMsgs, 'id', o.id);

						// If we found it
						if(iIndex > -1) {
							lNewMsgs[iIndex].status = o.status;
							lNewMsgs[iIndex].error = o.errorMessage;
						}
					}

					// Else, we still need to look it up
					else {
						lStatus.push(o.id);
					}
				}

				// If we still have messages that need a status, restart the
				//	timer
				if(lStatus.length > 0) {
					this.iStatuses = setTimeout(this.fetchStatus, 30000);
				}

				// If we have new status, set the state
				if(lNewMsgs) {
					this.setState({
						messages: lNewMsgs,
						needsStatus: lStatus
					});
				}
			}
		});
	}

	mipTemplateCancel() {
		this.setState({mipLink: false});
		this.refText.value = '';
	}

	mipTemplateFinish() {

		// Generate the full link
		let sMIP = 'https://' + process.env.REACT_APP_MIP_DOMAIN +
				this.refMipLink.value;

		// If we have a customer
		if(this.props.customer) {
			sMIP += '&ktCustomerId=' + encodeURIComponent(this.props.customer.customerId) +
					'&firstName=' + encodeURIComponent(this.props.customer.shipping.firstName) +
					'&lastName=' + encodeURIComponent(this.props.customer.shipping.lastName) +
					'&email=' + encodeURIComponent(this.props.customer.email) +
					'&phone=' + encodeURIComponent(this.props.customer.phone)
		}

		// Set the new value
		this.refText.value = this.refText.value.replace('{mip_link}', sMIP);

		// Hide the dialog
		this.setState({mipLink: false});
	}

	mipTemplateStart() {
		this.setState({mipLink: true});
	}

	render() {
		return (
			<React.Fragment>
				<div className="info">
					<span className="title">{this.props.mobile ? '#' : 'Phone Number'}: </span>
					<span className="right20">
						<a href={'tel:' + this.props.phoneNumber}>
							{nicePhone(this.props.phoneNumber)}
						</a>
						<Tooltip title="Copy Phone Number">
							<IconButton onClick={this.copyPhone}>
								<FileCopyIcon />
							</IconButton>
						</Tooltip>
						{!this.props.readOnly && Rights.has('customers', 'update') &&
							<Tooltip title="Change Phone Number">
								<IconButton onClick={ev => this.setState({phoneChange: true})}>
									<EditIcon />
								</IconButton>
							</Tooltip>
						}
						{/*<Tooltip title="Call Customer">
							<IconButton onClick={this.callPhone}>
								<PhoneIcon />
							</IconButton>
						</Tooltip>*/}
					</span>
					<span className="title">Type: </span>
					<span className="right20">{ucfirst(this.state.type)}</span>
					{this.state.stop &&
						<span className="title" style={{color: 'red'}}>STOP</span>
					}
				</div>
				<div className="messages">
					<Messages
						type="sms"
						value={this.state.messages}
					/>
					<div className="scroll" ref={el => this.refMessagesBottom = el} />
				</div>
				{!this.props.readOnly &&
					<React.Fragment>
						<div className="templates">
							<Select
								className="select"
								disabled={this.state.stop}
								native
								onChange={this.useTemplate}
								value={this.state.value}
								variant="outlined"
							>
								<option key={-1} value={-1}>Use template...</option>
								{this.props.templates.map((o,i) =>
									<option key={i} value={i}>{o.title}</option>
								)}
							</Select>
						</div>
						<div className="send">
							<TextField
								className="text"
								disabled={this.state.stop}
								inputRef={el => this.refText = el}
								multiline
								onKeyPress={this.textPress}
								rows={this.props.mobile ? 1 : 3}
								variant="outlined"
							/>
							<Button
								color="primary"
								disabled={this.state.stop}
								size={this.props.mobile ? "small" : "large"}
								onClick={this.send}
								variant="contained"
							>
								Send
							</Button>
						</div>
					</React.Fragment>
				}
				{this.state.phoneChange &&
					<Dialog
						fullWidth={true}
						maxWidth="md"
						open={true}
						onClose={ev => this.setState({phoneChange: false})}
					>
						<DialogTitle>Change Customer Phone Number</DialogTitle>
						<DialogContent dividers>
							<Typography>
								Please set the new number with no international
								code or spaces. It should be 10 digits only.
							</Typography>
							<br />
							<Typography>
								Note that running this will update all messages
								associated with the current phone number to the
								new number, regnerate the message summary, and
								update Konnektive if a customer is associated
								with the claim.
							</Typography>
							<br />
							<TextField
								label="New Phone Number"
								inputRef={ref => this.refNewNumber = ref}
								variant="outlined"
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={ev => this.setState({phoneChange: false})}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={this.changePhoneNumber}>
								Change Number
							</Button>
						</DialogActions>
					</Dialog>
				}
				{this.state.ced &&
					<Dialog
						fullWidth={true}
						maxWidth="sm"
						onClose={this.cedTemplateCancel}
						open={true}
					>
						<DialogTitle>Select Order/Purchase for C-ED</DialogTitle>
						<DialogContent dividers>
							<FormControl className="dialog" variant="outlined">
								<InputLabel htmlFor="ced-order">Select Order</InputLabel>
								<Select
									inputProps={{
										id: 'ced-order',
										ref: el => this.refCedOrder = el
									}}
									label="Select Order"
									native
									variant="outlined"
								>
									{this.props.orders.map(o =>
										<option key={o.orderId} value={o.orderId}>{o.date} - {o.orderId} - {o.campaign}</option>
									)}
								</Select>
							</FormControl>
							{this.state.ced.length > 0 &&
								<FormControl className="dialog" variant="outlined">
									<InputLabel htmlFor="ced-purchase">Select Purchase</InputLabel>
									<Select
										inputProps={{
											id: 'ced-purchase',
											ref: el => this.refCedPurchase = el
										}}
										label="Select Purchase"
										native
										variant="outlined"
									>
										{this.state.ced.map(o =>
											<option key={o.purchaseId} value={o.purchaseId}>{o.date} - {o.purchaseId} - {o.product.name}</option>
										)}
									</Select>
								</FormControl>
							}
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={this.cedTemplateCancel}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={this.cedTemplateFinish}>
								Finish Template
							</Button>
						</DialogActions>
					</Dialog>
				}
				{this.state.calendly &&
					<Dialog
						fullWidth={true}
						maxWidth="md"
						onClose={this.calendlyTemplateCancel}
						open={true}
					>
						<DialogTitle>Select Calendly Event</DialogTitle>
						<DialogContent dividers>
							<Grid container spacing={2}>
								<Grid item xs={4}>Customer ID</Grid>
								<Grid item xs={8}>{this.state.calendly.customerId}</Grid>
								<Grid item xs={4}>Name</Grid>
								<Grid item xs={8}>{this.state.calendly.name}</Grid>
								<Grid item xs={4}>E-mail</Grid>
								<Grid item xs={8}>{this.state.calendly.email}</Grid>
								<Grid item xs={12}>
									{this.state.calendly.events &&
										<FormControl className="dialog" variant="outlined">
											<InputLabel htmlFor="calendly-events">Select Event</InputLabel>
											<Select
												inputProps={{
													id: 'calendly-events',
													ref: el => this.refCalendly = el
												}}
												label="Select Event"
												native
												variant="outlined"
											>
												{this.state.calendly.events.map(o =>
													<option value={o.uri}>{o.name} - {o.type.toUpperCase()}</option>
												)}
											</Select>
										</FormControl>
									}
								</Grid>
							</Grid>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={this.calendlyTemplateCancel}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={this.calendlyTemplateFinish}>
								Finish Template
							</Button>
						</DialogActions>
					</Dialog>
				}
				{this.state.mipLink &&
					<Dialog
						fullWidth={true}
						maxWidth="md"
						onClose={this.mipTemplateCancel}
						open={true}
					>
						<DialogTitle>Select Medication Type</DialogTitle>
						<DialogContent dividers>
							<FormControl className="dialog" variant="outlined">
								<InputLabel htmlFor="mipLink-events">Select Medication</InputLabel>
								<Select
									inputProps={{
										id: 'mipLink-events',
										ref: el => this.refMipLink = el
									}}
									label="Select Medication"
									native
									variant="outlined"
								>
									{_MIP_PATHS.map(o =>
										<option value={o.path}>{o.name}</option>
									)}
								</Select>
							</FormControl>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={this.mipTemplateCancel}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={this.mipTemplateFinish}>
								Finish Template
							</Button>
						</DialogActions>
					</Dialog>
				}
			</React.Fragment>
		)
	}

	scrollToBottom(type) {
		this.refMessagesBottom.scrollIntoView({ behavior: type });
	}

	send() {

		// If read-only mode
		if(this.props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Store the message content
		let content = this.refText.value;

		// Send the message to the server
		Rest.create('monolith', 'message/outgoing', {
			content: content,
			customerPhone: this.props.phoneNumber,
			type: this.state.type,
		}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {

				// If the customer requested a stop
				if(res.error.code === 1500) {
					Events.trigger('error', 'Customer has requested a STOP to SMS messages');
				}
				else if(res.error.code === 1304) {
					Events.trigger('error', 'Twilio rejected the message: ' + res.error.msg);
				}
				else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Add the SMS to the current ticket (if there is one)
				if(Tickets.current()) {
					Tickets.item('sms', 'outgoing', res.data, this.props.user.id);
				}

				// Clear the message
				this.refText.value = '';

				// Clone the current messsages and status
				let lNewMsgs = clone(this.state.messages);
				let lStatus = clone(this.state.needsStatus);

				// Add the new one to the end
				lNewMsgs.push({
					id: res.data,
					status: 'Sent',
					error: null,
					type: 'Outgoing',
					notes: content,
					fromName: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Date.now()/1000
				});

				// Add the id to those that need statuses
				lStatus.push(res.data);

				// Clear the existing timer and create a new one
				if(!this.iStatuses) {
					clearInterval(this.iStatuses);
				}
				this.iStatuses = setTimeout(this.fetchStatus, 30000);

				// Set the new state
				this.setState({
					messages: lNewMsgs,
					needsStatus: lStatus
				}, () => {
					this.scrollToBottom("smooth");
				});
			}
		});
	}

	textPress(event) {
		if(event.key === 'Enter') {
			this.send();
		}
	}

	useTemplate(event) {

		// Get the option value
		let opt = parseInt(event.target.value);

		// If it's the first one, do nothing
		if(opt === -1) {
			return;
		}

		// Get the template
		let sContent = this.props.templates[opt].content;

		// Go through any template variables found
		for(let lMatch of sContent.matchAll(regTplVar)) {
			let sReplacement = null;
			switch(lMatch[1]) {

				// Billing info, name + address
				case 'billing':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.billing.firstName + ' ' + this.props.customer.billing.lastName + '\n' +
									this.props.customer.billing.address1 + '\n';
					if(this.props.customer.billing.address2 !== null && this.props.customer.billing.address2.trim() !== '') {
						sReplacement += this.props.customer.billing.address2 + '\n';
					}
					sReplacement += this.props.customer.billing.city + ', ' + this.props.customer.billing.state + '\n' +
									this.props.customer.billing.country + ', ' + this.props.customer.billing.postalCode;
					break;

				// Billing first name
				case 'billing_first':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.billing.firstName;
					break;

				// Billing last name
				case 'billing_last':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.billing.lastName;
					break;

				// Calendly appointment
				case 'calendly_link':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without KNK data');
						return;
					}
					if(!this.props.mips) {
						Events.trigger('error', 'Can not use template with no MIP data');
						return;
					}

					// Go through all the mips
					let oMIPs = {ed: false, hrt: false}
					for(let o of this.props.mips) {
						if(o.completed) {
							if(['MIP-A1', 'MIP-A2'].indexOf(o.form) > -1) {
								oMIPs['ed'] = true;
							}
							if(['MIP-H1', 'MIP-H2'].indexOf(o.form) > -1) {
								oMIPs['hrt'] = true;
							}
						}
					}

					// Start the process
					this.calendlyTemplateStart(
						this.props.customer.customerId,
						this.props.customer.shipping.firstName + ' ' + this.props.customer.shipping.lastName,
						this.props.customer.email,
						oMIPs
					);
					break;

				// C-ED Link
				case 'ced_link':
					if(!this.props.mips || !this.props.customer || !this.props.orders || this.props.orders.length === 0) {
						Events.trigger('error', 'Can not use template without MIP and KNK data');
						return;
					}

					// Existing landing ID
					let bFound = false;

					// Go through each mip available
					for(let o of this.props.mips) {

						// If it's an H1
						if(['MIP-A1', 'MIP-A2'].indexOf(o.form) > -1 && o.completed) {
							bFound = true;
							break;
						}
					}

					// If we have an ID
					if(bFound) {

						// Start the process
						this.cedTemplateStart();
					}

					// We can't generate a C-ED with the data available
					else {
						sReplacement = 'NO PREVIOUS COMPLETED ED MIP FOUND!';
						Events.trigger('error', 'No previous completed ED MIP was found for this customer, you should not message them without further research');
					}
					break;

				case 'chrt_link':
					if(!this.props.mips || !this.props.customer) {
						Events.trigger('error', 'Can not use template without MIP and KNK data');
						return;
					}

					// Existing landing ID
					let oLanding = false;

					// Go through each mip available
					for(let o of this.props.mips) {

						// If it's an H1
						if(['MIP-H1', 'MIP-H2'].indexOf(o.form) > -1 && o.completed) {
							oLanding = o;
							break;
						}
					}

					// If we have an ID
					if(oLanding) {
						sReplacement = `https://www.maleexcelmip.com/hormone-assessment/cchrt?landing_id=${oLanding.id}&formId=${oLanding.form}&ktCustomerId=${this.props.customer.customerId}`
					} else {
						sReplacement = 'NO PREVIOUS COMPLETED HRT MIP FOUND!';
						Events.trigger('error', 'No previous completed HRT MIP was found for this customer, you should not message them without further research');
					}
					break;

				case 'ihrt_link':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without KNK data');
						return;
					}
					sReplacement = `https://www.maleexcelmip.com/hormone-assessment/ihrt?ktCustomerId=${this.props.customer.customerId}`
					break;

				// Email
				case 'email':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.email;
					break;

				// MIP Link
				case 'mip_link':
					this.mipTemplateStart();
					break;

				// Shipping info, name + address
				case 'shipping':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.shipping.firstName + ' ' + this.props.customer.shipping.lastName + '\n' +
									this.props.customer.shipping.address1 + '\n';
					if(this.props.customer.shipping.address2 !== null && this.props.customer.shipping.address2.trim() !== '') {
						sReplacement += this.props.customer.shipping.address2 + '\n';
					}
					sReplacement += this.props.customer.shipping.city + ', ' + this.props.customer.shipping.state + '\n' +
									this.props.customer.shipping.country + ', ' + this.props.customer.shipping.postalCode;
					break;

				// Shipping first name
				case 'shipping_first':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.shipping.firstName;
					break;

				// Shipping last name
				case 'shipping_last':
					if(!this.props.customer) {
						Events.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.shipping.lastName;
					break;

				// Verify ID link
				case 'verify_id_link':
					if(!this.props.mips || this.props.mips.length === 0) {
						Events.trigger('error', 'Can not use template without MIP data');
						return;
					}
					sReplacement = 'https://www.maleexcelmip.com/mip/verifyId/Upload?landing_id=' +
									this.props.mips[0].id;
					break;

				// Bad data
				default:
					sReplacement = 'UNKNOWN VARIABLE "' + lMatch[1] + '"';
			}

			// If we found something, replace it
			if(sReplacement !== null) {
				sContent = sContent.replace(lMatch[0], sReplacement);
			}
		}

		// Fill the text field
		this.refText.value = sContent;
	}
}
