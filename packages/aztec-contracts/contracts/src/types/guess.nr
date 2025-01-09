use dep::aztec::protocol_types::traits::{Deserialize, Serialize};

global GUESS_SERIALIZED_LEN: u32 = 6;

global GUESS_STATUS_NULL: u32 = 0;
global GUESS_STATUS_GUESSED: u32 = 1;
global GUESS_STATUS_EVALUATED: u32 = 2;

struct Guess {
    guess_num: u32,
    eat: u32,
    bite: u32,
    item: Field,
    item_result: Field,
    status: u32
}

impl Guess {
    pub fn new(guess_num: u32, eat: u32, bite: u32, item: Field, item_result: Field) -> Self {
        Guess { 
            guess_num: guess_num,
            eat: eat,
            bite: bite,
            item: item,
            item_result: item_result,
            status: GUESS_STATUS_NULL
        }
    } 

    pub fn empty() -> Self {
        Guess { 
            guess_num: 0, 
            eat: 0, 
            bite: 0, 
            item: 0, 
            item_result: 0, 
            status: GUESS_STATUS_NULL 
        }
    }
}

impl Deserialize<GUESS_SERIALIZED_LEN> for Guess {
    fn deserialize(fields: [Field; GUESS_SERIALIZED_LEN]) -> Self {
        Guess { 
            guess_num: fields[0] as u32, 
            eat: fields[1] as u32, 
            bite: fields[2] as u32,
            item: fields[3],
            item_result: fields[4],
            status: fields[5] as u32
        }
    }
}

impl Serialize<GUESS_SERIALIZED_LEN> for Guess {
    fn serialize(self) -> [Field; GUESS_SERIALIZED_LEN] {
        [self.guess_num as Field, self.eat as Field, self.bite as Field, self.item, self.item_result, self.status as Field]
    }
}