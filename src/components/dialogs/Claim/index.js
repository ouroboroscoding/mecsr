/**
 * Claim
 *
 * Handles the claim dialog so Agents can pick the appropriate items associated
 * with the ticket
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-26
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';

// Data modules
import Claimed from 'data/claimed';

// Local components
//import MissedCalls from './MissedCalls';
import Messages from './Messages';

// Shared components
import RadioButtons from 'shared/components/RadioButtons';

// Shared data module
import Tickets from 'shared/data/tickets';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { nicePhone } from 'shared/generic/tools';

/**
 * Claim
 *
 * Handles making a claim and generating tickets
 *
 * @name Claim
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Claim(props) {

	// State
	let [mode, modeSet] = useState('loading');
	let [type, typeSet] = useState(props.defaultType);
	let [items, itemsSet] = useState([]);

	// Load effect
	useEffect(() => {

		// Look for an existing ticket
		Tickets.exists(props.customerId).then(res => {

			// If there's no existing open ticket
			if(res === false) {
				modeSet('ticket_new');
			} else {
				modeSet('ticket_existing');
			}

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		})

	}, [props.customerId, props.customerPhone])

	// Make the claim
	function submitClaim(ticket) {

		// Get the claimed add promise
		Claimed.add(
			ticket,
			props.customerPhone,
			props.orderId === '' ? null : props.orderId,
			props.continuous,
			props.provider
		).then(res => {

			// Tricket the new claim event
			Events.trigger(
				'claimedAdd',
				ticket,
				props.customerPhone,
				props.customerName,
				props.customerId
			);

			// Tell the parent to close the dialog
			props.onClose()

		}, error => {

			// Immediately delete the ticket that was created
			Rest.delete('csr', 'ticket', {
				_id: ticket
			});

			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Customer has already been claimed.');
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}

			// If we have an onFailure prop
			if(props.onFailure) {
				props.onFailure(error);
			}
		});
	}

	// Make the ticket
	function submitTicket() {

		// If the type is sms, add the items
		let lItems = null;
		if(type === 'SMS / Voicemail') {

			// If we have no items
			if(!items || items.length === 0) {
				throw new Error('missing items in Claim component');
			}

			// Init the list of items
			lItems = [];

			// Go through each item and add it to the list
			for(let id of items) {
				lItems.push({
					type: 'sms',
					identifier: id
				});
			}
		}

		// Create the ticket
		Tickets.create(
			props.customerPhone,	// Customer phone number
			props.customerId,		// Customer ID
			type,					// Action sub-type
			lItems					// Items, if any
		).then(data => {
			Tickets.current(data);
			submitClaim(data);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Init the content component(s)
	let Content;

	// Load content based on mode
	switch(mode) {

		// If we're still checking for an existing ticket
		case 'loading':
			Content = <Typography>Looking for an existing open ticket for this customer...</Typography>
			break;

		// If we have an existing ticket
		case 'ticket_existing':
			Content = <Typography>There is already an open ticket for this customer. Most likely this means a Provider is working on it as there is no Agent/PA claim.</Typography>
			break;

		// If we're making a new ticket
		case 'ticket_new':
			Content = (
				<React.Fragment>
					<Box className="flexStatic">
						<Typography>Before claiming this customer you must generate a new Support Ticket.</Typography>
						<br />
						<RadioButtons
							buttonProps={{style: {width: '100%'}}}
							gridContainerProps={{spacing: 2}}
							gridItemProps={{xs: 4}}
							label="Claim Type"
							onChange={value => typeSet(value)}
							options={[
								{value: 'SMS / Voicemail', text: 'SMS / Voicemail'},
								{value: 'Call', text: 'Ongoing Call'},
								{value: 'Follow Up', text: 'Follow Up'}
							]}
							value={type}
							variant="grid"
						/>
						<br />
					</Box>
					{type === 'SMS / Voicemail' &&
						<Messages
							customerPhone={props.customerPhone}
							onChange={list => itemsSet(list)}
						/>
					}
				</React.Fragment>
			);

		// no default
	}

	// Dialog style
	let oStyle = {}
	if('SMS / Voicemail' === type) {
		oStyle.height = '60vh';
	}

	// Render
	return (
		<Dialog
			fullWidth={true}
			maxWidth="md"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "claimDialog"
			}}
		>
			<DialogTitle>Claim Customer</DialogTitle>
			<DialogContent dividers className="flexRows" style={oStyle}>
				<Typography><strong>{props.customerName} - {props.customerId} - {nicePhone(props.customerPhone)}</strong></Typography>
				<br />
				{Content}
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{(mode === 'ticket_new' && (['Call', 'Follow Up'].includes(type) || ('SMS / Voicemail' === type && items.length > 0))) &&
					<Button variant="contained" color="primary" onClick={submitTicket}>
						Claim
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Claim.propTypes = {
	continuous: PropTypes.oneOf([0, 1]),
	customerId: PropTypes.string.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	defaultType: PropTypes.oneOf(['', 'sms', 'ongoing', 'followup']),
	onClose: PropTypes.func.isRequired,
	onFailure: PropTypes.func,
	orderId: PropTypes.string,
	provider: PropTypes.any.isRequired
}

// Default props
Claim.defaultProps = {
	continuous: 0,
	defaultType: 'sms',
	orderId: '',
	provider: null
}
