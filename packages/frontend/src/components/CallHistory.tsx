import { Loader, Center, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useGameContext } from "src/contexts/useGameContext";
import { emptyRows, ResultRow } from "src/hooks/useGame";

type CallHistoryType = {
	isSelf: boolean;
};

export default function CallHistory(props: CallHistoryType) {
	const { gameData, resultRowsSelf, resultRowsOpponent, loadHistry } =
		useGameContext();
	const [resultRows, setResultRows] = useState<ResultRow[]>(emptyRows);

	useEffect(() => {
		setResultRows(props.isSelf ? resultRowsSelf : resultRowsOpponent);
	}, [resultRowsSelf, resultRowsOpponent]);

	// load from local storage After refresh
	useEffect(() => {
		(async () => {
			if (!gameData) {
				console.log("game not found");
				return [];
			}
			await loadHistry(props.isSelf, true);
		})();
	}, [props.isSelf, gameData]);

	const getCellStyle = (zero: boolean) => {
		return {
			border: "1px solid #ddd",
			padding: "10px",
			fontSize: "16px",
			backgroundColor: zero ? "#F4F4F3" : "transparent",
			textAlign: "center" as const,
		};
	};

	const tableRows = resultRows.map((row, index) => (
		<tr key={index}>
			<td style={getCellStyle(row.guess == "")}>{row.guess}</td>
			<td style={getCellStyle(row.eat == "" && row.bite == "")}>
				{row.eat != null && row.bite != null ? row.eat + " - " + row.bite : ""}
			</td>
			{/* <td style={cellStyle}>
				{item(row.item)}{" "}
				{row.item == 1
					? " : " + HighLow(row.item_result)
					: row.item == 2
					? " : " + row.item_result.toString()
					: row.item == 3
					? "" + Target(row.item_result)
					: null}
			</td> */}
		</tr>
	));

	if (tableRows.length === 0)
		return (
			<Center my={100}>
				<Loader size="sm" />
			</Center>
		);

	return (
		<>
			{props.isSelf ? (
				<Table bg={"white"} striped highlightOnHover>
					<thead>
						<tr
							style={{
								fontSize: "15px",
								backgroundColor: "#4169e1",
								color: "white",
							}}
						>
							<th style={{ padding: "10px", borderTopLeftRadius: "5px" }}>
								Your guess
							</th>
							<th style={{ padding: "10px" }}>Eat - Bite</th>
							{/* <th style={{ padding: "10px", borderTopRightRadius: "5px" }}>
								Item
							</th> */}
						</tr>
					</thead>
					<tbody style={{ textAlign: "center" }}>{tableRows}</tbody>
				</Table>
			) : (
				<Table bg={"white"} striped highlightOnHover>
					<thead>
						<tr
							style={{
								fontSize: "15px",
								backgroundColor: "#dd227f",
								color: "white",
							}}
						>
							<th
								style={{
									padding: "10px",
									borderTopLeftRadius: "5px",
								}}
							>
								Opp's guess
							</th>
							<th style={{ padding: "10px" }}>Eat - Bite</th>
							{/* <th style={{ padding: "10px", borderTopRightRadius: "5px" }}>
								Item
							</th> */}
						</tr>
					</thead>
					<tbody
						style={{
							textAlign: "center",
						}}
					>
						{tableRows}
					</tbody>
				</Table>
			)}
		</>
	);
}
