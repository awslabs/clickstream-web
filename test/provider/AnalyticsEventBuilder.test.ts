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

import { version } from '../../package.json';
import { BrowserInfo } from '../../src/browser';
import {
	AnalyticsEventBuilder,
	ClickstreamContext,
	Event,
} from '../../src/provider';
import { Session } from '../../src/tracker';
import { ClickstreamAttribute, Item } from '../../src/types';

describe('AnalyticsEventBuilder test', () => {
	test('test create event with common attributes', async () => {
		const referrer = 'https://example1.com/collect';
		Object.defineProperty(window.document, 'referrer', {
			writable: true,
			value: referrer,
		});
		const context = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		const event = await AnalyticsEventBuilder.createEvent(
			context,
			{ name: 'testEvent' },
			{},
			Session.getCurrentSession(context)
		);
		expect(event.hashCode.length).toBe(8);
		expect(event.event_type).toBe('testEvent');
		expect(event.event_id.length > 0).toBeTruthy();
		expect(event.device_id.length > 0).toBeTruthy();
		expect(event.unique_id.length > 0).toBeTruthy();
		expect(event.timestamp > 0).toBeTruthy();
		expect(event.host_name.length > 0).toBeTruthy();
		expect(event.locale.length > 0).toBeTruthy();
		expect(event.system_language.length > 0).toBeTruthy();
		expect(event.zone_offset).not.toBeUndefined();
		expect(event.make.length > 0).toBeTruthy();
		expect(event.platform).toBe('Web');
		expect(event.sdk_name).toBe('aws-solution-clickstream-sdk');
		expect(event.screen_height > 0).toBeTruthy();
		expect(event.screen_width > 0).toBeTruthy();
		expect(event.sdk_version).toBe(version);
		expect(event.user).toStrictEqual({});
		expect(Event.ReservedAttribute.PAGE_TITLE in event.attributes);
		expect(Event.ReservedAttribute.PAGE_URL in event.attributes);
		expect(Event.ReservedAttribute.SESSION_ID in event.attributes);
		expect(Event.ReservedAttribute.SESSION_DURATION in event.attributes);
		expect(Event.ReservedAttribute.SESSION_NUMBER in event.attributes);
		expect(Event.ReservedAttribute.SESSION_START_TIMESTAMP in event.attributes);
		expect(Event.ReservedAttribute.LATEST_REFERRER in event.attributes);
		expect(Event.ReservedAttribute.LATEST_REFERRER_HOST in event.attributes);
	});

	test('test check event attribute reached max attribute number limit', () => {
		let clickstreamAttribute: ClickstreamAttribute = {};
		for (let i = 0; i < 501; i++) {
			clickstreamAttribute[`attribute${i}`] = i;
		}
		clickstreamAttribute =
			AnalyticsEventBuilder.getEventAttributesWithCheck(clickstreamAttribute);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ATTRIBUTE_SIZE_EXCEED
		);
	});

	test('test check event attribute reached max length of name', () => {
		let clickstreamAttribute: ClickstreamAttribute = {};
		let longKey = '';
		for (let i = 0; i < 10; i++) {
			longKey += 'abcdeabcdef';
		}
		clickstreamAttribute[longKey] = 'testValue';
		clickstreamAttribute =
			AnalyticsEventBuilder.getEventAttributesWithCheck(clickstreamAttribute);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ATTRIBUTE_NAME_LENGTH_EXCEED
		);
	});

	test('test check event attribute with invalid name', () => {
		let clickstreamAttribute: ClickstreamAttribute = {};
		clickstreamAttribute['3abc'] = 'testValue';
		clickstreamAttribute =
			AnalyticsEventBuilder.getEventAttributesWithCheck(clickstreamAttribute);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ATTRIBUTE_NAME_INVALID
		);
	});

	test('test check event attribute reached max attribute value length', () => {
		let clickstreamAttribute: ClickstreamAttribute = {};
		let longValue = '';
		for (let i = 0; i < 100; i++) {
			longValue += 'abcdeabcdef';
		}
		clickstreamAttribute['testKey'] = longValue;
		clickstreamAttribute =
			AnalyticsEventBuilder.getEventAttributesWithCheck(clickstreamAttribute);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ATTRIBUTE_VALUE_LENGTH_EXCEED
		);
	});

	test('test check event item reached max item number limit', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		const items: Item[] = [];
		const exceedNumber = Event.Limit.MAX_NUM_OF_ITEMS + 1;
		for (let i = 0; i < exceedNumber; i++) {
			const item: Item = {
				id: String(i),
				name: 'item' + i,
			};
			items.push(item);
		}
		const resultItems = AnalyticsEventBuilder.getEventItemsWithCheck(
			items,
			clickstreamAttribute
		);
		expect(resultItems.length).toBe(Event.Limit.MAX_NUM_OF_ITEMS);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ITEM_SIZE_EXCEED
		);
	});

	test('test check event item reached max item attribute value length limit', () => {
		const clickstreamAttribute: ClickstreamAttribute = {};
		const items: Item[] = [];
		let longValue = '';
		for (let i = 0; i < 26; i++) {
			longValue += 'abcdeabcde';
		}
		const item1: Item = {
			id: 'invalid1',
			name: longValue,
			category: 'category',
		};
		items.push(item1);
		const resultItems = AnalyticsEventBuilder.getEventItemsWithCheck(
			items,
			clickstreamAttribute
		);
		expect(resultItems.length).toBe(1);
		expect(
			Event.ReservedAttribute.ERROR_CODE in clickstreamAttribute
		).toBeTruthy();
		expect(clickstreamAttribute[Event.ReservedAttribute.ERROR_CODE]).toBe(
			Event.ErrorCode.ITEM_VALUE_LENGTH_EXCEED
		);
	});
});
