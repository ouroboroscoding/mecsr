/**
 * Format Parent
 *
 * Handles groups of FormatOC nodes
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-10
 */

// NPM modules
import FormatOC from 'format-oc';
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Components
import NodeComponent from './Node';

// Generic modules
import Events from '../../generic/events';

// ParentComponent
export default class ParentComponent extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Init state
		this.state = this.generateState();

		// Init the field refs
		this.fields = {};
	}

	error(errors) {
		for(var k in errors) {
			if(k in this.fields) {
				this.fields[k].error(errors[k]);
			} else {
				Events.trigger('error', 'Field not found error: ' + errors[k] + ' (' + k + ')');
			}
		}
	}

	generateState() {

		// Init the return
		let lElements = [];

		// Get the React special section if there is one
		let oReact = this.props.parent.special('react') || {};

		// Init the order
		let lOrder = null;

		// If we have the specific type
		if(this.props.type in oReact) {
			lOrder = oReact[this.props.type];
		}

		// Else, if we have the generic 'order'
		else if('order' in oReact) {
			lOrder = oReact['order'];
		}

		// Else, just use the keys
		else {
			lOrder = this.props.parent.keys();
		}

		// Go through each node
		for(let i in lOrder) {

			// Get the node
			let oChild = this.props.parent.get(lOrder[i]);

			// Check what kind of node it is
			switch(oChild.class()) {
				case 'Parent':
					lElements.push(
						<Grid key={i} item xs={12}>
							<ParentComponent
								ref={el => this.fields[lOrder[i]] = el}
								name={lOrder[i]}
								node={oChild}
								onEnter={this.props.onEnter}
								value={this.props.value[lOrder[i]] || {}}
								validation={this.props.validation}
							/>
						</Grid>
					);
					break;
				case 'Node':
					lElements.push(
						<Grid key={i} item xs={12} sm={6} lg={3}>
							<NodeComponent
								ref={el => this.fields[lOrder[i]] = el}
								name={lOrder[i]}
								node={oChild}
								onEnter={this.props.onEnter}
								value={this.props.value[lOrder[i]] || null}
								validation={this.props.validation}
							/>
						</Grid>
					);
					break;
				default:
					throw new Error('Invalid Node type in parent of child: ' + lOrder[i]);
			}
		}

		// Return the list of elements we generated
		return {
			"elements": lElements,
			"order": lOrder,
			"title": oReact.title || false
		};
	}

	render() {
		return (
			<Grid container spacing={2} className={"nodeParent _" + this.props.name}>
				{this.state.title &&
					<Typography variant="h6">{this.state.title}</Typography>
				}
				{this.state.elements}
			</Grid>
		);
	}

	valid() {

		// Valid?
		let bValid = true;

		// Go through each item and validate it
		for(let k of this.state.order) {

			// Get the node
			let oNode = this.props.parent.get(k);

			// Check if the current value is valid
			if(!oNode.valid(this.fields[k].value)) {
				this.fields[k].error(oNode.validation_failures[0][1]);
				bValid = false;
			}
		}

		// Return valid state
		return bValid;
	}

	get value() {

		// Init the return value
		let oRet = {};

		// Go through all the fields used
		for(let k in this.fields) {

			// Get the new value
			let newVal = this.fields[k].value;

			// If we're in update mode
			if(this.props.type === 'update') {

				// If the value is different
				if(this.props.value[k] !== newVal) {
					oRet[k] = newVal;
				}
			}

			// Else we're in insert or search mode
			else {

				// If the value isn't null, add it
				if(newVal !== null) {
					oRet[k] = newVal;
				}
			}
		}

		// Return the values
		return oRet;
	}

	set value(val) {
		for(let k in val) {
			this.fields[k].value = val[k];
		}
	}
}

// Valid props
ParentComponent.propTypes = {
	"name": PropTypes.string.isRequired,
	"onEnter": PropTypes.func,
	"parent": PropTypes.instanceOf(FormatOC.Parent).isRequired,
	"type": PropTypes.oneOf(['insert', 'search', 'update']).isRequired,
	"value": PropTypes.object,
	"validation": PropTypes.bool
}

// Default props
ParentComponent.defaultProps = {
	"onEnter": () => {},
	"value": {},
	"validation": true
}
