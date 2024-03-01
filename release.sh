#!/bin/bash

version="$1"
echo ${version}
regex="[0-9]\+\.[0-9]\+\.[0-9]\+"

sed -i "s/\"version\": \"${regex}\"/\"version\": \"${version}\"/g" package.json
sed -i "s/aws-clickstream-web-${regex}.tgz/aws-clickstream-web-${version}.tgz/g" README.md
sed -i "s#v${regex}/clickstream-web.min.js#v${version}/clickstream-web.min.js#g" gtm-template/ClickstreamAnalytics-gtm-tempalte.tpl
