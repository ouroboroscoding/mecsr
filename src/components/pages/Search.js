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
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

// Components
import MsgSummary from '../composites/MsgSummary';

// Component functions
import claimed from '../functions/claimed';

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
			email: '',
			id: '',
			name: '',
			phone: '',
			records: [],
			searchType: '0',
			user: props.user || false
		}

		// Bind methods
		this.claim = this.claim.bind(this);
		this.contentChange = this.contentChange.bind(this);
		this.emailChange = this.emailChange.bind(this);
		this.idChange = this.idChange.bind(this);
		this.keyPressedConversations = this.keyPressedConversations.bind(this);
		this.keyPressedCustomer = this.keyPressedCustomer.bind(this);
		this.nameChange = this.nameChange.bind(this);
		this.phoneChange = this.phoneChange.bind(this);
		this.searchChange = this.searchChange.bind(this);
		this.searchConversations = this.searchConversations.bind(this);
		this.searchCustomer = this.searchCustomer.bind(this);
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

	claim(number, name) {

		console.log('Search.claim(' + number + ', ' + name + ')');

		// Get the claimed add promise
		claimed.add(number).then(res => {
			Events.trigger('claimedAdd', number, name, res.customerId);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Customer has already been claimed.');
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	contentChange(event) {
		this.setState({content: event.target.value});
	}

	emailChange(event) {
		this.setState({email: event.target.value});
	}

	idChange(event) {
		this.setState({id: event.target.value});
	}

	keyPressedConversations(event) {
		if(event.key === 'Enter') {
			this.searchConversations();
		}
	}

	keyPressedCustomer(event) {
		if(event.key === 'Enter') {
			this.searchCustomer();
		}
	}

	nameChange(event) {
		this.setState({name: event.target.value});
	}

	phoneChange(event) {
		this.setState({phone: event.target.value});
	}

	searchChange(event) {
		this.setState({
			searchType: event.target.value
		});
	}

	searchConversations() {

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

		// If there's no params, do nothing
		if(Tools.empty(oParams)) {
			return;
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

	searchCustomer() {

		// Generate params
		let oParams = {};
		if(this.state.id.trim() !== '') {
			oParams.id = this.state.id;
		}
		if(this.state.email.trim() !== '') {
			oParams.email = this.state.email;
		}

		// If there's no params, do nothing
		if(Tools.empty(oParams)) {
			return;
		}

		// Fetch the unclaimed
		Rest.read('monolith', 'msgs/search/customer', oParams).done(res => {

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
					<Grid item xs={12} sm={12} md={2}>
						<FormControl variant="outlined">
							<InputLabel htmlFor="search-type">Search By</InputLabel>
							<Select
								inputProps={{
									id: 'search-type'
								}}
								label="Search Type"
								onChange={this.searchChange}
								native
								value={this.state.searchType}
								variant="outlined"
							>
								<option value="0">Conversations</option>
								<option value="1">Customers</option>
							</Select>
						</FormControl>
					</Grid>
					{this.state.searchType === '0' &&
						<React.Fragment>
							<Grid item xs={12} sm={6} md={3}>
								<TextField
									label="Phone Number"
									onChange={this.phoneChange}
									onKeyPress={this.keyPressedConversations}
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
									onKeyPress={this.keyPressedConversations}
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
									onKeyPress={this.keyPressedConversations}
									type="text"
									value={this.state.content}
									variant="outlined"
									InputLabelProps={{
										shrink: true,
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={1}>
								<Button
									color="primary"
									onClick={this.searchConversations}
									variant="contained"
								>Search</Button>
							</Grid>
						</React.Fragment>
					}
					{this.state.searchType === '1' &&
						<React.Fragment>
							<Grid item xs={12} sm={6} md={3}>
								<TextField
									label="Customer ID"
									onChange={this.idChange}
									onKeyPress={this.keyPressedCustomer}
									type="text"
									value={this.state.id}
									variant="outlined"
									InputLabelProps={{
										shrink: true,
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<TextField
									label="Email"
									onChange={this.emailChange}
									onKeyPress={this.keyPressedCustomer}
									type="text"
									value={this.state.email}
									variant="outlined"
									InputLabelProps={{
										shrink: true,
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={6} md={1}>
								<Button
									color="primary"
									onClick={this.searchCustomer}
									variant="contained"
								>Search</Button>
							</Grid>
						</React.Fragment>
					}
				</Grid>
				<Box className="summaries">
					{this.state.records.map((o,i) =>
						<MsgSummary
							onClaim={this.claim}
							key={i}
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
		});
	}

	signedOut() {
		this.setState({
			records: [],
			user: false
		});
	}
}

