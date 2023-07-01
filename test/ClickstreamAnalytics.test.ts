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

import { ClickstreamAnalytics } from '../src';

describe('ClickstreamAnalytics test', () => {
	test('test init sdk', () => {
		const result = ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		expect(result).toBeTruthy();
		const result1 = ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		expect(result1).toBeFalsy();
	});
});
