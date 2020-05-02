/**
 * Search
 *
 * Used to search through customer messaging
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-31
 */

// NPM modules
import React from 'react';

// Generic modules
//import Events from '../../generic/events';
//import Rest from '../../generic/rest';

// Local modules
//import Utils from '../../utils';

// Search component
export default class Search extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initial state
		this.state = {
			user: props.user ? true : false
		}
	}

	render() {
		return <div />
	}
}
