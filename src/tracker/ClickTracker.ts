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

const logger = new Logger('ClickTracker');

export class ClickTracker {
	provider: ClickstreamProvider;
	context: ClickstreamContext;

	constructor(provider: ClickstreamProvider, context: ClickstreamContext) {
		this.provider = provider;
		this.context = context;
		this.trackClick = this.trackClick.bind(this);
	}

	setUp() {
		if (!BrowserInfo.isBrowser() || !document.addEventListener) {
			logger.debug('not in the supported web environment');
		} else {
			document.addEventListener('click', this.trackClick);
		}
		return this;
	}

	trackClick(event: MouseEvent) {
		if (!this.context.configuration.isTrackClickEvents) return;
		const targetElement = event.target as Element;
		if (targetElement.tagName === 'A') {
			const linkUrl = targetElement.getAttribute('href');
			const linkDomain = new URL(linkUrl).host;
			const linkClasses = targetElement.getAttribute('class');
			const linkId = targetElement.getAttribute('id');
			const outbound = window.location.host !== linkDomain;
			this.provider.record({
				name: Event.PresetEvent.CLICK,
				attributes: {
					[Event.ReservedAttribute.LINK_URL]: linkUrl,
					[Event.ReservedAttribute.LINK_DOMAIN]: linkDomain,
					[Event.ReservedAttribute.LINK_CLASSES]: linkClasses,
					[Event.ReservedAttribute.LINK_ID]: linkId,
					[Event.ReservedAttribute.OUTBOUND]: outbound,
				},
			});
		}
	}
}
