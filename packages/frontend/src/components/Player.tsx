import { Grid } from "@mantine/core";
import { useState, useEffect } from "react";
import Card from "./Card";
import { useGameContext } from "../contexts/useGameContext";
import { numLen } from "../scripts/constants";
import { paddHeadZero } from "../scripts/utils";

type PlayerType = { isSelf: boolean; opponentSecretNum: string };

export default function Player(props: PlayerType) {
	const { gameData } = useGameContext();
	if (!gameData) return null;

	const [nums, setNums] = useState<number[]>(Array(numLen).fill(null));
	const [opponentNums, setOpponentNums] = useState<number[]>(
		Array(numLen).fill(null)
	);

	// Add opponent secret num
	useEffect(() => {
		(async () => {
			if (props.opponentSecretNum != "") {
				const arrayNum = props.opponentSecretNum
					.split("")
					.map((num) => parseInt(num, 10));

				if (Number(props.opponentSecretNum) < 100) {
					paddHeadZero(arrayNum);
				}

				setOpponentNums(arrayNum);
			}
		})();
	}, [props.opponentSecretNum]);

	// Add secret num
	useEffect(() => {
		(async () => {
			if (props.isSelf && gameData.getSelf().secretNumber != undefined) {
				const arrayNum = gameData
					.getSelf()
					.secretNumber!.toString()
					.split("")
					.map((num) => parseInt(num, 10));

				if (gameData.getSelf().secretNumber! < 100) {
					paddHeadZero(arrayNum);
				}
				setNums(arrayNum);
			}
		})();
	}, [props.isSelf, gameData.getSelf().secretNumber]);

	return (
		<>
			{props.isSelf ? (
				<Grid mb={5}>
					{nums.map((_, i) => {
						return <Card key={i} num={nums[i]} isSelf={props.isSelf} />;
					})}
				</Grid>
			) : (
				<Grid mb={5}>
					{opponentNums.map((_, i) => {
						return <Card key={i} num={opponentNums[i]} isSelf={props.isSelf} />;
					})}
				</Grid>
			)}
		</>
	);
}
