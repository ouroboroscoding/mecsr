/**
 * Footer
 *
 * Handles app bar and list drawer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-15
 */

// NPM modules
import React, { useState } from 'react';

// Material UI
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ViewListIcon from '@material-ui/icons/ViewList';

// Local components
import CustomLists from './composites/CustomLists';

// Header component
export default function Footer(props) {

	// State
	let [lists, listsSet] = useState(false);

	return (
		<React.Fragment>
			<div id="footer">
				<div className="version">
					<Typography>
						v{process.env.REACT_APP_VERSION}
					</Typography>
				</div>
				<div className="lists">
					<Tooltip title="Open Lists">
						<IconButton onClick={ev => listsSet(true)}>
							<ViewListIcon />
						</IconButton>
					</Tooltip>
				</div>
			</div>
			<CustomLists
				onClose={ev => listsSet(false)}
				open={lists}
			/>
		</React.Fragment>
	)
}
