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
import { ClickstreamAnalytics } from '../../src';
import { NetRequest } from '../../src/network/NetRequest';
import { Event } from '../../src/provider';
import { StorageUtil } from '../../src/util/StorageUtil';
import { setUpBrowserPerformance } from '../browser/BrowserUtil';

describe('ImmediateModeCache test', () => {
	beforeEach(() => {
		setUpBrowserPerformance();
		const mockSendRequestFail = jest.fn().mockResolvedValue(false);
		jest
			.spyOn(NetRequest, 'sendRequest')
			.mockImplementation(mockSendRequestFail);
	});

	afterEach(() => {
		ClickstreamAnalytics['provider'] = undefined;
		jest.resetAllMocks();
	});

	test('test record event failed and stores the event then send the event', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/failed',
		});
		ClickstreamAnalytics.record({
			name: 'testEvent',
		});
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		const failedEvents = JSON.parse(
			StorageUtil.getFailedEvents() + Event.Constants.SUFFIX
		);
		expect(failedEvents.length).toBeGreaterThan(3);
		const mockSendRequestSuccess = jest.fn().mockResolvedValue(true);
		jest
			.spyOn(NetRequest, 'sendRequest')
			.mockImplementation(mockSendRequestSuccess);
		const provider = ClickstreamAnalytics['provider'];
		provider.configure({
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
		});
		await sleep(100);
		expect(StorageUtil.getFailedEvents().length).toBe(0);
	});

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
