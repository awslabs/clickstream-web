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
import { BrowserInfo } from '../../src/browser';
import {
	AnalyticsEventBuilder,
	ClickstreamContext,
	Event,
} from '../../src/provider';
import { AnalyticsEvent } from '../../src/types';
import { StorageUtil } from '../../src/util/StorageUtil';

describe('StorageUtil test', () => {
	test('test get device id', () => {
		const deviceId = StorageUtil.getDeviceId();
		expect(deviceId).not.toBeNull();
		expect(deviceId.length > 0).toBeTruthy();
		const deviceId1 = StorageUtil.getDeviceId();
		expect(deviceId).toEqual(deviceId1);
	});

	test('test get current user unique id', () => {
		const userUniqueId = StorageUtil.getCurrentUserUniqueId();
		expect(userUniqueId).not.toBeNull();
		expect(userUniqueId.length > 0).toBeTruthy();
		const userAttribute = StorageUtil.getUserAttributes();
		expect(userAttribute).not.toBeNull();
		expect(Object.keys(userAttribute).length > 0).toBeTruthy();
		expect(
			userAttribute[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]['value']
		).not.toBeUndefined();
	});

	test('test save bundleSequenceId', () => {
		const initialBundleSequenceId = StorageUtil.getBundleSequenceId();
		expect(initialBundleSequenceId).toBe(1);
		StorageUtil.saveBundleSequenceId(2);
		expect(StorageUtil.getBundleSequenceId()).toBe(2);
	});

	test('test update userAttributes', () => {
		StorageUtil.updateUserAttributes({
			userAge: {
				set_timestamp: new Date().getTime(),
				value: 18,
			},
			userName: {
				set_timestamp: new Date().getTime(),
				value: 'carl',
			},
		});
		const userAttribute = StorageUtil.getUserAttributes();
		expect(Object.keys(userAttribute).length).toBe(2);
		expect(userAttribute['userAge']['value']).toBe(18);
	});

	test('test save and clear failed event', async () => {
		const event = await getTestEvent();
		StorageUtil.saveFailedEvent(event);
		const failedEvents = StorageUtil.getFailedEvents();
		expect(failedEvents.length).toBe(1);
		expect(failedEvents[0].event_id).toEqual(event.event_id);
		StorageUtil.clearFailedEvents();
		const events = StorageUtil.getFailedEvents();
		expect(events.length).toBe(0);
	});

	test('test save failed events reached max event size', async () => {
		const event = await getTestEvent();
		let longValue = '';
		const str = 'abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcde';
		for (let i = 0; i < 20; i++) {
			longValue += str;
		}
		for (let i = 0; i < 100; i++) {
			event.attributes['attribute' + i] = longValue + i;
		}
		for (let i = 0; i < 6; i++) {
			StorageUtil.saveFailedEvent(event);
		}
		const events = StorageUtil.getFailedEvents();
		expect(events.length < 6).toBeTruthy();
	});

	async function getTestEvent(): Promise<AnalyticsEvent> {
		const clickstream = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		return await AnalyticsEventBuilder.createEvent(
			{ name: 'testEvent' },
			{},
			clickstream
		);
	}
});
