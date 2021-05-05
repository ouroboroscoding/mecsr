/**
 * Just Call Item
 *
 * Shows data related to a single JustCall log
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-28
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Grid from '@material-ui/core/Grid';

// Shared data modules
//import Tickets from 'shared/data/tickets';

// Shared generic modules
import { nicePhone } from 'shared/generic/tools';

/**
 * Just Call Item
 *
 * Display a single call
 *
 * @name JustCallItem
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function JustCallItem(props) {

	// State
	let [info, infoSet] = useState(false);

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
					<Button onClick={ev => infoSet(true)} size="small" variant="outlined">View Recording</Button>
				</Grid>
			</Grid>
			{info &&
				<Dialog
					fullWidth={true}
					maxWidth="sm"
					onClose={ev => infoSet(false)}
					open={true}
				>
					<DialogContent>
						<iframe title="JustCall Info" className="justcall" src={props.callinfo} />
					</DialogContent>
				</Dialog>
			}
		</Box>
	);
}

// Valid props
JustCallItem.propTypes = {
	callinfo: PropTypes.string.isRequired,
	justcall_agent: PropTypes.string.isRequired,
	justcall_number: PropTypes.string.isRequired,
	notes: PropTypes.string.isRequired,
	time: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	typeText: PropTypes.string.isRequired
}
