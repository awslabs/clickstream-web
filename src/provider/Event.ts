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
import { EventError } from '../types';

const logger = new Logger('ClickstreamProvider');

export class Event {
	static checkEventName(eventName: string): EventError {
		const { EVENT_NAME_INVALID, EVENT_NAME_LENGTH_EXCEED, NO_ERROR } =
			Event.ErrorCode;
		const { MAX_EVENT_TYPE_LENGTH } = Event.Limit;
		if (!Event.isValidName(eventName)) {
			return {
				error_code: EVENT_NAME_INVALID,
				error_message:
					`Event name can only contains uppercase and lowercase letters, ` +
					`underscores, number, and is not start with a number. event name: ${eventName}`,
			};
		} else if (eventName.length > MAX_EVENT_TYPE_LENGTH) {
			return {
				error_code: EVENT_NAME_LENGTH_EXCEED,
				error_message:
					`Event name is too long, the max event type length is ` +
					`${MAX_EVENT_TYPE_LENGTH} characters. event name: ${eventName}`,
			};
		}
		return {
			error_code: NO_ERROR,
		};
	}

	static isValidName(name: string): boolean {
		const regex = /^(?![0-9])[0-9a-zA-Z_]+$/;
		return regex.test(name);
	}

	static checkAttributes(
		currentNumber: number,
		key: string,
		value: string | number | boolean
	): EventError {
		const { MAX_NUM_OF_ATTRIBUTES, MAX_LENGTH_OF_NAME, MAX_LENGTH_OF_VALUE } =
			Event.Limit;
		const {
			NO_ERROR,
			ATTRIBUTE_SIZE_EXCEED,
			ATTRIBUTE_NAME_INVALID,
			ATTRIBUTE_NAME_LENGTH_EXCEED,
			ATTRIBUTE_VALUE_LENGTH_EXCEED,
		} = Event.ErrorCode;
		if (currentNumber >= MAX_NUM_OF_ATTRIBUTES) {
			const errorMsg =
				`reached the max number of user attributes limit ${MAX_NUM_OF_ATTRIBUTES}. ` +
				`and the user attribute: ${key} will not be recorded`;
			logger.error(errorMsg);
			const errorString = `attribute name: ${key}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: ATTRIBUTE_SIZE_EXCEED,
			};
		}
		if (key.length > MAX_LENGTH_OF_NAME) {
			const errorMsg =
				`attribute : ${key}, reached the max length of attributes name ` +
				`limit(${MAX_LENGTH_OF_NAME}). current length is: (${key.length}) ` +
				`and the attribute will not be recorded`;
			logger.error(errorMsg);
			const errorString = `attribute name length is: (${key.length}) name is: ${key}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: ATTRIBUTE_NAME_LENGTH_EXCEED,
			};
		}
		if (!Event.isValidName(key)) {
			const errorMsg =
				`attribute : ${key}, was not valid, attribute name can only ` +
				`contains uppercase and lowercase letters, underscores, number, and is not ` +
				`start with a number, so the attribute will not be recorded`;
			logger.error(errorMsg);
			return {
				error_message: Event.getLimitString(key),
				error_code: ATTRIBUTE_NAME_INVALID,
			};
		}
		const valueLength = String(value).length;
		if (valueLength > MAX_LENGTH_OF_VALUE) {
			const errorMsg =
				`attribute : ${key}, reached the max length of attributes value limit ` +
				`(${MAX_LENGTH_OF_VALUE}). current length is: (${valueLength}). ` +
				`and the attribute will not be recorded, attribute value: ${value}`;
			logger.error(errorMsg);
			const errorString = `attribute name: ${key}, attribute value: ${value}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: ATTRIBUTE_VALUE_LENGTH_EXCEED,
			};
		}
		return {
			error_code: NO_ERROR,
		};
	}

	static getLimitString(str: string): string {
		return str.substring(0, Event.Limit.MAX_LENGTH_OF_ERROR_VALUE);
	}

	static checkUserAttribute(
		currentNumber: number,
		key: string,
		value: string | number | boolean
	): EventError {
		const {
			MAX_NUM_OF_USER_ATTRIBUTES,
			MAX_LENGTH_OF_NAME,
			MAX_LENGTH_OF_USER_VALUE,
		} = Event.Limit;
		const {
			NO_ERROR,
			USER_ATTRIBUTE_SIZE_EXCEED,
			USER_ATTRIBUTE_NAME_LENGTH_EXCEED,
			USER_ATTRIBUTE_NAME_INVALID,
			USER_ATTRIBUTE_VALUE_LENGTH_EXCEED,
		} = Event.ErrorCode;
		if (currentNumber >= MAX_NUM_OF_USER_ATTRIBUTES) {
			const errorMsg =
				`reached the max number of user attributes limit (${MAX_NUM_OF_USER_ATTRIBUTES}). ` +
				`and the user attribute: ${key} will not be recorded`;
			logger.error(errorMsg);
			const errorString = `attribute name:${key}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: USER_ATTRIBUTE_SIZE_EXCEED,
			};
		}
		if (key.length > MAX_LENGTH_OF_NAME) {
			const errorMsg =
				`user attribute : ${key}, reached the max length of attributes name limit ` +
				`(${MAX_LENGTH_OF_NAME}). current length is: (${key.length}) ` +
				`and the attribute will not be recorded`;
			logger.error(errorMsg);
			const errorString = `user attribute name length is: (${key.length}) name is: ${key}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: USER_ATTRIBUTE_NAME_LENGTH_EXCEED,
			};
		}
		if (!Event.isValidName(key)) {
			const errorMsg =
				`user attribute : ${key}, was not valid, user attribute name can only ` +
				`contains uppercase and lowercase letters, underscores, number, and is not ` +
				`start with a number. so the attribute will not be recorded`;
			logger.error(errorMsg);
			return {
				error_message: Event.getLimitString(key),
				error_code: USER_ATTRIBUTE_NAME_INVALID,
			};
		}
		const valueLength = String(value).length;
		if (valueLength > MAX_LENGTH_OF_USER_VALUE) {
			const errorMsg =
				`user attribute : ${key}, reached the max length of attributes value limit ` +
				`(${MAX_LENGTH_OF_USER_VALUE}). current length is: (${valueLength}). ` +
				`and the attribute will not be recorded, attribute value: ${value}`;
			logger.error(errorMsg);
			const errorString = `attribute name: ${key}, attribute value: ${value}`;
			return {
				error_message: Event.getLimitString(errorString),
				error_code: USER_ATTRIBUTE_VALUE_LENGTH_EXCEED,
			};
		}
		return {
			error_code: NO_ERROR,
		};
	}

	static readonly Limit = {
		MAX_EVENT_TYPE_LENGTH: 50,
		MAX_NUM_OF_ATTRIBUTES: 500,
		MAX_NUM_OF_USER_ATTRIBUTES: 100,
		MAX_LENGTH_OF_NAME: 50,
		MAX_LENGTH_OF_VALUE: 1024,
		MAX_LENGTH_OF_USER_VALUE: 256,
		MAX_EVENT_NUMBER_OF_BATCH: 100,
		MAX_LENGTH_OF_ERROR_VALUE: 256,
	};

	static readonly ErrorCode = {
		NO_ERROR: 0,
		EVENT_NAME_INVALID: 1001,
		EVENT_NAME_LENGTH_EXCEED: 1002,
		ATTRIBUTE_NAME_LENGTH_EXCEED: 2001,
		ATTRIBUTE_NAME_INVALID: 2002,
		ATTRIBUTE_VALUE_LENGTH_EXCEED: 2003,
		ATTRIBUTE_SIZE_EXCEED: 2004,
		USER_ATTRIBUTE_SIZE_EXCEED: 3001,
		USER_ATTRIBUTE_NAME_LENGTH_EXCEED: 3002,
		USER_ATTRIBUTE_NAME_INVALID: 3003,
		USER_ATTRIBUTE_VALUE_LENGTH_EXCEED: 3004,
	};

	static readonly ReservedAttribute = {
		USER_ID: '_user_id',
		USER_FIRST_TOUCH_TIMESTAMP: '_user_first_touch_timestamp',
		ERROR_CODE: '_error_code',
		ERROR_MESSAGE: '_error_message',
	};

	static readonly PresetEvent = {
		FIRST_OPEN: '_first_open',
		PROFILE_SET: '_profile_set',
		CLICKSTREAM_ERROR: '_clickstream_error',
	};
}
