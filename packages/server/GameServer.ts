import { IncomingMessage } from "http";
import { WebSocket } from "ws";
interface Game {
	id: string;
	contractAddress: string;
}

// JSON-RPC types
interface JsonRpcRequest {
	jsonrpc: "2.0";
	method: string;
	params?: any;
	id?: number | string | null;
}

interface JsonRpcResponse {
	jsonrpc: "2.0";
	result?: any;
	error?: {
		code: number;
		message: string;
	};
	id?: number | string | null;
}

export class GameServer {
	private game: Game;

	// Key: WebSocket, Value: user connection info
	// private userMap: Map<WebSocket, UserConnection>;
	private userMap: Map<string, WebSocket>;

	// Key: evalId, Value: the requesting user's WebSocket
	private pendingEvaluations: Map<
		string,
		{
			from: string;
			ws: WebSocket;
		}
	>;

	constructor(gameId: string, contractAddress: string) {
		this.game = {
			id: gameId,
			contractAddress,
		};
		this.userMap = new Map();
		this.pendingEvaluations = new Map();

		console.log(`GameServer [${this.game.id}] initialized.`);
	}

	/**
	 * Handle a new WebSocket connection.
	 */
	public handleConnection(ws: WebSocket, req: IncomingMessage) {
		console.log(
			`GameServer [${this.game.id}]: New connection from ${req.socket.remoteAddress}`
		);

		ws.on("message", (data) => {
			this.handleMessage(ws, data.toString());
		});

		ws.on("close", () => {
			const disconnectedUserId = this.getUserIdBySocket(ws);
			if (disconnectedUserId) {
				this.userMap.delete(disconnectedUserId);
				console.log(
					`GameServer [${this.game.id}]: User [${disconnectedUserId}] disconnected.`
				);
			} else {
				console.log(`GameServer [${this.game.id}]: Unknown user disconnected.`);
			}
		});
	}

	/**
	 * Helper method to find userId by WebSocket.
	 */
	private getUserIdBySocket(ws: WebSocket): string | undefined {
		for (const [userId, socket] of this.userMap.entries()) {
			if (socket === ws) {
				return userId;
			}
		}
		return undefined;
	}

	/**
	 * Parse raw message data, which should be JSON.
	 * We expect either:
	 * 1) A JSON-RPC request, or
	 * 2) Some initial handshake that sets the userId (type: "handshake").
	 */
	private handleMessage(ws: WebSocket, raw: string) {
		console.log(`Game [${this.game.id}]: Received message:`, raw);
		let parsed: any;
		try {
			parsed = JSON.parse(raw);
		} catch (err) {
			console.warn(`Invalid JSON from client in Game [${this.game.id}]:`, err);
			return;
		}

		// (A) If this is the first message to associate userId:
		if (parsed?.type === "handshake" && parsed?.userId) {
			// Perform a simple check that userId is a hex string
			if (!/^(?:0x)?[0-9A-Fa-f]+$/.test(parsed.userId)) {
				ws.send(
					JSON.stringify({
						error: "Invalid userId (must be a hex string) " + parsed.userId,
					})
				);
				ws.close();
				return;
			}

			// Check if the userId already exists

			if (this.userMap.has(parsed.userId)) {
				console.log(
					`Game [${this.game.id}]: UserId ${parsed.userId} is reconnecting. No action taken.`
				);
				return; // Return nothing if the userId already exists
			} else {
				// prevent setting more than 3 users
				if (this.userMap.size >= 2) {
					this.sendJsonRpcError(ws, null, -32005, "Game is full.");
					return;
				}
			}

			// Store the user with userId as the key
			this.userMap.set(parsed.userId, ws);

			console.log(
				`Game [${this.game.id}]: Registered userId = ${parsed.userId}`
			);
			return;
		}

		// (B) Otherwise, we assume it's a JSON-RPC 2.0 message
		if (parsed && parsed.jsonrpc === "2.0") {
			this.handleJsonRpc(ws, parsed as JsonRpcRequest);
		} else {
			console.log(
				`Game [${this.game.id}]: Received unknown message format:`,
				parsed
			);
		}
	}

