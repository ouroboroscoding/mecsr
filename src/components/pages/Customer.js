/**
 * Customer
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
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

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

// Customer component
export default class Customer extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			messages: [],
			mip: null,
			orders: null,
			prescriptions: null,
			tab: 0,
			user: props.user ? true : false
		}

		// Refs
		this.messagesBottom = null;

		// Bind methods
		this.newMessage = this.newMessage.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.tabChange = this.tabChange.bind(this);
	}

	componentDidMount() {

		// Fetch existing messages
		if(this.state.user) {
			this.fetchMessages();
		}

		// Track events
		Events.add('NewMessage', this.newMessage);
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
	}

	componentWillUnmount() {

		// Stop tracking events
		Events.remove('NewMessage', this.newMessage);
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
	}

	fetchMessages() {

		// Get the messages from the REST service
		Rest.read('memo', 'msgs/customer', {
			phoneNumber: this.props.phoneNumber
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

				console.log('Customer Messages:');
				console.log(res.data);

				// Set the state
				this.setState({
					messages: res.data
				}, () => {
					this.scrollToBottom();
				});
			}
		});
	}

	newMessage(msg) {

		// If the message matches this number
		if(msg.phoneNumber === this.props.phoneNumber) {

			// Clone the current messages
			let lMsgs = Tools.clone(this.state.messages);

			// Add the new message
			lMsgs.push(msg);

			// Update the state
			this.setState({
				messages: lMsgs
			}, () => {
				this.scrollToBottom();
			});
		}
	}

	render() {
		return (
			<div className="customer">
				<AppBar position="static" color="default">
					<Tabs
						onChange={this.tabChange}
						value={this.state.tab}
						variant="fullWidth"
					>
						<Tab label="Messaging" />
						<Tab label="Orders" />
						<Tab label="MIP" />
						<Tab label="Rx" />
					</Tabs>
				</AppBar>
				<div className="messaging" style={{display: this.state.tab === 0 ? 'flex' : 'none'}}>
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
					</div>
					<div className="scroll" ref={el => this.messagesBottom = el} />
					<textarea />
				</div>
				<div className="orders" style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
					Orders
				</div>
				<div className="mip" style={{display: this.state.tab === 2 ? 'block' : 'none'}}>
					MIP
				</div>
				<div className="prescriptions" style={{display: this.state.tab === 3 ? 'block' : 'none'}}>
					Prescriptions
				</div>
			</div>
		);
	}

	scrollToBottom() {
		this.messagesBottom.scrollIntoView({ behavior: "smooth" });
	}

	signedIn(user) {
		this.setState({
			user: true
		}, () => {
			this.fetchMessages();
		})
	}

	signedOut() {
		this.setState({
			fetchMessages: [],
			mip: null,
			orders: null,
			prescriptions: null,
			tab: 0,
			user: false
		});
	}

	tabChange(event, tab) {
		console.log(tab);
		this.setState({"tab": tab});
	}
}
