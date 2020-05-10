/**
 * MIP
 *
 * Shows a specific customer's MIP
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-09
 */

// NPM modules
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

// Question component
class Question extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			answer: props.answer || null,
			edit: false
		}

		// Bind methods
		this.edit = this.edit.bind(this);
		this.save = this.save.bind(this);
	}

	edit() {

	}

	render() {
		return (
			<Paper className="question">
				<Box className="title">
					<span>{this.props.title}</span>
				</Box>
				{this.state.edit ?
					<Box />
				:
					<Box className="answer">{this.state.answer ? this.state.answer : <span className="noanswer">No Answer</span>}</Box>
				}
			</Paper>
		)
	}

	save() {

	}
}

// MIP component
export default class MIP extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			mip: null
		}
	}

	componentDidMount() {
		this.fetchMip();
	}

	fetchMip() {

		// Find the MIP using the phone number
		Rest.read('monolith', 'customer/mip', {
			customerPhone: this.props.phoneNumber
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
			if('data' in res) {

				console.log('MIP: ', res.data);

				// Set the MIP
				this.setState({
					mip: res.data
				});
			}
		});
	}

	render() {

		// If there's no mip associated
		if(this.state.mip === 0) {
			return <p>No MIP found for this phone number</p>
		}

		// If we're still loading
		else if(this.state.mip === null) {
			return <p>Loading...</p>
		}

		// Else, show the mip
		else {
			return (
				<React.Fragment>
					{this.state.mip.questions.map((o, i) =>
						<Question
							key={i}
							title={o.title}
							answer={o.answer}
						/>
					)}
				</React.Fragment>
			);
		}
	}
}
