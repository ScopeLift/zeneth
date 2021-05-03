/**
 * @notice Zeneth Deployment script
 * @dev At each contract deployment or transaction, we wait for the transaction to be mined before
 * continuing to the next step. This is done because it makes it simpler to continue from that spot
 * rather than restart the full deployment
 * @dev To initialize a deploy:
 *   `yarn deploy --network <network>`   (where network specifies a netwrk found in the hardhat.config.ts file)
 * If deploying to a local node (--network localhost), first start Hardhat using `yarn hardhat node`
 */
const fs = require('fs');
const hre = require('hardhat');
const { exit } = require('process');
const { ethers } = hre;

const network = process.env.HARDHAT_NETWORK;

// Initialize object that will hold all deploy info. We'll continually update this and save it to
// a file using the save() method below
const parameters = {
  admin: null,
  contracts: {}, // will be populated with all contract addresses
  actions: {}, // will be populated with deployment actions
};

// Setup for saving off deploy info to JSON files
const now = new Date().toISOString();
const folderName = './deploy-history';
const fileName = `${folderName}/${network}-${now}.json`;
const latestFileName = `${folderName}/${network}-latest.json`;
fs.mkdir(folderName, (err) => {
  if (err && err.code !== 'EEXIST') throw err;
});

// method to save the deploy info to 2 JSON files
//  first one named with network and timestamp, contains all relevant deployment info
//  second one name with network and "latest", contains only contract addresses deployed
const save = (value, field, subfield = undefined) => {
  if (subfield) {
    parameters[field][subfield] = value;
  } else {
    parameters[field] = value;
  }
  fs.writeFileSync(fileName, JSON.stringify(parameters));
};

// IIFE async function so "await"s can be performed for each operation
(async function () {
  try {
    const deployParams = require('./deployParams.json');
    const deployParamsForNetwork = deployParams[network];

    if (!deployParamsForNetwork) {
      console.log('Invalid network requested', network);
      save(network, 'actions', 'InvalidNetworkRequested');
      exit();
    }

    console.log('Deploying to: ', network);
    save(network, 'actions', 'DeployingContractsToNetwork');

    const [adminWallet] = await ethers.getSigners();
    save(adminWallet.address, 'admin');

    // deploy the SwapBriber contract
    const SwapBriber = await ethers.getContractFactory('SwapBriber', adminWallet);
    const swapBriber = await SwapBriber.deploy();
    await swapBriber.deployed();
    save(swapBriber.address, 'contracts', 'SwapBriber');
    console.log('SwapBriber contract deployed to address: ', swapBriber.address);

    // everything went well, save the deployment info in the 'latest' JSON file
    fs.writeFileSync(latestFileName, JSON.stringify(parameters));

    // catch any error from operations above, log it and save it to deploy history file
  } catch (error) {
    save(error.toString(), 'actions', 'Error');
    console.log('Deployment Error: ', error.toString());
  }
})();
