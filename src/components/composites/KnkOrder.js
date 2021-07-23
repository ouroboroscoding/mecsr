/**
 * KNK
 *
 * Shows a specific customer and their orders from KNK
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-09
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Knk Order
 *
 * Shows a form to create a new order for the given customer
 *
 * @name KnkOrder
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function KnkOrder(props) {

	// State
	let [campaign, campaignSet] = useState([]);
	let [campaigns, campaignsSet] = useState([]);
	let [products, productsSet] = useState([]);

	// Load effect
	useEffect(() => {

		// Get the campaigns
		Rest.read('konnektive', 'campaigns', {}).done(res => {
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.data) {
				campaignsSet(
					res.data.reduce((o, c) => Object.assign(o, {[c._id]: c.name}), {})
				);
				campaignSet(res.data[0]._id);
			}
		})
	}, []);

	// Campaign changed effect
	useEffect(() => {

		// Fetch products
		Rest.read('konnektive', 'campaign/products', {
			campaign_id: campaign
		}).done(res => {
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.data) {
				productsSet(res.data);
			}
		});

	}, [campaign]);

	// Render
	return (
		<Box>
			<Select
				label="Campaign"
				native
				onChange={ev => campaignSet(ev.target.value}
				value={campaign}
			>
				{campaigns.map(o => {
					<option key={o._id} value={o._id}>{o.name}</option>
				})}
			</Select>
			<Grid container>
			</Grid>
		</Box>
	);
}
