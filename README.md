<img align="left" alt="redeveight | Hover" src="https://github.com/redeveight/vk-online-stats/blob/master/resources/images/logo.png" />

## Description
Telegram Bot and Python script for tracking Vk activity.

<img align="right" alt="vk-online-stats Result" src="https://github.com/redeveight/vk-online-stats/blob/master/resources/images/example_result.png" />

## Required

Node.js 14.x, Python 3.x

## Configure

Insert your tokens in config.properties file.
```bash
VK_ACCESS_TOKEN = YOUR_TOKEN
TELEGRAM_BOT_TOKEN = YOUR_TOKEN
```
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
      <td>statistics for the current day;</td>
    </tr>
    <tr>
      <td>s#</td>
      <td>statistics for a certain number of days, where # is the number of days;</td>
    </tr>
    <tr>
      <td>YYYY-MM-DD</td>
      <td>statistics for a specific day, where YYYY is the year, MM is the month, and DD is the day.</td>
    </tr>
  </tbody>
</table>
