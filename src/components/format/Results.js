/**
 * Results
 *
 * Handles generating results
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-18
 */

// NPM modules
import FormatOC from 'format-oc';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { createObjectCsvStringifier } from 'csv-writer';

// Material UI
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableFooter from '@material-ui/core/TableFooter';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI icons
import DeleteIcon from '@material-ui/icons/Delete';
import DescriptionIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

// Components
import FormComponent from './Form';

// Generic modules
import Clipboard from '../../generic/clipboard';
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// PaginationActionsComponent
function PaginationActionsComponent(props) {

	function first(event) {
		props.onChangePage(event, 0);
	}

	function last(event) {
		props.onChangePage(event, Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1));
	}

	function next(event) {
		props.onChangePage(event, props.page + 1);
	}

	function prev(event) {
		props.onChangePage(event, props.page - 1);
	}

	return (
		<div style={{flexShrink: 0}}>
			<IconButton
				onClick={first}
				disabled={props.page === 0}
				aria-label="First Page"
			>
				<FirstPageIcon />
			</IconButton>
			<IconButton
				onClick={prev}
				disabled={props.page === 0}
				aria-label="Previous Page"
			>
				<KeyboardArrowLeft />
			</IconButton>
			<IconButton
				onClick={next}
				disabled={props.page >= Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1)}
				aria-label="Next Page"
			>
				<KeyboardArrowRight />
			</IconButton>
			<IconButton
				onClick={last}
				disabled={props.page >= Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1)}
				aria-label="Last Page"
			>
				<LastPageIcon />
			</IconButton>
		</div>
	);
}

// ResultsRowComponent
function ResultsRowComponent(props) {

	// State
	let [edit, editSet] = useState(false);

	function action(event) {

		// Get the index
		let iIndex = event.currentTarget.dataset.index;

		// Call the appropriate callback
		props.actions[iIndex].callback(
			props.data[props.info.primary]
		);
	}

	function copyKey() {

		// Copy the primary key to the clipboard then notify the user
		Clipboard.copy(props.data[props.info.primary]).then(b => {
			Events.trigger('success', 'Record key copied to clipboard');
		});
	}

	function editSuccess(values) {

		// Clone the data
		let ret = Tools.clone(props.data);

		// For each changed value
		for(let k in values) {
			ret[k] = values[k];
		}

		// Let the parent know
		props.onEdit(ret);

		// Turn off edit mode
		editSet(false);
	}

	function editToggle() {
		editSet(!edit);
	}

	function remove() {
		props.remove(props.data[props.info.primary]);
	}

	let lCells = [];
	for(let i in props.fields) {
		lCells.push(
			<TableCell key={i}>
				{props.fields[i] === props.info.primary ? (
					<Tooltip title="Copy Record Key">
						<VpnKeyIcon className="fakeAnchor" onClick={copyKey} />
					</Tooltip>
				):
					props.data[props.fields[i]].includes('\n') ?
						props.data[props.fields[i]].split('\n').map((s,i) =>
							<p key={i}>{s}</p>
						) :
						props.data[props.fields[i]]
				}
			</TableCell>
		);
	}

	// Add the actions
	lCells.push(
		<TableCell key={-1} className="actions" align="right">
			<Tooltip title="Edit the record">
				<EditIcon className="fakeAnchor" onClick={editToggle} />
			</Tooltip>
			{props.remove &&
				<Tooltip title="Delete the record">
					<DeleteIcon className="fakeAnchor" onClick={remove} />
				</Tooltip>
			}
			{props.actions.map((a, i) =>
				<Tooltip key={i} title={a.tooltip}>
					<a.icon className="fakeAnchor" data-index={i} onClick={action} />
				</Tooltip>
			)}
		</TableCell>
	);

	return (
		<React.Fragment>
			<TableRow>
				{lCells}
			</TableRow>
			{edit &&
				<TableRow>
					<TableCell colSpan={props.fields.length + 1}>
						<FormComponent
							cancel={editToggle}
							errors={props.errors}
							noun={props.info.noun}
							service={props.info.service}
							success={editSuccess}
							tree={props.info.tree}
							type="update"
							value={props.data}
						/>
					</TableCell>
				</TableRow>
			}
		</React.Fragment>
	);
}

// Valid props
ResultsRowComponent.propTypes = {
	"data": PropTypes.object.isRequired,
	"errors": PropTypes.object.isRequired,
	"fields": PropTypes.array.isRequired,
	"info": PropTypes.object.isRequired,
	"onEdit": PropTypes.func.isRequired,
	"remove": PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired
}

