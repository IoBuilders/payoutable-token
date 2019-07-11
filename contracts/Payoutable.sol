pragma solidity ^0.5.0;

import "./IPayoutable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract Payoutable is IPayoutable, ERC20 {

    mapping(address => mapping(address => bool)) private payoutOperators;

    function orderPayout(string calldata operationId, uint256 value, string calldata instructions) external returns (bool) {
        return true;
    }

    function orderPayoutFrom(
        string calldata operationId,
        address walletToBePaidOut,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        return true;
    }

    function cancelPayout(string calldata operationId) external returns (bool) {
        return true;
    }

    function processPayout(string calldata operationId) external returns (bool) {
        return true;
    }

    function putFundsInSuspenseInPayout(string calldata operationId) external returns (bool) {
        return true;
    }

    function executePayout(string calldata operationId) external returns (bool) {
        return true;
    }

    function rejectPayout(string calldata operationId, string calldata reason) external returns (bool) {
        return true;
    }

    function retrievePayoutData(string calldata operationId) external view returns (
        address walletToDebit,
        uint256 value,
        string memory instructions,
        PayoutStatusCode status
    )
    {

    }

    function isPayoutOperatorFor(address operator, address from) external view returns (bool) {
        return payoutOperators[from][operator];
    }

    function authorizePayoutOperator(address operator) external returns (bool) {
        require (payoutOperators[msg.sender][operator] == false, "The operator is already authorized");

        payoutOperators[msg.sender][operator] = true;
        emit AuthorizedPayoutOperator(operator, msg.sender);
        return true;
    }

    function revokePayoutOperator(address operator) external returns (bool) {
        require (payoutOperators[msg.sender][operator], "The operator is already not authorized");

        payoutOperators[msg.sender][operator] = false;
        emit RevokedPayoutOperator(operator, msg.sender);
        return true;
    }
}
