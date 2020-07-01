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
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Data
import lLabels from '../../../definitions/status_labels.json';

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
			notes: [],
			status: null
		}

		// Sometimes I loathe react
		this.scrolled = false;

		// Refs
		this.label = null;
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

		// Find the Notes using the customer ID
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
					notes: res.data.notes,
					status: res.data.status
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
				{this.state.status &&
					<div className="label">
						<Select
							className='select'
							defaultValue={this.state.status.label || ''}
							native
							inputRef={ref => this.label = ref}
							variant="outlined"
						>
							{lLabels.map((s,i) =>
								<option key={i} value={s}>{s}</option>
							)}
						</Select>
					</div>
				}
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
		let label = null

		// If there's nothing, do nothing
		if(content.trim() === '') {
			return;
		}

		// Init the data
		let oData = {
			action: 'CSR Note',
			content: content
		}

		// If we have an order
		if(this.state.status) {

			// Get the label
			label = this.label.value;

			// If the label changed, send it with the order ID
			if(this.state.status.label !== label) {
				oData.label = label;
				oData.order_id = this.state.status.orderId;
			}

			// Else, send the customer ID
			else {
				oData.customer_id = this.props.customerId
			}
		}

		// No status means it's just a customer note
		else {
			oData.customer_id = this.props.customerId
		}

		// Send the message to the server
		Rest.create('monolith', 'customer/note', oData).done(res => {

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

				// Clear the note content
				this.text.value = '';

				// Init new state
				let oState = {
					notes: Tools.clone(this.state.notes),
					status: Tools.clone(this.state.status)
				}

				// Add the new one to the end
				oState.notes.push({
					action: 'CSR Note',
					note: content,
					createdBy: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Utils.datetime(new Date()),
					userRole: 'CSR'
				});

				// If we have a status
				if(this.state.status) {
					oState.status.label = label;
				}

				// Set the new state
				this.setState(oState, () => {
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
