/**
 * Tickets
 *
 * Page to view tickets by range and agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-05-18
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ListIcon from '@material-ui/icons/List';

// Shared Components
import Messages from 'shared/components/Messages';
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, date, dateInc } from 'shared/generic/tools';

// Ticket Definition
import TicketDef from 'definitions/csr/ticket_with_state';

// Generate the ticket Tree
const TicketTree = new Tree(TicketDef);

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

	// State
	let [range, rangeSet] = useState(null);
	let [tickets, ticketsSet] = useState(false);

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Date range change
	useEffect(() => {
		if(range) {
			ticketsFetch()
		} else {
			ticketsSet(false);
		}
	// eslint-disable-next-line
	}, [range]);

	// Converts the start and end dates into timestamps
	function rangeUpdate() {

		// Convert the start and end into timestamps
		let iStart = (new Date(refStart.current.value + ' 00:00:00')).getTime() / 1000;
		let iEnd = (new Date(refEnd.current.value + ' 23:59:59')).getTime() / 1000;

		// Set the new range
		rangeSet([iStart, iEnd]);
	}

	// Get the tickets
	function ticketsFetch() {

		// Fetch the tickets from the server
		Rest.read('csr', 'tickets', {
			start: range[0],
			end: range[1],
			memo_id: props.user.id
		}).done(res => {

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
		})
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// Remove a ticket
	function removeTicket(_id) {

		// Find the index
		let iIndex = afindi(tickets, '_id', _id);

		// If one is found
		if(iIndex > -1) {

			// Clone the existing tickets
			let lTickets = clone(tickets);

			// Remove the record
			lTickets.splice(iIndex, 1);

			// Set the new tickets
			ticketsSet(lTickets);
		}
	}

	// Return the rendered component
	return (
		<Box id="agentTickets" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Tickets</Typography>
			</Box>
			<Box className="filter">
				<TextField
					defaultValue={date(dateInc(-14), '-')}
					inputRef={refStart}
					inputProps={{
						min: '2021-05-01',
						max: sToday
					}}
					label="Start"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Typography>-</Typography>
				<TextField
					defaultValue={sToday}
					inputRef={refEnd}
					inputProps={{
						min: '2021-05-01',
						max: sToday
					}}
					label="End"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Button
					color="primary"
					onClick={rangeUpdate}
					variant="contained"
				>Fetch</Button>
			</Box>
			{tickets &&
				<Box className="tickets">
					{tickets.length === 0 ?
						<Typography>No tickets</Typography>
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
							remove={Rights.has('csr_overwrite', 'delete') ? removeTicket : false}
							service="csr"
							tree={TicketTree}
							update={false}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Valid props
Tickets.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
