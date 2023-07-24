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
import { BrowserInfo } from '../browser';
import { ClickstreamContext, ClickstreamProvider, Event } from '../provider';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('ScrollTracker');

export class ScrollTracker {
	provider: ClickstreamProvider;
	context: ClickstreamContext;
	currentPageUrl: string;
	isFirstTime: boolean;

	constructor(provider: ClickstreamProvider, context: ClickstreamContext) {
		this.provider = provider;
		this.context = context;
		this.trackScroll = this.trackScroll.bind(this);
	}

	setUp() {
		if (!BrowserInfo.isBrowser() || !document.addEventListener) {
			logger.debug('not in the supported web environment');
		} else {
			document.addEventListener('scroll', this.trackScroll);
			this.currentPageUrl = BrowserInfo.getCurrentPageUrl();
			this.isFirstTime = true;
		}
		return this;
	}

	trackScroll() {
		if (!this.context.configuration.isTrackScrollEvents) return;
		const scrollY = window.scrollY || document.documentElement.scrollTop;
		const ninetyPercentHeight = document.body.scrollHeight * 0.9;
		if (BrowserInfo.getCurrentPageUrl() !== this.currentPageUrl) {
			this.isFirstTime = true;
		}
		if (scrollY > ninetyPercentHeight && this.isFirstTime) {
			const engagementTime =
				new Date().getTime() - StorageUtil.getPreviousPageStartTime();
			this.provider.record({
				name: Event.PresetEvent.SCROLL,
				attributes: {
					[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP]: engagementTime,
				},
			});
			this.isFirstTime = false;
		}
	}
}
