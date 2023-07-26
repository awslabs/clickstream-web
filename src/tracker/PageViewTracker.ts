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

import { Logger } from '@aws-amplify/core';
import { BaseTracker } from './BaseTracker';
import { BrowserInfo } from '../browser';
import { ClickstreamContext, ClickstreamProvider, Event } from '../provider';
import { PageType } from '../types';
import { MethodEmbed } from '../util/MethodEmbed';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('PageViewTracker');

export class PageViewTracker extends BaseTracker {
	provider: ClickstreamProvider;
	context: ClickstreamContext;
	isEntrances = false;

	init() {
		this.trackPageView = this.trackPageView.bind(this);
		if (this.context.configuration.pageType === PageType.SPA) {
			this.trackPageViewForSPA();
		} else {
			this.trackPageView();
		}
	}

	trackPageViewForSPA() {
		MethodEmbed.add(history, 'pushState', this.trackPageView);
		MethodEmbed.add(history, 'replaceState', this.trackPageView);
		window.addEventListener('popstate', this.trackPageView);
		this.trackPageView();
	}

	trackPageView() {
		if (!window.sessionStorage) {
			logger.warn('unsupported web environment for sessionStorage');
			return;
		}
		if (this.context.configuration.isTrackPageViewEvents) {
			const previousPageUrl = StorageUtil.getPreviousPageUrl();
			const previousPageTitle = StorageUtil.getPreviousPageTitle();
			const currentPageUrl = BrowserInfo.getCurrentPageUrl();
			const currentPageTitle = BrowserInfo.getCurrentPageTitle();
			const previousPageStartTime = StorageUtil.getPreviousPageStartTime();
			let engagementTime = 0;
			this.isEntrances =
				this.provider.sessionTracker.session.isNewSession() &&
				previousPageUrl === '';
			const currentPageStartTime = new Date().getTime();
			if (previousPageStartTime > 0) {
				engagementTime = currentPageStartTime - previousPageStartTime;
			}
			if (previousPageUrl !== currentPageUrl) {
				this.provider.scrollTracker?.enterNewPage();
				const eventAttributes = {
					[Event.ReservedAttribute.PAGE_REFERRER]: previousPageUrl,
					[Event.ReservedAttribute.PAGE_REFERRER_TITLE]: previousPageTitle,
					[Event.ReservedAttribute.ENTRANCES]: this.isEntrances ? 1 : 0,
				};
				if (!this.isEntrances) {
					eventAttributes[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP] =
						engagementTime;
				}
				this.provider.record({
					name: Event.PresetEvent.PAGE_VIEW,
					attributes: eventAttributes,
				});
				StorageUtil.savePreviousPageUrl(currentPageUrl);
				StorageUtil.savePreviousPageTitle(currentPageTitle);
				StorageUtil.savePreviousPageStartTime(currentPageStartTime);
				if (this.context.configuration.isTrackSearchEvents) {
					this.trackSearchEvents();
				}
			}
		}
	}

	trackSearchEvents() {
		const searchStr = window.location.search;
		if (!searchStr || searchStr.length === 0) return;
		const urlParams = new URLSearchParams(searchStr);
		const searchKeywords = Event.Constants.KEYWORDS;
		const configuredSearchKeywords = this.provider.configuration.searchKeyWords;
		if (configuredSearchKeywords !== undefined) {
			Object.assign(searchKeywords, configuredSearchKeywords);
		}
		for (const keyword of searchKeywords) {
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
