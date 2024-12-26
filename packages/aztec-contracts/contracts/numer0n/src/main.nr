use dep::aztec::macros::aztec;
mod types;
// mod item_lib;
mod num_lib;

// VERSION=0.67.0 aztec-nargo compile
// rm codegenCache.json && VERSION=0.67.0 aztec codegen ./ -o ../../src/artifacts

#[aztec]
contract Numer0n {
    use dep::std;
    use dep::aztec::{
        encrypted_logs::encrypted_note_emission::encode_and_encrypt_note,
        keys::getters::get_public_keys,
        macros::{functions::{initializer, internal, noinitcheck, private, public, view}, storage::storage},
        oracle::debug_log::{debug_log, debug_log_format},
        prelude::{AztecAddress, Map, PublicContext, PrivateContext, PrivateMutable, PrivateImmutable},
        state_vars::{PublicMutable, PublicImmutable},
    };

    use dep::authwit::auth::{
        assert_current_call_valid_authwit, 
        assert_current_call_valid_authwit_public
    };

    use crate::num_lib;
    // use crate::item_lib;

    use crate::types::{
        secret_num_note::{SecretNumberNote, SECRET_NUM_NOTE_LEN},
        player::Player,
        guess::{Guess, GUESS_STATUS_NULL, GUESS_STATUS_GUESSED, GUESS_STATUS_EVALUATED},
        game::{Game, Players, GAME_STATUS_NULL, GAME_STATUS_PLAYERS_SET, GAME_STATUS_STARTED, GAME_STATUS_FINISHED},
    };

    // storage
    #[storage]
    struct Storage<Context> {
        secret_game_code_hash: PublicImmutable<Field, Context>,
        players: Map<AztecAddress, PublicMutable<Player, Context>, Context>,
        secret_num: Map<AztecAddress, PrivateMutable<SecretNumberNote, Context>, Context>, 
        guesses: Map<u32, Map<AztecAddress, PublicMutable<Guess, Context>, Context>, Context>,
        game: PublicMutable<Game, Context>,
    }
    
    // docs:start:constructor
    #[private]
    #[initializer]  
    fn constructor(player: AztecAddress, secret_game_code: Field) {
        assert(secret_game_code != 0, "[constructor] secret_game_code zero");

        let secret_game_code_hash = std::hash::poseidon2::Poseidon2::hash([secret_game_code], 1);
        Numer0n::at(context.this_address())._add_player(player, 1, secret_game_code_hash).enqueue(&mut context);

        Numer0n::at(context.this_address())._add_secret_num_hash(secret_game_code_hash).enqueue(&mut context);
    }

    #[private]
    fn join_game(player: AztecAddress, secret_game_code: Field) {
        assert(secret_game_code != 0, "[join_game] secret_game_code zero");
        assert(context.msg_sender().to_field() == player.to_field(), "[join_game] invalid player");

        let secret_game_code_hash = std::hash::poseidon2::Poseidon2::hash([secret_game_code], 1);
        Numer0n::at(context.this_address())._add_player(player, 2, secret_game_code_hash).enqueue(&mut context);
    }

    #[private]
    fn add_num(player: AztecAddress, secret_num: u32) {
        let sender = context.msg_sender();
        let this = context.this_address();  
        assert(sender == player, "[add_num] sender must be player");
    
        num_lib::is_valid_nums(secret_num);
        let mut secret_num_note = SecretNumberNote::new(secret_num, player);
        storage.secret_num.at(player).initialize(&mut secret_num_note).emit(encode_and_encrypt_note(&mut context, player, player));

        Numer0n::at(this)._assert_is_player(player).enqueue(&mut context);
        Numer0n::at(this)._add_num(player).enqueue(&mut context);
    }

    #[public]
    fn guess_num(player: AztecAddress, guess_num: u32) {
        assert(context.msg_sender().to_field() == player.to_field(), "[guess_num] sender must be player");
        assert(storage.game.read().status == GAME_STATUS_STARTED, "[guess_num] game hasn't been started yet");
        num_lib::is_valid_nums(guess_num);

        let game = storage.game.read();
        let player_id = storage.players.at(player).read().player_id;
        if (player_id == 1) {
            assert(game.is_first, "[guess_num] invalid turn for player 1");
        } else {
            assert(!game.is_first, "[guess_num] invalid turn for player 2");
        };

        let mut guess = storage.guesses.at(game.round).at(player).read();
        assert(guess.status == GUESS_STATUS_NULL, "[guess_num] guess has already been made");
        guess.status = GUESS_STATUS_GUESSED;
        guess.guess_num = guess_num;
        storage.guesses.at(game.round).at(player).write(guess);
    }

    // player: who guessed
    // guesser: who guesses, player's opponent
    #[private]
    fn evaluate_guess(guessed: AztecAddress, guesser: AztecAddress, guess_num: u32) {
        // replaced if-else with assert as it leads to an errror at get_note()
        let sender = context.msg_sender();
        assert(guessed == sender, "sender should be guessed");
        assert(guesser != sender, "sender shouldn't be guesser");
        // assert_current_call_valid_authwit(&mut context, guesser);

        let secret_num_emission = storage.secret_num.at(guessed).get_note();
        secret_num_emission.emit(encode_and_encrypt_note(&mut context, sender, sender));
        let mut secret_num = secret_num_emission.note.secret_num;
        
        let result = num_lib::check_result(guess_num, secret_num);

        Numer0n::at(context.this_address())._validate_guess(guessed, guesser, guess_num, result[0], result[1]).enqueue(&mut context);
    }

    // #[private]
    // fn use_attack_item(target: AztecAddress, item_type: Field, _target_num: Field) {
    //     assert(target != context.msg_sender(), "caller shouldn't be target");
    //     assert_current_call_valid_authwit(&mut context, target);

    //     let mut result: Field = 0;
    //     if (item_type == item_lib::ITEM_HIGH_LOW) {
    //         result = item_lib::get_high_and_low(storage.secret_num.at(target.to_field()));
    //     } else if (item_type == item_lib::ITEM_SLASH) {
    //         result = item_lib::get_slash(storage.secret_num.at(target.to_field()));
    //     } else if (item_type == item_lib::ITEM_TARGET) {
    //         assert(_target_num as u32 < 10, "invalid target_num");
    //         result = item_lib::get_target(storage.secret_num.at(target.to_field()), _target_num);
    //     } else {
    //         assert(false, "inavlid item type");
    //     }

    //     // records results
    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_record_item_result(Field,Field,Field)"),
    //         [context.msg_sender().to_field(), item_type, result]
    //     );
    // }

    // the following functinon `use_defense_item` is commented out and unused atm.
    // instead, there are two separate funcs for use_defense_item: change and shuffle
    // this is because if-else chain messes things up, causing 

    // #[private]
    // fn use_defense_item(player: AztecAddress, item_type: Field, new_secret_num: Field) {
    //     assert(context.msg_sender().to_field() == player, "invalid player");

    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_assert_is_player(Field)"),
    //         [player]
    //     );

    //     num_lib::is_valid_nums(new_secret_num);

    //     // let secret_num_note = storage.secret_num.at(player).get_note(true);
    //     let secret_num_note = storage.secret_num.at(player).get_note(false);
    //     let secret_num = secret_num_note.secret_num;

    //     let mut ret: bool = false;
    //     if (item_type == item_lib::ITEM_CHANGE) {
    //        let ret = item_lib::is_valid_changed_num(secret_num, new_secret_num);
    //        assert(ret, "invalid num for change");
    //     } else if (item_type == item_lib::ITEM_SHUFFLE) {
    //        let ret = item_lib::is_valid_new_shuffled_num(secret_num, new_secret_num);
    //        assert(ret, "invalid num for shuffule");
    //     } else {
    //        assert(false, "inavlid item type");
    //     }

    //     let mut new_secret_num_note = SecretNumberNote::new(new_secret_num, AztecAddress::from_field(player));
    //     storage.secret_num.at(player).replace(&mut new_secret_num_note, true);

    //     // records results
    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_record_item_result(Field,Field,Field)"),
    //         [context.msg_sender().to_field(), item_type, 0]
    //     );
    // }

    // #[private]
    // fn use_change(player: AztecAddress, new_secret_num: Field) {
    //     assert(context.msg_sender().to_field() == player, "invalid player");

    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_assert_is_player(Field)"),
    //         [player]
    //     );

    //     num_lib::is_valid_nums(new_secret_num);

    //     let secret_num_note = storage.secret_num.at(player).get_note(false);
    //     let secret_num = secret_num_note.secret_num;
    //     let ret = item_lib::is_valid_changed_num(secret_num, new_secret_num);
    //     assert(ret, "invalid num for change");

    //     let mut new_secret_num_note = SecretNumberNote::new(new_secret_num, AztecAddress::from_field(player));
    //     storage.secret_num.at(player).replace(&mut new_secret_num_note, true);

    //     // records results
    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_record_item_result(Field,Field,Field)"),
    //         [context.msg_sender().to_field(), item_lib::ITEM_CHANGE, 0]
    //     );
    // }

    // #[private]
    // fn use_shuffle(player: AztecAddress, new_secret_num: Field) {
    //     assert(context.msg_sender().to_field() == player, "invalid player");

    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_assert_is_player(Field)"),
    //         [player]
    //     );

    //     num_lib::is_valid_nums(new_secret_num);
        
    //     let secret_num_note = storage.secret_num.at(player).get_note(false);
    //     let secret_num = secret_num_note.secret_num;
    //     let ret = item_lib::is_valid_new_shuffled_num(secret_num, new_secret_num);
    //     assert(ret, "invalid num for shuffle");

    //     let mut new_secret_num_note = SecretNumberNote::new(new_secret_num, AztecAddress::from_field(player));
    //     storage.secret_num.at(player).replace(&mut new_secret_num_note, true);

    //     // records results
    //     context.call_public_function(
    //         context.this_address(),
    //         FunctionSelector::from_signature("_record_item_result(Field,Field,Field)"),
    //         [context.msg_sender().to_field(), item_lib::ITEM_SHUFFLE, 0]
    //     );
    // }

    // #[public]
    // #[internal]
    // fn _record_item_result(_caller: Field, _item_type: Field, _item_result: Field) {
    //     assert(storage.game.read().started, "game hasn't been started yet");
    //     assert(!storage.game.read().finished, "game has already been finished");

    //     let player_id = storage.players.at(_caller).read().player_id;
    //     let mut game = storage.game.read();
    //     let current_round = game.round;

    //     if (player_id == 1) {
    //         assert(game.is_first, "invalid turn for player 1");
    //         let mut result_one = storage.results_one.at(current_round).read();
    //         assert(result_one.call_num == 0, "item should be used before call");
    //         assert(result_one.item == 0, "an item has already been used");
    //         result_one.item = _item_type;
    //         result_one.item_result = _item_result;
    //         storage.results_one.at(current_round).write(result_one);
    //     } else if (player_id == 2) {
    //         assert(!game.is_first, "invalid turn for player 2");
    //         let mut result_two = storage.results_two.at(current_round).read();
    //         assert(result_two.call_num == 0, "item should be used before call");
    //         assert(result_two.item == 0, "an item has already been used");
    //         result_two.item = _item_type;
    //         result_two.item_result = _item_result;
    //         storage.results_two.at(current_round).write(result_two);
    //     } else {
    //         assert(false, "invalid player");
    //     }
    // }

    #[public]
    #[internal]
    fn _validate_guess(_guessed: AztecAddress, _guesser: AztecAddress, _guess_num: u32, _eat: u32, _bite: u32) {
        let mut game = storage.game.read();
        assert(game.status == GAME_STATUS_STARTED, "game hasn't been started yet");
        let current_round = game.round;

        let mut guess = storage.guesses.at(current_round).at(_guesser).read();
        assert(_guess_num == guess.guess_num, "invalid guess_num");

        guess.eat = _eat;
        guess.bite = _bite;
        guess.status = GUESS_STATUS_EVALUATED;
        storage.guesses.at(current_round).at(_guesser).write(guess);

        // p1 guesser, p2 guessed, first, sender = guessed
        // p2 guesser, p1 guessed, not first, sender = guessed

        let player_id = storage.players.at(_guesser).read().player_id; // 2 or 1
        if (player_id == 1) {
            assert(game.is_first, "invalid turn for player 1");
            game.is_first = false;
        } else {
            assert(!game.is_first, "invalid turn for player 2");

            // check if either of the players win
            // _eat: p2's last eat
            // p1_eat: p1's last eat
            let p1_eat = storage.guesses.at(current_round).at(_guessed).read().eat;
            if ((_eat == 3) | (p1_eat == 3)) {
                game.status = GAME_STATUS_FINISHED;
                if ((p1_eat == 3) & (_eat != 3)) {
                    game.winner_id = 1 as u32;
                } else if ((p1_eat != 3) & (_eat == 3)) {
                    game.winner_id = 2 as u32;
                } else {
                    game.winner_id = 3 as u32;
                }
            } else {
                game.is_first = true;
                game.round = current_round + 1;
            }
        }

        storage.game.write(game);
    }

    #[public]
    #[internal]
    fn _assert_is_player(_player: AztecAddress) {
        assert(storage.players.at(_player).read().is_player, "[_assert_is_player] not player");
    }

    #[public] 
    #[internal]
    fn _add_player(_player: AztecAddress, _player_id: Field, secret_game_code_hash: Field) {
        assert(_player != AztecAddress::zero(), "[_add_player] invalid player address");

        let mut player = storage.players.at(_player).read();
        assert(!player.is_player, "[_add_player] player already exists");

        player.player_id = _player_id;
        player.is_player = true;
        storage.players.at(_player).write(player);
        
        let mut game = storage.game.read();
         if (_player_id == 1) {
            game.players.player1 = _player;
        } else {
            let stored_secret_game_code_hash = storage.secret_game_code_hash.read();
            assert(secret_game_code_hash == stored_secret_game_code_hash, "[_add_player] invalid secret_game_code");
            assert(game.status == GAME_STATUS_NULL, "[_add_player] game hasn't been setup");
            game.status = GAME_STATUS_PLAYERS_SET;
            game.players.player2 = _player;
        }
        storage.game.write(game);
    }

    #[public] 
    #[internal]
    fn _add_secret_num_hash(secret_game_code_hash: Field) {
        storage.secret_game_code_hash.initialize(secret_game_code_hash);
    }

    #[public] 
    #[internal]
    fn _add_num(_player: AztecAddress) {
        let mut game = storage.game.read();
        assert(game.status == GAME_STATUS_PLAYERS_SET, "[_add_num] game.status != GAME_STATUS_PLAYERS_SET");

        game.secret_num_count = game.secret_num_count + 1;

        if (game.secret_num_count == 2) {
            game.status = GAME_STATUS_STARTED;
            game.round = 1;
            game.is_first = true;
        }
        storage.game.write(game);
    }

    unconstrained fn get_player(player: AztecAddress) -> pub Player {
        storage.players.at(player).read()
    }

    unconstrained fn get_winner() -> pub u32 {
       storage.game.read().winner_id
    }

    // for testing purpose
    // q: how to only allow note an owner to view her own secret num
    unconstrained fn get_secret_num(player: AztecAddress) -> pub u32 {
        let note = storage.secret_num.at(player).view_note();
        note.secret_num
    }

    unconstrained fn get_guess(player: AztecAddress, round: u32) -> pub Guess {
        storage.guesses.at(round).at(player).read()
    }

    unconstrained fn get_guesses(player: AztecAddress) -> pub [Guess; 10] {
        let mut guesses: [Guess; 10] = [Guess::empty(); 10];
        let round = storage.game.read().round;
        for i in 0..10 {
            if (i < round) {
                guesses[i] = storage.guesses.at(i + 1).at(player).read();
            }
        }
        guesses
    }

    unconstrained fn get_round() -> pub u32 {
        storage.game.read().round
    }

    unconstrained fn get_is_first() -> pub bool {
        storage.game.read().is_first
    }

    unconstrained fn get_game() -> pub Game {
        storage.game.read()
    }

    unconstrained fn get_players() -> pub Players {
        storage.game.read().players
    }

    // // for testing purpose
    // unconstrained fn get_high_and_low(num: Field) -> pub Field {
    //     item_lib::_get_high_and_low(num)
    // }

    // // for testing purpose
    // unconstrained fn get_slash(num: Field) -> pub Field {
    //     item_lib::_get_slash(num)
    // }

    // // for testing purpose
    // unconstrained fn get_target(num: Field, target_num:Field) -> pub Field {
    //     item_lib::_get_target(num, target_num)
    // }
    
    // // for testing purpose
    // unconstrained fn is_valid_new_changed_num(num: Field, new_num: Field) -> pub bool {
    //     item_lib::_is_valid_changed_num(num, new_num)
    // }

    // // for testing purpose
    // unconstrained fn is_valid_new_shuffled_num(num: Field, new_num: Field) -> pub bool {
    //     item_lib::_is_valid_new_shuffled_num(num, new_num)
    // }


    unconstrained fn check_result(guess_num: u32, secret_num: u32) -> pub [u32; 2] {
        num_lib::_check_result(guess_num, secret_num)
    }

    unconstrained fn is_valid_nums(_num: u32) -> pub [u32; 3] {
        num_lib::_is_valid_nums(_num)
    }
}
