/**
 * Templates
 *
 * Created, edit, and delete templates used in auto-generating SMS messages
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-17
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useState, useEffect } from 'react';

// Material UI
//import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
//import Tab from '@material-ui/core/Tab';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
//import Tabs from '@material-ui/core/Tabs';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';

// Format Components
import ResultsComponent from '../format/Results';
import FormComponent from '../format/Form';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Definitions
//import TemplateEmailDef from '../../definitions/csr/tpl_email';
import TemplateSMSDef from '../../definitions/csr/tpl_sms';

// Generate the template Trees
//const TemplateEmailTree = new Tree(TemplateEmailDef);
const TemplateSMSTree = new Tree(TemplateSMSDef);

/**
 * Generic Templates
 *
 * Wraps common code that both tabs use
 *
 * @name GenericTemplates
 * @extends React.Component
 */
function GenericTemplates(props) {

	// State
	let [templates, templatesSet] = useState(null);
	let [create, createSet] = useState(false);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetchTemplates();
		} else {
			templatesSet(null);
		}

	}, [props.user]); // React to user changes

	function createSuccess(template) {
		console.log(template);
		templatesSet(templates => {
			let ret = Tools.clone(templates);
			ret.unshift(template);
			return ret;
		});
		createSet(false);
	}

	// Toggle the create form
	function createToggle() {
		createSet(b => !b);
	}

	// Fetch all the templates from the server
	function fetchTemplates() {

		// Fetch all templates
		Rest.read('csr', props.noun + 's', {}).done(res => {

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

				// Set the templates
				templatesSet(res.data);
			}
		});
	}

	// Remove a template
	function removeTemplate(_id) {

		// Use the current templates to set the new templates
		templatesSet(templates => {

			// Clone the templates
			let ret = Tools.clone(templates);

			// Find the index
			let iIndex = Tools.afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new templates
			return ret;
		});
	}

	return (
		<Box className="templates">
			<Box className="pageHeader">
				<Typography variant="h3" className="title">{props.title}</Typography>
				<Tooltip title="Create new template">
					<IconButton onClick={createToggle}>
						<AddCircleIcon />
					</IconButton>
				</Tooltip>
			</Box>
			{create &&
				<Paper className="padded">
					<FormComponent
						cancel={createToggle}
						errors={{1200: "Email already in use", 1204: "Password not strong enough"}}
						name={props.createTitle}
						noun={props.noun}
						service="csr"
						success={createSuccess}
						tree={props.tree}
						type="create"
					/>
				</Paper>
			}

			{templates === null ?
				<div>Loading...</div>
			:
				<ResultsComponent
					data={templates}
					noun={props.noun}
					orderBy="title"
					remove={removeTemplate}
					service="csr"
					tree={props.tree}
				/>
			}

		</Box>
	);
}

/**
 * Templates
 *
 * Wrapper for email and SMS templates
 *
 * @name Templates
 * @extends React.Component
 */
export default function Templates(props) {

	// State
	//let [tab, tabSet] = useState(0);

	// When selected tab changes
	//function tabChange(event, tab) {
	//	tabSet(tab);
	//}

	// Return the rendered component
	return (
		<div id="templates">
			{/*<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="SMS" />
					<Tab label="Email" />
				</Tabs>
			</AppBar>*/}
			<div className="sms" style={{display: 'flex'}}>
				<GenericTemplates
					createTitle="SMS Template"
					noun="template/sms"
					title="SMS Templates"
					tree={TemplateSMSTree}
					user={props.user}
				/>
			</div>
			{/*<div className="email" style={{display: tab === 1 ? 'block' : 'none'}}>
				<GenericTemplates
					createTitle="Email Template"
					noun="template/email"
					title="Email Templates"
					tree={TemplateEmailTree}
					user={props.user}
				/>
			</div>*/}
			<div className="legend">
				<Typography variant="h4">Legend</Typography>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Variable</TableCell>
							<TableCell>Replacement</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>{"{billing}"}</TableCell>
							<TableCell>
								John Smith<br />
								123 Main Street<br />
								Apt #4<br />
								Boonville, NC<br />
								US, 27011
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{billing_first}"}</TableCell>
							<TableCell>John</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{billing_last}"}</TableCell>
							<TableCell>Smith</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{email}"}</TableCell>
							<TableCell>jsmith@gmail.com</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{shipping}"}</TableCell>
							<TableCell>
								Clark Kent<br />
								123 Main Street<br />
								Metropolis, NY<br />
								US, 10001
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{shipping_first}"}</TableCell>
							<TableCell>Clark</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>{"{shipping_last}"}</TableCell>
							<TableCell>Kent</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
