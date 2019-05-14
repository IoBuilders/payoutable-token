pragma solidity ^0.5.0;

interface Payoutable {

    enum PayoutStatusCode { Nonexistent, Ordered, InProcess, FundsInSuspense, Executed, Rejected, Cancelled}

    function authorizePayoutOperator(address orderer) external returns (bool);
    function revokePayoutOperator(address orderer) external returns (bool);
    function orderPayout(string calldata operationId, uint256 value, string calldata instructions) external returns (bool);
    function orderPayoutFrom(string calldata operationId, address walletToBePaidOut, uint256 value, string calldata instructions) external returns (bool);
    function cancelPayout(string calldata operationId) external returns (bool);
    function processPayout(address orderer, string calldata operationId) external returns (bool);
    function putFundsInSuspenseInPayout(address orderer, string calldata operationId) external returns (bool);
    function executePayout(address orderer, string calldata operationId) external returns (bool);
    function rejectPayout(address orderer, string calldata operationId, string calldata reason) external returns (bool);
    function isPayoutOperatorFor(address walletToDebit, address orderer) external view returns (bool);
    function retrievePayoutData(address orderer, string calldata operationId) external view returns (address walletToDebit, uint256 value, string memory instructions, PayoutStatusCode status);


    event PayoutOrdered(address indexed orderer, string indexed operationId, address indexed walletToDebit, uint256 value, string instructions);
    event PayoutInProcess(address indexed orderer, string indexed operationId);
    event PayoutFundsInSuspense(address indexed orderer, string indexed operationId);
    event PayoutExecuted(address indexed orderer, string indexed operationId);
    event PayoutRejected(address indexed orderer, string indexed operationId, string reason);
    event PayoutCancelled(address indexed orderer, string indexed operationId);
    event PayoutOperatorAuthorized(address indexed walletToBePaidOut, address indexed orderer);
    event PayoutOperatorRevoked(address indexed walletToBePaidOut, address indexed orderer);
}
