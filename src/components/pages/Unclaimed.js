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
import Typography from '@material-ui/core/Typography';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Unclaimed component
export default class Unclaimed extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			rows: [],
			user: props.user ? true : false
		}

		// Bind methods
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

	fetch() {

		// Fetch the unclaimed
		Rest.read('memo', 'msgs/unclaimed', {}).done(res => {

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

				console.log('Unclaimed:');
				console.log(res.data);

				// Set the state
				this.setState({
					rows: res.data
				});
			}
		});
	}

	refresh() {
		this.fetch();
	}

	render() {
		return (
			<div>
				{this.state.rows.map((row, i) => {
					return <div key={i}>{JSON.stringify(row)}</div>
				})}
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
			rows: [],
			user: false
		});
	}
}

