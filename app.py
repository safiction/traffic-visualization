from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

packets = []

@app.route('/')
def index():
    return render_template('viz.html')

# sending packets
@app.route('/send', methods=['POST'])
def receive():
    data = request.json
    packets.append(data)
    return {"status": "ok"}

# receiving packets
@app.route('/data')
def get_data():
    return jsonify(packets)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)