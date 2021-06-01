/**
 * Emails
 *
 * Shows data related to Emails
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { datetime, ucfirst } from 'shared/generic/tools';

/**
 * Location Pretty
 *
 * Returns a string with whatever info is available in the location object
 *
 * @name locationPretty
 * @access private
 * @param Object location The location object from HubSpot
 * @returns String
 */
function locationPretty(location) {

	let l = [];
	if(location.city && location.city !== '' && location.city !== 'Unknown') {
		l.push(ucfirst(location.city));
	}
	if(location.state && location.state !== '' && location.state !== 'Unknown') {
		l.push(ucfirst(location.state));
	}
	if(location.country && location.country !== '' && location.country !== 'Unknown') {
		l.push(ucfirst(location.country));
	}
	if(location.zipcode && location.zipcode !== '' && location.zipcode !== 'Unknown') {
		l.push(location.zipcode);
	}

	// If there's nothing
	if(l.length === 0) {
		return 'No location data found';
	} else {
		return l.join(', ');
	}
}

/**
 * Email
 *
 * Display a single email event
 *
 * @name Email
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Email(props) {

	// Render
	return (
		<Paper className="email padded">
			<Grid container spacing={1}>
				<Grid item xs={12} className="emailTitle">{props.campaign ? props.campaign.name : 'Campaign Not Found'}</Grid>
				{props.campaign &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Subject</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight"><Typography>{props.campaign.subject}</Typography></Grid>
					</React.Fragment>
				}
				{props.DROPPED &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Dropped</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight">
							<Typography>{datetime(props.DROPPED.created, '-')}</Typography>
							<Typography>{props.DROPPED.dropReason}</Typography>
							<Typography>{props.DROPPED.dropMessage}</Typography>
						</Grid>
					</React.Fragment>
				}
				{props.DELIVERED &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Delivered</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight"><Typography>{datetime(props.DELIVERED.created, '-')}</Typography></Grid>
					</React.Fragment>
				}
				{props.BOUNCE &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Bounced</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight"><Typography>{datetime(props.BOUNCE.created, '-')}</Typography></Grid>
					</React.Fragment>
				}
				{props.OPEN &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Opened</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight">
							<Typography>{datetime(props.OPEN.created, '-')}</Typography>
							<Typography>{ucfirst(props.OPEN.deviceType)} Device</Typography>
							<Typography>{locationPretty(props.OPEN.location)}</Typography>
						</Grid>
					</React.Fragment>
				}
				{props.CLICK &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>Clicked</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight">
							<Typography>{datetime(props.CLICK.created, '-')}</Typography>
							<Typography>{ucfirst(props.CLICK.deviceType)} Device</Typography>
							<Typography>{locationPretty(props.CLICK.location)}</Typography>
							<Typography>{props.CLICK.url}</Typography>
						</Grid>
					</React.Fragment>
				}
				{props.SPAMREPORT &&
					<React.Fragment>
						<Grid item xs={3} md={1} className="emailLeft"><Typography>SPAM</Typography></Grid>
						<Grid item xs={9} md={11} className="emailRight"><Typography>{datetime(props.SPAMREPORT.created, '-')}</Typography></Grid>
					</React.Fragment>
				}
			</Grid>
		</Paper>
	);
}

/**
 * Emails
 *
 * Return hubspot email events
 *
 * @name Emails
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Emails(props) {

	// State
	let [logs, logsSet] = useState(null);

	// Refs
	let refScroll = useRef();

	// Load effect
	useEffect(() => {
		if(props.user && props.emailAddress !== '') {
			logsFetch();
		} else {
			logsSet(null);
		}
	// eslint-disable-next-line
	}, [props.user, props.emailAddress]);

	// Scroll effect
	useEffect(() => {
		if(logs) {
			refScroll.current.scrollIntoView({ behavior: 'auto' });
		}
	}, [logs])

	// Fetch all the logs associated with the customer
	function logsFetch() {

		// Make the request to the server
		Rest.read('hubspot', 'customer/emails', {
			email: props.emailAddress
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Set the logs
				logsSet(res.data);
			}
		});
	}

	// Render
	return (
		<React.Fragment>
			{logs === null ?
				<Typography>Loading...</Typography>
			:
				<React.Fragment>
					{logs.length === 0 &&
						<Typography>No logs found for this e-mail address</Typography>
					}
					{logs.length > 0 && logs.map(o =>
						<Email
							key={o.id}
							{...o}
						/>
					)}
					<Box className="scroll" ref={refScroll} />
				</React.Fragment>
			}
		</React.Fragment>
	);
}

// Valid types
Emails.propTypes = {
	emailAddress: PropTypes.string.isRequired
}
