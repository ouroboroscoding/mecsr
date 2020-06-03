/**
 * Search
 *
 * Searchs for conversations
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-26
 */

// NPM modules
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

// Components
import MsgSummary from '../composites/MsgSummary';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Search component
export default class Search extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			content: '',
			name: '',
			phone: '',
			records: [],
			user: props.user ? true : false
		}

		// Bind methods
		this.contentChange = this.contentChange.bind(this);
		this.nameChange = this.nameChange.bind(this);
		this.phoneChange = this.phoneChange.bind(this);
		this.search = this.search.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);
	}

	contentChange(event) {
		this.setState({content: event.target.value});
	}

	nameChange(event) {
		this.setState({name: event.target.value});
	}

	phoneChange(event) {
		this.setState({phone: event.target.value});
	}

	search() {

		// Generate params
		let oParams = {};
		if(this.state.phone.trim() !== '') {
			oParams.phone = this.state.phone;
		}
		if(this.state.name.trim() !== '') {
			oParams.name = this.state.name;
		}
		if(this.state.content.trim() !== '') {
			oParams.content = this.state.content;
		}

		// Fetch the unclaimed
		Rest.read('monolith', 'msgs/search', oParams).done(res => {

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

	render() {
		return (
			<Box id="search">
				<Grid container spacing={0} className="form">
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							label="Phone Number"
							onChange={this.phoneChange}
							type="text"
							value={this.state.phone}
							variant="outlined"
							InputLabelProps={{
								shrink: true,
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							label="Name"
							onChange={this.nameChange}
							type="text"
							value={this.state.name}
							variant="outlined"
							InputLabelProps={{
								shrink: true,
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							label="Messages"
							onChange={this.contentChange}
							type="text"
							value={this.state.content}
							variant="outlined"
							InputLabelProps={{
								shrink: true,
							}}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Button
							color="primary"
							onClick={this.search}
							variant="contained"
						>Search</Button>
					</Grid>
				</Grid>
				<Box className="summaries">
					{this.state.records.map((o,i) =>
						<MsgSummary
							key={i}
							{...o}
						/>
					)}
				</Box>
			</Box>
		)
	}

	signedIn(user) {
		this.setState({
			user: true
		});
	}

	signedOut() {
		this.setState({
			records: [],
			user: false
		});
	}
}

