"use client";
import React, { useState, useEffect } from 'react';
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");

type DataRow = {
  maxDepth: number;
  maxBufferSize: number;
  canopyDepth: number;  // Added canopyDepth here
  requiredSpace: number;
  storageCost: number;
};

export default function Home() {
  const [data, setData] = useState<DataRow[]>([]);  // Updated the type here
  const [solPrice, setSolPrice] = useState<number>(0); // For storing Solana price
  useEffect(() => {
    // Fetch Solana price
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(response => response.json())
      .then(data => setSolPrice(data.solana.usd))
      .catch(error => console.error("Error fetching Solana price:", error));

      fetch('/api/calculateCost')
      .then(res => res.json())
      .then(data => setData(data));
   }, []);

  // Helper function to format small numbers
  const formatSmallNumber = (num: any) => {
    if (num < 1e-4) {
      return "< 0.0001";
    }
    return num.toFixed(4);
  };

  const roundToNearestCent = (num: number) => {
    return Math.round(num * 100) / 100;
  };
  
  const formatPrice = (num: number) => {
    if (num >= 0.01) {
      return roundToNearestCent(num).toFixed(2);
    } else {
      return formatSmallNumber(num);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };  

  return (
    <div className="container">
      <h1 className="header-text">Solana Concurrent Merkle Tree Prices</h1>
      <h1 className="header-description">This table is dynamically populated upon each visit to yield accurate pricing</h1>
      <p className="sol-price">Current SOL Price: ${solPrice.toFixed(2)}</p>
      <table className="table">
        <thead>
          <tr>
            <th>Max Depth</th>
            <th>Max Buffer Size</th>
            <th>Canopy Depth</th>  
            <th>Required Space</th>
            <th>Storage Cost (SOL)</th>
            <th>Storage Cost (USD)</th>
            <th>Cost per 1,000 NFTs (SOL)</th>
            <th>Cost per 10,000 NFTs (SOL)</th>
            <th>Cost per 1,000 NFTs (USD)</th>
            <th>Cost per 10,000 NFTs (USD)</th>
          </tr>
        </thead>
        <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            <td>{row.maxDepth}</td>
            <td>{row.maxBufferSize}</td>
            <td>{row.canopyDepth}</td>
            <td>{formatBytes(row.requiredSpace)}</td>
            <td>{(row.storageCost / LAMPORTS_PER_SOL).toFixed(4)}</td>
            <td>{'$' + formatPrice(row.storageCost / LAMPORTS_PER_SOL * solPrice)}</td>
            <td>{formatSmallNumber((row.storageCost * 1000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth))}</td>
            <td>{formatSmallNumber((row.storageCost * 10000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth))}</td>
            <td>{'$' + formatPrice((row.storageCost * 1000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth) * solPrice)}</td>
            <td>{'$' + formatPrice((row.storageCost * 10000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth) * solPrice)}</td>
          </tr>
        ))}
      </tbody>
      </table>
      {/* FAQ Section Start */}
      <div className="faq-section">
        <h2>FAQ</h2>
        <div className="faq-content" contentEditable={true}>
          {'Q: What does Max Depth mean in the context of a tree?'}
          <br />
          {'A: The Max Depth is the maximum number of hops it takes to get from any leaf to the root of the tree. This determines the maximum number of nodes (or pieces of data) the tree can store. 2^Max Depth = Max Number of Nodes.'}
          <br />
          <br />
          {'Q: How is the cost of creating a tree calculated?'}
          <br />
          {'A: The cost depends on three factors: maxDepth, maxBufferSize, and canopyDepth. These factors determine the amount of on-chain storage required, and therefore the cost in lamports.'}
          <br />
          <br />
          {'Q: Why does canopy depth matter?'}
          <br />
          {'A: Transaction Efficiency: A larger canopy depth means fewer proof nodes need to be included in each update transaction, keeping the overall transaction size below the limit.'}
          <br />
          {'Cost: While a larger canopy depth increases the upfront cost of tree creation, it can reduce the transaction costs in the long run.'}
          <br />
          {'Composability: A smaller canopy depth limits the composability of the tree with other Solana programs or dApps, as more proof nodes will need to be included in each transaction.'}
          <br />
          {'Verification Speed: A larger canopy helps speed up the verification process since fewer nodes need to be checked.'}
          <br />
          <br />
          {'Q: Why is a higher canopy level for depth X not possible?'}
          <br />
          {'A: Accounts have a maximum size of 10 MB. If the canopy level is too high, the account will exceed this limit.'}
          <br />
          <br />
        </div>
      </div>
      {/* FAQ Section End */}
    </div>
  );
}  