// ResultsComponent
export default class ResultsComponent extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Get the display options
		let oReact = props.tree.special('react') || {};

		// If there's no primary, assume '_id'
		if(!('primary' in oReact)) {
			oReact.primary = '_id';
		}

		// If we have the specific type
		if('results' in oReact) {
			this.fields = oReact['results'];
		}

		// Else, if we have the generic 'order'
		else if('order' in oReact) {
			this.fields = oReact['order'];
		}

		// Else, just use the keys
		else {
			this.fields = this.props.parent.keys();
		}

		// Generate the list of titles
		this.titles = [];
		for(let k of this.fields) {
			let oNode = props.tree.get(k).special('react');
			this.titles.push({
				"key": k,
				"text": ('title' in oNode) ? oNode.title : k
			});
		}

		// Store rest info
		this.info = {
			"noun": props.noun,
			"primary": oReact.primary,
			"service": props.service,
			"tree": props.tree
		}

		// Initial state
		this.state = {
			"data": props.data,
			"order": "desc",
			"orderBy": props.orderBy,
			"page": 0,
			"rowsPerPage": parseInt(localStorage.getItem('rowsPerPage')) || 25
		}

		// Bind methods
		this.exportCsv = this.exportCsv.bind(this);
		this.orderChange = this.orderChange.bind(this);
		this.pageChange = this.pageChange.bind(this);
		this.perPageChange = this.perPageChange.bind(this);
		this.recordChanged = this.recordChanged.bind(this);
		this.recordRemoved = this.recordRemoved.bind(this);
	}

	componentDidUpdate(prevProps) {
		if(prevProps.data !== this.props.data) {
			this.setState({data: this.props.data});
		}
	}

	exportCsv() {

		// If there's no data, do nothing
		if(this.state.data.length === 0) {
			Events.trigger('error', 'No data to export to CSV');
			return;
		}

		// Generate the header
		let lHeader = [];
		for(let k of Object.keys(this.state.data[0])) {
			lHeader.push({"id": k, "title": k});
		}

		// Create the CSV write instance
		let csvStringifier = createObjectCsvStringifier({
			"header": lHeader
		})

		// Generate the "file"
		let csv = 'data:text/csv;charset=utf-8,' + encodeURI(
			csvStringifier.getHeaderString() +
			csvStringifier.stringifyRecords(this.state.data)
		);

		// Generate a date to append to the filename
		let date = new Date();

		// Export by generating and clicking a fake link
		let link = document.createElement('a');
		link.setAttribute('href', csv);
		link.setAttribute('download', this.props.tree._name + '_' + date.toISOString() + '.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	orderChange(event) {

		// Save the new orderBy
		let orderBy = event.currentTarget.dataset.key;
		let order = '';

		// If it hasn't actually changed, switch it, else use the order we have
		if(orderBy === this.state.orderBy) {
			order = this.state.order === 'asc' ? 'desc' : 'asc';
		} else {
			order = this.state.order;
		}

		// Save the new state
		this.setState({
			"data": this.sortData(Tools.clone(this.state.data), order, orderBy),
			"order": order,
			"orderBy": orderBy
		});
	}

	pageChange(event, page) {
		this.setState({"page": page})
	}

	perPageChange(event) {
		localStorage.setItem('rowsPerPage', event.target.value);
		this.setState({
			"rowsPerPage": parseInt(event.target.value),
			"page": 0
		});
	}

	render() {
		return (
			<TableContainer className="results">
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							{this.titles.map(title => (
								<TableCell
									key={title.key}
									sortDirection={this.state.orderBy === title.key ? this.state.order : false}
								>
									<TableSortLabel
										active={this.state.orderBy === title.key}
										direction={this.state.orderBy === title.key ? this.state.order : 'asc'}
										data-key={title.key}
										onClick={this.orderChange}
									>
										{title.text}
									</TableSortLabel>
								</TableCell>
							))}
							<TableCell align="right">
								<Tooltip title="Export CSV">
									<DescriptionIcon className="fakeAnchor" onClick={this.exportCsv} />
								</Tooltip>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{(this.state.rowsPerPage > 0 ?
							this.state.data.slice(
								this.state.page * this.state.rowsPerPage,
								this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
							) : this.state.data).map(row =>
							<ResultsRowComponent
								actions={this.props.actions}
								data={row}
								errors={this.props.errors}
								fields={this.fields}
								info={this.info}
								key={row[this.info.primary]}
								onEdit={this.recordChanged}
								remove={this.props.remove ? this.recordRemoved : false}
							/>
						)}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TablePagination
								colSpan={this.titles.length + 1}
								count={this.state.data.length}
								onChangePage={this.pageChange}
								onChangeRowsPerPage={this.perPageChange}
								page={this.state.page}
								rowsPerPage={this.state.rowsPerPage}
								rowsPerPageOptions={[10, 20, 50, { label: 'All', value: -1 }]}
								ActionsComponent={PaginationActionsComponent}
								SelectProps={{
									inputProps: { 'aria-label': 'rows per page' },
									native: true,
								}}
							/>
						</TableRow>
					</TableFooter>
				</Table>
			</TableContainer>
		);
	}

	recordChanged(record) {

		// Clone the state data
		let data = Tools.clone(this.state.data);

		// Find the index
		let iIndex = Tools.afindi(
			data,
			this.info.primary,
			record[this.info.primary]
		);

		// If found
		if(iIndex > -1) {

			// Update the data
			data[iIndex] = record;

			// Save the new state
			this.setState({"data": data});
		}
	}

	recordRemoved(key) {

		console.log('recordRemoved', key);

		// Send the key to the service via rest
		Rest.delete(this.props.service, this.props.noun, {
			[this.info.primary]: key
		}).then(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code in this.props.errors) {
					Events.trigger('error', this.props.errors[res.error.code]);
				} else {
					Events.trigger('error', JSON.stringify(res.error.msg));
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Let the parent know
				this.props.remove(key);
			}
		});
	}

	sortData(data, order, orderBy) {

		// Sort it based on the order and orderBy
		data.sort((a,b) => {

			// If the values are the same
			if(a[orderBy] === b[orderBy]) {
				return 0;
			} else {
				if(a[orderBy] > b[orderBy]) {
					return order === 'asc' ? -1 : 1;
				} else {
					return order === 'asc' ? 1 : -1;
				}
			}
		});

		// Return the sorted data
		return data;
	}
}

// Valid props
ResultsComponent.propTypes = {
	"actions": PropTypes.array,
	"errors": PropTypes.object,
	"noun": PropTypes.string.isRequired,
	"orderBy": PropTypes.string.isRequired,
	"remove": PropTypes.func,
	"service": PropTypes.string.isRequired,
	"tree": PropTypes.instanceOf(FormatOC.Tree).isRequired,
}

// Default props
ResultsComponent.defaultProps = {
	"actions": [],
	"errors": {},
	"remove": false
}
