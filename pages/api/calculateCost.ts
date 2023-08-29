// pages/api/calculateCost.js
const { clusterApiUrl, Connection } = require('@solana/web3.js');
const { getConcurrentMerkleTreeAccountSize } = require('@solana/spl-account-compression');

export default async function handler(req : any, res : any) {
  //const ENDPOINT = clusterApiUrl('https://api.vip.mainnet-beta.solana.com');
  const connection = new Connection('https://api.vip.mainnet-beta.solana.com');

  const ALL_DEPTH_SIZE_PAIRS : { maxDepth: number; maxBufferSize: number }[] = [
    { maxDepth: 3, maxBufferSize: 8 },
    { maxDepth: 5, maxBufferSize: 8 },
    { maxDepth: 14, maxBufferSize: 64 },
    { maxDepth: 14, maxBufferSize: 256 },
    { maxDepth: 14, maxBufferSize: 1024 },
    { maxDepth: 14, maxBufferSize: 2048 },
    { maxDepth: 15, maxBufferSize: 64 },
    { maxDepth: 16, maxBufferSize: 64 },
    { maxDepth: 17, maxBufferSize: 64 },
    { maxDepth: 18, maxBufferSize: 64 },
    { maxDepth: 19, maxBufferSize: 64 },
    { maxDepth: 20, maxBufferSize: 64 },
    { maxDepth: 20, maxBufferSize: 256 },
    { maxDepth: 20, maxBufferSize: 1024 },
    { maxDepth: 20, maxBufferSize: 2048 },
    { maxDepth: 24, maxBufferSize: 64 },
    { maxDepth: 24, maxBufferSize: 256 },
    { maxDepth: 24, maxBufferSize: 512 },
    { maxDepth: 24, maxBufferSize: 1024 },
    { maxDepth: 24, maxBufferSize: 2048 },
    { maxDepth: 26, maxBufferSize: 512 },
    { maxDepth: 26, maxBufferSize: 1024 },
    { maxDepth: 26, maxBufferSize: 2048 },
    { maxDepth: 30, maxBufferSize: 512 },
    { maxDepth: 30, maxBufferSize: 1024 },
    { maxDepth: 30, maxBufferSize: 2048 }
  ];
  
  const costs = [];
  const promises = [];
  
  for (const { maxDepth, maxBufferSize } of ALL_DEPTH_SIZE_PAIRS) {
    // Log to make sure we are entering the loop
    console.log(`Processing maxDepth=${maxDepth}, maxBufferSize=${maxBufferSize}`);
  
    // Always include the canopyDepth=0 case
    promises.push(
      (async () => {
        const requiredSpace = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, 0);
        const storageCost = await connection.getMinimumBalanceForRentExemption(requiredSpace);
        console.log(`Canopy 0: maxDepth=${maxDepth}, storageCost=${storageCost}`);
        return { maxDepth, maxBufferSize, canopyDepth: 0, requiredSpace, storageCost };
      })()
    );
  
    // Start from maxDepth and loop downwards to find the highest allowable canopy depth
    promises.push(
      (async () => {
        for (let canopyDepth = maxDepth-1; canopyDepth >= 0; canopyDepth--) {
          const requiredSpace = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize, canopyDepth);
          if (requiredSpace <= 10485760) {
            const storageCost = await connection.getMinimumBalanceForRentExemption(requiredSpace);
            console.log(`Valid: maxDepth=${maxDepth}, canopyDepth=${canopyDepth}, storageCost=${storageCost}`);
            return { maxDepth, maxBufferSize, canopyDepth, requiredSpace, storageCost };
          }
        }
        return null;
      })()
    );
  }
  
  Promise.all(promises)
    .then(results => {
      const filteredResults = results.filter(result => result !== null);  // Filter out nulls
      console.log('Filtered Results:', filteredResults);
      res.status(200).json(filteredResults);
    })
    .catch(error => {
      console.error("Promise error:", error);
      res.status(500).json({ error: "An error occurred while calculating costs." });
    });
  
  
}