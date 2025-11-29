const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FHE Private ICO to Sepolia...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  if (balance < hre.ethers.parseEther("0.05")) {
    console.error("❌ Need at least 0.05 ETH");
    process.exit(1);
  }

  try {
    // Deploy Token
    console.log("📝 Deploying FHEPrivateToken...");
    const Token = await hre.ethers.getContractFactory("FHEPrivateToken");
    const token = await Token.deploy({ gasLimit: 5000000 });
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ Token deployed to:", tokenAddress, "\n");
    
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Deploy ICO
    console.log("📝 Deploying WorkingPrivateICO...");
    const ICO = await hre.ethers.getContractFactory("PrivateICO");
    const ico = await ICO.deploy({ gasLimit: 5000000 });
    await ico.waitForDeployment();
    const icoAddress = await ico.getAddress();
    console.log("✅ ICO deployed to:", icoAddress, "\n");
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Link contracts
    console.log("📝 Linking contracts...");
    await token.setICOContract(icoAddress);
    console.log("✅ Token → ICO linked");
    
    await ico.setTokenContract(tokenAddress);
    console.log("✅ ICO → Token linked\n");

    // Get and display ICO configuration
    console.log("📊 ICO Configuration:");
    const hardCap = await ico.HARD_CAP();
    console.log("Hard Cap:", hre.ethers.formatEther(hardCap), "ETH");
    
    const saleInfo = await ico.getSaleInfo();
    const saleDuration = Number(saleInfo.end) - Number(saleInfo.start);
    const durationDays = saleDuration / (24 * 60 * 60);
    console.log("Sale Duration:", durationDays, "days");
    console.log("Sale Start:", new Date(Number(saleInfo.start) * 1000).toLocaleString());
    console.log("Sale End:", new Date(Number(saleInfo.end) * 1000).toLocaleString());
    console.log("Owner:", await ico.owner());
    
    console.log("\n⚠️  Important:");
    console.log("- Sale will auto-close when hard cap (0.1 ETH) is reached");
    console.log("- Sale will also close after 60 days if hard cap not reached");
    console.log("- Owner can manually close sale early\n");

    console.log("🎉 DEPLOYMENT COMPLETE!\n");
    console.log("📋 Addresses:");
    console.log("Token:", tokenAddress);
    console.log("ICO:", icoAddress);
    
    console.log("\n🔗 Etherscan:");
    console.log(`Token: https://sepolia.etherscan.io/address/${tokenAddress}`);
    console.log(`ICO: https://sepolia.etherscan.io/address/${icoAddress}`);

    console.log("\n🔍 Verify contracts with:");
    console.log(`npx hardhat verify --network sepolia ${tokenAddress}`);
    console.log(`npx hardhat verify --network sepolia ${icoAddress}`);
    
  } catch (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});