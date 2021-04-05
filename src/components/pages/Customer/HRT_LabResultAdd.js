/**
 * HRT Lab Result Add
 *
 * A form to enter new lab results
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-09
 */

// NPM modules
import Parent from 'format-oc/Parent'
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { green } from '@material-ui/core/colors';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';

// Format Components
import { Parent as ParentComponent } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, omap, uuidv4 } from 'shared/generic/tools';

// Definitions
import LabResultDef from 'definitions/monolith/hrt_lab_result';
import LabResultTestDef from 'definitions/monolith/hrt_lab_result_tests';

// Parents
let LabResultParent = new Parent(clone(LabResultDef));
let LabResultTestParent = new Parent(clone(LabResultTestDef));

/**
 * Lab Results Create
 *
 * The primary record
 *
 * @name LabResultCreate
 * @access public
 * @param Object props Attributes sent to component
 * @returns React.Component
 */
export default function LabResultAdd(props) {

	// State
	let [tests, testsSet] = useState([{
		key: uuidv4()
	}]);

	// Refs
	let refResult = useRef();
	let refTests = useRef(tests.reduce((r,o) => ({...r, [o.key]: React.createRef()}), {}));

	// Called on create submit
	function create() {

		// Generate the data
		let oData = {
			customerId: props.customerId.toString(),
			...refResult.current.value,
			tests: omap(refTests.current, ref => ref.current.value)
		}

		// Send the data to the server
		Rest.create('monolith', 'customer/hrt/lab', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1001) {
					Events.trigger('error', 'Please fix invalid fields');
					console.error(res.error.msg);
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {

				// Notify the user
				Events.trigger('success', 'Added new lab results');

				// Notify the parent
				props.success();
			}
		})
	}

	// Add a new test to the list
	function testAdd() {

		// Clone the existing tests
		let lTests = clone(tests);

		// Generate a new element and add it
		let o = {key: uuidv4()}
		lTests.push(o);

		// Update the refs
		refTests.current[o.key] = React.createRef();

		// Update the state
		testsSet(lTests);
	}

	// Remove an existing test from the list
	function testRemove(index) {

		// If we only have one address left
		if(tests.length === 1) {
			Events.trigger('error', 'Must have at least one test');
			return;
		}

		// Clone the existing tests
		let lTests = clone(tests);

		// Delete the key from the refs
		delete refTests.current[lTests[index].key]

		// Remove the test
		lTests.splice(index, 1);

		// Update the state
		testsSet(lTests);
	}

	// Render
	return (
		<Paper className="hrt_lab_result_add padded form">
			<Box className="section_header">
				<Typography className="sub-title">Add New Lab Results</Typography>
			</Box>
			<ParentComponent
				name="HrtLabResult"
				node={LabResultParent}
				ref={refResult}
				type="create"
				value={{
					"customerId": props.customerId
				}}
			/>
			<Box className="section_header">
				<Typography className="sub-title">Tests</Typography>
			</Box>
			{tests.map((o,i) =>
				<Paper key={o.key} className="hrt_lab_result_test_add padded form">
					<Box className="flexColumns">
						<Box className="grow">
							<ParentComponent
								name="HrtLabResultTest"
								node={LabResultTestParent}
								ref={refTests.current[o.key]}
								type="create"
							/>
						</Box>
						<Box className="static">
							<Tooltip title="Remove Test">
								<IconButton onClick={ev => testRemove(i)}>
									<RemoveCircleIcon color="secondary" />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				</Paper>
			)}
			<Box className="flexColumns">
				<Box className="grow">&nbsp;</Box>
				<Box className="static">
					<Tooltip title="Add Test">
						<IconButton onClick={testAdd}>
							<AddCircleIcon style={{color: green[500]}} />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>
			<Box className="actions">
				<Button variant="contained" color="secondary" onClick={props.cancel}>Cancel</Button>
				<Button variant="contained" color="primary" onClick={create}>Add</Button>
			</Box>
		</Paper>
	)
}

LabResultAdd.propTyoes = {
	cancel: PropTypes.func.isRequired,
	customerId: PropTypes.string.isRequired,
	success: PropTypes.func.isRequired
}
