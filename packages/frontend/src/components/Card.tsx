import { Grid, Card as MantineCard } from "@mantine/core";

type CardType = {
	num: number;
	isSelf: boolean;
};
export default function Card(props: CardType) {
	const CardStyle: React.CSSProperties = props.isSelf
		? { fontSize: "25px", textAlign: "center", color: "#4169e1" }
		: { fontSize: "25px", textAlign: "center", color: "#dd227f" };

	return (
		<Grid.Col span={4}>
			<MantineCard style={CardStyle} shadow="sm" radius="lg" withBorder>
				{props.num == null ? "?" : props.num}
			</MantineCard>
		</Grid.Col>
	);
}
