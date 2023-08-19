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
	processedElements = new WeakSet();

	init() {
		this.trackClick = this.trackClick.bind(this);
		const currentDomain = window.location.host;
		const domainList = this.context.configuration.domainList;
		if (!domainList.includes(currentDomain)) {
			domainList.push(currentDomain);
		}
		this.addClickListenerForATag();
	}

	trackClick(event: MouseEvent) {
		if (!this.context.configuration.isTrackClickEvents) return;
		const targetElement = event.target as Element;
		const element = this.findATag(targetElement);
		if (element !== null) {
			const linkUrl = element.getAttribute('href');
			if (linkUrl === null || linkUrl.length === 0) return;
			let linkDomain = '';
			try {
				const url = new URL(linkUrl);
				linkDomain = url.host;
			} catch (error) {
				logger.debug('parse link domain failed: ' + error);
			}
			if (linkDomain === '') return;
			const linkClasses = element.getAttribute('class');
			const linkId = element.getAttribute('id');
			const outbound =
				!this.context.configuration.domainList.includes(linkDomain);
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

	addClickListenerForATag() {
		const observer = new MutationObserver(mutationsList => {
			for (const mutation of mutationsList) {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					const target = mutation.target;
					if (target instanceof Element) {
						const aTags = target.querySelectorAll('a');
						aTags.forEach(aTag => {
							if (!this.processedElements.has(aTags)) {
								aTag.addEventListener('click', this.trackClick);
								this.processedElements.add(aTag);
							}
						});
					}
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}

	findATag(element: Element, depth = 0): Element {
		if (element && depth < 3) {
			if (element.tagName === 'A') {
				return element;
			} else {
				depth += 1;
				return this.findATag(element.parentElement, depth);
			}
		}
		return null;
	}
}
