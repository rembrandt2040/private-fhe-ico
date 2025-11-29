const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivateToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  let icoContract;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  
  beforeEach(async function () {
    [owner, addr1, addr2, icoContract] = await ethers.getSigners();
    
    const PrivateToken = await ethers.getContractFactory("PrivateToken");
    token = await PrivateToken.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
    
    it("Should have correct token metadata", async function () {
      expect(await token.name()).to.equal("PrivateToken");
      expect(await token.symbol()).to.equal("PVTK");
      expect(await token.decimals()).to.equal(18);
    });
    
    it("Should mint initial supply to owner", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      // Balance is encrypted, so we check hasBalance instead
      expect(await token.hasBalance(owner.address)).to.be.true;
    });
    
    it("Should return correct token info", async function () {
      const info = await token.getTokenInfo();
      expect(info._name).to.equal("PrivateToken");
      expect(info._symbol).to.equal("PVTK");
      expect(info._decimals).to.equal(18);
      expect(info._totalSupply).to.equal(INITIAL_SUPPLY);
      expect(info._owner).to.equal(owner.address);
    });
  });
  
  describe("ICO Integration", function () {
    it("Should allow owner to set ICO contract", async function () {
      await expect(token.setICOContract(icoContract.address))
        .to.emit(token, "ICOContractSet")
        .withArgs(icoContract.address);
      
      const info = await token.getTokenInfo();
      expect(info._icoContract).to.equal(icoContract.address);
    });
    
    it("Should reject non-owner setting ICO contract", async function () {
      await expect(
        token.connect(addr1).setICOContract(icoContract.address)
      ).to.be.revertedWith("Only owner");
    });
    
    it("Should reject setting ICO contract twice", async function () {
      await token.setICOContract(icoContract.address);
      
      await expect(
        token.setICOContract(addr1.address)
      ).to.be.revertedWith("ICO already set");
    });
    
    it("Should reject zero address for ICO contract", async function () {
      await expect(
        token.setICOContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
    
    it("Should allow owner to approve ICO contract", async function () {
      await token.setICOContract(icoContract.address);
      
      const approvalAmount = ethers.parseEther("500000");
      await expect(token.approveICO(approvalAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, icoContract.address, approvalAmount);
      
      expect(await token.allowance(owner.address, icoContract.address))
        .to.equal(approvalAmount);
    });
    
    it("Should reject approveICO before setting ICO contract", async function () {
      await expect(
        token.approveICO(ethers.parseEther("1000"))
      ).to.be.revertedWith("ICO not set");
    });
  });
  
  describe("Transfers", function () {
    it("Should transfer tokens", async function () {
      const amount = ethers.parseEther("1000");
      
      await expect(token.transfer(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
      
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
    
    it("Should reject transfer to zero address", async function () {
      await expect(
        token.transfer(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("Transfer to zero address");
    });
    
    it("Should reject transfer exceeding balance", async function () {
      const tooMuch = ethers.parseEther("2000000"); // More than total supply
      
      // This will fail at FHE.req
      await expect(
        token.transfer(addr1.address, tooMuch)
      ).to.be.reverted;
    });
    
    it("Should handle multiple transfers", async function () {
      const amount = ethers.parseEther("100");
      
      await token.transfer(addr1.address, amount);
      await token.transfer(addr1.address, amount);
      await token.transfer(addr1.address, amount);
      
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
    
    it("Should allow transferFrom with approval", async function () {
      const amount = ethers.parseEther("1000");
      
      // Approve addr1 to spend owner's tokens
      await token.approve(addr1.address, amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
      
      // Transfer from owner to addr2 via addr1
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.emit(token, "Transfer")
        .withArgs(owner.address, addr2.address, amount);
      
      // Allowance should be reduced
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });
    
    it("Should reject transferFrom exceeding allowance", async function () {
      const allowed = ethers.parseEther("100");
      const requested = ethers.parseEther("200");
      
      await token.approve(addr1.address, allowed);
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, requested)
      ).to.be.revertedWith("Allowance exceeded");
    });
  });
  
  describe("Approvals", function () {
    it("Should set allowance", async function () {
      const amount = ethers.parseEther("5000");
      
      await expect(token.approve(addr1.address, amount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, amount);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
    });
    
    it("Should update allowance", async function () {
      await token.approve(addr1.address, ethers.parseEther("1000"));
      await token.approve(addr1.address, ethers.parseEther("5000"));
      
      expect(await token.allowance(owner.address, addr1.address))
        .to.equal(ethers.parseEther("5000"));
    });
    
    it("Should allow setting zero allowance", async function () {
      await token.approve(addr1.address, ethers.parseEther("1000"));
      await token.approve(addr1.address, 0);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });
  
  describe("Minting", function () {
    it("Should allow owner to mint", async function () {
      const mintAmount = ethers.parseEther("100000");
      const initialSupply = await token.totalSupply();
      
      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "Mint")
        .withArgs(addr1.address, mintAmount);
      
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
    
    it("Should reject non-owner minting", async function () {
      await expect(
        token.connect(addr1).mint(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Only owner");
    });
    
    it("Should reject minting to zero address", async function () {
      await expect(
        token.mint(ethers.ZeroAddress, ethers.parseEther("1000"))
      ).to.be.revertedWith("Mint to zero address");
    });
    
    it("Should accumulate minted amounts", async function () {
      await token.mint(addr1.address, ethers.parseEther("1000"));
      await token.mint(addr1.address, ethers.parseEther("2000"));
      
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
  });
  
  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await token.totalSupply();
      
      await expect(token.burn(burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, burnAmount);
      
      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    });
    
    it("Should reject burning more than balance", async function () {
      const tooMuch = ethers.parseEther("2000000");
      
      await expect(token.burn(tooMuch)).to.be.reverted;
    });
  });
  
  describe("Balance Decryption", function () {
    it("Should allow making balance decryptable", async function () {
      await token.makeBalanceDecryptable();
      expect(await token.balanceDecryptable(owner.address)).to.be.true;
    });
    
    it("Should reject making balance decryptable twice", async function () {
      await token.makeBalanceDecryptable();
      
      await expect(
        token.makeBalanceDecryptable()
      ).to.be.revertedWith("Already decryptable");
    });
    
    it("Should reject decryption for accounts without balance", async function () {
      await expect(
        token.connect(addr1).makeBalanceDecryptable()
      ).to.be.revertedWith("No balance");
    });
  });
  
  describe("View Functions", function () {
    it("Should return encrypted balance", async function () {
      // This returns an encrypted value handle
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.not.equal(0n); // It's a handle, not the actual value
    });
    
    it("Should return zero clear balance before decryption", async function () {
      expect(await token.balanceOfClear(owner.address)).to.equal(0);
    });
    
    it("Should check if balance exists", async function () {
      expect(await token.hasBalance(owner.address)).to.be.true;
      expect(await token.hasBalance(addr1.address)).to.be.false;
    });
  });
  
  describe("Encrypted Transfers", function () {
    it("Should emit EncryptedTransfer event", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(token.transfer(addr1.address, amount))
        .to.emit(token, "EncryptedTransfer")
        .withArgs(owner.address, addr1.address);
    });
  });
  
  describe("ICO Flow Integration", function () {
    it("Should support complete ICO flow", async function () {
      // 1. Set ICO contract
      await token.setICOContract(icoContract.address);
      
      // 2. Approve ICO to spend tokens
      const approvalAmount = ethers.parseEther("500000");
      await token.approveICO(approvalAmount);
      
      // 3. ICO contract transfers tokens to user
      await token.connect(icoContract).transferFrom(
        owner.address,
        addr1.address,
        ethers.parseEther("1000")
      );
      
      expect(await token.hasBalance(addr1.address)).to.be.true;
      
      // 4. User can transfer received tokens
      await token.connect(addr1).transfer(
        addr2.address,
        ethers.parseEther("500")
      );
      
      expect(await token.hasBalance(addr2.address)).to.be.true;
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle very small transfers", async function () {
      const smallAmount = 1n; // 1 wei
      
      await token.transfer(addr1.address, smallAmount);
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
    
    it("Should handle transfer to self", async function () {
      const amount = ethers.parseEther("100");
      
      await token.transfer(owner.address, amount);
      expect(await token.hasBalance(owner.address)).to.be.true;
    });
    
    it("Should handle rapid sequential transfers", async function () {
      for (let i = 0; i < 5; i++) {
        await token.transfer(addr1.address, ethers.parseEther("10"));
      }
      
      expect(await token.hasBalance(addr1.address)).to.be.true;
    });
  });
  
  describe("Security", function () {
    it("Should protect encrypted balances", async function () {
      // Encrypted balance should not equal the actual value
      const balance = await token.balanceOf(owner.address);
      expect(balance).to.not.equal(INITIAL_SUPPLY);
    });
    
    it("Should require decryption flow to see balance", async function () {
      // Clear balance is 0 until decryption
      expect(await token.balanceOfClear(owner.address)).to.equal(0);
      
      // Make decryptable
      await token.makeBalanceDecryptable();
      
      // Still 0 until verified
      expect(await token.balanceOfClear(owner.address)).to.equal(0);
      
      // In real flow, verifyBalance would be called with KMS proof
    });
  });
});
