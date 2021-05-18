/**
 * Tickets
 *
 * Tab to view all tickets for the customer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-05-18
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ListIcon from '@material-ui/icons/List';

// Shared Components
import Messages from 'shared/components/Messages';
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Ticket Definition
import TicketDef from 'definitions/csr/ticket_with_state';

// Clone the tickets with state and remove the phone and customer ID
let CustomerTicket = clone(TicketDef)
CustomerTicket.__react__.results = [
	'opened_ts', 'opened_type', 'opened_by',
	'resolved_ts', 'resolved_type', 'resolved_by'
]
delete CustomerTicket['phone_number']
delete CustomerTicket['crm_id']

// Generate the ticket Tree
const TicketTree = new Tree(CustomerTicket);

/**
 * Ticket Breakdown
 *
 * Displays all data associated with a single ticket
 *
 * @name TicketBreakdown
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function TicketBreakdown(props) {

	// State
	let [results, resultsSet] = useState(false);

	// Load effect
	useEffect(() => {

		// Fetch the data from the server
		Rest.read('csr', 'ticket/details', {
			_id: props.value._id
		}).done(res => {
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error))
			}
			if(res.data) {
				resultsSet(res.data);
			}
		})

	}, [props.value._id])

	// Render
	return (
		<Box className="TicketBreakdown">
			<Box className="section_header">
				<Typography className="title">Ticket Breakdown</Typography>
			</Box>
			{results === false ?
				<Typography>Loading...</Typography>
			:
				<Messages value={results} />
			}
		</Box>
	)
}

/**
 * Tickets
 *
 * Lists all tickets
 *
 * @name Tickets
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Tickets(props) {

	console.log(props);

	// State
	let [tickets, ticketsSet] = useState(false);

	// Date range change
	useEffect(() => {
		if(props.user) {
			ticketsFetch();
		} else {
			ticketsSet(false);
		}
	// eslint-disable-next-line
	}, [props.user]);

	// Get the tickets
	function ticketsFetch() {

		// Init the request data
		let oData = {}

		// If there's a customer ID
		if(props.customerId) {
			oData.crm_type = 'knk';
			oData.crm_id = props.customerId
		} else {
			oData.phone_number = props.phoneNumber
		}

		// Fetch the tickets from the server
		Rest.read('csr', 'tickets/customer', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {
				ticketsSet(res.data);
			}
		});
	}

	// Return the rendered component
	return (
		<React.Fragment>
			{tickets === false ?
				<Typography>Loading...</Typography>
			:
				<React.Fragment>
					{tickets.length === 0 ?
						<Typography>This customer has no tickets</Typography>
					:
						<Results
							actions={[{
								tooltip: 'View Breakdown',
								icon: ListIcon,
								component: TicketBreakdown
							}]}
							data={tickets}
							noun="ticket"
							orderBy="opened_ts"
							remove={false}
							service="csr"
							tree={TicketTree}
							update={false}
						/>
					}
				</React.Fragment>
			}
		</React.Fragment>
	);
}

// Valid props
Tickets.propTypes = {
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
