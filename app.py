from flask import Flask, render_template, request
import json

app = Flask(__name__)

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/get_move', methods=['POST'])
def get_move():
    data = json.loads(request.data)
    print(data)
    return {"move": "e6"}

if __name__ == '__main__':
    app.run(debug=True)