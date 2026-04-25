#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};

#[contracttype]
pub enum TokenDataKey {
    Admin,
    Minter,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address),
    Name,
    Symbol,
    Decimals,
}

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        minter: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) -> bool {
        if env.storage().instance().has(&TokenDataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&TokenDataKey::Admin, &admin);
        env.storage().instance().set(&TokenDataKey::Minter, &minter);
        env.storage().instance().set(&TokenDataKey::Name, &name);
        env.storage().instance().set(&TokenDataKey::Symbol, &symbol);
        env.storage().instance().set(&TokenDataKey::Decimals, &decimals);
        env.storage().instance().set(&TokenDataKey::TotalSupply, &0i128);
        true
    }

    pub fn mint(env: Env, caller: Address, to: Address, amount: i128) -> bool {
        caller.require_auth();
        let minter: Address = env.storage().instance().get(&TokenDataKey::Minter).unwrap();
        if caller != minter {
            panic!("not authorized to mint");
        }

        let mut balance = Self::balance(env.clone(), to.clone());
        balance += amount;
        env.storage().persistent().set(&TokenDataKey::Balance(to.clone()), &balance);

        let mut total_supply: i128 = env.storage().instance().get(&TokenDataKey::TotalSupply).unwrap();
        total_supply += amount;
        env.storage().instance().set(&TokenDataKey::TotalSupply, &total_supply);

        env.events().publish(("token", symbol_short!("mint")), (to.clone(), amount));
        true
    }

    pub fn burn_from(env: Env, admin: Address, from: Address, amount: i128) -> bool {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&TokenDataKey::Admin).unwrap();
        if admin != current_admin {
            panic!("not authorized to burn");
        }

        let mut balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic!("insufficient balance");
        }
        balance -= amount;
        env.storage().persistent().set(&TokenDataKey::Balance(from.clone()), &balance);

        let mut total_supply: i128 = env.storage().instance().get(&TokenDataKey::TotalSupply).unwrap();
        total_supply -= amount;
        env.storage().instance().set(&TokenDataKey::TotalSupply, &total_supply);

        env.events().publish(("token", symbol_short!("burn")), (from.clone(), amount));
        true
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let mut from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }
        from_balance -= amount;
        env.storage().persistent().set(&TokenDataKey::Balance(from.clone()), &from_balance);

        let mut to_balance = Self::balance(env.clone(), to.clone());
        to_balance += amount;
        env.storage().persistent().set(&TokenDataKey::Balance(to.clone()), &to_balance);

        env.events().publish(("token", symbol_short!("transfer")), (from.clone(), to.clone(), amount));
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        let mut allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic!("insufficient allowance");
        }
        allowance -= amount;
        env.storage().persistent().set(&TokenDataKey::Allowance(from.clone(), spender.clone()), &allowance);

        let mut from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }
        from_balance -= amount;
        env.storage().persistent().set(&TokenDataKey::Balance(from.clone()), &from_balance);

        let mut to_balance = Self::balance(env.clone(), to.clone());
        to_balance += amount;
        env.storage().persistent().set(&TokenDataKey::Balance(to.clone()), &to_balance);

        env.events().publish(("token", symbol_short!("transfer")), (from.clone(), to.clone(), amount));
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, _expiration_ledger: u32) {
        from.require_auth();
        env.storage().persistent().set(&TokenDataKey::Allowance(from.clone(), spender.clone()), &amount);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().persistent().get(&TokenDataKey::Balance(id)).unwrap_or(0i128)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage().persistent().get(&TokenDataKey::Allowance(from, spender)).unwrap_or(0i128)
    }


    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TokenDataKey::TotalSupply).unwrap_or(0i128)
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&TokenDataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&TokenDataKey::Symbol).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&TokenDataKey::Decimals).unwrap()
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let mut balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic!("insufficient balance");
        }
        balance -= amount;
        env.storage().persistent().set(&TokenDataKey::Balance(from.clone()), &balance);

        let mut total_supply: i128 = env.storage().instance().get(&TokenDataKey::TotalSupply).unwrap();
        total_supply -= amount;
        env.storage().instance().set(&TokenDataKey::TotalSupply, &total_supply);

        env.events().publish(("token", symbol_short!("burn")), (from.clone(), amount));
    }

    pub fn set_admin(env: Env, admin: Address, new_admin: Address) {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&TokenDataKey::Admin).unwrap();
        if admin != current_admin {
            panic!("not authorized");
        }
        env.storage().instance().set(&TokenDataKey::Admin, &new_admin);
    }

    pub fn set_minter(env: Env, admin: Address, new_minter: Address) {
        admin.require_auth();
        let current_admin: Address = env.storage().instance().get(&TokenDataKey::Admin).unwrap();
        if admin != current_admin {
            panic!("not authorized");
        }
        env.storage().instance().set(&TokenDataKey::Minter, &new_minter);
    }
}
