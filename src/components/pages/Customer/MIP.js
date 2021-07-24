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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI icons
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, safeLocalStorageBool } from 'shared/generic/tools';

// QuestionMultiple
class QuestionMultiple extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.answer.split('|')
		}
		this.clicked = this.clicked.bind(this);
	}
	clicked(event) {
		let index = parseInt(event.target.dataset.index);
		let option = this.props.options[index];
		let value = clone(this.state.value);
		if(event.target.checked) {
			value.push(option);
		} else {
			value.splice(value.indexOf(option), 1);
		}
		this.setState({value: value})
	}
	render() {
		return (
			<FormGroup>
				{this.props.options.map((v,i) =>
					<FormControlLabel
						control={<Checkbox
							color="primary"
							checked={this.state.value.includes(v)}
							inputProps={{
								"data-index": i
							}}
							onChange={this.clicked}
						/>}
						key={i}
						label={v}
					/>
				)}
			</FormGroup>
		);
	}
	get value() {
		return this.state.value.join('|');
	}
}

// QuestionOption component
function QuestionOptions(props) {

	// Refs
	const refField = useRef(null);

	// Save the value
	function save(event) {
		props.onSave(refField.current.value);
	}

	// Render based on the question type
	let field = null;
	switch(props.type) {

		// Text Field
		case 'short_text':
		case 'email':
			field = <TextField
				defaultValue={props.answer || ''}
				inputRef={refField}
				type="text"
				variant="outlined"
			/>
			break;

		case 'number':
			field = <TextField
				defaultValue={props.answer}
				inputRef={refField}
				type="number"
				variant="outlined"
			/>
			break;

		case 'dropdown':
			field = <Select
				defaultValue={props.answer}
				inputProps={{
					inputRef: refField
				}}
				native
				variant="outlined"
			>
				{props.options.map((v,i) =>
					<option key={i}>{v}</option>
				)}
			</Select>
			break;

		case 'date':
			field = <TextField
				defaultValue={props.answer}
				inputRef={refField}
				type="date"
				variant="outlined"
			/>
			break;

		case 'yes_no':
			field = <Select
				defaultValue={props.answer}
				inputProps={{
					inputRef: refField
				}}
				native
				variant="outlined"
			>
				<option value="Yes">Yes</option>
				<option value="No">No</option>
				<option value="">No Selection</option>
			</Select>
			break;

		case 'multiple_choice':
			field = <QuestionMultiple
				answer={props.answer}
				options={props.options}
				ref={refField}
			/>
			break;

		case 'long_text':
		case 'long text':
			field = <TextField
				defaultValue={props.answer || ''}
				inputRef={refField}
				multiline
				rows={5}
				type="text"
				variant="outlined"
			/>
			break;

		default:
			return <span className="noanswer">No Answer</span>
	}

	// Return the options plus the submit/cancel buttons
	return (
		<Box className="qoptions form">
			{field}
			<Box className="actions">
				<Button variant="contained" color="secondary" onClick={props.onCancel}>Cancel</Button>
				<Button variant="contained" color="primary" onClick={save}>Save</Button>
			</Box>
		</Box>
	)
}

// Question component
function Question(props) {

	// State
	let [edit, editSet] = useState(false);
	let [answer, answerSet] = useState('');

	// Effect
	useEffect(() => {
		answerSet(props.question.answer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function editToggle() {
		editSet(!edit);
	}

	function save(answer) {

		// If read-only mode
		if(!props.editable) {
			Events.trigger('error', 'You are in view-only mode. You must claim this customer to continue.');
			return;
		}

		// Sent the value to the server
		Rest.update('monolith', 'customer/mip/answer', {
			landing_id: props.landing,
			ref: props.question.ref,
			value: answer
		}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the new answer and hide the edit
				editSet(false);
				answerSet(answer);
			}
		});
	}

	return (
		<Paper className="question">
			<Box className="qtitle">
				<span>{props.question.title}</span>
				{props.editable &&
					<Tooltip title="Edit the answer">
						<EditIcon className="fakeAnchor" onClick={editToggle} />
					</Tooltip>
				}
			</Box>
			{edit ?
				<QuestionOptions
					answer={answer}
					onCancel={editToggle}
					onSave={save}
					options={props.options}
					type={props.question.type}
				/>
			:
				<Box className="qanswer">
					{answer ? answer.split('|').join(', ') : <span className="noanswer">No Answer</span>}
				</Box>
			}
		</Paper>
	);
}

/**
 * MIP
 *
 * Displays all MIPS for the given customer
 *
 * @name MIP
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function MIP(props) {

	// State
	const [completedOnly, completedOnlySet] = useState(safeLocalStorageBool('mipCompletedOnly', true));
	const [expanded, expandedSet] = useState({});
	const [mips, mipsSet] = useState([]);

	// Completed only effect
	useEffect(() => {
		if(props.mips && completedOnly) {
			mipsSet(mips => {
				mips = [];
				for(let o of props.mips) {
					if(o.completed) {
						mips.push(o);
					}
				}
				return mips;
			});
		} else {
			mipsSet(props.mips);
		}
	}, [completedOnly, props.mips]);

	// Handle accordian change
	function handleChange(event, isExpanded) {
		expandedSet(value => {
			if(event.currentTarget.id in value) {
				delete value[event.currentTarget.id];
			} else {
				value[event.currentTarget.id] = true;
			}
			return clone(value);
		});
	}

	// If we're still loading
	if(mips === null) {
		return (
			<Typography>Loading...</Typography>
		);
	}

	// If there's no mip associated
	else if(mips === 0) {
		return (
			<Typography>No MIP found for this customer</Typography>
		);
	}

	// Else, show the mip
	else {
		return (
			<React.Fragment>
				<Box className="actions">
					<FormControlLabel control={
						<Switch
							checked={completedOnly}
							onChange={ev => {
								completedOnlySet(ev.target.checked);
								localStorage.setItem('mipCompletedOnly', ev.target.checked);
							}}
							color="primary"
						/>
					} label="Completed Only" />
				</Box>
				{mips.map((o, i) =>
					<ExpansionPanel key={i} expanded={expanded[o.id] || false} onChange={handleChange}>
						<ExpansionPanelSummary
							expandIcon={<ExpandMoreIcon />}
							aria-controls={o.id + "_content"}
							id={o.id}
						>
							<Grid container spacing={0}>
								<Grid item xs={2}>{o.date.split('T')[0]}</Grid>
								<Grid item xs={6}>{o.id}</Grid>
								<Grid item xs={2}>{o.form}</Grid>
								<Grid item xs={2}>{o.completed ? "Completed" : <span style={{color: "red"}}>Incomplete</span>}</Grid>
							</Grid>
						</ExpansionPanelSummary>
						<ExpansionPanelDetails>
							{o.questions.map((oQ, iQ) =>
								<Question
									editable={i === 0 && !props.readOnly}
									key={iQ}
									options={o.options[oQ.ref] || null}
									question={oQ}
									landing={o.id}
								/>
							)}
						</ExpansionPanelDetails>
					</ExpansionPanel>
				)}
			</React.Fragment>
		);
	}
}
