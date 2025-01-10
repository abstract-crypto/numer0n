import { Grid } from "@mantine/core";
import { useState, useEffect } from "react";
import Card from "./Card";
import { useGameContext } from "../contexts";
import { numLen } from "../scripts/constants";
import { paddHeadZero, stringfyAndPaddZero } from "../scripts/utils";

type PlayerType = { isSelf: boolean; opponentSecretNum: number | null };

export default function Player(props: PlayerType) {
	const { gameService } = useGameContext();
	if (!gameService) return null;

	const [nums, setNums] = useState<number[]>(Array(numLen).fill(null));
	const [opponentNums, setOpponentNums] = useState<number[]>(
		Array(numLen).fill(null)
	);

	// Add opponent secret num
	useEffect(() => {
		(async () => {
			if (props.opponentSecretNum != null) {
				const arrayNum = stringfyAndPaddZero(props.opponentSecretNum)
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
			if (props.isSelf && gameService.getSelf().secretNumber != undefined) {
				const arrayNum = gameService
					.getSelf()
					.secretNumber!.toString()
					.split("")
					.map((num: string) => parseInt(num, 10));

				if (gameService.getSelf().secretNumber! < 100) {
					paddHeadZero(arrayNum);
				}
				setNums(arrayNum);
			}
		})();
	}, [props.isSelf, gameService.getSelf().secretNumber]);

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
