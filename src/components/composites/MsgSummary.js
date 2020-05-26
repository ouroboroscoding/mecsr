/**
 * Message Summary
 *
 * Shows SMS conversations
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-26
 */

// NPM modules
import React from 'react';
import { Link } from 'react-router-dom';

// Material UI
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

// Generic modules
import Events from '../../generic/events';

// Regex
const reReceived = /^Received at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M)\n([^]+)$/
const reSent = /^Sent by (.+) at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M)\n([^]+)$/

// Message component
function Message(props) {

	// Init the message
	let msg = {}

	// Split the data based on type
	if(props.content.slice(0,8) === 'Received') {
		let lMatch = reReceived.exec(props.content);
		msg.direction = 'Incoming';
		msg.content = lMatch[2];
		msg.date = lMatch[1];
	} else {
		let lMatch = reSent.exec(props.content);
		msg.direction = 'Outgoing';
		msg.content = lMatch[3];
		msg.date = lMatch[2];
		msg.from = lMatch[1];
	}

	return (
		<div className={"message " + msg.direction}>
			<div className="content">
				{msg.content.split('\n').map((s,i) =>
					<p key={i}>{s}</p>
				)}
			</div>
			<div className="footer">
				{msg.direction === 'Outgoing' &&
					<span className="name">{msg.from} at </span>
				}
				<span className="date">{msg.date}</span>
			</div>
		</div>
	);
}

// MsgSummary component
export default function MsgSummary(props) {

	function claim() {
		Events.trigger('claimedAdd', props.customerPhone, props.customerName);
	}

	function hide() {
		props.onHide(props.customerPhone);
	}

	return (
		<Paper className={props.numberOfOrders > 0 ? "summary" : "summary sales"}>
			<Grid container spacing={3}>
				<Grid item xs={6} sm={2}>
					<p><strong>Actions:</strong></p>
					{props.onHide &&
						<p><Button variant="contained" color="primary" size="large" onClick={hide}>Hide</Button></p>
					}
					{props.claimedAt ?
						<p>Claimed by {props.claimedBy} at {props.claimedAt}</p>
					:
						<p><Link to={"/customer/" + props.customerPhone} onClick={claim}>
							<Button variant="contained" color="primary" size="large">Claim</Button>
						</Link></p>
					}
				</Grid>
				<Grid item xs={6} sm={2}>
					<p><strong>Customer:</strong></p>
					<p>{props.customerName}</p>
					<p>{props.customerPhone}</p>
					<p>&nbsp;</p>
					<p><strong>SMS Received:</strong> <span>{props.totalIncoming}</span></p>
					<p><strong>SMS Sent:</strong> <span>{props.totalOutGoing === null ? '0' : props.totalOutGoing}</span></p>
					<p>&nbsp;</p>
					<p><strong>Orders:</strong> <span>{props.numberOfOrders === null ? '0' : props.numberOfOrders}</span></p>
				</Grid>
				<Grid item xs={12} sm={8} className="messages">
					<p><strong>Last 3 messages:</strong></p>
					{props.lastMsg && props.lastMsg.split('--------\n').slice(1,4).reverse().map((s,i) =>
						<Message key={i} content={s} />
					)}
				</Grid>
			</Grid>
		</Paper>
	);
}
