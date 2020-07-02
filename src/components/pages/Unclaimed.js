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

// Material UI
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';

// Components
import MsgSummary from '../composites/MsgSummary';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Unclaimed component
export default class Unclaimed extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			filtered: [],
			records: [],
			sales: Tools.safeLocalStorage('unclaimed_sales', 'Y') === 'Y',
			salesNoSent: Tools.safeLocalStorage('unclaimed_sales_no_sent', 'Y') === 'Y',
			support: Tools.safeLocalStorage('unclaimed_support', 'Y') === 'Y',
			user: props.user ? true : false
		}

		// Bind methods
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
		Events.add('Unclaimed', this.refresh);

		// If we have a user
		if(this.state.user) {
			this.fetch();
		}
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('Unclaimed', this.refresh);
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
						records: records,
						filtered: this.filter(records, this.state)
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
					records: res.data,
					filtered: this.filter(res.data, this.state)
				});
			}
		});
	}

	filter(records, state) {

		// New filtered
		let filtered = [];

		// Go through each record
		for(let o of records) {

			// If the record has orders
			if(o.numberOfOrders > 0) {

				// If we have the support state
				if(state.support) {
					filtered.push(o);
				}
			}

			// Record has no orders and we have the sales state
			else if(state.sales) {

				// If it has sent messages
				if(o.totalOutGoing > 0 || state.salesNoSent) {
					filtered.push(o);
				}
			}
		}

		// Return the list
		return filtered;
	}

	refresh() {
		this.fetch();
	}

	render() {
		return (
			<Box id="unclaimed">
				<Grid container spacing={0} className="header">
					<Grid item xs={12} sm={6} md={4} className="filters">
						<span className="title">Filters: </span>
						<FormControlLabel
							control={<Checkbox color="primary" checked={this.state.support} onChange={this.supportChanged} name="supportFilter" />}
							label="Support"
						/>
						<span style={{marginRight: '5px'}}>/ </span>
						<FormControlLabel
							control={<Checkbox color="primary" checked={this.state.sales} onChange={this.salesChanged} name="salesFilter" />}
							label="Sales"
						/>
						<span style={{marginRight: '5px'}}>( </span>
						<FormControlLabel
							control={<Checkbox color="primary" checked={this.state.salesNoSent} onChange={this.salesNoSentChanged} name="supportFilter" />}
							label="No Sent"
						/>
						<span>)</span>
					</Grid>
					<Grid item xs={12} sm={6} md={4} className="count">
						<span className="title">Count: </span><span>{this.state.filtered.length}</span>
					</Grid>
				</Grid>
				<Box className="summaries">
					{this.state.filtered.map((o,i) =>
						<MsgSummary
							key={i}
							onHide={this.hide}
							{...o}
						/>
					)}
				</Box>
			</Box>
		)
	}

	salesChanged(event) {

		// Get the new value
		let bChecked = event.target.checked;

		// Init the new state
		let oState = Tools.clone(this.state);
		oState.sales = bChecked;

		// If it's not checked
		if(!bChecked) {
			oState.salesNoSent = false;
		}

		// Generate the new filter messages
		oState.filtered = this.filter(this.state.records, oState);

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
		let oState = Tools.clone(this.state);
		oState.salesNoSent = bChecked;

		// If it's not checked
		if(bChecked) {
			oState.sales = true;
		}

		// Generate the new filter messages
		oState.filtered = this.filter(this.state.records, oState);

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

		// Get the new value
		let bChecked = event.target.checked;

		// Init the new state
		let oState = Tools.clone(this.state);
		oState.support = bChecked;

		// Generate the new filter messages
		oState.filtered = this.filter(this.state.records, oState);

		this.setState(oState, () => {
			localStorage.setItem('unclaimed_support', this.state.support ? 'Y' : 'N')
		});
	}
}

