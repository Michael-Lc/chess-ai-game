from flask import Flask, render_template, request
import json
from model.chess_ai import get_move

app = Flask(__name__)

@app.route('/')
def hello():
    return render_template('index.html')

@app.route('/get_move', methods=['POST'])
def return_move():
    data = json.loads(request.data)
    fen = get_move(fen=data['fen'])
    return {"fen": fen}

if __name__ == '__main__':
    app.run(debug=True)