pragma solidity ^0.5.0;

import "./IPayoutable.sol";
import "eip1996/contracts/Holdable.sol";

contract Payoutable is IPayoutable, Holdable {

    struct OrderedPayout {
        PayoutStatusCode status;
    }

    mapping(bytes32 => OrderedPayout) private orderedPayouts;
    mapping(address => mapping(address => bool)) private payoutOperators;
    address internal payoutAgent;

    constructor() public {
        payoutAgent = msg.sender;
    }

    function orderPayout(string calldata operationId, uint256 value, string calldata instructions) external returns (bool) {
        emit PayoutOrdered(
            msg.sender,
            operationId,
            msg.sender,
            value,
            instructions
        );

        return _orderPayout(
            msg.sender,
            operationId,
            msg.sender,
            value,
            instructions
        );
    }

    function orderPayoutFrom(
        string calldata operationId,
        address walletToBePaidOut,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        require(walletToBePaidOut != address(0), "walletToBePaidOut address must not be zero address");
        require(payoutOperators[walletToBePaidOut][msg.sender], "This operator is not authorized");

        emit PayoutOrdered(
            msg.sender,
            operationId,
            walletToBePaidOut,
            value,
            instructions
        );

        return _orderPayout(
            msg.sender,
            operationId,
            walletToBePaidOut,
            value,
            instructions
        );
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

    function _orderPayout(
        address orderer,
        string memory operationId,
        address walletToBePaidOut,
        uint256 value,
        string memory instructions
    ) internal returns (bool)
    {
        OrderedPayout storage newPayout = orderedPayouts[operationId.toHash()];

        require(!instructions.isEmpty(), "Instructions must not be empty");

        return _hold(
            operationId,
            orderer,
            walletToBePaidOut,
            address(0),
            payoutAgent,
            value,
            0
        );
    }
}
