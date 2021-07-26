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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Shared components
import CreditCard from 'shared/components/CreditCard';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

/**
 * Knk Product
 *
 * Shows a form to create a new order for the given customer
 *
 * @name KnkOrder
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function KnkProduct(props) {

	// Value changed
	function valueChanged(which, value) {
		props.value[which] = value;
		props.onChange(clone(props.value));
	}

	// Render
	return (
		<React.Fragment>
			<Grid item sm={12} md={2} lg={2}>
				<FormControlLabel
					control={
						<Switch checked={props.value.active || false} onChange={ev => valueChanged('active', ev.target.checked)} color="primary"/>
					}
					label="Add to Order"
				/>
			</Grid>
			<Grid item sm={12} md={10} lg={4} style={{marginTop: '6px'}}>
				<Typography style={{color: props.value.active ? 'black' : 'grey'}}>{props.value.name}</Typography>
			</Grid>
			<Grid item sm={12} md={6} lg={3}>
				<TextField
					disabled={!props.value.active}
					label="Quantity"
					onChange={ev => valueChanged('default_qty', ev.target.value)}
					placeholder="Quantity"
					type="number"
					value={props.value.default_qty}
				/>
			</Grid>
			<Grid item sm={12} md={6} lg={3}>
				<TextField
					disabled={!props.value.active}
					label="Price"
					onChange={ev => valueChanged('default_price', ev.target.value)}
					placeholder="Price"
					type="number"
					value={props.value.default_price}
				/>
			</Grid>
		</React.Fragment>
	);
}

KnkProduct.propTypes = {
	onChange: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}

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
	let [campaign, campaignSet] = useState(false);
	let [campaigns, campaignsSet] = useState([]);
	let [payment, paymentSet] = useState('existing');
	let [products, productsSet] = useState([]);
	let [qa, qaSet] = useState(true);

	// Refs
	let refCC = useRef();

	// Load effect
	useEffect(() => {

		// Get the campaigns
		Rest.read('konnektive', 'campaigns', {}).done(res => {
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.data) {

				// Using the agent_type only add campaigns the user can use
				let lCampaigns = []
				for(let o of res.data) {
					let lAgentTypes = o.agent_types.split(',');
					if(props.user.type.some(i => lAgentTypes.includes(i))) {
						lCampaigns.push(o);
					}
				}

				// Set the campaigns
				campaignsSet(lCampaigns);
			}
		})
	}, [props.user]);

	// Campaigns changed effect
	useEffect(() => {

		// If we have campaigns
		if(campaigns.length) {
			campaignSet(campaigns[0]._id);
		} else {
			campaignSet(false);
		}

	}, [campaigns]);

	// Campaign changed effect
	useEffect(() => {

		// If we have a campaign selected
		if(campaign) {

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
		} else {
			productsSet([]);
		}

	}, [campaign]);

	// Called when any product is changed
	function productChanged(value) {
		productsSet(products => {
			let iIndex = afindi(products, '_id', value._id);
			if(iIndex > -1) {
				products[iIndex] = value;
				return clone(products);
			} else {
				return products;
			}
		});
	}

	// Called to submit creation of the new order
	function submit(ev) {

		// Gather the active products
		let lProducts = [];
		for(let o of products) {
			if(o.active) {
				lProducts.push({
					id: o._id,
					qty: o.default_qty,
					price: o.default_price
				});
			}
		}

		// If we have no products
		if(!lProducts.length) {
			return;
		}

		// Init the data to go with the request
		let oData = {
			customerId: props.customer.customerId,
			campaignId: campaign,
			products: lProducts,
			payment: payment,
			qa: qa
		}

		// If the payment is new
		if(payment === 'new') {

			// Get the payment info
			let oPayment = refCC.current.value;

			// If the card is invalid
			if(!oPayment.valid && process.env.REACT_APP_ALLOW_INVALID_CC !== 'true') {
				Events.trigger('error', 'Credit card information is not valid. Please verify your info before submitting again.');
				return;
			}

			// Add the payment details
			oData.payment = {
				type: 'CREDITCARD',
				number: oPayment.number,
				month: oPayment.expiry.substr(0,2),
				year: oPayment.expiry.substr(2,2),
				code: oPayment.cvc
			}
		}

		// Send the request to konnektive
		Rest.create('konnektive', 'order', oData).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				if(res.error.code === 1100) {
					Events.trigger('error', 'Konnektive error creating order: ' + res.error.msg);
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}

			// If there's data, notify the parent
			if(res.data) {
				props.onSuccess();
			}
		});
	}

	// Render
	return (
		<Box>
			<Select
				label="Campaign"
				native
				onChange={ev => campaignSet(ev.target.value)}
				value={campaign}
			>
				{campaigns.map(o =>
					<option key={o._id} value={o._id}>{o.name}</option>
				)}
			</Select>
			{products.length ?
				<React.Fragment>
					<Grid container spacing={2} style={{marginTop: '10px'}}>
						<Grid item sm={12}>
							<FormControlLabel
								control={
									<Switch checked={qa} onChange={ev => qaSet(ev.target.checked)} color="primary"/>
								}
								label="QA Order"
							/>
						</Grid>
						{products.map(o =>
							<KnkProduct
								key={o._id}
								onChange={productChanged}
								value={o}
							/>
						)}
					</Grid>
					<hr />
					<Grid container spacing={2}>
						<Grid item xs={12} md={2}>
							<FormControlLabel
								checked={payment === 'existing'}
								control={<Radio color="primary" />}
								label='Use card on file'
								onChange={() => paymentSet('existing')}
								value="existing"
							/>
						</Grid>
						<Grid item xs={12} md={10}>
							<Typography>Type: {props.customer.pay.type}</Typography>
							<Typography>Expires: {props.customer.pay.expires.substr(0,10)}</Typography>
							<Typography>Ends in: {props.customer.pay.last4}</Typography>
						</Grid>
						<Grid item xs={12} md={2}>
							<FormControlLabel
								checked={payment === 'new'}
								control={<Radio color="primary" />}
								label="Add new card"
								onChange={() => paymentSet('new')}
								value="new"
							/>
						</Grid>
						<Grid item xs={12} md={10}>
							{payment === 'new' &&
								<CreditCard
									allowNameChange={false}
									name={props.customer.billing.firstName + ' ' + props.customer.billing.lastName}
									ref={refCC}
								/>
							}
						</Grid>
					</Grid>
					<Box className="actions">
						<Button color="secondary" onClick={props.onCancel} variant="contained">Cancel</Button>
						<Button color="primary" onClick={submit} variant="contained">Create Order</Button>
					</Box>
				</React.Fragment>
			:
				<Typography>No products found</Typography>
			}
		</Box>
	);
}

// Valid props
KnkOrder.propTypes = {
	customer: PropTypes.object.isRequired,
	onCancel: PropTypes.func.isRequired,
	onSuccess: PropTypes.func.isRequired,
	user: PropTypes.object.isRequired
}
