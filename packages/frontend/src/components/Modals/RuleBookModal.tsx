import { Box, Modal, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";

const markdown = `
   ## What is Numer0n?
   Numer0n is a strategic number-guessing game in which two players compete to guess the opponent's 3-digit secret numbers first.

   ## Basics
   - The secret number set by each player consists of 3 digits (0-9) with no duplication, e.g. 013, 591, 854, etc...
   - Players take turns and guess once at their turn in each round.
   - At each guess, a feedback is given for each digit:
      - Eat: Both the digit and its position are correct.
      - Bite: The digit is included in the opp's secret number, but the position is incorrect.
      - E.g. If one's secret number is 154 and a guess is 524, the result is 1-1 ( 1 eat & 1 bite ).
   - The one who correctly guesses the opponent's secret number, i.e. 3-0, first wins.
   - The game is a draw if both players correctly gets 3-0 in the same round.
   - The one who creates the game is the first guesser.

   ## How it works
   - Each players' secret number is stored on private state only visible to the owners.
   - Each guessing involves in separate actions (tx) from both players 
      1. the guesser commits their guess to the Numer0ncontract
      2. the guessed compares the guess number with their secret number
   - The guesser can only see the result of the guess, i.e. Eat and Bite, not the secret number.
    `;

type RuleBookModalType = {
	isOpen: boolean;
	onClose: () => void;
};

function RuleBookModal({ isOpen, onClose }: RuleBookModalType) {
	return (
		<Modal
			size="xl"
			opened={isOpen}
			onClose={onClose}
			withCloseButton={true}
			centered
		>
			<Box px={20} pb={10} style={{ marginTop: "-30px" }}>
				<ReactMarkdown>{markdown}</ReactMarkdown>
			</Box>

			<Text my={10} ta={"center"} c={"dimmed"}>
				Powered by Aztec's Hybrid State Model
			</Text>
		</Modal>
	);
}

export default RuleBookModal;
