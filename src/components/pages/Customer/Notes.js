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

// Shared components
import Messages from 'shared/components/Messages';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Data
import lRoles from 'definitions/attention_roles.json';
import lLabels from 'definitions/status_labels.json';

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

		// Mounted?
		this.mounted = false;

		// Sometimes I loathe react
		this.scrolled = false;

		// Refs
		this.label = null;
		this.messagesBottom = null;
		this.sendEl = null;
		this.role = null;
		this.text = null;

		// Bind methods
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.send = this.send.bind(this);
		this.textPress = this.textPress.bind(this);
	}

	componentDidMount() {

		// Mark instance as mounted
		this.mounted = true;

		// Fetch existing messages
		if(this.props.user && this.props.customerId) {
			this.fetch('auto');
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
			this.scrollToBottom('auto');
			this.scrolled = true;
		}
	}

	componentWillUnmount() {

		// Mark instance as no longer mounted
		this.mounted = false;
	}

	fetch(type) {

		// Find the Notes using the customer ID
		Rest.read('monolith', 'customer/notes', {
			customerId: this.props.customerId
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
			if('data' in res) {

				// Set the Notes
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
			notes = (
				<Messages
					type="note"
					value={this.state.notes}
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
				{(this.state.status && !this.props.readOnly) &&
					<div className="flexColumns">
						<div className="role flexGrow">
							<Select
								className='select'
								defaultValue={this.state.status.role || ''}
								native
								inputRef={ref => this.role = ref}
								variant="outlined"
							>
								{lRoles.map((s,i) =>
									<option key={i} value={s}>{s}</option>
								)}
							</Select>
						</div>
						<div className="label flexGrow">
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
					</div>
				}
				{!this.props.readOnly &&
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
				}
			</React.Fragment>
		)
	}

	scrollToBottom(type) {
		if(this.messagesBottom) {
			this.messagesBottom.scrollIntoView({ behavior: type });
		}
	}

	send() {

		// If read-only mode
		if(this.props.readOnly) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Get the content of the note
		let content = this.text.value;
		let label = null;
		let role = null;

		// If there's nothing, do nothing
		if(content.trim() === '') {
			return;
		}

		// Init the data
		let oData = {
			action: 'CSR Note',
			content: content,
			customerId: this.props.customerId
		}

		// If we have an order
		if(this.state.status) {

			// Get the role and label
			role = this.role.value;
			label = this.label.value;

			// If the role or label changed, send them with the order ID
			if(this.state.status.role !== role ||
				this.state.status.label !== label) {
				oData.role = role;
				oData.label = label;
				oData.orderId = this.state.status.orderId;
			}
		}

		// Send the message to the server
		Rest.create('monolith', 'customer/note', oData).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Add the Note to the current ticket (if there is one)
				if(Tickets.current()) {
					Tickets.item('note', 'outgoing', res.data, this.props.user.id);
				}

				// Clear the note content
				this.text.value = '';

				// Init new state
				let oState = {
					notes: clone(this.state.notes),
					status: clone(this.state.status)
				}

				// Add the new one to the end
				oState.notes.push({
					action: 'CSR Note',
					note: content,
					createdBy: this.props.user.firstName + ' ' + this.props.user.lastName,
					createdAt: Date.now()/1000,
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
