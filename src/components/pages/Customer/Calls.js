/**
 * Calls
 *
 * Shows data related to Calls
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-05
 */

// NPM modules
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { nicePhone } from 'shared/generic/tools';

/**
 * Call
 *
 * Display a single call
 *
 * @name Call
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Call(props) {

	// Render
	return (
		<Box className={"message " + (props.type === '2' ? 'Outgoing' : 'Incoming')}>
			<Grid container spacing={1}>
				<Grid item xs={3} md={2}>Date</Grid>
				<Grid item xs={9} md={10}>{props.time}</Grid>
				<Grid item xs={3} md={2}>Type</Grid>
				<Grid item xs={9} md={10}>{props.typeText}</Grid>
				<Grid item xs={3} md={2}>Agent</Grid>
				<Grid item xs={9} md={10}>{props.justcall_agent}</Grid>
				<Grid item xs={3} md={2}>JustCall #</Grid>
				<Grid item xs={9} md={10}>{nicePhone(props.justcall_number)}</Grid>
				<Grid item xs={3} md={2}>Notes</Grid>
				<Grid item xs={9} md={10}>{props.notes}</Grid>
				<Grid item xs={12}>
					<Button onClick={ev => props.info(props.callinfo)} size="small" variant="outlined">View Recording</Button>
				</Grid>
			</Grid>
		</Box>
	);
}

/**
 * Calls
 *
 * Return calls logs
 *
 * @name Calls
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Calls(props) {

	// State
	let [info, infoSet] = useState(false);
	let [logs, logsSet] = useState(null);

	// Refs
	let refScroll = useRef();

	// Load effect
	useEffect(() => {
		if(props.user) {
			logsFetch();
		} else {
			logsSet(null);
		}
	// eslint-disable-next-line
	}, [props.user, props.phoneNumber]);

	// Scroll effect
	useEffect(() => {
		if(logs) {
			refScroll.current.scrollIntoView({ behavior: 'auto' });
		}
	}, [logs])

	// Fetch all the logs associated with the customer
	function logsFetch() {

		// Make the request to the server
		Rest.read('justcall', 'logs', {
			phone: props.phoneNumber
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the logs
				logsSet(res.data);
			}
		});
	}

	// If we're loading
	if(logs === null) {
		return (
			<Box className="callsTab">

			</Box>
		);
	}

	// Render
	return (
		<Box className="callsTab">
			<Box className="calls">
				{logs === null &&
					<Typography>Loading...</Typography>
				}
				{logs.length === 0 &&
					<Typography>No logs found for this phone number</Typography>
				}
				{logs.length > 0 && logs.map(o =>
					<Call
						info={infoSet}
						key={o.id}
						{...o}
					/>
				)}
				<Box className="scroll" ref={refScroll} />
				{info &&
					<Dialog
						fullWidth={true}
						maxWidth="sm"
						onClose={ev => infoSet(false)}
						open={true}
					>
						<DialogContent>
							<iframe className="justcall" src={info} />
						</DialogContent>
					</Dialog>
				}
			</Box>
		</Box>
	);
}
