pragma solidity ^0.5.0;

import "./IPayoutable.sol";
import "eip1996/contracts/Holdable.sol";


contract Payoutable is IPayoutable, Holdable {

    struct OrderedPayout {
        string instructions;
        PayoutStatusCode status;
    }

    mapping(bytes32 => OrderedPayout) private orderedPayouts;
    mapping(address => mapping(address => bool)) private payoutOperators;
    address public payoutAgent;
    address public suspenseAccount;

    constructor(address _suspenseAccount) public {
        require(_suspenseAccount != address(0), "Suspense account must not be the zero address");
        suspenseAccount = _suspenseAccount;

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
        bytes32 operationIdHash = operationId.toHash();

        OrderedPayout storage cancelablePayout = orderedPayouts[operationIdHash];
        Hold storage cancelableHold = holds[operationIdHash];

        require(cancelablePayout.status == PayoutStatusCode.Ordered, "A payout can only be cancelled in status Ordered");
        require(
            msg.sender == cancelableHold.issuer || msg.sender == cancelableHold.origin,
            "A payout can only be cancelled by the orderer or the walletToBePaidOut"
        );

        _releaseHold(operationId);

        cancelablePayout.status = PayoutStatusCode.Cancelled;

        emit PayoutCancelled(
            cancelableHold.issuer,
            operationId
        );

        return true;
    }

    function processPayout(string calldata operationId) external returns (bool) {
        revert("Function not supported in this implementation");
    }

    function putFundsInSuspenseInPayout(string calldata operationId) external returns (bool) {
        revert("Function not supported in this implementation");
    }

    function transferPayoutToSuspenseAccount(string calldata operationId) external returns (bool) {
        bytes32 operationIdHash = operationId.toHash();

        OrderedPayout storage inSuspensePayout = orderedPayouts[operationIdHash];

        require(inSuspensePayout.status == PayoutStatusCode.Ordered, "A payout can only be set to FundsInSuspense from status Ordered");
        require(msg.sender == payoutAgent, "A payout can only be set to in suspense by the payout agent");

        Hold storage inSuspenseHold = holds[operationIdHash];

        super._setHoldToExecuted(operationId, inSuspenseHold.value);
        super._transfer(inSuspenseHold.origin, inSuspenseHold.target, inSuspenseHold.value);

        inSuspensePayout.status = PayoutStatusCode.FundsInSuspense;

        emit PayoutFundsInSuspense(
            inSuspenseHold.issuer,
            operationId
        );

        return true;
    }

    function executePayout(string calldata operationId) external returns (bool) {
        bytes32 operationIdHash = operationId.toHash();

        OrderedPayout storage executedPayout = orderedPayouts[operationIdHash];

        require(executedPayout.status == PayoutStatusCode.FundsInSuspense, "A payout can only be executed from status FundsInSuspense");
        require(msg.sender == payoutAgent, "A payout can only be executed by the payout agent");

        Hold storage executedHold = holds[operationIdHash];

        _burn(executedHold.target, executedHold.value);

        executedPayout.status = PayoutStatusCode.Executed;

        emit PayoutExecuted(
            executedHold.issuer,
            operationId
        );

        return true;
    }

    function rejectPayout(string calldata operationId, string calldata reason) external returns (bool) {
        bytes32 operationIdHash = operationId.toHash();

        OrderedPayout storage rejectedPayout = orderedPayouts[operationIdHash];

        require(rejectedPayout.status == PayoutStatusCode.Ordered, "A payout can only be rejected from status Ordered");
        require(msg.sender == payoutAgent, "A payout can only be rejected by the payout agent");

        Hold storage rejectedHold = holds[operationIdHash];

        _releaseHold(operationId);

        rejectedPayout.status = PayoutStatusCode.Rejected;

        emit PayoutRejected(
            rejectedHold.issuer,
            operationId,
            reason
        );

        return true;
    }

    function retrievePayoutData(string calldata operationId) external view returns (
        address walletToDebit,
        uint256 value,
        string memory instructions,
        PayoutStatusCode status
    )
    {
        bytes32 operationIdHash = operationId.toHash();

        OrderedPayout storage retrievedPayout = orderedPayouts[operationIdHash];
        Hold storage retrievedHold = holds[operationIdHash];

        return (
            retrievedHold.origin,
            retrievedHold.value,
            retrievedPayout.instructions,
            retrievedPayout.status
        );
    }

    function isPayoutOperatorFor(address operator, address from) external view returns (bool) {
        return payoutOperators[from][operator];
    }

    function authorizePayoutOperator(address operator) external returns (bool) {
        require(payoutOperators[msg.sender][operator] == false, "The operator is already authorized");

        payoutOperators[msg.sender][operator] = true;
        emit AuthorizedPayoutOperator(operator, msg.sender);
        return true;
    }

    function revokePayoutOperator(address operator) external returns (bool) {
        require(payoutOperators[msg.sender][operator], "The operator is already not authorized");

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

        newPayout.instructions = instructions;
        newPayout.status = PayoutStatusCode.Ordered;

        return _hold(
            operationId,
            orderer,
            walletToBePaidOut,
            suspenseAccount,
            payoutAgent,
            value,
            0
        );
    }
}
