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

	init() {
		const configuredSearchKeywords = this.provider.configuration.searchKeyWords;
		Object.assign(this.searchKeywords, configuredSearchKeywords);
		this.onPageChange = this.onPageChange.bind(this);
		if (this.context.configuration.pageType === PageType.SPA) {
			this.trackPageViewForSPA();
		} else {
			if (!BrowserInfo.isFromReload()) {
				this.onPageChange();
			}
		}
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
		if (this.context.configuration.isTrackPageViewEvents) {
			const previousPageUrl = StorageUtil.getPreviousPageUrl();
			const previousPageTitle = StorageUtil.getPreviousPageTitle();
			const currentPageUrl = BrowserInfo.getCurrentPageUrl();
			const currentPageTitle = BrowserInfo.getCurrentPageTitle();
			if (
				previousPageUrl !== currentPageUrl ||
				previousPageTitle !== currentPageTitle
			) {
				this.provider.scrollTracker?.enterNewPage();
				if (previousPageUrl !== '') {
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
		return new Date().getTime() - this.lastScreenStartTimestamp;
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
}

enum Constants {
	minEngagementTime = 1000,
}
