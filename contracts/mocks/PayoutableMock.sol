pragma solidity ^0.5.0;

import "../Payoutable.sol";


contract PayoutableMock is Payoutable {
    bool isExpiredSet;
    bool isExpired;

    constructor(address _suspenseAccount) public Payoutable(_suspenseAccount) {
        // solium-disable-previous-line no-empty-blocks
    }

    function mint(address account, uint256 value) external {
        _mint(account, value);
    }
}
