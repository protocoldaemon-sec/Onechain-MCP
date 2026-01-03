import { SuiClient, getFullnodeUrl } from '@onelabs/sui/client';

const address = '0x0f261da7f628b988aabaf0aef247e9b08348feb6e30d48f21ef67e87d4656770';
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

console.log('Testing address:', address);
console.log('Network: testnet\n');

try {
  // Get balance
  console.log('=== Balance ===');
  const balance = await client.getBalance({ owner: address });
  console.log(JSON.stringify(balance, null, 2));

  // Get all balances
  console.log('\n=== All Balances ===');
  const allBalances = await client.getAllBalances({ owner: address });
  console.log(JSON.stringify(allBalances, null, 2));

  // Get owned objects
  console.log('\n=== Owned Objects (limit 5) ===');
  const objects = await client.getOwnedObjects({
    owner: address,
    limit: 5,
    options: { showType: true, showContent: true },
  });
  console.log(JSON.stringify(objects, null, 2));

  // Get transaction history
  console.log('\n=== Transaction History (limit 5) ===');
  const txHistory = await client.queryTransactionBlocks({
    filter: { FromOrToAddress: { addr: address } },
    options: { showInput: true, showEffects: true, showBalanceChanges: true },
    limit: 5,
    order: 'descending',
  });
  console.log(JSON.stringify(txHistory, null, 2));

  // Get coins
  console.log('\n=== Coins (limit 5) ===');
  const coins = await client.getCoins({ owner: address, limit: 5 });
  console.log(JSON.stringify(coins, null, 2));

  console.log('\n✓ All tests passed!');
} catch (e) {
  console.error('Error:', e.message);
}
