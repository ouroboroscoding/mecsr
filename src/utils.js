/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */


/**
 * Utils
 */
const Utils = {

	customerPath: function(phone, id) {
		return '/customer/' + phone + '/' + id;
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
