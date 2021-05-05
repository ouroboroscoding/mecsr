/**
 * SMS Message
 *
 * Displays a single SMS message
 *
 * @author Bast Nast <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-28
 */

// NPM modules
import React from 'react';

// Local modules
import Utils from 'utils';

// Shared generic modules
import { datetime } from 'shared/generic/tools';

/**
 * Message
 *
 * Handles individual messages
 *
 * @name Message
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Message(props) {

	// Render
	return (
		<div className={"message " + props.type}>
			<div className="content">
				{props.notes.split('\n').map((s,i) => {
					if(s[0] === '[') {
						let oBB = Utils.bbUrl(s);
						if(oBB) {
							return <p key={i}><a href={oBB.href} target="_blank" rel="noopener noreferrer">{oBB.text}</a></p>
						}
					}
					return <p key={i}>{s}</p>
				})}
			</div>
			<div className="footer">
				{props.type === 'Outgoing' &&
					<span>{props.fromName} at </span>
				}
				<span>{datetime(props.createdAt)}</span>
				{(props.type === 'Outgoing' && props.status !== null) &&
					<React.Fragment>
						<span> / {props.status}</span>
						{props.errorMessage &&
							<span className="error"> ({props.errorMessage})</span>
						}
					</React.Fragment>
				}
			</div>
		</div>
	);
}
