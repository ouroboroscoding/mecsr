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
import React, { useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RefreshIcon from '@material-ui/icons/Refresh';

// Composite components
import KnkOrder from 'components/composites/KnkOrder';

// Shared communications modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';

// Helper
const EnToTxt = {
	"A": "Audio",
	"V": "Video",
	"AS": "Async",
	"": "N/A"
}

/**
 * KNK
 *
 * Shows Konnektive customer details and orders
 *
 * @name KNK
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function KNK(props) {

	// State
	let [create, createSet] = useState(false);

	// Called to sync up order details in Konnektive with Memo
	function memoSync(order_id) {
		Rest.update('monolith', 'order/refresh', {
			orderId: order_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if('data' in res) {
				Events.trigger('success', 'Konnektive order data synced with Memo');
			}
		})
	}

	// Called when a new order has been created
	function orderCreated(orderId) {

		// Hide the create dialog
		createSet(false);

		// Add the order to the current ticket (if there is one)
		if(Tickets.current()) {
			Tickets.item('order', 'outgoing', orderId, props.user.id);
		}

		// Refresh konnektive orders
		props.refreshOrders();
	}

	// Init customer section
	let elCustomer = null;

	// If we're still loading
	if(props.customer === null) {
		elCustomer = <p>Loading...</p>
	}

	// If there's no customer associated
	else if(props.customer === 0) {
		elCustomer = <p>No customer found for this phone number</p>
	}

	// Else, show the customer
	else {
		let customer = props.customer;
		elCustomer = (
			<TableContainer component={Paper} className="customer">
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							<TableCell>Customer Details
								<Tooltip title="Refresh Customer">
									<IconButton onClick={props.refreshCustomer}>
										<RefreshIcon />
									</IconButton>
								</Tooltip>
							</TableCell>
							<TableCell>Billing</TableCell>
							<TableCell>Shipping</TableCell>
							<TableCell>Notes</TableCell>
							<TableCell>Tracking</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<p><strong>ID: </strong><a href={"https://crm.konnektive.com/customer/cs/details/?customerId=" + customer.customerId} target="_blank" rel="noopener noreferrer">{customer.customerId}</a></p>
								<p><strong>Campaign: </strong><span>{customer.campaign.name + ' (' + customer.campaign.type + ')'}</span></p>
								<p><strong>Email: </strong><span>{customer.email}</span></p>
								<p><strong>Phone: </strong><span>{customer.phone}</span></p>
							</TableCell>
							<TableCell>
								<p><nobr>{customer.billing.firstName + ' ' + customer.billing.lastName}</nobr></p>
								<p><nobr>{customer.billing.address1}</nobr></p>
								<p><nobr>{customer.billing.address2}</nobr></p>
								<p><nobr>{customer.billing.city}, {customer.billing.state}</nobr></p>
								<p><nobr>{customer.billing.country}, {customer.billing.postalCode}</nobr></p>
							</TableCell>
							<TableCell>
								<p><nobr>{customer.shipping.firstName + ' ' + customer.shipping.lastName}</nobr></p>
								<p><nobr>{customer.shipping.address1}</nobr></p>
								<p><nobr>{customer.shipping.address2}</nobr></p>
								<p><nobr>{customer.shipping.city}, {customer.shipping.state}</nobr></p>
								<p><nobr>{customer.shipping.country}, {customer.shipping.postalCode}</nobr></p>
							</TableCell>
							<TableCell className="notes">
								<div>
									{customer.notes.map((o, i) =>
										<p key={i}><strong>{o.agentName}</strong> ({o.dateCreated}): {o.message}</p>
									)}
								</div>
							</TableCell>
							<TableCell className="tracking">
								<div>
									{props.tracking.map((o,i) =>
										<p key={i}>{o.link ?
												<a href={o.link} target="_blank" rel="noopener noreferrer">{o.code}</a> :
												o.code
											} {o.type} {o.date}</p>
									)}
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
		);
	}

	// Init orders section
	let elOrders = null;

	// If we're still loading
	if(props.orders === null) {
		elOrders = <p>Loading...</p>
	}

	// If there's no orders associated
	else if(props.orders === 0) {
		elOrders = <p>No orders found for this customer</p>
	}
	else {
		elOrders =  (
			<TableContainer component={Paper} className="orders">
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Order Details
								<Tooltip title="Refresh Orders">
									<IconButton onClick={props.refreshOrders}>
										<RefreshIcon />
									</IconButton>
								</Tooltip>
								{Rights.has('orders', 'create') &&
									<Tooltip title="Add Order">
										<IconButton onClick={ev => createSet(true)}>
											<AddCircleIcon />
										</IconButton>
									</Tooltip>
								}
							</TableCell>
							<TableCell>&nbsp;</TableCell>
							<TableCell>Products</TableCell>
							<TableCell>Billing</TableCell>
							<TableCell>Shipping</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{props.orders.map((o, i) =>
							<React.Fragment key={i}>
								<TableRow>
									<TableCell>
										<p><nobr>
											<strong>ID: </strong>
											<span>{o.orderId} </span>
											<Button
												className="sync"
												color="primary"
												onClick={ev => memoSync(o.orderId)}
												variant="contained"
											>Sync Memo</Button>
										</nobr></p>
										<p><strong>Campaign: </strong><span>{o.campaign.name}</span></p>
										<p><nobr><strong>Email: </strong><span>{o.email}</span></nobr></p>
										<p><nobr><strong>Phone: </strong><span>{o.phone}</span></nobr></p>
										<p><nobr><strong>Date: </strong><span>{o.date}</span></nobr></p>
									</TableCell>
									<TableCell>
										<p><nobr><strong>Encounter: </strong><span>{EnToTxt[o.encounter]}</span></nobr></p>
										<p><nobr><strong>Status: </strong><span>{o.status}</span></nobr></p>
										<p><nobr><strong>Type: </strong><span>{o.type}</span></nobr></p>
										<p><nobr><strong>Charged: </strong><span>{o.totalAmount}</span></nobr></p>
										<p><nobr><strong>Coupon: </strong><span>{o.couponCode}</span></nobr></p>
									</TableCell>
									<TableCell>
										{o.items.map((oI, iI) =>
											<Paper key={iI} className="product">
												<p><strong>Campaign: </strong><span>{oI.campaign}</span></p>
												<p><strong>Descr: </strong><span>{oI.description}</span></p>
												<p><strong>Price: </strong><span>{oI.price}</span></p>
												<p><strong>Shipping: </strong><span>{oI.shipping}</span></p>
											</Paper>
										)}
									</TableCell>
									<TableCell>
										<p><nobr>{o.billing.firstName + ' ' + o.billing.lastName}</nobr></p>
										<p><nobr>{o.billing.address1}</nobr></p>
										<p><nobr>{o.billing.address2}</nobr></p>
										<p><nobr>{o.billing.city}, {o.billing.state}</nobr></p>
										<p><nobr>{o.billing.country}, {o.billing.postalCode}</nobr></p>
									</TableCell>
									<TableCell>
										<p><nobr>{o.shipping.firstName + ' ' + o.shipping.lastName}</nobr></p>
										<p><nobr>{o.shipping.address1}</nobr></p>
										<p><nobr>{o.shipping.address2}</nobr></p>
										<p><nobr>{o.shipping.city}, {o.shipping.state}</nobr></p>
										<p><nobr>{o.shipping.country}, {o.shipping.postalCode}</nobr></p>
									</TableCell>
								</TableRow>
								{o.transactions &&
									<TableRow>
										<TableCell colSpan={5}>
											<Table>
												<TableHead>
													<TableRow>
														<TableCell>Date</TableCell>
														<TableCell>MID</TableCell>
														<TableCell>Cycle</TableCell>
														<TableCell>Recycle</TableCell>
														<TableCell>Type</TableCell>
														<TableCell>Total</TableCell>
														<TableCell>Payment</TableCell>
														<TableCell>Result</TableCell>
														<TableCell>Response</TableCell>
														<TableCell>ID</TableCell>
														<TableCell>Refund</TableCell>
														<TableCell>Chargeback</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													<TableRow>
														<TableCell>{o.transactions.date}</TableCell>
														<TableCell>{o.transactions.mid}</TableCell>
														<TableCell>{o.transactions.cycle}</TableCell>
														<TableCell>{o.transactions.recycle}</TableCell>
														<TableCell>{o.transactions.type}</TableCell>
														<TableCell>{o.transactions.currency}{o.transactions.total}</TableCell>
														<TableCell>{o.transactions.payment}</TableCell>
														<TableCell>{o.transactions.result}</TableCell>
														<TableCell>{o.transactions.response}</TableCell>
														<TableCell>{o.transactions.id}</TableCell>
														<TableCell style={{color: "red"}}>
															{o.transactions.voided && "VOIDED"}
															{o.transactions.refund && (o.transactions.currency + o.transactions.refund)}
														</TableCell>
														<TableCell style={{color: "red"}}>
															{o.transactions.chargeback &&
																(o.transactions.chargeback.amount + ' / ' + o.transactions.chargeback.code + ' / ' + o.transactions.chargeback.note)
															}
														</TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</TableCell>
									</TableRow>
								}
							</React.Fragment>
						)}
					</TableBody>
				</Table>
			</TableContainer>
		);
	}

	return (
		<React.Fragment>
			{elCustomer}
			{elOrders}
			{create &&
				<Dialog
					maxWidth="lg"
					onClose={ev => createSet(false)}
					open={true}
					aria-labelledby="knk-order-dialog-title"
				>
					<DialogTitle id="knk-order-dialog-title">Add Order</DialogTitle>
					<DialogContent dividers>
						<KnkOrder
							customer={props.customer}
							onCancel={() => createSet(false)}
							onSuccess={orderCreated}
							user={props.user}
						/>
					</DialogContent>
				</Dialog>
			}
		</React.Fragment>
	);
}
