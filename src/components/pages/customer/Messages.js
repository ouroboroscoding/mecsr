/**
 * Messages
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
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

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

// Messages component
export default class Messages extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			messages: []
		}

		// Refs
		this.messagesBottom = null;
		this.text = null;

		// Bind methods
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.send = this.send.bind(this);
		this.textPress = this.textPress.bind(this);
	}

	componentDidMount() {

		// Fetch existing messages
		if(this.props.user) {
			this.fetchMessages();
		}
	}

	fetchMessages(type) {

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
					messages: res.data
				}, () => {
					this.scrollToBottom(type);
				});
			}
		});
	}

	render() {
		return (
			<React.Fragment>
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
				<div className="send">
					<TextField
						className="text"
						inputRef={el => this.text = el}
						multiline
						onKeyPress={this.textPress}
						rows={2}
						variant="outlined"
					/>
					<Button
						color="primary"
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
		Rest.create('monolith', 'message', {
			content: content,
			customerPhone: this.props.phoneNumber,
			type: "support",
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
					fromName: this.state.user.firstName + ' ' + this.state.user.lastName,
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
}
