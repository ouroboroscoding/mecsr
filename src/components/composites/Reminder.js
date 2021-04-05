/**
 * Reminder
 *
 * Handles resolve dialog
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-24
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Date modules
import reminders from 'data/reminders';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date, nicePhone } from 'shared/generic/tools';

/**
 * Reminders Form
 *
 * Displays a form for creating a new reminder
 *
 * @name ReminderForm
 * @access public
 * @extends React.Component
 */
export class ReminderForm extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {};

		// Refs
		this.dateRef = React.createRef();
		this.noteRef = React.createRef();
	}

	render() {
		return (
			<React.Fragment>
				<p><TextField
					defaultValue={date(new Date())}
					inputRef={this.dateRef}
					type="date"
					variant="outlined"
				/></p>
				<p><TextField
					defaultValue={(!this.props.customerId || this.props.customerId.toString() === '0') ? 'Phone Number: ' + this.props.customerPhone + '\n' : ''}
					label="Add Note"
					multiline
					inputRef={this.noteRef}
					rows="4"
					variant="outlined"
				/></p>
			</React.Fragment>
		);
	}

	run() {
		return new Promise((resolve, reject) => {

			// Send the message to the server
			reminders.add({
				date: this.dateRef.current.value,
				crm_type: 'knk',
				crm_id: this.props.customerId,
				note: this.noteRef.current.value.trim()
			}).then(res => {
				resolve(res);
			}, error => {
				reject(error);
			});
		});
	}
}

/**
 * Reminder Dialog
 *
 * Shows a dialog to add a new reminder with a given customer ID
 *
 * @name ReminderDialog
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export function ReminderDialog(props) {

	// Refs
	let formRef = useRef();

	// Submite notes / resolve conversation
	function submit() {
		formRef.current.run().then(res => {
			props.onClose();
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	return (
		<Dialog
			fullWidth={true}
			maxWidth="sm"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "reminder"
			}}
		>
			<DialogTitle>Reminder {props.title}</DialogTitle>
			<DialogContent dividers>
				<Typography type="p">
					Add a reminder for {this.props.customerName} {nicePhone(this.props.customerPhone)}<br /><br />
				</Typography>
				<ReminderForm
					ref={formRef}
					{...props}
				/>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				<Button variant="contained" color="primary" onClick={submit}>
					Add Reminder
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Valid props
ReminderDialog.propTypes = {
	customerId: PropTypes.string.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired
}
