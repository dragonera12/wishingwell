#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env};

mod token {
    soroban_sdk::contractimport!(file = "../target/wasm32v1-none/release/token.wasm");
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolConfig {
    pub token_a: Address,
    pub token_b: Address,
    pub lp_token: Address,
    pub fee_bps: u32,
    pub creator: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolReserves {
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub total_lp_supply: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapResult {
    pub amount_in: i128,
    pub amount_out: i128,
    pub fee_paid: i128,
    pub price_impact_bps: u32,
    pub new_reserve_a: i128,
    pub new_reserve_b: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityResult {
    pub amount_a: i128,
    pub amount_b: i128,
    pub lp_minted: i128,
}

#[contracttype]
pub enum PoolKey {
    Config,
    Reserves,
    SwapCount,
    VolumeA,
    VolumeB,
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    pub fn initialize(
        env: Env,
        creator: Address,
        token_a: Address,
        token_b: Address,
        lp_token: Address,
        fee_bps: u32,
    ) -> bool {
        if env.storage().instance().has(&PoolKey::Config) {
            panic!("already initialized");
        }
        let config = PoolConfig {
            token_a,
            token_b,
            lp_token,
            fee_bps,
            creator,
        };
        env.storage().instance().set(&PoolKey::Config, &config);
        env.storage().instance().set(
            &PoolKey::Reserves,
            &PoolReserves {
                reserve_a: 0,
                reserve_b: 0,
                total_lp_supply: 0,
            },
        );
        env.storage().instance().set(&PoolKey::SwapCount, &0u64);
        env.storage().instance().set(&PoolKey::VolumeA, &0i128);
        env.storage().instance().set(&PoolKey::VolumeB, &0i128);

        env.events().publish(
            ("pool", symbol_short!("init")),
            (config.token_a, config.token_b),
        );
        true
    }

    pub fn add_liquidity(
        env: Env,
        provider: Address,
        amount_a: i128,
        amount_b: i128,
        min_lp: i128,
    ) -> LiquidityResult {
        provider.require_auth();

        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let mut reserves: PoolReserves = env.storage().instance().get(&PoolKey::Reserves).unwrap();

        let lp_to_mint = if reserves.total_lp_supply == 0 {
            integer_sqrt(amount_a * amount_b)
        } else {
            let lp_a = amount_a * reserves.total_lp_supply / reserves.reserve_a;
            let lp_b = amount_b * reserves.total_lp_supply / reserves.reserve_b;
            lp_a.min(lp_b)
        };

        assert!(lp_to_mint >= min_lp, "slippage exceeded");

        let token_a_client = token::Client::new(&env, &config.token_a);
        token_a_client.transfer_from(
            &env.current_contract_address(),
            &provider,
            &env.current_contract_address(),
            &amount_a,
        );

        let token_b_client = token::Client::new(&env, &config.token_b);
        token_b_client.transfer_from(
            &env.current_contract_address(),
            &provider,
            &env.current_contract_address(),
            &amount_b,
        );

        let lp_client = token::Client::new(&env, &config.lp_token);
        lp_client.mint(&env.current_contract_address(), &provider, &lp_to_mint);

        reserves.reserve_a += amount_a;
        reserves.reserve_b += amount_b;
        reserves.total_lp_supply += lp_to_mint;
        env.storage().instance().set(&PoolKey::Reserves, &reserves);

        env.events().publish(
            ("pool", symbol_short!("liq_add")),
            (provider, amount_a, amount_b, lp_to_mint),
        );
        env.events().publish(
            ("pool", symbol_short!("price")),
            (reserves.reserve_a, reserves.reserve_b),
        );

        LiquidityResult {
            amount_a,
            amount_b,
            lp_minted: lp_to_mint,
        }
    }

    pub fn remove_liquidity(
        env: Env,
        provider: Address,
        lp_amount: i128,
        min_a: i128,
        min_b: i128,
    ) -> (i128, i128) {
        provider.require_auth();

        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let mut reserves: PoolReserves = env.storage().instance().get(&PoolKey::Reserves).unwrap();

        let amount_a = lp_amount * reserves.reserve_a / reserves.total_lp_supply;
        let amount_b = lp_amount * reserves.reserve_b / reserves.total_lp_supply;

        assert!(amount_a >= min_a && amount_b >= min_b, "slippage exceeded");

        let lp_client = token::Client::new(&env, &config.lp_token);
        lp_client.burn(&provider, &lp_amount);

        let token_a_client = token::Client::new(&env, &config.token_a);
        token_a_client.transfer(&env.current_contract_address(), &provider, &amount_a);

        let token_b_client = token::Client::new(&env, &config.token_b);
        token_b_client.transfer(&env.current_contract_address(), &provider, &amount_b);

        reserves.reserve_a -= amount_a;
        reserves.reserve_b -= amount_b;
        reserves.total_lp_supply -= lp_amount;
        env.storage().instance().set(&PoolKey::Reserves, &reserves);

        env.events().publish(
            ("pool", symbol_short!("liq_rem")),
            (provider, amount_a, amount_b, lp_amount),
        );
        env.events().publish(
            ("pool", symbol_short!("price")),
            (reserves.reserve_a, reserves.reserve_b),
        );

        (amount_a, amount_b)
    }

    pub fn swap(
        env: Env,
        trader: Address,
        token_in: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> SwapResult {
        trader.require_auth();

        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let mut reserves: PoolReserves = env.storage().instance().get(&PoolKey::Reserves).unwrap();

        let is_a_in = token_in == config.token_a;
        let (reserve_in, reserve_out) = if is_a_in {
            (reserves.reserve_a, reserves.reserve_b)
        } else {
            (reserves.reserve_b, reserves.reserve_a)
        };

        let amount_out = get_amount_out(amount_in, reserve_in, reserve_out, config.fee_bps);
        assert!(amount_out >= min_amount_out, "slippage exceeded");

        let fee_paid = amount_in * config.fee_bps as i128 / 10000;
        let price_impact_bps = get_price_impact_bps(amount_in, amount_out, reserve_in, reserve_out);

        let (token_in_addr, token_out_addr) = if is_a_in {
            (config.token_a.clone(), config.token_b.clone())
        } else {
            (config.token_b.clone(), config.token_a.clone())
        };

        let token_in_client = token::Client::new(&env, &token_in_addr);
        token_in_client.transfer_from(
            &env.current_contract_address(),
            &trader,
            &env.current_contract_address(),
            &amount_in,
        );

        let token_out_client = token::Client::new(&env, &token_out_addr);
        token_out_client.transfer(&env.current_contract_address(), &trader, &amount_out);

        if is_a_in {
            reserves.reserve_a += amount_in;
            reserves.reserve_b -= amount_out;
            let mut volume_a: i128 = env.storage().instance().get(&PoolKey::VolumeA).unwrap();
            volume_a += amount_in;
            env.storage().instance().set(&PoolKey::VolumeA, &volume_a);
        } else {
            reserves.reserve_b += amount_in;
            reserves.reserve_a -= amount_out;
            let mut volume_b: i128 = env.storage().instance().get(&PoolKey::VolumeB).unwrap();
            volume_b += amount_in;
            env.storage().instance().set(&PoolKey::VolumeB, &volume_b);
        }

        let mut swap_count: u64 = env.storage().instance().get(&PoolKey::SwapCount).unwrap();
        swap_count += 1;
        env.storage().instance().set(&PoolKey::SwapCount, &swap_count);
        env.storage().instance().set(&PoolKey::Reserves, &reserves);

        env.events().publish(
            ("pool", symbol_short!("swap")),
            (trader, token_in, amount_in, amount_out, fee_paid),
        );
        env.events().publish(
            ("pool", symbol_short!("price")),
            (reserves.reserve_a, reserves.reserve_b),
        );

        SwapResult {
            amount_in,
            amount_out,
            fee_paid,
            price_impact_bps,
            new_reserve_a: reserves.reserve_a,
            new_reserve_b: reserves.reserve_b,
        }
    }

    pub fn get_reserves(env: Env) -> PoolReserves {
        env.storage().instance().get(&PoolKey::Reserves).unwrap()
    }

    pub fn get_config(env: Env) -> PoolConfig {
        env.storage().instance().get(&PoolKey::Config).unwrap()
    }

    pub fn get_price(env: Env, token_in: Address) -> i128 {
        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let reserves: PoolReserves = env.storage().instance().get(&PoolKey::Reserves).unwrap();

        if token_in == config.token_a {
            if reserves.reserve_a == 0 {
                0
            } else {
                reserves.reserve_b * 10_000_000 / reserves.reserve_a
            }
        } else {
            if reserves.reserve_b == 0 {
                0
            } else {
                reserves.reserve_a * 10_000_000 / reserves.reserve_b
            }
        }
    }

    pub fn get_swap_quote(env: Env, token_in: Address, amount_in: i128) -> SwapResult {
        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let reserves: PoolReserves = env.storage().instance().get(&PoolKey::Reserves).unwrap();

        let is_a_in = token_in == config.token_a;
        let (reserve_in, reserve_out) = if is_a_in {
            (reserves.reserve_a, reserves.reserve_b)
        } else {
            (reserves.reserve_b, reserves.reserve_a)
        };

        let amount_out = get_amount_out(amount_in, reserve_in, reserve_out, config.fee_bps);
        let fee_paid = amount_in * config.fee_bps as i128 / 10000;
        let price_impact_bps = get_price_impact_bps(amount_in, amount_out, reserve_in, reserve_out);

        let (new_reserve_a, new_reserve_b) = if is_a_in {
            (reserves.reserve_a + amount_in, reserves.reserve_b - amount_out)
        } else {
            (reserves.reserve_a - amount_out, reserves.reserve_b + amount_in)
        };

        SwapResult {
            amount_in,
            amount_out,
            fee_paid,
            price_impact_bps,
            new_reserve_a,
            new_reserve_b,
        }
    }

    pub fn get_lp_balance(env: Env, address: Address) -> i128 {
        let config: PoolConfig = env.storage().instance().get(&PoolKey::Config).unwrap();
        let lp_client = token::Client::new(&env, &config.lp_token);
        lp_client.balance(&address)
    }

    pub fn get_stats(env: Env) -> (u64, i128, i128) {
        let swap_count: u64 = env.storage().instance().get(&PoolKey::SwapCount).unwrap();
        let volume_a: i128 = env.storage().instance().get(&PoolKey::VolumeA).unwrap();
        let volume_b: i128 = env.storage().instance().get(&PoolKey::VolumeB).unwrap();
        (swap_count, volume_a, volume_b)
    }
}

fn get_amount_out(amount_in: i128, reserve_in: i128, reserve_out: i128, fee_bps: u32) -> i128 {
    let amount_in_with_fee = amount_in * (10000 - fee_bps as i128);
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = reserve_in * 10000 + amount_in_with_fee;
    numerator / denominator
}

fn get_price_impact_bps(
    amount_in: i128,
    amount_out: i128,
    reserve_in: i128,
    reserve_out: i128,
) -> u32 {
    if amount_in == 0 || reserve_in == 0 {
        return 0;
    }
    let mid_price = reserve_out * 10000 / reserve_in;
    let execution_price = amount_out * 10000 / amount_in;
    if mid_price <= execution_price {
        return 0;
    }
    ((mid_price - execution_price) * 10000 / mid_price) as u32
}

fn integer_sqrt(n: i128) -> i128 {
    if n < 0 {
        panic!("sqrt of negative");
    }
    if n < 2 {
        return n;
    }
    let mut x = n / 2 + 1;
    let mut y = (x + n / x) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}
