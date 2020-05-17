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
//import Events from '../../../generic/events';
//import Rest from '../../../generic/rest';

// Local modules
//import Utils from '../../../utils';

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
export default function MIP(props) {

	// If we're still loading
	if(props.mip === null) {
		return <p>Loading...</p>
	}

	// If there's no mip associated
	else if(props.mip === 0) {
		return <p>No MIP found for this customer</p>
	}

	// Else, show the mip
	else {
		return (
			<React.Fragment>
				{props.mip.questions.map((o, i) =>
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
