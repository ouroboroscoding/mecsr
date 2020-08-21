/**
 * Misc
 *
 * Shows data that doesn't fit a specific tab
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-21
 */

// NPM modules
import React from 'react';

// Material UI
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

// Local modules
import Utils from '../../../utils';

// Misc component
export default function Misc(props) {

	// Calendly elements
	let calendly = null;

	// If the user has rights to view calendly
	if(Utils.hasRight(props.user, 'calendly', 'read')) {

		// If we're still loading
		let inner = null
		if(props.calendly === null) {
			inner = <p>Loading...</p>
		} else if(props.calendly.length === 0) {
			inner = <p>No appointments found</p>
		} else {
			inner = (
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							<TableCell>Starts at</TableCell>
							<TableCell>Ends at</TableCell>
							<TableCell>Provider Name</TableCell>
							<TableCell>Provider E-mail</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{props.calendly.map(o =>
							<TableRow key={o.id}>
								<TableCell>{o.start}</TableCell>
								<TableCell>{o.end}</TableCell>
								<TableCell>{o.prov_name}</TableCell>
								<TableCell>{o.prov_emailAddress}</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			)
		}

		// Header + content
		calendly = (
			<React.Fragment>
				<div className="pageHeader">
					<div className="title">Calendly Appointments</div>
				</div>
				{inner}
			</React.Fragment>
		)
	}

	// Render
	return (
		<React.Fragment>
			{calendly}
		</React.Fragment>
	);
}
