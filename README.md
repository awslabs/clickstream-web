# AWS Solution Clickstream Analytics SDK for Web

## Introduction

Clickstream Web SDK can help you easily collect and report events from browser to AWS. This SDK is part of an AWS solution - Clickstream Analytics on AWS, which provisions data pipeline to ingest and process event data into AWS services such as S3, Redshift.

The SDK relies on the Amplify for JS SDK Core Library and is developed according to the Amplify AnalyticsProvider interface. In addition, we've added features that automatically collect common user events and attributes (e.g., page view, first open) to simplify data collection for users.

## Integrate SDK

**1.Include SDK**
```bash
npm install @awslabs/clickstream-web
```

**2.Initialize the SDK**
You need to configure the SDK with default information before using it. Copy your configuration code from your clickstream solution control plane, the config code will as follows:

```typescript
import { ClickstreamAnalytics } from '@awslabs/clickstream-web';

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

- **appId**: the app id of your project in control plane.
- **endpoint**: the endpoint path you will upload the event to AWS server.
- **sendMode**: EventMode.Immediate, EventMode.Batch, EventMode.Beacon, default is Immediate mode.
- **sendEventsInterval**: event sending interval millisecond, works only bath send mode, the default value is `5000`
- **isTrackPageViewEvents**: whether auto page view events in browser, default is `true`
- **pageType**: the website type, `SPA` for single page application, `multiPageApp` for multipule page application, default is multiPageApp. This attribute works only when the attribute `isTrackPageViewEvents`'s value ' is `true`.
- **isLogEvents**: whether log event in debug mode, default is false.
- **authCookie**: your auth cookie for AWS application load balancer auth cookie.
- **sessionTimeoutDuration**: the duration for session timeout millisecond, default is 1800000

You can refer this [guide]("https://awslabs.github.io/clickstream-analytics-on-aws/en/sdk-manual/web.html") to explore more usages.


### Start using
#### Record event.

Add the following code where you need to report event.

```typescript
import { ClickstreamAnalytics } from 'clickstream-web';

ClickstreamAnalytics.record({ name: 'albumVisit' });
ClickstreamAnalytics.record({
  name: 'buttonClick',
  attributes: { _channel: 'SMS', Successful: true }
});
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the [Apache 2.0 License](./LICENSE).
