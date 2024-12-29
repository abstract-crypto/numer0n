import { AztecAddress } from "@aztec/aztec.js";
import { Numer0nContractService } from "./numer0n.js";
import { Game } from "./game.js";

interface PendingRequest {
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
}

/**
 * Encapsulates a WebSocket connection and JSON-RPC logic for Numer0n.
 */
export class Numer0nClient {
	private httpServerUrl: string;
	private ws: WebSocket | null = null;
	private pendingRequests = new Map<string, PendingRequest>();
	// Once we call createGame, we store the port & gameId
	private gamePort: number | null = null;
	private gameId: string | null = null;
	private userId: string;

	/**
	 * @param serverUrl  WebSocket URL of your game server (e.g. "ws://localhost:8080")
	 * @param userId     Hex string used to identify this client to the server
	 * @param contractService  An instance of Numer0nContractService for local contract calls
	 */
	constructor(private contractService: Numer0nContractService) {
		this.userId = contractService.self.getAddress().toString();
		this.httpServerUrl = "http://localhost:3000";
	}

	/**
	 * Calls the HTTP endpoint `/createGame` to spin up a new GameServer.
	 * The server responds with { gameId, port }.
	 */
	public async registerGameRequest(
		gameId: string,
		contractAddress: string
	): Promise<number> {
		try {
			const res = await fetch(`${this.httpServerUrl}/createGame`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameId, contractAddress }),
			});
			if (!res.ok) {
				throw new Error(`Server returned status ${res.status}`);
			}

			const data = await res.json();
			// Expect data to have shape: { gameId: string, port: number }
			this.gameId = data.gameId;
			this.gamePort = data.port;

			console.log(
				`Created new game [${this.gameId}] on port [${this.gamePort}]`
			);
			return data.port;
		} catch (err) {
			console.error("Failed to create game:", err);
			throw err;
		}
	}

	/**
	 * Connects via WebSocket to the newly created GameServer (using the stored `gamePort`).
	 * Sends a handshake message with our `userId`.
	 */
	public connect(gamePort?: number): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!gamePort && this.gamePort) {
				gamePort = this.gamePort;
			}

			if (!gamePort) {
				return reject(
					new Error("No game port available. Did you call createGame()?")
				);
			}

			this.gamePort = gamePort;

			const wsUrl = `ws://localhost:${gamePort}`;
			console.log(`Connecting to WebSocket at: ${wsUrl}`);
			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log("WebSocket connected.");

				// Send handshake
				this.ws!.send(
					JSON.stringify({
						type: "handshake",
						userId: this.userId,
					})
				);

				resolve();
			};

			this.ws.onerror = (err) => {
				console.error("WebSocket error:", err);
				reject(err);
			};

			// Handle incoming messages
			this.ws.onmessage = (event) => {
				this.handleMessage(event.data);
			};

			this.ws.onclose = () => {
				console.log("WebSocket closed.");
			};
		});
	}

	/**
	 * Initiates an "evaluateGuess" call on the server.
	 * - The server forwards to the opponent => Opponent calls `evaluate_guess` locally => Opponent sends "evaluateGuessResult"
	 * - Finally, the server returns a JSON-RPC response with the result to us.
	 * - This Promise resolves with a boolean or whatever the opponent sends back.
	 */
	public async sendEvaluateGuessRequest(guessNum: number): Promise<boolean> {
		console.log("sendEvaluateGuessRequest...");
		console.log("guessNum: ", guessNum);
		return new Promise((resolve, reject) => {
			if (!this.ws) {
				return reject(new Error("WebSocket is not connected."));
			}

			// Generate unique requestId
			const requestId = this.generateRequestId();
			// Store callbacks so we can resolve the Promise when we get a matching response
			this.pendingRequests.set(requestId, { resolve, reject });

			// Construct JSON-RPC request
			const payload = {
				jsonrpc: "2.0",
				method: "evaluateGuess",
				id: requestId,
				params: {
					userId: this.userId,
					guess: guessNum,
				},
			};
			this.ws.send(JSON.stringify(payload));
		});
	}

	public async getOpponent(): Promise<AztecAddress | null> {
		return new Promise((resolve, reject) => {
			if (!this.ws) {
				return reject(new Error("WebSocket is not connected."));
			}

			// Generate a unique request ID
			const requestId = this.generateRequestId();

			// Store the resolve and reject callbacks in the pendingRequests map
			this.pendingRequests.set(requestId, { resolve, reject });

			// Construct the JSON-RPC payload
			const payload = {
				jsonrpc: "2.0",
				method: "getOpponent",
				id: requestId,
				params: {
					userId: this.contractService.self.getAddress().toString(),
				},
			};

			// Send the JSON-RPC request
			this.ws.send(JSON.stringify(payload));
		});
	}

	public async getContractAddress(): Promise<string | null> {
		return new Promise((resolve, reject) => {
			if (!this.ws) {
				return reject(new Error("WebSocket is not connected."));
			}

			// Generate a unique request ID
			const requestId = this.generateRequestId();

			// Store the resolve and reject callbacks in the pendingRequests map
			this.pendingRequests.set(requestId, { resolve, reject });

			// Construct the JSON-RPC payload
			const payload = {
				jsonrpc: "2.0",
				method: "getContractAddress",
				id: requestId,
				params: {
					userId: this.contractService.self.getAddress().toString(),
				},
			};

			// Send the JSON-RPC request
			this.ws.send(JSON.stringify(payload));
		});
	}

	/**
	 * Internal message handler for all WebSocket messages.
	 */
	private handleMessage(rawData: string) {
		console.log("handleMessage...");
		console.log("rawData: ", rawData);
		let msg: any;
		try {
			msg = JSON.parse(rawData);
		} catch (e) {
			console.error("Failed to parse server message:", e);
			return;
		}

		// Check if it's JSON-RPC
		if (msg.jsonrpc === "2.0") {
			// Is it a response (result/error) or a request (method)?
			if ("result" in msg || "error" in msg) {
				// It's a JSON-RPC response
				this.handleJsonRpcResponse(msg);
			} else if (msg.method) {
				// It's a JSON-RPC request from the server
				this.handleJsonRpcRequest(msg);
			}
		} else {
			// Possibly some other message type
			console.log("Unknown message format:", msg);
		}
	}

	/**
	 * Handles incoming JSON-RPC responses.
	 * Matches them to a pending Promise by `id`.
	 */
	private handleJsonRpcResponse(responseMsg: any) {
		const { id, result, error } = responseMsg;
		const pending = this.pendingRequests.get(id);

		if (!pending) {
			console.warn(`No pending request found for id = ${id}`);
			return;
		}

		// Resolve or reject the Promise
		if (error) {
			pending.reject(new Error(error.message));
		} else {
			pending.resolve(result); // e.g. a boolean
		}
		this.pendingRequests.delete(id);
	}

	/**
	 * Handles incoming JSON-RPC requests from the server.
	 * For example, "receiveGuess" means our opponent guessed a number,
	 * and we need to call our local contract to evaluate it, then
	 * send an "evaluateGuessResult" request back.
	 */
	private handleJsonRpcRequest(requestMsg: any) {
		console.log("handleJsonRpcRequest...");
		console.log("requestMsg: ", requestMsg);
		const { method, params, id } = requestMsg;
		console.log("method: ", method);
		console.log("params: ", params);
		console.log("id: ", id);

		switch (method) {
			case "receiveGuess":
				this.handleReceiveGuess(params, id);
				break;

			default:
				console.log("Unknown JSON-RPC method from server:", method);
		}
	}

	/**
	 * Called when we receive "receiveGuess" from the server.
	 * We are effectively the "opponent" being asked to run `evaluate_guess`.
	 */
	private async handleReceiveGuess(params: any, requestId: string) {
		console.log("handleReceiveGuess...");
		console.log("params: ", params);
		console.log("requestId: ", requestId);
		// const guessNum = params?.guess;
		const { guess, userId } = params;
		console.log(`Received guess from opponent: ${guess}`);
		if (!this.ws) {
			throw new Error("WebSocket is not connected.");
		}

		console.log("guesser: ", userId);
		console.log("guessNum: ", guess);

		try {
			// Evaluate the guess locally (on this client)
			// "self" is the guesser? Actually, in this scenario, we are the evaluator.
			// So the first argument is "guesser" => but our code is flexible.
			await this.contractService.evaluateGuess(userId, Number(guess));

			// Send back "evaluateGuessResult" as a JSON-RPC request
			// The server will forward a final response to the original guesser
			const msg = {
				jsonrpc: "2.0",
				method: "evaluateGuessResult",
				id: requestId,
				params: {
					result: true, // or false if we found something else
					userId: this.userId,
				},
			};
			this.ws.send(JSON.stringify(msg));
		} catch (err) {
			console.error("Error in local evaluate_guess:", err);

			// Optionally, notify that the evaluation failed
			// You could choose 'result: false' or add an 'error' field
			const msg = {
				jsonrpc: "2.0",
				method: "evaluateGuessResult",
				id: requestId,
				params: {
					result: false,
					userId: this.userId,
				},
			};
			this.ws.send(JSON.stringify(msg));
		}
	}

	/**
	 * Generates a unique request ID string.
	 */
	private generateRequestId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
