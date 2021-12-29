import chess
import numpy as np
import keras.models as models

squares_index = {
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3,
    'e': 4,
    'f': 5,
    'g': 6,
    'h': 7,
}

# example h3 -> 17
def square_to_index(square):
    letter = chess.square_name(square)
    return 8 - int(letter[1]), squares_index[letter[0]]

def split_dims(board):
    # This is the 3d matrix
    board3d = np.zeros((14, 8, 8), dtype=np.int8)

    # here we add the pieces' view on the matrix
    for piece in chess.PIECE_TYPES:
        for square in board.pieces(piece, chess.WHITE):
            # print(square)
            idx = np.unravel_index(square, (8, 8))
            board3d[piece - 1][7 - idx[0]][idx[1]] = 1
        
        for square in board.pieces(piece, chess.BLACK):
            idx = np.unravel_index(square, (8, 8))
            board3d[piece + 5][7 - idx[0]][idx[1]] = 1

    # Add attacks and valid moves too
    # so the network knows what is being attacked
    aux = board.turn
    board.turn = chess.WHITE
    for move in board.legal_moves:
        i, j = square_to_index(move.to_square)
        board3d[12][i][j] = 1

    board.turn = chess.BLACK
    for move in board.legal_moves:
        i, j = square_to_index(move.to_square)
        board3d[13][i][j] = 1
    board.turn = aux

    return board3d

model = models.load_model("model/chess_model.h5")

# Playing with the AI
# used the minimax algorithm
def minimax_eval(board):
    board3d = split_dims(board)
    board3d = np.expand_dims(board3d, 0)
    return model(board3d)[0][0]

def minimax(board, depth, alpha, beta, maximizing_player):
    if depth == 0 or board.is_game_over():
        return minimax_eval(board)

    if maximizing_player:
        max_eval = -np.inf

        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)

            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = -np.inf

        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)

            if beta <= alpha:
                break
        return min_eval

# This is the actual function that gets the move from the neural network
def get_ai_move(board, depth):
    max_move = None
    max_eval = -np.inf

    for move in board.legal_moves:
        board.push(move)
        eval = minimax(board, depth - 1, -np.inf, np.inf, False)
        board.pop()

        if eval > max_eval:
            max_eval = eval
            max_move = move

    return max_move

def get_move(fen:str):
    board = chess.Board(fen=fen)
    if board.is_game_over(claim_draw=True):
        return None
    move = get_ai_move(board=board, depth=1)
    board.push(move)
    return board.fen()