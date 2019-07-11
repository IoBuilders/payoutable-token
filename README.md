# Payoutable Token

This is the work in progress implementation of [EIP-2021 Payoutable token](https://github.com/ethereum/EIPs/pull/2021/files). This implementation will change over time with the standard and is not stable at the moment.

Feedback is appreciated and can given at [the discussion of the EIP](https://github.com/ethereum/EIPs/issues/2021).

## Summary

An extension to the ERC-20 standard token that allows Token wallet owners to request payout from their wallet, by calling the smart contract and attaching a payout instruction string.

## Abstract

Token wallet owners (or approved addresses) can order payout requests through  blockchain. This is done by calling the ```orderPayoutFrom``` or ```orderPayoutFrom``` methods, which initiate the workflow for the token contract operator to either honor or reject the payout request. In this case, payout instructions are provided when submitting the request, which are used by the operator to determine the destination of the funds.

In general, it is not advisable to place explicit routing instructions for the payouts on a verbatim basis on the blockchain, and it is advised to use a private communication alternatives, such as private channels, encrypted storage or similar,  to do so (external to the blockchain ledger). Another (less desirable) possibility is to place these instructions on the instructions field in encrypted form.

## Install

```
npm install erc2021
```

## Usage

To write your custom contracts, import it and extend it through inheritance.

```solidity
pragma solidity ^0.5.0;

import 'erc2021/contracts/Payoutable.sol';

contract MyPayoutable is Payoutable {
    // your custom code
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle], [Embark] or [Buidler].

## Tests

To run the unit tests a local blockchain, like [Ganache](https://www.trufflesuite.com/ganache) has to be running.  Once it does execute `npm test` to run the tests.

## Code coverage

To run the code coverage simply execute `npm run coverage`

[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
[Buidler]: https://buidler.dev/guides/#getting-started
