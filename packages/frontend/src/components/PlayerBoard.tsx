import { Text, Stack } from "@mantine/core";
import Player from "./Player";
import { useState, useEffect } from "react";
import { useGameContext } from "../contexts/useGameContext";
import { shortenAddress } from "../scripts/utils";

type PlayerBoardType = {
	isSelf: boolean;
	opponentSecretNum: string;
};

export default function PlayerBoard(props: PlayerBoardType) {
	const { gameData } = useGameContext();

	if (!gameData) return null;

	return (
		<>
			<Stack mb={10} px={10} py={10}>
				{props.isSelf ? (
					<Text mt={5} ml={10}>
						{" "}
						You : {shortenAddress(gameData.getSelf().address)}{" "}
					</Text>
				) : (
					<Text
						mt={5}
						mr={10}
						style={{ display: "flex", justifyContent: "flex-end" }}
					>
						{" "}
						Opp : {shortenAddress(gameData.getOpponent().address)}{" "}
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
