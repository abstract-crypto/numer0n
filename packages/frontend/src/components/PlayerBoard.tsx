import { Text, Stack } from "@mantine/core";
import { Player } from "src/components";
import { useGameContext } from "src/contexts";
import { shortenAddress } from "src/scripts";

type PlayerBoardType = {
	isSelf: boolean;
	opponentSecretNum: number | null;
};

export default function PlayerBoard(props: PlayerBoardType) {
	const { gameService } = useGameContext();

	if (!gameService) return null;

	return (
		<>
			<Stack mb={10} px={10} py={10}>
				{props.isSelf ? (
					<Text mt={5} ml={10}>
						{" "}
						You : {shortenAddress(gameService.getSelf().address)}{" "}
					</Text>
				) : (
					<Text
						mt={5}
						mr={10}
						style={{ display: "flex", justifyContent: "flex-end" }}
					>
						{" "}
						Opp : {shortenAddress(gameService.getOpponent().address)}{" "}
					</Text>
				)}
				<Player
					isSelf={props.isSelf}
					opponentSecretNum={props.opponentSecretNum}
				/>
			</Stack>
		</>
	);
}
