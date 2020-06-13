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
		<div className={"message " + props.direction}>
			<div className="content">
				{props.content.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</div>
			<div className="footer">
				{props.direction === 'Outgoing' &&
					<span className="name">{props.name} at </span>
				}
				<span className="date">{props.date}</span>
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
			stop: false,
			type: ''
		}

		// Refs
		this.messagesBottom = null;
		this.sendEl = null;
		this.text = null;

		// Bind methods
		this.callPhone = this.callPhone.bind(this);
		this.copyPhone = this.copyPhone.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.send = this.send.bind(this);
		this.textPress = this.textPress.bind(this);
		this.useTemplate = this.useTemplate.bind(this);
	}

	componentDidMount() {

		// Fetch existing messages
		if(this.props.user) {
			this.fetch('auto');
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

		// Get the messages from the REST service
		Rest.read('monolith', 'customer/messages', {
			customerPhone: this.props.phoneNumber
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
					messages: res.data.messages,
					stop: res.data.stop,
					type: res.data.type
				}, () => {
					this.scrollToBottom(type);
				});
			}
		});
	}

	render() {
		return (
			<React.Fragment>
				<div className="info">
					<span className="title">Phone Number: </span>
					<span className="right20">
						{Utils.nicePhone(this.props.phoneNumber)}
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
							direction={msg.type}
							content={msg.notes}
							key={i}
							name={msg.fromName}
							date={msg.createdAt}
						/>
					)}
					<div className="scroll" ref={el => this.messagesBottom = el} />
				</div>
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
						rows={3}
						variant="outlined"
					/>
					<Button
						color="primary"
						disabled={this.state.stop}
						size="large"
						onClick={this.send}
						variant="contained"
					>
						Send
					</Button>
				</div>
			</React.Fragment>
		)
	}

	scrollToBottom(type) {
		this.messagesBottom.scrollIntoView({ behavior: type });
	}

	send() {

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

				// Clone the current messsages
				let messages = Tools.clone(this.state.messages);

				// Add the new one to the end
				messages.push({
					type: 'Outgoing',
					notes: content,
					fromName: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Utils.datetime(new Date())
				});

				// Set the new state
				this.setState({
					messages: messages
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
