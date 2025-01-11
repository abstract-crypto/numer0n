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
	TextInput,
} from "@mantine/core";
import { useGameContext, useAccountContext } from "../contexts";
import { useNavigate } from "react-router-dom";
import {
	Numer0nContractService,
	Numer0nClient,
	GAME_STATUS,
	createGame,
} from "src/services";

export default function Onboard() {
	const {
		gameService,
		numer0nContractService,
		numer0nClient,
		setNumer0nClient,
		setNumer0nService,
	} = useGameContext();
	const { deployer, wallet } = useAccountContext();
	const navigate = useNavigate();

	const [isGameCreated, setIsGameCreated] = useState<boolean>(false);
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [invitationLink, setInvitationLink] = useState<string>("");
	const [playersSet, setPlayersSet] = useState<boolean>(false);

	const [inviteLinkInput, setInviteLinkInput] = useState<string>("");

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadOnboard = async () => {
			console.log("loadOnboard");
			console.log("0");
			if (!gameService) {
				console.log("gameService not found");
				return;
			}
			console.log("1");

			if (!numer0nContractService) {
				console.log("Numer0n service not found");
				return;
			}
			console.log("2");
			const gameCode = gameService.getGameCode();
			const contractAddress = gameService.getContractAddress();
			if (!gameCode || !contractAddress) {
				console.log("Game code or contract address not found");
				return;
			}
			console.log("3");

			if (!invitationLink) {
				const invitationUrl = `${window.location.origin}/invite?secret=${gameCode}`;
				setInvitationLink(invitationUrl);
			}

			console.log("4");

			const fetchedGameData = await numer0nContractService.getGame();
			console.log("fetchedGameData: ", fetchedGameData);

			console.log("5");
			console.log("fetchedGameData.status: ", fetchedGameData.status);
			console.log("GAME_STATUS.PLAYERS_SET: ", GAME_STATUS.PLAYERS_SET);

			if (Number(fetchedGameData.status) !== GAME_STATUS.NULL) {
				console.log("6");
				if (!numer0nClient) {
					console.log("numer0nClient not found");
					return;
				}
				console.log("7");

				// get opponent
				const opponent = await numer0nClient.getOpponent();
				if (!opponent) {
					console.log("opponent not found");
					return;
				}
				console.log("8");
				gameService.setOpponent({
					id: 2,
					address: opponent.toString(),
					guesses: [],
				});
				console.log("9");
				setPlayersSet(true);
				console.log("10");
			}
		};
		const intervalId = setInterval(loadOnboard, 5000);
		return () => clearInterval(intervalId);
	}, [gameService, invitationLink, numer0nContractService, numer0nClient]);

	useEffect(() => {
		if (playersSet) {
			// Navigate to the desired route when playersSet is true
			navigate("/game"); // Replace "/game" with your target route
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

		if (!gameService) {
			console.log("gameService not found");
			setError("gameService not found");
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

		const numer0nContractService = new Numer0nContractService(
			wallet,
			gameService,
			contractAddress.toString()
		);
		const numer0nClient = new Numer0nClient(numer0nContractService);
		await numer0nClient.registerGameRequest(
			gameCode,
			contractAddress.toString()
		);
		await numer0nClient.connect();

		// gameService.setGamePort(port);
		gameService.setGameCode(gameCode);
		gameService.setContractAddress(contractAddress.toString());
		gameService.setSelf({
			id: 1,
			address: wallet.getAddress().toString(),
			guesses: [],
		});

		// const invitationUrl = `${window.location.origin}/invite?secret=${gameCode}&port=${port}`;
		const invitationUrl = `${window.location.origin}/invite?secret=${gameCode}`;
		setInvitationLink(invitationUrl);

		setNumer0nClient(numer0nClient);
		setNumer0nService(numer0nContractService);

		setIsGameCreated(true);
		setLoadingCreate(false);
	}

	useEffect(() => {
		if (!inviteLinkInput) return;
		try {
			const url = new URL(inviteLinkInput);
			const secret = url.searchParams.get("secret");
			if (secret) {
				navigate(`/invite?secret=${secret}`);
			} else {
				setError("Invalid invite link format.");
			}
		} catch (error) {
			setError("Invalid invite link format.");
		}
	}, [inviteLinkInput, navigate]);

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
				<Center style={{ flexDirection: "column", textAlign: "center" }}>
					{!isGameCreated && (
						<Button
							style={{ textAlign: "center" }}
							onClick={handleCreateNewGame}
							loading={loadingCreate}
						>
							Create a new game
						</Button>
					)}
					<TextInput
						color="black"
						label="Have Invite Link? Paste it below"
						mt={25}
						onChange={(e) => setInviteLinkInput(e.currentTarget.value)}
						style={{
							width: "100%",
							maxWidth: 400,
						}}
						styles={{
							label: {
								marginBottom: "12px", // Adjust the space as needed
							},
							input: {
								backgroundColor: "rgba(255, 255, 255, 0.1)",
								border: "none",
								borderBottom: "1px solid gray",
								borderRadius: 0,
								color: "black", // Optional: Customize text color for better visibility

								"&:focus": {
									borderColor: "#80bdff", // Optional: Customize focus border color
									boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)", // Optional: Customize focus shadow
								},
							},
						}}
					/>
					{error && (
						<Text mt={10} color="red">
							{error}
						</Text>
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
