/**
 * Loader
 *
 * Handles the loader
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-08
 */

// NPM modules
import React from 'react';

// Generic modules
import Events from  '../../generic/events';

// Local variables
let _count = 1;

// Loader component
export default class Loader extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			visible: _count !== 0
		}
		this.event = this.event.bind(this);
	}

	componentDidMount() {
		Events.add('Loader', this.event);
	}

	componentWillUnmount() {
		Events.remove('Loader', this.event);
	}

	event(show) {
		this.setState({visible: show});
	}

	render() {
		return <img src="/images/ajax.gif" alt="ajax" style={{display: this.state.visible ? 'inline' : 'none'}} />
	}
}

export function LoaderHide() {

	// Decrement the count
	_count--;

	// If this is the last one
	if(_count === 0) {
		Events.trigger('Loader', false);
	}
}

export function LoaderShow() {

	// Increment the count
	_count++;

	// If this is the first one
	if(_count === 1) {
		Events.trigger('Loader', true);
	}
}
