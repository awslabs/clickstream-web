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
export class Event {
	static readonly Limit = {
		MAX_EVENT_TYPE_LENGTH: 50,
		MAX_NUM_OF_ATTRIBUTES: 500,
		MAX_NUM_OF_USER_ATTRIBUTES: 100,
		MAX_LENGTH_OF_NAME: 50,
		MAX_LENGTH_OF_VALUE: 1024,
		MAX_LENGTH_OF_USER_VALUE: 256,
		MAX_EVENT_NUMBER_OF_BATCH: 100,
		MAX_LENGTH_OF_ERROR_VALUE: 256,
		MAX_NUM_OF_ITEMS: 100,
		MAX_LENGTH_OF_ITEM_VALUE: 256,
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
		ITEM_SIZE_EXCEED: 4001,
		ITEM_VALUE_LENGTH_EXCEED: 4002,
	};

	static readonly ReservedAttribute = {
		USER_ID: '_user_id',
		USER_FIRST_TOUCH_TIMESTAMP: '_user_first_touch_timestamp',
		ERROR_CODE: '_error_code',
		ERROR_MESSAGE: '_error_message',
		IS_FIRST_TIME: '_is_first_time',
		ENGAGEMENT_TIMESTAMP: '_engagement_time_msec',
		PAGE_URL: '_page_url',
		PAGE_TITLE: '_page_title',
		PAGE_REFERRER: '_page_referrer',
		PAGE_REFERRER_TITLE: '_page_referrer_title',
		LATEST_REFERRER: '_latest_referrer',
		LATEST_REFERRER_HOST: '_latest_referrer_host',
		PREVIOUS_TIMESTAMP: '_previous_timestamp',
		ENTRANCES: '_entrances',
		SESSION_ID: '_session_id',
		SESSION_DURATION: '_session_duration',
		SESSION_NUMBER: '_session_number',
		SESSION_START_TIMESTAMP: '_session_start_timestamp',
		LINK_CLASSES: '_link_classes',
		LINK_DOMAIN: '_link_domain',
		LINK_ID: '_link_id',
		LINK_URL: '_link_url',
		OUTBOUND: '_outbound',
		SEARCH_KEY: '_search_key',
		SEARCH_TERM: '_search_term',
	};

	static readonly PresetEvent = {
		FIRST_OPEN: '_first_open',
		APP_START: '_app_start',
		APP_END: '_app_end',
		PROFILE_SET: '_profile_set',
		CLICKSTREAM_ERROR: '_clickstream_error',
		SESSION_START: '_session_start',
		USER_ENGAGEMENT: '_user_engagement',
		PAGE_VIEW: '_page_view',
		CLICK: '_click',
		SEARCH: '_search',
		SCROLL: '_scroll',
	};

	static readonly Constants = {
		PREFIX: '[',
		SUFFIX: ']',
		LAST_EVENT_IDENTIFIER: '},{"event_type":',
		KEYWORDS: ['q', 's', 'search', 'query', 'keyword'],
	};
}
