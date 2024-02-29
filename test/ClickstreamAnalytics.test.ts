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
import { setUpBrowserPerformance } from "./browser/BrowserUtil";
import { ClickstreamAnalytics, Item, SendMode } from '../src';
import { NetRequest } from '../src/network/NetRequest';
import { Event } from '../src/provider';
import { StorageUtil } from '../src/util/StorageUtil';

describe('ClickstreamAnalytics test', () => {
	beforeEach(() => {
		StorageUtil.clearAll();
		const mockSendRequestSuccess = jest.fn().mockResolvedValue(true);
		jest
			.spyOn(NetRequest, 'sendRequest')
			.mockImplementation(mockSendRequestSuccess);
		setUpBrowserPerformance();
	});

	afterEach(() => {
		ClickstreamAnalytics['provider'] = undefined;
		jest.restoreAllMocks();
		jest.clearAllMocks();
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

	test('test init sdk with global attributes', async () => {
		const result = ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
			sendMode: SendMode.Batch,
			globalAttributes: {
				brand: 'Samsung',
				level: 10,
			},
		});
		ClickstreamAnalytics.setGlobalAttributes({ brand: null });
		ClickstreamAnalytics.record({
			name: 'testEvent',
		});
		expect(result).toBeTruthy();
		await sleep(100);
		const eventList = JSON.parse(
			StorageUtil.getAllEvents() + Event.Constants.SUFFIX
		);
		const firstEvent = eventList[0];
		expect(firstEvent.event_type).toBe(Event.PresetEvent.FIRST_OPEN);
		expect(firstEvent.user[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]).not.toBeUndefined()
		expect(firstEvent.attributes.brand).toBe('Samsung');
		expect(firstEvent.attributes.level).toBe(10);
		expect(firstEvent.attributes[Event.ReservedAttribute.SESSION_ID]).not.toBeUndefined();
		expect(firstEvent.attributes[Event.ReservedAttribute.SESSION_NUMBER]).not.toBeUndefined();
		expect(firstEvent.attributes[Event.ReservedAttribute.SESSION_START_TIMESTAMP]).not.toBeUndefined();
		expect(firstEvent.attributes[Event.ReservedAttribute.SESSION_DURATION]).not.toBeUndefined();
		const testEvent = eventList[eventList.length - 1];
		expect(testEvent.attributes.brand).toBeUndefined();
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

	test('test record event with all attributes', async () => {
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
		ClickstreamAnalytics.setGlobalAttributes({
			brand: 'Samsung',
			level: 10,
		});
		const item: Item = {
			id: '1',
			name: 'Nature',
			category: 'book',
			price: 56.5,
			customKey: "customValue",
		};
		ClickstreamAnalytics.record({
			name: 'testEvent',
			attributes: {
				_channel: 'SMS',
				longValue: 4232032890992380000,
				isNew: true,
				score: 85.22,
			},
			items: [item],
		});
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getFailedEvents().length).toBe(0);
	});

	test('test send event immediately in batch mode', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
			sendMode: SendMode.Batch,
		});
		ClickstreamAnalytics.record({
			name: 'testEvent',
			isImmediate: true,
		});
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getFailedEvents().length).toBe(0);
		const eventList = JSON.parse(
			StorageUtil.getAllEvents() + Event.Constants.SUFFIX
		);
		for (const event of eventList) {
			expect(event.event_type).not.toBe('testEvent');
		}
	});

	test('test add global attribute in subsequent event', async () => {
		ClickstreamAnalytics.init({
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
			sendMode: SendMode.Batch,
		});
		ClickstreamAnalytics.setGlobalAttributes({
			_traffic_source_medium: 'Search engine',
			_traffic_source_name: 'Summer promotion',
		});
		ClickstreamAnalytics.record({ name: 'testEvent' });
		await sleep(100);
		const eventList = JSON.parse(
			StorageUtil.getAllEvents() + Event.Constants.SUFFIX
		);
		const testEvent = eventList[eventList.length - 1];
		expect(testEvent.event_type).toBe('testEvent');
		expect(testEvent.attributes._traffic_source_medium).toBe('Search engine');
		expect(testEvent.attributes._traffic_source_name).toBe('Summer promotion');
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
		});
		const newConfigure = ClickstreamAnalytics['provider'].configuration;
		expect(newConfigure.isLogEvents).toBeTruthy();
		expect(newConfigure.authCookie).toBe('testCookie');
		expect(newConfigure.isTrackPageViewEvents).toBeFalsy();
		expect(newConfigure.isTrackClickEvents).toBeFalsy();
		expect(newConfigure.isTrackScrollEvents).toBeFalsy();
		expect(newConfigure.isTrackSearchEvents).toBeFalsy();
		expect(newConfigure.searchKeyWords.length).toBe(0);
	});

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
