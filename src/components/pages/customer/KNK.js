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
import React from 'react';

// Material UI
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

// Helper
const EnToTxt = {
	"A": "Audio",
	"V": "Video",
	"AS": "Async",
	"": "N/A"
}

// KNK component
export default function KNK(props) {

	// If we're still loading
	if(props.customer === null) {
		return <p>Loading...</p>
	}

	// If there's no customer associated
	else if(props.customer === 0) {
		return <p>No customer found for this phone number</p>
	}

	// Else, show the customer
	else {
		let customer = props.customer;
		return (
			<React.Fragment>
				<TableContainer component={Paper} className="customer">
					<Table stickyHeader aria-label="sticky table">
						<TableHead>
							<TableRow>
								<TableCell>Customer Details</TableCell>
								<TableCell>Billing</TableCell>
								<TableCell>Shipping</TableCell>
								<TableCell>Notes</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{props.customer &&
								<TableRow>
									<TableCell>
										<p><strong>ID: </strong><a href={"https://crm.konnektive.com/customer/cs/details/?customerId=" + customer.id} target="_bank">{customer.id}</a></p>
										<p><strong>Campaign: </strong><span>{customer.campaign.name + ' (' + customer.campaign.type + ')'}</span></p>
										<p><strong>Email: </strong><span>{customer.email}</span></p>
										<p><strong>Phone: </strong><span>{customer.phone}</span></p>
										<p><strong>Created: </strong><span>{customer.created}</span></p>
										<p><strong>Updated: </strong><span>{customer.updated}</span></p>
									</TableCell>
									<TableCell>
										<p><nobr>{customer.billing.name}</nobr></p>
										<p><nobr>{customer.billing.address1}</nobr></p>
										<p><nobr>{customer.billing.address2}</nobr></p>
										<p><nobr>{customer.billing.city}, {customer.billing.state}</nobr></p>
										<p><nobr>{customer.billing.country}, {customer.billing.postalCode}</nobr></p>
									</TableCell>
									<TableCell>
										<p><nobr>{customer.shipping.name}</nobr></p>
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
								</TableRow>
							}
						</TableBody>
					</Table>
				</TableContainer>
				<TableContainer component={Paper} className="orders">
					<Table stickyHeader aria-label="sticky table">
						<TableHead>
							<TableRow>
								<TableCell>Order Details</TableCell>
								<TableCell>&nbsp;</TableCell>
								<TableCell>Products</TableCell>
								<TableCell>Billing</TableCell>
								<TableCell>Shipping</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{props.orders.map((o, i) =>
								<TableRow key={i}>
									<TableCell>
										<p><nobr><strong>ID: </strong><a href={"https://crm.konnektive.com/customer/cs/orders/?orderId=" + o.id} target="_bank">{o.id}</a></nobr></p>
										<p><strong>Campaign: </strong><span>{o.campaign}</span></p>
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
										<p><nobr>{o.billing.name}</nobr></p>
										<p><nobr>{o.billing.address1}</nobr></p>
										<p><nobr>{o.billing.address2}</nobr></p>
										<p><nobr>{o.billing.city}, {o.billing.state}</nobr></p>
										<p><nobr>{o.billing.country}, {o.billing.postalCode}</nobr></p>
									</TableCell>
									<TableCell>
										<p><nobr>{o.shipping.name}</nobr></p>
										<p><nobr>{o.shipping.address1}</nobr></p>
										<p><nobr>{o.shipping.address2}</nobr></p>
										<p><nobr>{o.shipping.city}, {o.shipping.state}</nobr></p>
										<p><nobr>{o.shipping.country}, {o.shipping.postalCode}</nobr></p>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</React.Fragment>
		);
	}
}
