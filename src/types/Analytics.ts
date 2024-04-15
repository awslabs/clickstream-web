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
	readonly globalAttributes?: ClickstreamAttribute;
}

export interface Configuration {
	isLogEvents?: boolean;
	authCookie?: string;
	isTrackPageViewEvents?: boolean;
	isTrackUserEngagementEvents?: boolean;
	isTrackClickEvents?: boolean;
	isTrackScrollEvents?: boolean;
	isTrackSearchEvents?: boolean;
	isTrackPageLoadEvents?: boolean;
	isTrackAppStartEvents?: boolean;
	isTrackAppEndEvents?: boolean;
}

export enum SendMode {
	Immediate = 'Immediate',
	Batch = 'Batch',
}

export enum PageType {
	SPA = 'SPA',
	multiPageApp = 'multiPageApp',
}

export enum Attr {
	TRAFFIC_SOURCE_SOURCE = '_traffic_source_source',
	TRAFFIC_SOURCE_MEDIUM = '_traffic_source_medium',
	TRAFFIC_SOURCE_CAMPAIGN = '_traffic_source_campaign',
	TRAFFIC_SOURCE_CAMPAIGN_ID = '_traffic_source_campaign_id',
	TRAFFIC_SOURCE_TERM = '_traffic_source_term',
	TRAFFIC_SOURCE_CONTENT = '_traffic_source_content',
	TRAFFIC_SOURCE_CLID = '_traffic_source_clid',
	TRAFFIC_SOURCE_CLID_PLATFORM = '_traffic_source_clid_platform',
	VALUE = '_value',
	CURRENCY = '_currency',
}

export interface ClickstreamAttribute {
	[Attr.TRAFFIC_SOURCE_SOURCE]?: string;
	[Attr.TRAFFIC_SOURCE_MEDIUM]?: string;
	[Attr.TRAFFIC_SOURCE_CAMPAIGN]?: string;
	[Attr.TRAFFIC_SOURCE_CAMPAIGN_ID]?: string;
	[Attr.TRAFFIC_SOURCE_TERM]?: string;
	[Attr.TRAFFIC_SOURCE_CONTENT]?: string;
	[Attr.TRAFFIC_SOURCE_CLID]?: string;
	[Attr.TRAFFIC_SOURCE_CLID_PLATFORM]?: string;
	[Attr.VALUE]?: number;
	[Attr.CURRENCY]?: string;

	[key: string]: string | number | boolean | null;
}

export interface UserAttributeObject {
	value: string | number | boolean;
	set_timestamp: number;
}

export interface UserAttribute {
	[key: string]: UserAttributeObject;
}

export interface Item {
	id?: string;
	name?: string;
	location_id?: string;
	brand?: string;
	currency?: string;
	price?: number;
	quantity?: number;
	creative_name?: string;
	creative_slot?: string;
	category?: string;
	category2?: string;
	category3?: string;
	category4?: string;
	category5?: string;

	[key: string]: string | number | boolean | null;
}

export interface ClickstreamEvent {
	name: string;
	attributes?: ClickstreamAttribute;
	items?: Item[];
	isImmediate?: boolean;
}

export interface AnalyticsEvent {
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
	viewport_height: number;
	viewport_width: number;
	zone_offset: number;
	system_language: string;
	country_code: string;
	sdk_version: string;
	sdk_name: string;
	host_name: string;
	app_id: string;
	items: Item[];
	user: UserAttribute;
	attributes: ClickstreamAttribute;
}

export interface EventError {
	error_code: number;
	error_message?: string;
}
