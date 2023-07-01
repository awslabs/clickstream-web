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
import { AnalyticsProvider, ClickstreamConfiguration } from '../types';

const logger = new Logger('ClickstreamProvider');

export class ClickstreamProvider implements AnalyticsProvider {
	configuration: ClickstreamConfiguration;

	constructor() {
		this.configuration = {
			appId: '',
			endpoint: '',
			sendMode: 'Immediate',
			sendEventsInterval: 5000,
			isTrackPageViewEvents: true,
			pageType: 'multiPageApp',
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
		logger.debug(
			'Initialize the SDK successfully, configuration is:\n' +
				JSON.stringify(this.configuration)
		);
		return configuration;
	}

	getCategory(): string {
		return 'Analytics';
	}

	getProviderName(): string {
		return 'ClickstreamProvider';
	}

	record(params: object): void {
		logger.debug('params: ' + JSON.stringify(params));
	}
}