	/**
	 * Handle JSON-RPC requests.
	 * Impersonation check: the request must contain the correct userId that matches this WebSocket.
	 */
	private handleJsonRpc(ws: WebSocket, request: JsonRpcRequest) {
		const { method, params, id } = request;
		const userId = params?.userId;

		// Identify which user is sending this request
		const user = this.userMap.get(userId);
		if (!user) {
			// User hasn't done a handshake or is not recognized
			this.sendJsonRpcError(
				ws,
				id,
				-32000,
				"User not registered. Perform handshake first."
			);
			return;
		}

		// Dispatch to method handler
		switch (method) {
			case "notifyGuess":
				this.handleNotifyGuess(ws, request);
				break;

			case "evaluateGuess":
				this.handleEvaluateGuess(ws, request);
				break;

			case "evaluateGuessResult":
				this.handleEvaluateGuessResult(ws, request);
				break;

			case "getOpponent":
				this.handleGetOpponentUserId(ws, request);
				break;

			case "getContractAddress":
				this.handleGetContractAddress(ws, request);
				break;

			default:
				this.sendJsonRpcError(ws, id, -32601, "Method not found");
		}
	}

	/**
	 * Handle "notifyGuess" JSON-RPC method from the client.
	 * @param ws The WebSocket of the client.
	 * @param request The JSON-RPC request object.
	 */
	private handleNotifyGuess(ws: WebSocket, request: JsonRpcRequest) {
		const { params, id } = request;
		const { guess, userId } = params;

		console.log(
			`Game [${this.game.id}]: User [${userId}] notified a guess: ${guess}`
		);

		// Forward the notifyGuess to the opponent
		const opponent = this.getOpponent(userId);
		if (!opponent) {
			console.warn(
				`Game [${this.game.id}]: No opponent to notify for user [${userId}]`
			);
			this.sendJsonRpcError(ws, id, -32002, "No opponent connected.");
			return;
		}

		const notifyGuessMessage: JsonRpcRequest = {
			jsonrpc: "2.0",
			method: "notifyGuess",
			params: {
				guess,
				userId,
			},
			id, // Keeping the same ID for response tracking
		};

		opponent.ws.send(JSON.stringify(notifyGuessMessage));
		console.log(
			`Game [${this.game.id}]: Forwarded notifyGuess to opponent [${opponent.userId}]`
		);
	}

	/**
	 * Handle "evaluateGuess" method from the client.
	 *
	 * - This user is "User A" who is guessing.
	 * - We forward the guess to the opponent ("User B").
	 * - We store a pending evaluation so that when B responds,
	 *   we know which WebSocket to send the result back to.
	 */
	private handleEvaluateGuess(ws: WebSocket, request: JsonRpcRequest) {
		const { params, id } = request;
		const { guess, userId } = params;
		const requestId = id as string;

		console.log(`Game [${this.game.id}]: User [${userId}] guessed: ${guess}`);

		const opponent = this.getOpponent(userId);
		if (!opponent) {
			console.warn(
				`Game [${this.game.id}]: No opponent connected for user [${params.userId}]:Opponent: ${opponent}`
			);
			this.sendJsonRpcError(ws, id, -32002, "No opponent connected.");
			return;
		}

		// Store the mapping of evalId -> requesting user's WebSocket
		this.pendingEvaluations.set(requestId, {
			from: userId,
			ws,
		});

		// Forward the guess to the opponent via "receiveGuess"
		// The opponent is expected to call "evaluateGuessResult" with this evalId later.
		const evalRequest: JsonRpcRequest = {
			jsonrpc: "2.0",
			method: "receiveGuess",
			params: {
				guess,
				userId, // Could pass A's userId if needed for context
			},
			// `id` can be same as evalId or separate. Typically, for a "notification"
			// we might not need an ID, but let's keep it consistent.
			id: requestId,
		};
		opponent.ws.send(JSON.stringify(evalRequest));
	}

