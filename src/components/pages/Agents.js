/**
 * Agents
 *
 * Page to add/edit agents to the tool
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-07
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useRef, useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import HttpsIcon from '@material-ui/icons/Https';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

// Composites
import Permissions from './agents/Permissions';

// Format Components
import ResultsComponent from '../format/Results';
import FormComponent from '../format/Form';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Agent Definition
import AgentDef from '../../definitions/csr/agent_memo';

// Generate the agent Tree
const AgentTree = new Tree(AgentDef);

/**
 * Agents
 *
 * Lists all agents in the system with the ability to edit their permissions and
 * password as well as add new agents
 *
 * @name Agents
 * @extends React.Component
 */
export default function Agents(props) {

	// State
	let [agents, agentsSet] = useState(null);
	let [create, createSet] = useState(false);
	let [password, passwordSet] = useState(false);
	let [permissions, permissionsSet] = useState(false);

	// Refs
	let passwdRef = useRef();
	let permsRef = useRef();

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetchAgents();
		} else {
			agentsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function createSuccess(agent) {
		agentsSet(agents => {
			let ret = Tools.clone(agents);
			ret.unshift(agent);
			return ret;
		});
		createSet(false);
	}

	// Toggle the create form
	function createToggle() {
		createSet(b => !b);
	}

	// Fetch all the agents from the server
	function fetchAgents() {

		// Fetch all agents
		Rest.read('csr', 'agents', {}).done(res => {

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

				// Set the agents
				agentsSet(res.data);
			}
		});
	}

	function passwordUpdate() {

		// Update the agent's password
		Rest.update('csr', 'agent/passwd', {
			"agent_id": password,
			"passwd": passwdRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				Events.trigger('success', 'Password updated');
				passwordSet(false);
			}
		})
	}

	function permissionsCancel() {
		permissionsSet(false);
	}

	function permissionsShow(agent_id) {

		// Fetch the agent's permissions
		Rest.read('csr', 'agent/permissions', {
			"agent_id": agent_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the permissions
				permissionsSet({
					"_id": agent_id,
					"rights": res.data
				});
			}
		});
	}

	function permissionsUpdate() {

		// Update the agent's permissions
		Rest.update('csr', 'agent/permissions', {
			"agent_id": permissions._id,
			"permissions": permsRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Hide permissions dialog
				permissionsSet(false);

				// Notify success
				Events.trigger('success', 'Permissions updated');
			}
		});
	}

	// Remove a agent
	function removeAgent(_id) {

		// Use the current agents to set the new agents
		agentsSet(agents => {

			// Clone the agents
			let ret = Tools.clone(agents);

			// Find the index
			let iIndex = Tools.afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new agents
			return ret;
		});
	}

	// Return the rendered component
	return (
		<div id="agents">
			<div className="agents">
				<Box className="pageHeader">
					<Typography variant="h4">Agents</Typography>
					{Utils.hasRight(props.user, 'csr_agents', 'create') &&
						<Tooltip title="Create new agent">
							<IconButton onClick={createToggle}>
								<AddCircleIcon />
							</IconButton>
						</Tooltip>
					}
				</Box>
				{create &&
					<Paper className="padded">
						<FormComponent
							cancel={createToggle}
							errors={{
								1501: "Username already in use",
								1502: "Password not strong enough"
							}}
							noun="agent"
							service="csr"
							success={createSuccess}
							title="Create New"
							tree={AgentTree}
							type="create"
						/>
					</Paper>
				}

				{agents === null ?
					<div>Loading...</div>
				:
					<ResultsComponent
						actions={[
							{"tooltip": "Edit Agent's permissions", "icon": HttpsIcon, "callback": permissionsShow},
							{"tooltip": "Change Agent's password", "icon": VpnKeyIcon, "callback": agent_id => passwordSet(agent_id)}
						]}
						data={agents}
						errors={{
							1501: "Username already in use",
						}}
						noun="agent"
						orderBy="userName"
						remove={Utils.hasRight(props.user, 'csr_agents', 'delete') ? removeAgent : false}
						service="csr"
						tree={AgentTree}
						update={Utils.hasRight(props.user, 'csr_agents', 'update')}
					/>
				}
				{permissions &&
					<Dialog
						aria-labelledby="confirmation-dialog-title"
						maxWidth="lg"
						onClose={permissionsCancel}
						open={true}
					>
						<DialogTitle id="permissions-dialog-title">Update Permissions</DialogTitle>
						<DialogContent dividers>
							<Permissions
								ref={permsRef}
								value={permissions.rights}
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={permissionsCancel}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={permissionsUpdate}>
								Update
							</Button>
						</DialogActions>
					</Dialog>
				}
				{password &&
					<Dialog
						aria-labelledby="confirmation-dialog-title"
						maxWidth="lg"
						onClose={() => passwordSet(false)}
						open={true}
					>
						<DialogTitle id="password-dialog-title">Update Password</DialogTitle>
						<DialogContent dividers>
							<TextField
								label="New Password"
								inputRef={passwdRef}
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={() => passwordSet(false)}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={passwordUpdate}>
								Update
							</Button>
						</DialogActions>
					</Dialog>
				}
			</div>
		</div>
	);
}
