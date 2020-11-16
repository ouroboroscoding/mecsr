/**
 * Permissions
 *
 * Handles permissions associated with an Agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-08
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Switch from '@material-ui/core/Switch';

// Generic
import Tools from '../../../generic/tools';

// defines
const CREATE = 4;
const READ   = 1;
const UPDATE = 2;
const DELETE = 8;
const ALL    = 15;
const TYPES = [
	{title: "Customer Service", rights: [
		{name: "csr_agents", title: "Agents: Ability to manage agents and permissions", allowed: ALL},
		{name: "csr_claims", title: "Claims", allowed: CREATE | UPDATE | DELETE},
		{name: "csr_overwrite", title: "Claim Overwrite", allowed: CREATE},
		{name: "csr_messaging", title: "Messaging", allowed: CREATE | READ},
		{name: "csr_templates", title: "Templates: Ability to create and modify templates", allowed: ALL},
		{name: "csr_stats", title: "Stats: Allowed to view stats", allowed: READ}
	]},
	{title: "CRM", rights: [
		{name: "customers", title: "CRM Data", allowed: READ}
	]},
	{title: "Patient Portal", rights: [
		{name: "patient_account", title: "Account", allowed: CREATE | READ | UPDATE}
	]},
	{title: "Memo", rights: [
		{name: "calendly", title: "Calendly Appointment", allowed: READ},
		{name: "memo_mips", title: "Memo MIP", allowed: READ | UPDATE},
		{name: "memo_notes", title: "Memo Notes", allowed: READ | CREATE}
	]},
	{title: "Pharmacy", rights: [
		{name: "prescriptions", title: "Prescriptions", allowed: READ | UPDATE},
		{name: "pharmacy_fill", title: "Pharmacy Fill", allowed: ALL},
		{name: "welldyne_adhoc", title: "Adhoc", allowed: CREATE | READ | DELETE},
		{name: "welldyne_never_started", title: "Never Started", allowed: READ | UPDATE | DELETE},
		{name: "welldyne_outbound", title: "Outbound Failed", allowed: READ | UPDATE}
	]}
];

// Permission
function Permission(props) {

	function change(event) {

		// Get the bit
		let bit = event.currentTarget.dataset.bit;

		// Combine it with the current value and let the parent know
		props.onChange(props.name, props.value ^ bit);
	}

	return (
		<React.Fragment>
			<Grid item xs={4} className="name">{props.title}</Grid>
			{[CREATE, READ, UPDATE, DELETE].map(bit =>
				<Grid key={bit} item xs={2}>
					{props.allowed & bit ?
						<Switch
							checked={props.value & bit ? true : false}
							onChange={change}
							color="primary"
							inputProps={{
								"aria-label": 'primary checkbox',
								"data-bit": bit
							}}
						/>
					:
						''
					}
				</Grid>
			)}
		</React.Fragment>
	);
}

// Force props
Permission.propTypes = {
	"allowed": PropTypes.number.isRequired,
	"onChange": PropTypes.func.isRequired,
	"name": PropTypes.string.isRequired,
	"title": PropTypes.string.isRequired,
	"value": PropTypes.number.isRequired
}

// Permissions
export default class Permissions extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Initial state
		this.state = {
			"value": props.value
		}

		// Bind methods
		this.change = this.change.bind(this);
	}

	change(name, rights) {

		// Clone the current values
		let value = Tools.clone(this.state.value);

		// If there are rights
		if(rights) {

			// Update the specific permission
			if(value[name]) {
				value[name].rights = rights;
			} else {
				value[name] = {"rights": rights, "idents": null};
			}
		}

		// Else, remove the right
		else {
			delete value[name];
		}

		// Update the state
		this.setState({"value": value})
	}

	render() {
		return TYPES.map(section =>
			<Paper className="permissions">
				<Grid container spacing={2}>
					<Grid item xs={4} className="title"><span>{section.title}</span></Grid>
					<Grid item xs={2} className="title"><span>Create</span></Grid>
					<Grid item xs={2} className="title"><span>Read</span></Grid>
					<Grid item xs={2} className="title"><span>Update</span></Grid>
					<Grid item xs={2} className="title"><span>Delete</span></Grid>
					{section.rights.map(perm =>
						<Permission
							allowed={perm.allowed}
							key={perm.name}
							name={perm.name}
							onChange={this.change}
							title={perm.title}
							value={this.state.value[perm.name] ? this.state.value[perm.name].rights : 0}
						/>
					)}
				</Grid>
			</Paper>
		);
	}

	get value() {
		return this.state.value;
	}
}

// Force props
Permissions.propTypes = {
	"value": PropTypes.object
}

// Default props
Permissions.defaultTypes = {
	"value": {}
}
