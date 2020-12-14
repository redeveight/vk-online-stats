<img align="left" alt="redeveight | Hover" src="https://github.com/redeveight/vk-online-stats/blob/master/resources/images/logo.png" />

## Description
Telegram Bot and Python script for tracking Vk activity.

<img align="right" alt="vk-online-stats Result" src="https://github.com/redeveight/vk-online-stats/blob/master/resources/images/example_result.png" />

## Required

Node.js 14.x, Python 3.x

## Installing

[Download](https://github.com/redeveight/vk-online-stats/releases/tag/release) and unzip.
<br />Install Python script dependencies:
```bash
pip install jproperties
pip install requests
pip install pytz
```

## Configure

Insert your tokens in config.properties file.
```bash
VK_ACCESS_TOKEN = YOUR_TOKEN
TELEGRAM_BOT_TOKEN = YOUR_TOKEN
```
<b>VK_ACCESS_TOKEN</b> can be obtained from the [VK Developers](https://vk.com/dev) page. After going to the developers page, you need to do the following: "My apps -> Create -> Standalone app -> Connect app". Next, in the settings of the newly created Standalone app, find and copy the <b>Service token</b>.

Also in the config you can change the bot language, server time zone, scan speed and more.

## Run

```bash
node chatbot.js
```
or only scan
```bash
py scan_script.py VK_USER_ID
```

## Options

<table role="table">
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
   </thead>
   <tbody>
    <tr>
      <td>scan>#</td>
      <td>start scanning. # - vk user ID;</td>
    </tr>
    <tr>
      <td>s</td>
      <td>get statistics for the current day;</td>
    </tr>
    <tr>
      <td>s#</td>
      <td>get statistics for a certain number of days, where # is the number of days;</td>
    </tr>
    <tr>
      <td>YYYY-MM-DD</td>
      <td>get statistics for a specific day, where YYYY is the year, MM is the month, and DD is the day.</td>
    </tr>
  </tbody>
</table>
