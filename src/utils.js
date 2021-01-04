/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// Regex
const rePhone = /^1?(\d{3})(\d{3})(\d{4})$/
const reBBUrl = /^\[url=([^|]+)\|([^\]]+)\]$/

// Rights
const oRights = {
	"create": 0x04,
	"delete": 0x08,
	"read": 0x01,
	"update": 0x02
}

/**
 * Utils
 */
const Utils = {

	customerPath: function(phone, id) {
		return '/customer/' + phone + '/' + id;
	},

	date: function(ts, separator='/') {
		if(typeof ts === 'number') {
			ts = new Date(ts*1000);
		}
		var Y = '' + ts.getFullYear();
		var M = '' + (ts.getMonth() + 1);
		if(M.length === 1) M = '0' + M;
		var D = '' + ts.getDate();
		if(D.length === 1) D = '0' + D;
		return Y + separator + M + separator + D;
	},

	datetime: function(ts) {
		if(typeof ts === 'number') {
			ts = new Date(ts*1000);
		}
		var t = ['', '', ''];
		t[0] += ts.getHours();
		if(t[0].length === 1) t[0] = '0' + t[0];
		t[1] += ts.getMinutes();
		if(t[1].length === 1) t[1] = '0' + t[1];
		t[2] += ts.getSeconds();
		if(t[2].length === 1) t[2] = '0' + t[2];
		return this.date(ts) + ' ' + t.join(':')
	},

	hasRight: function(user, name, type) {

		// If we have no user
		if(!user) {
			return false;
		}

		// If the user doesn't have the right
		if(!(name in user.permissions)) {
			return false;
		}

		// Return on the right having the type
		return (user.permissions[name].rights & oRights[type]) ? true : false;
	},

	bbUrl: function(val) {
		let lMatch = reBBUrl.exec(val);
		if(!lMatch) {
			return false;
		}
		return {
			text: lMatch[1],
			href: lMatch[2]
		}
	},

	nicePhone: function(val) {
		let lMatch = rePhone.exec(val);
		if(!lMatch) {
			return val;
		}
		return '(' + lMatch[1] + ') ' + lMatch[2] + '-' + lMatch[3];
	},

	parsePath(path) {
		// Split the path by /
		return path.substr(1).split('/');
	},

	viewedPath: function(phone, id) {
		return '/view/' + phone + '/' + id;
	}
}
export default Utils;
