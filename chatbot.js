﻿const Telegraf = require('telegraf')
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
var i18n = require('i18n');
const fs = require('fs');

const PropertiesReader = require('properties-reader');
const prop = PropertiesReader('config.properties');
getProperty = (pty) => { return prop.get(pty); }

i18n.configure({
    locales:['en', 'ru'],
    directory: __dirname + '/locales',
    defaultLocale: getProperty('BOT_LANGUAGE'),
    cookie: 'i18n'
});

let base_query = "SELECT is_online, is_mobile_online, scan_time FROM stats WHERE (scan_time BETWEEN 'start 00:00' AND 'end 23:59') AND user_id=";

const db_name = getProperty('DB_NAME');
const bot = new Telegraf(getProperty('TELEGRAM_BOT_TOKEN'));
const help = i18n.__("bot_help_message");

const spawn = require("child_process").spawn;
let pythonProcess = null;
let id = 0;

bot.start((ctx) => {
    //const lang = ctx.message.from.language_code;
    ctx.reply(help);
});
bot.help((ctx) => ctx.reply(help));

bot.hears(/^scan>[0-9]*$/, (ctx) => {
    id = parseInt(ctx.message.text.substring(5, ctx.message.text.length));
    if (pythonProcess != null) {
        pythonProcess.kill();
    }
    pythonProcess = spawn('python', ["scan_script.py", id]);
});

