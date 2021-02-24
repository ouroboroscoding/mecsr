/**
 * Pending
 *
 * Shows pending CSR orders not claimed by any agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-23
 */

// NPM modules
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// Composite components
import CustomerSummary from 'components/composites/CustomerSummary';

// Data modules
import claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Pending component
export default class Pending extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			records: [],
			user: props.user
		}

		// Bind methods
		this.claim = this.claim.bind(this);
		this.fetch = this.fetch.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
		Events.add('Pending', this.fetch);

		// If we have a user
		if(this.state.user) {
			this.fetch();
		}
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
		Events.remove('Pending', this.fetch);
	}

	claim(customer_id, order_id, continuous, name, phone) {

		// Get the claimed add promise
		claimed.add(phone, order_id, continuous, 0).then(res => {
			Events.trigger('claimedAdd', phone, name, customer_id, order_id, continuous, 0);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Order has already been claimed. Refreshing queue.');
				this.fetch();
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	fetch() {

		// Fetch the queue
		Rest.read('monolith', 'orders/pending/csr', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
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

	render() {
		return (
			<Box id="pending" className="page">
				<Box className="header">
					<Typography variant="h4">{this.state.records.length ? this.state.records.length + ' Pending' : 'No Pending'}</Typography>
				</Box>
				<Box className="summaries">
					{this.state.records.map((o,i) =>
						<CustomerSummary
							onClaim={this.claim}
							key={o.orderId}
							user={this.state.user}
							{...o}
						/>
					)}
				</Box>
			</Box>
		)
	}

	signedIn(user) {
		this.setState({
			user: user
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
