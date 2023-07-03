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
import { ClickstreamAttribute } from '../../src/types';

describe('AnalyticsEventBuilder test', () => {
	test('test create event with common attributes', async () => {
		const clickstream = new ClickstreamContext(new BrowserInfo(), {
			appId: 'testApp',
			endpoint: 'https://example.com/collect',
		});
		const event = await AnalyticsEventBuilder.createEvent(
			{ name: 'testEvent' },
			{},
			clickstream
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
		expect(event.sdk_version).toBe('');
		expect(event.user).toStrictEqual({});
		expect(event.attributes).toStrictEqual({});
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
});
