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

  return (
    <div>
      <h1>Solana Tree Cost Calculator</h1>
      <table>
        <thead>
          <tr>
            <th>Max Depth</th>
            <th>Max Buffer Size</th>
            <th>Canopy Depth</th>  {/* Added header for canopyDepth */}
            <th>Required Space</th>
            <th>Storage Cost (SOL)</th>
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
            <td>{row.requiredSpace}</td>
            <td>{(row.storageCost / LAMPORTS_PER_SOL).toFixed(4)}</td>
            <td>{formatSmallNumber((row.storageCost * 1000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth))}</td>
            <td>{formatSmallNumber((row.storageCost * 10000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth))}</td>
            <td>{'$' + formatPrice((row.storageCost * 1000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth) * solPrice)}</td>
            <td>{'$' + formatPrice((row.storageCost * 10000 / LAMPORTS_PER_SOL) / (2 ** row.maxDepth) * solPrice)}</td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
