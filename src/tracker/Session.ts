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
import { ClickstreamContext } from '../provider';
import { StorageUtil } from '../util/StorageUtil';

export class Session {
	sessionId: string;
	startTime: number;
	sessionIndex: number;
	pauseTime: number;

	static createSession(uniqueId: string, sessionIndex: number): Session {
		return new Session(
			this.getSessionId(uniqueId),
			sessionIndex,
			new Date().getTime()
		);
	}

	constructor(
		sessionId: string,
		sessionIndex: number,
		startTime: number,
		pauseTime: number = undefined
	) {
		this.sessionId = sessionId;
		this.sessionIndex = sessionIndex;
		this.startTime = startTime;
		this.pauseTime = pauseTime;
	}

	isNewSession(): boolean {
		return this.pauseTime === undefined;
	}

	getDuration(): number {
		return new Date().getTime() - this.startTime;
	}

	pause() {
		this.pauseTime = new Date().getTime();
	}

	static getCurrentSession(context: ClickstreamContext): Session {
		const storedSession = StorageUtil.getSession();
		let sessionIndex = 1;
		if (storedSession !== null) {
			if (
				new Date().getTime() - storedSession.pauseTime <
				context.configuration.sessionTimeoutDuration
			) {
				return new Session(
					storedSession.sessionId,
					storedSession.sessionIndex,
					storedSession.startTime,
					storedSession.pauseTime
				);
			} else {
				sessionIndex = storedSession.sessionIndex + 1;
			}
		}
		return Session.createSession(context.userUniqueId, sessionIndex);
	}

	private static getSessionId(uniqueId: string): string {
		const uniqueIdKey = uniqueId.slice(-Constants.maxUniqueIdLength);
		return `${uniqueIdKey}-${this.getFormatTime()}`;
	}

	private static getFormatTime() {
		const now = new Date();
		const year = now.getUTCFullYear().toString().padStart(4, '0');
		const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
		const day = now.getUTCDate().toString().padStart(2, '0');
		const hours = now.getUTCHours().toString().padStart(2, '0');
		const minutes = now.getUTCMinutes().toString().padStart(2, '0');
		const seconds = now.getUTCSeconds().toString().padStart(2, '0');
		const milliseconds = now.getUTCMilliseconds().toString().padStart(3, '0');
		return `${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
	}
}

enum Constants {
	maxUniqueIdLength = 8,
}
