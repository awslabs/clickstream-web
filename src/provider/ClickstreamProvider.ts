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
import { AnalyticsEventBuilder } from './AnalyticsEventBuilder';
import { ClickstreamContext } from './ClickstreamContext';
import { Event } from './Event';
import { EventRecorder } from './EventRecorder';
import { BrowserInfo } from '../browser';
import {
	AnalyticsProvider,
	ClickstreamAttribute,
	ClickstreamConfiguration,
	ClickstreamEvent,
	PageType,
	SendMode,
	UserAttribute,
} from '../types';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('ClickstreamProvider');

export class ClickstreamProvider implements AnalyticsProvider {
	configuration: ClickstreamConfiguration;
	eventRecorder: EventRecorder;
	userAttribute: UserAttribute;
	clickstream: ClickstreamContext;

	constructor() {
		this.configuration = {
			appId: '',
			endpoint: '',
			sendMode: SendMode.Immediate,
			sendEventsInterval: 5000,
			isTrackPageViewEvents: true,
			pageType: PageType.multiPageApp,
			isLogEvents: false,
			sessionTimeoutDuration: 1800000,
		};
	}

	configure(configuration: ClickstreamConfiguration): object {
		if (configuration.appId === '' || configuration.endpoint === '') {
			logger.error('Please configure your appId and endpoint');
			return configuration;
		}
		Object.assign(this.configuration, configuration);
		this.clickstream = new ClickstreamContext(
			new BrowserInfo(),
			this.configuration
		);
		this.eventRecorder = new EventRecorder(this.clickstream);
		this.userAttribute = StorageUtil.getUserAttributes();
		logger.debug(
			'Initialize the SDK successfully, configuration is:\n' +
				JSON.stringify(this.configuration)
		);
		this.eventRecorder.sendFailedEvents();
		return this.configuration;
	}

	getCategory(): string {
		return 'Analytics';
	}

	getProviderName(): string {
		return 'ClickstreamProvider';
	}

	record(event: ClickstreamEvent) {
		const result = Event.checkEventName(event.name);
		if (result.error_code > 0) {
			logger.error(result.error_message);
			return;
		}
		AnalyticsEventBuilder.createEvent(
			event,
			this.userAttribute,
			this.clickstream
		)
			.then(event => {
				logger.debug('params: ' + JSON.stringify(event));
				this.eventRecorder.record(event);
			})
			.catch(error => {
				logger.error(`Create event fail with ${error}`);
			});
	}

	setUserId(userId: string | null) {
		if (userId === null) {
			delete this.userAttribute[Event.ReservedAttribute.USER_ID];
		} else {
			this.userAttribute[Event.ReservedAttribute.USER_ID] = {
				value: userId,
				set_timestamp: new Date().getTime(),
			};
		}
		StorageUtil.updateUserAttributes(this.userAttribute);
	}

	setUserAttributes(attributes: ClickstreamAttribute) {
		const timestamp = new Date().getTime();
		for (const key in attributes) {
			const value = attributes[key];
			if (value === null) {
				delete this.userAttribute[key];
			} else {
				const currentNumber = Object.keys(this.userAttribute).length;
				const { checkUserAttribute } = Event;
				const result = checkUserAttribute(currentNumber, key, value);
				if (result.error_code > 0) {
					const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
					this.record({
						name: Event.PresetEvent.CLICKSTREAM_ERROR,
						attributes: {
							[ERROR_CODE]: result.error_code,
							[ERROR_MESSAGE]: result.error_message,
						},
					});
				} else {
					this.userAttribute[key] = {
						value: value,
						set_timestamp: timestamp,
					};
				}
			}
		}
		StorageUtil.updateUserAttributes(this.userAttribute);
	}
}