bot.hears(/^(s|S|с|С){1}[0-9]*$/, (ctx) => {
    if (id == 0) return;
    try {
        ctx
        let query = "";
        if (ctx.message.text.length == 1) {
            query = base_query.replace("start", moment().subtract(0, 'days')
                .format("YYYY-MM-DD")).replace("end", moment().subtract(0, 'days').format("YYYY-MM-DD")) + id.toString();
        } else {
            let days = parseInt(ctx.message.text.substring(1, ctx.message.text.length));
            query = base_query.replace("start", moment().subtract(days, 'days')
                .format("YYYY-MM-DD")).replace("end", moment().subtract(0, 'days').format("YYYY-MM-DD")) + id.toString();
        }
        let log = "", online_log = "", mobile_online_log = "", 
            save_pc_date = "", save_mobile_date = "", online_log_first_record = "";
        let is_online = 0, is_mobile_online = 0, first_recreated_sessions = 0;
        let minutes_online = 0.0, minutes_mobile_online = 0.0;
        let count_records = 0, count_pc_connections = 0, count_mobile_connections = 0;
        let db = new sqlite3.Database('./' + db_name, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                ctx.reply(i18n.__("db_is_not_available"));
                console.error(err.message);
            } else {
                db.all(query, [], (err, rows) => {
                    if (err) {
                      throw err;
                    }
                    rows.forEach((row) => {
                        log += (row.is_online + " " + row.is_mobile_online + " " + row.scan_time.toString().substring(0, 16) + "\n");
                     
                        if (count_records == 0 && row.is_online == 0) {
                            let mmt = moment(row.scan_time.toString().replace(/-/g,'/'));
                            let mmtMidnight = mmt.clone().startOf('day');
                            let minutes = parseInt(mmt.diff(mmtMidnight, 'minutes'));

                            first_recreated_sessions = 1;

                            minutes_online += minutes;
                            
                            online_log += ("* " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                                + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");
                        }

                        if (row.is_online != is_online) {
                            switch (row.is_online) {
                                case 1: {
                                    save_pc_date = row.scan_time.toString();
                                    online_log += ("- " + i18n.__("logged") + " " + save_pc_date.substring(0, 16) + "\n");
                                    break;
                                }
                                case 0: {
                                    let minutes = (Math.abs(new Date(save_pc_date.replace(/-/g,'/')) 
                                        - new Date(row.scan_time.toString().replace(/-/g,'/'))) / 60000);
                                    
                                    minutes_online += minutes;

                                    online_log += ("- " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                                    + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");

                                    count_pc_connections++;
                                    break;
                                }
                            }
                            is_online = row.is_online;
                        }

                        if (row.is_mobile_online != is_mobile_online) {
                            switch (row.is_mobile_online) {
                                case 1: {
                                    save_mobile_date = row.scan_time.toString();
                                    mobile_online_log += ("- " + i18n.__("logged") + " " + save_mobile_date.substring(0, 16) + "\n");
                                    break;
                                }
                                case 0: {
                                    let minutes = (Math.abs(new Date(save_mobile_date.replace(/-/g,'/')) 
                                        - new Date(row.scan_time.toString().replace(/-/g,'/'))) / 60000);
                                    
                                    minutes_mobile_online += minutes;

                                    mobile_online_log += ("- " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                                    + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");

                                    count_mobile_connections++;
                                    break;
                                }
                            }
                            is_mobile_online = row.is_mobile_online;
                        }

                        count_records++;
                    });
                    if (log == "") {
                        ctx.reply(i18n.__("no_records_found"));
                    } else {
                        if (is_mobile_online == 1) {
                            online_log += "  ...\n";
                            mobile_online_log += "  ...\n";
                        } else if (is_online == 1) {
                            online_log += "  ...\n";
                        }

                        let result = "";
                        if (mobile_online_log != "") {
                            result = (
                                i18n.__("number_of_sessions") + ": " + (count_pc_connections + first_recreated_sessions) + " (" + count_pc_connections + ")"
                                + "\n" + i18n.__("total_time_online") + ": " + (minutes_online).toFixed(0)
                                + " (" + ((minutes_online) / 60).toFixed(2) + ")"
                                + "\n" + i18n.__("number_of_log_records") + ": " + count_records
                                + "\n\n" + i18n.__("all_sessions") + "\n" 
                                + online_log 
                                + "\n" + i18n.__("mobile_sessions") + "\n" 
                                + mobile_online_log
                                + "\n" + i18n.__("number_of_mobile_sessions") + ": " + count_mobile_connections
                                + "\n" + i18n.__("duration_of_mobile_sessions") + ": " + minutes_mobile_online.toFixed(0)
                                + " (" + (minutes_mobile_online / 60).toFixed(2) + ")"
                                + " [" + ((minutes_mobile_online / (minutes_online)) * 100).toFixed(0) + "%]"
                                + "\n\nЛог\n" + log
                            );
                        } else {
                            result = (
                                i18n.__("number_of_sessions") + ": " + (count_pc_connections + first_recreated_sessions) + " (" + count_pc_connections + ")"
                                + "\n" + i18n.__("total_time_online") + ": " + (minutes_online).toFixed(0)
                                + "\n" + i18n.__("number_of_log_records") + ": " + count_records
                                + "\n\n" + i18n.__("pc_session") + "\n" 
                                + online_log
                                + "\n" + i18n.__("log") + "\n" + log
                            );
                        }
                        filename = 'result ' + new Date().getTime() + '.txt';
                        fs.writeFile(filename, result, 'utf8', function (err) {
                            if (err) return console.log(err);
                        });
			setTimeout(function () {
			ctx.telegram.sendDocument(ctx.from.id, {
                            source: "./" + filename,
                            filename: 'result.txt'
                        }).catch(function(error){ console.log(error); });
			}, 2000);
                    }
                    db.close();
                });
            }
        });
    } catch (error) {
        console.error(error.message);
    }
});

bot.hears(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, (ctx) => {
    if (id == 0) return;
    let message = String(ctx.message.text);
    let query = base_query.replace("start", message).replace("end", message) + id.toString();

    let log = "", online_log = "", mobile_online_log = "", save_date = "";
    let is_online = 0, is_mobile_online = 0, first_recreated_sessions = 0, last_recreated_sessions = 0;
    let minutes_online = 0.0, minutes_mobile_online = 0.0;
    let count_records = 0, count_pc_connections = 0, count_mobile_connections = 0;
    let db = new sqlite3.Database('./' + db_name, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            ctx.reply(i18n.__("db_is_not_available"));
            console.error(err.message);
        } else {
            db.all(query, [], (err, rows) => {
                if (err) {
                  throw err;
                }
                rows.forEach((row) => {
                    log += (row.is_online + " " + row.is_mobile_online + " " + row.scan_time.toString().substring(0, 16) + "\n");
                 
                    if (count_records == 0 && row.is_online == 0) {
                        let mmt = moment(row.scan_time.toString().replace(/-/g,'/'));
                        let mmtMidnight = mmt.clone().startOf('day');
                        let minutes = parseInt(mmt.diff(mmtMidnight, 'minutes'));
                        
                        first_recreated_sessions = 1;

                        minutes_online += minutes;

                        online_log += ("* " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                            + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");
                    }

                    if (row.is_online != is_online) {
                        switch (row.is_online) {
                            case 1: {
                                save_pc_date = row.scan_time.toString();
                                online_log += ("- " + i18n.__("logged") + " " + save_pc_date.substring(0, 16) + "\n");
                                break;
                            }
                            case 0: {
                                let minutes = (Math.abs(new Date(save_pc_date.replace(/-/g,'/')) 
                                    - new Date(row.scan_time.toString().replace(/-/g,'/'))) / 60000);
                                
                                minutes_online += minutes;

                                online_log += ("- " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                                + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");

                                count_pc_connections++;
                                break;
                            }
                        }
                        is_online = row.is_online;
                    }

                    if (row.is_mobile_online != is_mobile_online) {
                        switch (row.is_mobile_online) {
                            case 1: {
                                save_mobile_date = row.scan_time.toString();
                                mobile_online_log += ("- " + i18n.__("logged") + " " + save_mobile_date.substring(0, 16) + "\n");
                                break;
                            }
                            case 0: {
                                let minutes = (Math.abs(new Date(save_mobile_date.replace(/-/g,'/')) 
                                    - new Date(row.scan_time.toString().replace(/-/g,'/'))) / 60000);
                                
                                minutes_mobile_online += minutes;

                                mobile_online_log += ("- " + i18n.__("logged_out") + " " + row.scan_time.substring(0, 16) + "\n" 
                                + i18n.__("minutes_online") + ": " + minutes.toFixed(0) + " (" + (minutes / 60).toFixed(1) + ")\n");

                                count_mobile_connections++;
                                break;
                            }
                        }
                        is_mobile_online = row.is_mobile_online;
                    }

                    count_records++;
                });
                if (log == "") {
                    ctx.reply(i18n.__("no_records_found"));
                } else {
                    let mmt = moment(new Date(save_pc_date.replace(/-/g,'/')));
                    let mmtMidnight = mmt.clone().endOf('day');
                    let minutes = Math.abs(parseInt(mmt.diff(mmtMidnight, 'minutes')));
                    if (is_mobile_online == 1) {
                        minutes_online += minutes;
                        last_recreated_sessions = 1;
                        mobile_online_log += ("* " + i18n.__("logged_out") + " " + moment(new Date(save_mobile_date.substring(0, 16))).endOf('day').format('YYYY-MM-DD HH:mm').toString() + "\n" 
                            + i18n.__("minutes_online") + ": " + minutes.toFixed(1) + " (" + (minutes / 60).toFixed(1) + ")\n");

                        online_log += ("* " + i18n.__("logged_out") + " " + moment(new Date(save_mobile_date.substring(0, 16))).endOf('day').format('YYYY-MM-DD HH:mm').toString() + "\n" 
                            + i18n.__("minutes_online") + ": " + minutes.toFixed(1) + " (" + (minutes / 60).toFixed(1) + ")\n");
                    } else if (is_online == 1) {
                        online_log += ("* " + i18n.__("logged_out") + " " + moment(new Date(save_mobile_date.substring(0, 16))).endOf('day').format('YYYY-MM-DD HH:mm').toString() + "\n" 
                            + i18n.__("minutes_online") + ": " + minutes.toFixed(1) + " (" + (minutes / 60).toFixed(1) + ")\n");
                            minutes_online += minutes;
                            last_recreated_sessions = 1;
                    }

                    let result = "";
                    if (mobile_online_log != "") {
                        _count_mobile_connections = count_mobile_connections;
                        if (last_recreated_sessions == 1) {
                            _count_mobile_connections++;
                        }
                        result = (
                            i18n.__("number_of_sessions") + ": " + (count_pc_connections + first_recreated_sessions + last_recreated_sessions) + " (" + count_pc_connections + ")"
                            + "\n" + i18n.__("total_time_online") + ": " + (minutes_online).toFixed(0)
                            + " (" + ((minutes_online) / 60).toFixed(2) + ")"
                            + "\n" + i18n.__("number_of_log_records") + ": " + count_records
                            + "\n\n" + i18n.__("all_sessions") + "\n" 
                            + online_log 
                            + "\n" + i18n.__("mobile_sessions") + "\n" 
                            + mobile_online_log
                            + "\n" + i18n.__("number_of_mobile_sessions") + ": " + (count_mobile_connections + last_recreated_sessions) + " (" + count_mobile_connections + ")"
                            + "\n" + i18n.__("duration_of_mobile_sessions") + ": " + minutes_mobile_online.toFixed(0)
                            + " (" + (minutes_mobile_online / 60).toFixed(2) + ")"
                            + " [" + ((minutes_mobile_online / (minutes_online)) * 100).toFixed(0) + "%]"
                            + "\n\nЛог\n" + log
                        );
                    } else {
                        result = (
                            i18n.__("number_of_sessions") + ": " + (count_pc_connections + first_recreated_sessions) + " (" + count_pc_connections + ")"
                            + "\n" + i18n.__("total_time_online") + ": " + (minutes_online).toFixed(0)
                            + "\n" + i18n.__("number_of_log_records") + ": " + count_records
                            + "\n\n" + i18n.__("pc_session") + "\n" 
                            + online_log
                            + "\n" + i18n.__("log") + "\n" + log
                        );
                    }
                    filename = 'result ' + new Date().getTime() + '.txt';
                    fs.writeFile(filename, result, 'utf8', function (err) {
                        if (err) return console.log(err);
                    });
			setTimeout(function () {
			ctx.telegram.sendDocument(ctx.from.id, {
                            source: "./" + filename,
                            filename: 'result.txt'
                        }).catch(function(error){ console.log(error); });
			}, 2000);
                }
                db.close();
            });
        }
    });
});

bot.command('get', (ctx) => {
    return ctx.telegram.sendDocument(ctx.from.id, {
        source: "./" + db_name,
        filename: db_name
     }).catch(function(error){ console.log(error); });
});

bot.launch();