# AWS Solution Clickstream Analytics SDK for Web

## Introduction

Clickstream Web SDK can help you easily collect and report events from browser to AWS. This SDK is part of an AWS solution - [Clickstream Analytics on AWS](https://github.com/awslabs/clickstream-analytics-on-aws), which provisions data pipeline to ingest and process event data into AWS services such as S3, Redshift.

The SDK relies on the Amplify for JS SDK Core Library and is developed according to the Amplify AnalyticsProvider interface. In addition, we've added features that automatically collect common user events and attributes (e.g., page view, first open) to simplify data collection for users.

## Integrate SDK

**1.Include SDK**

For NPM repository:

```bash
npm install @awslabs/clickstream-web
```

For GitHub repository:

```bash
npm install github:awslabs/clickstream-web
```

Note: for beta version we use GitHub repository to distribute our SDK.

**2.Initialize the SDK**
You need to configure the SDK with default information before using it. Copy your configuration code from your clickstream solution control plane, the configuration code will as follows:

```typescript
import { ClickstreamAnalytics, EventMode, PageType } from 'clickstream-web';

ClickstreamAnalytics.configure({
   appId: "your appId",
   endpoint: "https://example.com/collect",
   sendMode: EventMode.Batch,
   sendEventsInterval: 5000,
   isTrackPageViewEvents: true,
   pageType: PageType.SPA,
   isLogEvents: false,
   authCookie: "your auth cookie",
   sessionTimeoutDuration: 1800000
)}
```

Your `appId` and `endpoint` are already set up in it, here's an explanation of each property:

- **appId (Required)**: the app id of your project in control plane. 
- **endpoint (Required)**: the endpoint path you will upload the event to AWS server.
- **sendMode**: EventMode.Immediate, EventMode.Batch, default is Immediate mode.
- **sendEventsInterval**: event sending interval millisecond, works only bath send mode, the default value is `5000`
- **isTrackPageViewEvents**: whether auto page view events in browser, default is `true`
- **pageType**: the website type, `SPA` for single page application, `multiPageApp` for multipule page application, default is `SPA`. This attribute works only when the attribute `isTrackPageViewEvents`'s value ' is `true`.
- **isLogEvents**: whether log events json, default is false.
- **authCookie**: your auth cookie for AWS application load balancer auth cookie.
- **sessionTimeoutDuration**: the duration for session timeout millisecond, default is 1800000

### Start using

#### Record event.

Add the following code where you need to record event.

```typescript
import { ClickstreamAnalytics } from 'clickstream-web';

ClickstreamAnalytics.record({ name: 'albumVisit' });
ClickstreamAnalytics.record({
  name: 'buttonClick',
  attributes: { _channel: 'SMS', Successful: true }
});
```

#### Login and logout

```typescript
import { ClickstreamAnalytics } from 'clickstream-web';

// when user login success.
ClickstreamAnalytics.setUserId("UserId");

// when user logout
ClickstreamAnalytics.setUserId(null);
```

#### Add user attribute

```typescript
ClickstreamAnalytics.setUserAttribute({
  userName:"carl",
  userAge: 22
});
```

Current login user‘s attributes will be cached in localStorage, so the next time browser open you don't need to set all user's attribute again, of course you can update the current user's attribute when it changes.

## How to build&test locally

**Build**

Open your terminal window, at the root project folder to execute: 

```bash
npm run build
```

**Test**

```bash
npm run test
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the [Apache 2.0 License](./LICENSE).
