pragma solidity ^0.5.0;

import "../Payoutable.sol";


contract PayoutableMock is Payoutable {
    bool isExpiredSet;
    bool isExpired;

    function mint(address account, uint256 value) external {
        _mint(account, value);
    }

//    function changeHoldExpirationTime(string calldata operationId, uint256 _expiration) external {
//        holds[operationId.toHash()].expiration = _expiration;
//    }
//
//    function setExpired(bool _isExpired) external {
//        isExpiredSet = true;
//        isExpired = _isExpired;
//    }
//
//    function _isExpired(uint256 expiration) internal view returns (bool) {
//        if (isExpiredSet) {
//            return isExpired;
//        }
//
//        return super._isExpired(expiration);
//    }
}
