use dep::aztec::protocol_types::traits::{Deserialize, Serialize};
use dep::aztec::prelude::AztecAddress;
// game status
// 0: null
// 1: setup ( both players are added )
// 2: started ( number set )
// 3: finished

global GAME_STATUS_NULL: u32 = 0;
global GAME_STATUS_PLAYERS_SET: u32 = 1;
global GAME_STATUS_STARTED: u32 = 2;
global GAME_STATUS_FINISHED: u32 = 3;

pub struct Players {
    player1: AztecAddress,
    player2: AztecAddress
}

pub struct Game {
    secret_num_count: u32,
    status: u32,
    round: u32,
    is_first: bool,
    winner_id: u32,
    players: Players
}

global GAME_SERIALIZED_LEN: u32 = 7;

impl Deserialize<GAME_SERIALIZED_LEN> for Game {
    fn deserialize(fields: [Field; GAME_SERIALIZED_LEN]) -> Self {

        let players = Players {
            player1: AztecAddress::from_field(fields[5]),
            player2: AztecAddress::from_field(fields[6])
        };

        Game { 
          secret_num_count: fields[0] as u32,
          status: fields[1] as u32,
          round: fields[2] as u32,
          is_first: fields[3] as bool,
          winner_id: fields[4] as u32,
          players: players
        }
    }
}

impl Serialize<GAME_SERIALIZED_LEN> for Game {
    fn serialize(self) -> [Field; GAME_SERIALIZED_LEN] {
        [
            self.secret_num_count as Field,
            self.status as Field,
            self.round as Field,
            self.is_first as Field,
            self.winner_id as Field,
            self.players.player1.to_field(),
            self.players.player2.to_field()
        ]
    }
}