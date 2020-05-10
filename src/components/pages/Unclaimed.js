/**
 * Unclaimed
 *
 * Shows open conversations not claimed by any agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-30
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
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Regex
const reReceived = /^Received at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?: [AP]M)?\n([^]+)$/
const reSent = /^Sent by (.+) at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?: [AP]M)?\n([^]+)$/

// Customer component
function Customer(props) {

	function claim() {
		Events.trigger('claimedAdd', props.record.customerPhone, props.record.customerName);
	}

	function hide() {
		props.onHide(props.record.customerPhone);
	}

	return (
		<Paper className={props.record.numberOfOrders > 0 ? "record" : "record sales"}>
			<Grid container spacing={3}>
				<Grid item xs={6} sm={2}>
					<p><strong>Actions:</strong></p>
					<p><Button variant="contained" color="primary" size="large" onClick={hide}>Hide</Button></p>
					<p><Link to={"/customer/" + props.record.customerPhone} onClick={claim}>
						<Button variant="contained" color="primary" size="large">Claim</Button>
					</Link></p>
				</Grid>
				<Grid item xs={6} sm={2}>
					<p><strong>Customer:</strong></p>
					<p>{props.record.customerName}</p>
					<p>{props.record.customerPhone}</p>
					<p>&nbsp;</p>
					<p><strong>Orders:</strong> <span>{props.record.numberOfOrders === null ? '0' : props.record.numberOfOrders}</span></p>
				</Grid>
				<Grid item xs={12} sm={8} className="messages">
					<p><strong>Last 3 messages:</strong></p>
					{props.record.lastMsg.split('--------\n').slice(1,4).reverse().map((s,i) =>
						<Message key={i} content={s} />
					)}
				</Grid>
			</Grid>
		</Paper>
	);
}

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
					<span className="name">{msg.name} at </span>
				}
				<span className="date">{msg.date}</span>
			</div>
		</div>
	);
}

// Unclaimed component
export default class Unclaimed extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			records: [],
			user: props.user ? true : false
		}

		// Bind methods
		this.claim = this.claim.bind(this);
		this.hide = this.hide.bind(this);
		this.refresh = this.refresh.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);

		// If we have a user
		if(this.state.user) {
			this.fetch();
		}
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
	}

	claim(number, name, callback) {
		this.props.onClaim(number, name);
	}

	hide(number) {

		// Mark the conversation as hidden on the server side
		Rest.update('monolith', 'customer/hide', {
			customerPhone: number
		}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Clone the current records
				let records = Tools.clone(this.state.records);

				// Find the record to hide
				let iIndex = Tools.afindi(records, 'customerPhone', number);

				// If we found it
				if(iIndex > -1) {

					// Remove it
					records.splice(iIndex, 1);

					// Set the new state
					this.setState({
						records: records
					});
				}
			}
		});
	}

	fetch() {

		// Fetch the unclaimed
		Rest.read('monolith', 'msgs/unclaimed', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the state
				this.setState({
					records: res.data
				});
			}
		});
	}

	refresh() {
		this.fetch();
	}

	render() {
		return (
			<div id="unclaimed">
				{this.state.records.map((record, i) =>
					<Customer
						key={i}
						onClaim={this.claim}
						onHide={this.hide}
						record={record} />
				)}
			</div>
		)
	}

	signedIn(user) {
		this.setState({
			user: true
		}, () => {
			this.fetch();
		})
	}

	signedOut() {
		this.setState({
			records: [],
			user: false
		});
	}
}

