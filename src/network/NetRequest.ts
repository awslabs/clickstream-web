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
import { ClickstreamContext } from '../provider';

const logger = new Logger('NetRequest');

export class NetRequest {
	static readonly REQUEST_TIMEOUT = 3000;
	static readonly BATCH_REQUEST_TIMEOUT = 15000;
	static readonly REQUEST_RETRY_TIMES = 3;
	static readonly BATCH_REQUEST_RETRY_TIMES = 1;

	static async sendRequest(
		eventsJson: string,
		clickstream: ClickstreamContext,
		bundleSequenceId: number,
		retryTimes = NetRequest.REQUEST_RETRY_TIMES,
		timeout = NetRequest.REQUEST_TIMEOUT
	): Promise<boolean> {
		const { configuration, browserInfo } = clickstream;
		const queryParams = new URLSearchParams({
			platform: 'Web',
			appId: configuration.appId,
			event_bundle_sequence_id: bundleSequenceId.toString(),
		});
		const url = `${configuration.endpoint}?${queryParams.toString()}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, timeout);

		const requestOptions: RequestInit = {
			method: 'POST',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				cookie: configuration.authCookie,
				'User-Agent': browserInfo.userAgent,
			},
			body: eventsJson,
		};
		requestOptions.signal = controller.signal;

		let retries = 0;
		while (retries < retryTimes) {
			try {
				const response = await fetch(url, requestOptions);
				if (response.ok && response.status === 200) {
					return true;
				} else {
					logger.error(`Request failed with status code ${response.status}`);
				}
			} catch (error) {
				logger.error(`Error during request: ${error}`);
			} finally {
				clearTimeout(timeoutId);
				retries++;
			}
		}
		logger.error(`Request failed after ${retryTimes} retries`);
		return false;
	}
}
