import { Group, Text, Button, Anchor } from "@mantine/core";
import { useEffect, useState } from "react";
import { usePXE } from "../hooks/usePXE";
import imgGithub from "../../public/github-mark.png";
import { Game, GAME_STATUS } from "src/services/game";
import { useNavigate } from "react-router-dom";
import { removeItem } from "src/scripts/storage";
import SetPXEModal from "./Modals/SetPXEModal";
import { useAccountContext } from "src/contexts/useAccountContext";
import { useGameContext } from "src/contexts/useGameContext";

export default function Header() {
	const { wallet, connectWallet, disconnectWallet } = useAccountContext();
	// const [gameData, setGameData] = useState<Game | null>(null);
	const { gameData, status } = useGameContext();
	const { pxe } = usePXE();
	const [isPXEModalOpen, setIsPXEModalOpen] = useState<boolean>(false);
	const navigate = useNavigate();

	// useEffect(() => {
	// 	const game = new Game();
	// 	setGameData(game);
	// }, []);

	useEffect(() => {
		const check = async () => {
			if (pxe) {
				console.log("pxe()", pxe);
				const info = await pxe?.getNodeInfo();
				console.log("info", info);
			}
		};

		check();
	}, [pxe]);

	const handleLeave = async () => {
		if (!gameData) {
			console.log("Something went wrong. GameData is null.");
			return;
		}
		await gameData.logout();
		await gameData.logout();
		navigate("/");
	};

	const handleConnectWallet = async () => {
		await connectWallet();
	};

	const handleDisconnectWallet = async () => {
		await disconnectWallet();
	};

	return (
		<Group py={5} mt={10} justify="space-between">
			<Text
				size="25px"
				ml={35}
				style={{ color: "black", fontFamily: "Verdana, sans-serif" }}
			>
				Numer0n
			</Text>

			<Group>
				<Anchor
					href="https://github.com/abstract-crypto/numer0n/blob/main/RuleBook.md"
					target="_blank"
					rel="noreferrer"
					mr={10}
				>
					<Text c={"black"} style={{ textDecoration: "underline" }}>
						RuleBook
					</Text>
				</Anchor>
				<Anchor
					href="https://github.com/abstract-crypto/numer0n"
					target="_blank"
					rel="noreferrer"
					mt={8}
					mr={10}
				>
					<img src={imgGithub} alt="github" style={{ width: 25, height: 25 }} />
				</Anchor>
				{status !== GAME_STATUS.STARTED && (
					<>
						<Button
							variant="filled"
							color="teal"
							onClick={() => setIsPXEModalOpen(true)}
						>
							PXE
						</Button>
						{wallet === undefined ? (
							<Button variant="filled" onClick={handleConnectWallet}>
								Connect
							</Button>
						) : (
							<Button
								variant="filled"
								color="indigo"
								onClick={handleDisconnectWallet}
							>
								Disconnect
							</Button>
						)}
					</>
				)}
				<Button
					onClick={handleLeave}
					mr={35}
					style={{ backgroundColor: "gray" }}
				>
					Leave
				</Button>
			</Group>
			<SetPXEModal
				isOpen={isPXEModalOpen}
				onClose={() => setIsPXEModalOpen(false)}
			/>
		</Group>
	);
}
