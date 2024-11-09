// const NFTMarketplace = artifacts.require("NFTMarketplace");

// module.exports = function (deployer) {
//   const marketplaceFee = 1000000000000000; // 0.001 ETH
//   deployer.deploy(NFTMarketplace, marketplaceFee);
// };
const NFTMarketplace = artifacts.require("NFTMarketplace");

module.exports = function (deployer) {
  const fee = 100; // Укажите нужную вам комиссию
  const name = "MyNFT"; // Имя токена
  const symbol = "NFT"; // Символ токена

  deployer.deploy(NFTMarketplace, fee, name, symbol);
};
  