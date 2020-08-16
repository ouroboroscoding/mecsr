/**
 * Lists
 *
 * Handles agent custom lists
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-15
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import { withStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Drawer from '@material-ui/core/Drawer';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Materal UI Icons
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';

// Data modules
import customLists from '../../data/customLists';

// Generic modules
import Events from '../../generic/events';
import Tools from '../../generic/tools';

// Project modules
import Utils from '../../utils';

// Material-UI is truly terrible
const Accordion = withStyles({
	root: {
		border: '1px solid rgba(0, 0, 0, .125)',
		boxShadow: 'none',
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
		'&$expanded': {
			margin: 'auto',
		},
	},
	"expanded": {}
})(ExpansionPanel);
const AccordionSummary = withStyles({
	root: {
		backgroundColor: 'rgba(0, 0, 0, .03)',
		borderBottom: '1px solid rgba(0, 0, 0, .125)',
		marginBottom: -1,
		minHeight: 56,
		'&$expanded': {
			minHeight: 56,
		},
	},
	content: {
		'&$expanded': {
			margin: '12px 0',
		},
	},
	"expanded": {}
})(ExpansionPanelSummary);
const AccordionDetails = withStyles((theme) => ({
	root: {
		padding: theme.spacing(2),
	}
}))(ExpansionPanelDetails);

/**
 * Custom List Item
 *
 * Represents a single item in a custom list
 *
 * @name CustomListItem
 * @access private
 * @param Object props Element properties
 * @return React.Component
 */
function CustomListItem(props) {

	function click() {
		Events.trigger('viewedAdd', props.number, props.name);
		props.onClick();
	}

	function remove(event) {

		// Stop any propagation
		event.stopPropagation();
		event.preventDefault();

		// Call the parent
		props.onDelete(props._id);
	}

	return (
		<ListItem button onClick={click}>
			<ListItemText
				primary={props.name}
				secondary={
					<span>
						ID: {props.customer}<br/>
						#: {Utils.nicePhone(props.number)}
					</span>
				}
			/>
			<Tooltip title="Delete">
				<IconButton onClick={remove}>
					<CloseIcon />
				</IconButton>
			</Tooltip>
		</ListItem>
	);
}

/**
 * Custom List
 *
 * Represents a single custom list and all items
 *
 * @name CustomList
 * @access private
 * @param Object props Element properties
 * @return React.Component
 */
function CustomList(props) {

	function expand() {
		props.onExpand(props.expanded ? false : props._id);
	}

	function remove(event) {

		// Stop any propagation
		event.stopPropagation();
		event.preventDefault();

		// If we have any items in the list
		if(props.items.length) {

			// Confirm
			if(!window.confirm('This will delete all items in this list, do you wish to continue?')) {
				return;
			}
		}

		// Delete the list
		customLists.deleteList(props._id);
	}

	function removeItem(item_id) {

		// Delete the item
		customLists.deleteItem(props._id, item_id);
	}

	// If we have no items
	let items = null;
	if(props.items.length === 0) {
		items = (
			<ListItem>
				<ListItemText primary="List has no items" />
			</ListItem>
		);
	} else {
		items = props.items.map(o =>
			<CustomListItem
				key={o._id}
				onClick={props.onLink}
				onDelete={removeItem}
				{...o}
			/>
		);
	}

	return (
		<Accordion
			expanded={props.expanded}
			onChange={expand}
			square
		>
			<AccordionSummary>
				<Typography>{props.title}</Typography>
				<Tooltip title="Delete List">
					<IconButton onClick={remove}>
						<CloseIcon />
					</IconButton>
				</Tooltip>
			</AccordionSummary>
			<AccordionDetails>
				<List style={{padding: 0}}>
				{items}
				</List>
			</AccordionDetails>
		</Accordion>
	)
}

/**
 * Custom Lists
 *
 * Represents all custom lists
 *
 * @name CustomLists
 * @access public
 * @param Object props Element properties
 * @return React.Component
 */
