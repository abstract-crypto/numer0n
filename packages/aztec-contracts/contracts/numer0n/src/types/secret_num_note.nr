use dep::aztec::{
    keys::getters::{get_nsk_app, get_public_keys},
    macros::notes::note,
    note::utils::compute_note_hash_for_nullify,
    oracle::debug_log::{debug_log, debug_log_format},
    protocol_types::{
        constants::GENERATOR_INDEX__NOTE_NULLIFIER,
        hash::poseidon2_hash_with_separator,
        traits::{Deserialize, Serialize},
    },
};
use dep::aztec::prelude::{AztecAddress, NoteHeader, NullifiableNote, PrivateContext};
use dep::aztec::protocol_types::abis::function_selector::FunctionSelector;

global SECRET_NUM_NOTE_LEN: u32 = 2;

#[note]
#[derive(Serialize, Deserialize)]
struct SecretNumberNote {
    secret_num: u32,
    owner: AztecAddress, 
    header: NoteHeader,
}

impl SecretNumberNote {
    pub fn new(secret_num: u32, owner: AztecAddress) -> Self {
        SecretNumberNote { secret_num, owner, header: NoteHeader::empty() }
    }
}

impl NullifiableNote for SecretNumberNote {

    fn compute_nullifier(
        self,
        context: &mut PrivateContext,
        note_hash_for_nullify: Field,
    ) -> Field {
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = context.request_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [note_hash_for_nullify, secret],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }

    unconstrained fn compute_nullifier_without_context(self) -> Field {
        let note_hash_for_nullify = compute_note_hash_for_nullify(self);
        let owner_npk_m_hash: Field = get_public_keys(self.owner).npk_m.hash();
        let secret = get_nsk_app(owner_npk_m_hash);
        poseidon2_hash_with_separator(
            [note_hash_for_nullify, secret],
            GENERATOR_INDEX__NOTE_NULLIFIER as Field,
        )
    }
}
