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
import React, { useState } from 'react';

// Shared hooks
import { useEvent } from 'shared/hooks/event';

/**
 * Loader
 *
 * Handles showing the ajax loader image
 *
 * @name Loader
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Loader(props) {

	// State
	let [count, countSet] = useState(1);

	// Hooks
	useEvent('LoaderShow', () => {
		countSet(i => i+1);
	});
	useEvent('LoaderHide', () => {
		countSet(i => i-1);
	});

	// Render
	return <img src="/images/ajax.gif" alt="ajax" style={{display: count > 0 ? 'inline' : 'none'}} />
}
