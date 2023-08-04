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

export interface ClickstreamConfiguration extends Configuration {
	readonly appId: string;
	readonly endpoint: string;
	readonly sendMode?: SendMode;
	readonly sendEventsInterval?: number;
	readonly pageType?: PageType;
	readonly sessionTimeoutDuration?: number;
	readonly searchKeyWords?: string[];
	readonly domainList?: string[];
}

export interface Configuration {
	isLogEvents?: boolean;
	authCookie?: string;
	isTrackPageViewEvents?: boolean;
	isTrackClickEvents?: boolean;
	isTrackScrollEvents?: boolean;
	isTrackSearchEvents?: boolean;
}

export enum SendMode {
	Immediate = 'Immediate',
	Batch = 'Batch',
}

export enum PageType {
	SPA = 'SPA',
	multiPageApp = 'multiPageApp',
}

export interface ClickstreamAttribute {
	[key: string]: string | number | boolean | null;
}

export interface UserAttributeObject {
	value: string | number | boolean;
	set_timestamp: number;
}

export interface UserAttribute {
	[key: string]: UserAttributeObject;
}

export interface ClickstreamEvent {
	name: string;
	attributes?: ClickstreamAttribute;
}

export interface AnalyticsEvent {
	hashCode?: string;
	unique_id: string;
	event_type: string;
	event_id: string;
	timestamp: number;
	device_id: string;
	platform: string;
	make: string;
	locale: string;
	screen_height: number;
	screen_width: number;
	zone_offset: number;
	system_language: string;
	country_code: string;
	sdk_version: string;
	sdk_name: string;
	host_name: string;
	app_id: string;
	user: UserAttribute;
	attributes: ClickstreamAttribute;
}

export interface EventError {
	error_code: number;
	error_message?: string;
}
