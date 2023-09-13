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
import { Session } from '../../src/tracker';
import { AnalyticsEvent } from '../../src/types';
import { StorageUtil } from '../../src/util/StorageUtil';

describe('StorageUtil test', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('test get device id', () => {
		const deviceId = StorageUtil.getDeviceId();
		expect(deviceId).not.toBeNull();
		expect(deviceId.length > 0).toBeTruthy();
		const deviceId1 = StorageUtil.getDeviceId();
		expect(deviceId).toEqual(deviceId1);
	});

	test('test get user Attributes return null object', () => {
		const userAttribute = StorageUtil.getUserAttributes();
		expect(JSON.stringify(userAttribute)).toBe('{}');
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
		const failedEventsStr = StorageUtil.getFailedEvents();
		const failedEvents = JSON.parse(failedEventsStr + Event.Constants.SUFFIX);
		expect(failedEvents.length).toBe(1);
		expect(failedEvents[0].event_id).toEqual(event.event_id);
		StorageUtil.clearFailedEvents();
		const events = StorageUtil.getFailedEvents();
		expect(events).toBe('');
	});

	test('test save failed events reached max failed event size', async () => {
		const event = await getLargeEvent();
		for (let i = 0; i < 6; i++) {
			StorageUtil.saveFailedEvent(event);
		}
		const events = JSON.parse(
			StorageUtil.getFailedEvents() + Event.Constants.SUFFIX
		);
		expect(events.length < 6).toBeTruthy();
	});

	test('test save event', async () => {
		const event = await getTestEvent();
		StorageUtil.saveEvent(event);
		StorageUtil.saveEvent(event);
		const allEventsStr = StorageUtil.getAllEvents();
		const allEvents = JSON.parse(allEventsStr + Event.Constants.SUFFIX);
		expect(allEvents.length).toBe(2);
	});

	test('test save events reached max event size', async () => {
		const event = await getLargeEvent();
		for (let i = 0; i < 11; i++) {
			StorageUtil.saveEvent(event);
		}
		const events = JSON.parse(
			StorageUtil.getAllEvents() + Event.Constants.SUFFIX
		);
		expect(events.length < 11).toBeTruthy();
	});

	test('test save and clear one events', async () => {
		const event = await getTestEvent();
		StorageUtil.saveEvent(event);
		StorageUtil.clearEvents(JSON.stringify([event]));
		expect(StorageUtil.getAllEvents()).toBe('');
	});

	test('test clear a part of events', async () => {
		const event1 = await getTestEvent('event1');
		const event2 = await getTestEvent('event2');
		StorageUtil.saveEvent(event1);
		StorageUtil.saveEvent(event2);
		StorageUtil.clearEvents(JSON.stringify([event1]));
		const leftEvents = JSON.parse(
			StorageUtil.getAllEvents() + Event.Constants.SUFFIX
		);
		expect(leftEvents.length).toBe(1);
		expect(leftEvents[0].event_type).toBe('event2');
	});

	test('test save 1000 events parallel', () => {
		const promises = [];
		const eventCount = 1000;
		for (let i = 0; i < eventCount; i++) {
			promises.push(saveEvent());
		}
		Promise.all(promises)
			.then(() => {
				console.log('finish');
				const eventsStr = StorageUtil.getAllEvents() + Event.Constants.SUFFIX;
				expect(JSON.parse(eventsStr).length).toBe(eventCount);
			})
			.catch(error => {
				console.error('error:', error);
				throw error;
			});
	});

	async function saveEvent() {
		const event = await getTestEvent();
		return StorageUtil.saveEvent(event);
	}

	async function getLargeEvent() {
		const event = await getTestEvent('LargeTestEvent');
		let longValue = '';
		const str = 'abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcde';
		for (let i = 0; i < 20; i++) {
			longValue += str;
		}
		for (let i = 0; i < 100; i++) {
			event.attributes['attribute' + i] = longValue + i;
		}
		return event;
	}

	async function getTestEvent(
		eventName = 'testEvent'
	): Promise<AnalyticsEvent> {
		const context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		return AnalyticsEventBuilder.createEvent(
			context,
			{ name: eventName },
			{},
			{},
			Session.getCurrentSession(context)
		);
	}
});
