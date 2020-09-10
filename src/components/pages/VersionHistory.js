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
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const VERSION = [
	['1.14.0', 'September 10th, 2020', [
		'Added WellDyneRX Never Started list to Pharmacy page.',
		'Added Never Started reason to Triggers in Customer\'s RX tab.',
		'Added Cancelled date and Opened State to Triggers in Customer\'s RX tab if data is available.'
	]],
	['1.13.0', 'September 8th, 2020', [
		'Orders can now be manually added to the pharmacy fill process for those with the rights to do so.'
	]],
	['1.12.0', 'September 3rd, 2020', [
		'HRT Lab results are now available from the customer RX tab.'
	]],
	['1.11.0', 'August 28th, 2020', [
		'Customer Misc tab now shows customer\'s Patient Portal access and allows, with proper rights, sending the setup email for those customer who don\'t have access.'
	]],
	['1.10.0', 'August 21st, 2020', [
		'Customer page (claimed & viewed) has a new "Misc" tab which shows Calendly appointments.'
	]],
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

/**
 * Version History
 *
 * Wrapper for email and SMS templates
 *
 * @name VersionHistory
 * @extends React.Component
 */
export default function VersionHistory(props) {

	// Render
	return (
		<Box id="version">
			<Box className="content">
				<List>
					{VERSION.map(v =>
						<ListItem key={v[0]}>
							<ListItemText
								primary={"Version " + v[0] + ' - ' + v[1]}
								secondary={
									<ul>{v[2].map((s,i) => <li key={i}>{s}</li>)}</ul>
								}
							>
							</ListItemText>
						</ListItem>
					)}
				</List>
			</Box>
		</Box>
	);
}
