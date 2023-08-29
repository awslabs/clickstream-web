# AWS Solution Clickstream Analytics SDK for Web

## Introduction

Clickstream Web SDK can help you easily collect and report events from browser to AWS. This SDK is part of an AWS solution - [Clickstream Analytics on AWS](https://github.com/awslabs/clickstream-analytics-on-aws), which provisions data pipeline to ingest and process event data into AWS services such as S3, Redshift.

The SDK relies on the Amplify for JS SDK Core Library and is developed according to the Amplify AnalyticsProvider interface. In addition, we've added features that automatically collect common user events and attributes (e.g., page view, first open) to simplify data collection for users.

## Integrate SDK

### Include SDK

```bash
npm install @aws/clickstream-web
```

### Initialize the SDK
Copy your configuration code from your clickstream solution web console, we recommended you add the code to your app's root entry point, for example `index.js/app.tsx` in React or `main.ts` in Vue/Angular, the configuration code should look like as follows. You can also manually add this code snippet and replace the values of appId and endpoint after you registered app to a data pipeline in the Clickstream Analytics solution console.

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

ClickstreamAnalytics.init({
   appId: "your appId",
   endpoint: "https://example.com/collect",
});
```

Your `appId` and `endpoint` are already set up in it.

### Start using

#### Record event

Add the following code where you need to record event.

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

ClickstreamAnalytics.record({ name: 'albumVisit' });
ClickstreamAnalytics.record({
  name: 'buttonClick',
  attributes: { _channel: 'SMS', Successful: true }
});
```

#### Login and logout

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

// when user login success.
ClickstreamAnalytics.setUserId("UserId");

// when user logout
ClickstreamAnalytics.setUserId(null);
```

#### Add user attribute

```typescript
ClickstreamAnalytics.setUserAttributes({
  userName:"carl",
  userAge: 22
});
```

Current login user's attributes will be cached in localStorage, so the next time browser open you don't need to set all user's attribute again, of course you can use the same api `ClickstreamAnalytics.setUserAttributes()` to update the current user's attribute when it changes.

#### Record event with items

You can add the following code to log an event with an item.

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

const item_product = {
  id: '1',
  name: 'Nature',
  category: 'book',
  price: 56.5,
};
ClickstreamAnalytics.record({
  name: 'buttonClick',
  attributes: { _channel: 'SMS', Successful: true },
  items: [item_product],
});
```

#### Send event immediate in batch mode

When you are in batch mode, you can still send an event immediately by setting the `isImmediate` attribute, as in the following code:

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

ClickstreamAnalytics.record({
  name: 'immediateEvent',
  attributes: { url: 'https://example.com' },
  isImmediate: true,
});
```

#### Other configurations
In addition to the required `appId` and `endpoint`, you can configure other information to get more customized usage:

```typescript
import { ClickstreamAnalytics, EventMode, PageType } from '@aws/clickstream-web';

ClickstreamAnalytics.configure({
   appId: "your appId",
   endpoint: "https://example.com/collect",
   sendMode: EventMode.Batch,
   sendEventsInterval: 5000,
   isTrackPageViewEvents: true,
   isTrackUserEngagementEvents: true,
   isTrackClickEvents: true,
   isTrackSearchEvents: true,
   isTrackScrollEvents: true,
   pageType: PageType.SPA,
   isLogEvents: false,
   authCookie: "your auth cookie",
   sessionTimeoutDuration: 1800000,
   searchKeyWords: ['product', 'class'],
   domainList: ['example1.com', 'example2.com'],
});
```

Here is an explanation of each property:

- **appId (Required)**: the app id of your project in control plane.
- **endpoint (Required)**: the endpoint path you will upload the event to AWS server.
- **sendMode**: EventMode.Immediate, EventMode.Batch, default is Immediate mode.
- **sendEventsInterval**: event sending interval millisecond, works only bath send mode, the default value is `5000`
- **isTrackPageViewEvents**: whether auto record page view events in browser, default is `true`
- **isTrackUserEngagementEvents**: whether auto record user engagement events in browser, default is `true`
- **isTrackClickEvents**: whether auto record link click events in browser, default is `true`
- **isTrackSearchEvents**: whether auto record search result page events in browser, default is `true`
- **isTrackScrollEvents**: whether auto record page scroll events in browser, default is `true`
- **pageType**: the website type, `SPA` for single page application, `multiPageApp` for multiple page application, default is `SPA`. This attribute works only when the attribute `isTrackPageViewEvents`'s value is `true`.
- **isLogEvents**: whether to print out event json for debugging, default is false.
- **authCookie**: your auth cookie for AWS application load balancer auth cookie.
- **sessionTimeoutDuration**: the duration for session timeout millisecond, default is 1800000
- **searchKeyWords**: the customized Keywords for trigger the `_search` event, by default we detect `q`, `s`, `search`, `query` and `keyword` in query parameters.
- **domainList**: if your website cross multiple domain, you can customize the domain list. The `_outbound` attribute of the `_click` event will be true when a link leads to a website that's not a part of your configured domain.  

#### Configuration update
You can update the default configuration after initializing the SDK, below are the additional configuration options you can customize.

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

ClickstreamAnalytics.updateConfigure({
  isLogEvents: true,
  authCookie: 'your auth cookie',
  isTrackPageViewEvents: false,
  isTrackUserEngagementEvents: false,
  isTrackClickEvents: false,
  isTrackScrollEvents: false,
  isTrackSearchEvents: false,
});
```

## How to integrate and test locally

**Integrate**

Clone this repository locally, execute the following script to generate `aws-clickstream-web-x.x.x.tgz` zip package, which will be located in the project root folder.
```bash
cd clickstream-web && npm run pack
```

Copy the `aws-clickstream-web-x.x.x.tgz` into your project, then execute the following script in your project root folder to install the SDK.
```bash
npm install ./aws-clickstream-web-x.x.x.tgz
```
Note: Please correct the SDK version and change the path to where the `aws-clickstream-web-x.x.x.tgz` file is located.

**Test**

```bash
npm run test
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the [Apache 2.0 License](./LICENSE).
