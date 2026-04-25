import fetch from 'node-fetch';

async function checkTx() {
  const hash = '676ad16787bb5c7b2ad0c3791cbc248097cd42a7ecb04d94cfec943565a77bd5';
  const url = 'https://soroban-testnet.stellar.org';
  
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: {
      hash: hash
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

checkTx();
