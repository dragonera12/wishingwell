#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub pool_contract: Address,
    pub token_a: Address,
    pub token_b: Address,
    pub token_a_symbol: String,
    pub token_b_symbol: String,
    pub lp_token: Address,
    pub created_at: u64,
    pub creator: Address,
}

#[contracttype]
pub enum FactoryKey {
    Admin,
    PoolCount,
    Pool(u64),
    PairToPool(Address, Address),
    AllPools,
}

#[contract]
pub struct FactoryContract;

#[contractimpl]
impl FactoryContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&FactoryKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&FactoryKey::Admin, &admin);
        env.storage().instance().set(&FactoryKey::PoolCount, &0u64);
        env.storage().instance().set(&FactoryKey::AllPools, &Vec::<u64>::new(&env));
    }

    pub fn register_pool(
        env: Env,
        creator: Address,
        pool_contract: Address,
        token_a: Address,
        token_b: Address,
        token_a_symbol: String,
        token_b_symbol: String,
        lp_token: Address,
    ) -> u64 {
        creator.require_auth();

        if Self::pair_exists(env.clone(), token_a.clone(), token_b.clone()) {
            panic!("pool already exists");
        }

        let mut pool_count: u64 = env.storage().instance().get(&FactoryKey::PoolCount).unwrap();
        let pool_id = pool_count;
        pool_count += 1;

        let pool_info = PoolInfo {
            pool_contract: pool_contract.clone(),
            token_a: token_a.clone(),
            token_b: token_b.clone(),
            token_a_symbol,
            token_b_symbol,
            lp_token,
            created_at: env.ledger().timestamp(),
            creator,
        };

        env.storage().instance().set(&FactoryKey::Pool(pool_id), &pool_info);
        env.storage().instance().set(&FactoryKey::PoolCount, &pool_count);

        let mut all_pools: Vec<u64> = env.storage().instance().get(&FactoryKey::AllPools).unwrap();
        all_pools.push_back(pool_id);
        env.storage().instance().set(&FactoryKey::AllPools, &all_pools);

        // Store pair mapping in both directions
        env.storage().instance().set(&FactoryKey::PairToPool(token_a.clone(), token_b.clone()), &pool_info);
        env.storage().instance().set(&FactoryKey::PairToPool(token_b.clone(), token_a.clone()), &pool_info);

        env.events().publish(
            ("factory", soroban_sdk::symbol_short!("reg_pool")),
            (pool_id, token_a, token_b, pool_contract),
        );

        pool_id
    }

    pub fn get_pool_by_pair(
        env: Env,
        token_a: Address,
        token_b: Address,
    ) -> Option<PoolInfo> {
        env.storage().instance().get(&FactoryKey::PairToPool(token_a, token_b))
    }

    pub fn get_pools(env: Env, page: u32, page_size: u32) -> Vec<PoolInfo> {
        let all_pools: Vec<u64> = env.storage().instance().get(&FactoryKey::AllPools).unwrap();
        let mut result = Vec::new(&env);
        let start = page * page_size;
        let end = (start + page_size).min(all_pools.len());

        for i in start..end {
            let pool_id = all_pools.get(i).unwrap();
            let pool_info: PoolInfo = env.storage().instance().get(&FactoryKey::Pool(pool_id)).unwrap();
            result.push_back(pool_info);
        }
        result
    }

    pub fn get_pool(env: Env, pool_id: u64) -> PoolInfo {
        env.storage().instance().get(&FactoryKey::Pool(pool_id)).unwrap()
    }

    pub fn get_count(env: Env) -> u64 {
        env.storage().instance().get(&FactoryKey::PoolCount).unwrap_or(0)
    }

    pub fn pair_exists(env: Env, token_a: Address, token_b: Address) -> bool {
        env.storage().instance().has(&FactoryKey::PairToPool(token_a, token_b))
    }

}
