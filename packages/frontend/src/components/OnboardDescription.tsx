import { Box, Text } from "@mantine/core";

export default function OnboardDescription() {
	return (
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
				Numer0n is a number-guessing game built on Aztec Network.
			</Text>
		</Box>
	);
}
