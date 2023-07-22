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

export class MethodEmbed {
	public context;
	public methodName;
	private readonly originalMethod;

	static add(context: any, methodName: string, methodOverride: any) {
		new MethodEmbed(context, methodName).set(methodOverride);
	}

	constructor(context: any, methodName: string) {
		this.context = context;
		this.methodName = methodName;

		this.originalMethod = context[methodName].bind(context);
	}

	public set(methodOverride: any) {
		this.context[this.methodName] = (...args: any) => {
			return methodOverride(this.originalMethod(...args));
		};
	}
}
