/**
 * Version History
 *
 * Displays the version history of the app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-16
 */

// NPM modules
import React from 'react';

// Material UI
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

const VERSION = [
	['1.9.0', 'August 16th, 2020', [
		'New message notifications will now persist across page reloads and closing/opening the app. However only for the device they were triggered on.',
		'New message notifications will now be based on all time rather than your current login session. This means you will be notified in the morning of any messages that came in overnight if the app was closed.',
		'A maximum of 20 conversations can be personally claimed. To claim more conversations you must resolve, transfer, or unclaim existing claims.',
		'Claims older than 48 hours old will automatically be unclaimed to gaurantee customers aren\'t stuck on agents who might be sick, on vacation, or otherwise indisposed. All current claims have been updated so as to not disappear until Tuesday evening.',
		'Custom lists can now be created to keep track of conversations that are not claimed. You can make as many lists as you want, and place conversations in more than one list. Note, you will not be notified of new messages on conversations in lists, only those conversations you have claimed. Click on the list icon in the bottom right corner to manage lists, or under each claimed/viewed conversations to add it to a list.'
	]],
	['1.8.0', 'August 13th, 2020', [
		'AdHoc can now only be created from existing Triggers or Outbound Failed Claims.',
		'Outbound Failed Claims can no longer be deleted.'
	]]
]

const useStyles = makeStyles((theme) => ({
	root: {
		width: '100%',
		backgroundColor: theme.palette.background.paper,

		'& ul': {
			marginLeft: '20px',
			listStyleType: 'disc'
		}
	},
	inline: {
		display: 'inline',
	},

}));

/**
 * Version History
 *
 * Wrapper for email and SMS templates
 *
 * @name VersionHistory
 * @extends React.Component
 */
export default function VersionHistory(props) {

	// Styles
	const classes = useStyles();

	// Render
	return (
		<List className={classes.root}>
			{VERSION.map(v =>
				<ListItem>
					<ListItemText
						primary={"Version " + v[0] + ' - ' + v[1]}
						secondary={
							<ul>{v[2].map(s => <li>{s}</li>)}</ul>
						}
					>
					</ListItemText>
				</ListItem>
			)}
		</List>
	);
}

