/**
 * Notes
 *
 * Shows a specific customer's internal notes (soap notes)
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-25
 */

// NPM modules
import React from 'react';

// Material UI
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

// Notes component
export default function Notes(props) {

	// If we're still loading
	if(props.notes === null) {
		return <p>Loading...</p>
	}

	// If there's no notes associated
	else if(props.notes === 0 || props.notes.length === 0) {
		return <p>No notes found for this customer</p>
	}

	// Else, show the notes
	else {
		return (
			<TableContainer component={Paper} className="notes">
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							<TableCell>Details</TableCell>
							<TableCell>Note</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{props.notes.map((o, i) =>
							<TableRow key={i}>
								<TableCell>
									<p><nobr><strong>By: </strong><span>{o.createdBy}</span></nobr></p>
									<p><nobr><strong>At: </strong><span>{o.createdAt}</span></nobr></p>
									<p><nobr><strong>Action: </strong><span>{o.action}</span></nobr></p>
								</TableCell>
								<TableCell>
									{o.note ? o.note.split('\n').map((s,i) =>
										s ? <p key={i}>{s}</p> : ''
									) : ''}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		);
	}
}
