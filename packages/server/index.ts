import { createServer, IncomingMessage, ServerResponse } from "http";
import { GameServerManager } from "./GameServerManager";
import { URL } from "url";
import { WebSocket, WebSocketServer } from "ws";

// Simple HTTP server to manage requests
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
	// Set CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	console.log(`Incoming Request: ${req.method} ${req.url}`);

	// Handle preflight OPTIONS request
	if (req.method === "OPTIONS") {
		console.log("Handling OPTIONS preflight request");
		res.writeHead(204);
		res.end();
		return;
	}

	// Parse the URL to extract the pathname
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(req.url ?? "", `http://${req.headers.host}`);
	} catch (err) {
		console.error("Error parsing URL:", err);
		res.statusCode = 400;
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ error: "Invalid URL" }));
		return;
	}

	if (req.method === "POST" && parsedUrl.pathname === "/createGame") {
		let body = "";
		req.on("data", (chunk: any) => {
			body += chunk;
			console.log(`Received chunk: ${chunk.length} bytes`);
		});

		req.on("end", () => {
			console.log("Received complete request body");
			try {
				const { gameId, contractAddress } = JSON.parse(body);
				console.log(
					`Parsed Body - gameId: ${gameId}, contractAddress: ${contractAddress}`
				);

				// Validate required fields
				if (!gameId) {
					console.warn("Missing gameId in request");
					res.statusCode = 400;
					res.setHeader("Content-Type", "application/json");
					return res.end(JSON.stringify({ error: "Missing gameId" }));
				}

				if (!contractAddress) {
					console.warn("Missing contractAddress in request");
					res.statusCode = 400;
					res.setHeader("Content-Type", "application/json");
					return res.end(JSON.stringify({ error: "Missing contractAddress" }));
				}

				// Create new GameServer
				console.log(`Attempting to create GameServer for gameId: ${gameId}`);
				GameServerManager.createGame(gameId, contractAddress);
				console.log(`GameServer created for gameId: ${gameId}`);

				res.statusCode = 200;
				res.setHeader("Content-Type", "application/json");
				return res.end(JSON.stringify({ gameId }));
			} catch (err) {
				console.error("Error processing /createGame request:", err);
				res.statusCode = 500;
				res.setHeader("Content-Type", "application/json");
				return res.end(JSON.stringify({ error: (err as Error).message }));
			}
		});

		req.on("error", (err) => {
			console.error("Request error:", err);
			res.statusCode = 500;
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ error: "Server Error" }));
		});
	} else {
		console.warn(`Unhandled request: ${req.method} ${parsedUrl.pathname}`);
		res.statusCode = 404;
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ error: "Not Found" }));
	}
});

// Initialize a single WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
	// Parse gameId from query parameters
	const parsedUrl = new URL(req.url ?? "", `http://${req.headers.host}`);
	const gameId = parsedUrl.searchParams.get("gameId");

	if (!gameId) {
		ws.send(JSON.stringify({ error: "Missing gameId in connection URL" }));
		ws.close();
		return;
	}

	const gameServer = GameServerManager.getGameServer(gameId);
	if (!gameServer) {
		ws.send(
			JSON.stringify({ error: `Game with ID ${gameId} does not exist.` })
		);
		ws.close();
		return;
	}

	// Delegate the connection to the specific GameServer instance
	gameServer.handleConnection(ws, req);
});

// Start the HTTP server
const HTTP_PORT = process.env.PORT || 3001;
server.listen(HTTP_PORT, () => {
	console.log(`HTTP server listening on port ${HTTP_PORT}`);
});
