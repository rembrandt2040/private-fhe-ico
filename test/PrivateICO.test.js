const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("WorkingPrivateICO Contract Tests", function () {
  let privateICO;
  let icoToken;
  let owner;
  let contributor1;
  let contributor2;
  let contributor3;
  
  const SALE_DURATION = 60 * 24 * 60 * 60; // 60 days in seconds
  const HARD_CAP = ethers.parseEther("0.1"); // 0.1 ETH hard cap

  beforeEach(async function () {
    [owner, contributor1, contributor2, contributor3] = await ethers.getSigners();

    // Deploy FHEPrivateToken
    const FHEPrivateToken = await ethers.getContractFactory("FHEPrivateToken");
    icoToken = await FHEPrivateToken.deploy();
    await icoToken.waitForDeployment();

    // Deploy WorkingPrivateICO
    const WorkingPrivateICO = await ethers.getContractFactory("WorkingPrivateICO");
    privateICO = await WorkingPrivateICO.deploy();
    await privateICO.waitForDeployment();

    // Link contracts (two-way linking like your deployment script)
    await icoToken.setICOContract(await privateICO.getAddress());
    await privateICO.setTokenContract(await icoToken.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await privateICO.owner()).to.equal(owner.address);
    });

    it("Should set the correct token address", async function () {
      expect(await privateICO.tokenContract()).to.equal(await icoToken.getAddress());
    });

    it("Should initialize sale as not finalized", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      expect(saleInfo.finalized).to.equal(false);
    });

    it("Should have correct sale duration (60 days)", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      const duration = Number(saleInfo.end) - Number(saleInfo.start);
      expect(duration).to.equal(SALE_DURATION);
    });

    it("Should have contracts properly linked", async function () {
      expect(await icoToken.icoContract()).to.equal(await privateICO.getAddress());
      expect(await privateICO.tokenContract()).to.equal(await icoToken.getAddress());
    });

    it("Should have correct hard cap set", async function () {
      expect(await privateICO.HARD_CAP()).to.equal(HARD_CAP);
    });
  });

  describe("Contributions", function () {
    it("Should accept encrypted contributions during sale period", async function () {
      const ethAmount = ethers.parseEther("0.05");
      const weiAmount = 50000000000000000n; // 0.05 ETH in wei as uint64
      
      const tx = await privateICO.connect(contributor1).contribute(weiAmount, {
        value: ethAmount
      });

      await expect(tx)
        .to.emit(privateICO, "ContributionSubmitted")
        .withArgs(contributor1.address, ethAmount);
    });

    it("Should track multiple contributors", async function () {
      await privateICO.connect(contributor1).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      await privateICO.connect(contributor2).contribute(40000000000000000n, {
        value: ethers.parseEther("0.04")
      });

      expect(await privateICO.getContributorsCount()).to.equal(2);
    });

    it("Should reject contributions with zero ETH", async function () {
      await expect(
        privateICO.connect(contributor1).contribute(1000000000000000000n, { value: 0 })
      ).to.be.revertedWith("ETH required");
    });

    it("Should reject contributions with zero amount", async function () {
      await expect(
        privateICO.connect(contributor1).contribute(0, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Amount required");
    });

    it("Should reject contributions after sale ends (60 days)", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      
      // Fast forward past sale end (60 days + 1 second)
      await time.increaseTo(Number(saleInfo.end) + 1);

      await expect(
        privateICO.connect(contributor1).contribute(50000000000000000n, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Sale ended");
    });

    it("Should store encrypted contribution for user", async function () {
      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      const encryptedContribution = await privateICO.connect(contributor1).getMyEncryptedContribution();
      expect(encryptedContribution).to.not.equal(0);
    });

    it("Should allow multiple contributions from same user", async function () {
      await privateICO.connect(contributor1).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      await privateICO.connect(contributor1).contribute(20000000000000000n, {
        value: ethers.parseEther("0.02")
      });

      // Still only 1 contributor (same user)
      expect(await privateICO.getContributorsCount()).to.equal(1);
    });
  });

  describe("Hard Cap Enforcement", function () {
    it("Should reject contributions that exceed hard cap", async function () {
      // Try to contribute more than 0.1 ETH hard cap
      await expect(
        privateICO.connect(contributor1).contribute(150000000000000000n, {
          value: ethers.parseEther("0.15")
        })
      ).to.be.revertedWith("Hard cap exceeded");
    });

    it("Should accept contribution exactly at hard cap", async function () {
      const tx = await privateICO.connect(contributor1).contribute(100000000000000000n, {
        value: ethers.parseEther("0.1")
      });

      await expect(tx)
        .to.emit(privateICO, "ContributionSubmitted")
        .withArgs(contributor1.address, HARD_CAP);
    });

    it("Should automatically close sale when hard cap is reached", async function () {
      const tx = await privateICO.connect(contributor1).contribute(100000000000000000n, {
        value: ethers.parseEther("0.1")
      });

      await expect(tx)
        .to.emit(privateICO, "HardCapReached")
        .withArgs(HARD_CAP);

      await expect(tx)
        .to.emit(privateICO, "SaleClosed");

      const saleInfo = await privateICO.getSaleInfo();
      expect(saleInfo.end).to.be.lte(await time.latest());
    });

    it("Should reject contributions after hard cap is reached", async function () {
      // First contribution reaches hard cap
      await privateICO.connect(contributor1).contribute(100000000000000000n, {
        value: ethers.parseEther("0.1")
      });

      // Second contribution should fail
      await expect(
        privateICO.connect(contributor2).contribute(10000000000000000n, {
          value: ethers.parseEther("0.01")
        })
      ).to.be.revertedWith("Sale ended");
    });

    it("Should prevent exceeding hard cap with multiple contributions", async function () {
      // First contribution: 0.07 ETH
      await privateICO.connect(contributor1).contribute(70000000000000000n, {
        value: ethers.parseEther("0.07")
      });

      // Second contribution: 0.05 ETH would exceed hard cap (0.07 + 0.05 = 0.12 > 0.1)
      await expect(
        privateICO.connect(contributor2).contribute(50000000000000000n, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Hard cap exceeded");
    });

    it("Should allow contributions up to hard cap from multiple contributors", async function () {
      // First contributor: 0.06 ETH
      await privateICO.connect(contributor1).contribute(60000000000000000n, {
        value: ethers.parseEther("0.06")
      });

      // Second contributor: 0.04 ETH (total = 0.1 ETH, exactly at hard cap)
      const tx = await privateICO.connect(contributor2).contribute(40000000000000000n, {
        value: ethers.parseEther("0.04")
      });

      await expect(tx)
        .to.emit(privateICO, "HardCapReached")
        .withArgs(HARD_CAP);

      expect(await privateICO.getContributorsCount()).to.equal(2);
    });

    it("Should close sale before 60 days if hard cap reached", async function () {
      const saleInfoBefore = await privateICO.getSaleInfo();
      const originalSaleEnd = saleInfoBefore.end;

      // Reach hard cap immediately
      await privateICO.connect(contributor1).contribute(100000000000000000n, {
        value: ethers.parseEther("0.1")
      });

      const saleInfoAfter = await privateICO.getSaleInfo();
      const newSaleEnd = saleInfoAfter.end;

      // Sale end should be updated to current time (much earlier than original 60 days)
      expect(newSaleEnd).to.be.lt(originalSaleEnd);
      expect(newSaleEnd).to.be.lte(await time.latest());
    });
  });

  describe("Homomorphic Operations", function () {
    it("Should calculate encrypted total correctly", async function () {
      await privateICO.connect(contributor1).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      await privateICO.connect(contributor2).contribute(40000000000000000n, {
        value: ethers.parseEther("0.04")
      });

      const encryptedTotal = await privateICO.getEncryptedTotal();
      expect(encryptedTotal).to.not.equal(0);
    });

    it("Should maintain encryption during active sale", async function () {
      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      const saleInfo = await privateICO.getSaleInfo();
      expect(saleInfo.totalDecryptable).to.equal(false);
    });
  });

  describe("Sale Management", function () {
    it("Should allow owner to close sale early", async function () {
      // Make some contributions
      await privateICO.connect(contributor1).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      // Owner closes sale early (before 60 days)
      const tx = await privateICO.connect(owner).closeSale();
      await expect(tx).to.emit(privateICO, "SaleClosed");

      const saleInfo = await privateICO.getSaleInfo();
      // Check that saleEnd was updated to current time
      expect(saleInfo.end).to.be.lte(await time.latest());
    });

    it("Should reject close sale from non-owner", async function () {
      await expect(
        privateICO.connect(contributor1).closeSale()
      ).to.be.revertedWith("Only owner");
    });

    it("Should allow closing sale multiple times (updates saleEnd)", async function () {
      await privateICO.connect(owner).closeSale();
      
      // Can call again - just updates saleEnd to current timestamp
      await expect(
        privateICO.connect(owner).closeSale()
      ).to.not.be.reverted;
    });

    it("Should reject contributions after sale is closed early", async function () {
      await privateICO.connect(owner).closeSale();

      await expect(
        privateICO.connect(contributor1).contribute(50000000000000000n, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Sale ended");
    });

    it("Should automatically prevent contributions after 60 days", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      
      // Fast forward to 60 days + 1 second
      await time.increaseTo(Number(saleInfo.end) + 1);

      await expect(
        privateICO.connect(contributor1).contribute(50000000000000000n, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Sale ended");
    });
  });

  describe("Decryption Process", function () {
    beforeEach(async function () {
      // Setup: Make some contributions and close sale
      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      await privateICO.connect(contributor2).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      await privateICO.connect(owner).closeSale();
    });

    it("Should allow making total decryptable after sale ends", async function () {
      const tx = await privateICO.makeTotalDecryptable();
      await expect(tx).to.emit(privateICO, "TotalMadeDecryptable");

      const saleInfo = await privateICO.getSaleInfo();
      expect(saleInfo.totalDecryptable).to.equal(true);
    });

    it("Should reject making total decryptable while sale running", async function () {
      // Deploy new ICO
      const WorkingPrivateICO = await ethers.getContractFactory("WorkingPrivateICO");
      const newICO = await WorkingPrivateICO.deploy();
      
      const FHEPrivateToken = await ethers.getContractFactory("FHEPrivateToken");
      const newToken = await FHEPrivateToken.deploy();
      
      await newToken.setICOContract(await newICO.getAddress());
      await newICO.setTokenContract(await newToken.getAddress());

      await expect(
        newICO.makeTotalDecryptable()
      ).to.be.revertedWith("Sale running");
    });

    it("Should allow contributors to make their contribution decryptable", async function () {
      await expect(
        privateICO.connect(contributor1).makeMyContributionDecryptable()
      ).to.not.be.reverted;
    });

    it("Should reject making contribution decryptable twice", async function () {
      await privateICO.connect(contributor1).makeMyContributionDecryptable();
      
      await expect(
        privateICO.connect(contributor1).makeMyContributionDecryptable()
      ).to.be.revertedWith("Already set");
    });
  });

  describe("Access Control", function () {
    it("Should restrict owner-only functions", async function () {
      await expect(
        privateICO.connect(contributor1).closeSale()
      ).to.be.revertedWith("Only owner");

      await expect(
        privateICO.connect(contributor1).setTokenContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Only owner");
    });

    it("Should allow owner to perform owner functions", async function () {
      await expect(
        privateICO.connect(owner).closeSale()
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct sale info", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      
      expect(saleInfo.start).to.be.gt(0);
      expect(saleInfo.end).to.be.gt(saleInfo.start);
      expect(saleInfo.finalized).to.equal(false);
      expect(saleInfo.totalDecryptable).to.equal(false);
    });

    it("Should return encrypted total after contributions", async function () {
      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      const encryptedTotal = await privateICO.getEncryptedTotal();
      expect(encryptedTotal).to.not.equal(0);
    });

    it("Should return contributor count", async function () {
      const initialCount = await privateICO.getContributorsCount();
      expect(initialCount).to.equal(0);

      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      const newCount = await privateICO.getContributorsCount();
      expect(newCount).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small contributions", async function () {
      const tinyAmount = 1000000000000n; // 0.000001 ETH
      
      await privateICO.connect(contributor1).contribute(tinyAmount, {
        value: tinyAmount
      });

      expect(await privateICO.getContributorsCount()).to.equal(1);
    });

    it("Should handle multiple contributors within hard cap", async function () {
      // 0.02 ETH each from 5 contributors = 0.1 ETH (exactly at hard cap)
      const signers = await ethers.getSigners();
      
      for (let i = 0; i < 5 && i < signers.length; i++) {
        if (i < 4) {
          await privateICO.connect(signers[i]).contribute(20000000000000000n, {
            value: ethers.parseEther("0.02")
          });
        } else {
          // Last contribution reaches hard cap
          const tx = await privateICO.connect(signers[i]).contribute(20000000000000000n, {
            value: ethers.parseEther("0.02")
          });
          await expect(tx).to.emit(privateICO, "HardCapReached");
        }
      }

      expect(await privateICO.getContributorsCount()).to.equal(5);
    });

    it("Should handle contribution exactly at sale end time", async function () {
      const saleInfo = await privateICO.getSaleInfo();
      
      // Move to just before sale end
      await time.increaseTo(Number(saleInfo.end) - 5);

      await expect(
        privateICO.connect(contributor1).contribute(50000000000000000n, {
          value: ethers.parseEther("0.05")
        })
      ).to.not.be.reverted;
    });

    it("Should handle contribution amount at hard cap limit", async function () {
      const exactCapAmount = 100000000000000000n; // Exactly 0.1 ETH
      
      await privateICO.connect(contributor1).contribute(exactCapAmount, {
        value: ethers.parseEther("0.1")
      });

      expect(await privateICO.getContributorsCount()).to.equal(1);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for contributions", async function () {
      const tx = await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      const receipt = await tx.wait();
      console.log("Gas used for contribution:", receipt.gasUsed.toString());
      
      // FHE operations use more gas, but should be reasonable
      expect(receipt.gasUsed).to.be.lt(10000000);
    });
  });

  describe("Integration Tests - Full Lifecycle", function () {
    it("Should complete full ICO lifecycle with hard cap", async function () {
      console.log("\n=== Full ICO Lifecycle Test with Hard Cap ===");
      
      // 1. Multiple contributions up to hard cap
      console.log("Step 1: Making contributions up to hard cap...");
      await privateICO.connect(contributor1).contribute(50000000000000000n, {
        value: ethers.parseEther("0.05")
      });

      await privateICO.connect(contributor2).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      const tx = await privateICO.connect(contributor3).contribute(20000000000000000n, {
        value: ethers.parseEther("0.02")
      });

      // Hard cap should be reached
      await expect(tx).to.emit(privateICO, "HardCapReached");

      const contributorCount = await privateICO.getContributorsCount();
      expect(contributorCount).to.equal(3);
      console.log("✓", contributorCount.toString(), "contributors added");
      console.log("✓ Hard cap of 0.1 ETH reached, sale auto-closed");

      // 2. Verify sale is closed
      const saleInfo1 = await privateICO.getSaleInfo();
      expect(saleInfo1.end).to.be.lte(await time.latest());
      console.log("✓ Sale automatically closed when hard cap reached");

      // 3. Make total decryptable
      console.log("Step 2: Making total decryptable...");
      await privateICO.makeTotalDecryptable();
      const saleInfo2 = await privateICO.getSaleInfo();
      expect(saleInfo2.totalDecryptable).to.equal(true);
      console.log("✓ Total is now decryptable");

      // Note: In a real scenario, you would need to:
      // 4. Call verifyAndSetTotal() with decryption proof from KMS
      // 5. Call verifyMyContribution() for each contributor
      // 6. Call claimTokens() for each contributor
      
      console.log("✓ Basic lifecycle test complete");
      console.log("Note: Full token claiming requires KMS decryption proofs");
      console.log("=== Full Lifecycle Complete ===\n");
    });

    it("Should complete full ICO lifecycle with early manual closure", async function () {
      console.log("\n=== Full ICO Lifecycle Test with Manual Closure ===");
      
      // 1. Make partial contributions (below hard cap)
      console.log("Step 1: Making partial contributions...");
      await privateICO.connect(contributor1).contribute(40000000000000000n, {
        value: ethers.parseEther("0.04")
      });

      await privateICO.connect(contributor2).contribute(30000000000000000n, {
        value: ethers.parseEther("0.03")
      });

      const contributorCount = await privateICO.getContributorsCount();
      expect(contributorCount).to.equal(2);
      console.log("✓", contributorCount.toString(), "contributors added (0.07 ETH total)");

      // 2. Owner manually closes sale before hard cap
      console.log("Step 2: Owner closing sale manually...");
      await privateICO.connect(owner).closeSale();
      const saleInfo1 = await privateICO.getSaleInfo();
      expect(saleInfo1.end).to.be.lte(await time.latest());
      console.log("✓ Sale manually closed by owner");

      // 3. Make total decryptable
      console.log("Step 3: Making total decryptable...");
      await privateICO.makeTotalDecryptable();
      const saleInfo2 = await privateICO.getSaleInfo();
      expect(saleInfo2.totalDecryptable).to.equal(true);
      console.log("✓ Total is now decryptable");

      console.log("✓ Manual closure lifecycle test complete");
      console.log("=== Full Lifecycle Complete ===\n");
    });
  });
});