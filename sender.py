import requests
import time
import json
import os

URL = "http://flask-app:5000/send"

with open("static/coordinates.json") as f:
    data = json.load(f)

# sorting by timestamp
data.sort(key=lambda x: x[3])

start_time = data[0][3]

for entry in data:
    ip, lat, lon, ts, sus = entry

    # time imitation
    delay = ts - start_time
    time.sleep(delay / 1000)

    payload = {
        "ip": ip,
        "lat": lat,
        "lon": lon,
        "timestamp": ts,
        "suspicious": sus
    }

    requests.post(URL, json=payload)