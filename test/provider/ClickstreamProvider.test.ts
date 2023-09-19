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
import { NetRequest } from '../../src/network/NetRequest';
import {
	AnalyticsEventBuilder,
	ClickstreamProvider,
	Event,
} from '../../src/provider';
import {
	ClickstreamAttribute,
	ClickstreamConfiguration,
	PageType,
	SendMode,
} from '../../src/types';
import { StorageUtil } from '../../src/util/StorageUtil';

describe('ClickstreamProvider test', () => {
	let provider: ClickstreamProvider;
	let mockProviderCreateEvent: any;
	let mockCreateEvent: any;
	let mockRecordProfileSet: any;

	beforeEach(async () => {
		localStorage.clear();
		const mockSendRequest = jest.fn().mockResolvedValue(true);
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
		provider = new ClickstreamProvider();
		provider.configure({
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
		});
		mockProviderCreateEvent = jest.spyOn(provider, 'createEvent');
		mockCreateEvent = jest.spyOn(AnalyticsEventBuilder, 'createEvent');
		mockRecordProfileSet = jest.spyOn(provider, 'recordProfileSet');
	});

	afterEach(() => {
		provider = undefined;
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	test('test default value', async () => {
		await sleep(100);
		expect(provider.configuration.appId).toBe('testAppId');
		expect(provider.configuration.endpoint).toBe('https://example.com/collect');
		expect(provider.configuration.sendMode).toBe(SendMode.Immediate);
		expect(provider.configuration.sendEventsInterval).toBe(5000);
		expect(provider.configuration.isTrackPageViewEvents).toBe(true);
		expect(provider.configuration.isLogEvents).toBe(false);
		expect(provider.configuration.sessionTimeoutDuration).toBe(1800000);
	});

	test('test config with empty appId or endpoint', () => {
		const configuration = provider.configure({
			appId: '',
			endpoint: '',
		}) as ClickstreamConfiguration;

		expect(configuration.appId).toBe('');
		expect(configuration.endpoint).toBe('');
	});

	test('test modify configuration', () => {
		const configuration = provider.configure({
			appId: 'testAppId',
			endpoint: 'https://example.com/collect',
			isLogEvents: true,
			sendMode: SendMode.Batch,
			sendEventsInterval: 2000,
			isTrackPageViewEvents: false,
			pageType: PageType.multiPageApp,
			sessionTimeoutDuration: 300000,
			authCookie: 'your auth cookie',
		}) as ClickstreamConfiguration;
		expect(configuration.appId).toBe('testAppId');
		expect(configuration.endpoint).toBe('https://example.com/collect');
		expect(configuration.isLogEvents).toBe(true);
		expect(configuration.sendEventsInterval).toBe(2000);
		expect(configuration.isTrackPageViewEvents).toBe(false);
		expect(configuration.pageType).toBe(PageType.multiPageApp);
		expect(configuration.sessionTimeoutDuration).toBe(300000);
		expect(configuration.authCookie).toBe('your auth cookie');
	});

	test('test get category and provider name', () => {
		expect(provider.getCategory()).toBe('Analytics');
		expect(provider.getProviderName()).toBe('ClickstreamProvider');
	});

	test('test record event with valid event name', () => {
		mockCreateEvent = jest.spyOn(AnalyticsEventBuilder, 'createEvent');
		provider.record({ name: 'testEvent' });
		expect(mockCreateEvent).toHaveBeenCalled();
	});

	test('test record event with invalid event name', () => {
		const mockProviderCreateEvent = jest.spyOn(provider, 'createEvent');
		provider.record({ name: '01testEvent' });
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				name: Event.PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ERROR_CODE]: Event.ErrorCode.EVENT_NAME_INVALID,
					[ERROR_MESSAGE]: expect.anything(),
				},
			})
		);
	});

	test('test setUserAttributes reached max number limit', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		for (let i = 0; i < 101; i++) {
			clickstreamAttribute[`attribute${i}`] = i;
		}
		provider.setUserAttributes(clickstreamAttribute);
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		const expectedData = {
			name: Event.PresetEvent.CLICKSTREAM_ERROR,
			attributes: {
				[ERROR_CODE]: Event.ErrorCode.USER_ATTRIBUTE_SIZE_EXCEED,
				[ERROR_MESSAGE]: expect.anything(),
			},
		};
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining(expectedData)
		);
	});

	test('test setUserAttributes reached max length of name', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		let longKey = '';
		for (let i = 0; i < 10; i++) {
			longKey += 'abcdeabcdef';
		}
		clickstreamAttribute[longKey] = 'testValue';
		provider.setUserAttributes(clickstreamAttribute);
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				name: Event.PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ERROR_CODE]: Event.ErrorCode.USER_ATTRIBUTE_NAME_LENGTH_EXCEED,
					[ERROR_MESSAGE]: expect.anything(),
				},
			})
		);
	});

	test('test setUserAttributes with invalid name', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		clickstreamAttribute['3abc'] = 'testValue';
		provider.setUserAttributes(clickstreamAttribute);
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				name: Event.PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ERROR_CODE]: Event.ErrorCode.USER_ATTRIBUTE_NAME_INVALID,
					[ERROR_MESSAGE]: expect.anything(),
				},
			})
		);
	});

	test('test setUserAttributes reached max attribute value length', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		let longValue = '';
		for (let i = 0; i < 100; i++) {
			longValue += 'abcdeabcdef';
		}
		clickstreamAttribute['testKey'] = longValue;
		provider.setUserAttributes(clickstreamAttribute);
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				name: Event.PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ERROR_CODE]: Event.ErrorCode.USER_ATTRIBUTE_VALUE_LENGTH_EXCEED,
					[ERROR_MESSAGE]: expect.anything(),
				},
			})
		);
	});

	test('test delete user attribute', () => {
		const clickstreamAttribute: ClickstreamAttribute = {
			testAttribute: 'testValue',
		};
		provider.setUserAttributes(clickstreamAttribute);
		provider.setUserAttributes({
			testAttribute: null,
		});
		expect('testAttribute' in provider.userAttributes).toBeFalsy();
		expect(mockRecordProfileSet).toBeCalled();
	});

	test('test set userId null', () => {
		provider.setUserId('232121');
		provider.setUserId(null);
		expect(
			Event.ReservedAttribute.USER_ID in provider.userAttributes
		).toBeFalsy();
		expect(mockRecordProfileSet).toBeCalledTimes(1);
	});

	test('test set userId not null', () => {
		expect(StorageUtil.getUserIdMapping()).toBeNull();
		const userUniqueId = StorageUtil.getCurrentUserUniqueId();
		const firstTouchTimeStamp =
			provider.userAttributes[
				Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP
			];
		provider.setUserId('113');
		expect(
			provider.userAttributes[
				Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP
			].toString()
		).toBe(firstTouchTimeStamp.toString());
		expect(StorageUtil.getCurrentUserUniqueId()).toBe(userUniqueId);
		expect(StorageUtil.getUserIdMapping()).not.toBeNull();
		expect(mockRecordProfileSet).toBeCalled();
	});

	test('test set userId twice', () => {
		provider.setUserId('113');
		provider.setUserId('114');
		const userIdMapping = StorageUtil.getUserIdMapping();
		expect(userIdMapping).not.toBeNull();
		expect('113' in userIdMapping).toBeTruthy();
		expect('114' in userIdMapping).toBeTruthy();
		expect(provider.context.userUniqueId).toBe(
			userIdMapping['114'].user_uniqueId.value
		);
	});

	test('test set userId A to B to A', () => {
		const userUniqueIdNotLogin = provider.context.userUniqueId;
		const userFirstTouchTimestamp =
			provider.userAttributes[
				Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP
			].value;
		provider.setUserId('A');
		const userUniqueIdA = provider.context.userUniqueId;
		provider.setUserId('B');
		const userUniqueIdB = provider.context.userUniqueId;
		provider.setUserId('A');
		const userUniqueIdReturnA = provider.context.userUniqueId;
		const userIdMapping = StorageUtil.getUserIdMapping();
		expect(userIdMapping).not.toBeNull();
		expect('A' in userIdMapping).toBeTruthy();
		expect('B' in userIdMapping).toBeTruthy();
		expect(userUniqueIdNotLogin === userUniqueIdA).toBeTruthy();
		expect(userUniqueIdB !== userUniqueIdA).toBeTruthy();
		expect(userUniqueIdA === userUniqueIdReturnA).toBeTruthy();
		expect(
			provider.userAttributes[
				Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP
			].value
		).toBe(userFirstTouchTimestamp);
	});

	test('test add global attribute with invalid name', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		clickstreamAttribute['3abc'] = 'testValue';
		provider.setGlobalAttributes(clickstreamAttribute);
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		expect(mockProviderCreateEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				name: Event.PresetEvent.CLICKSTREAM_ERROR,
				attributes: {
					[ERROR_CODE]: Event.ErrorCode.ATTRIBUTE_NAME_INVALID,
					[ERROR_MESSAGE]: expect.anything(),
				},
			})
		);
	});

	test('test delete global attribute', () => {
		const clickstreamAttribute: ClickstreamAttribute = {
			_channel: 'SMS',
		};
		provider.setGlobalAttributes(clickstreamAttribute);
		expect(provider.globalAttributes['_channel']).toBe('SMS');
		provider.setGlobalAttributes({
			_channel: null,
		});
		expect(provider.globalAttributes['_channel']).toBeUndefined();
	});

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
