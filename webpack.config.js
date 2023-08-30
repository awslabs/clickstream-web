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
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
	entry: { 'clickstream-web.min': './lib-esm/index.js' },
	mode: 'production',
	output: {
		filename: '[name].js',
		path: __dirname + '/dist',
		library: {
			type: 'umd',
		},
		umdNamedDefine: true,
		globalObject: 'this',
	},
	devtool: 'source-map',
	resolve: {
		extensions: ['.js', '.json'],
	},
	module: {
		rules: [
			{
				test: /\.js?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
					},
				},
			},
		],
	},
	optimization: {
		minimizer: [new TerserPlugin({
			extractComments: false,
		})],
	},
};
