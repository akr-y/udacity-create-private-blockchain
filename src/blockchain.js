/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require("crypto-js/sha256");
const BlockClass = require("./block.js");
const bitcoinMessage = require("bitcoinjs-message");

class Blockchain {
  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new BlockClass.Block({ data: "Genesis Block" });
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    return new Promise((resolve, reject) => {
      resolve(this.height);
    });
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  _addBlock(block) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        const newBlock = block;
        newBlock.height = self.chain.length;
        newBlock.time = new Date().getTime().toString().slice(0, -3);
        if (self.chain.length > 0) {
          newBlock.previousBlockHash = self.chain[self.chain.length - 1].hash;
        }
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        self.chain.push(newBlock);
        self.height = self.chain.length;
        console.log("New chain: ", self.chain);
        console.log(self);
        resolve(newBlock);
      } catch (e) {
        reject(new Error(e));
      }
    });
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    return new Promise((resolve) => {
      const message = `${address}:${new Date()
        .getTime()
        .toString()
        .slice(0, -3)}:starRegistry`;
      resolve(message);
    });
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      const messageTime = parseInt(message.split(":")[1]);
      const currentTime = parseInt(
        new Date().getTime().toString().slice(0, -3)
      );
      console.log(messageTime);
      console.log(currentTime);
      if (currentTime - messageTime <= 5 * 60) {
        console.log("Before verified");
        console.log(message);
        console.log(address);
        console.log(signature);
        const verified = bitcoinMessage.verify(message, address, signature);
        console.log(verified);
        if (verified) {
          const block = new BlockClass.Block({ owner: address, star: star });
          const addedBlock = await self._addBlock(block);
          console.log(addedBlock);
          resolve(addedBlock);
        } else {
          reject(new Error("Not verified"));
        }
      } else {
        reject(new Error("Expired"));
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    let self = this;
    return new Promise((resolve, reject) => {
      const block = self.chain.filter((p) => p.hash === hash)[0];
      resolve(block || null);
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this;
    return new Promise((resolve, reject) => {
      let block = self.chain.filter((p) => p.height === height)[0];
      if (block) {
        resolve(block);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  getStarsByWalletAddress(address) {
    let self = this;
    let stars = [];
    return new Promise((resolve, reject) => {
      //stars. = self.chain.filter(p => JSON.stringify(p.body).split(':')[0] == address)[0];
      //stars = blocks.body.split(':')[2];
      console.log("Owner Address:", address);
      console.log("Current height:", self.height);
      for (var i = 0; i < self.height; i++) {
        //i starts from 1 to skip the genesis block
        self.chain[i]
          .getBData()
          .then((block) => {
            //block is the data from the ith block in the blockchain
            //pki is the primary key(address) extracted from the ith block's data
            let owner = block.owner;
            console.log("This is the PK extracted from block # ", i, owner);
            if (owner == address) {
              //Extract the star information from the block's body
              //(Because each block contains only 1 star)
              console.log("The body for this block is: ", block);
              stars.push(block);
            }
          })
          .catch((err) =>
            console.log("Error from getStarsByWalletAddress: ", err)
          );
      }
      console.log("The stars resulted from getStarsByWalletAddress: ", stars);
      resolve(stars);
    });
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  validateChain() {
    let self = this;
    let errorLog = [];

    let currentHash = null;
    let previousHash = null;
    return new Promise(async (resolve, reject) => {
      //For each block in the chain:
      for (var i = 0; i < self.chain.length; i++) {
        //1. You should validate each block using`validateBlock`
        self.chain[i]
          .validate()
          .then((d) => {
            console.log("validated", d);
          })
          .catch((x) =>
            errorLog.push(
              "Block #" +
                i +
                " cannot be validated. Reason: Individual block validation failed..."
            )
          );
        //2. Each Block should check the with the previousBlockHash
        currentHash = self.chain[i].previousBlockHash;
        if (currentHash !== previousHash) {
          console.log(
            "Block Number " +
              i +
              " cannot be validated, because:\n" +
              currentHash +
              " != " +
              previousHash
          );
          errorLog.push(
            "Block #" +
              i +
              "cannot be validated. Reason: Previous Hash not identical...\n"
          );
        }
        previousHash = self.chain[i].hash;
      }
      resolve(errorLog);
    });
  }
}

module.exports.Blockchain = Blockchain;
