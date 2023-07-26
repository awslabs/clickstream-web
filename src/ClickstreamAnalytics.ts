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
import { ClickstreamProvider } from './provider';
import {
	ClickstreamAttribute,
	ClickstreamConfiguration,
	ClickstreamEvent,
	Configuration,
} from './types';

export class ClickstreamAnalytics {
	private static provider: ClickstreamProvider;
	private static logger = new Logger('ClickstreamAnalytics');

	/**
	 * the init method for clickstream SDK
	 * @param configure
	 * @return the SDK initialize boolean result
	 */
	public static init(configure: ClickstreamConfiguration): boolean {
		if (this.provider !== undefined) {
			this.logger.warn('Clickstream SDK has initialized');
			return false;
		}
		this.provider = new ClickstreamProvider();
		this.provider.configure(configure);
		return true;
	}

	public static record(event: ClickstreamEvent) {
		this.provider.record(event);
	}

	public static setUserId(userId: string | null) {
		this.provider.setUserId(userId);
	}

	public static setUserAttributes(attributes: ClickstreamAttribute) {
		this.provider.setUserAttributes(attributes);
	}

	public static updateConfigure(configure: Configuration) {
		this.provider.updateConfigure(configure);
	}
}
