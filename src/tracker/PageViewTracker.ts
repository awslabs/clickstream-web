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

import { BaseTracker } from './BaseTracker';
import { BrowserInfo } from '../browser';
import { ClickstreamContext, ClickstreamProvider, Event } from '../provider';
import { PageType } from '../types';
import { MethodEmbed } from '../util/MethodEmbed';
import { StorageUtil } from '../util/StorageUtil';

export class PageViewTracker extends BaseTracker {
	provider: ClickstreamProvider;
	context: ClickstreamContext;
	isEntrances = false;
	searchKeywords = Event.Constants.KEYWORDS;
	lastEngageTime = 0;
	lastScreenStartTimestamp = 0;
	isFirstTime = true;
	static lastActiveTimestamp = 0;
	static idleDuration = 0;
	private static idleTimeoutDuration = 0;

	init() {
		PageViewTracker.lastActiveTimestamp = new Date().getTime();
		PageViewTracker.idleTimeoutDuration =
			this.provider.configuration.idleTimeoutDuration;
		const configuredSearchKeywords = this.provider.configuration.searchKeyWords;
		Object.assign(this.searchKeywords, configuredSearchKeywords);
		this.onPageChange = this.onPageChange.bind(this);
		if (this.isMultiPageApp()) {
			if (!BrowserInfo.isFromReload()) {
				this.onPageChange();
			}
		} else {
			this.trackPageViewForSPA();
		}
		this.isFirstTime = false;
	}

	trackPageViewForSPA() {
		MethodEmbed.add(history, 'pushState', this.onPageChange);
		MethodEmbed.add(history, 'replaceState', this.onPageChange);
		window.addEventListener('popstate', this.onPageChange);
		if (!BrowserInfo.isFromReload()) {
			this.onPageChange();
		}
	}

	onPageChange() {
		PageViewTracker.updateIdleDuration();
		if (this.context.configuration.isTrackPageViewEvents) {
			const previousPageUrl = StorageUtil.getPreviousPageUrl();
			const previousPageTitle = StorageUtil.getPreviousPageTitle();
			const currentPageUrl = BrowserInfo.getCurrentPageUrl();
			const currentPageTitle = BrowserInfo.getCurrentPageTitle();
			if (
				this.isFirstTime ||
				this.isMultiPageApp() ||
				previousPageUrl !== currentPageUrl ||
				previousPageTitle !== currentPageTitle
			) {
				this.provider.scrollTracker?.enterNewPage();
				if (
					!this.isMultiPageApp() &&
					!this.isFirstTime &&
					previousPageUrl !== ''
				) {
					this.recordUserEngagement();
				}
				this.trackPageView(previousPageUrl, previousPageTitle);
				this.trackSearchEvents();

				StorageUtil.savePreviousPageUrl(currentPageUrl);
				StorageUtil.savePreviousPageTitle(currentPageTitle);
			}
		}
	}

	trackPageView(previousPageUrl: string, previousPageTitle: string) {
		const previousPageStartTime = StorageUtil.getPreviousPageStartTime();
		const analyticsEvent = this.provider.createEvent({
			name: Event.PresetEvent.PAGE_VIEW,
		});
		const currentPageStartTime = analyticsEvent.timestamp;

		const eventAttributes = {
			[Event.ReservedAttribute.PAGE_REFERRER]: previousPageUrl,
			[Event.ReservedAttribute.PAGE_REFERRER_TITLE]: previousPageTitle,
			[Event.ReservedAttribute.ENTRANCES]: this.isEntrances ? 1 : 0,
		};
		if (previousPageStartTime > 0) {
			eventAttributes[Event.ReservedAttribute.PREVIOUS_TIMESTAMP] =
				previousPageStartTime;
		}
		if (this.lastEngageTime > 0) {
			eventAttributes[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP] =
				this.lastEngageTime;
		}
		Object.assign(analyticsEvent.attributes, eventAttributes);
		this.provider.recordEvent(analyticsEvent);

		this.isEntrances = false;

		StorageUtil.savePreviousPageStartTime(currentPageStartTime);
		this.lastScreenStartTimestamp = currentPageStartTime;
	}

	setIsEntrances() {
		this.isEntrances = true;
	}

	updateLastScreenStartTimestamp() {
		this.lastScreenStartTimestamp = new Date().getTime();
		PageViewTracker.idleDuration = 0;
		PageViewTracker.lastActiveTimestamp = this.lastScreenStartTimestamp;
	}

	recordUserEngagement(isImmediate = false) {
		this.lastEngageTime = this.getLastEngageTime();
		if (
			this.provider.configuration.isTrackUserEngagementEvents &&
			this.lastEngageTime > Constants.minEngagementTime
		) {
			this.provider.record({
				name: Event.PresetEvent.USER_ENGAGEMENT,
				attributes: {
					[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP]: this.lastEngageTime,
				},
				isImmediate: isImmediate,
			});
		}
	}

	getLastEngageTime() {
		const duration = new Date().getTime() - this.lastScreenStartTimestamp;
		const engageTime = duration - PageViewTracker.idleDuration;
		PageViewTracker.idleDuration = 0;
		return engageTime;
	}

	isMultiPageApp() {
		return this.context.configuration.pageType === PageType.multiPageApp;
	}

	trackSearchEvents() {
		if (!this.context.configuration.isTrackSearchEvents) return;
		const searchStr = window.location.search;
		if (!searchStr || searchStr.length === 0) return;
		const urlParams = new URLSearchParams(searchStr);
		for (const keyword of this.searchKeywords) {
			if (urlParams.has(keyword)) {
				const searchTerm = urlParams.get(keyword);
				this.provider.record({
					name: Event.PresetEvent.SEARCH,
					attributes: {
						[Event.ReservedAttribute.SEARCH_KEY]: keyword,
						[Event.ReservedAttribute.SEARCH_TERM]: searchTerm,
					},
				});
				break;
			}
		}
	}

	static updateIdleDuration() {
		const currentTimestamp = new Date().getTime();
		const idleDuration = currentTimestamp - PageViewTracker.lastActiveTimestamp;
		if (idleDuration > PageViewTracker.idleTimeoutDuration) {
			PageViewTracker.idleDuration += idleDuration;
		}
		PageViewTracker.lastActiveTimestamp = currentTimestamp;
	}
}

export enum Constants {
	minEngagementTime = 1000,
}
