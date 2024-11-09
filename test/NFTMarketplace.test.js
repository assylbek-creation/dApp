const NFTMarketplace = artifacts.require("NFTMarketplace");

contract("NFTMarketplace", (accounts) => {
  const [deployer, user1, user2] = accounts;

  let marketplace;

  beforeEach(async () => {
    marketplace = await NFTMarketplace.deployed();
  });

  it("should mint an NFT", async () => {
    await marketplace.mint("https://token-uri.com", { from: user1 });
    const owner = await marketplace.ownerOf(0);
    assert.equal(owner, user1, "Owner of token should be user1");

    const tokenURI = await marketplace.tokenURI(0);
    assert.equal(tokenURI, "https://token-uri.com", "Token URI should match");
  });

  it("should emit Transfer event on minting", async () => {
    const receipt = await marketplace.mint("https://token-uri-event.com", { from: user1 });
    
    assert.equal(receipt.logs[0].event, "Transfer", "Transfer event should be emitted");
    assert.equal(receipt.logs[0].args.from, "0x0000000000000000000000000000000000000000", "From address should be zero address for mint");
    assert.equal(receipt.logs[0].args.to, user1, "To address should be user1");
  });

  it("should list an NFT for sale", async () => {
    await marketplace.listItem(0, web3.utils.toWei('1', 'ether'), { from: user1 });
    const listedItem = await marketplace.listedItems(0);
    assert.equal(listedItem.seller, user1, "Seller should be user1");
    assert.equal(listedItem.price, web3.utils.toWei('1', 'ether'), "Price should match 1 ETH");
  });


  it("should fail if a non-owner tries to list an NFT for sale", async () => {
    // Mint a new NFT owned by user1
    await marketplace.mint("https://token-uri-non-owner.com", { from: user1 });
    
    try {
      // Attempt to list NFT by user2, who is not the owner
      await marketplace.listItem(2, web3.utils.toWei('1', 'ether'), { from: user2 });
      assert.fail("Only the owner should be able to list an NFT for sale");
    } catch (err) {
      assert(err.message.includes("Not owner"), "Expected error message not found for non-owner listing attempt");
    }
  });


  it("should emit ItemSold event on successful purchase", async () => {
    // Mint and list a new NFT by user1
    await marketplace.mint("https://token-uri-sold-event.com", { from: user1 });
    await marketplace.listItem(3, web3.utils.toWei('1', 'ether'), { from: user1 });

    // Purchase the NFT by user2
    const receipt = await marketplace.buyItem(3, { from: user2, value: web3.utils.toWei('1', 'ether') });

    // Verify that the ItemSold event was emitted with correct parameters
    const event = receipt.logs.find(log => log.event === "ItemSold");
    assert(event, "ItemSold event should be emitted");
    assert.equal(event.args.tokenId.toString(), "3", "Token ID should match");
    assert.equal(event.args.buyer, user2, "Buyer address should match");
    assert.equal(event.args.price, web3.utils.toWei('1', 'ether'), "Price should match 1 ETH");
  });


  it("should fail if someone tries to buy an item with incorrect price", async () => {
    await marketplace.mint("https://token-uri-3.com", { from: user1 });
    await marketplace.listItem(2, web3.utils.toWei('1', 'ether'), { from: user1 });

    try {
      await marketplace.buyItem(2, { from: user2, value: web3.utils.toWei('0.5', 'ether') });
      assert.fail("The purchase should have failed due to incorrect price");
    } catch (err) {
      assert(err.message.includes("Incorrect value"), "Expected error message not found");
    }
  });

  it("should allow another user to buy the NFT", async () => {
    const price = web3.utils.toWei('1', 'ether');

    // Buy NFT from user1
    await marketplace.buyItem(0, { from: user2, value: price });

    const newOwner = await marketplace.ownerOf(0);
    assert.equal(newOwner, user2, "Owner should be user2 after purchase");

    const listedItem = await marketplace.listedItems(0);
    assert.equal(listedItem.isSold, true, "Item should be marked as sold");
  });

  it("should transfer the correct payment to the seller and fee to the marketplace", async () => {
    // Mint and list a new NFT
    await marketplace.mint("https://token-uri-2.com", { from: user1 });
    await marketplace.listItem(1, web3.utils.toWei('2', 'ether'), { from: user1 });

    const sellerBalanceBefore = await web3.eth.getBalance(user1);
    const marketplaceBalanceBefore = await web3.eth.getBalance(deployer);
    
    // Buy the NFT
    const price = web3.utils.toWei('2', 'ether');
    const fee = web3.utils.toWei('0.1', 'ether'); // Assuming a 0.1 ETH fee
    await marketplace.buyItem(1, { from: user2, value: price });

    const sellerBalanceAfter = await web3.eth.getBalance(user1);
    const marketplaceBalanceAfter = await web3.eth.getBalance(deployer);

    assert(
      new web3.utils.BN(sellerBalanceAfter).sub(new web3.utils.BN(sellerBalanceBefore)).toString(),
      web3.utils.toWei('1.9', 'ether'),
      "Seller should receive the price minus fee"
    );

    assert(
      new web3.utils.BN(marketplaceBalanceAfter).sub(new web3.utils.BN(marketplaceBalanceBefore)).toString(),
      fee,
      "Marketplace should receive the fee"
    );
  });

  it("should fail if someone tries to buy an already sold NFT", async () => {
    // Mint and list a new NFT by user1
    await marketplace.mint("https://token-uri-already-sold.com", { from: user1 });
    await marketplace.listItem(4, web3.utils.toWei('1', 'ether'), { from: user1 });

    // First purchase by user2
    await marketplace.buyItem(4, { from: user2, value: web3.utils.toWei('1', 'ether') });

    try {
      // Attempt a second purchase of the same NFT by user2
      await marketplace.buyItem(4, { from: user2, value: web3.utils.toWei('1', 'ether') });
      assert.fail("The purchase should have failed as the item is already sold");
    } catch (err) {
      assert(err.message.includes("Item already sold"), "Expected error message not found for already sold item");
    }
});


  
  
  
});
