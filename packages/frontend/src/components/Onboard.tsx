import { useEffect, useState } from "react";
import {
	Button,
	Container,
	Center,
	Text,
	Stack,
	Box,
	CopyButton,
	Anchor,
} from "@mantine/core";
import { useGameContext } from "../contexts/useGameContext";
import { GAME_STATUS } from "src/services/game";
import { useNavigate } from "react-router-dom";
import { createGame } from "src/scripts";
import { useAccountContext } from "src/contexts/useAccountContext";
import { Numer0nContractService } from "src/services/numer0n";
import { Numer0nClient } from "src/services/numer0nClient";

export default function Onboard() {
	// const [gameData, setGameData] = useState<Game | null>(null);
	// const [numer0nService, setNumer0nService] =
	// 	useState<Numer0nContractService | null>(null);
	const {
		gameData,
		numer0nService,
		numer0nClient,
		setNumer0nClient,
		setNumer0nService,
	} = useGameContext();
	// const { deployer, wallet } = useAccounts();
	const { deployer, wallet, setOpponent } = useAccountContext();
	const navigate = useNavigate();

	const [isGameCreated, setIsGameCreated] = useState<boolean>(false);
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [invitationLink, setInvitationLink] = useState<string>("");
	const [playersSet, setPlayersSet] = useState<boolean>(false);

	const [error, setError] = useState<string | null>(null);

	// useEffect(() => {
	// 	const gameInstance = new Game();
	// 	setGameData(gameInstance);
	// }, []);

	// useEffect(() => {
	// 	if (!gameData || !gameData.getContractAddress()) {
	// 		console.log("game not found");
	// 		return;
	// 	}

	// 	if (!wallet) {
	// 		console.log("Players not found");
	// 		return;
	// 	}

	// 	const numer0nService = new Numer0nContractService(
	// 		gameData.getContractAddress(),
	// 		wallet
	// 	);

	// 	setNumer0nService(numer0nService);
	// }, [gameData, wallet]);

	useEffect(() => {
		const loadOnboard = async () => {
			if (!gameData) {
				console.log("Game data not found");
				return;
			}

			if (!numer0nService) {
				console.log("Numer0n service not found");
				return;
			}

			const gameCode = gameData.getGameCode();
			const contractAddress = gameData.getContractAddress();
			if (!gameCode || !contractAddress) {
				console.log("Game code or contract address not found");
				return;
			}

			if (!invitationLink) {
				const invitationUrl = `${window.location.origin}/invite?contract=${contractAddress}&secret=${gameCode}`;
				setInvitationLink(invitationUrl);
			}

			const fetchedGameData = await numer0nService.getGame();
			console.log("fetchedGameData: ", fetchedGameData);

			if (Number(fetchedGameData.status) === GAME_STATUS.PLAYERS_SET) {
				if (!numer0nClient) {
					console.log("numer0nClient not found");
					return;
				}

				// get opponent
				const opponent = await numer0nClient.getOpponent();
				if (!opponent) {
					console.log("opponent not found");
					return;
				}

				gameData.setOpponent({
					id: 2,
					address: opponent.toString(),
					guesses: [],
				});

				// setOpponent(opponent);

				setPlayersSet(true);
			}
		};
		const intervalId = setInterval(loadOnboard, 5000);
		return () => clearInterval(intervalId);
	}, [gameData, invitationLink, numer0nService, numer0nClient]);

	useEffect(() => {
		if (playersSet) {
			// Navigate to the desired route when playersSet is true
			navigate("/game"); // Replace "/game" with your target route
			// setGameData(null);
			// setNumer0nService(null);
			// setNumer0nClient(null);
			setIsGameCreated(false);
			setInvitationLink("");
			setPlayersSet(false);
			setError(null);
		}
	}, [playersSet, navigate]);

	async function handleCreateNewGame() {
		setError(null);
		setLoadingCreate(false);
		setLoadingCreate(true);

		if (!gameData) {
			console.log("Game data not found");
			setError("Game data not found");
			setLoadingCreate(false);
			return;
		}

		// generate game password
		const gameCode = "0x" + crypto.randomUUID().slice(0, 5);
		console.log("gameCode: ", gameCode);

		if (!deployer) {
			console.error("Deployer not found");
			setError("Deployer not found");
			setLoadingCreate(false);
			return;
		}

		if (!wallet) {
			console.error("Wallet not found");
			setError("Connect your wallet to create a game");
			setLoadingCreate(false);
			return;
		}

		// deploy
		const contractAddress = await createGame(wallet, gameCode);
		if (!contractAddress) {
			console.error("Failed to create game");
			setError("Failed to create game");
			setLoadingCreate(false);
			return;
		}
		console.log("contractAddress: ", contractAddress.toString());

		const numer0nService = new Numer0nContractService(
			wallet,
			contractAddress.toString()
		);
		const numer0nClient = new Numer0nClient(numer0nService);
		const port = await numer0nClient.registerGameRequest(
			gameCode,
			contractAddress.toString()
		);
		await numer0nClient.connect();

		gameData.setGamePort(port);
		gameData.setGameCode(gameCode);
		gameData.setContractAddress(contractAddress.toString());
		gameData.setSelf({
			id: 1,
			address: wallet.getAddress().toString(),
			guesses: [],
		});

		const invitationUrl = `${window.location.origin}/invite?secret=${gameCode}&port=${port}`;
		setInvitationLink(invitationUrl);

		setNumer0nClient(numer0nClient);
		setNumer0nService(numer0nService);

		setIsGameCreated(true);
		setLoadingCreate(false);
	}

	return (
		<Container mt={100}>
			<Box mb={50}>
				<Text
					style={{
						marginTop: 50,
						fontSize: "35px",
						textAlign: "center",
					}}
				>
					Welcome To Numer0n!
				</Text>
				<Text
					style={{
						marginTop: 20,
						fontSize: "20px",
						textAlign: "center",
					}}
					mx={40}
					mb={50}
				>
					Numer0n is a number-guessing game like a "Hit & Blow". <br /> Built on
					Aztec Sandbox.
				</Text>
			</Box>
			{isGameCreated ? (
				<Stack align="center">
					<Text style={{ textAlign: "center" }}>
						A new game was successfully created! <br />
						Please share the following invite link with your friend and wait for
						them to join:{" "}
					</Text>
					<>
						<CopyButton value={invitationLink}>
							{({ copied, copy }) => (
								<Stack align="center">
									<Anchor
										size="sm"
										onClick={copy}
										style={{ textAlign: "center", cursor: "pointer" }}
									>
										{invitationLink}{" "}
									</Anchor>
									{copied && (
										<Text color="black" mt={3} size="md">
											Copied!
										</Text>
									)}
								</Stack>
							)}
						</CopyButton>{" "}
					</>
				</Stack>
			) : (
				<Center style={{ flexDirection: "column" }}>
					{!isGameCreated && (
						<Button
							style={{ textAlign: "center" }}
							onClick={handleCreateNewGame}
							loading={loadingCreate}
						>
							Create a new game
						</Button>
					)}
					{error && (
						<Text mt={10} color="red">
							{error}
						</Text>
					)}
				</Center>
			)}
		</Container>
	);
}
