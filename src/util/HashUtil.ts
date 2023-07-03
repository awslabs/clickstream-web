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
import { Sha256 } from '@aws-crypto/sha256-browser';

export class HashUtil {
	static async getHashCode(str: string): Promise<string> {
		const hash = new Sha256();
		hash.update(str);
		const result = await hash.digest();
		return this.uint8ArrayToHexString(result).substring(0, 8);
	}

	private static uint8ArrayToHexString(array: Uint8Array): string {
		return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(
			''
		);
	}
}
