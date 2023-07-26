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
import { Event } from '../provider';

const logger = new Logger('ClickTracker');

export class ClickTracker extends BaseTracker {
	init() {
		this.trackClick = this.trackClick.bind(this);
		document.addEventListener('click', this.trackClick);
	}

	trackClick(event: MouseEvent) {
		if (!this.context.configuration.isTrackClickEvents) return;
		const targetElement = event.target as Element;
		if (targetElement.tagName === 'A') {
			const linkUrl = targetElement.getAttribute('href');
			if (linkUrl === null || linkUrl.length === 0) return;
			let linkDomain = '';
			try {
				const url = new URL(linkUrl);
				linkDomain = url.host;
			} catch (error) {
				logger.debug('parse link domain failed: ' + error);
			}
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
