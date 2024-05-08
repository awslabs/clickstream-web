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
import { PageViewTracker } from './PageViewTracker';
import { Event } from '../provider';
import { StorageUtil } from '../util/StorageUtil';

export class ScrollTracker extends BaseTracker {
	isFirstTime: boolean;

	init() {
		this.trackScroll = this.trackScroll.bind(this);
		const throttledTrackScroll = this.throttle(this.trackScroll, 100);
		document.addEventListener('scroll', throttledTrackScroll, {
			passive: true,
		});
		const throttledMouseMove = this.throttle(this.onMouseMove, 100);
		document.addEventListener('mousemove', throttledMouseMove, {
			passive: true,
		});
		this.isFirstTime = true;
	}

	enterNewPage() {
		this.isFirstTime = true;
	}

	trackScroll() {
		PageViewTracker.updateIdleDuration();
		if (!this.context.configuration.isTrackScrollEvents) return;
		const scrollY = window.scrollY || document.documentElement.scrollTop;
		const ninetyPercentHeight = document.body.scrollHeight * 0.9;
		const viewedHeight = scrollY + window.innerHeight;
		if (scrollY > 0 && viewedHeight > ninetyPercentHeight && this.isFirstTime) {
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

	onMouseMove() {
		PageViewTracker.updateIdleDuration();
	}

	throttle(func: (...args: any[]) => void, delay: number) {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		return function (this: any, ...args: any[]) {
			if (!timeout) {
				timeout = setTimeout(() => {
					func.apply(this, args);
					timeout = null;
				}, delay);
			}
		};
	}
}
