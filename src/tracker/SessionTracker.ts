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
import { Session } from './Session';
import { ClickstreamContext, ClickstreamProvider, Event } from '../provider';
import { StorageUtil } from '../util/StorageUtil';

const logger = new Logger('SessionTracker');

export class SessionTracker {
	provider: ClickstreamProvider;
	context: ClickstreamContext;
	hiddenStr: string;
	visibilityChange: string;
	session: Session;
	startEngageTimestamp: number;

	constructor(provider: ClickstreamProvider, context: ClickstreamContext) {
		this.provider = provider;
		this.context = context;
		this.onVisibilityChange = this.onVisibilityChange.bind(this);
		this.onBeforeUnload = this.onBeforeUnload.bind(this);
	}

	setUp() {
		this.handleInit();
		if (!this.checkEnv()) {
			logger.warn('not supported env');
		} else {
			document.addEventListener(
				this.visibilityChange,
				this.onVisibilityChange,
				false
			);
			window.addEventListener('beforeunload', this.onBeforeUnload, false);
		}
		return this;
	}

	onVisibilityChange() {
		if (document.visibilityState === this.hiddenStr) {
			this.onPageHide();
		} else {
			this.onPageAppear();
		}
	}

	handleInit() {
		if (StorageUtil.getIsFirstOpen()) {
			this.provider.record({
				name: Event.PresetEvent.FIRST_OPEN,
			});
			StorageUtil.saveIsFirstOpenToFalse();
		}
		this.onPageAppear(true);
	}

	onPageAppear(isFirstTime = false) {
		logger.debug('page appear');
		this.updateEngageTimestamp();
		this.session = Session.getCurrentSession(this.context);
		if (this.session.isNewSession()) {
			this.provider.record({ name: Event.PresetEvent.SESSION_START });
		}
		this.provider.record({
			name: Event.PresetEvent.APP_START,
			attributes: {
				[Event.ReservedAttribute.IS_FIRST_TIME]: isFirstTime,
			},
		});
	}

	onPageHide() {
		logger.debug('page hide');
		this.storeSession();
		this.recordUserEngagement();
	}

	recordUserEngagement() {
		const engagementTime = new Date().getTime() - this.startEngageTimestamp;
		if (engagementTime > Constants.minEngagementTime) {
			this.provider.record({
				name: Event.PresetEvent.USER_ENGAGEMENT,
				attributes: {
					[Event.ReservedAttribute.ENGAGEMENT_TIMESTAMP]: engagementTime,
				},
			});
		}
	}

	onBeforeUnload() {
		logger.debug('onBeforeUnload');
		this.onPageHide();
	}

	storeSession() {
		this.session.pause();
		StorageUtil.saveSession(this.session);
	}

	updateEngageTimestamp() {
		this.startEngageTimestamp = new Date().getTime();
	}

	checkEnv(): boolean {
		if (!document || !document.addEventListener) {
			logger.debug('not in the supported web environment');
			return false;
		}
		if (typeof document.hidden !== 'undefined') {
			this.hiddenStr = 'hidden';
			this.visibilityChange = 'visibilitychange';
		} else if (typeof (document as any).msHidden !== 'undefined') {
			this.hiddenStr = 'msHidden';
			this.visibilityChange = 'msvisibilitychange';
		} else if (typeof (document as any).webkitHidden !== 'undefined') {
			this.hiddenStr = 'webkitHidden';
			this.visibilityChange = 'webkitvisibilitychange';
		} else {
			logger.debug('not in the supported web environment');
			return false;
		}
		return true;
	}
}

enum Constants {
	minEngagementTime = 1000,
}
