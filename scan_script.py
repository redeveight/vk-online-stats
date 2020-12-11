from jproperties import Properties
from sqlite3 import Error
import datetime
import requests
import sqlite3
import pytz
import time
import json
import sys
import os

configs = Properties()
properties_path = os.getcwd() + "\\" + "config.properties"
with open(properties_path, 'rb') as config_file:
    configs.load(config_file)

vk_token = configs.get("VK_ACCESS_TOKEN").data
vk_api_version = configs.get("VK_API_VERSION").data
db_name = configs.get("DB_NAME").data

try:
    user_id = int(sys.argv[1])
except:
    user_id = configs.get("VK_USER_ID").data

request = "https://api.vk.com/method/users.get?access_token=" + vk_token + "&v=" \
          + vk_api_version + "&fields=online&user_ids=" + str(user_id)
database_path = os.getcwd() + "\\" + db_name
sql_create_stats_table = """ CREATE TABLE IF NOT EXISTS stats (
                                        id integer PRIMARY KEY,
                                        user_id integer NOT NULL,
                                        is_online integer,
                                        is_mobile_online integer,
                                        scan_time DATETIME DEFAULT CURRENT_TIMESTAMP
                                    ); """


def update_data():
    response = requests.get(request)
    json_data = json.loads(response.text)
    return json_data


def create_connection(path):
    connection = None
    try:
        connection = sqlite3.connect(path)
        return connection
    except Error as e:
        print(e)
    return connection


def create_table(connection, create_table_sql):
    try:
        cursor = connection.cursor()
        cursor.execute(create_table_sql)
    except Error as e:
        print(e)


def create_record(connection, record):
    sql = ''' INSERT INTO stats(id, user_id, is_online, is_mobile_online, scan_time) VALUES(NULL, ?, ?, ?, ?) '''
    cursor = connection.cursor()
    cursor.execute(sql, record)
    return cursor.lastrowid


def main():
    is_online = 0
    is_mobile_online = 0
    connection = create_connection(database_path)
    if connection is not None:
        create_table(connection, sql_create_stats_table)
        while True:
            json_data = update_data()
            current_online_status = json_data["response"][0]["online"]
            current_mobile_online_status = 1
            try:
                json_data["response"][0]["online_mobile"]
            except:
                current_mobile_online_status = 0
            if (current_online_status != is_online) or (is_mobile_online != current_mobile_online_status):
                is_online = current_online_status
                is_mobile_online = current_mobile_online_status

                d = datetime.datetime.now()
                timezone = pytz.timezone(configs.get("TIME_ZONE").data)
                date_time = timezone.localize(d)

                # print(date_time)
                # print("is_online: " + str(is_online))  # PC
                # print("is_mobile_online: " + str(is_mobile_online))

                record = (user_id, is_online, is_mobile_online, date_time)
                with connection:
                    create_record(connection, record)
            time.sleep(int(configs.get("SCAN_SECONDS_PERIOD").data))


if __name__ == "__main__":
    main()