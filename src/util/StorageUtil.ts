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
import { Session } from '../tracker';
import { AnalyticsEvent, UserAttribute } from '../types';

const logger = new Logger('StorageUtil');

export class StorageUtil {
	static readonly MAX_REQUEST_EVENTS_SIZE = 1024 * 512;
	static readonly MAX_FAILED_EVENTS_SIZE = this.MAX_REQUEST_EVENTS_SIZE;
	static readonly MAX_BATCH_EVENTS_SIZE = 1024 * 1024;

	static readonly prefix = 'aws-solution/clickstream-web/';
	static readonly deviceIdKey = this.prefix + 'deviceIdKey';
	static readonly userUniqueIdKey = this.prefix + 'userUniqueIdKey';
	static readonly bundleSequenceIdKey = this.prefix + 'bundleSequenceIdKey';
	static readonly userAttributesKey = this.prefix + 'userAttributesKey';
	static readonly userFirstTouchTimestampKey =
		this.prefix + 'userFirstTouchTimestampKey';
	static readonly failedEventsKey = this.prefix + 'failedEventsKey';
	static readonly eventsKey = this.prefix + 'eventsKey';
	static readonly sessionKey = this.prefix + 'sessionKey';
	static readonly isFirstOpenKey = this.prefix + 'isFirstOpenKey';
	static readonly previousPageUrlKey = this.prefix + 'previousPageUrlKey';
	static readonly previousPageTitleKey = this.prefix + 'previousPageTitleKey';
	static readonly previousPageStartTimeKey =
		this.prefix + 'previousPageStartTimeKey';
	static readonly userIdMappingKey = this.prefix + 'userIdMappingKey';
	private static deviceId = '';
	private static userUniqueId = '';

	static getDeviceId(): string {
		if (StorageUtil.deviceId !== '') {
			return StorageUtil.deviceId;
		}
		let deviceId = localStorage.getItem(StorageUtil.deviceIdKey);
		if (deviceId === null) {
			deviceId = uuidV4();
			localStorage.setItem(StorageUtil.deviceIdKey, deviceId);
		}
		StorageUtil.deviceId = deviceId;
		return deviceId;
	}

	static setCurrentUserUniqueId(userUniqueId: string) {
		StorageUtil.userUniqueId = userUniqueId;
		localStorage.setItem(StorageUtil.userUniqueIdKey, userUniqueId);
	}

