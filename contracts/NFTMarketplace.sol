// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint public nextTokenId;
    uint public fee;
    address payable public marketplaceOwner;

    struct ListedItem {
        address seller;
        uint price;
        bool isSold;
        address buyer;
    }

    mapping(uint => ListedItem) public listedItems;

    event NFTMinted(uint tokenId, address owner);
    event ItemListed(uint tokenId, uint price, address seller);
    event ItemSold(uint tokenId, address indexed buyer, uint price);

    constructor(uint _fee, string memory _name, string memory _symbol) 
        ERC721(_name, _symbol)
        Ownable() 
    {
        fee = _fee;
        marketplaceOwner = payable(msg.sender);
    }

    function mint(string memory tokenURI) external {
        uint tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        nextTokenId++;
        emit NFTMinted(tokenId, msg.sender);
    }

    function listItem(uint _tokenId, uint _price) external {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");
        require(_price > 0, "Price must be greater than zero");
        require(!listedItems[_tokenId].isSold, "Item already sold");

        listedItems[_tokenId] = ListedItem(msg.sender, _price, false, address(0)); // Add `address(0)` for the buyer
        emit ItemListed(_tokenId, _price, msg.sender);
    }

    function buyItem(uint _tokenId) external payable nonReentrant {
        ListedItem storage item = listedItems[_tokenId];
        require(msg.value == item.price, "Incorrect value");
        require(!item.isSold, "Item already sold");

        // Проверка, что продавец действительно является владельцем токена
        require(ownerOf(_tokenId) == item.seller, "Seller is not the owner");

        // Передача NFT от продавца к покупателю
        _transfer(item.seller, msg.sender, _tokenId);

        // Выплата продавцу за вычетом комиссии
        (bool sellerPaid, ) = payable(item.seller).call{value: msg.value - fee}("");
        require(sellerPaid, "Payment to seller failed");

        // Выплата комиссии владельцу маркетплейса
        (bool ownerPaid, ) = marketplaceOwner.call{value: fee}("");
        require(ownerPaid, "Payment to marketplace owner failed");

        item.isSold = true;
        item.buyer = msg.sender; // Add this line to record the buyer
        emit ItemSold(_tokenId, msg.sender, msg.value);
    }
}
