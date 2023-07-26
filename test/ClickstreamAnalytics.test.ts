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
import { NetRequest } from '../src/network/NetRequest';
import { StorageUtil } from '../src/util/StorageUtil';

describe('ClickstreamAnalytics test', () => {
	const mockSendRequestSuccess = jest.fn().mockResolvedValue(true);

	beforeEach(() => {
		jest
			.spyOn(NetRequest, 'sendRequest')
			.mockImplementation(mockSendRequestSuccess);
	});

	afterEach(() => {
		ClickstreamAnalytics['provider'] = undefined;
		jest.resetAllMocks();
	});

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

	test('test record event with name success', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
		});
		ClickstreamAnalytics.record({
			name: 'testEvent',
		});
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getFailedEvents().length).toBe(0);
	});

	test('test record event with name user attributes and event attributes', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
		});
		ClickstreamAnalytics.setUserId('32133');
		ClickstreamAnalytics.setUserAttributes({
			_user_name: 'carl',
			_user_age: 20,
		});
		ClickstreamAnalytics.record({
			name: 'testEvent',
			attributes: {
				_channel: 'SMS',
				longValue: 4232032890992380000,
				isNew: true,
				score: 85.22,
			},
		});
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getFailedEvents().length).toBe(0);
	});

	test('test update configuration', () => {
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
		});
		ClickstreamAnalytics.updateConfigure({
			isLogEvents: true,
			authCookie: 'testCookie',
			isTrackPageViewEvents: false,
			isTrackClickEvents: false,
			isTrackScrollEvents: false,
			isTrackSearchEvents: false,
			searchKeyWords: ['video', 'product', 'class'],
		});
		const newConfigure = ClickstreamAnalytics['provider'].configuration;
		expect(newConfigure.isLogEvents).toBeTruthy();
		expect(newConfigure.authCookie).toBe('testCookie');
		expect(newConfigure.isTrackPageViewEvents).toBeFalsy();
		expect(newConfigure.isTrackClickEvents).toBeFalsy();
		expect(newConfigure.isTrackScrollEvents).toBeFalsy();
		expect(newConfigure.isTrackSearchEvents).toBeFalsy();
		expect(newConfigure.searchKeyWords.length).toBe(3);
	});

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
