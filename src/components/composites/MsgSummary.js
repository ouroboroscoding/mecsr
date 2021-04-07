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
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

// Shared generic modules
import Events from 'shared/generic/events';
import { datetime } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

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
		if(lMatch) {
			msg.content = lMatch[2];
			msg.date = lMatch[1];
		} else {
			msg.content = props.content;
			msg.date = 'invalid';
		}
	} else if(props.content.slice(0,7) === 'Sent by') {
		let lMatch = reSent.exec(props.content);
		msg.direction = 'Outgoing';
		if(lMatch) {
			msg.content = lMatch[3];
			msg.date = lMatch[2];
			msg.from = lMatch[1];
		} else {
			msg.content = props.content;
			msg.date = 'invalid';
			msg.from = 'unknown';
		}
	} else {
		msg.direction = 'Invalid';
		msg.content = props.content;
		msg.date = 'invalid';
	}

	return (
		<div className={"message " + msg.direction}>
			<div className="content">
				{msg.content.split('\n').map((s,i) => {
					if(s[0] === '[') {
						let oBB = Utils.bbUrl(s);
						if(oBB) {
							return <p key={i}><a href={oBB.href} target="_blank" rel="noopener noreferrer">{oBB.text}</a></p>
						}
					}
					return <p key={i}>{s}</p>
				})}
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
		props.onClaim(props.customerPhone, props.customerName, props.customerId);
	}

	function hide() {
		props.onHide(props.customerPhone);
	}

	function view() {
		Events.trigger('viewedAdd', props.customerPhone, props.customerName, props.customerId);
	}

	// If we're the one who claimed it
	let sClaimedBy = (props.userId === props.user.id) ? 'You' : props.claimedBy;

	// Render
	return (
		<Paper className={props.numberOfOrders > 0 ? "summary" : "summary sales"}>
			<Grid container spacing={3}>
				<Grid item xs={6} sm={2}>
					<p><strong>Actions:</strong></p>
					{props.onHide &&
						<Button className="action" variant="contained" color="primary" size="large" onClick={hide}>Hide</Button>
					}
					{props.claimedAt ?
						<span>Claimed by {sClaimedBy}</span>
					:
						<Button className="action" variant="contained" color="primary" size="large" onClick={claim}>Claim</Button>
					}
					{sClaimedBy !== 'You' &&
						<Button className="action" variant="contained" color="primary" size="large" onClick={view}>View</Button>
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

// Force props
MsgSummary.propTypes = {
	customerId: PropTypes.number.isRequired,
	customerName: PropTypes.string.isRequired,
	customerPhone: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired
}

// Default props
MsgSummary.defaultTypes = {}
