/**
 * Notes
 *
 * Shows a specific customer's internal notes (soap notes)
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-25
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

// Note Component
function Note(props) {

	let sClass = '';

	// If we got a Receive Communication it's incoming
	if(props.data.action === 'Receive Communication') {
		sClass = 'Incoming';
	} else {
		if(props.data.userRole === 'Doctor') {
			sClass = 'Outgoing Doctor';
		} else if(props.data.userRole === 'System') {
			sClass = 'Outgoing System';
		} else {
			sClass = 'Outgoing';
		}
	}

	return (
		<div className={"message " + sClass}>
			<div className="action">
				{props.data.action}
			</div>
			<div className="content">
				{props.data.note.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</div>
			<div className="footer">
				<span className="name">{props.data.createdBy} at </span>
				<span className="date">{props.data.createdAt}</span>
			</div>
		</div>
	);
}

// Notes component
export default class Notes extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			notes: []
		}

		// Sometimes I loathe react
		this.scrolled = false;

		// Refs
		this.messagesBottom = null;
		this.sendEl = null;
		this.text = null;

		// Bind methods
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.send = this.send.bind(this);
		this.textPress = this.textPress.bind(this);
	}

	componentDidMount() {

		// Fetch existing messages
		if(this.props.customerId) {
			this.fetch();
		}
	}

	componentDidUpdate(prevProps) {
		if(prevProps.customerId !== this.props.customerId) {
			if(this.props.customerId) {
				this.fetch('auto');
			}
		}
		if(prevProps.visible !== this.props.visible &&
			this.props.visible &&
			!this.scrolled) {
			this.scrollToBottom("auto");
			this.scrolled = true;
		}
	}

	fetch(type) {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/notes', {
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
					notes: res.data
				}, () => {
					this.scrollToBottom(type);
				});
			}
		});
	}

	render() {

		let notes = null;

		// If we're still loading
		if(this.state.notes === null) {
			notes = <p>Loading...</p>
		}

		// If there's no notes associated
		else if(this.state.notes === 0 || this.state.notes.length === 0) {
			notes = <p>No notes found for this customer</p>
		}

		// Else, process the notes
		else {
			notes = this.state.notes.map((note, i) =>
				<Note
					data={note}
					key={i}
				/>
			);
		}

		// Else, show the notes
		return (
			<React.Fragment>
				<div className="messages">
					{notes}
					<div className="scroll" ref={el => this.messagesBottom = el} />
				</div>
				<div className="send">
					<TextField
						className="text"
						inputRef={el => this.text = el}
						multiline
						onKeyPress={this.textPress}
						rows={3}
						variant="outlined"
					/>
					<Button
						color="primary"
						size="large"
						onClick={this.send}
						variant="contained"
					>
						Add Note
					</Button>
				</div>
			</React.Fragment>
		)
	}

	scrollToBottom(type) {
		this.messagesBottom.scrollIntoView({ behavior: type });
	}

	send() {

		// Get the content of the note
		let content = this.text.value;

		// Send the message to the server
		Rest.create('monolith', 'customer/note', {
			action: 'CSR Note',
			content: content,
			customer_id: this.props.customerId
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Clear the message
				this.text.value = '';

				// Clone the current notes
				let notes = Tools.clone(this.state.notes);

				// Add the new one to the end
				notes.push({
					action: 'CSR Note',
					note: content,
					createdBy: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Utils.datetime(new Date()),
					userRole: 'CSR'
				});

				// Set the new state
				this.setState({
					notes: notes
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
