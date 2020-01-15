
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr1-igor?include_prereleases&sort=semver) [![Snyk](https://snyk.io/test/github/newrelic/nr1-igor/badge.svg)](https://snyk.io/test/github/newrelic/nr1-igor)

## Usage

IGOR (Infra Geo-Ops Reporter) overlays Infrastructure data over a map view within New Relic One.

![IGOR Map Screenshot](screenshots/igor-screenshot-map.png)

![IGOR Detail Screenshot](screenshots/igor-screenshot-detail.png)

IGOR plots the highest CPU, memory and disk usage for hosts at various locations on a map, offering a true 30,000 foot (or roundabout) view. It allows you to drill down into hosts at a location. Its near-realtime nature allows it to be used in a NOC setting.

IGOR only requires that your hosts are running New Relic Infrastructure agent on them. Configuration happens directly within the app, where you specify the list of locations, and the hosts at each location.

## Open source license

This project is distributed under the [Apache 2 license](LICENSE).

## What do you need to make this work?

Required:

- Host(s) running [New Relic Infrastructure agent](https://docs.newrelic.com/docs/infrastructure/new-relic-infrastructure/get-started/introduction-new-relic-infrastructure).

## Getting started

1. First, ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following command(s) (If you have them installed these commands will return a version number, if not, the commands won't be recognized):
```bash
git --version
npm -v
```
2. Next, install the [New Relic One CLI](https://one.newrelic.com/launcher/developer-center.launcher) by going to [this link](https://one.newrelic.com/launcher/developer-center.launcher) and following the instructions (5 minutes or less) to install and set up your New Relic development environment.
3. Next, to clone this repository and run the code locally against your New Relic data, execute the following command:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr1-igor.git
cd nr1-igor
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local), navigate to the Nerdpack, and :sparkles:

## Deploying this Nerdpack

Open a command prompt in the nerdpack's directory and run the following commands.

```bash
# If you need to create a new uuid for the account to which you're deploying this Nerdpack, use the following
# nr1 nerdpack:uuid -g [--profile=your_profile_name]
# to see a list of APIkeys / profiles available in your development environment, run nr1 credentials:list
nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), navigate to the Nerdpack, and :sparkles:

## How to configure and use IGOR

IGOR opens with a splash screen, featuring a dropdown with a list of accounts that you can switch between, and a button to open the admin panel.

![IGOR Map Screenshot](screenshots/igor-screenshot-splash.png)

To setup IGOR, click the button with the gear icon to open up the admin panel.

![IGOR Admin Panel Screenshot](screenshots/igor-screenshot-mapbox-token.png)

IGOR uses Mapbox to display the map. In order to do so, IGOR requires a Mapbox Access Token. Click link for more on Mapbox Access Tokens.

https://docs.mapbox.com/help/glossary/access-token/

Once an access token has been saved, the default map view can be modified.

![IGOR Map Defaults Screenshot](screenshots/igor-screenshot-map-defaults.png)

Jump to the `Add/Edit Locations` tab to add locations on the map.

![IGOR Add Locations Screenshot](screenshots/igor-screenshot-add-locations.png)

List the locations, one location per line, with the name, latitude and longitude specified as comma-separated values for each location. Here's a sample list of locations:

```
San Francisco,37.7913249,-122.3951599
Atlanta,33.7869491,-84.3849318
Portland,45.5221871,-122.6784799
Phoenix,33.4485711,-112.0743242
```

Once locations have been added, switch to the `Hosts at Locations` tab.

![IGOR Add Hosts Screenshot](screenshots/igor-screenshot-add-hosts.png)

Click on a location from the list, which brings up a lists of hosts reporting into New Relic Infrastructure. Check all hosts for each location.

![IGOR Select Hosts Screenshot](screenshots/igor-screenshot-select-hosts.png)

One you have setup all locations, close the admin panel to view your map. :tada:

# Support

New Relic has open-sourced this project. This project is provided **AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT**. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Community

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related community topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

https://discuss.newrelic.com/t/nr1-igor-infrastructure-map-nerdpack/91886

## Issues and enhancement requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

# Contributing

Contributions are welcome (and if you submit an enhancement request, expect to be invited to contribute it yourself :grin:). Please review our [contributors guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource+nr1-igor@newrelic.com.
