/**
 * Resolve
 *
 * Handles resolve dialog
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-06-23
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Composite components
import { ReminderForm } from 'components/composites/Reminder';

// Data modules
import Claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared components
import RadioButtons from 'shared/components/RadioButtons';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { omap } from 'shared/generic/tools';

/**
 * Resolve
 *
 * Handles dialog for resolving a claim/ticket
 *
 * @name Resolve
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Resolve(props) {

	// Constants
	const TYPES = omap(Tickets.subtype_ids('Resolved'), (name,id) => {return {value: id, text: name}});

	// State
	let [note, noteSet] = useState('');
	let [reminder, reminderSet] = useState(null);
	let [type, typeSet] = useState('');

	// Refs
	let reminderRef = useRef();

	// Submite notes / resolve conversation
	function submit() {

		// If we need a reminder, create it
		if(reminder) {
			reminderRef.current.run();
		}

		// Send the message to the server
		Rest.create('monolith', 'customer/note', {
			action: 'CSR Note - ' + props.title + ' Resolved',
			content: note,
			customerId: props.customerId
		}).done(res => {

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

				// Add it to the ticket
				if(props.ticket) {
					Tickets.item('note', res.data, props.ticket);
				}

				// Start the resolving
				submitResolution();
			}
		});
	}

	// Called to submit the resolution, close the ticket, and remove the claim
	function submitResolution() {

		// Mark the conversation as hidden on the server side
		Rest.update('monolith', 'customer/hide', {
			customerPhone: props.customerPhone
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}
		});

		// If there's no ticket (eventually we can remove this)
		if(!props.ticket) {

			// Remove the claim
			Claimed.remove(props.customerPhone).then(() => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// Notify the parent
			props.onSubmit();
			return;
		}

		// Close the ticket
		Tickets.resolve(parseInt(type, 10)).then(data => {

			// Remove the claim
			Claimed.remove(props.customerPhone).then(() => {
				Events.trigger('claimedRemove', props.customerPhone);
			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});

			// Notify the parent
			props.onSubmit();

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	return (
		<Dialog
			fullWidth={true}
			maxWidth="md"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Resolve {props.title}</DialogTitle>
			<DialogContent dividers>
				<Box className="field">
					<RadioButtons
						buttonProps={{style: {width: '100%'}}}
						gridContainerProps={{spacing: 2}}
						gridItemProps={{xs: 4}}
						label="Resolution"
						onChange={value => typeSet(value, 10)}
						options={TYPES}
						value={type}
						variant="grid"
					/>
				</Box>
				<Box className="field">
					<TextField
						label="Add Note"
						multiline
						onChange={ev => noteSet(ev.currentTarget.value)}
						rows="4"
						value={note}
						variant="outlined"
					/>
				</Box>
				<Typography><strong>Optional</strong></Typography>
				<Box className="field">
					<FormControlLabel
						control={<Checkbox
							color="primary"
							checked={reminder}
							onChange={ev => reminderSet(ev.currentTarget.checked)}
						/>}
						label={<span>Add Reminder?</span>}
					/>
				</Box>
				{reminder &&
					<ReminderForm
						ref={reminderRef}
						{...props}
					/>
				}
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{(type !== '' && note.trim() !== '') &&
					<Button variant="contained" color="primary" onClick={submit}>
						Resolve
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Resolve.propTypes = {
	customerId: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	title: PropTypes.string,
}

// Default props
Resolve.defaultProps = {
	title: 'Claim',
}
