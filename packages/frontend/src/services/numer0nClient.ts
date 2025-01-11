import { AztecAddress } from "@aztec/aztec.js";
import { Numer0nContractService } from "./numer0nContractService.js";
import { notifications } from "@mantine/notifications";

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
	// private gameId: string | null = null;
	private userId: string;

	private reconnectDelay = 1000; // start at 1s
	private maxReconnectDelay = 30000; // cap at 30s
	private isReconnecting: boolean = false;

	/**
	 * @param contractService  An instance of Numer0nContractService for local contract calls
	 */
	constructor(
		private gameId: string,
		private contractService: Numer0nContractService
	) {
		this.userId = contractService.self.getAddress().toString();
		this.httpServerUrl =
			import.meta.env.VITE_SERVER_URL ||
			(import.meta.env.VITE_ENV === "LOCAL"
				? "http://localhost:3001"
				: "https://5f14-109-172-176-130.ngrok-free.app");

		this.connect();
	}

	/**
	 * Calls the HTTP endpoint `/createGame` to spin up a new GameServer.
	 * The server responds with { gameId, port }.
	 */
	public async registerGameRequest(contractAddress: string): Promise<void> {
		try {
			const res = await fetch(`${this.httpServerUrl}/createGame`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameId: this.gameId, contractAddress }),
			});
			if (!res.ok) {
				throw new Error(`Server returned status ${res.status}`);
			}

			// const data = await res.json();
			// this.gameId = data.gameId;

			console.log(`Created new game [${this.gameId}]`);
		} catch (err) {
			console.error("Failed to create game:", err);
			throw err;
		}
	}

	/**
	 * Connects via WebSocket to the newly created GameServer (using the stored `gamePort`).
	 * Sends a handshake message with our `userId`.
	 */
	public connect(): Promise<void> {
		// console.log("gameId in connect: ", gameId);
		// if (!gameId && this.gameId) {
		// 	gameId = this.gameId;
		// }

		// if (!gameId) {
		// 	return Promise.reject(
		// 		new Error("No gameId available. Did you call registerGameRequest()?")
		// 	);
		// }

		// If we’re already connecting or open, just skip
		if (this.isConnected()) {
			console.log(
				"WebSocket is already connecting or open. No need to connect."
			);
			return Promise.resolve();
		}

		const wsUrl = `${this.httpServerUrl.replace(/^http/, "ws")}/?gameId=${
			this.gameId
		}`;
		console.log(`Connecting to WebSocket at: ${wsUrl}`);
		this.ws = new WebSocket(wsUrl);

		return new Promise((resolve, reject) => {
			this.ws!.onopen = () => {
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

			this.ws!.onerror = (err) => {
				console.error("WebSocket error:", err);
				reject(err);
			};

			// Handle incoming messages
			this.ws!.onmessage = (event) => {
				this.handleMessage(event.data);
			};

			this.ws!.onclose = (event) => {
				console.log("WebSocket closed.", event);
				// Attempt to reconnect only if gameId is defined
				// Attempt to reconnect only if gameId is defined and not already reconnecting
				this.attemptReconnect();
				// if (gameId) {
				// 	this.attemptReconnect(gameId);
				// } else {
				// 	console.error(
				// 		"Cannot reconnect: either gameId is undefined or already reconnecting."
				// 	);
				// }
			};
		});
	}

	private attemptReconnect() {
		// To avoid multiple reconnect attempts stacking
		// If for some reason we got here and the WS is already connected, bail
		if (this.isConnected()) {
			console.log(
				"WebSocket is already open/connecting. No need to reconnect."
			);
			return;
		}

		setTimeout(() => {
			if (this.isConnected()) {
				console.log(
					"WebSocket is already connected now. Stopping reconnect attempts."
				);
				this.isReconnecting = false;
				return;
			}

			this.connect()
				.then(() => {
					console.log("Reconnected!");
					// Reset the delay on a successful connection
					this.reconnectDelay = 1000;
				})
				.catch(() => {
					console.log("Reconnect attempt failed. Will try again.");
					// Increase the delay exponentially
					this.reconnectDelay = Math.min(
						this.reconnectDelay * 2,
						this.maxReconnectDelay
					);
					console.log(
						"attempting to reconnect recursively with delay: ",
						this.reconnectDelay
						// gameId
					);
					this.attemptReconnect();
				});
		}, this.reconnectDelay);
	}

	private isConnected(): boolean {
		if (!this.ws) return false;
		// WebSocket states: CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3
		return (
			this.ws.readyState === WebSocket.CONNECTING ||
			this.ws.readyState === WebSocket.OPEN
		);
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

		notifications.show({
			title: "Guess received. Starting evaluation...",
			message: `Opponent guessed ${guess}`,
			withCloseButton: true,
			position: "top-right",
			autoClose: 5000,
		});

		try {
			// Evaluate the guess locally (on this client)
			// "self" is the guesser? Actually, in this scenario, we are the evaluator.
			// So the first argument is "guesser" => but our code is flexible.
			await this.contractService.evaluateGuess(userId, Number(guess));

			notifications.show({
				title: "Evaluation complete",
				message: `sending the response back to the guesser...`,
				withCloseButton: true,
				position: "top-right",
				autoClose: 5000,
			});

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