export default function CustomLists(props) {

	// State
	let [create, createSet] = useState(false);
	let [lists, listsSet] = useState([]);
	let [open, openSet] = useState(Tools.safeLocalStorage('openList', false));

	// Refs
	let titleRef = useRef()

	// Track list data effect
	useEffect(() => {

		// Track custom lists changes
		customLists.track(listsChanged);

		// Remove the tracking when we're done
		return () => customLists.track(listsChanged, true);

	}, []);

	function listCreate() {

		// Store the new title minus any useless spacing
		let sTitle = titleRef.current.value.trim();

		// Return if we have no value
		if(sTitle.length === 0) {
			return;
		}

		// Send it to the data
		customLists.createList(sTitle, _id => {

			// Close the create dialog
			createSet(false);
		});
	}

	function listExpanded(_id) {
		openSet(_id);
	}

	function listsChanged(lists) {
		listsSet(lists);
	}

	function keyPressed(event) {
		if(event.key === 'Enter') {
			listCreate();
		}
	}

	return (
		<Drawer
			anchor="right"
			open={props.open}
			onClose={ev => props.onClose(ev)}
		>
			<Box id="custom_lists">
				<Box className="create">
					{create ?
						<React.Fragment>
							<Button color="secondary" onClick={ev => createSet(false)} variant="contained" style={{width: "100%"}}>
								<CloseIcon />
							</Button>
							<TextField
								autoFocus
								inputRef={titleRef}
								onKeyPress={keyPressed}
								style={{width: "100%"}}
								variant="outlined"
							/>
							<Button color="primary" onClick={listCreate} variant="contained" style={{width: "100%"}}>
								<AddIcon />
							</Button>
						</React.Fragment>
					:
						<Button color="primary" onClick={ev => createSet(true)} variant="contained" style={{width: "100%"}}>
							<AddIcon />
						</Button>
					}
				</Box>
				<Box className="accordion">
					{lists.map(o =>
						<CustomList
							expanded={open === o._id}
							key={o._id}
							onExpand={listExpanded}
							onLink={props.onClose}
							{...o}
						/>
					)}
				</Box>
			</Box>
		</Drawer>
	);
}

// Force props
CustomLists.propTypes = {
	"lists": PropTypes.bool.isRequired,
	"onClose": PropTypes.func.isRequired
}

/**
 * Custom Lists Dialog
 *
 * Displays a dialog for adding a conversation to a list
 *
 * @name CustomListsDialog
 * @access public
 * @param Object props Element properties
 * @return React.Component
 */
export function CustomListsDialog(props) {

	// State
	let [list, listSet] = useState(Tools.safeLocalStorage('customListAdd', '-1'));
	let [lists, listsSet] = useState(customLists.fetch());

	// Refs
	let listRef = useRef();
	let titleRef = useRef();

	// Track list data effect
	useEffect(() => {

		// Track custom lists changes
		customLists.track(listsChanged);

		// Remove the tracking when we're done
		return () => customLists.track(listsChanged, true);

	}, []);

	function listsChanged(lists) {
		listsSet(lists);
	}

	function selectChanged(event) {
		listSet(listRef.current.value);
	}

	function itemCreate(list) {
		customLists.createItem(list, {
			"customer": props.customer,
			"name": props.name || '',
			"number": props.number
		}, _id => {
			props.onClose();
			localStorage.setItem('customListAdd', list);
		});
	}

	function submit(event) {

		// If we need a new list
		if(list === '-1') {

			// Store the new title minus any useless spacing
			let sTitle = titleRef.current.value.trim();

			// Return if we have no value
			if(sTitle.length === 0) {
				return;
			}

			// Create the list
			customLists.createList(sTitle, _id => {

				// Create the item
				itemCreate(_id);
			});
		} else {
			itemCreate(list);
		}
	}

	// If the list is not in the available ones
	if(list !== '-1' && Tools.afindi(lists, '_id', list) === -1) {
		listSet('-1');
	}

	return (
		<Dialog
			maxWidth="lg"
			onClose={props.onClose}
			open={true}
			PaperProps={{
				className: "customLists"
			}}
		>
			<DialogTitle>Add Conversation to Custom List</DialogTitle>
			<DialogContent dividers>
				<Typography type="p">
					Add {props.name} {Utils.nicePhone(props.number)} to which Custom List<br /><br />
				</Typography>
				<Select
					inputRef={listRef}
					native
					onChange={selectChanged}
					value={list}
					variant="outlined"
				>
					<option value="-1">New list</option>
					{lists.map(o =>
						<option
							key={o._id}
							value={o._id}
						>
							{o.title}
						</option>
					)}
				</Select>
				{list === '-1' &&
					<TextField
						inputRef={titleRef}
						variant="outlined"
					/>
				}
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				<Button variant="contained" color="primary" onClick={submit}>
					Add to List
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Force props
CustomLists.propTypes = {
	"onClose": PropTypes.func.isRequired
}
