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
	['1.28.0', 'February 23th, 2021', [
		'Added Continuous/Expiring orders to Pending list if customer is unhappy with the medication so that Agents can handle any issues before Providers.'
	]],
	['1.27.0', 'February 22th, 2021', [
		'New Calls tab in Customer page, shows the JustCall logs for the given customer\'s phone number.'
	]],
	['1.26.0', 'February 19th, 2021', [
		'Can now view HRT Assessment Levels from the Customer HRT tab.'
	]],
	['1.25.0', 'February 8th, 2021', [
		'Can now drop HRT patients from the Customer HRT tab.'
	]],
	['1.24.0', 'February 5th, 2021', [
		'Added new HRT Patients page to display breakdown of current HRT patients',
		'Added new Customer HRT tab for HRT details',
		'Moved HRT Lab Results from Customer RX to Customer HRT'
	]],
	['1.23.3', 'January 28th, 2021', [
		'Added proper generation of MIP ED links in SMS Templates'
	]],
	['1.23.0', 'January 21st, 2021', [
		'Added proper generation of C-ED link in SMS Templates',
		'Added proper generation of single use Calendly link in SMS Templates'
	]],
	['1.22.2', 'January 14th, 2021', [
		'Added Order ID to claims from Pending Orders or transferred from Providers.',
		'Added "Ran CC Successfully" option in Decline dialog.'
	]],
	['1.22.0', 'January 4th, 2021', [
		'Underlining codebase updated. No functionality should change, but any issues should be reported immediately.'
	]],
	['1.21.0', 'December 22nd, 2020', [
		'Missed calls now appear as "SMS" messages with the link to the recording.'
	]],
	['1.20.0', 'December 22nd, 2020', [
		'Added option to change phone number in one place that updates Konnektive and Memo.'
	]],
	['1.19.2', 'December 12th, 2020', [
		'Added "Decline Order" option on claims from Pending Orders or transferred by Providers. This allows agents to decline a QA order and remove it from their claims without needing to transfer it back to the provider.'
	]],
	['1.19.0', 'December 10th, 2020', [
		'Renamed "Prescriptions" section to "DoseSpot" in RX tab.',
		'Added ability to update DoseSpot customer information from Konnektive data in RX tab.'
	]],
	['1.18.0', 'December 10th, 2020', [
		'Numerous background changes related to integration with the Provider portal.'
	]],
	['1.17.6', 'December 8th, 2020', [
		'Fixed issues when generating CHRT links in templates.'
	]],
	['1.17.0', 'November 26th, 2020', [
		'Added ability to transfer customers/conversations that came from Providers back to those Providers.'
	]],
	['1.16.10', 'November 24th, 2020', [
		'Added "Sync Memo" button on every Konnektive order to allow agents to sync Memo with changes done in Konnektive.'
	]],
	['1.16.9', 'November 16th, 2020', [
		'Added more info to Patient Portal section of Misc. tab of customer page. Can now see last name and dob used to verify customer, as well as the link sent by email. Those with edit rights can now modify last name, dob, and email associated with account setup.'
	]],
	['1.16.3', 'October 29th, 2020', [
		'Added displaying of failed Patient Portal setup attempts to Misc. tab of Customer page. Should help in figuring out customer\'s issues.'
	]],
	['1.16.2', 'October 27th, 2020', [
		'Added ability to set STOP flags per service in the Misc tab of customer pages.'
	]],
	['1.16.0', 'October 26th, 2020', [
		'Unclaimed page renamed to "Incoming SMS".',
		'New page "Pending Orders" added which lists PENDING KNK orders with an attention role of CSR. These orders can be claimed like conversations, but will show a "Send to Provider" icon instead of "Resolve". Clicking it will automatically add a note to the order and change the attention to Provider.',
		'Claimed and Viewed in the left-side menu now show the total of each, and can be minimized.'
	]],
	['1.15.5', 'September 29th, 2020', [
		'Can now select a custom list for a conversation at the same time as transfering.'
	]],
	['1.15.2', 'September 17th, 2020', [
		'Can now select the order of unclaimed conversations, newest to oldest, or oldest to newest.'
	]],
	['1.15.0', 'September 16th, 2020', [
		'Agents will now be notified of transferred claims immediately upon transfer.',
		'Transferred claims will have a light blue background until they are selected for the first time.'
	]],
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
		<Box id="version" className="page">
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
