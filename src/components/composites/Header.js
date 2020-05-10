/**
 * Header
 *
 * Handles app bar and drawer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import React from 'react';
import { Link } from 'react-router-dom';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AllInboxIcon from '@material-ui/icons/AllInbox';
import CancelIcon from '@material-ui/icons/Cancel';
import MenuIcon from '@material-ui/icons/Menu';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import PhoneIcon from '@material-ui/icons/Phone';
import SearchIcon from '@material-ui/icons/Search';

// Local components
import Loader from './Loader';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';

// Local modules
import Utils from '../../utils';

// Header component
class Header extends React.Component {

	constructor(props) {

		// Call the parent constructor
		super(props);

		// Initialise the state
		this.state = {
			"mobile": document.documentElement.clientWidth < 600,
			"menu": false,
			"path": window.location.pathname,
			"user": props.user || false
		}

		// Bind methods to this instance
		this.claimedRemove = this.claimedRemove.bind(this);
		this.menuClose = this.menuClose.bind(this);
		this.menuItem = this.menuItem.bind(this);
		this.menuToggle = this.menuToggle.bind(this);
		this.resize = this.resize.bind(this);
		this.signedIn = this.signedIn.bind(this);
		this.signedOut = this.signedOut.bind(this);
		this.signout = this.signout.bind(this);
	}

	componentDidMount() {

		// Track any signedIn/signedOut events
		Events.add('signedIn', this.signedIn);
		Events.add('signedOut', this.signedOut);

		// Capture resizes
		window.addEventListener("resize", this.resize);
	}

	componentWillUnmount() {

		// Stop tracking any signedIn/signedOut events
		Events.remove('signedIn', this.signedIn);
		Events.remove('signedOut', this.signedOut);

		// Stop capturing resizes
		window.removeEventListener("resize", this.resize);
	}

	claimedRemove(event) {

		// Stop all propogation of the event
		event.stopPropagation();
		event.preventDefault();

		// Trigger the claimed remove event
		Events.trigger('claimedRemove', event.currentTarget.dataset.number);
	}

	menuClose() {
		this.setState({menu: false});
	}

	menuItem(event) {

		// New state
		let state = {
			path: event.currentTarget.pathname
		};

		// If we're in mobile
		if(this.state.mobile) {
			state.menu = false;
		}

		// Set the new state
		this.setState(state);
	}

	menuToggle() {

		// Toggle the state of the menu
		this.setState({
			menu: !this.state.menu
		});
	}

	render() {

		let drawer = (
			<List style={{padding: 0}}>
				<Link to="/unclaimed" onClick={this.menuItem}>
					<ListItem button selected={this.state.path === "/unclaimed"}>
						<ListItemIcon><AllInboxIcon /></ListItemIcon>
						<ListItemText primary="Unclaimed" />
					</ListItem>
				</Link>
				<Link to="/search" onClick={this.menuItem}>
					<ListItem button selected={this.state.path === "/search"}>
						<ListItemIcon><SearchIcon /></ListItemIcon>
						<ListItemText primary="Search" />
					</ListItem>
				</Link>
				<Divider />
				{this.props.claimed.map(o =>
					<Link key={o.customerPhone} to={"/customer/" + o.customerPhone} onClick={this.menuItem}>
						<ListItem button selected={this.state.path === "/customer/" + o.customerPhone}>
							<ListItemAvatar>
								{o.newMsgs ?
									<Avatar style={{backgroundColor: 'red'}}><NewReleasesIcon /></Avatar> :
									<Avatar><PhoneIcon /></Avatar>
								}
							</ListItemAvatar>
							<ListItemText
								primary={o.customerName}
								secondary={o.customerPhone}
							/>
							{(this.state.path !== "/customer/" + o.customerPhone) &&
								<ListItemIcon
									className="close"
									data-number={o.customerPhone}
									onClick={this.claimedRemove}
								>
									<CancelIcon />
								</ListItemIcon>
							}
						</ListItem>
					</Link>
				)}
			</List>
		);

		return (
			<div id="header">
				<AppBar position="relative">
					<Toolbar>
						{this.state.mobile &&
							<IconButton edge="start" color="inherit" aria-label="menu" onClick={this.menuToggle}>
								<MenuIcon />
							</IconButton>
						}
						<Typography variant="h6" className="title">
							<Link to="/">
								MeCSR
							</Link>
						</Typography>
						<div id="loaderWrapper">
							<Loader />
						</div>
						{this.state.user &&
							<Button color="inherit" onClick={this.signout}>Sign Out</Button>
						}
					</Toolbar>
				</AppBar>
				{this.state.mobile ?
					<Drawer
						anchor="left"
						id="menu"
						open={this.state.menu}
						onClose={this.menuClose}
						variant="temporary"
					>
						{drawer}
					</Drawer>
				:
					<Drawer
						anchor="left"
						id="menu"
						open
						variant="permanent"
					>
						{drawer}
					</Drawer>
				}
			</div>
		);
	}

	resize() {

		// If the size is less than 600px
		if(document.documentElement.clientWidth < 600) {
			this.setState({"mobile": true});
		} else {
			this.setState({"mobile": false});
		}
	}

	signedIn(user) {

		// Hide any modals and set the user
		this.setState({
			"user": user,
		});
	}

	signout(ev) {

		// Call the signout
		Rest.create('auth', 'signout', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.serviceError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Reset the session
				Rest.session(null);

				// Trigger the signedOut event
				Events.trigger('signedOut');
			}
		});
	}

	signedOut() {

		// Hide and modals and set the user to false
		this.setState({
			"user": false
		});
	}

	set path(path) {
		this.setState({
			path: path
		});
	}
}

export default Header;
