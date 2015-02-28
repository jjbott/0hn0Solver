solver = function(){
	function boardToArray() {
		var size = Math.sqrt(tiles.length);
		var array = [];
		for(var x = 0; x < size; ++x) {
			array.push([]);
			for(var y = 0; y < size; ++y) {
				var cell = tiles[x + (y * size)];
				if ( cell.type === 'Value' ) {
					array[x].push(parseInt(cell.value, 10));
				}
				else if (cell.type === 'Unknown') {
					array[x].push(null); // unknown tile
				}
				else if (cell.type === 'Dot') {
					array[x].push(0); // blue dot
				}
				else {
					array[x].push(-1); // red tile
				}
			}
		}
		return array;
		
	}

	function arrayToString(array) {
		var s = '';
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				if ( array[x][y] !== null && array[x][y] >= 0 ) {
					s += array[x][y].toString();
				}
				else if (array[x][y] < 0) {
					s += 'X';
				}
				else {
					s += '_';
				}
			}
		}
		return s;
	}

	function visibleScan(coords,array,deltaFunction, includeAll) {
		var visibleCoords = [];
		
		for(var pos = coords; pos.x >= 0 && pos.x < array.length && pos.y >= 0 && pos.y < array.length; pos = deltaFunction(pos)) {
			if ( (array[pos.x][pos.y] != null && array[pos.x][pos.y] >= 0)
				|| (includeAll && array[pos.x][pos.y] == null) ) {
				visibleCoords.push({x:pos.x, y:pos.y});
			}
			else {
				break;
			}
		}
		
		return visibleCoords;
	}

	function visibleFrom(x,y,array,includeAll) {
		var visibleCoords = {};
		
		visibleCoords.right = visibleScan({x:x+1, y:y}, array, function(c){return {x:c.x+1, y:c.y}}, includeAll);
		visibleCoords.left = visibleScan({x:x-1, y:y}, array, function(c){return {x:c.x-1, y:c.y}}, includeAll);
		visibleCoords.up = visibleScan({x:x, y:y+1}, array, function(c){return {x:c.x, y:c.y+1}}, includeAll);
		visibleCoords.down = visibleScan({x:x, y:y-1}, array, function(c){return {x:c.x, y:c.y-1}}, includeAll);
		visibleCoords.all = visibleCoords.right.concat(visibleCoords.left.concat(visibleCoords.up.concat(visibleCoords.down)));
		
		return visibleCoords;
	}

	function isBoardValid(array, debug) {
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				if ( array[x][y] > 0 ) {
					var adjacentBlue = visibleFrom(x,y,array, false);
					if ( adjacentBlue.all.length > array[x][y] ) {
						//if ( debug ) { console.log("x: " + x + " y: " + y + " can see too many blues"); }
						return false;
					}
					
					var visible = visibleFrom(x,y,array, true);
					if ( visible.all.length < array[x][y] ) {
						//if ( debug ) { console.log("x: " + x + " y: " + y + " can't see enough"); }
						return false;
					}
				}
			}
		}
		
		return true;
	}

	function potentialRed(array, lastMove) {
		// TODO: This works pretty darn well. But it is dumb with regards to available options.
		// It'll happily say the '?' here is a valid option, just because it's a visible blank.
		// XXXXXXXXXX
		// X7?      
		// XXXXXXXXXX
		// Try to limit the potentials to only include those that wouldnt mess up our current target.
		
		// BIGGER TODO: Limit potentials based upon last move, so we dont check duplicate boards
		// ex:
		// _A_
		// B2C
		// _D_
		// ...will check A with B, then B with A, then A with B and C, then B with C and A, etc...
		// need to sort visibles so we have a better pattern we can filter on 

		// BIGGER BIGGER TODO: If we can force more reds and blues, the intelligence of this method wont be a big deal
		var minOptions = [];
		var minTarget = null;
		
		if (lastMove.lastTarget) {
			if ( array[lastMove.lastTarget.x][lastMove.lastTarget.y] > 0 ) {
				var options = []
				var visible = visibleFrom(x,y,array, true).all;
				visible = visible.sort(function(a,b){ return ((a.y * array.length) + a.x) - ((b.y * array.length) + b.x);});
				for(var i in visible) {
					if ( (array[visible[i].x][visible[i].y] === null)
						&& ((visible[i].y * array.length) + visible[i].x) > ((lastMove.lastTarget.y * array.length) + lastMove.lastTarget.x)
						) {
						options.push({x:visible[i].x, y:visible[i].y});
					}
				}
				
				if ( options.length > 0 ) {
					return {target: lastMove.lastTarget, options: options};
				}
			}
		}

		for(var y = 0; y < array.length && (minOptions.length != 1); ++y) {
			for(var x = 0; x < array[y].length && (minOptions.length != 1); ++x) {
				if ( array[x][y] !== null && array[x][y] > 0 ) {
					var options = []
					var visible = visibleFrom(x,y,array, true).all;
					visible = visible.sort(function(a,b){ return ((a.y * array.length) + a.x) - ((b.y * array.length) + b.x);});
					for(var i in visible) {
						if ( (array[visible[i].x][visible[i].y] === null) ) {
							options.push({x:visible[i].x, y:visible[i].y});
						}
					}
					
					if ( minOptions.length === 0 || options.length < minOptions.length) {
						minOptions = options;
						minTarget = {x:x, y:y};
					}
				}
			}
		}
		
		return {target: minTarget, options: minOptions || []};
	}

	function validBlue(array) {
		var results = [];
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				if ( array[x][y] === null ) {
					var newArray = array.slice();
					newArray[x][y] = 0;
					if ( testSomething(newArray) ) {
						results.push({x:x, y:y});
					}
				}
			}
		}
		
		return results;
	}

	function findCompleteBlues(array) {
		var results = [];
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				if ( array[x][y] > 0 ) {
					var blueVisible = visibleFrom(x,y,array,false).all;
					if ( blueVisible.length == array[x][y] ) {
						results.push({x:x, y:y, claimed:true});
					}
					else {
						var allVisible = visibleFrom(x,y,array,true).all;
						if ( allVisible.length == array[x][y] ) {
							results.push({x:x, y:y, claimed:false});
						}
					}
				}
			}
		}
		return results;
	}

	function findForcedBlues(array) {
		var results = [];
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				if ( array[x][y] > 0 ) {
					allVisible = visibleFrom(x,y,array,true);
					var sortedVisible = [allVisible.up, allVisible.down, allVisible.left, allVisible.right].sort(function(a,b){return b.length -a.length;});
					if ( sortedVisible[0].length > sortedVisible[1].length ) { // one side has more visible than all other. see if we can force some blues in there
						var forcedCount = array[x][y] - sortedVisible[1].length - sortedVisible[2].length - sortedVisible[3].length;
						if ( forcedCount < sortedVisible[0].length ) { // will only be false if the board is jacked (which is ok)
							for(var i = 0; i < forcedCount; ++i) {
								if ( array[sortedVisible[0][i].x][sortedVisible[0][i].y] === null ) {
									results.push({x:sortedVisible[0][i].x, y:sortedVisible[0][i].y});
								}
							}
						}
					} else if (sortedVisible[0].length > 0 && sortedVisible[1].length == 0) { // only one direction left to look in
						for(var i = 0; i < array[x][y]; ++i) {
								if ( array[sortedVisible[0][i].x][sortedVisible[0][i].y] === null ) {
									results.push({x:sortedVisible[0][i].x, y:sortedVisible[0][i].y});
								}
							}
					}


				}
			}
		}
		return results;
	}

	function addReds(x,y, array) {
		//right
		for(var x2 = x; x2 < array.length; x2++) {
			if ( array[x2][y] === null || array[x2][y] < 0) {
				array[x2][y] = -1;
				break;
			}
		}
		
		//left
		for(var x2 = x; x2 >= 0; x2--) {
			if ( array[x2][y] === null || array[x2][y] < 0) {
				array[x2][y] = -1;
				break;
			}
		}
		
		//up
		for(var y2 = y; y2 >= 0; y2--) {
			if ( array[x][y2] === null || array[x][y2] < 0) {
				array[x][y2] = -1;
				break;
			}
		}
		
		//down
		for(var y2 = y; y2 < array.length; y2++) {
			if ( array[x][y2] === null || array[x][y2] < 0) {
				array[x][y2] = -1;
				break;
			}
		}
	}

	function clickElement(e) {
		$(e).mousedown().mouseup();
	}

	function rightClickElement(e) {
		$(e).trigger({type:'mousedown',which:3}).trigger({type:'mouseup'});
	}

	function solveStep(array) {
		var completeCoords = findCompleteBlues(array);
		var forcedCoords = findForcedBlues(array);
		while ((forcedCoords.length + completeCoords.length) > 0) {
			for(var i in forcedCoords) {
				array[forcedCoords[i].x][forcedCoords[i].y] = 0;
			}
		
			for(var i = 0; i < completeCoords.length; ++i){
				if ( !completeCoords[i].claimed ) {
					var visible = visibleFrom(completeCoords[i].x, completeCoords[i].y,array,true).all;
					for(var vi = 0; vi < visible.length; ++vi){
						if ( array[visible[vi].x][visible[vi].y] === null ) {
							array[visible[vi].x][visible[vi].y] = 0;
						}
					}
				}
				
				addReds(completeCoords[i].x, completeCoords[i].y, array);
				
				array[completeCoords[i].x][completeCoords[i].y] = 0;
			}
			
			completeCoords = findCompleteBlues(array);
			forcedCoords = findForcedBlues(array);
		}
		
		return array;
	}

	function blockInvisibleSpaces(array) {
		var v = copyBoard(array);
		for(var y = 0; y < v.length; ++y) {
			for(var x = 0; x < v[y].length; ++x) {
				if ( v[x][y] > 0 ) {
					allVisible = visibleFrom(x,y,v,true).all;
					for(var i in allVisible) {
						v[allVisible[i].x][allVisible[i].y] = v[allVisible[i].x][allVisible[i].y] || 0;
					}
				}
			}
		}
		
		for(var y = 0; y < v.length; ++y) {
			for(var x = 0; x < v[y].length; ++x) {
				if ( v[x][y] === null ) {
					array[x][y] = -1;
				}
			}
		}
	}

	function copyBoard(board) {
		var newBoard = [];
		for(var bi in board) {
			newBoard.push(board[bi].slice());
		}
		return newBoard;
	}

	function arrayToBoard(array) {
		var currentBoard = boardToArray();
		for(var y = 0; y < array.length; ++y) {
			for(var x = 0; x < array[y].length; ++x) {
				
				var currentCell = currentBoard[x][y];
				var newCell = array[x][y];
				
				if ( (currentCell != newCell) && (currentCell <= 0) ) {
					var boardCell = $('#grid td[data-x="' + x + '"][data-y="' + y + '"]')[0];
					if ( newCell === null ) {
						if ( currentCell === 0 ) {
							rightClickElement(boardCell);
						}
						else {
							clickElement(boardCell);
						}
					} else if (newCell === 0 ) {
						if ( currentCell === null ) {
							clickElement(boardCell);
						}
						else {
							rightClickElement(boardCell);
						}
					} else {
						if ( currentCell === null ) {
							rightClickElement(boardCell);
						}
						else {
							clickElement(boardCell);
						}
					}
				}
			}
		}
	}


	function solve(array, delay) {
		var boardsChecked = 0;
		var maxDepth = 0;
		var maxDepthBoards = [];
		var queue = [];
		
		
		var newBoard = copyBoard(array);
		solveStep(newBoard);
		blockInvisibleSpaces(newBoard);
		queue.push({board:newBoard, lastMove:[{x:-1, y:-1, lastTarget:null}], depth:0});

		function iteration() {
			if (queue.length > 0){
			
				
			
				var boardState = queue.shift();
				var board = boardState.board;
				boardsChecked++;
				
					
				arrayToBoard(board);
				
				if ( isBoardValid(board, false) ) {
							
					if ( maxDepth <= boardState.depth) {
						if ( maxDepth < boardState.depth ) {
							maxDepthBoards = [];
						}
						
						maxDepth = boardState.depth;
						maxDepthBoards.push(board);
					}
					
					
					var p = potentialRed(board, boardState.lastMove);
					if ( p.options.length === 0  ) {
						arrayToBoard(board);

						return;
					}
					else {
				
						for(var i = p.options.length - 1; i >= 0; --i) {
							var newBoard = copyBoard(board);
							newBoard[p.options[i].x][p.options[i].y] = -1;
							solveStep(newBoard);
							blockInvisibleSpaces(newBoard);
							
							var lastMoveCopy = JSON.parse(JSON.stringify(boardState.lastMove))
							lastMoveCopy.unshift({x:p.options[i].x, y:p.options[i].y, target: p.target});
							queue.unshift({board:newBoard, lastMove: lastMoveCopy, depth:boardState.depth+1});					
						}
					}
				}
				
				setTimeout(iteration, delay);
			}
			
			
		}
		
		iteration();
	}
	
	return {
		solveCurrent: function(delay) {
			solve(boardToArray(), delay || 0);
		}
	}
}();

