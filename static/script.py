import csv
import json

csv_path = 'static/ip_addresses.csv'
json_path = 'static/coordinates.json'

data = []

# Reading from CSV
with open(csv_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.reader(csv_file)
    
    headers = next(csv_reader)

    for row in csv_reader:
        correct_data = [
            row[0],
            float(row[1]),
            float(row[2]),
            int(row[3]),
            float(row[4])

        ]
        data.append(correct_data)

# Sorting timestamp in ascending order (for chronological appearance in the vizualization)
data.sort(key=lambda x: x[3])


# Writing to a JSON file
with open(json_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=4)