	static getCurrentUserUniqueId(): string {
		if (StorageUtil.userUniqueId !== '') {
			return StorageUtil.userUniqueId;
		}
		let userUniqueId = localStorage.getItem(StorageUtil.userUniqueIdKey);
		if (userUniqueId === null) {
			userUniqueId = uuidV4();
			StorageUtil.setCurrentUserUniqueId(userUniqueId);
			localStorage.setItem(StorageUtil.userUniqueIdKey, userUniqueId);
			StorageUtil.saveUserFirstTouchTimestamp();
		}
		StorageUtil.userUniqueId = userUniqueId;
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

	static saveUserIdMapping(userIdMappingObject: string) {
		localStorage.setItem(
			StorageUtil.userIdMappingKey,
			JSON.stringify(userIdMappingObject)
		);
	}

	static getUserIdMapping() {
		return JSON.parse(localStorage.getItem(StorageUtil.userIdMappingKey));
	}

	static getUserInfoFromMapping(userId: string): UserAttribute {
		let userIdMapping = StorageUtil.getUserIdMapping();
		let userInfo: UserAttribute;
		const timestamp = new Date().getTime();
		if (userIdMapping === null) {
			userIdMapping = {};
			userInfo = {
				user_uniqueId: {
					value: StorageUtil.getCurrentUserUniqueId(),
					set_timestamp: timestamp,
				},
				[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]:
					StorageUtil.getAllUserAttributes()[
						Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP
					],
			};
		} else if (userId in userIdMapping) {
			userInfo = userIdMapping[userId];
			StorageUtil.setCurrentUserUniqueId(
				userInfo.user_uniqueId.value.toString()
			);
		} else {
			const userUniqueId = uuidV4();
			StorageUtil.setCurrentUserUniqueId(userUniqueId);
			userInfo = {
				user_uniqueId: {
					value: userUniqueId,
					set_timestamp: timestamp,
				},
				[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]: {
					value: timestamp,
					set_timestamp: timestamp,
				},
			};
		}
		userIdMapping[userId] = userInfo;
		StorageUtil.saveUserIdMapping(userIdMapping);
		return userInfo;
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

	static getAllUserAttributes(): UserAttribute {
		const userAttributes =
			localStorage.getItem(StorageUtil.userAttributesKey) ?? '{}';
		return JSON.parse(userAttributes);
	}

	static getSimpleUserAttributes(): UserAttribute {
		const allUserAttributes = StorageUtil.getAllUserAttributes();
		const simpleUserAttributes: UserAttribute = {
			[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP]:
				allUserAttributes[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP],
		};
		if (allUserAttributes[Event.ReservedAttribute.USER_ID] !== undefined) {
			simpleUserAttributes[Event.ReservedAttribute.USER_ID] =
				allUserAttributes[Event.ReservedAttribute.USER_ID];
		}
		return simpleUserAttributes;
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
		const eventsString = this.getAllEvents();
		if (eventsString === '') return;
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

	static clearAllEvents() {
		localStorage.removeItem(StorageUtil.eventsKey);
	}

	static saveSession(session: Session) {
		localStorage.setItem(StorageUtil.sessionKey, JSON.stringify(session));
	}

	static getSession(): Session {
		const sessionStr = localStorage.getItem(StorageUtil.sessionKey);
		if (sessionStr === null) {
			return null;
		}
		return JSON.parse(sessionStr) as Session;
	}

	static getIsFirstOpen(): boolean {
		return localStorage.getItem(StorageUtil.isFirstOpenKey) === null;
	}

	static saveIsFirstOpenToFalse() {
		localStorage.setItem(StorageUtil.isFirstOpenKey, '0');
	}

	static clearPageInfo() {
		localStorage.setItem(StorageUtil.previousPageUrlKey, '');
		localStorage.setItem(StorageUtil.previousPageTitleKey, '');
	}

	static getPreviousPageUrl(): string {
		return localStorage.getItem(StorageUtil.previousPageUrlKey) ?? '';
	}

	static savePreviousPageUrl(url: string) {
		localStorage.setItem(StorageUtil.previousPageUrlKey, url);
	}

	static getPreviousPageTitle(): string {
		return localStorage.getItem(StorageUtil.previousPageTitleKey) ?? '';
	}

	static savePreviousPageTitle(title: string) {
		localStorage.setItem(StorageUtil.previousPageTitleKey, title);
	}

	static getPreviousPageStartTime(): number {
		const startTime = localStorage.getItem(
			StorageUtil.previousPageStartTimeKey
		);
		if (startTime === null) {
			return 0;
		} else {
			return Number(startTime);
		}
	}

	static savePreviousPageStartTime(timestamp: number) {
		localStorage.setItem(
			StorageUtil.previousPageStartTimeKey,
			timestamp.toString()
		);
	}

	static checkDeviceId() {
		const currentDeviceId = localStorage.getItem(StorageUtil.deviceIdKey) ?? '';
		if (StorageUtil.deviceId !== '' && currentDeviceId === '') {
			localStorage.setItem(StorageUtil.deviceIdKey, StorageUtil.deviceId);
		}
	}

	static checkUserUniqueId() {
		const currentUserUniqueId =
			localStorage.getItem(StorageUtil.userUniqueIdKey) ?? '';
		if (StorageUtil.userUniqueId !== '' && currentUserUniqueId === '') {
			localStorage.setItem(
				StorageUtil.userUniqueIdKey,
				StorageUtil.userUniqueId
			);
		}
	}

	static checkIsFirstOpen() {
		if (StorageUtil.getIsFirstOpen()) {
			StorageUtil.saveIsFirstOpenToFalse();
		}
	}

	static checkClickstreamId() {
		StorageUtil.checkDeviceId();
		StorageUtil.checkUserUniqueId();
		StorageUtil.checkIsFirstOpen();
	}

	static clearAll() {
		localStorage.clear();
		(StorageUtil as any).deviceid = '';
		(StorageUtil as any).userUniqueId = '';
	}
}
