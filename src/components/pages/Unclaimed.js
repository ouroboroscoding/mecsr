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
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
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
		Events.trigger('claimedAdd', props.customerPhone, props.customerName);
	}

	function hide() {
		props.onHide(props.customerPhone);
	}

	return (
		<Paper className={props.numberOfOrders > 0 ? "record" : "record sales"}>
			<Grid container spacing={3}>
				<Grid item xs={6} sm={2}>
					<p><strong>Actions:</strong></p>
					<p><Button variant="contained" color="primary" size="large" onClick={hide}>Hide</Button></p>
					<p><Link to={"/customer/" + props.customerPhone} onClick={claim}>
						<Button variant="contained" color="primary" size="large">Claim</Button>
					</Link></p>
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
					{props.lastMsg.split('--------\n').slice(1,4).reverse().map((s,i) =>
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
					<span className="name">{msg.from} at </span>
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
			sales: Utils.safeLocalStorage('unclaimed_sales', 'Y') === 'Y',
			salesNoSent: Utils.safeLocalStorage('unclaimed_sales_no_sent', 'Y') === 'Y',
			support: Utils.safeLocalStorage('unclaimed_support', 'Y') === 'Y',
			user: props.user ? true : false
		}

		// Bind methods
		this.claim = this.claim.bind(this);
		this.filter = this.filter.bind(this);
		this.hide = this.hide.bind(this);
		this.refresh = this.refresh.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.supportChanged = this.supportChanged.bind(this);
		this.salesChanged = this.salesChanged.bind(this);
		this.salesNoSentChanged = this.salesNoSentChanged.bind(this);
	}

	checkLocalStorage(name) {
		let value = localStorage.getItem(name);
		if(!value) {
			return true;
		} else {
			return value === 'Y';
		}
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

	filter(record, i) {

		// Do we return this record?
		let bReturn = false;

		// If the record has orders
		if(record.numberOfOrders > 0) {

			// If we have the support state
			if(this.state.support) {
				bReturn = true;
			}
		}

		// Record has no orders and we have the sales state
		else if(this.state.sales) {

			// If it has sent messages
			if(record.totalOutGoing > 0 || this.state.salesNoSent) {
				bReturn = true;
			}
		}

		// If we can return
		if(bReturn) {
			return (
				<Customer
					key={i}
					onClaim={this.claim}
					onHide={this.hide}
					{...record}
				/>
			);
		}
	}

	refresh() {
		this.fetch();
	}

	render() {
		return (
			<Box id="unclaimed">
				<Box className="filters">
					<span className="title">Filters: </span>
					<FormControlLabel
						control={<Checkbox color="primary" checked={this.state.support} onChange={this.supportChanged} name="supportFilter" />}
						label="Support"
					/>
					<span style={{marginRight: '16px'}}>/ </span>
					<FormControlLabel
						control={<Checkbox color="primary" checked={this.state.sales} onChange={this.salesChanged} name="salesFilter" />}
						label="Sales"
					/>
					<span style={{marginRight: '16px'}}>( </span>
					<FormControlLabel
						control={<Checkbox color="primary" checked={this.state.salesNoSent} onChange={this.salesNoSentChanged} name="supportFilter" />}
						label="No Sent"
					/>
					<span>)</span>
				</Box>
				<Box className="customers">
					{this.state.records.map(this.filter)}
				</Box>
			</Box>
		)
	}

	salesChanged(event) {

		// Get the new value
		let bChecked = event.target.checked;

		// Init the new state
		let oState = {sales: bChecked}

		// If it's not checked
		if(!bChecked) {
			oState.salesNoSent = false;
		}

		// Set the new state
		this.setState(oState, () => {
			localStorage.setItem('unclaimed_sales', bChecked ? 'Y' : 'N');
			if(!bChecked) {
				localStorage.setItem('unclaimed_sales_no_sent', 'N');
			}
		});
	}

	salesNoSentChanged(event) {

		// Get the new value
		let bChecked = event.target.checked;

		// Init the new state
		let oState = {salesNoSent: bChecked}

		// If it's not checked
		if(bChecked) {
			oState.sales = true;
		}

		this.setState(oState, () => {
			localStorage.setItem('unclaimed_sales_no_sent', this.state.salesNoSent ? 'Y' : 'N')
			if(bChecked) {
				localStorage.setItem('unclaimed_sales', 'Y');
			}
		});
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

	supportChanged(event) {
		this.setState({
			support: event.target.checked
		}, () => {
			localStorage.setItem('unclaimed_support', this.state.support ? 'Y' : 'N')
		});
	}
}

