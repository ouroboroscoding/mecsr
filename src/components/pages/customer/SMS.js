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
import IconButton from '@material-ui/core/IconButton';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import FileCopyIcon from '@material-ui/icons/FileCopy';
//import PhoneIcon from '@material-ui/icons/Phone';

// Generic modules
import Clipboard from '../../../generic/clipboard';
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Regex
const regTplVar = /{([^]+?)}/g

// Message component
function Message(props) {
	return (
		<div className={"message " + props.type}>
			<div className="content">
				{props.notes.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</div>
			<div className="footer">
				{props.type === 'Outgoing' &&
					<span>{props.fromName} at </span>
				}
				<span>{props.createdAt}</span>
				{(props.type === 'Outgoing' && props.status !== null) &&
					<React.Fragment>
						<span> / {props.status}</span>
						{props.error &&
							<span className="error"> ({props.error})</span>
						}
					</React.Fragment>
				}
			</div>
		</div>
	);
}

// SMS component
export default class SMS extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			messages: [],
			needsStatus: [],
			stop: false,
			type: ''
		}

		// Mounted?
		this.mounted = false;

		// Refs
		this.messagesBottom = null;
		this.sendEl = null;
		this.text = null;

		// Timers
		this.iStatuses = null;

		// Bind methods
		this.callPhone = this.callPhone.bind(this);
		this.copyPhone = this.copyPhone.bind(this);
		this.fetchStatus = this.fetchStatus.bind(this);
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

	callPhone(event) {
		alert('not implemented yet');
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
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
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
							lNewMsgs = Tools.clone(this.state.messages);
						}

						// Find the corresponding message
						let iIndex = Tools.afindi(lNewMsgs, 'id', o.id);

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

	render() {
		return (
			<React.Fragment>
				<div className="info">
					<span className="title">{this.props.mobile ? '#' : 'Phone Number'}: </span>
					<span className="right20">
						<a href="tel:{this.props.phoneNumber}">
							{Utils.nicePhone(this.props.phoneNumber)}
						</a>
						<Tooltip title="Copy Phone Number">
							<IconButton onClick={this.copyPhone}>
								<FileCopyIcon />
							</IconButton>
						</Tooltip>
						{/*<Tooltip title="Call Customer">
							<IconButton onClick={this.callPhone}>
								<PhoneIcon />
							</IconButton>
						</Tooltip>*/}
					</span>
					<span className="title">Type: </span>
					<span className="right20">{Tools.ucfirst(this.state.type)}</span>
					{this.state.stop &&
						<span className="title" style={{color: 'red'}}>STOP</span>
					}
				</div>
				<div className="messages">
					{this.state.messages.map((msg, i) =>
						<Message
							key={msg.id}
							{...msg}
						/>
					)}
					<div className="scroll" ref={el => this.messagesBottom = el} />
				</div>
				{!this.props.readOnly &&
					<React.Fragment>
						<div className="templates">
							<Select
								className='select'
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
								inputRef={el => this.text = el}
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
			</React.Fragment>
		)
	}

	scrollToBottom(type) {
		this.messagesBottom.scrollIntoView({ behavior: type });
	}

	send() {

		// If read-only mode
		if(this.props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Store the message content
		let content = this.text.value;

		// Send the message to the server
		Rest.create('monolith', 'message/outgoing', {
			content: content,
			customerPhone: this.props.phoneNumber,
			type: this.state.type,
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {

				// If the customer requested a stop
				if(res.error.code === 1500) {
					Events.trigger('error', 'Customer has requested a STOP to SMS messages');
				}
				else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Clear the message
				this.text.value = '';

				// Clone the current messsages and status
				let lNewMsgs = Tools.clone(this.state.messages);
				let lStatus = Tools.clone(this.state.needsStatus);

				// Add the new one to the end
				lNewMsgs.push({
					id: res.data,
					status: 'Sent',
					error: null,
					type: 'Outgoing',
					notes: content,
					fromName: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Utils.datetime(new Date())
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
				case 'billing':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
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
				case 'billing_first':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.billing.firstName;
					break;
				case 'billing_last':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.billing.lastName;
					break;
				case 'email':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.email;
					break;
				case 'shipping':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
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
				case 'shipping_first':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.shipping.firstName;
					break;
				case 'shipping_last':
					if(!this.props.customer) {
						Event.trigger('error', 'Can not use template without customer data');
						return;
					}
					sReplacement = this.props.customer.shipping.lastName;
					break;
				default:
					sReplacement = 'UNKNOWN VARIABLE "' + lMatch[1] + '"';
			}

			// If we found something, replace it
			if(sReplacement !== null) {
				sContent = sContent.replace(lMatch[0], sReplacement);
			}
		}

		// Fill the text field
		this.text.value = sContent;
	}
}
