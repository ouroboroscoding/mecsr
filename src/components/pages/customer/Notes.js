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
import React, { useRef } from 'react';

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

	let sClass = ''
	switch(props.data.action) {
		case '':
			break;
		default:
			break;
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
export default function Notes(props) {

	// Refs
	const textArea = useRef();
	const scroll = userRef();

	// Add a note to the customer
	function addNote() {

		// Store the message content
		let content = textArea.current.value;

		// Send the message to the server
		Rest.create('monolith', 'customer/note', {
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
					scrollToBottom("smooth");
				});
			}
		});
	}

	// Trap key presses on text area
	function textPress(event) {
		if(event.key === 'Enter') {
			addNote();
		}
	}

	// Scrolls the user to the bottom of the notes
	function scrollToBottom(type) {
		this.messagesBottom.scrollIntoView({ behavior: type });
	}

	// If we're still loading
	if(props.notes === null) {
		return <p>Loading...</p>
	}

	// If there's no notes associated
	else if(props.notes === 0 || props.notes.length === 0) {
		return <p>No notes found for this customer</p>
	}

	// Else, show the notes
	else {
		return (
			<React.Fragment>
				<div className="messages">
					{props.notes.map((note, i) =>
						<Note
							data={note}
							key={i}
						/>
					)}
					<div className="scroll" ref={scroll} />
				</div>
				<div className="send">
					<TextField
						className="text"
						inputRef={textArea}
						multiline
						onKeyPress={textPress}
						rows={3}
						variant="outlined"
					/>
					<Button
						color="primary"
						size="large"
						onClick={addNote}
						variant="contained"
					>
						Add Note
					</Button>
				</div>
			</React.Fragment>
		);
	}
}
