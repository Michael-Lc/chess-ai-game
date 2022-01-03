// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess()
var $status = $('#status')
var $start = $("#start")
var $undo = $("#undo")
var kingCheckRed = '#dc143c'
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

function removeGreySquares () {
  $('#board .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#board .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece) {
  if (window.matchMedia('(max-width: 768px)').matches) onMouseoverSquare(source, piece)
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }

  if (game.turn() === 'b') return false
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
    $status.css('color', kingCheckRed)
    redSquare({type: 'k', color: game.turn()})
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
    $status.css('color', "#deb887")
  }

  $status.html(status)
}

function redSquare(piece) {
  index = [].concat(...game.board()).map((p, index) => {
    if (p !== null && p.type === piece.type && piece.color === p.color) {
      return index
    }
  }).filter(Number.isInteger).map((piece_index) => {
    const row = 'abcdefgh'[piece_index % 8]
    const column = Math.ceil((64 - piece_index) / 8)
    return row + column
  })

  if (index.length === 0) return
  
  var $square = $('#board .square-' + index[0])
  var background = kingCheckRed
  $square.css('background', background)
}

function onDrop (source, target) {
  removeGreySquares()
  let move_stack = JSON.parse(window.sessionStorage.getItem("move_stack")) || []
  move_stack = [...move_stack, game.fen()]
  window.sessionStorage.setItem("move_stack", JSON.stringify(move_stack))

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'


  window.sessionStorage.setItem("game_fen", game.fen())

  if (game.in_check()) {
    redSquare({type: 'k', color: game.turn()})
  }

  if (game.game_over()) return updateStatus()

  fetch('/get_move', {
    method: 'POST',
    body: JSON.stringify({fen: game.fen()})
  })
  .then(res => res.json())
  .then(fen => {
    game = new Chess(fen['fen'])
    board.position(game.fen())
    window.sessionStorage.setItem("game_fen", game.fen())
  })
  .catch(err => console.log(err))
}

function onMouseoverSquare (square, piece) {
  // if black piece dont show available moves
  if(piece && piece.search(/^b/) === 0) return

  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  board.position(game.fen())
}

var config = {
  draggable: true,
  position: 'start',
  pieceTheme: '/static/img/chesspieces/wikipedia/{piece}.png',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

board = Chessboard('board', config)

$start.on('click', () => {
  board.position('start')
  game = new Chess()
  window.sessionStorage.setItem("game_fen", game.fen())

})

$undo.on('click', () => {
  let move_stack = JSON.parse(window.sessionStorage.getItem("move_stack"))

  if (move_stack && move_stack.length !== 0) {
    game = new Chess(move_stack[move_stack.length - 1])
    board.position(game.fen())
    window.sessionStorage.setItem("game_fen", game.fen())
    move_stack.pop()
    window.sessionStorage.setItem("move_stack", JSON.stringify(move_stack))
  } 
  else return
})

document.addEventListener("DOMContentLoaded", ev => {
  game_fen = window.sessionStorage.getItem("game_fen")
  if (game_fen) {
    game = new Chess(game_fen)
    board.position(game_fen)
    updateStatus()
  }
})

updateStatus()
