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

// Shared generic modules
import Events from 'shared/generic/events';
import { date, nicePhone } from 'shared/generic/tools';

// Reminder
export default function Reminder(props) {

	// Refs
	let dateRef = useRef();
	let noteRef = useRef();

	// Submite notes / resolve conversation
	function submit() {

		// Send the message to the server
		reminders.add({
			date: dateRef.current.value,
			crm_type: 'knk',
			crm_id: props.customerId,
			note: noteRef.current.value.trim()
		}).then(res => {
			props.onClose();
		}, error => {
			Events.trigger('error', JSON.stringify(error));
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
			<DialogTitle id="confirmation-dialog-title">Reminder {props.title}</DialogTitle>
			<DialogContent dividers>
				<Typography type="p">
					Add a reminder for {props.name} {nicePhone(props.number)}<br /><br />
				</Typography>
				<p><TextField
					defaultValue={date(new Date())}
					inputRef={dateRef}
					type="date"
					variant="outlined"
				/></p>
				<p><TextField
					defaultValue={'Phone Number: ' + props.number + '\n'}
					label="Add Note"
					multiline
					inputRef={noteRef}
					rows="4"
					variant="outlined"
				/></p>
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
Reminder.propTypes = {
	customerId: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	number: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired
}
