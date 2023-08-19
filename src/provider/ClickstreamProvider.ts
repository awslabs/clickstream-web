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
import { LOG_TYPE } from '@aws-amplify/core/lib/Logger';
import { AnalyticsEventBuilder } from './AnalyticsEventBuilder';
import { ClickstreamContext } from './ClickstreamContext';
import { Event } from './Event';
import { EventChecker } from './EventChecker';
import { EventRecorder } from './EventRecorder';
import { BrowserInfo } from '../browser';
import { PageViewTracker, SessionTracker } from '../tracker';
import { ClickTracker } from '../tracker/ClickTracker';
import { ScrollTracker } from '../tracker/ScrollTracker';
import {
	AnalyticsProvider,
	ClickstreamAttribute,
	ClickstreamConfiguration,
	ClickstreamEvent,
	Configuration,
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
	context: ClickstreamContext;
	sessionTracker: SessionTracker;
	pageViewTracker: PageViewTracker;
	clickTracker: ClickTracker;
	scrollTracker: ScrollTracker;

	constructor() {
		this.configuration = {
			appId: '',
			endpoint: '',
			sendMode: SendMode.Immediate,
			sendEventsInterval: 5000,
			isTrackPageViewEvents: true,
			isTrackClickEvents: true,
			isTrackSearchEvents: true,
			isTrackScrollEvents: true,
			pageType: PageType.SPA,
			isLogEvents: false,
			sessionTimeoutDuration: 1800000,
			searchKeyWords: [],
			domainList: [],
		};
	}

	configure(configuration: ClickstreamConfiguration): object {
		if (configuration.appId === '' || configuration.endpoint === '') {
			logger.error('Please configure your appId and endpoint');
			return configuration;
		}
		Object.assign(this.configuration, configuration);
		this.context = new ClickstreamContext(
			new BrowserInfo(),
			this.configuration
		);
		this.eventRecorder = new EventRecorder(this.context);
		this.sessionTracker = new SessionTracker(this, this.context);
		this.pageViewTracker = new PageViewTracker(this, this.context);
		this.clickTracker = new ClickTracker(this, this.context);
		this.scrollTracker = new ScrollTracker(this, this.context);
		this.sessionTracker.setUp();
		this.pageViewTracker.setUp();
		this.clickTracker.setUp();
		this.scrollTracker.setUp();
		this.userAttribute = StorageUtil.getUserAttributes();
		if (configuration.sendMode === SendMode.Batch) {
			this.startTimer();
		}
		if (this.context.configuration.isLogEvents) {
			logger.level = LOG_TYPE.DEBUG;
		}
		logger.debug(
			'Initialize the SDK successfully, configuration is:\n' +
				JSON.stringify(this.configuration)
		);
		if (this.eventRecorder.getFailedEventsLength() > 0) {
			this.eventRecorder.haveFailedEvents = true;
			this.eventRecorder.sendFailedEvents();
		}
		return this.configuration;
	}

	updateConfigure(configuration: Configuration) {
		Object.assign(this.configuration, configuration);
	}

	getCategory(): string {
		return 'Analytics';
	}

	getProviderName(): string {
		return 'ClickstreamProvider';
	}

	record(event: ClickstreamEvent) {
		const result = EventChecker.checkEventName(event.name);
		if (result.error_code > 0) {
			logger.error(result.error_message);
			return;
		}
		AnalyticsEventBuilder.createEvent(
			this.context,
			event,
			this.userAttribute,
			this.sessionTracker.session
		)
			.then(resultEvent => {
				this.eventRecorder.record(resultEvent, event.isImmediate);
			})
			.catch(error => {
				logger.error(`Create event fail with ${error}`);
			});
	}

	setUserId(userId: string | null) {
		let previousUserId = '';
		if (Event.ReservedAttribute.USER_ID in this.userAttribute) {
			previousUserId =
				this.userAttribute[Event.ReservedAttribute.USER_ID].value.toString();
		}
		if (userId === null) {
			delete this.userAttribute[Event.ReservedAttribute.USER_ID];
		} else if (userId !== previousUserId) {
			const userInfo = StorageUtil.getUserInfoFromMapping(userId);
			const newUserAttribute: UserAttribute = {};
			userInfo[Event.ReservedAttribute.USER_ID] = {
				value: userId,
				set_timestamp: new Date().getTime(),
			};
			Object.assign(newUserAttribute, userInfo);
			this.userAttribute = newUserAttribute;
			this.context.userUniqueId = StorageUtil.getCurrentUserUniqueId();
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
				const { checkUserAttribute } = EventChecker;
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

	startTimer() {
		setInterval(
			this.flushEvents.bind(this, this.eventRecorder),
			this.configuration.sendEventsInterval
		);
	}

	flushEvents(eventRecorder: EventRecorder) {
		eventRecorder.flushEvents();
	}

	sendEventsInBackground(isWindowClosing: boolean) {
		if (
			!(BrowserInfo.isFirefox() && isWindowClosing) &&
			BrowserInfo.isNetworkOnLine()
		) {
			this.eventRecorder.sendEventsInBackground(isWindowClosing);
		}
	}
}