	/**
	 * Handle "evaluateGuessResult" method from the opponent ("User B").
	 *
	 * - B is sending back a boolean result (e.g., "true" if guess is correct).
	 * - We look up which user (A) requested this evaluation.
	 * - We send a JSON-RPC response to that user with the result.
	 */
	private handleEvaluateGuessResult(ws: WebSocket, request: JsonRpcRequest) {
		const { params, id } = request;
		const resultBoolean = params?.result; // e.g., true/false
		const requestId = id as string;
		const userId = params?.userId;
		console.log("[handleEvaluateGuessResult] userId: ", userId);

		// Find the original requester by userId
		const userFrom = this.pendingEvaluations.get(requestId);
		console.log(
			"[handleEvaluateGuessResult] pendingEval.from: ",
			userFrom?.from
		);

		if (!userFrom) {
			console.warn(
				`Game [${this.game.id}]: No pending evaluation found for evalId: ${requestId}`
			);
			return;
		}

		if (userFrom.from === userId) {
			console.warn(
				`Game [${this.game.id}]: User [${userId}] is trying to evaluate their own guess.`
			);
			return;
		}

		// Send the evaluation result back to user A
		const evalResponse: JsonRpcResponse = {
			jsonrpc: "2.0",
			result: resultBoolean, // the boolean result
			id: requestId, // match the evalId so the client can resolve the Promise
		};

		userFrom.ws.send(JSON.stringify(evalResponse));

		// Remove from pending
		this.pendingEvaluations.delete(requestId);
	}

	/**
	 * Returns the "other" player's WebSocket (assuming a 2-player game).
	 */
	private getOpponent(currentUserId: string):
		| {
				ws: WebSocket;
				userId: string;
		  }
		| undefined {
		for (let [userId, ws] of this.userMap.entries()) {
			if (userId !== currentUserId) {
				return { ws, userId };
			}
		}
		return undefined;
	}

	/**
	 * Handle "getAllUserIds" JSON-RPC method.
	 *
	 * - Retrieves all registered user IDs from the userMap.
	 * - Sends the list of user IDs back to the requesting client.
	 */
	private handleGetOpponentUserId(ws: WebSocket, request: JsonRpcRequest) {
		const { id, params } = request;
		const opponent = this.getOpponent(params?.userId);
		if (!opponent) {
			this.sendJsonRpcError(ws, id, -32003, "No opponent found.");
			return;
		}

		this.sendJsonRpcResult(ws, id, opponent.userId);
	}

	private handleGetContractAddress(ws: WebSocket, request: JsonRpcRequest) {
		const { id, params } = request;
		const user = this.userMap.get(params?.userId);
		if (!user) {
			this.sendJsonRpcError(ws, id, -32004, "User not registered.");
			return;
		}
		console.log(
			`Game [${this.game.id}]: User [${params?.userId}] requested contract address`
		);
		this.sendJsonRpcResult(ws, id, this.game.contractAddress);
	}

	// ─────────────────────────────────────────
	// JSON-RPC Helper Methods
	// ─────────────────────────────────────────

	private sendJsonRpcResult(
		ws: WebSocket,
		requestId: string | number | null | undefined,
		result: any
	) {
		const response: JsonRpcResponse = {
			jsonrpc: "2.0",
			result,
			id: requestId ?? null,
		};
		ws.send(JSON.stringify(response));
	}

	private sendJsonRpcError(
		ws: WebSocket,
		requestId: string | number | null | undefined,
		code: number,
		message: string
	) {
		const response: JsonRpcResponse = {
			jsonrpc: "2.0",
			error: { code, message },
			id: requestId ?? null,
		};
		ws.send(JSON.stringify(response));
	}
}
