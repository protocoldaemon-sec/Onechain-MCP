import { SuiClient, getFullnodeUrl } from '@onelabs/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

console.log('Testing OneChain SDK connection to testnet...\n');

try {
  const chainId = await client.getChainIdentifier();
  console.log('✓ Chain ID:', chainId);

  const gasPrice = await client.getReferenceGasPrice();
  console.log('✓ Gas Price:', gasPrice.toString());

  const checkpoint = await client.getLatestCheckpointSequenceNumber();
  console.log('✓ Latest Checkpoint:', checkpoint);

  console.log('\n✓ All tests passed! MCP server is ready to use.');
} catch (e) {
  console.error('✗ Error:', e.message);
}
