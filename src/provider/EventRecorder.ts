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
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { ClickstreamContext } from './ClickstreamContext';
import { NetRequest } from '../network/NetRequest';
import { AnalyticsEvent, SendMode } from '../types';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('EventRecorder');

export class EventRecorder {
	clickstream: ClickstreamContext;
	bundleSequenceId: number;

	constructor(clickstream: ClickstreamContext) {
		this.clickstream = clickstream;
		this.bundleSequenceId = StorageUtil.getBundleSequenceId();
	}

	record(event: AnalyticsEvent) {
		if (this.clickstream.configuration.isLogEvents) {
			logger.level = Logger.LOG_LEVEL.DEBUG;
			logger.debug(
				`Logged event ${event.event_type}, event attributes:\n
				${JSON.stringify(event.attributes)}`
			);
		}
		if (this.clickstream.configuration.sendMode === SendMode.Immediate) {
			const eventsJson = JSON.stringify([event]);
			NetRequest.sendRequest(
				eventsJson,
				this.clickstream,
				this.bundleSequenceId
			).then(result => {
				if (result) {
					logger.debug('Event send success');
				} else {
					StorageUtil.saveFailedEvent(event);
				}
			});
			this.plusSequenceId();
		}
	}

	sendFailedEvents() {
		const failedEvents = StorageUtil.getFailedEvents();
		if (failedEvents.length > 0) {
			const eventsJson = JSON.stringify(failedEvents);
			NetRequest.sendRequest(
				eventsJson,
				this.clickstream,
				this.bundleSequenceId
			).then(result => {
				if (result) {
					logger.debug('Failed events send success');
					StorageUtil.clearFailedEvents();
				}
			});
			this.plusSequenceId();
		}
	}

	plusSequenceId() {
		this.bundleSequenceId += 1;
		StorageUtil.saveBundleSequenceId(this.bundleSequenceId);
	}
}
