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
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { v4 as uuidV4 } from 'uuid';
import { Event } from '../provider';
import { AnalyticsEvent, UserAttribute } from '../types';

const logger = new Logger('StorageUtil');

export class StorageUtil {
	static readonly MAX_REQUEST_EVENTS_SIZE = 1024 * 512;
	static readonly MAX_FAILED_EVENTS_SIZE = this.MAX_REQUEST_EVENTS_SIZE;
	static readonly MAX_BATCH_EVENTS_SIZE = 1024 * 1024;

	static readonly prefix = 'aws-solution/clickstream-js/';
	static readonly deviceIdKey = this.prefix + 'deviceIdKey';
	static readonly userUniqueIdKey = this.prefix + 'userUniqueIdKey';
	static readonly bundleSequenceIdKey = this.prefix + 'bundleSequenceIdKey';
	static readonly userAttributesKey = this.prefix + 'userAttributesKey';
	static readonly userFirstTouchTimestampKey =
		this.prefix + 'userFirstTouchTimestampKey';
	static readonly failedEventsKey = this.prefix + 'failedEventsKey';
	static readonly eventsKey = this.prefix + 'eventsKey';

	static getDeviceId(): string {
		let deviceId = localStorage.getItem(StorageUtil.deviceIdKey) ?? '';
		if (deviceId === '') {
			deviceId = uuidV4();
			localStorage.setItem(StorageUtil.deviceIdKey, deviceId);
		}
		return deviceId;
	}

	static getCurrentUserUniqueId(): string {
		let userUniqueId = localStorage.getItem(StorageUtil.userUniqueIdKey) ?? '';
		if (userUniqueId === '') {
			userUniqueId = uuidV4();
			localStorage.setItem(StorageUtil.userUniqueIdKey, userUniqueId);
			StorageUtil.saveUserFirstTouchTimestamp();
		}
		return userUniqueId;
	}

	static saveUserFirstTouchTimestamp() {
		const firstTouchTimestamp = new Date().getTime();
		localStorage.setItem(
			StorageUtil.userFirstTouchTimestampKey,
			String(firstTouchTimestamp)
		);
		StorageUtil.updateUserAttributes({
			[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]: {
				value: firstTouchTimestamp,
				set_timestamp: firstTouchTimestamp,
			},
		});
	}

	static getBundleSequenceId(): number {
		return parseInt(
			localStorage.getItem(StorageUtil.bundleSequenceIdKey) ?? '1'
		);
	}

	static saveBundleSequenceId(bundleSequenceId: number) {
		localStorage.setItem(
			StorageUtil.bundleSequenceIdKey,
			String(bundleSequenceId)
		);
	}

	static updateUserAttributes(userAttributes: UserAttribute) {
		localStorage.setItem(
			StorageUtil.userAttributesKey,
			JSON.stringify(userAttributes)
		);
	}

	static getUserAttributes(): UserAttribute {
		const userAttributes =
			localStorage.getItem(StorageUtil.userAttributesKey) ?? '{}';
		return JSON.parse(userAttributes);
	}

	static getFailedEvents(): string {
		return localStorage.getItem(StorageUtil.failedEventsKey) ?? '';
	}

	static saveFailedEvent(event: AnalyticsEvent) {
		const { MAX_FAILED_EVENTS_SIZE } = StorageUtil;
		const allEvents = StorageUtil.getFailedEvents();
		let eventsStr = '';
		if (allEvents === '') {
			eventsStr = Event.Constants.PREFIX + JSON.stringify(event);
		} else {
			eventsStr = allEvents + ',' + JSON.stringify(event);
		}
		if (eventsStr.length <= MAX_FAILED_EVENTS_SIZE) {
			localStorage.setItem(StorageUtil.failedEventsKey, eventsStr);
		} else {
			const maxSize = MAX_FAILED_EVENTS_SIZE / 1024;
			logger.warn(`Failed events reached max cache size of ${maxSize}kb`);
		}
	}

	static clearFailedEvents() {
		localStorage.removeItem(StorageUtil.failedEventsKey);
	}

	static getAllEvents(): string {
		return localStorage.getItem(StorageUtil.eventsKey) ?? '';
	}

	static saveEvent(event: AnalyticsEvent): boolean {
		const { MAX_BATCH_EVENTS_SIZE } = StorageUtil;
		const allEvents = StorageUtil.getAllEvents();
		let eventsStr = '';
		if (allEvents === '') {
			eventsStr = Event.Constants.PREFIX + JSON.stringify(event);
		} else {
			eventsStr = allEvents + ',' + JSON.stringify(event);
		}
		if (eventsStr.length <= MAX_BATCH_EVENTS_SIZE) {
			localStorage.setItem(StorageUtil.eventsKey, eventsStr);
			return true;
		} else {
			const maxSize = MAX_BATCH_EVENTS_SIZE / 1024;
			logger.warn(`Events reached max cache size of ${maxSize}kb`);
			return false;
		}
	}

	static clearEvents(eventsJson: string) {
		const deletedEvents = JSON.parse(eventsJson);
		const allEvents = JSON.parse(this.getAllEvents() + Event.Constants.SUFFIX);
		if (allEvents.length > deletedEvents.length) {
			const leftEvents = allEvents.splice(deletedEvents.length);
			let leftEventsStr = JSON.stringify(leftEvents);
			leftEventsStr = leftEventsStr.substring(0, leftEventsStr.length - 1);
			localStorage.setItem(StorageUtil.eventsKey, leftEventsStr);
		} else {
			localStorage.removeItem(StorageUtil.eventsKey);
		}
	}
}
