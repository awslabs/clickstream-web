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
import { NetRequest } from '../../src/network/NetRequest';
import {
	AnalyticsEventBuilder,
	ClickstreamContext,
	EventRecorder,
} from '../../src/provider';
import { Session } from '../../src/tracker';
import { AnalyticsEvent, Item, SendMode } from '../../src/types';
import { StorageUtil } from '../../src/util/StorageUtil';

describe('EventRecorder test', () => {
	const mockSendRequest = jest.fn().mockResolvedValue(true);
	let eventRecorder: EventRecorder;
	let context: ClickstreamContext;
	beforeEach(() => {
		localStorage.clear();
		context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://localhost:8080/collect',
			sendMode: SendMode.Batch,
		});
		eventRecorder = new EventRecorder(context);
		jest.spyOn(NetRequest, 'sendRequest').mockImplementation(mockSendRequest);
	});

	afterEach(() => {
		mockSendRequest.mockClear();
	});

	test('test getBatchEvents for empty cache', () => {
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(eventsJson).toBe('');
		expect(needsFlush).toBeFalsy();
	});

	test('test getBatchEvents for not reached the max request events size', async () => {
		const event = await getTestEvent();
		eventRecorder.record(event);
		eventRecorder.record(event);
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(JSON.parse(eventsJson).length).toBe(2);
		expect(needsFlush).toBeFalsy();
	});

	test('test getBatchEvents for reached the max request events size', async () => {
		await saveEventsForReachedOneRequestLimit();
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(JSON.parse(eventsJson).length).toBe(5);
		expect(needsFlush).toBeTruthy();
	});

	test('test getBatchEvents for only one large event', async () => {
		const event = await getLargeEventExceed512k();
		StorageUtil.saveEvent(event);
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(JSON.parse(eventsJson).length).toBe(1);
		expect(needsFlush).toBeFalsy();
	});

	test('test getBatchEvents for only one large event with large items', async () => {
		const event = await getLargeEventExceed512k();
		const items: Item[] = [];
		const longValue = 'a'.repeat(255);
		const item: Item = {
			id: longValue,
			name: longValue,
			brand: longValue,
			category: longValue,
			category2: longValue,
			category3: longValue,
			category4: longValue,
			category5: longValue,
			creative_name: longValue,
			creative_slot: longValue,
			location_id: longValue,
			price: 99.9,
			currency: "$",
			quantity: 1000000,
		};
		for (let i = 0; i < 100; i++) {
			items.push(item);
		}
		event.items = items;
		StorageUtil.saveEvent(event);
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(JSON.parse(eventsJson).length).toBe(1);
		expect(needsFlush).toBeFalsy();
	});

	test('test getBatchEvents for have large event', async () => {
		const event = await getLargeEventExceed512k();
		StorageUtil.saveEvent(event);
		const testEvent = await getTestEvent();
		StorageUtil.saveEvent(testEvent);
		const [eventsJson, needsFlush] = eventRecorder.getBatchEvents();
		expect(JSON.parse(eventsJson).length).toBe(1);
		expect(needsFlush).toBeTruthy();
	});

	test('test flush one events', async () => {
		eventRecorder.context.configuration.isLogEvents = true;
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		const event = await getTestEvent();
		eventRecorder.record(event);
		eventRecorder.flushEvents();
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getAllEvents()).toBe('');
		expect(eventRecorder.bundleSequenceId).toBe(2);
	});

	test('test flush multiple events', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		const event = await getTestEvent();
		eventRecorder.record(event);
		eventRecorder.record(event);
		eventRecorder.flushEvents();
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getAllEvents()).toBe('');
		expect(eventRecorder.bundleSequenceId).toBe(2);
	});

	test('test flush events needs flush twice', async () => {
		const sendRequestMock = jest.spyOn(NetRequest, 'sendRequest');
		await saveEventsForReachedOneRequestLimit();
		eventRecorder.flushEvents();
		await sleep(100);
		expect(sendRequestMock).toBeCalled();
		expect(StorageUtil.getAllEvents()).toBe('');
		expect(eventRecorder.bundleSequenceId).toBe(3);
	});

	test('test flush event when flushing', async () => {
		const event = await getTestEvent();
		eventRecorder.record(event);
		eventRecorder.flushEvents();
		eventRecorder.flushEvents();
		expect(eventRecorder.isFlushingEvents).toBeTruthy();
	});

	test('test record event reached max batch cache limit', async () => {
		const sendEventImmediateMock = jest.spyOn(
			eventRecorder,
			'sendEventImmediate'
		);
		const event = await getLargeEvent();
		for (let i = 0; i < 11; i++) {
			eventRecorder.record(event);
		}
		expect(sendEventImmediateMock).toBeCalled();
	});

	test('test send failed events when window is closing ', async () => {
		const clearFailedEventsMock = jest.spyOn(StorageUtil, 'clearFailedEvents');
		StorageUtil.saveFailedEvent(await getTestEvent());
		eventRecorder.haveFailedEvents = true;
		eventRecorder.sendEventsInBackground(true);
		expect(clearFailedEventsMock).toBeCalled();
	});

	test('test do not send events when window is closing and event size is exceed max keep alive size limit', async () => {
		const flushEventsMock = jest.spyOn(eventRecorder, 'flushEvents');
		const clearAllEventsMock = jest.spyOn(StorageUtil, 'clearAllEvents');
		StorageUtil.saveEvent(await getLargeEvent());
		eventRecorder.sendEventsInBackground(true);
		expect(flushEventsMock).not.toBeCalled();
		expect(clearAllEventsMock).not.toBeCalled();
	});

	test('test send failed events twice', () => {
		const getFailedEventsMock = jest.spyOn(StorageUtil, 'getFailedEvents');
		eventRecorder.sendFailedEvents();
		eventRecorder.sendFailedEvents();
		expect(getFailedEventsMock).toBeCalledTimes(1);
	});

	test('test immediate mode send failure events when an event is sent successfully', async () => {
		const sendFailedEventsMock = jest.spyOn(eventRecorder, 'sendFailedEvents');
		const event = await getTestEvent();
		eventRecorder.haveFailedEvents = true;
		eventRecorder.sendEventImmediate(event);
		await sleep(100);
		expect(sendFailedEventsMock).toBeCalled();
	});

	async function saveEventsForReachedOneRequestLimit() {
		const event = await getLargeEvent();
		for (let i = 0; i < 6; i++) {
			StorageUtil.saveEvent(event);
		}
	}

	async function getLargeEvent() {
		const event = await getTestEvent('testLargeEvent');
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

	async function getLargeEventExceed512k() {
		const event = await getTestEvent('testLargeOneEvent');
		const longValue = 'a'.repeat(1020);
		for (let i = 0; i < 500; i++) {
			event.attributes['attribute' + i] = longValue + i;
		}
		const longUserValue = 'b'.repeat(252);
		for (let i = 0; i < 500; i++) {
			event.user['attribute' + i] = {
				set_timestamp: new Date().getTime(),
				value: longUserValue + i,
			};
		}
		return event;
	}

	async function getTestEvent(
		eventName = 'testEvent'
	): Promise<AnalyticsEvent> {
		return AnalyticsEventBuilder.createEvent(
			context,
			{ name: eventName },
			{},
			Session.getCurrentSession(context)
		);
	}

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
});
