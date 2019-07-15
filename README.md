# Payoutable Token

[![Build Status](https://travis-ci.org/IoBuilders/payoutable-token.svg?branch=master)](https://travis-ci.org/IoBuilders/holdable-token)
[![Coverage Status](https://coveralls.io/repos/github/IoBuilders/payoutable-token/badge.svg?branch=master)](https://coveralls.io/github/IoBuilders/holdable-token?branch=master)
[![npm](https://img.shields.io/npm/v/eip2021.svg)](https://www.npmjs.com/package/eip2021)

This is the reference implementation of [EIP-2021 Payoutable token](https://github.com/ethereum/EIPs/pull/2021/files). This implementation will change over time with the standard and is not stable at the moment.

Feedback is appreciated and can given at [the discussion of the EIP](https://github.com/ethereum/EIPs/issues/2021).

## Summary

An extension to the ERC-20 standard token that allows Token wallet owners to request payout from their wallet, by calling the smart contract and attaching a payout instruction string.

## Abstract

Token wallet owners (or approved addresses) can order payout requests through  blockchain. This is done by calling the ```orderPayoutFrom``` or ```orderPayoutFrom``` methods, which initiate the workflow for the token contract operator to either honor or reject the payout request. In this case, payout instructions are provided when submitting the request, which are used by the operator to determine the destination of the funds.

In general, it is not advisable to place explicit routing instructions for the payouts on a verbatim basis on the blockchain, and it is advised to use a private communication alternatives, such as private channels, encrypted storage or similar,  to do so (external to the blockchain ledger). Another (less desirable) possibility is to place these instructions on the instructions field in encrypted form.

## Sequence diagrams

### Payout executed

The following diagram shows the sequence of the payout creation and execution.

![Payoutable Token: Payout executed](http://www.plantuml.com/plantuml/png/dP51oi8m44RtESNG_N-1Vo7jGi6LWlK0QVFfedKYoGJqzbh7GAGKn6NoUFaUf8vYWwJBQ8uHeQ6_5LLxU_T9R3U2MZ-0gt_omI7elPdpmgBc39QdeSVTvC6PJxgq8i5oFEMXrXzIl88ZchxtYQL8p8JUg90N-bvkpjeaTd7B-PKlyt13dmHApAn1FMtiB0zaVsfRwuepDTXD7_C0)

### Payout cancelled

The following diagram shows the sequence of the payout creation and cancellation.

![Payoutable Token: Payout cancelled](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuGejJYroLD2rKr0AIApCBor9JCf9LGZ9pqxDKx9Io2zAIIs2Y7DXoYFfKd1CJyqh0Ug0SFr1-b9Jy1kUd9YNd9f3XkdEO8qvGFCTKlDIW9u00000)

### Payout rejected

The following diagram shows the sequence of the payout creation and rejection.

![Payoutable Token: Payout rejected](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuGejJYroLD2rKr0AIApCBor9JCf9LGZ9pqxDKx9Io2zAIIs2Y7DXoYFfKd1CJyqh0Ug0SFr1-b9Jk51bSTbIb9gLcbo2rngmAs6c1u7L0urtICrB0Ve10000)

## State diagram

![Holdable Payoutable: State Diagram](http://www.plantuml.com/plantuml/png/TLB1IWGn3BttAzvPs1_m80kYu4dHetZ8j1btt6uwDAauVozTjfrPq5D9tilBUw5xDSfMJj6zttnWjxl3SmwSETpYXPPKx5AwotkcFCbRqPb5kR4UYmHTswwBM3goADA8efn1cN7W640I8Cb0tpH56Y9ZJ1cMINJaZ28sHSndRKoAEIVFgXpSkWHTdJBtqUhH4kp0q4OaxrCHsyxM60y_x8kjKLljEh1TC9GiXZ6dqv_YDL45kf7cekPM32J7Hgs1GXA-kkazYUSOLpUzuJQG9q6Ik61WUAez34jVSoNuob_iD-bQxJhmlrgxF7socDkpXFf3VW40)

## Install

```
npm install eip2021
```

## Usage

To write your custom contracts, import the contract and extend it through inheritance.

```solidity
pragma solidity ^0.5.0;

import 'eip2021/contracts/Payoutable.sol';

contract MyPayoutable is Payoutable {
    // your custom code
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle], [Embark] or [Buidler].

## Tests

To run the unit tests execute `npm test`.

## Code coverage

To get the code coverage report execute `npm run coverage`

[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
[Buidler]: https://buidler.dev/guides/#getting-started
