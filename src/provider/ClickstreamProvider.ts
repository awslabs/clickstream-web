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
import { PageLoadTracker } from '../tracker/PageLoadTracker';
import { ScrollTracker } from '../tracker/ScrollTracker';
import {
	AnalyticsEvent,
	AnalyticsProvider,
	ClickstreamAttribute,
	ClickstreamConfiguration,
	ClickstreamEvent,
	Configuration,
	EventError,
	PageType,
	SendMode,
	UserAttribute,
} from '../types';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('ClickstreamProvider');

export class ClickstreamProvider implements AnalyticsProvider {
	configuration: ClickstreamConfiguration;
	eventRecorder: EventRecorder;
	userAttributes: UserAttribute;
	globalAttributes: ClickstreamAttribute;
	context: ClickstreamContext;
	sessionTracker: SessionTracker;
	pageViewTracker: PageViewTracker;
	clickTracker: ClickTracker;
	scrollTracker: ScrollTracker;
	pageLoadTracker: PageLoadTracker;

	constructor() {
		this.configuration = {
			appId: '',
			endpoint: '',
			sendMode: SendMode.Immediate,
			sendEventsInterval: 5000,
			isTrackPageViewEvents: true,
			isTrackUserEngagementEvents: true,
			isTrackClickEvents: true,
			isTrackSearchEvents: true,
			isTrackScrollEvents: true,
			isTrackPageLoadEvents: false,
			isTrackAppStartEvents: false,
			isTrackAppEndEvents: false,
			pageType: PageType.SPA,
			isLogEvents: false,
			sessionTimeoutDuration: 1800000,
			idleTimeoutDuration: 120000,
			searchKeyWords: [],
			domainList: [],
			globalAttributes: {},
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
		this.globalAttributes = {};
		this.setGlobalAttributes(configuration.globalAttributes);
		this.userAttributes = StorageUtil.getSimpleUserAttributes();
		this.sessionTracker = new SessionTracker(this, this.context);
		this.pageViewTracker = new PageViewTracker(this, this.context);
		this.clickTracker = new ClickTracker(this, this.context);
		this.scrollTracker = new ScrollTracker(this, this.context);
		this.pageLoadTracker = new PageLoadTracker(this, this.context);
		this.sessionTracker.setUp();
		this.pageViewTracker.setUp();
		this.clickTracker.setUp();
		this.scrollTracker.setUp();
		this.pageLoadTracker.setUp();
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
			this.recordClickstreamError(result);
			return;
		}
		const resultEvent = this.createEvent(event);
		this.recordEvent(resultEvent, event.isImmediate);
	}

	createEvent(
		event: ClickstreamEvent,
		allUserAttributes: UserAttribute = null
	) {
		return AnalyticsEventBuilder.createEvent(
			this.context,
			event,
			allUserAttributes === null ? this.userAttributes : allUserAttributes,
			this.globalAttributes,
			this.sessionTracker.session
		);
	}

	recordEvent(event: AnalyticsEvent, isImmediate = false) {
		this.eventRecorder.record(event, isImmediate);
	}

	setUserId(userId: string | null) {
		let previousUserId = '';
		if (Event.ReservedAttribute.USER_ID in this.userAttributes) {
			previousUserId =
				this.userAttributes[Event.ReservedAttribute.USER_ID].value.toString();
		}
		if (userId === null) {
			delete this.userAttributes[Event.ReservedAttribute.USER_ID];
		} else if (userId !== previousUserId) {
			const userInfo = StorageUtil.getUserInfoFromMapping(userId);
			const newUserAttribute: UserAttribute = {};
			newUserAttribute[Event.ReservedAttribute.USER_ID] = {
				value: userId,
				set_timestamp: new Date().getTime(),
			};
			newUserAttribute[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP] =
				userInfo[Event.ReservedAttribute.USER_FIRST_TOUCH_TIMESTAMP];
			StorageUtil.updateUserAttributes(newUserAttribute);
			this.userAttributes = newUserAttribute;
			this.context.userUniqueId = StorageUtil.getCurrentUserUniqueId();
		}
		this.recordProfileSet(this.userAttributes);
		StorageUtil.updateUserAttributes(this.userAttributes);
	}

	setUserAttributes(attributes: ClickstreamAttribute) {
		const timestamp = new Date().getTime();
		const allUserAttributes = StorageUtil.getAllUserAttributes();
		for (const key in attributes) {
			const value = attributes[key];
			if (value === null) {
				delete allUserAttributes[key];
			} else {
				const currentNumber = Object.keys(allUserAttributes).length;
				const { checkUserAttribute } = EventChecker;
				const result = checkUserAttribute(currentNumber, key, value);
				if (result.error_code > 0) {
					this.recordClickstreamError(result);
				} else {
					allUserAttributes[key] = {
						value: value,
						set_timestamp: timestamp,
					};
				}
			}
		}
		StorageUtil.updateUserAttributes(allUserAttributes);
		this.recordProfileSet(allUserAttributes);
	}

	setGlobalAttributes(attributes: ClickstreamAttribute) {
		for (const key in attributes) {
			const value = attributes[key];
			if (value === null) {
				delete this.globalAttributes[key];
			} else {
				const currentNumber = Object.keys(this.globalAttributes).length;
				const { checkAttributes } = EventChecker;
				const result = checkAttributes(currentNumber, key, value);
				if (result.error_code > 0) {
					this.recordClickstreamError(result);
				} else {
					this.globalAttributes[key] = value;
				}
			}
		}
	}

	recordClickstreamError(error: EventError) {
		const { ERROR_CODE, ERROR_MESSAGE } = Event.ReservedAttribute;
		const errorEvent = this.createEvent({
			name: Event.PresetEvent.CLICKSTREAM_ERROR,
			attributes: {
				[ERROR_CODE]: error.error_code,
				[ERROR_MESSAGE]: error.error_message,
			},
		});
		this.recordEvent(errorEvent);
	}

	recordProfileSet(allUserAttributes: UserAttribute) {
		const profileSetEvent = this.createEvent(
			{ name: Event.PresetEvent.PROFILE_SET },
			allUserAttributes
		);
		this.recordEvent(profileSetEvent);
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
