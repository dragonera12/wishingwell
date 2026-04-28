#![no_std]
use soroban_sdk::{contract, contractimpl, Env, String, Address, vec, Vec};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn toss(env: Env, from: Address, wish: String) -> Vec<String> {
        from.require_auth();
        vec![&env, String::from_str(&env, "Wish immortalized:"), wish]
    }
}

mod test;
