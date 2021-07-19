/**
 * Customer Summary
 *
 * Shows a pending Order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-24
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Review Summary
 *
 * Handles displaying the review stats with appropriate colours
 *
 * @name ReviewSummary
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function ReviewSummary(props) {

	// Calculate the average
	let fAverage = (props.total / props.count);

	// Figure out the average colour
	let sAverage = 'green';
	if(fAverage < 6.0) {
		sAverage = 'red';
	} else if(fAverage < 8.0) {
		sAverage = '#ffca00';
	}

	// Figure out the last colour
	let sLast = 'green';
	if(props.last < 6) {
		sLast = 'red';
	} else if(props.last < 8) {
		sLast = '#ffca00';
	}

	// Render
	return (
		<span className="customerReview">
			<span style={{color: sLast}}>{props.last}</span> / <span style={{color: sAverage}}>{fAverage.toFixed(1)}</span> A
		</span>
	);
}

// Force props
ReviewSummary.propTypes = {
	count: PropTypes.number.isRequired,
	total: PropTypes.string.isRequired,
	last: PropTypes.string.isRequired
}

// Default props
ReviewSummary.defaultTypes = {}
