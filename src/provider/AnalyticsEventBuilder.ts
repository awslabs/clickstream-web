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
import { v4 as uuidV4 } from 'uuid';
import { ClickstreamContext } from './ClickstreamContext';
import { Event } from './Event';
import { BrowserInfo } from '../browser';
import { Session } from '../tracker';
import {
	AnalyticsEvent,
	ClickstreamAttribute,
	ClickstreamEvent,
	UserAttribute,
} from '../types';
import { HashUtil } from '../util/HashUtil';
import { StorageUtil } from '../util/StorageUtil';

export class AnalyticsEventBuilder {
	static async createEvent(
		context: ClickstreamContext,
		event: ClickstreamEvent,
		userAttributes: UserAttribute,
		session?: Session
	): Promise<AnalyticsEvent> {
		const { browserInfo, configuration } = context;
		const attributes = this.getEventAttributesWithCheck(event.attributes);
		if (session !== undefined) {
			attributes[Event.ReservedAttribute.SESSION_ID] = session.sessionId;
			attributes[Event.ReservedAttribute.SESSION_START_TIMESTAMP] =
				session.startTime;
			attributes[Event.ReservedAttribute.SESSION_DURATION] =
				session.getDuration();
			attributes[Event.ReservedAttribute.SESSION_NUMBER] = session.sessionIndex;
		}
		attributes[Event.ReservedAttribute.PAGE_TITLE] =
			BrowserInfo.getCurrentPageTitle();
		attributes[Event.ReservedAttribute.PAGE_URL] =
			BrowserInfo.getCurrentPageUrl();

		const analyticEvent = {
			hashCode: '',
			event_type: event.name,
			event_id: uuidV4(),
			device_id: StorageUtil.getDeviceId(),
			unique_id: context.userUniqueId,
			app_id: configuration.appId,
			timestamp: new Date().getTime(),
			host_name: browserInfo.hostName,
			locale: browserInfo.locale,
			system_language: browserInfo.system_language,
			country_code: browserInfo.country_code,
			zone_offset: browserInfo.zoneOffset,
			make: browserInfo.make,
			platform: 'Web',
			screen_height: window.innerHeight,
			screen_width: window.innerWidth,
			sdk_name: 'aws-solution-clickstream-sdk',
			sdk_version: process.env.VERSION ?? '',
			user: userAttributes ?? {},
			attributes: attributes ?? {},
		};
		analyticEvent.hashCode = await HashUtil.getHashCode(
			JSON.stringify(analyticEvent)
		);
		return analyticEvent;
	}

	static getEventAttributesWithCheck(
		attributes: ClickstreamAttribute
	): ClickstreamAttribute {
		const resultAttributes: ClickstreamAttribute = {};
		for (const key in attributes) {
			const value = attributes[key];
			if (value !== null) {
				const currentNumber = Object.keys(resultAttributes).length;
				const { checkAttributes } = Event;
				const result = checkAttributes(currentNumber, key, value);
				const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
				if (result.error_code > 0 && !(ERROR_CODE in resultAttributes)) {
					resultAttributes[ERROR_CODE] = result.error_code;
					resultAttributes[ERROR_MESSAGE] = result.error_message;
				} else {
					resultAttributes[key] = value;
				}
			}
		}
		return resultAttributes;
	}
}
