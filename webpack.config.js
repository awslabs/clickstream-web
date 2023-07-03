/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
const packageJson = require('./package.json');
const { DefinePlugin } = require('webpack');

module.exports = {
	entry: { 'clickstream-js.min': './dist/index.js' },
	mode: 'production',
	output: {
		filename: '[name].js',
		path: __dirname + '/dist',
	},
	plugins: [
		new DefinePlugin({
			'process.env.VERSION': JSON.stringify(packageJson.version),
		}),
	],
};
