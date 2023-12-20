# AWS Solution Clickstream Analytics SDK for Web

## Introduction

Clickstream Web SDK can help you easily collect and report events from browser to AWS. This SDK is part of an AWS solution - [Clickstream Analytics on AWS](https://github.com/awslabs/clickstream-analytics-on-aws), which provisions data pipeline to ingest and process event data into AWS services such as S3, Redshift.

The SDK relies on the Amplify for JS SDK Core Library and is developed according to the Amplify AnalyticsProvider interface. In addition, we've added features that automatically collect common user events and attributes (e.g., page view, first open) to simplify data collection for users.

Visit our [Documentation site](https://awslabs.github.io/clickstream-analytics-on-aws/en/latest/sdk-manual/web/) to learn more about Clickstream Web SDK.

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

// record event with attributes
ClickstreamAnalytics.record({
  name: 'button_click',
  attributes: {
    event_category: 'shoes',
    currency: 'CNY',
    value: 279.9,
  }
});

//record event with name
ClickstreamAnalytics.record({ name: 'button_click' });
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

When opening for the first time after integrating the SDK, you need to manually set the user attributes once, and current login user's attributes will be cached in localStorage, so the next time browser open you don't need to set all user's attribute again, of course you can use the same api `ClickstreamAnalytics.setUserAttributes()` to update the current user's attribute when it changes.

#### Add global attribute
1. Add global attributes when initializing the SDK

   ```typescript
   ClickstreamAnalytics.init({
      appId: "your appId",
      endpoint: "https://example.com/collect",
      globalAttributes:{
        _traffic_source_medium: "Search engine",
        _traffic_source_name: "Summer promotion",
      }
   });
   ```

2. Add global attributes after initializing the SDK

   ``` typescript
   ClickstreamAnalytics.setGlobalAttributes({
     _traffic_source_medium: "Search engine",
     level: 10,
   });
   ```

It is recommended to set global attributes when initializing the SDK, global attributes will be included in all events that occur after it is set, you also can remove a global attribute by setting its value to `null`.

#### Record event with items

You can add the following code to log an event with an item.

**Note: Only pipelines from version 1.1+ can handle items with custom attribute.**

```typescript
import { ClickstreamAnalytics, Item } from '@aws/clickstream-web';

const itemBook: Item = {
  id: '123',
  name: 'Nature',
  category: 'book',
  price: 99,
  book_publisher: "Nature Research",
};
ClickstreamAnalytics.record({
  name: 'view_item',
  attributes: {
    currency: 'USD',
    event_category: 'recommended',
  },
  items: [itemBook],
});
```

#### Send event immediate in batch mode

When you are in batch mode, you can still send an event immediately by setting the `isImmediate` attribute, as in the following code:

```typescript
import { ClickstreamAnalytics } from '@aws/clickstream-web';

ClickstreamAnalytics.record({
  name: 'button_click',
  isImmediate: true,
});
```

#### Other configurations
In addition to the required `appId` and `endpoint`, you can configure other information to get more customized usage:

```typescript
import { ClickstreamAnalytics, EventMode, PageType } from '@aws/clickstream-web';

ClickstreamAnalytics.init({
   appId: "your appId",
   endpoint: "https://example.com/collect",
   sendMode: EventMode.Batch,
   sendEventsInterval: 5000,
   isTrackPageViewEvents: true,
   isTrackUserEngagementEvents: true,
   isTrackClickEvents: true,
   isTrackSearchEvents: true,
   isTrackScrollEvents: true,
   isTrackPageLoadEvents: true,
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
- **sendEventsInterval**: event sending interval millisecond, works only bath send mode, the default value is `5000`
- **isTrackPageViewEvents**: whether auto record page view events in browser, default is `true`
- **isTrackUserEngagementEvents**: whether auto record user engagement events in browser, default is `true`
- **isTrackClickEvents**: whether auto record link click events in browser, default is `true`
- **isTrackSearchEvents**: whether auto record search result page events in browser, default is `true`
- **isTrackScrollEvents**: whether auto record page scroll events in browser, default is `true`
- **isTrackPageLoadEvents**: whether auto record page load performance events in browser, default is `false`
- **pageType**: the website type, `SPA` for single page application, `multiPageApp` for multiple page application, default is `SPA`. This attribute works only when the attribute `isTrackPageViewEvents`'s value is `true`
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
  isTrackPageLoadEvents: false,
});
```

## How to integrate and test locally

### Integrate the `.tgz` file

Clone this repository locally and execute the following script to generate `aws-clickstream-web-0.7.0.tgz` zip package, which will be located in the project root folder.
```bash
cd clickstream-web && npm i && npm run pack
```

Copy the `aws-clickstream-web-0.7.0.tgz` into your project, then execute the script in your project root folder to install the SDK.
```bash
npm install ./aws-clickstream-web-0.7.0.tgz
```
**Note**: Please correct the SDK version and change the path to where the `aws-clickstream-web-0.7.0.tgz` file is located.

### Integrate the `clickstream-web.min.js` file
Execute the following script to generate `clickstream-web.min.js`, located in the `/dist` folder.
```bash
cd clickstream-web && npm i && npm run pack
```
Copy the `clickstream-web.min.js` into your project and add the following initial code into your `index.html`.

```html
<script src="clickstream-web.min.js"></script>
<script>
    window.ClickstreamAnalytics.init({
        appId: 'your appId',
        endpoint: 'https://example.com/collect',
        isLogEvents: true,
        pageType: window.PageType.SPA, //multiPageApp
        sendMode: window.SendMode.Batch, //Immediate
    })
</script>
```
You can also find the `clickstream-web.min.js` file in the [Release](https://github.com/awslabs/clickstream-web/releases) page.

### Test

```bash
npm run test
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the [Apache 2.0 License](./LICENSE).
