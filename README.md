# Traffic Visualization

# Project Description
This project visualizes incoming web traffic on an interactive 3D globe. The `sender.py` script reads IP address data from a CSV file and sends it to the Flask server with realistic time intervals. Received packets are dynamically displayed as colored points on the globe — green for normal traffic, red for suspicious activity. Points appear in real-time and stay on the map.

# Stack
- Flask microframework for the backend
- Three.js for the frontend

# Data Exploration
Did quick EDA in the `EDA.ipynb` notebook just to understand the structure of provided CSV file.

# How to Run using docker
Since the goal was to ensure that the project is easily reproducible, you can do it using the command below:
```bash
docker-compose up --build
```

The page will be available here:
```bash
http://127.0.0.1:5000
```

# References
1. A foundation for the `earth.js` file: `index.js` from https://github.com/bobbyroe/getting-started-threejs.git repository;
2. 3D globe visualization: tutorial https://youtu.be/f4zncVufL_I?si=pjeygVtrp4j4HF6H